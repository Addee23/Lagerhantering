import { prisma } from "@/lib/prisma";
import { createCategoryAction, toggleCategoryActiveAction } from "@/lib/actions/category-actions";
import { Alert } from "@/components/Alert";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Kategorier</h1>

      {error === "finns-redan" && <Alert tone="error">Det finns redan en kategori med det namnet.</Alert>}

      <details className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          + Lägg till kategori
        </summary>
        <form action={createCategoryAction} className="flex gap-2 border-t border-neutral-200 p-4 dark:border-neutral-800">
          <input
            name="name"
            placeholder="Ny kategori, t.ex. Energidryck"
            required
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-800"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Lägg till
          </button>
        </form>
      </details>

      <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between px-4 py-3">
            <span
              className={
                category.active
                  ? "text-neutral-900 dark:text-neutral-50"
                  : "text-neutral-400 line-through dark:text-neutral-600"
              }
            >
              {category.name}
            </span>
            <form action={toggleCategoryActiveAction.bind(null, category.id, !category.active)}>
              <button type="submit" className="text-sm text-neutral-500 hover:underline">
                {category.active ? "Inaktivera" : "Aktivera"}
              </button>
            </form>
          </li>
        ))}
        {categories.length === 0 && (
          <li className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
            Inga kategorier ännu.
          </li>
        )}
      </ul>
    </div>
  );
}
