"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findPossibleDuplicates } from "@/lib/product-duplicates";

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "").trim();
  return str ? Number(str) : null;
}

function textOrNull(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str || null;
}

export async function createProductAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const barcode = textOrNull(formData.get("barcode"));
  const categoryId = numberOrNull(formData.get("categoryId"));
  const brandId = numberOrNull(formData.get("brandId"));
  const minStockLevel = numberOrNull(formData.get("minStockLevel"));
  const normalOrderQuantity = numberOrNull(formData.get("normalOrderQuantity"));
  const confirmDuplicate = formData.get("confirmDuplicate") === "true";

  if (!confirmDuplicate) {
    const duplicates = await findPossibleDuplicates(name, barcode);
    if (duplicates.length > 0) {
      const params = new URLSearchParams({
        name,
        barcode: barcode ?? "",
        categoryId: categoryId?.toString() ?? "",
        brandId: brandId?.toString() ?? "",
        minStockLevel: minStockLevel?.toString() ?? "",
        normalOrderQuantity: normalOrderQuantity?.toString() ?? "",
        duplicateNames: duplicates.map((d) => d.name).join(", "),
      });
      redirect(`/products/new?${params.toString()}`);
    }
  }

  await prisma.product.create({
    data: { name, barcode, categoryId, brandId, minStockLevel, normalOrderQuantity },
  });

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProductAction(id: number, formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.product.update({
    where: { id },
    data: {
      name,
      barcode: textOrNull(formData.get("barcode")),
      categoryId: numberOrNull(formData.get("categoryId")),
      brandId: numberOrNull(formData.get("brandId")),
      minStockLevel: numberOrNull(formData.get("minStockLevel")),
      normalOrderQuantity: numberOrNull(formData.get("normalOrderQuantity")),
    },
  });

  revalidatePath("/products");
  redirect(`/products/${id}/edit?saved=true`);
}

export async function toggleProductActiveAction(id: number, active: boolean): Promise<void> {
  await prisma.product.update({ where: { id }, data: { active } });
  revalidatePath("/products");
}
