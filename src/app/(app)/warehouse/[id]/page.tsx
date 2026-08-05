import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveStaffMembers } from "@/lib/actions/staff-actions";
import { StaffPinFields } from "@/components/StaffPinFields";
import {
  receiveStockAction,
  correctStockBatchAction,
  discardStockBatchAction,
} from "@/lib/actions/warehouse-actions";
import { inputClass, labelClass } from "@/lib/form-styles";
import { Alert } from "@/components/Alert";

export default async function WarehouseProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pinError?: string }>;
}) {
  const { id } = await params;
  const { pinError } = await searchParams;
  const productId = Number(id);

  const [product, staffMembers, movements] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { stockBatches: { orderBy: { createdAt: "asc" } } },
    }),
    getActiveStaffMembers(),
    prisma.stockMovement.findMany({
      where: { productId },
      include: { staffMember: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!product) {
    notFound();
  }

  const totalQuantity = product.stockBatches.reduce((sum, batch) => sum + batch.quantity, 0);
  const activeBatches = product.stockBatches.filter((batch) => batch.quantity > 0);

  const receiveAction = receiveStockAction.bind(null, product.id);

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <Link href="/warehouse" className="mb-4 inline-block text-sm text-neutral-500 hover:underline">
          ← Tillbaka till lager
        </Link>

        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          {product.name}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Totalt lagersaldo: <span className="font-medium">{totalQuantity} flak/pall</span>
          {product.minStockLevel != null && ` (lägsta önskade: ${product.minStockLevel})`}
        </p>

        {pinError && (
          <div className="mt-3">
            <Alert tone="error">{pinError}</Alert>
          </div>
        )}
      </div>

      <details className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          + Ta emot lagerparti
        </summary>
        <form action={receiveAction} className="space-y-3 border-t border-neutral-200 p-4 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="quantity">
                Antal flak/pall
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="expiryDate">
                Bäst före-datum (valfritt)
              </label>
              <input id="expiryDate" name="expiryDate" type="date" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="note">
              Kommentar (valfritt)
            </label>
            <input id="note" name="note" className={inputClass} />
          </div>
          <StaffPinFields staffMembers={staffMembers} />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Bekräfta mottagning
          </button>
        </form>
      </details>

      <div className="space-y-4">
        <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Lagerpartier</h2>
        {activeBatches.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Inga aktiva lagerpartier - ta emot ett ovan.
          </p>
        ) : (
          <ul className="space-y-4">
            {activeBatches.map((batch) => (
              <li key={batch.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">
                    {batch.quantity} flak/pall
                  </span>
                  <span className="text-neutral-400">
                    {batch.expiryDate
                      ? `Bäst före ${batch.expiryDate.toLocaleDateString("sv-SE")}`
                      : "Inget bäst före-datum"}
                  </span>
                </div>

                <details className="text-sm">
                  <summary className="cursor-pointer text-neutral-500 hover:underline">
                    Korrigera eller kassera
                  </summary>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <form
                      action={correctStockBatchAction.bind(null, product.id, batch.id)}
                      className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                    >
                      <p className="text-xs font-medium text-neutral-500">Korrigera antal</p>
                      <input
                        name="newQuantity"
                        type="number"
                        min={0}
                        defaultValue={batch.quantity}
                        required
                        className={inputClass}
                      />
                      <input name="reason" placeholder="Anledning (valfritt)" className={inputClass} />
                      <StaffPinFields staffMembers={staffMembers} />
                      <button
                        type="submit"
                        className="w-full rounded-md border border-neutral-300 py-2 text-sm font-medium dark:border-neutral-700"
                      >
                        Spara korrigering
                      </button>
                    </form>

                    <form
                      action={discardStockBatchAction.bind(null, product.id, batch.id)}
                      className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                    >
                      <p className="text-xs font-medium text-neutral-500">Kassera antal</p>
                      <input
                        name="quantityToDiscard"
                        type="number"
                        min={1}
                        max={batch.quantity}
                        required
                        className={inputClass}
                      />
                      <input name="reason" placeholder="Anledning" required className={inputClass} />
                      <StaffPinFields staffMembers={staffMembers} />
                      <button
                        type="submit"
                        className="w-full rounded-md border border-red-300 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:text-red-400"
                      >
                        Kassera
                      </button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Historik</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Inga händelser ännu.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {movements.map((movement) => (
              <li
                key={movement.id}
                className="flex items-center justify-between border-b border-neutral-100 pb-2 last:border-0 dark:border-neutral-800"
              >
                <span>
                  {movement.changeType} ({movement.quantityDelta > 0 ? "+" : ""}
                  {movement.quantityDelta})
                  {movement.reason && (
                    <span className="text-neutral-400"> – {movement.reason}</span>
                  )}
                </span>
                <span className="text-xs text-neutral-400">
                  {movement.staffMember?.name ?? "Okänd"} ·{" "}
                  {movement.createdAt.toLocaleString("sv-SE")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
