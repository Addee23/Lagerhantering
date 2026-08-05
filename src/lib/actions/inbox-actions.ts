"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchIncomingEmails, type IncomingEmail } from "@/lib/imap";

const REK_NUMBER_REGEX = /REK-\d{4}-\d{4}/;
const OPEN_STATUSES_EXCLUDED = ["AVSLUTAD", "AVBRUTEN"] as const;

// Vår egen adress, för visning på ett inkommande mejl (vi TOG emot det på
// den här adressen). Samma konto som SMTP om inget separat IMAP-konto anges.
function incomingToAddress(): string {
  return process.env.SMTP_USER ?? process.env.IMAP_USER ?? "";
}

// skills/complaint-and-email-rules.md: matchning mot rätt ärende i den här
// prioritetsordningen. Returnerar null om inget säkert kan avgöras - mejlet
// hamnar då i "Ej kopplade mejl" istället för att gissa fel.
async function matchComplaint(email: IncomingEmail): Promise<number | null> {
  // 1. Mejlets tråd-/meddelandeidentifierare - ett svar på ett mejl VI skickat.
  if (email.inReplyTo) {
    const threadMatch = await prisma.complaintEmail.findUnique({
      where: { messageId: email.inReplyTo },
      select: { complaintId: true },
    });
    if (threadMatch) return threadMatch.complaintId;
  }

  // 2. Reklamationsnumret i ämnesraden.
  const rekMatch = email.subject.match(REK_NUMBER_REGEX);
  if (rekMatch) {
    const byNumber = await prisma.complaint.findUnique({
      where: { complaintNumber: rekMatch[0] },
      select: { id: true },
    });
    if (byNumber) return byNumber.id;
  }

  // Hämtas en gång och återanvänds för steg 3 och 4 - bara öppna ärenden är
  // rimliga mål för ett nytt svar.
  const openComplaints = await prisma.complaint.findMany({
    where: { status: { notIn: [...OPEN_STATUSES_EXCLUDED] } },
    include: {
      delivery: { select: { orderNumber: true, invoiceNumber: true } },
      supplier: { select: { complaintEmail: true, generalEmail: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Faktura- eller ordernummer (i ämne eller text). Kräver minst 4 tecken
  // - annars hade t.ex. ett ordernummer som "12" kunnat matcha nästan vilket
  // mejl som helst som råkar innehålla siffrorna någonstans (samma typ av
  // svagt substrings-fel som produktnamnsmatchningen i Fas 6 hade).
  const haystack = `${email.subject}\n${email.text}`;
  const isUsableReference = (value: string | null) => Boolean(value && value.length >= 4 && haystack.includes(value));
  const byReference = openComplaints.find(
    (c) => isUsableReference(c.delivery.invoiceNumber) || isUsableReference(c.delivery.orderNumber),
  );
  if (byReference) return byReference.id;

  // 4. Leverantörens e-postadress - senast skapade öppna ärendet för den
  // leverantören (kan inte veta exakt vilket om flera är öppna samtidigt).
  // Jämförs skiftlägesokänsligt - mejladresser är i praktiken det, och en
  // leverantör som svarar från "Info@Foretag.se" ska ändå matcha en sparad
  // "info@foretag.se".
  const fromAddressLower = email.fromAddress.toLowerCase();
  const bySupplierAddress = openComplaints.find(
    (c) =>
      c.supplier.complaintEmail?.toLowerCase() === fromAddressLower ||
      c.supplier.generalEmail?.toLowerCase() === fromAddressLower,
  );
  if (bySupplierAddress) return bySupplierAddress.id;

  // 5. Manuell koppling - se linkUnmatchedEmailAction.
  return null;
}

// Manuellt triggad hämtning (ingen bakgrundsjobb-infrastruktur i det här
// projektet) - personalen klickar "Hämta nya mejl" på /inbox.
export async function checkInboxAction(): Promise<void> {
  let emails: IncomingEmail[];
  try {
    emails = await fetchIncomingEmails();
  } catch (err) {
    redirect(`/inbox?error=${encodeURIComponent((err as Error).message)}`);
  }

  for (const email of emails) {
    // Varje mejl hanteras för sig - ett enskilt trasigt/dubbelimporterat
    // mejl (t.ex. en unique-krock om "Hämta nya mejl" dubbelklickas och två
    // körningar hinner passera dedup-kollen för samma meddelande innan
    // någon av dem hunnit spara det) ska inte krascha resten av hämtningen.
    try {
      // Dedup mot tidigare importer - annars skulle samma svar kunna läggas
      // in flera gånger varje gång man klickar "Hämta nya mejl".
      const [existingEmail, existingUnmatched] = await Promise.all([
        prisma.complaintEmail.findUnique({ where: { messageId: email.messageId } }),
        prisma.unmatchedEmail.findUnique({ where: { messageId: email.messageId } }),
      ]);
      if (existingEmail || existingUnmatched) continue;

      const complaintId = await matchComplaint(email);

      if (complaintId) {
        await prisma.$transaction(async (tx) => {
          await tx.complaintEmail.create({
            data: {
              complaintId,
              direction: "inkommande",
              toAddress: incomingToAddress(),
              subject: email.subject,
              body: email.text,
              sentAt: email.receivedAt,
              messageId: email.messageId,
              inReplyTo: email.inReplyTo,
            },
          });

          const complaint = await tx.complaint.findUnique({ where: { id: complaintId } });
          if (complaint && !OPEN_STATUSES_EXCLUDED.includes(complaint.status as (typeof OPEN_STATUSES_EXCLUDED)[number])) {
            await tx.complaint.update({ where: { id: complaintId }, data: { status: "VANTAR_PA_SVAR" } });
          }

          await tx.activityLog.create({
            data: {
              eventType: "complaint_reply_received",
              description: `Mottog svar på reklamation ${complaint?.complaintNumber ?? complaintId} från ${email.fromAddress}.`,
              complaintId,
            },
          });
        });
      } else {
        await prisma.unmatchedEmail.create({
          data: {
            messageId: email.messageId,
            fromAddress: email.fromAddress,
            subject: email.subject,
            body: email.text,
            receivedAt: email.receivedAt,
          },
        });
      }
    } catch (err) {
      console.error(`Kunde inte importera mejl "${email.messageId}":`, err);
    }
  }

  revalidatePath("/inbox");
  revalidatePath("/complaints");
  redirect("/inbox");
}

// skills/complaint-and-email-rules.md: personalen kan koppla ett omatchat
// mejl manuellt till rätt ärende.
export async function linkUnmatchedEmailAction(unmatchedEmailId: number, formData: FormData): Promise<void> {
  const complaintId = Number(formData.get("complaintId"));
  if (!complaintId) return;

  const unmatched = await prisma.unmatchedEmail.findUnique({ where: { id: unmatchedEmailId } });
  if (!unmatched || unmatched.status !== "OMATCHAD") return;

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
  if (!complaint) return;

  await prisma.$transaction(async (tx) => {
    await tx.complaintEmail.create({
      data: {
        complaintId,
        direction: "inkommande",
        toAddress: incomingToAddress(),
        subject: unmatched.subject,
        body: unmatched.body,
        sentAt: unmatched.receivedAt,
        messageId: unmatched.messageId,
      },
    });

    await tx.unmatchedEmail.update({
      where: { id: unmatchedEmailId },
      data: { status: "KOPPLAD", linkedComplaintId: complaintId },
    });

    if (!OPEN_STATUSES_EXCLUDED.includes(complaint.status as (typeof OPEN_STATUSES_EXCLUDED)[number])) {
      await tx.complaint.update({ where: { id: complaintId }, data: { status: "VANTAR_PA_SVAR" } });
    }

    await tx.activityLog.create({
      data: {
        eventType: "complaint_reply_linked",
        description: `Kopplade mejl från ${unmatched.fromAddress} manuellt till reklamation ${complaint.complaintNumber}.`,
        complaintId,
      },
    });
  });

  revalidatePath("/inbox");
  revalidatePath(`/complaints/${complaintId}`);
  revalidatePath("/complaints");
}

export async function markUnmatchedEmailIrrelevantAction(unmatchedEmailId: number): Promise<void> {
  await prisma.unmatchedEmail.updateMany({
    where: { id: unmatchedEmailId, status: "OMATCHAD" },
    data: { status: "IRRELEVANT" },
  });
  revalidatePath("/inbox");
}
