type StaffOption = { id: number; name: string };

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-800";
const labelClass = "mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300";

// Återanvänds i alla lageråtgärder som kräver PIN-bekräftelse
// (skills/authentication-and-pin.md). Ren serverkomponent - ingen
// interaktivitet behövs, bara två fält i ett formulär.
export function StaffPinFields({ staffMembers }: { staffMembers: StaffOption[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelClass} htmlFor="staffMemberId">
          Vem gör detta?
        </label>
        <select id="staffMemberId" name="staffMemberId" required className={inputClass}>
          <option value="">Välj namn...</option>
          {staffMembers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="pin">
          PIN-kod
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
    </div>
  );
}
