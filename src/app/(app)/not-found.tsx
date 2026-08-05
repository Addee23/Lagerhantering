import Link from "next/link";

// Next.js 16 not-found.js-konvention: renderas när notFound() anropas i en
// sida (t.ex. produkt-/lager-/leveransid som inte finns) - ersätter
// standard-404:an med en sida som matchar appens formspråk och länkar vidare
// istället för en tom sida utan navigation.
export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
      <div>
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-neutral-900 dark:text-neutral-50">
          Hittades inte
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Det du letar efter finns inte, eller så har det tagits bort.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        Till startsidan
      </Link>
    </div>
  );
}
