import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ActivityLogPage() {
  // skills/logging-and-audit-rules.md: "Koppling till relaterad leverans,
  // hämtlista och/eller reklamation, om tillämpligt" - utöver fritexten i
  // description, så en loggrad går att klicka sig vidare från direkt.
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
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Personal</th>
                <th className="px-4 py-2 font-medium">Händelse</th>
                <th className="px-4 py-2 font-medium">Kopplat till</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                >
                  <td className="whitespace-normal px-4 py-2 text-neutral-500 sm:whitespace-nowrap dark:text-neutral-400">
                    {entry.createdAt.toLocaleString("sv-SE")}
                  </td>
                  <td className="hidden px-4 py-2 sm:table-cell">{entry.staffMember?.name ?? "Okänd"}</td>
                  <td className="px-4 py-2">{entry.description}</td>
                  <td className="whitespace-normal px-4 py-2 sm:whitespace-nowrap">
                    {entry.deliveryId && (
                      <Link href={`/deliveries/${entry.deliveryId}`} className="text-neutral-500 hover:underline">
                        Leverans #{entry.deliveryId}
                      </Link>
                    )}
                    {entry.pickupListId && (
                      <Link href={`/pickup-lists/${entry.pickupListId}`} className="text-neutral-500 hover:underline">
                        Hämtlista #{entry.pickupListId}
                      </Link>
                    )}
                    {entry.complaintId && (
                      <Link href={`/complaints/${entry.complaintId}`} className="text-neutral-500 hover:underline">
                        Reklamation #{entry.complaintId}
                      </Link>
                    )}
                    {!entry.deliveryId && !entry.pickupListId && !entry.complaintId && (
                      <span className="text-neutral-300 dark:text-neutral-700">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
