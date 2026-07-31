import { prisma } from "@/lib/prisma";
import { getActiveStaffMembers } from "@/lib/actions/staff-actions";
import { DashboardPinTest } from "@/components/DashboardPinTest";

const PLACEHOLDER_CARDS = [
  { title: "Aktiva hämtlistor", phase: "Fas 4" },
  { title: "Lågt lagersaldo", phase: "Fas 3" },
  { title: "Bäst före inom 30 dagar", phase: "Fas 7" },
  { title: "Inleveranser att godkänna", phase: "Fas 5" },
  { title: "Reklamationer som väntar svar", phase: "Fas 9" },
  { title: "Produkter att beställa", phase: "Fas 8" },
];

export default async function DashboardPage() {
  const staffMembers = await getActiveStaffMembers();
  const recentActivity = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { staffMember: { select: { name: true } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Dashboard</h1>

      {/* Dessa kort blir riktiga (klickbara, med riktiga siffror) allt eftersom
          respektive fas byggs - se skills/ui-and-mobile-rules.md, "Dashboard". */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLACEHOLDER_CARDS.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{card.title}</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-300 dark:text-neutral-700">
              –
            </p>
            <p className="mt-1 text-xs text-neutral-400">Byggs i {card.phase}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-3 font-medium text-neutral-900 dark:text-neutral-50">
            Testa PIN-bekräftelse
          </h2>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            Dagens test av hela PIN-kedjan: välj personal, ange PIN och se att det loggas här
            intill.
          </p>
          {staffMembers.length === 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Ingen personal skapad ännu. Kör{" "}
              <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">
                npx tsx scripts/create-staff-member.ts &quot;Namn&quot; 1234
              </code>{" "}
              i terminalen.
            </p>
          ) : (
            <DashboardPinTest staffMembers={staffMembers} />
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-3 font-medium text-neutral-900 dark:text-neutral-50">
            Senaste aktiviteter
          </h2>
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
