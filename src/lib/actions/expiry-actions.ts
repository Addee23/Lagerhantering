"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkStaffPin, redirectWithPinError } from "@/lib/pin-verification";

const PATH = "/expiry";

// skills/expiry-rules.md: personalen kan öppna en post och trycka Uppdatera
// antal / Kontrollerad / Slut / Flyttad / Kasserad / Utgången. De två första
// håller posten aktiv, resten avslutar den (försvinner från aktiva listan,
// sparas i historiken - raderas aldrig).
export async function resolveExpiryRecordAction(
  recordId: number,
  formData: FormData,
): Promise<void> {
  const decision = String(formData.get("decision") ?? "");
  if (!decision) return;

  const record = await prisma.expiryRecord.findUnique({
    where: { id: recordId },
    include: { product: true },
  });
  if (!record || record.status !== "AKTIV") return;

  if (decision === "uppdatera_antal") {
    const quantityRemaining = Number(formData.get("quantityRemaining"));
    if (!Number.isFinite(quantityRemaining) || quantityRemaining < 0) return;

    await prisma.expiryRecord.update({
      where: { id: recordId },
      data: { quantityRemaining },
    });
    revalidatePath(PATH);
    return;
  }

  if (decision === "kontrollerad") {
    await prisma.expiryRecord.update({
      where: { id: recordId },
      data: { lastCheckedAt: new Date() },
    });
    revalidatePath(PATH);
    return;
  }

  if (decision === "slut" || decision === "flyttad") {
    const comment = String(formData.get("comment") ?? "").trim() || null;

    await prisma.$transaction([
      prisma.expiryRecord.update({
        where: { id: recordId },
        data: { status: "AVSLUTAD", resolution: decision, resolvedAt: new Date(), comment },
      }),
      prisma.activityLog.create({
        data: {
          eventType: "expiry_record_resolved",
          description: `Markerade bäst före-post för "${record.product.name}" som ${
            decision === "slut" ? "slut" : "flyttad"
          }.`,
          reason: comment ?? undefined,
        },
      }),
    ]);
    revalidatePath(PATH);
    return;
  }

  if (decision === "kasserad" || decision === "utgangen") {
    // skills/expiry-rules.md: kassation (inkl. hantering av en utgången post)
    // kräver alltid PIN.
    const staffMemberId = Number(formData.get("staffMemberId"));
    const pin = String(formData.get("pin") ?? "");
    const pinResult = await checkStaffPin(staffMemberId, pin);
    if (!pinResult.ok) {
      redirectWithPinError(PATH, pinResult);
    }

    const discardedQuantity = Number(formData.get("discardedQuantity"));
    if (!Number.isFinite(discardedQuantity) || discardedQuantity <= 0) return;
    const comment = String(formData.get("comment") ?? "").trim() || null;

    await prisma.$transaction([
      prisma.expiryRecord.update({
        where: { id: recordId },
        data: {
          status: "AVSLUTAD",
          resolution: decision,
          discardedQuantity,
          resolvedAt: new Date(),
          resolvedByStaffMemberId: staffMemberId,
          comment,
        },
      }),
      prisma.activityLog.create({
        data: {
          eventType: "expiry_record_discarded",
          description: `Kasserade ${discardedQuantity} flak/pall av "${record.product.name}" i butiken${
            decision === "utgangen" ? " (utgånget bäst före-datum)" : ""
          }.`,
          reason: comment ?? undefined,
          staffMemberId,
        },
      }),
    ]);
    revalidatePath(PATH);
    return;
  }
}

export async function updateExpiryRecordPlacementAction(
  recordId: number,
  formData: FormData,
): Promise<void> {
  const placement = String(formData.get("placement") ?? "").trim() || null;
  await prisma.expiryRecord.update({ where: { id: recordId }, data: { placement } });
  revalidatePath(PATH);
  redirect(PATH);
}
