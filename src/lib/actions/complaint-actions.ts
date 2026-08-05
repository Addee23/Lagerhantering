"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkStaffPin, redirectWithPinError } from "@/lib/pin-verification";
import { sendEmail } from "@/lib/email";
import { generateComplaintEmailDraft } from "@/lib/ai/generate-complaint-email";
import { ISSUE_TYPE_LABELS } from "@/lib/issue-labels";

function path(complaintId: number): string {
  return `/complaints/${complaintId}`;
}

async function loadComplaintForDraft(complaintId: number) {
  return prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      delivery: true,
      supplier: true,
      items: {
        include: {
          deliveryIssue: {
            include: { deliveryItem: { include: { product: true } }, images: true },
          },
        },
      },
      emails: { orderBy: { createdAt: "desc" } },
    },
  });
}

function defaultSubject(complaintNumber: string, orderNumber: string | null, invoiceNumber: string | null): string {
  if (invoiceNumber) return `Reklamation ${complaintNumber} - Faktura ${invoiceNumber}`;
  if (orderNumber) return `Reklamation ${complaintNumber} - Order ${orderNumber}`;
  return `Reklamation ${complaintNumber}`;
}

// skills/complaint-and-email-rules.md: personalen kan skriva mejlet helt
// manuellt istället för att be AI:n om ett förslag.
export async function createManualComplaintEmailDraftAction(complaintId: number): Promise<void> {
  const complaint = await loadComplaintForDraft(complaintId);
  if (!complaint) return;
  if (complaint.emails.some((e) => !e.sentAt)) {
    redirect(path(complaintId));
  }

  await prisma.complaintEmail.create({
    data: {
      complaintId,
      toAddress: complaint.supplier.complaintEmail ?? "",
      ccAddress: complaint.supplier.ccRecipient,
      subject: defaultSubject(complaint.complaintNumber, complaint.delivery.orderNumber, complaint.delivery.invoiceNumber),
      body: "",
      aiGenerated: false,
    },
  });

  revalidatePath(path(complaintId));
  redirect(path(complaintId));
}

// skills/complaint-and-email-rules.md: AI:n skapar ett utkast utifrån
// avvikelserna - den skickar ALDRIG mejlet själv (se sendComplaintEmailAction).
export async function generateComplaintEmailDraftAction(complaintId: number): Promise<void> {
  const complaint = await loadComplaintForDraft(complaintId);
  if (!complaint) return;

  let draft: { subject: string; body: string };
  try {
    draft = await generateComplaintEmailDraft({
      complaintNumber: complaint.complaintNumber,
      supplierName: complaint.supplier.name,
      deliveryDate: complaint.delivery.deliveryDate?.toISOString().slice(0, 10) ?? null,
      orderNumber: complaint.delivery.orderNumber,
      invoiceNumber: complaint.delivery.invoiceNumber,
      issues: complaint.items.map((item) => ({
        productName:
          item.deliveryIssue.deliveryItem.product?.name ??
          item.deliveryIssue.deliveryItem.rawProductName ??
          "Okänd produkt",
        type: ISSUE_TYPE_LABELS[item.deliveryIssue.type] ?? item.deliveryIssue.type,
        comment: item.deliveryIssue.comment,
        damagedQuantity: item.deliveryIssue.damagedQuantity,
        discarded: item.deliveryIssue.discarded,
        wantedAction: item.deliveryIssue.wantedAction,
      })),
    });
  } catch (err) {
    redirect(`${path(complaintId)}?error=${encodeURIComponent((err as Error).message)}`);
  }

  const existingDraft = complaint.emails.find((e) => !e.sentAt);
  if (existingDraft) {
    await prisma.complaintEmail.update({
      where: { id: existingDraft.id },
      data: { subject: draft.subject, body: draft.body, aiGenerated: true },
    });
  } else {
    await prisma.complaintEmail.create({
      data: {
        complaintId,
        toAddress: complaint.supplier.complaintEmail ?? "",
        ccAddress: complaint.supplier.ccRecipient,
        subject: draft.subject,
        body: draft.body,
        aiGenerated: true,
      },
    });
  }

  revalidatePath(path(complaintId));
  redirect(path(complaintId));
}

export async function updateComplaintEmailDraftAction(
  complaintId: number,
  emailId: number,
  formData: FormData,
): Promise<void> {
  const toAddress = String(formData.get("toAddress") ?? "").trim();
  const ccAddress = String(formData.get("ccAddress") ?? "").trim() || null;
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  if (!toAddress || !subject) return;

  await prisma.complaintEmail.updateMany({
    where: { id: emailId, complaintId, sentAt: null },
    data: { toAddress, ccAddress, subject, body },
  });

  revalidatePath(path(complaintId));
  redirect(path(complaintId));
}

export async function deleteComplaintEmailDraftAction(complaintId: number, emailId: number): Promise<void> {
  await prisma.complaintEmail.deleteMany({ where: { id: emailId, complaintId, sentAt: null } });
  revalidatePath(path(complaintId));
  redirect(path(complaintId));
}

