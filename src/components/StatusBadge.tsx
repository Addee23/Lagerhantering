type Tone = "success" | "warning" | "error" | "neutral";

// Kantig, stämpelliknande badge istället för en mjuk pill - versaliserad,
// glest bokstavsavstånd, tydlig kant i tonens färg. Grönt/rött hålls kvar
// som Tailwinds vanliga toner (universellt igenkännbara, ska inte tolkas om)
// - bara "neutral" och "warning" (varningens signalorange) hör till den nya
// paletten.
const TONE_CLASSES: Record<Tone, string> = {
  success: "border-emerald-700 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "border-safety-600 bg-safety-50 text-safety-700 dark:border-safety-400 dark:bg-safety-950 dark:text-safety-400",
  error: "border-red-700 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-950 dark:text-red-300",
  neutral: "border-neutral-400 bg-neutral-100 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

// Delad statusmarkör (t.ex. "Klar"/"Avvikelse"/"Hämtad") - ersätter samma
// upprepade badge-styling i hämtlistor och leveranser.
export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
