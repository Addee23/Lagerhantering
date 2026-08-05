"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkStaffPin } from "@/lib/pin-verification";

const PIN_PATTERN = /^\d{4,6}$/;
const PATH = "/staff";

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

// skills/ui-and-mobile-rules.md: "Personal" är en av huvudsidorna i
// navigationen - hantering fanns tidigare bara via engångsskript
// (scripts/create-staff-member.ts). PIN-koden krävs inte för de här
// åtgärderna (står inte med i skills/authentication-and-pin.md:s lista över
// vad som kräver PIN), men skapande/inaktivering/PIN-byte loggas ändå.

export async function getAllStaffMembers() {
  return prisma.staffMember.findMany({ orderBy: { name: "asc" } });
}

export async function createStaffMemberAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (!name || !PIN_PATTERN.test(pin)) {
    redirect(`${PATH}?error=${encodeURIComponent("Namn och en 4-6 siffrig PIN-kod krävs.")}`);
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const staffMember = await prisma.staffMember.create({ data: { name, pinHash, comment } });

  await prisma.activityLog.create({
    data: {
      eventType: "staff_member_created",
      description: `Skapade personalprofil "${staffMember.name}".`,
    },
  });

  revalidatePath(PATH);
  redirect(PATH);
}

export async function updateStaffMemberAction(id: number, formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim() || null;
  if (!name) return;

  await prisma.staffMember.update({ where: { id }, data: { name, comment } });
  revalidatePath(PATH);
  redirect(`${PATH}?saved=true`);
}

export async function changeStaffMemberPinAction(id: number, formData: FormData): Promise<void> {
  const pin = String(formData.get("pin") ?? "").trim();
  if (!PIN_PATTERN.test(pin)) {
    redirect(`${PATH}?error=${encodeURIComponent("PIN-koden måste vara 4-6 siffror.")}`);
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const staffMember = await prisma.staffMember.update({
    where: { id },
    // Nollställer även ev. blockering - ett medvetet PIN-byte är en giltig
    // "ren tavla", precis som när en glömd kod återställs.
    data: { pinHash, failedPinAttempts: 0, pinLockedUntil: null },
  });

  await prisma.activityLog.create({
    data: {
      eventType: "staff_member_pin_changed",
      description: `Bytte PIN-kod för "${staffMember.name}".`,
    },
  });

  revalidatePath(PATH);
  redirect(`${PATH}?saved=true`);
}

export async function toggleStaffMemberActiveAction(id: number, active: boolean): Promise<void> {
  const staffMember = await prisma.staffMember.update({ where: { id }, data: { active } });

  await prisma.activityLog.create({
    data: {
      eventType: active ? "staff_member_activated" : "staff_member_deactivated",
      description: `${active ? "Aktiverade" : "Inaktiverade"} personalprofilen "${staffMember.name}".`,
    },
  });

  revalidatePath(PATH);
}
