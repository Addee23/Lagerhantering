import { prisma } from "@/lib/prisma";

// Statusar som fortfarande "håller" en reservation av lagersaldo
// (skills/stock-and-pickup-rules.md - hämtlistans flöde).
const ACTIVE_PICKUP_STATUSES = ["UTKAST", "KLAR_ATT_HAMTA", "HAMTNING_PAGAR"] as const;

export async function getTotalStock(productId: number): Promise<number> {
  const result = await prisma.stockBatch.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function getReservedStock(productId: number): Promise<number> {
  const result = await prisma.pickupListItem.aggregate({
    where: {
      productId,
      pickupList: { status: { in: [...ACTIVE_PICKUP_STATUSES] } },
    },
    _sum: { requestedQuantity: true },
  });
  return result._sum.requestedQuantity ?? 0;
}

/** Fysiskt saldo minus vad som redan är reserverat i andra aktiva hämtlistor. */
export async function getAvailableStock(productId: number): Promise<number> {
  const [total, reserved] = await Promise.all([
    getTotalStock(productId),
    getReservedStock(productId),
  ]);
  return total - reserved;
}
