"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// skills/database-rules.md, 8.1: "Första gången behöver endast leverantörens
// namn anges eller godkännas. Övriga uppgifter kan kompletteras senare."
export async function createSupplierAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.supplier.create({ data: { name } });
  revalidatePath("/suppliers");
}

export async function updateSupplierAction(id: number, formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const optional = (field: string) => String(formData.get(field) ?? "").trim() || null;
  const defaultShortExpiryDaysRaw = String(formData.get("defaultShortExpiryDays") ?? "").trim();
  const defaultShortExpiryDays = defaultShortExpiryDaysRaw
    ? Number(defaultShortExpiryDaysRaw)
    : null;

  await prisma.supplier.update({
    where: { id },
    data: {
      name,
      orgNumber: optional("orgNumber"),
      customerNumber: optional("customerNumber"),
      generalEmail: optional("generalEmail"),
      complaintEmail: optional("complaintEmail"),
      ccRecipient: optional("ccRecipient"),
      phone: optional("phone"),
      contactPerson: optional("contactPerson"),
      notes: optional("notes"),
      complaintInstructions: optional("complaintInstructions"),
      defaultShortExpiryDays,
    },
  });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function toggleSupplierActiveAction(id: number, active: boolean): Promise<void> {
  await prisma.supplier.update({ where: { id }, data: { active } });
  revalidatePath("/suppliers");
}
