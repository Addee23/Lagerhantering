import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createDeliveryAction } from "@/lib/actions/delivery-actions";
import { inputClass, labelClass } from "@/lib/form-styles";

export default async function NewDeliveryPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/deliveries" className="inline-block text-sm text-neutral-500 hover:underline">
        ← Tillbaka till inleveranser
      </Link>

      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Ny leverans</h1>

      {suppliers.length === 0 ? (
        <p className="text-sm text-safety-600 dark:text-safety-400">
          Inga leverantörer finns än.{" "}
          <Link href="/suppliers" className="underline">
            Skapa en leverantör
          </Link>{" "}
          först.
        </p>
      ) : (
        <form action={createDeliveryAction} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="supplierId">
              Leverantör
            </label>
            <select id="supplierId" name="supplierId" required className={inputClass}>
              <option value="">Välj leverantör...</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="deliveryDate">
                Leveransdatum
              </label>
              <input id="deliveryDate" name="deliveryDate" type="date" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="orderNumber">
                Ordernummer
              </label>
              <input id="orderNumber" name="orderNumber" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="invoiceNumber">
                Fakturanummer
              </label>
              <input id="invoiceNumber" name="invoiceNumber" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="comment">
              Kommentar (valfritt)
            </label>
            <input id="comment" name="comment" className={inputClass} />
          </div>

          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Skapa leverans
          </button>
        </form>
      )}
    </div>
  );
}
