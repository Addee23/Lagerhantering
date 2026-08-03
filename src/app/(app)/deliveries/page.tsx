import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DeliveriesPage() {
  const deliveries = await prisma.delivery.findMany({
    include: { supplier: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Inleveranser
        </h1>
        <div className="flex gap-3">
          <Link
            href="/deliveries/upload"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
          >
            Tolka dokument med AI
          </Link>
          <Link
            href="/deliveries/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Ny leverans
          </Link>
        </div>
      </div>

      <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {deliveries.map((delivery) => (
          <li key={delivery.id}>
            <Link
              href={`/deliveries/${delivery.id}`}
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div>
                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                  Leverans #{delivery.id} – {delivery.supplier?.name ?? delivery.rawSupplierName ?? "Okänd leverantör"}
                </span>
                <span className="ml-2 text-neutral-400">
                  {delivery.items.length} {delivery.items.length === 1 ? "rad" : "rader"}
                </span>
                {delivery.source === "AI" && (
                  <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    AI-tolkad
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-neutral-500">
                <span>{delivery.status === "GODKAND" ? "Godkänd" : "Utkast"}</span>
                <span className="text-xs text-neutral-400">
                  {delivery.createdAt.toLocaleDateString("sv-SE")}
                </span>
              </div>
            </Link>
          </li>
        ))}
        {deliveries.length === 0 && (
          <li className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
            Inga leveranser ännu.
          </li>
        )}
      </ul>
    </div>
  );
}
