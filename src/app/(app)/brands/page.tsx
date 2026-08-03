import { prisma } from "@/lib/prisma";
import { createBrandAction, toggleBrandActiveAction } from "@/lib/actions/brand-actions";
import { Alert } from "@/components/Alert";

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Varumärken</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Varumärke är inte samma sak som leverantör - samma varumärke kan köpas från flera
        leverantörer.
      </p>

      <form action={createBrandAction} className="flex gap-2">
        <input
          name="name"
          placeholder="Nytt varumärke, t.ex. Red Bull"
          required
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-800"
        />
        <input
          name="comment"
          placeholder="Kommentar (valfritt)"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-800"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Lägg till
        </button>
      </form>

      {error === "finns-redan" && <Alert tone="error">Det finns redan ett varumärke med det namnet.</Alert>}

      <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {brands.map((brand) => (
          <li key={brand.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span
                className={
                  brand.active
                    ? "text-neutral-900 dark:text-neutral-50"
                    : "text-neutral-400 line-through dark:text-neutral-600"
                }
              >
                {brand.name}
              </span>
              {brand.comment && (
                <span className="ml-2 text-xs text-neutral-400">{brand.comment}</span>
              )}
            </div>
            <form action={toggleBrandActiveAction.bind(null, brand.id, !brand.active)}>
              <button type="submit" className="text-sm text-neutral-500 hover:underline">
                {brand.active ? "Inaktivera" : "Aktivera"}
              </button>
            </form>
          </li>
        ))}
        {brands.length === 0 && (
          <li className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
            Inga varumärken ännu.
          </li>
        )}
      </ul>
    </div>
  );
}
