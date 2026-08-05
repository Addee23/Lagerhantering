import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSupplierAction, toggleSupplierActiveAction } from "@/lib/actions/supplier-actions";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        Leverantörer
      </h1>

      <details className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          + Lägg till leverantör
        </summary>
        <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
          <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
            Bara namnet krävs för att skapa en leverantör - övriga uppgifter (t.ex.
            reklamationsmejl) kan du fylla i senare via &quot;Redigera&quot;.
          </p>
          <form action={createSupplierAction} className="flex gap-2">
            <input
              name="name"
              placeholder="Ny leverantör, t.ex. Privab"
              required
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-800"
            />
            <button
              type="submit"
              className="whitespace-nowrap rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Lägg till
            </button>
          </form>
        </div>
      </details>

      <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {suppliers.map((supplier) => (
          <li key={supplier.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span
                className={
                  supplier.active
                    ? "text-neutral-900 dark:text-neutral-50"
                    : "text-neutral-400 line-through dark:text-neutral-600"
                }
              >
                {supplier.name}
              </span>
              {!supplier.complaintEmail && (
                <span className="ml-2 text-xs text-safety-600 dark:text-safety-400">
                  Saknar reklamationsmejl
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/suppliers/${supplier.id}/edit`}
                className="text-sm text-neutral-500 hover:underline"
              >
                Redigera
              </Link>
              <form
                action={toggleSupplierActiveAction.bind(null, supplier.id, !supplier.active)}
              >
                <button type="submit" className="text-sm text-neutral-500 hover:underline">
                  {supplier.active ? "Inaktivera" : "Aktivera"}
                </button>
              </form>
            </div>
          </li>
        ))}
        {suppliers.length === 0 && (
          <li className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
            Inga leverantörer ännu.
          </li>
        )}
      </ul>
    </div>
  );
}