// skills/business-rules.md, punkt 12: reklamationsmejl skickas ENDAST efter
// mänsklig granskning + PIN-bekräftelse. skills/complaint-and-email-rules.md:
// leverantören måste ha en registrerad reklamationsadress, annars blockeras
// sändning helt (oavsett vad som råkar stå ifyllt i "Till"-fältet just nu).
export async function sendComplaintEmailAction(
  complaintId: number,
  emailId: number,
  formData: FormData,
): Promise<void> {
  const staffMemberId = Number(formData.get("staffMemberId"));
  const pin = String(formData.get("pin") ?? "");
  const toAddress = String(formData.get("toAddress") ?? "").trim();
  const ccAddress = String(formData.get("ccAddress") ?? "").trim() || null;
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const p = path(complaintId);

  if (!toAddress || !subject) return;

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      supplier: true,
      items: { include: { deliveryIssue: { include: { images: true } } } },
      emails: { where: { id: emailId }, take: 1 },
    },
  });
  // Ett nytt utkast kan skapas och skickas som uppföljning även efter första
  // mejlet (t.ex. vid "Behöver kompletteras") - bara avslutade/avbrutna
  // ärenden är helt stängda för nya mejl.
  if (!complaint || complaint.status === "AVSLUTAD" || complaint.status === "AVBRUTEN") return;

  // Skyddar mot dubbelskick (t.ex. dubbelklick eller en nätverksretry): om
  // just det här utkastet redan är skickat (av en tidigare request) ska vi
  // inte skicka ett riktigt mejl till leverantören en gång till.
  const email = complaint.emails[0];
  if (!email || email.sentAt) return;

  if (!complaint.supplier.complaintEmail) {
    redirect(`${p}?error=leverantor-saknar-reklamationsadress`);
  }

  const pinResult = await checkStaffPin(staffMemberId, pin);
  if (!pinResult.ok) {
    redirectWithPinError(p, pinResult);
  }

  const damageImages = complaint.items.flatMap((item) => item.deliveryIssue.images);

  let sendError: string | null = null;
  let messageId: string | null = null;
  try {
    const result = await sendEmail({
      to: toAddress,
      cc: ccAddress,
      subject,
      text: body,
      attachments: damageImages.map((img) => ({
        filename: img.filePath.split("/").pop() ?? "bilaga.jpg",
        filePath: img.filePath,
      })),
    });
    messageId = result.messageId;
  } catch (err) {
    sendError = (err as Error).message;
  }

  if (sendError) {
    redirect(`${p}?error=${encodeURIComponent(sendError)}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaintEmail.update({
      where: { id: emailId },
      data: {
        toAddress,
        ccAddress,
        subject,
        body,
        sentAt: new Date(),
        sentByStaffMemberId: staffMemberId,
        messageId,
        attachments: {
          create: damageImages.map((img) => ({
            filePath: img.filePath,
            fileName: img.filePath.split("/").pop() ?? "bilaga.jpg",
          })),
        },
      },
    });

    // Bara ett förstagångsutkast (UTKAST) flyttar status till SKICKAD - en
    // uppföljningsmejl på ett ärende som redan har en egen status (t.ex.
    // "Behöver kompletteras") rör inte den statusen automatiskt.
    if (complaint.status === "UTKAST") {
      await tx.complaint.update({ where: { id: complaintId }, data: { status: "SKICKAD" } });
    }

    await tx.activityLog.create({
      data: {
        eventType: "complaint_sent",
        description: `Skickade reklamation ${complaint.complaintNumber} till "${complaint.supplier.name}" (${toAddress}).`,
        staffMemberId,
        complaintId,
      },
    });
  });

  revalidatePath(p);
  revalidatePath("/complaints");
  redirect(p);
}

const VALID_STATUSES = [
  "VANTAR_PA_SVAR",
  "KREDITERAD",
  "ERSATT",
  "BEHOVER_KOMPLETTERAS",
  "AVVISAD_AV_LEVERANTOR",
  "AVSLUTAD",
  "AVBRUTEN",
] as const;

// Så länge IMAP-inläsningen (Fas 10) inte finns uppdaterar personalen status
// manuellt efter att ha pratat med leverantören per telefon/mejl.
export async function updateComplaintStatusAction(complaintId: number, formData: FormData): Promise<void> {
  const status = String(formData.get("status") ?? "");
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) return;

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint || complaint.status === "UTKAST") return;

  await prisma.$transaction([
    prisma.complaint.update({
      where: { id: complaintId },
      data: { status: status as (typeof VALID_STATUSES)[number] },
    }),
    prisma.activityLog.create({
      data: {
        eventType: "complaint_status_changed",
        description: `Uppdaterade status för reklamation ${complaint.complaintNumber} till "${status}".`,
        previousValue: complaint.status,
        newValue: status,
        complaintId,
      },
    }),
  ]);

  revalidatePath(path(complaintId));
  revalidatePath("/complaints");
}
