import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveStaffMembers } from "@/lib/actions/staff-actions";
import { StaffPinFields } from "@/components/StaffPinFields";
import {
  resolveExpiryRecordAction,
  updateExpiryRecordPlacementAction,
} from "@/lib/actions/expiry-actions";
import { inputClass, labelClass } from "@/lib/form-styles";
import { Alert } from "@/components/Alert";
import { StatusBadge } from "@/components/StatusBadge";

const RESOLUTION_LABELS: Record<string, string> = {
  slut: "Slut",
  flyttad: "Flyttad",
  kasserad: "Kasserad",
  utgangen: "Kasserad (utgången)",
};

// Egen (icke-komponent) funktion så att Date.now() inte anropas direkt i
// render-kroppen (react-hooks/purity-regeln, se samma mönster i
// deliveries/[id]/page.tsx).
function daysUntil(date: Date | null, now: number): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - now) / (1000 * 60 * 60 * 24));
}

// Bygger en /expiry-länk som behåller alla nuvarande filter förutom de som
// uttryckligen skrivs över - annars nollställer snabbfiltren (7/14/30 dagar)
// resten av filtren varje gång man klickar på ett.
function buildFilterHref(
  sp: Record<string, string | undefined>,
  overrides: Record<string, string>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "error" || key === "pinError" || !value) continue;
    params.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    params.set(key, value);
  }
  return `/expiry?${params.toString()}`;
}

type ExpiryRow = {
  key: string;
  location: "BUTIK" | "LAGER";
  id: number;
  productId: number;
  productName: string;
  categoryId: number | null;
  brandId: number | null;
  supplierIds: number[];
  expiryDate: Date | null;
  quantity: number;
  placement: string | null;
  status: "AKTIV" | "AVSLUTAD";
  lastCheckedAt: Date | null;
  resolution: string | null;
  resolvedByName: string | null;
};

function loadExpiryRecords() {
  return prisma.expiryRecord.findMany({
    include: {
      product: { include: { supplierProducts: { select: { supplierId: true } } } },
      resolvedByStaffMember: { select: { name: true } },
    },
  });
}

function loadStockBatches() {
  return prisma.stockBatch.findMany({
    where: { quantity: { gt: 0 }, expiryDate: { not: null } },
    include: { product: { include: { supplierProducts: { select: { supplierId: true } } } } },
  });
}

function buildRows(params: {
  expiryRecords: Awaited<ReturnType<typeof loadExpiryRecords>>;
  stockBatches: Awaited<ReturnType<typeof loadStockBatches>>;
}): { rows: ExpiryRow[]; placements: string[] } {
  const rows: ExpiryRow[] = [];
  const placements = new Set<string>();

  for (const record of params.expiryRecords) {
    if (record.placement) placements.add(record.placement);
    rows.push({
      key: `butik-${record.id}`,
      location: "BUTIK",
      id: record.id,
      productId: record.productId,
      productName: record.product.name,
      categoryId: record.product.categoryId,
      brandId: record.product.brandId,
      supplierIds: record.product.supplierProducts.map((sp) => sp.supplierId),
      expiryDate: record.expiryDate,
      quantity: record.quantityRemaining,
      placement: record.placement,
      status: record.status,
      lastCheckedAt: record.lastCheckedAt,
      resolution: record.resolution,
      resolvedByName: record.resolvedByStaffMember?.name ?? null,
    });
  }

  for (const batch of params.stockBatches) {
    rows.push({
      key: `lager-${batch.id}`,
      location: "LAGER",
      id: batch.id,
      productId: batch.productId,
      productName: batch.product.name,
      categoryId: batch.product.categoryId,
      brandId: batch.product.brandId,
      supplierIds: batch.product.supplierProducts.map((sp) => sp.supplierId),
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      placement: null,
      status: "AKTIV",
      lastCheckedAt: null,
      resolution: null,
      resolvedByName: null,
    });
  }

  rows.sort((a, b) => {
    if (a.expiryDate && b.expiryDate) return a.expiryDate.getTime() - b.expiryDate.getTime();
    if (a.expiryDate) return -1;
    if (b.expiryDate) return 1;
    return 0;
  });

  return { rows, placements: Array.from(placements).sort() };
}

