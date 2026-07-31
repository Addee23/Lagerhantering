import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleProductActiveAction } from "@/lib/actions/product-actions";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  // skills/ui-and-mobile-rules.md: sökning ska täcka bl.a. produktnamn,
  // streckkod och leverantörens artikelnummer.
  const products = await prisma.product.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { barcode: { contains: query } },
            { supplierProducts: { some: { supplierArticleNumber: { contains: query } } } },
          ],
        }
      : undefined,
    include: { category: true, brand: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Produkter</h1>
        <Link
          href="/products/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Ny produkt
        </Link>
      </div>

      <form className="flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Sök på namn, streckkod eller leverantörsartikelnummer..."
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-800"
        />
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
        >
          Sök
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-2 font-medium">Namn</th>
              <th className="px-4 py-2 font-medium">Streckkod</th>
              <th className="px-4 py-2 font-medium">Kategori</th>
              <th className="px-4 py-2 font-medium">Varumärke</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
              >
                <td className="px-4 py-2">{product.name}</td>
                <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                  {product.barcode ?? "–"}
                </td>
                <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                  {product.category?.name ?? "–"}
                </td>
                <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                  {product.brand?.name ?? "–"}
                </td>
                <td className="px-4 py-2">
                  {product.active ? "Aktiv" : "Inaktiv"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="text-neutral-500 hover:underline"
                    >
                      Redigera
                    </Link>
                    <form
                      action={toggleProductActiveAction.bind(null, product.id, !product.active)}
                    >
                      <button type="submit" className="text-neutral-500 hover:underline">
                        {product.active ? "Inaktivera" : "Aktivera"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                  {query ? "Inga produkter matchade sökningen." : "Inga produkter ännu."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
