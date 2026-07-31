"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createBrandAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim() || null;
  if (!name) return;

  try {
    await prisma.brand.create({ data: { name, comment } });
  } catch {
    redirect("/brands?error=finns-redan");
  }

  revalidatePath("/brands");
}

export async function toggleBrandActiveAction(id: number, active: boolean): Promise<void> {
  await prisma.brand.update({ where: { id }, data: { active } });
  revalidatePath("/brands");
}
