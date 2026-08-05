import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Egen (icke-komponent) funktion så att Date.now() (för 30-dagarsgränsen)
// inte anropas direkt i render-kroppen (react-hooks/purity-regeln, se samma
// mönster i deliveries/[id]/page.tsx och expiry/page.tsx).
async function loadDashboardCounts() {
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [
    activePickupLists,
    productsWithMinStock,
    expiringExpiryRecords,
    expiringStockBatches,
    expiredExpiryRecords,
    expiredStockBatches,
    deliveriesToApprove,
    unlinkedDocumentRows,
    complaintsAwaitingReply,
    unmatchedEmails,
    productsToOrder,
  ] = await Promise.all([
    prisma.pickupList.count({
      where: { status: { in: ["UTKAST", "KLAR_ATT_HAMTA", "HAMTNING_PAGAR"] } },
    }),
    prisma.product.findMany({
      where: { active: true, minStockLevel: { not: null } },
      select: { minStockLevel: true, stockBatches: { select: { quantity: true } } },
    }),
    prisma.expiryRecord.count({ where: { status: "AKTIV", expiryDate: { lte: in30Days } } }),
    prisma.stockBatch.count({ where: { quantity: { gt: 0 }, expiryDate: { lte: in30Days } } }),
    // skills/ui-and-mobile-rules.md, Dashboard: "utgångna produkter" är sitt
    // eget, mer akuta kort - datumet har redan passerat, inte bara inom 30
    // dagar.
    prisma.expiryRecord.count({ where: { status: "AKTIV", expiryDate: { lt: new Date() } } }),
    prisma.stockBatch.count({ where: { quantity: { gt: 0 }, expiryDate: { lt: new Date() } } }),
    prisma.delivery.count({ where: { status: "UTKAST" } }),
    // "Okopplade dokumentrader" - AI-tolkade leveransrader som ännu inte är
    // säkert kopplade till en produkt (skills/delivery-and-ai-rules.md, 12.5).
    prisma.deliveryItem.count({ where: { matchStatus: { in: ["SUGGESTED", "UNMATCHED"] } } }),
    prisma.complaint.count({ where: { status: "VANTAR_PA_SVAR" } }),
    prisma.unmatchedEmail.count({ where: { status: "OMATCHAD" } }),
    prisma.orderListItem.count({ where: { status: "ATT_BESTALLA" } }),
  ]);

  const lowStockCount = productsWithMinStock.filter((p) => {
    const total = p.stockBatches.reduce((sum, b) => sum + b.quantity, 0);
    return total < (p.minStockLevel ?? 0);
  }).length;

  return {
    activePickupLists,
    lowStockCount,
    expiringSoon: expiringExpiryRecords + expiringStockBatches,
    expired: expiredExpiryRecords + expiredStockBatches,
    deliveriesToApprove,
    unlinkedDocumentRows,
    complaintsAwaitingReply,
    unmatchedEmails,
    productsToOrder,
  };
}

type Counts = Awaited<ReturnType<typeof loadDashboardCounts>>;
type MetricRow = { title: string; href: string; key: keyof Counts };
type MetricGroup = { title: string; rows: MetricRow[] };

// Grupperade istället för en platt lista med 9 likvärdiga rutor - varje
// sektion är sitt eget "manifest" över ett verksamhetsområde, så helheten
// går att greppa på en blick istället för att räkna nio separata tal.
const GROUPS: MetricGroup[] = [
  {
    title: "Lager & bäst före",
    rows: [
      { title: "Lågt lagersaldo", href: "/warehouse", key: "lowStockCount" },
      { title: "Bäst före inom 30 dagar", href: "/expiry", key: "expiringSoon" },
      { title: "Utgångna produkter", href: "/expiry?expired=1", key: "expired" },
    ],
  },
  {
    title: "Leveranser & reklamationer",
    rows: [
      { title: "Inleveranser att godkänna", href: "/deliveries", key: "deliveriesToApprove" },
      { title: "Okopplade dokumentrader", href: "/deliveries", key: "unlinkedDocumentRows" },
      { title: "Reklamationer som väntar svar", href: "/complaints", key: "complaintsAwaitingReply" },
      { title: "Ej kopplade mejl", href: "/inbox", key: "unmatchedEmails" },
    ],
  },
  {
    title: "Hämtlistor & beställningar",
    rows: [
      { title: "Aktiva hämtlistor", href: "/pickup-lists", key: "activePickupLists" },
      { title: "Produkter att beställa", href: "/order-list", key: "productsToOrder" },
    ],
  },
];

