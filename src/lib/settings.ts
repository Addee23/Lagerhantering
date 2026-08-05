import { prisma } from "@/lib/prisma";

// AppSetting (skills/database-rules.md): enkel nyckel/värde-inställning för
// systemet. Den här är den första som faktiskt används - systemets
// standardgräns för "kort bäst före-datum" vid inleverans
// (skills/expiry-rules.md), om en leverantör inte har en egen satt.
export const SHORT_EXPIRY_DAYS_KEY = "default_short_expiry_days";
export const FALLBACK_SHORT_EXPIRY_DAYS = 90;

export async function getDefaultShortExpiryDays(): Promise<number> {
  const setting = await prisma.appSetting.findUnique({ where: { key: SHORT_EXPIRY_DAYS_KEY } });
  const parsed = setting ? Number(setting.value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : FALLBACK_SHORT_EXPIRY_DAYS;
}
