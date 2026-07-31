import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProductAction, toggleProductActiveAction } from "@/lib/actions/product-actions";
import {
  createSupplierProductAction,
  deleteSupplierProductAction,
} from "@/lib/actions/supplier-product-actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-800";
const labelClass = "mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const productId = Number(id);

  const [product, categories, brands, suppliers] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { supplierProducts: { include: { supplier: true } } },
    }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) {
    notFound();
  }

  const updateAction = updateProductAction.bind(null, product.id);
  const addSupplierLinkAction = createSupplierProductAction.bind(null, product.id);

  // Leverantörer som redan är kopplade ska inte gå att välja igen
  // (@@unique([productId, supplierId]) i schemat förhindrar det ändå,
  // men vi filtrerar bort dem här för ett tydligare formulär).
  const linkedSupplierIds = new Set(product.supplierProducts.map((sp) => sp.supplierId));
  const availableSuppliers = suppliers.filter((s) => !linkedSupplierIds.has(s.id));

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <Link
          href="/products"
          className="mb-4 inline-block text-sm text-neutral-500 hover:underline"
        >
          ← Tillbaka till produkter
        </Link>

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Redigera produkt
          </h1>
          <form action={toggleProductActiveAction.bind(null, product.id, !product.active)}>
            <button type="submit" className="text-sm text-neutral-500 hover:underline">
              {product.active ? "Inaktivera" : "Aktivera"}
            </button>
          </form>
        </div>

        {saved === "true" && (
          <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Sparat.
          </p>
        )}

        <form action={updateAction} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="name">
              Produktnamn
            </label>
            <input id="name" name="name" required defaultValue={product.name} className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="barcode">
              Streckkod (valfritt)
            </label>
            <input
              id="barcode"
              name="barcode"
              defaultValue={product.barcode ?? ""}
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
                defaultValue={product.categoryId ?? ""}
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
                defaultValue={product.brandId ?? ""}
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
                defaultValue={product.minStockLevel ?? ""}
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
                defaultValue={product.normalOrderQuantity ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Spara
            </button>
            <Link href="/products/new" className="text-sm text-neutral-500 hover:underline">
              + Ny produkt
            </Link>
          </div>
        </form>
      </div>

      <div className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
          Leverantörskopplingar
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Samma produkt kan köpas från flera leverantörer, var och en med sitt eget namn och
          artikelnummer.
        </p>

        {error === "leverantor-redan-kopplad" && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Produkten är redan kopplad till den leverantören.
          </p>
        )}

        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {product.supplierProducts.map((sp) => (
            <li key={sp.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                  {sp.supplier.name}
                </span>
                {sp.supplierArticleNumber && (
                  <span className="ml-2 text-neutral-400">Art.nr: {sp.supplierArticleNumber}</span>
                )}
              </div>
              <form
                action={deleteSupplierProductAction.bind(null, product.id, sp.id)}
              >
                <button type="submit" className="text-neutral-500 hover:underline">
                  Ta bort koppling
                </button>
              </form>
            </li>
          ))}
          {product.supplierProducts.length === 0 && (
            <li className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
              Inga leverantörskopplingar ännu.
            </li>
          )}
        </ul>

        {availableSuppliers.length > 0 ? (
          <form action={addSupplierLinkAction} className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div>
              <label className={labelClass} htmlFor="supplierId">
                Leverantör
              </label>
              <select id="supplierId" name="supplierId" required className={inputClass}>
                <option value="">Välj leverantör...</option>
                {availableSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="supplierArticleNumber">
                  Leverantörens artikelnummer
                </label>
                <input id="supplierArticleNumber" name="supplierArticleNumber" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="supplierProductName">
                  Leverantörens produktnamn
                </label>
                <input id="supplierProductName" name="supplierProductName" className={inputClass} />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Koppla leverantör
            </button>
          </form>
        ) : (
          <p className="text-sm text-neutral-400">
            Alla aktiva leverantörer är redan kopplade till den här produkten.
          </p>
        )}
      </div>
    </div>
  );
}
