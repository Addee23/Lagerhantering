import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createPickupListAction } from "@/lib/actions/pickup-list-actions";

const STATUS_LABELS: Record<string, string> = {
  UTKAST: "Utkast",
  KLAR_ATT_HAMTA: "Klar att hämta",
  HAMTNING_PAGAR: "Hämtning pågår",
  SLUTFORD: "Slutförd",
  AVBRUTEN: "Avbruten",
};

export default async function PickupListsPage() {
  const lists = await prisma.pickupList.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Hämtlistor
        </h1>
        <form action={createPickupListAction}>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Ny hämtlista
          </button>
        </form>
      </div>

      <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {lists.map((list) => (
          <li key={list.id}>
            <Link
              href={`/pickup-lists/${list.id}`}
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div>
                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                  Hämtlista #{list.id}
                </span>
                <span className="ml-2 text-neutral-400">
                  {list.items.length} {list.items.length === 1 ? "produkt" : "produkter"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-neutral-500">
                <span>{STATUS_LABELS[list.status]}</span>
                <span className="text-xs text-neutral-400">
                  {list.createdAt.toLocaleDateString("sv-SE")}
                </span>
              </div>
            </Link>
          </li>
        ))}
        {lists.length === 0 && (
          <li className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
            Inga hämtlistor ännu.
          </li>
        )}
      </ul>
    </div>
  );
}
