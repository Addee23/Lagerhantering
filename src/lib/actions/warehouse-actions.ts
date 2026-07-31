"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkStaffPin } from "@/lib/pin-verification";

function pinErrorRedirect(path: string, result: { locked: boolean; message?: string; secondsRemaining?: number }): never {
  const params = new URLSearchParams();
  if (result.locked) {
    params.set("pinError", `Låst i ${result.secondsRemaining} sekunder efter för många felaktiga försök.`);
  } else {
    params.set("pinError", result.message ?? "Fel PIN-kod.");
  }
  redirect(`${path}?${params.toString()}`);
}

// skills/stock-and-pickup-rules.md: manuella lagerkorrigeringar och
// kassationer kräver PIN och skapar en ny loggrad - historiken skrivs
// aldrig över.

export async function receiveStockAction(productId: number, formData: FormData): Promise<void> {
  const staffMemberId = Number(formData.get("staffMemberId"));
  const pin = String(formData.get("pin") ?? "");
  const quantity = Number(formData.get("quantity"));
  const expiryDateRaw = String(formData.get("expiryDate") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;

  const path = `/warehouse/${productId}`;

  if (!quantity || quantity <= 0) return;

  const pinResult = await checkStaffPin(staffMemberId, pin);
  if (!pinResult.ok) {
    pinErrorRedirect(path, pinResult);
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  await prisma.$transaction(async (tx) => {
    const batch = await tx.stockBatch.create({
      data: {
        productId,
        quantity,
        expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
        note,
      },
    });

    await tx.stockMovement.create({
      data: {
        productId,
        stockBatchId: batch.id,
        changeType: "mottagen",
        quantityDelta: quantity,
        staffMemberId,
      },
    });

    await tx.activityLog.create({
      data: {
        eventType: "stock_received",
        description: `Mottog ${quantity} flak/pall av "${product.name}" (nytt lagerparti).`,
        newValue: String(quantity),
        staffMemberId,
      },
    });
  });

  revalidatePath(path);
  revalidatePath("/warehouse");
  redirect(path);
}

export async function correctStockBatchAction(
  productId: number,
  batchId: number,
  formData: FormData,
): Promise<void> {
  const staffMemberId = Number(formData.get("staffMemberId"));
  const pin = String(formData.get("pin") ?? "");
  const newQuantity = Number(formData.get("newQuantity"));
  const reason = String(formData.get("reason") ?? "").trim() || null;

  const path = `/warehouse/${productId}`;

  if (!Number.isFinite(newQuantity) || newQuantity < 0) return;

  const pinResult = await checkStaffPin(staffMemberId, pin);
  if (!pinResult.ok) {
    pinErrorRedirect(path, pinResult);
  }

  const [batch, product] = await Promise.all([
    prisma.stockBatch.findUnique({ where: { id: batchId } }),
    prisma.product.findUnique({ where: { id: productId } }),
  ]);
  if (!batch || !product) return;

  const delta = newQuantity - batch.quantity;
  if (delta === 0) {
    redirect(path);
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockBatch.update({ where: { id: batchId }, data: { quantity: newQuantity } });

    await tx.stockMovement.create({
      data: {
        productId,
        stockBatchId: batchId,
        changeType: "korrigering",
        quantityDelta: delta,
        reason,
        staffMemberId,
      },
    });

    await tx.activityLog.create({
      data: {
        eventType: "stock_corrected",
        description: `Korrigerade lagerparti för "${product.name}".`,
        previousValue: String(batch.quantity),
        newValue: String(newQuantity),
        reason,
        staffMemberId,
      },
    });
  });

  revalidatePath(path);
  revalidatePath("/warehouse");
  redirect(path);
}

export async function discardStockBatchAction(
  productId: number,
  batchId: number,
  formData: FormData,
): Promise<void> {
  const staffMemberId = Number(formData.get("staffMemberId"));
  const pin = String(formData.get("pin") ?? "");
  const quantityToDiscard = Number(formData.get("quantityToDiscard"));
  const reason = String(formData.get("reason") ?? "").trim() || null;

  const path = `/warehouse/${productId}`;

  if (!quantityToDiscard || quantityToDiscard <= 0) return;

  const pinResult = await checkStaffPin(staffMemberId, pin);
  if (!pinResult.ok) {
    pinErrorRedirect(path, pinResult);
  }

  const [batch, product] = await Promise.all([
    prisma.stockBatch.findUnique({ where: { id: batchId } }),
    prisma.product.findUnique({ where: { id: productId } }),
  ]);
  if (!batch || !product) return;

  // Kan aldrig kassera fler än vad som finns kvar - negativt saldo förhindras.
  const newQuantity = Math.max(0, batch.quantity - quantityToDiscard);
  const actualDelta = newQuantity - batch.quantity;

  await prisma.$transaction(async (tx) => {
    await tx.stockBatch.update({ where: { id: batchId }, data: { quantity: newQuantity } });

    await tx.stockMovement.create({
      data: {
        productId,
        stockBatchId: batchId,
        changeType: "kassation",
        quantityDelta: actualDelta,
        reason,
        staffMemberId,
      },
    });

    await tx.activityLog.create({
      data: {
        eventType: "stock_discarded",
        description: `Kasserade ${-actualDelta} flak/pall av "${product.name}".`,
        previousValue: String(batch.quantity),
        newValue: String(newQuantity),
        reason,
        staffMemberId,
      },
    });
  });

  revalidatePath(path);
  revalidatePath("/warehouse");
  redirect(path);
}
