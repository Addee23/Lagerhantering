import {
  getAllStaffMembers,
  createStaffMemberAction,
  updateStaffMemberAction,
  changeStaffMemberPinAction,
  toggleStaffMemberActiveAction,
} from "@/lib/actions/staff-actions";
import { inputClass, labelClass } from "@/lib/form-styles";
import { Alert } from "@/components/Alert";
import { StatusBadge } from "@/components/StatusBadge";

// Egen (icke-komponent) funktion så att Date.now() inte anropas direkt i
// render-kroppen (react-hooks/purity-regeln, samma mönster som på andra
// sidor i appen).
function buildStaffViews(staffMembers: Awaited<ReturnType<typeof getAllStaffMembers>>) {
  const now = Date.now();
  return staffMembers.map((staff) => ({
    staff,
    isLocked: staff.pinLockedUntil != null && staff.pinLockedUntil.getTime() > now,
  }));
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const staffMembers = await getAllStaffMembers();
  const staffViews = buildStaffViews(staffMembers);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Personal</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Personalprofiler med PIN-kod - identifierar vem som bekräftar en åtgärd i systemet
          (skills/authentication-and-pin.md). PIN-koden sparas alltid som ett hash, aldrig i
          klartext.
        </p>
      </div>

      {error && <Alert tone="error">{decodeURIComponent(error)}</Alert>}
      {saved === "true" && <Alert tone="success">Sparat.</Alert>}

      <details className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          + Lägg till personal
        </summary>
        <form
          action={createStaffMemberAction}
          className="grid gap-4 border-t border-neutral-200 p-4 dark:border-neutral-800 sm:grid-cols-2"
        >
          <div>
            <label className={labelClass} htmlFor="name">
              Namn
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="pin">
              PIN-kod (4-6 siffror)
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              minLength={4}
              maxLength={6}
              required
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="comment">
              Kommentar (valfritt)
            </label>
            <input id="comment" name="comment" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Lägg till personal
            </button>
          </div>
        </form>
      </details>

      <ul className="space-y-3">
        {staffViews.map(({ staff, isLocked }) => (
          <li key={staff.id} className="rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-neutral-900 dark:text-neutral-50">{staff.name}</span>
              <div className="flex items-center gap-2">
                <StatusBadge tone={staff.active ? "success" : "neutral"}>
                  {staff.active ? "Aktiv" : "Inaktiv"}
                </StatusBadge>
                {isLocked && <StatusBadge tone="error">Låst</StatusBadge>}
              </div>
            </div>
            {staff.comment && <p className="mt-1 text-xs text-neutral-400">{staff.comment}</p>}
            <p className="mt-1 text-xs text-neutral-400">
              {staff.lastUsedAt
                ? `Senast använd ${staff.lastUsedAt.toLocaleString("sv-SE")}`
                : "Aldrig använd"}
            </p>

            <details className="mt-3">
              <summary className="cursor-pointer text-neutral-500 hover:underline">
                Hantera
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <form
                  action={updateStaffMemberAction.bind(null, staff.id)}
                  className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <p className="text-xs font-medium text-neutral-500">Namn/kommentar</p>
                  <input name="name" defaultValue={staff.name} required className={inputClass} />
                  <input name="comment" defaultValue={staff.comment ?? ""} className={inputClass} />
                  <button
                    type="submit"
                    className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700"
                  >
                    Spara
                  </button>
                </form>

                <form
                  action={changeStaffMemberPinAction.bind(null, staff.id)}
                  className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <p className="text-xs font-medium text-neutral-500">Byt PIN-kod</p>
                  <input
                    name="pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    minLength={4}
                    maxLength={6}
                    placeholder="Ny PIN (4-6 siffror)"
                    required
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700"
                  >
                    Byt PIN
                  </button>
                </form>

                <form action={toggleStaffMemberActiveAction.bind(null, staff.id, !staff.active)}>
                  <button
                    type="submit"
                    className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700"
                  >
                    {staff.active ? "Inaktivera" : "Aktivera"}
                  </button>
                </form>
              </div>
            </details>
          </li>
        ))}
        {staffViews.length === 0 && (
          <li className="text-sm text-neutral-500 dark:text-neutral-400">
            Ingen personal ännu - lägg till någon ovan.
          </li>
        )}
      </ul>
    </div>
  );
}
