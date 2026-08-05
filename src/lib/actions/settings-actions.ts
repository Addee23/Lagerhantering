"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { SHORT_EXPIRY_DAYS_KEY } from "@/lib/settings";

const PATH = "/settings";

export async function updateShortExpiryDaysAction(formData: FormData): Promise<void> {
  const days = Number(formData.get("days"));
  if (!Number.isFinite(days) || days <= 0) {
    redirect(`${PATH}?error=${encodeURIComponent("Ange ett positivt antal dagar.")}`);
  }

  await prisma.appSetting.upsert({
    where: { key: SHORT_EXPIRY_DAYS_KEY },
    create: { key: SHORT_EXPIRY_DAYS_KEY, value: String(Math.round(days)) },
    update: { value: String(Math.round(days)) },
  });

  revalidatePath(PATH);
  redirect(`${PATH}?saved=true`);
}

// Systeminloggningen är gemensam för hela butiken (skills/authentication-and-pin.md,
// 21.1) - bara den som redan är inloggad (och alltså känner till nuvarande
// lösenord) kan byta det.
export async function changeSystemPasswordAction(formData: FormData): Promise<void> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect(`${PATH}?error=${encodeURIComponent("Nytt lösenord måste vara minst 8 tecken.")}`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`${PATH}?error=${encodeURIComponent("De nya lösenorden matchar inte.")}`);
  }

  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.systemUser.findUnique({ where: { username: session.username } });
  if (!user) redirect("/login");

  const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentMatches) {
    redirect(`${PATH}?error=${encodeURIComponent("Nuvarande lösenord stämmer inte.")}`);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.systemUser.update({ where: { id: user.id }, data: { passwordHash } });

  await prisma.activityLog.create({
    data: {
      eventType: "system_password_changed",
      description: `Systemlösenordet byttes (inloggad som "${user.username}").`,
    },
  });

  redirect(`${PATH}?saved=true`);
}
