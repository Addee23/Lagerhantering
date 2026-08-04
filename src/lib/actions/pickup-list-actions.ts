"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkStaffPin, redirectWithPinError } from "@/lib/pin-verification";
import type { Prisma, StockBatch } from "@/generated/prisma/client";

export async function createPickupListAction(): Promise<void> {
  const list = await prisma.pickupList.create({ data: {} });
  redirect(`/pickup-lists/${list.id}`);
}

export async function addPickupListItemAction(
  pickupListId: number,
  formData: FormData,
): Promise<void> {
  const productId = Number(formData.get("productId"));
  const requestedQuantity = Number(formData.get("requestedQuantity"));
  const path = `/pickup-lists/${pickupListId}`;

  if (!productId || !requestedQuantity || requestedQuantity <= 0) return;

  await prisma.pickupListItem.create({
    data: { pickupListId, productId, requestedQuantity },
  });

  revalidatePath(path);
  redirect(path);
}

export async function removePickupListItemAction(
  pickupListId: number,
  itemId: number,
): Promise<void> {
  await prisma.pickupListItem.delete({ where: { id: itemId } });
  revalidatePath(`/pickup-lists/${pickupListId}`);
}

export async function updatePickupListCommentAction(
  pickupListId: number,
  formData: FormData,
): Promise<void> {
  const comment = String(formData.get("comment") ?? "").trim() || null;
  await prisma.pickupList.update({ where: { id: pickupListId }, data: { comment } });
  revalidatePath(`/pickup-lists/${pickupListId}`);
}

export async function markListReadyAction(pickupListId: number): Promise<void> {
  const itemCount = await prisma.pickupListItem.count({ where: { pickupListId } });
  if (itemCount === 0) return;

  await prisma.pickupList.update({
    where: { id: pickupListId },
    data: { status: "KLAR_ATT_HAMTA" },
  });
  revalidatePath(`/pickup-lists/${pickupListId}`);
  revalidatePath("/pickup-lists");
}

export async function cancelPickupListAction(pickupListId: number): Promise<void> {
  await prisma.pickupList.update({ where: { id: pickupListId }, data: { status: "AVBRUTEN" } });
  revalidatePath(`/pickup-lists/${pickupListId}`);
  revalidatePath("/pickup-lists");
}

// skills/stock-and-pickup-rules.md, 10.3: personen som hämtar markerar varje
// rad som hämtad, med faktiskt antal eller "saknades"/"delvis".
export async function markItemPickedAction(
  pickupListId: number,
  itemId: number,
  formData: FormData,
): Promise<void> {
  const isMissing = formData.get("isMissing") === "true";
  const isPartial = formData.get("isPartial") === "true";
  const actualQuantity = isMissing ? 0 : Number(formData.get("actualQuantity"));
  const comment = String(formData.get("comment") ?? "").trim() || null;

  await prisma.$transaction(async (tx) => {
    await tx.pickupListItem.update({
      where: { id: itemId },
      data: {
        actualQuantity,
        isMissing,
        isPartial,
        comment,
        pickedAt: new Date(),
      },
    });

    // Hämtning pågår - sätts automatiskt när första raden hanteras.
    await tx.pickupList.updateMany({
      where: { id: pickupListId, status: "KLAR_ATT_HAMTA" },
      data: { status: "HAMTNING_PAGAR" },
    });
  });

  revalidatePath(`/pickup-lists/${pickupListId}`);
}

// Plockar bort lagersaldo enligt FEFO (first expire, first out) - partier
// utan bäst före-datum används sist, eftersom de inte är brådskande.
async function deductStockFefo(
  tx: Prisma.TransactionClient,
  productId: number,
  quantityToDeduct: number,
  staffMemberId: number,
  reason: string,
): Promise<{ expiryDate: Date | null; quantity: number }[]> {
  let remaining = quantityToDeduct;
  // Vilka lagerpartier (och deras bäst före-datum) FEFO-uttaget faktiskt tog
  // ifrån - används för att skapa rätt ExpiryRecord-poster i butiken (Fas 7).
  const consumed: { expiryDate: Date | null; quantity: number }[] = [];

  const batches = await tx.stockBatch.findMany({
    where: { productId, quantity: { gt: 0 } },
  });

  const sorted = [...batches].sort((a: StockBatch, b: StockBatch) => {
    if (a.expiryDate && b.expiryDate) return a.expiryDate.getTime() - b.expiryDate.getTime();
    if (a.expiryDate) return -1;
    if (b.expiryDate) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  for (const batch of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);

    await tx.stockBatch.update({
      where: { id: batch.id },
      data: { quantity: batch.quantity - take },
    });

    await tx.stockMovement.create({
      data: {
        productId,
        stockBatchId: batch.id,
        changeType: "uttag",
        quantityDelta: -take,
        reason,
        staffMemberId,
      },
    });

    consumed.push({ expiryDate: batch.expiryDate, quantity: take });
    remaining -= take;
  }

  return consumed;
}

// skills/stock-and-pickup-rules.md, 10.4: minska lagersaldot med faktiskt
// hämtat antal, spara vem som godkände, datum/tid och avvikelser.
export async function completePickupListAction(
  pickupListId: number,
  formData: FormData,
): Promise<void> {
  const staffMemberId = Number(formData.get("staffMemberId"));
  const pin = String(formData.get("pin") ?? "");
  const path = `/pickup-lists/${pickupListId}`;

  const list = await prisma.pickupList.findUnique({
    where: { id: pickupListId },
    include: { items: true },
  });
  if (!list || list.items.length === 0) return;

  if (list.items.some((item) => !item.pickedAt)) {
    redirect(`${path}?error=alla-rader-maste-hanteras`);
  }

  const pinResult = await checkStaffPin(staffMemberId, pin);
  if (!pinResult.ok) {
    redirectWithPinError(path, pinResult);
  }

  await prisma.$transaction(async (tx) => {
    for (const item of list.items) {
      const quantity = item.actualQuantity ?? 0;
      if (quantity > 0) {
        const consumed = await deductStockFefo(
          tx,
          item.productId,
          quantity,
          staffMemberId,
          `Hämtlista #${pickupListId}`,
        );

        // skills/stock-and-pickup-rules.md: relevant bäst före-info förs
        // över till butiken - en ExpiryRecord per lagerparti FEFO-uttaget
        // faktiskt tog ifrån (Fas 7).
        for (const portion of consumed) {
          await tx.expiryRecord.create({
            data: {
              productId: item.productId,
              expiryDate: portion.expiryDate,
              quantityRemaining: portion.quantity,
              pickupListItemId: item.id,
            },
          });
        }
      }
    }

    await tx.pickupList.update({
      where: { id: pickupListId },
      data: {
        status: "SLUTFORD",
        completedAt: new Date(),
        completedByStaffMemberId: staffMemberId,
      },
    });

    const deviationCount = list.items.filter((item) => item.isMissing || item.isPartial).length;
    await tx.activityLog.create({
      data: {
        eventType: "pickup_list_completed",
        description: `Slutförde hämtlista #${pickupListId} (${list.items.length} rader${
          deviationCount > 0 ? `, ${deviationCount} med avvikelse` : ""
        }) - varor flyttade till butiken.`,
        staffMemberId,
      },
    });
  });

  revalidatePath(path);
  revalidatePath("/pickup-lists");
  revalidatePath("/warehouse");
  revalidatePath("/expiry");
  redirect(path);
}
