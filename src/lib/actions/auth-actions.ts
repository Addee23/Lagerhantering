"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, destroySessionCookie } from "@/lib/session";

// proxy.ts skickar med ?from=<sida> när den skickar en oinloggad användare
// till /login, så att de hamnar tillbaka där de var på väg efter inloggning
// istället för alltid på dashboarden. `from` kommer från query-strängen och
// är därför användarstyrd - måste valideras som en intern sökväg (börjar med
// EN "/", aldrig "//...") annars öppnar det för en "open redirect".
function safeRedirectPath(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

export async function loginAction(formData: FormData): Promise<void> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = safeRedirectPath(String(formData.get("from") ?? ""));

  const user = username ? await prisma.systemUser.findUnique({ where: { username } }) : null;

  // Jämför alltid mot ett hash, även om användaren inte finns, så att svarstiden
  // inte avslöjar om användarnamnet var giltigt (timing-attack-skydd).
  const passwordHashToCompare = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const passwordMatches = await bcrypt.compare(password, passwordHashToCompare);

  if (!user || !passwordMatches) {
    redirect(`/login?error=1&from=${encodeURIComponent(from)}`);
  }

  await createSessionCookie(user.username);
  redirect(from);
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie();
  redirect("/login");
}
