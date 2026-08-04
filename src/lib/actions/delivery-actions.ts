"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkStaffPin, redirectWithPinError } from "@/lib/pin-verification";
import { saveUploadedFile } from "@/lib/file-upload";
import { DeliveryIssueType } from "@/generated/prisma/client";

const DEFAULT_SHORT_EXPIRY_DAYS = 90;

function textOrNull(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str || null;
}

export async function createDeliveryAction(formData: FormData): Promise<void> {
  const supplierId = Number(formData.get("supplierId"));
  if (!supplierId) return;

  const deliveryDateRaw = String(formData.get("deliveryDate") ?? "").trim();

  const delivery = await prisma.delivery.create({
    data: {
      supplierId,
      deliveryDate: deliveryDateRaw ? new Date(deliveryDateRaw) : null,
      orderNumber: textOrNull(formData.get("orderNumber")),
      invoiceNumber: textOrNull(formData.get("invoiceNumber")),
      comment: textOrNull(formData.get("comment")),
    },
  });

  redirect(`/deliveries/${delivery.id}`);
}

export async function uploadDeliveryDocumentAction(
  deliveryId: number,
  formData: FormData,
): Promise<void> {
  const file = formData.get("file") as File | null;
  const path = `/deliveries/${deliveryId}`;

  let filePath: string | null;
  try {
    filePath = await saveUploadedFile(file, "delivery-documents");
  } catch (err) {
    redirect(`${path}?error=${encodeURIComponent((err as Error).message)}`);
  }
  if (!filePath || !file) return;

  await prisma.deliveryDocument.create({
    data: { deliveryId, filePath, fileName: file.name },
  });

  revalidatePath(path);
}

export async function addDeliveryItemAction(deliveryId: number, formData: FormData): Promise<void> {
  const productId = Number(formData.get("productId"));
  const documentedQuantity = Number(formData.get("documentedQuantity"));
  const receivedQuantityRaw = String(formData.get("receivedQuantity") ?? "").trim();
  const expiryDateRaw = String(formData.get("expiryDate") ?? "").trim();

  if (!productId || !documentedQuantity || documentedQuantity <= 0) return;

  await prisma.deliveryItem.create({
    data: {
      deliveryId,
      productId,
      documentedQuantity,
      receivedQuantity: receivedQuantityRaw ? Number(receivedQuantityRaw) : documentedQuantity,
      expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
    },
  });

  revalidatePath(`/deliveries/${deliveryId}`);
}

export async function markItemConfirmedOkAction(
  deliveryId: number,
  itemId: number,
): Promise<void> {
  await prisma.deliveryItem.update({ where: { id: itemId }, data: { confirmedOk: true } });
  revalidatePath(`/deliveries/${deliveryId}`);
}

// skills/testing-and-phase-approval.md via projektplan 13.1: "Markera alla
// rader utan avvikelse som klara."
export async function markAllOkAction(deliveryId: number): Promise<void> {
  const items = await prisma.deliveryItem.findMany({
    where: { deliveryId },
    include: { issues: true },
  });

  // Rader utan produktkoppling (AI-tolkade, ej matchade/bekräftade) räknas
  // inte som klara även om de saknar avvikelser - de måste kopplas först.
  const idsWithoutIssues = items
    .filter((item) => item.issues.length === 0 && item.productId != null)
    .map((item) => item.id);

  await prisma.deliveryItem.updateMany({
    where: { id: { in: idsWithoutIssues } },
    data: { confirmedOk: true },
  });

  revalidatePath(`/deliveries/${deliveryId}`);
}

