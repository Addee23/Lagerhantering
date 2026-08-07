import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function WarehousePage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { stockBatches: true },
    orderBy: { name: "asc" },
  });

  const rows = products.map((product) => {
    const totalQuantity = product.stockBatches.reduce((sum, batch) => sum + batch.quantity, 0);
    const isLowStock =
      product.minStockLevel != null && totalQuantity < product.minStockLevel;
    return { product, totalQuantity, isLowStock };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        Lager (externt)
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Lagret har ett exakt saldo, till skillnad från butiken (skills/business-rules.md, punkt
        3-4).
      </p>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-2 font-medium">Produkt</th>
              <th className="px-4 py-2 font-medium">Saldo (flak/pall)</th>
              <th className="hidden px-4 py-2 font-medium sm:table-cell">Lägsta önskade</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, totalQuantity, isLowStock }) => (
              <tr
                key={product.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
              >
                <td className="px-4 py-2">{product.name}</td>
                <td className="px-4 py-2">
                  <span className={isLowStock ? "font-medium text-red-600 dark:text-red-400" : ""}>
                    {totalQuantity}
                  </span>
                  {isLowStock && (
                    <span className="ml-2 rounded bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                      Lågt saldo
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-2 text-neutral-500 sm:table-cell dark:text-neutral-400">
                  {product.minStockLevel ?? "–"}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/warehouse/${product.id}`} className="text-neutral-500 hover:underline">
                    Hantera lager
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                  Inga produkter ännu - skapa några under Produkter först.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
