"use server";

import { prisma } from "@/lib/prisma";
import { checkStaffPin } from "@/lib/pin-verification";

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
  const result = await checkStaffPin(staffMemberId, pin);

  if (!result.ok) {
    if (result.locked) {
      return { success: false, locked: true, secondsRemaining: result.secondsRemaining };
    }
    return { success: false, locked: false, message: result.message };
  }

  await prisma.activityLog.create({
    data: {
      eventType: context.eventType,
      description: context.description,
      staffMemberId,
    },
  });

  return { success: true };
}
