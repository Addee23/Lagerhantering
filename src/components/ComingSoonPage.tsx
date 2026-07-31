export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{title}</h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        Den här delen byggs i en senare fas av projektet.
      </p>
    </div>
  );
}
