"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createCategoryAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  try {
    await prisma.category.create({ data: { name } });
  } catch {
    // Sannolikt unikt namn-krock (@unique) - visa ett enkelt felmeddelande.
    redirect("/categories?error=finns-redan");
  }

  revalidatePath("/categories");
}

export async function toggleCategoryActiveAction(id: number, active: boolean): Promise<void> {
  await prisma.category.update({ where: { id }, data: { active } });
  revalidatePath("/categories");
}