// Egen (icke-komponent) funktion - new Date() läser också av "nu" och räknas
// som impure av samma anledning som Date.now() på andra sidor i appen.
function formatToday(): string {
  return new Date().toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}

export default async function DashboardPage() {
  const [recentActivity, counts] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { staffMember: { select: { name: true } } },
    }),
    loadDashboardCounts(),
  ]);

  const totalNeedsAttention = Object.values(counts).reduce((sum, v) => sum + v, 0);
  const today = formatToday();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Dashboard</h1>

          {/* Signaturmomentet på sidan - ett "stämplat" statusmärke, precis
              som en fraktsedel stämplas godkänd/mottagen. Dubbla ramar
              (tunn yttre + tjock inre) efterliknar en riktig gummistämpel.
              Storlek och färg bär hela budskapet - inget annat på sidan
              tävlar om uppmärksamheten. */}
          <div
            className={`mt-4 inline-block -rotate-1 border-2 p-1.5 ${
              totalNeedsAttention > 0
                ? "border-safety-300 dark:border-safety-800"
                : "border-emerald-300 dark:border-emerald-900"
            }`}
          >
            <div
              className={`border-4 px-6 py-3 text-center ${
                totalNeedsAttention > 0
                  ? "border-safety-600 text-safety-700 dark:border-safety-400 dark:text-safety-400"
                  : "border-emerald-700 text-emerald-800 dark:border-emerald-500 dark:text-emerald-400"
              }`}
            >
              {totalNeedsAttention > 0 ? (
                <>
                  <p className="font-display text-5xl font-bold leading-none sm:text-6xl">
                    {totalNeedsAttention}
                  </p>
                  <p className="font-display mt-1 text-xs font-semibold uppercase tracking-[0.25em]">
                    {totalNeedsAttention === 1 ? "sak väntar" : "saker väntar"}
                  </p>
                </>
              ) : (
                <p className="font-display text-3xl font-bold uppercase leading-none tracking-[0.15em] sm:text-4xl">
                  Allt klart
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ett litet "poststämpel"-märke med dagens datum - äkta information
            (när det här är hämtat), inte bara dekoration. Streckad kant för
            en perforerad, biljett-liknande känsla. */}
        <div className="rotate-1 rounded-full border border-dashed border-neutral-400 px-4 py-1.5 text-center dark:border-neutral-600">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
            Läge per
          </p>
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
            {today}
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {GROUPS.map((group) => (
          <div
            key={group.title}
            className="overflow-hidden rounded-sm border border-neutral-300 dark:border-neutral-700"
          >
            <h2 className="border-b border-neutral-300 bg-neutral-100 px-4 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {group.title}
            </h2>
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {group.rows.map((row) => {
                const value = counts[row.key];
                const needsAttention = value > 0;
                return (
                  <li key={row.title}>
                    <Link
                      href={row.href}
                      className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <span className="text-neutral-700 dark:text-neutral-300">{row.title}</span>
                      <span
                        className={`text-lg font-semibold ${
                          needsAttention
                            ? "text-safety-600 dark:text-safety-400"
                            : "text-neutral-300 dark:text-neutral-700"
                        }`}
                      >
                        {value}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="max-w-2xl overflow-hidden rounded-sm border border-neutral-300 dark:border-neutral-700">
        <h2 className="border-b border-neutral-300 bg-neutral-100 px-4 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          Senaste aktiviteter
        </h2>
        <div className="p-4">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Inga händelser loggade ännu.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentActivity.map((entry) => (
                <li
                  key={entry.id}
                  className="border-b border-neutral-100 pb-2 last:border-0 dark:border-neutral-800"
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">
                    {entry.description}
                  </span>
                  <span className="block text-xs text-neutral-400">
                    {entry.staffMember?.name ?? "Okänd"} ·{" "}
                    {entry.createdAt.toLocaleString("sv-SE")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
