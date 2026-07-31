"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// skills/authentication-and-pin.md, 21.4: "Blockera eller fördröja upprepade
// felaktiga försök."
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30_000;

export type VerifyPinResult =
  | { success: true }
  | { success: false; locked: true; secondsRemaining: number }
  | { success: false; locked: false; message: string };

export async function getActiveStaffMembers() {
  return prisma.staffMember.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/**
 * Verifierar en PIN-kod för en personalmedlem och skriver en loggpost vid
 * lyckad bekräftelse (skills/logging-and-audit-rules.md). PIN-koden
 * identifierar vem som utför åtgärden, se `eventType`/`description`.
 */
export async function verifyPinAction(
  staffMemberId: number,
  pin: string,
  context: { eventType: string; description: string },
): Promise<VerifyPinResult> {
  const staff = await prisma.staffMember.findUnique({ where: { id: staffMemberId } });

  if (!staff || !staff.active) {
    return { success: false, locked: false, message: "Okänd eller inaktiv personal." };
  }

  if (staff.pinLockedUntil && staff.pinLockedUntil.getTime() > Date.now()) {
    const secondsRemaining = Math.ceil((staff.pinLockedUntil.getTime() - Date.now()) / 1000);
    return { success: false, locked: true, secondsRemaining };
  }

  const pinMatches = await bcrypt.compare(pin, staff.pinHash);

  if (!pinMatches) {
    const failedPinAttempts = staff.failedPinAttempts + 1;
    const isLockedOut = failedPinAttempts >= MAX_ATTEMPTS;

    await prisma.staffMember.update({
      where: { id: staff.id },
      data: {
        failedPinAttempts: isLockedOut ? 0 : failedPinAttempts,
        pinLockedUntil: isLockedOut ? new Date(Date.now() + LOCK_DURATION_MS) : null,
      },
    });

    if (isLockedOut) {
      return { success: false, locked: true, secondsRemaining: LOCK_DURATION_MS / 1000 };
    }
    return {
      success: false,
      locked: false,
      message: `Fel PIN-kod (${MAX_ATTEMPTS - failedPinAttempts} försök kvar).`,
    };
  }

  await prisma.$transaction([
    prisma.staffMember.update({
      where: { id: staff.id },
      data: { failedPinAttempts: 0, pinLockedUntil: null, lastUsedAt: new Date() },
    }),
    prisma.activityLog.create({
      data: {
        eventType: context.eventType,
        description: context.description,
        staffMemberId: staff.id,
      },
    }),
  ]);

  return { success: true };
}
