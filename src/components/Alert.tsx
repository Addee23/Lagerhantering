type Tone = "error" | "success" | "warning";

const TONE_CLASSES: Record<Tone, string> = {
  error: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  success: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  warning: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

// Delad meddelanderuta för fel/lyckat/varning - ersätter samma inline-klasser
// som tidigare kopierades in i varje sida (login, produkter, lager,
// hämtlistor, leveranser, ...).
export function Alert({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <p className={`rounded-md px-3 py-2 text-sm ${TONE_CLASSES[tone]}`}>{children}</p>;
}