// Egen (icke-komponent) funktion så att Date.now() inte anropas direkt i
// render-kroppen (react-hooks/purity-regeln).
function filterRows(
  allRows: ExpiryRow[],
  filters: {
    days: string;
    dateFrom: string;
    dateTo: string;
    categoryId: string;
    brandId: string;
    supplierId: string;
    productId: string;
    location: string;
    placementFilter: string;
    status: string;
    expiredOnly: boolean;
  },
): { rows: ExpiryRow[]; now: number } {
  const now = Date.now();
  const {
    days,
    dateFrom,
    dateTo,
    categoryId,
    brandId,
    supplierId,
    productId,
    location,
    placementFilter,
    status,
    expiredOnly,
  } = filters;

  const rows = allRows.filter((row) => {
    if (days && days !== "alla") {
      const limit = Number(days);
      const remaining = daysUntil(row.expiryDate, now);
      if (remaining == null || remaining > limit) return false;
    }
    if (dateFrom && (!row.expiryDate || row.expiryDate < new Date(dateFrom))) return false;
    if (dateTo && (!row.expiryDate || row.expiryDate > new Date(dateTo))) return false;
    if (categoryId && row.categoryId !== Number(categoryId)) return false;
    if (brandId && row.brandId !== Number(brandId)) return false;
    if (supplierId && !row.supplierIds.includes(Number(supplierId))) return false;
    if (productId && row.productId !== Number(productId)) return false;
    if (location && row.location !== location) return false;
    if (placementFilter && !row.placement?.toLowerCase().includes(placementFilter.toLowerCase()))
      return false;
    if (status && row.status !== status) return false;
    if (expiredOnly) {
      const remaining = daysUntil(row.expiryDate, now);
      if (remaining == null || remaining >= 0 || row.status !== "AKTIV") return false;
    }
    return true;
  });

  return { rows, now };
}

