import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createProductAction } from "@/lib/actions/product-actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-800";
const labelClass = "mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300";

type SearchParams = {
  name?: string;
  barcode?: string;
  categoryId?: string;
  brandId?: string;
  minStockLevel?: string;
  normalOrderQuantity?: string;
  duplicateNames?: string;
};

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/products" className="inline-block text-sm text-neutral-500 hover:underline">
        ← Tillbaka till produkter
      </Link>

      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Ny produkt</h1>

      {params.duplicateNames && (
        <div className="space-y-2 rounded-md bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <p>
            Hittade en möjlig dubblett (samma streckkod eller liknande namn):{" "}
            <strong>{params.duplicateNames}</strong>.
          </p>
          <p>Du kan ändra uppgifterna ovan, eller skapa produkten ändå om det är avsiktligt.</p>
        </div>
      )}

      <form action={createProductAction} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="name">
            Produktnamn (Hela Rubbets eget namn)
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={params.name}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="barcode">
            Streckkod (valfritt)
          </label>
          <input
            id="barcode"
            name="barcode"
            defaultValue={params.barcode}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="categoryId">
              Kategori
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={params.categoryId ?? ""}
              className={inputClass}
            >
              <option value="">Ingen</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="brandId">
              Varumärke
            </label>
            <select
              id="brandId"
              name="brandId"
              defaultValue={params.brandId ?? ""}
              className={inputClass}
            >
              <option value="">Inget</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="minStockLevel">
              Lägsta önskade lagersaldo (flak/pall)
            </label>
            <input
              id="minStockLevel"
              name="minStockLevel"
              type="number"
              min={0}
              defaultValue={params.minStockLevel}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="normalOrderQuantity">
              Normalt beställningsantal (flak/pall)
            </label>
            <input
              id="normalOrderQuantity"
              name="normalOrderQuantity"
              type="number"
              min={0}
              defaultValue={params.normalOrderQuantity}
              className={inputClass}
            />
          </div>
        </div>

        {params.duplicateNames && (
          <input type="hidden" name="confirmDuplicate" value="true" />
        )}

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          {params.duplicateNames ? "Skapa ändå" : "Skapa produkt"}
        </button>
      </form>
    </div>
  );
}
