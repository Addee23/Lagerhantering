"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { OrderListPriority } from "@/generated/prisma/client";

const PATH = "/order-list";

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "").trim();
  return str ? Number(str) : null;
}

// skills/business-rules.md, avgränsningar: listan är helt manuell - inget
// skickas automatiskt till någon leverantör. Personalen lägger till en
// produkt de vill beställa, med orsak och prioritet, och beställer sedan
// själva utanför systemet (telefon/mejl).
export async function addOrderListItemAction(formData: FormData): Promise<void> {
  const productId = Number(formData.get("productId"));
  if (!productId) return;

  const supplierId = numberOrNull(formData.get("supplierId"));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const priorityRaw = String(formData.get("priority") ?? "NORMAL");
  const priority = priorityRaw in OrderListPriority ? (priorityRaw as OrderListPriority) : "NORMAL";
  const quantity = numberOrNull(formData.get("quantity"));

  await prisma.orderListItem.create({
    data: { productId, supplierId, reason, priority, quantity: quantity && quantity > 0 ? quantity : null },
  });

  revalidatePath(PATH);
  redirect(PATH);
}

export async function markOrderListItemOrderedAction(itemId: number): Promise<void> {
  await prisma.orderListItem.updateMany({
    where: { id: itemId, status: "ATT_BESTALLA" },
    data: { status: "BESTALLD", orderedAt: new Date() },
  });
  revalidatePath(PATH);
}

export async function markOrderListItemReceivedAction(itemId: number): Promise<void> {
  await prisma.orderListItem.updateMany({
    where: { id: itemId, status: { in: ["ATT_BESTALLA", "BESTALLD"] } },
    data: { status: "MOTTAGEN", receivedAt: new Date() },
  });
  revalidatePath(PATH);
}

export async function cancelOrderListItemAction(itemId: number): Promise<void> {
  await prisma.orderListItem.updateMany({
    where: { id: itemId, status: { in: ["ATT_BESTALLA", "BESTALLD"] } },
    data: { status: "AVBRUTEN" },
  });
  revalidatePath(PATH);
}
