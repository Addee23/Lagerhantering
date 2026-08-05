"use client";

import Link from "next/link";
import { useEffect } from "react";

// Next.js 16 error.js-konvention (måste vara en Client Component): fångar
// oväntade körningsfel i en sida och visar en läsbar felsida istället för en
// krasch - Nav/layout runt om (AppLayout) förblir synlig eftersom error.tsx
// bara ersätter sidans eget innehåll (skills/ui-and-mobile-rules.md).
// `unstable_retry` är den här versionens rekommenderade API (v16.2.0) för att
// försöka rendera om sidan, istället för det äldre `reset`.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      <div>
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
          Något gick fel
        </h2>
        <p className="mt-1 text-sm">
          Sidan kunde inte visas. Det kan bero på ett tillfälligt problem - försök igen, eller gå
          tillbaka till startsidan.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-red-700 dark:text-red-400">
            Felkod: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3 text-sm">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Försök igen
        </button>
        <Link href="/" className="rounded-md border border-red-300 px-4 py-2 font-medium dark:border-red-800">
          Till startsidan
        </Link>
      </div>
    </div>
  );
}