export async function addDeliveryIssueAction(
  deliveryId: number,
  itemId: number,
  formData: FormData,
): Promise<void> {
  const type = String(formData.get("type") ?? "");
  const comment = textOrNull(formData.get("comment"));
  const path = `/deliveries/${deliveryId}`;

  if (!type) return;

  if (!(type in DeliveryIssueType)) return;

  const isDamaged = type === "SKADAD";
  const damagedQuantityRaw = String(formData.get("damagedQuantity") ?? "").trim();

  const issue = await prisma.deliveryIssue.create({
    data: {
      deliveryItemId: itemId,
      type: type as DeliveryIssueType,
      comment,
      damagedQuantity: isDamaged && damagedQuantityRaw ? Number(damagedQuantityRaw) : null,
      discarded: isDamaged ? formData.get("discarded") === "true" : null,
      wantedAction: isDamaged ? textOrNull(formData.get("wantedAction")) : null,
    },
  });

  // En rad med avvikelse räknas inte längre som "klar".
  await prisma.deliveryItem.update({ where: { id: itemId }, data: { confirmedOk: false } });

  if (isDamaged) {
    const file = formData.get("image") as File | null;
    try {
      const filePath = await saveUploadedFile(file, "damage-images");
      if (filePath) {
        await prisma.damageImage.create({ data: { deliveryIssueId: issue.id, filePath } });
      }
    } catch (err) {
      // Avvikelsen är redan sparad - bara bilden misslyckades. Visa felet men
      // förlora inte det som faktiskt gick igenom.
      redirect(`${path}?error=${encodeURIComponent((err as Error).message)}`);
    }
  }

  revalidatePath(path);
}

// skills/expiry-rules.md, 15.2: fyra val vid kort bäst före-datum.
// "Acceptera" kräver PIN och loggas.
export async function resolveShortExpiryAction(
  deliveryId: number,
  itemId: number,
  formData: FormData,
): Promise<void> {
  const decision = String(formData.get("decision") ?? "");
  const path = `/deliveries/${deliveryId}`;
  if (!decision) return;

  if (decision === "accepterad") {
    const staffMemberId = Number(formData.get("staffMemberId"));
    const pin = String(formData.get("pin") ?? "");
    const pinResult = await checkStaffPin(staffMemberId, pin);
    if (!pinResult.ok) {
      redirectWithPinError(path, pinResult);
    }

    const comment = textOrNull(formData.get("comment"));
    const item = await prisma.deliveryItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });
    const productLabel = item?.product?.name ?? item?.rawProductName ?? "okänd produkt";

    await prisma.$transaction([
      prisma.deliveryItem.update({
        where: { id: itemId },
        // Ett aktivt, medvetet beslut om raden - räkna den som klar utan att
        // kräva ett separat "Markera rad som klar"-klick också.
        data: { shortExpiryHandled: true, shortExpiryDecision: decision, confirmedOk: true },
      }),
      prisma.activityLog.create({
        data: {
          eventType: "short_expiry_accepted",
          description: `Accepterade kort bäst före-datum för "${productLabel}" i leverans #${deliveryId}.`,
          reason: comment ?? undefined,
          staffMemberId,
        },
      }),
    ]);
  } else if (decision === "reklamation") {
    await prisma.$transaction(async (tx) => {
      await tx.deliveryItem.update({
        where: { id: itemId },
        data: { shortExpiryHandled: true, shortExpiryDecision: decision, confirmedOk: false },
      });
      await tx.deliveryIssue.create({
        data: {
          deliveryItemId: itemId,
          type: "KORT_BAST_FORE",
          comment: "Kort bäst före-datum - läggs till i reklamationen.",
        },
      });
    });
  } else {
    // "kontrollera_senare" eller "ej_relevant" - även dessa är ett medvetet
    // beslut, så raden räknas som klar (kräver inget extra klick till).
    await prisma.deliveryItem.update({
      where: { id: itemId },
      data: { shortExpiryHandled: true, shortExpiryDecision: decision, confirmedOk: true },
    });
  }

  revalidatePath(path);
}

