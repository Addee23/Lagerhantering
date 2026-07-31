import { prisma } from "@/lib/prisma";

export default async function ActivityLogPage() {
  // skills/logging-and-audit-rules.md: loggen är oföränderlig och visas i sin
  // helhet - inget filter/paginering än, det byggs ut i senare faser.
  const entries = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { staffMember: { select: { name: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        Aktivitetslogg
      </h1>

      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Inga händelser loggade ännu.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-2 font-medium">Datum och tid</th>
                <th className="px-4 py-2 font-medium">Personal</th>
                <th className="px-4 py-2 font-medium">Händelse</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                >
                  <td className="whitespace-nowrap px-4 py-2 text-neutral-500 dark:text-neutral-400">
                    {entry.createdAt.toLocaleString("sv-SE")}
                  </td>
                  <td className="px-4 py-2">{entry.staffMember?.name ?? "Okänd"}</td>
                  <td className="px-4 py-2">{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
