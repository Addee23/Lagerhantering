// Next.js 16 loading.js-konvention: wrappar page.tsx (och nästlade sidor) i en
// Suspense-boundary automatiskt - visas medan servern hämtar data för sidan.
export default function Loading() {
  return (
    <div className="flex items-center gap-3 py-16 text-sm text-neutral-500 dark:text-neutral-400">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-safety-600 dark:border-neutral-700 dark:border-t-safety-500"
        aria-hidden="true"
      />
      Laddar...
    </div>
  );
}
