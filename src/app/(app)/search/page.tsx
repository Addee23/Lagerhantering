import Link from "next/link";
import { globalSearch } from "@/lib/search";
import { inputClass } from "@/lib/form-styles";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await globalSearch(query) : null;

  const totalResults = results
    ? results.products.length +
      results.suppliers.length +
      results.brands.length +
      results.deliveries.length +
      results.complaints.length
    : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Sök</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Sök på produktnamn, streckkod, leverantörens artikelnummer, varumärke, leverantör,
          faktura-/ordernummer eller reklamationsnummer (skills/ui-and-mobile-rules.md).
        </p>
      </div>

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Sök i hela systemet..."
          className={inputClass}
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Sök
        </button>
      </form>

      {!query && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Skriv minst två tecken för att söka.
        </p>
      )}

      {query && query.trim().length < 2 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Skriv minst två tecken för att söka.
        </p>
      )}

      {results && query.trim().length >= 2 && totalResults === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Inga träffar på &quot;{query}&quot;.
        </p>
      )}

      {results && results.products.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Produkter</h2>
          <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {results.products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}/edit`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <span className="text-neutral-900 dark:text-neutral-50">{product.name}</span>
                  {product.barcode && <span className="text-neutral-400">{product.barcode}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results && results.suppliers.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Leverantörer</h2>
          <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {results.suppliers.map((supplier) => (
              <li key={supplier.id}>
                <Link
                  href={`/suppliers/${supplier.id}/edit`}
                  className="block px-4 py-3 text-sm text-neutral-900 hover:bg-neutral-50 dark:text-neutral-50 dark:hover:bg-neutral-900"
                >
                  {supplier.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results && results.brands.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Varumärken</h2>
          <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {results.brands.map((brand) => (
              <li key={brand.id}>
                <Link
                  href="/brands"
                  className="block px-4 py-3 text-sm text-neutral-900 hover:bg-neutral-50 dark:text-neutral-50 dark:hover:bg-neutral-900"
                >
                  {brand.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results && results.deliveries.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Inleveranser</h2>
          <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {results.deliveries.map((delivery) => (
              <li key={delivery.id}>
                <Link
                  href={`/deliveries/${delivery.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <span className="text-neutral-900 dark:text-neutral-50">
                    Leverans #{delivery.id} - {delivery.supplier?.name ?? delivery.rawSupplierName ?? "Okänd leverantör"}
                  </span>
                  <span className="text-neutral-400">
                    {delivery.invoiceNumber && `Faktura ${delivery.invoiceNumber}`}
                    {delivery.orderNumber && ` Order ${delivery.orderNumber}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results && results.complaints.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Reklamationer</h2>
          <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {results.complaints.map((complaint) => (
              <li key={complaint.id}>
                <Link
                  href={`/complaints/${complaint.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <span className="text-neutral-900 dark:text-neutral-50">{complaint.complaintNumber}</span>
                  <span className="text-neutral-400">{complaint.supplier.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
