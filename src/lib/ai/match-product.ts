import { prisma } from "@/lib/prisma";
import type { DeliveryItemMatchStatus } from "@/generated/prisma/client";

export type ProductMatch = {
  productId: number | null;
  matchStatus: DeliveryItemMatchStatus;
};

// skills/delivery-and-ai-rules.md, 12.5: matchningsordning.
// 1-2 (tidigare sparad leverantörskoppling / leverantörens artikelnummer) och
// 3 (streckkod) räknas som säkra -> MATCHED. 4 (liknande namn) är osäker ->
// SUGGESTED och måste bekräftas. Annars UNMATCHED (raden försvinner aldrig).
export async function matchProductForDeliveryItem(
  supplierId: number | null,
  input: { supplierArticleNumber: string | null; barcode: string | null; productName: string },
): Promise<ProductMatch> {
  if (supplierId && input.supplierArticleNumber) {
    const supplierProduct = await prisma.supplierProduct.findFirst({
      where: { supplierId, supplierArticleNumber: input.supplierArticleNumber },
    });
    if (supplierProduct) {
      return { productId: supplierProduct.productId, matchStatus: "MATCHED" };
    }
  }

  if (input.barcode) {
    const product = await prisma.product.findFirst({
      where: { barcode: input.barcode, active: true },
    });
    if (product) {
      return { productId: product.id, matchStatus: "MATCHED" };
    }
  }

  const productName = input.productName.trim();
  // Utan det här skyddet skulle en tom (eller väldigt kort) produktnamnssträng
  // matcha praktiskt taget vilken produkt som helst via `contains` - det är
  // inte en rimlig "liknande namn"-gissning, bara ett tomt filter.
  if (productName.length < 3) {
    return { productId: null, matchStatus: "UNMATCHED" };
  }

  const exactName = await prisma.product.findFirst({
    where: { name: { equals: productName }, active: true },
  });
  if (exactName) {
    return { productId: exactName.id, matchStatus: "MATCHED" };
  }

  const similarName = await prisma.product.findFirst({
    where: { name: { contains: productName }, active: true },
  });
  if (similarName) {
    return { productId: similarName.id, matchStatus: "SUGGESTED" };
  }

  return { productId: null, matchStatus: "UNMATCHED" };
}

export async function matchSupplierByName(
  supplierName: string | null,
): Promise<{ supplierId: number | null; rawSupplierName: string | null }> {
  if (!supplierName) return { supplierId: null, rawSupplierName: null };

  const supplier = await prisma.supplier.findFirst({
    where: { name: { equals: supplierName }, active: true },
  });

  return { supplierId: supplier?.id ?? null, rawSupplierName: supplier ? null : supplierName };
}
