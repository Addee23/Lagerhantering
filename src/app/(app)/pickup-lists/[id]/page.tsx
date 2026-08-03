import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveStaffMembers } from "@/lib/actions/staff-actions";
import { getAvailableStock } from "@/lib/stock";
import { StaffPinFields } from "@/components/StaffPinFields";
import {
  addPickupListItemAction,
  removePickupListItemAction,
  updatePickupListCommentAction,
  markListReadyAction,
  cancelPickupListAction,
  markItemPickedAction,
  completePickupListAction,
} from "@/lib/actions/pickup-list-actions";
import { inputClass, labelClass } from "@/lib/form-styles";
import { Alert } from "@/components/Alert";
import { StatusBadge } from "@/components/StatusBadge";

const STATUS_LABELS: Record<string, string> = {
  UTKAST: "Utkast",
  KLAR_ATT_HAMTA: "Klar att hämta",
  HAMTNING_PAGAR: "Hämtning pågår",
  SLUTFORD: "Slutförd",
  AVBRUTEN: "Avbruten",
};

export default async function PickupListDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; pinError?: string }>;
}) {
  const { id } = await params;
  const { error, pinError } = await searchParams;
  const pickupListId = Number(id);

  const list = await prisma.pickupList.findUnique({
    where: { id: pickupListId },
    include: {
      items: { include: { product: true }, orderBy: { id: "asc" } },
      completedByStaffMember: { select: { name: true } },
    },
  });

  if (!list) {
    notFound();
  }

  const isDraft = list.status === "UTKAST";
  const isPicking = list.status === "KLAR_ATT_HAMTA" || list.status === "HAMTNING_PAGAR";
  const isFinished = list.status === "SLUTFORD" || list.status === "AVBRUTEN";

  const [staffMembers, products] = await Promise.all([
    getActiveStaffMembers(),
    isDraft
      ? prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  // Extra info per rad (tillgängligt saldo + tidigaste bäst före-datum),
  // enligt hämtlistans kolumner i skills/stock-and-pickup-rules.md.
  const itemDetails = await Promise.all(
    list.items.map(async (item) => {
      const [available, earliestBatch] = await Promise.all([
        getAvailableStock(item.productId),
        prisma.stockBatch.findFirst({
          where: { productId: item.productId, quantity: { gt: 0 }, expiryDate: { not: null } },
          orderBy: { expiryDate: "asc" },
        }),
      ]);
      return { item, available, earliestExpiry: earliestBatch?.expiryDate ?? null };
    }),
  );

  const allItemsPicked = list.items.length > 0 && list.items.every((item) => item.pickedAt);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/pickup-lists" className="mb-4 inline-block text-sm text-neutral-500 hover:underline">
          ← Tillbaka till hämtlistor
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Hämtlista #{list.id}
          </h1>
          <StatusBadge tone="neutral">{STATUS_LABELS[list.status]}</StatusBadge>
        </div>

        {pinError && (
          <div className="mt-3">
            <Alert tone="error">{pinError}</Alert>
          </div>
        )}
        {error === "alla-rader-maste-hanteras" && (
          <div className="mt-3">
            <Alert tone="error">Alla rader måste markeras som hämtade innan listan kan slutföras.</Alert>
          </div>
        )}
      </div>

      {isDraft && (
        <form action={updatePickupListCommentAction.bind(null, list.id)} className="space-y-2">
          <label className={labelClass} htmlFor="comment">
            Kommentar till listan (valfritt)
          </label>
          <div className="flex gap-2">
            <input id="comment" name="comment" defaultValue={list.comment ?? ""} className={inputClass} />
            <button type="submit" className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">
              Spara
            </button>
          </div>
        </form>
      )}
      {!isDraft && list.comment && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Kommentar: {list.comment}</p>
      )}

      <div className="space-y-4">
        <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Produkter</h2>

        <ul className="space-y-3">
          {itemDetails.map(({ item, available, earliestExpiry }) => (
            <li key={item.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-50">
                  {item.product.name}
                  {isPicking && (
                    <StatusBadge tone={item.pickedAt ? "success" : "warning"}>
                      {item.pickedAt ? "Hämtad" : "Ej hämtad än"}
                    </StatusBadge>
                  )}
                </span>
                {isDraft && (
                  <form action={removePickupListItemAction.bind(null, list.id, item.id)}>
                    <button type="submit" className="text-neutral-400 hover:underline">
                      Ta bort
                    </button>
                  </form>
                )}
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Ska hämtas: {item.requestedQuantity} flak/pall · Tillgängligt: {available} flak/pall
                {earliestExpiry && ` · Bäst före ${earliestExpiry.toLocaleDateString("sv-SE")}`}
              </p>

              {isPicking && !item.pickedAt && (
                <form
                  action={markItemPickedAction.bind(null, list.id, item.id)}
                  className="mt-3 space-y-2 rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass} htmlFor={`actualQuantity-${item.id}`}>
                        Faktiskt hämtat antal
                      </label>
                      <input
                        id={`actualQuantity-${item.id}`}
                        name="actualQuantity"
                        type="number"
                        min={0}
                        defaultValue={item.requestedQuantity}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-end gap-4">
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" name="isMissing" value="true" /> Saknades helt
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" name="isPartial" value="true" /> Bara delvis
                      </label>
                    </div>
                  </div>
                  <input name="comment" placeholder="Kommentar (valfritt)" className={inputClass} />
                  <button
                    type="submit"
                    className="w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
                  >
                    Markera rad som hämtad
                  </button>
                </form>
              )}

              {item.pickedAt && (
                <p className="mt-2 text-xs text-green-700 dark:text-green-400">
                  Hämtad: {item.actualQuantity} flak/pall
                  {item.isMissing && " (saknades helt)"}
                  {item.isPartial && " (bara delvis)"}
                  {item.comment && ` – ${item.comment}`}
                </p>
              )}
            </li>
          ))}
          {list.items.length === 0 && (
            <li className="text-sm text-neutral-500 dark:text-neutral-400">
              Inga produkter tillagda ännu.
            </li>
          )}
        </ul>
      </div>

      {isDraft && (
        <form
          action={addPickupListItemAction.bind(null, list.id)}
          className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Lägg till produkt</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="productId">
                Produkt
              </label>
              <select id="productId" name="productId" required className={inputClass}>
                <option value="">Välj produkt...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="requestedQuantity">
                Antal flak/pall att hämta
              </label>
              <input
                id="requestedQuantity"
                name="requestedQuantity"
                type="number"
                min={1}
                required
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
          >
            Lägg till i listan
          </button>
        </form>
      )}

      {isDraft && (
        <div className="flex items-center gap-4">
          <form action={markListReadyAction.bind(null, list.id)}>
            <button
              type="submit"
              disabled={list.items.length === 0}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
            >
              Markera som klar att hämta
            </button>
          </form>
          <form action={cancelPickupListAction.bind(null, list.id)}>
            <button type="submit" className="text-sm text-neutral-500 hover:underline">
              Avbryt lista
            </button>
          </form>
        </div>
      )}

      {isPicking && (
        <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="font-medium text-neutral-900 dark:text-neutral-50">
            Slutför hämtlista
          </h2>
          {!allItemsPicked && (
            <Alert tone="warning">
              ⚠️ Knappen nedan är inaktiverad tills alla rader ovan är markerade &quot;Hämtad&quot;.
              Klicka &quot;Markera rad som hämtad&quot; på varje produkt först.
            </Alert>
          )}
          <form action={completePickupListAction.bind(null, list.id)} className="space-y-3">
            <StaffPinFields staffMembers={staffMembers} />
            <button
              type="submit"
              disabled={!allItemsPicked}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
            >
              Slutför och flytta till butik
            </button>
          </form>
          <form action={cancelPickupListAction.bind(null, list.id)}>
            <button type="submit" className="text-sm text-neutral-500 hover:underline">
              Avbryt lista
            </button>
          </form>
        </div>
      )}

      {isFinished && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {list.status === "SLUTFORD"
            ? `Slutförd ${list.completedAt?.toLocaleString("sv-SE")} av ${
                list.completedByStaffMember?.name ?? "okänd"
              }.`
            : "Den här hämtlistan är avbruten."}
        </p>
      )}
    </div>
  );
}
