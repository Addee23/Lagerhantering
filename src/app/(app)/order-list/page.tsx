import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  addOrderListItemAction,
  markOrderListItemOrderedAction,
  markOrderListItemReceivedAction,
  cancelOrderListItemAction,
} from "@/lib/actions/order-list-actions";
import { inputClass, labelClass } from "@/lib/form-styles";
import { StatusBadge } from "@/components/StatusBadge";

const PRIORITY_LABELS: Record<string, string> = { LAG: "Låg", NORMAL: "Normal", HOG: "Hög" };
const STATUS_LABELS: Record<string, string> = {
  ATT_BESTALLA: "Att beställa",
  BESTALLD: "Beställd",
  MOTTAGEN: "Mottagen",
  AVBRUTEN: "Avbruten",
};

function loadItems(showAll: boolean) {
  return prisma.orderListItem.findMany({
    where: showAll ? undefined : { status: { in: ["ATT_BESTALLA", "BESTALLD"] } },
    include: { product: true, supplier: true },
    orderBy: [{ createdAt: "asc" }],
  });
}

type OrderListItemWithRelations = Awaited<ReturnType<typeof loadItems>>[number];

function groupBySupplier(items: OrderListItemWithRelations[]) {
  // Nyckeln måste vara leverantörens id, inte namnet - Supplier.name har
  // ingen @unique-begränsning (till skillnad från Category/Brand), så två
  // leverantörer kan råka heta likadant. Grupperar man på namnet blir det
  // både en felaktig sammanslagning av grupperna OCH en dubblerad React-key
  // i listan nedan.
  const groups = new Map<
    string,
    { key: string; supplierName: string; items: OrderListItemWithRelations[] }
  >();

  for (const item of items) {
    const key = item.supplier ? `s${item.supplier.id}` : "unknown";
    const supplierName = item.supplier?.name ?? "Ingen leverantör vald";
    if (!groups.has(key)) groups.set(key, { key, supplierName, items: [] });
    groups.get(key)!.items.push(item);
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.supplierName === "Ingen leverantör vald") return 1;
    if (b.supplierName === "Ingen leverantör vald") return -1;
    return a.supplierName.localeCompare(b.supplierName, "sv");
  });
}

export default async function OrderListPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const { all } = await searchParams;
  const showAll = all === "1";

  const [items, products, suppliers] = await Promise.all([
    loadItems(showAll),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const groups = groupBySupplier(items);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Beställningslista
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          En manuell lista över vad butiken behöver beställa - systemet skickar aldrig något
          automatiskt till en leverantör (skills/business-rules.md). Beställ själva utanför
          systemet, markera sedan här vad som hänt.
        </p>
      </div>

      <details className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          + Lägg till produkt att beställa
        </summary>
        <form
          action={addOrderListItemAction}
          className="grid gap-4 border-t border-neutral-200 p-4 dark:border-neutral-800 sm:grid-cols-2"
        >
          <div>
            <label className={labelClass} htmlFor="productId">
              Produkt
            </label>
            <select id="productId" name="productId" required className={inputClass}>
              <option value="">Välj produkt...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="supplierId">
              Leverantör (valfritt)
            </label>
            <select id="supplierId" name="supplierId" className={inputClass}>
              <option value="">Vet inte / flera</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="quantity">
              Antal flak/pall (valfritt)
            </label>
            <input id="quantity" name="quantity" type="number" min={1} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="priority">
              Prioritet
            </label>
            <select id="priority" name="priority" defaultValue="NORMAL" className={inputClass}>
              <option value="LAG">Låg</option>
              <option value="NORMAL">Normal</option>
              <option value="HOG">Hög</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="reason">
              Orsak (valfritt)
            </label>
            <input
              id="reason"
              name="reason"
              placeholder="t.ex. Lågt saldo, kund efterfrågade"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Lägg till
            </button>
          </div>
        </form>
      </details>

      <div className="flex justify-end text-sm">
        <Link href={showAll ? "/order-list" : "/order-list?all=1"} className="text-neutral-500 hover:underline">
          {showAll ? "Visa bara aktiva" : "Visa alla (inkl. mottagna/avbrutna)"}
        </Link>
      </div>

      <div className="space-y-8">
        {groups.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Inget att beställa just nu.
          </p>
        )}
        {groups.map((group) => (
          <div key={group.key} className="space-y-3">
            <h2 className="font-medium text-neutral-900 dark:text-neutral-50">
              {group.supplierName}
            </h2>
            <ul className="space-y-3">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-neutral-900 dark:text-neutral-50">
                      {item.product.name}
                      {item.quantity ? ` · ${item.quantity} flak/pall` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={item.priority === "HOG" ? "error" : "neutral"}>
                        {PRIORITY_LABELS[item.priority]}
                      </StatusBadge>
                      <StatusBadge
                        tone={
                          item.status === "MOTTAGEN"
                            ? "success"
                            : item.status === "AVBRUTEN"
                              ? "neutral"
                              : item.status === "BESTALLD"
                                ? "warning"
                                : "neutral"
                        }
                      >
                        {STATUS_LABELS[item.status]}
                      </StatusBadge>
                    </div>
                  </div>
                  {item.reason && (
                    <p className="mt-1 text-xs text-neutral-400">{item.reason}</p>
                  )}

                  {(item.status === "ATT_BESTALLA" || item.status === "BESTALLD") && (
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      {item.status === "ATT_BESTALLA" && (
                        <form action={markOrderListItemOrderedAction.bind(null, item.id)}>
                          <button
                            type="submit"
                            className="rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
                          >
                            Markera beställd
                          </button>
                        </form>
                      )}
                      <form action={markOrderListItemReceivedAction.bind(null, item.id)}>
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700"
                        >
                          Markera mottagen
                        </button>
                      </form>
                      <form action={cancelOrderListItemAction.bind(null, item.id)}>
                        <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-500 dark:border-neutral-700">
                          Avbryt
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