// skills/delivery-and-ai-rules.md: godkännande-gate + lageruppdatering
// sker ENDAST vid godkännande, aldrig innan.
export async function approveDeliveryAction(deliveryId: number, formData: FormData): Promise<void> {
  const staffMemberId = Number(formData.get("staffMemberId"));
  const pin = String(formData.get("pin") ?? "");
  const path = `/deliveries/${deliveryId}`;

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { items: { include: { issues: true } }, supplier: true },
  });
  if (!delivery || delivery.status === "GODKAND") return;

  if (delivery.items.length === 0) {
    redirect(`${path}?error=${encodeURIComponent("Leveransen har inga rader att godkänna.")}`);
  }
  if (!delivery.supplierId) {
    redirect(`${path}?error=leverantor-saknas`);
  }
  // Narrowad lokal konstant - `delivery.supplierId` som en fältaccess på ett
  // fångat objekt hade inte hållit kvar TypeScripts null-koll inuti
  // transaktionsstängningen längre ner.
  const supplierId = delivery.supplierId;

  const threshold = delivery.supplier?.defaultShortExpiryDays ?? DEFAULT_SHORT_EXPIRY_DAYS;
  const now = Date.now();

  for (const item of delivery.items) {
    // skills, 16: "Alla okopplade produkter har hanterats" - en AI-tolkad
    // rad utan produkt kan aldrig godkännas som den är.
    if (!item.productId) {
      redirect(`${path}?error=produkt-ej-kopplad`);
    }
    const isHandled = item.confirmedOk || item.issues.length > 0;
    if (!isHandled) {
      redirect(`${path}?error=obehandlade-rader`);
    }
    if (item.receivedQuantity == null) {
      redirect(`${path}?error=mottaget-antal-saknas`);
    }
    const isShort =
      item.expiryDate != null &&
      (item.expiryDate.getTime() - now) / (1000 * 60 * 60 * 24) < threshold;
    if (isShort && !item.shortExpiryHandled) {
      redirect(`${path}?error=bast-fore-ej-hanterat`);
    }
  }

  const pinResult = await checkStaffPin(staffMemberId, pin);
  if (!pinResult.ok) {
    redirectWithPinError(path, pinResult);
  }

  await prisma.$transaction(async (tx) => {
    for (const item of delivery.items) {
      // Gate-kontrollen ovan garanterar redan att alla rader har en produkt,
      // men vi kollar igen här som ett skyddsnät (och för TypeScript).
      if (!item.productId) continue;

      const quantity = item.receivedQuantity ?? 0;
      if (quantity > 0) {
        const batch = await tx.stockBatch.create({
          data: {
            productId: item.productId,
            quantity,
            expiryDate: item.expiryDate,
            note: `Inleverans #${deliveryId}`,
          },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            stockBatchId: batch.id,
            changeType: "mottagen",
            quantityDelta: quantity,
            reason: `Inleverans #${deliveryId}`,
            staffMemberId,
          },
        });
      }
    }

    await tx.delivery.update({
      where: { id: deliveryId },
      data: { status: "GODKAND", approvedAt: new Date(), approvedByStaffMemberId: staffMemberId },
    });

    const itemsWithIssues = delivery.items.filter((item) => item.issues.length > 0);

    // skills/complaint-and-email-rules.md: reklamationsutkastet skapas
    // AUTOMATISKT när en godkänd leverans har avvikelser - en ComplaintItem
    // per DeliveryIssue. Bara ett utkast: inget mejl skickas här, det görs
    // separat efter mänsklig granskning + PIN (Fas 9).
    let complaintNumber: string | null = null;
    if (itemsWithIssues.length > 0) {
      const year = new Date().getFullYear();
      const countThisYear = await tx.complaint.count({
        where: { complaintNumber: { startsWith: `REK-${year}-` } },
      });
      complaintNumber = `REK-${year}-${String(countThisYear + 1).padStart(4, "0")}`;

      await tx.complaint.create({
        data: {
          complaintNumber,
          deliveryId,
          supplierId,
          items: {
            create: itemsWithIssues.flatMap((item) =>
              item.issues.map((issue) => ({ deliveryIssueId: issue.id })),
            ),
          },
        },
      });
    }

    await tx.activityLog.create({
      data: {
        eventType: "delivery_approved",
        description: `Godkände leverans #${deliveryId} från "${delivery.supplier?.name ?? delivery.rawSupplierName ?? "okänd leverantör"}" (${
          delivery.items.length
        } rader${
          complaintNumber ? `, ${itemsWithIssues.length} med avvikelse - reklamation ${complaintNumber} skapad` : ""
        }).`,
        staffMemberId,
      },
    });
  });

  revalidatePath(path);
  revalidatePath("/deliveries");
  revalidatePath("/warehouse");
  revalidatePath("/complaints");
  redirect(path);
}
