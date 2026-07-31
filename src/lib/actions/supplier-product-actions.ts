"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function textOrNull(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str || null;
}

export async function createSupplierProductAction(
  productId: number,
  formData: FormData,
): Promise<void> {
  const supplierId = Number(formData.get("supplierId"));
  if (!supplierId) return;

  try {
    await prisma.supplierProduct.create({
      data: {
        productId,
        supplierId,
        supplierProductName: textOrNull(formData.get("supplierProductName")),
        supplierArticleNumber: textOrNull(formData.get("supplierArticleNumber")),
        barcode: textOrNull(formData.get("barcode")),
        comment: textOrNull(formData.get("comment")),
      },
    });
  } catch {
    // Sannolikt @@unique([productId, supplierId]) - produkten är redan kopplad
    // till den leverantören.
    redirect(`/products/${productId}/edit?error=leverantor-redan-kopplad`);
  }

  revalidatePath(`/products/${productId}/edit`);
}

export async function deleteSupplierProductAction(
  productId: number,
  supplierProductId: number,
): Promise<void> {
  await prisma.supplierProduct.delete({ where: { id: supplierProductId } });
  revalidatePath(`/products/${productId}/edit`);
}
