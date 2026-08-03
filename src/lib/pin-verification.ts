import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Delad kärnlogik för PIN-kontroll (skills/authentication-and-pin.md).
// Ligger i en vanlig (icke "use server") fil så att både staff-actions.ts
// och andra actions (t.ex. lagerkorrigeringar) kan återanvända den utan att
// den blir sin egen fristående Server Action.

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30_000;

export type PinCheckResult =
  | { ok: true }
  | { ok: false; locked: true; secondsRemaining: number }
  | { ok: false; locked: false; message: string };

export async function checkStaffPin(staffMemberId: number, pin: string): Promise<PinCheckResult> {
  const staff = await prisma.staffMember.findUnique({ where: { id: staffMemberId } });

  if (!staff || !staff.active) {
    return { ok: false, locked: false, message: "Okänd eller inaktiv personal." };
  }

  if (staff.pinLockedUntil && staff.pinLockedUntil.getTime() > Date.now()) {
    const secondsRemaining = Math.ceil((staff.pinLockedUntil.getTime() - Date.now()) / 1000);
    return { ok: false, locked: true, secondsRemaining };
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
      return { ok: false, locked: true, secondsRemaining: LOCK_DURATION_MS / 1000 };
    }
    return {
      ok: false,
      locked: false,
      message: `Fel PIN-kod (${MAX_ATTEMPTS - failedPinAttempts} försök kvar).`,
    };
  }

  await prisma.staffMember.update({
    where: { id: staff.id },
    data: { failedPinAttempts: 0, pinLockedUntil: null, lastUsedAt: new Date() },
  });

  return { ok: true };
}

/** Skickar tillbaka användaren till `path` med ett läsbart PIN-felmeddelande i query-strängen. */
export function redirectWithPinError(
  path: string,
  result: { locked: boolean; message?: string; secondsRemaining?: number },
): never {
  const params = new URLSearchParams();
  if (result.locked) {
    params.set(
      "pinError",
      `Låst i ${result.secondsRemaining} sekunder efter för många felaktiga försök.`,
    );
  } else {
    params.set("pinError", result.message ?? "Fel PIN-kod.");
  }
  redirect(`${path}?${params.toString()}`);
}
