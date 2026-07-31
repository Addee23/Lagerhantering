"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, destroySessionCookie } from "@/lib/session";

export async function loginAction(formData: FormData): Promise<void> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const user = username ? await prisma.systemUser.findUnique({ where: { username } }) : null;

  // Jämför alltid mot ett hash, även om användaren inte finns, så att svarstiden
  // inte avslöjar om användarnamnet var giltigt (timing-attack-skydd).
  const passwordHashToCompare = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const passwordMatches = await bcrypt.compare(password, passwordHashToCompare);

  if (!user || !passwordMatches) {
    redirect("/login?error=1");
  }

  await createSessionCookie(user.username);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie();
  redirect("/login");
}
