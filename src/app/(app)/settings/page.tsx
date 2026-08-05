import { getSession } from "@/lib/session";
import { getDefaultShortExpiryDays, FALLBACK_SHORT_EXPIRY_DAYS } from "@/lib/settings";
import {
  updateShortExpiryDaysAction,
  changeSystemPasswordAction,
} from "@/lib/actions/settings-actions";
import { inputClass, labelClass } from "@/lib/form-styles";
import { Alert } from "@/components/Alert";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const [session, shortExpiryDays] = await Promise.all([getSession(), getDefaultShortExpiryDays()]);

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Inställningar
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Inloggad som <span className="font-medium">{session?.username ?? "okänd"}</span>.
        </p>
      </div>

      {error && <Alert tone="error">{decodeURIComponent(error)}</Alert>}
      {saved === "true" && <Alert tone="success">Sparat.</Alert>}

      <div className="space-y-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div>
          <h2 className="font-medium text-neutral-900 dark:text-neutral-50">
            Standardgräns för kort bäst före-datum
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Används vid inleverans (skills/expiry-rules.md) när leverantören inte har en egen
            gräns satt på sin sida. Systemets standard är {FALLBACK_SHORT_EXPIRY_DAYS} dagar om
            inget annat väljs här.
          </p>
        </div>
        <form action={updateShortExpiryDaysAction} className="flex items-end gap-2">
          <div>
            <label className={labelClass} htmlFor="days">
              Antal dagar
            </label>
            <input
              id="days"
              name="days"
              type="number"
              min={1}
              defaultValue={shortExpiryDays}
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Spara
          </button>
        </form>
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div>
          <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Systemlösenord</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Den gemensamma inloggningen för hela systemet (skills/authentication-and-pin.md) -
            skiljer sig från personalens individuella PIN-koder.
          </p>
        </div>
        <form action={changeSystemPasswordAction} className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="currentPassword">
              Nuvarande lösenord
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="newPassword">
              Nytt lösenord (minst 8 tecken)
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirmPassword">
              Bekräfta nytt lösenord
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Byt lösenord
          </button>
        </form>
      </div>
    </div>
  );
}