export default async function ExpiryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const error = sp.error;
  const pinError = sp.pinError;

  const [expiryRecords, stockBatches, categories, brands, suppliers, products, staffMembers] =
    await Promise.all([
      loadExpiryRecords(),
      loadStockBatches(),
      prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      getActiveStaffMembers(),
    ]);

  const { rows: allRows, placements } = buildRows({ expiryRecords, stockBatches });

  // skills/expiry-rules.md: standardfilter är "går ut inom 30 dagar" om inget
  // annat filter valts explicit.
  const hasAnyDateFilter = Boolean(sp.days || sp.dateFrom || sp.dateTo);
  const days = sp.days ?? (hasAnyDateFilter ? "" : "30");
  const dateFrom = sp.dateFrom ?? "";
  const dateTo = sp.dateTo ?? "";
  const categoryId = sp.categoryId ?? "";
  const brandId = sp.brandId ?? "";
  const supplierId = sp.supplierId ?? "";
  const productId = sp.productId ?? "";
  const location = sp.location ?? "";
  const placementFilter = sp.placement ?? "";
  const status = sp.status ?? "AKTIV";
  const expiredOnly = sp.expired === "1";

  const { rows, now } = filterRows(allRows, {
    days,
    dateFrom,
    dateTo,
    categoryId,
    brandId,
    supplierId,
    productId,
    location,
    placementFilter,
    status,
    expiredOnly,
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Bäst före</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Butiken saknar exakt löpande saldo - här hanteras ungefärligt antal kvar per bäst
          före-parti (skills/business-rules.md, punkt 3). Lagrets partier visas också, men hanteras
          fortfarande på lagersidan.
        </p>
      </div>

      {error && <Alert tone="error">{decodeURIComponent(error)}</Alert>}
      {pinError && <Alert tone="error">{decodeURIComponent(pinError)}</Alert>}

      <div className="flex flex-wrap gap-2 text-sm">
        {["7", "14", "30", "60", "90", "alla"].map((d) => (
          <Link
            key={d}
            href={buildFilterHref(sp, { days: d })}
            className={`rounded-md border px-3 py-1.5 ${
              days === d
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "border-neutral-300 dark:border-neutral-700"
            }`}
          >
            {d === "alla" ? "Alla" : `${d} dagar`}
          </Link>
        ))}
      </div>

      <datalist id="placement-suggestions">
        {placements.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <details className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          + Filtrera
        </summary>
        <form method="get" className="grid gap-4 border-t border-neutral-200 p-4 dark:border-neutral-800 sm:grid-cols-3">
        {/* Bevarar aktivt snabbfilter (7/14/30 dagar) när formuläret nedan skickas in. */}
        <input type="hidden" name="days" value={days} />
        <div>
          <label className={labelClass} htmlFor="categoryId">Kategori</label>
          <select id="categoryId" name="categoryId" defaultValue={categoryId} className={inputClass}>
            <option value="">Alla</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="brandId">Varumärke</label>
          <select id="brandId" name="brandId" defaultValue={brandId} className={inputClass}>
            <option value="">Alla</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="supplierId">Leverantör</label>
          <select id="supplierId" name="supplierId" defaultValue={supplierId} className={inputClass}>
            <option value="">Alla</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="productId">Produkt</label>
          <select id="productId" name="productId" defaultValue={productId} className={inputClass}>
            <option value="">Alla</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="location">Plats</label>
          <select id="location" name="location" defaultValue={location} className={inputClass}>
            <option value="">Butik och lager</option>
            <option value="BUTIK">Butik</option>
            <option value="LAGER">Lager</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="placement">Placering i butiken</label>
          <input
            id="placement"
            name="placement"
            defaultValue={placementFilter}
            list="placement-suggestions"
            placeholder="t.ex. Kyl 1"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status} className={inputClass}>
            <option value="AKTIV">Aktiv</option>
            <option value="AVSLUTAD">Avslutad</option>
            <option value="">Alla</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="dateFrom">Från datum</label>
          <input id="dateFrom" name="dateFrom" type="date" defaultValue={dateFrom} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="dateTo">Till datum</label>
          <input id="dateTo" name="dateTo" type="date" defaultValue={dateTo} className={inputClass} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="expired" value="1" defaultChecked={expiredOnly} /> Endast
          utgångna
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Filtrera
          </button>
        </div>
        </form>
      </details>

      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Inga bäst före-poster matchar filtret.
          </p>
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => {
              const remaining = daysUntil(row.expiryDate, now);
              const isExpired = row.status === "AKTIV" && remaining != null && remaining < 0;

              return (
                <li key={row.key} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-neutral-900 dark:text-neutral-50">
                      {row.productName}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={row.location === "BUTIK" ? "neutral" : "warning"}>
                        {row.location === "BUTIK" ? "Butik" : "Lager"}
                      </StatusBadge>
                      {row.status === "AVSLUTAD" && (
                        <StatusBadge tone="neutral">
                          {row.resolution ? RESOLUTION_LABELS[row.resolution] ?? row.resolution : "Avslutad"}
                        </StatusBadge>
                      )}
                      {isExpired && <StatusBadge tone="error">Utgången</StatusBadge>}
                    </div>
                  </div>

                  <p className="mt-1 text-xs text-neutral-400">
                    {row.quantity} flak/pall
                    {row.expiryDate
                      ? ` · Bäst före ${row.expiryDate.toLocaleDateString("sv-SE")}${
                          remaining != null ? ` (${remaining} dagar)` : ""
                        }`
                      : " · Inget bäst före-datum"}
                    {row.placement ? ` · ${row.placement}` : ""}
                    {row.lastCheckedAt
                      ? ` · Senast kontrollerad ${row.lastCheckedAt.toLocaleDateString("sv-SE")}`
                      : ""}
                    {row.resolvedByName ? ` · Av ${row.resolvedByName}` : ""}
                  </p>

                  {row.location === "LAGER" && (
                    <Link
                      href={`/warehouse/${row.productId}`}
                      className="mt-2 inline-block text-xs text-neutral-500 hover:underline"
                    >
                      Hantera i lager →
                    </Link>
                  )}

                  {row.location === "BUTIK" && row.status === "AKTIV" && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer text-neutral-500 hover:underline">
                        Hantera post
                      </summary>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <form
                          action={updateExpiryRecordPlacementAction.bind(null, row.id)}
                          className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                        >
                          <p className="text-xs font-medium text-neutral-500">Placering</p>
                          <input
                            name="placement"
                            defaultValue={row.placement ?? ""}
                            list="placement-suggestions"
                            placeholder="t.ex. Kyl 1"
                            className={inputClass}
                          />
                          <button
                            type="submit"
                            className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700"
                          >
                            Spara placering
                          </button>
                        </form>

                        <form
                          action={resolveExpiryRecordAction.bind(null, row.id)}
                          className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                        >
                          <input type="hidden" name="decision" value="uppdatera_antal" />
                          <p className="text-xs font-medium text-neutral-500">Uppdatera antal kvar</p>
                          <input
                            name="quantityRemaining"
                            type="number"
                            min={0}
                            defaultValue={row.quantity}
                            required
                            className={inputClass}
                          />
                          <button
                            type="submit"
                            className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700"
                          >
                            Spara antal
                          </button>
                        </form>

                        <form action={resolveExpiryRecordAction.bind(null, row.id)}>
                          <input type="hidden" name="decision" value="kontrollerad" />
                          <button
                            type="submit"
                            className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700"
                          >
                            Markera kontrollerad
                          </button>
                        </form>

                        <div className="grid grid-cols-2 gap-2">
                          <form action={resolveExpiryRecordAction.bind(null, row.id)}>
                            <input type="hidden" name="decision" value="slut" />
                            <button
                              type="submit"
                              className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700"
                            >
                              Slut
                            </button>
                          </form>
                          <form action={resolveExpiryRecordAction.bind(null, row.id)}>
                            <input type="hidden" name="decision" value="flyttad" />
                            <button
                              type="submit"
                              className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700"
                            >
                              Flyttad
                            </button>
                          </form>
                        </div>

                        <form
                          action={resolveExpiryRecordAction.bind(null, row.id)}
                          className="space-y-2 rounded-md border border-red-300 p-3 dark:border-red-800 sm:col-span-2"
                        >
                          <input type="hidden" name="decision" value={isExpired ? "utgangen" : "kasserad"} />
                          <p className="text-xs font-medium text-red-700 dark:text-red-400">
                            {isExpired
                              ? "Bäst före-datumet har passerat - kassera det som är kvar"
                              : "Kassera"}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              name="discardedQuantity"
                              type="number"
                              min={1}
                              max={row.quantity}
                              placeholder="Antal att kassera"
                              required
                              className={inputClass}
                            />
                            <input name="comment" placeholder="Anledning/kommentar" className={inputClass} />
                          </div>
                          <StaffPinFields staffMembers={staffMembers} />
                          <button
                            type="submit"
                            className="w-full rounded-md border border-red-300 py-1.5 text-sm font-medium text-red-700 dark:border-red-800 dark:text-red-400"
                          >
                            Kassera
                          </button>
                        </form>
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
