import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";

const STATUS_LABELS: Record<string, string> = {
  UTKAST: "Utkast",
  SKICKAD: "Skickad",
  VANTAR_PA_SVAR: "Väntar på svar",
  KREDITERAD: "Krediterad",
  ERSATT: "Ersatt",
  BEHOVER_KOMPLETTERAS: "Behöver kompletteras",
  AVVISAD_AV_LEVERANTOR: "Avvisad av leverantör",
  AVSLUTAD: "Avslutad",
  AVBRUTEN: "Avbruten",
};

function statusTone(status: string): "success" | "warning" | "error" | "neutral" {
  if (status === "KREDITERAD" || status === "ERSATT" || status === "AVSLUTAD") return "success";
  if (status === "AVVISAD_AV_LEVERANTOR" || status === "BEHOVER_KOMPLETTERAS") return "error";
  if (status === "UTKAST") return "warning";
  return "neutral";
}

export default async function ComplaintsPage() {
  const complaints = await prisma.complaint.findMany({
    include: { supplier: true, delivery: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Reklamationer
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Skapas automatiskt när en godkänd leverans har avvikelser. AI:n kan föreslå ett
          mejlutkast, men inget skickas utan att personalen granskar och bekräftar med PIN.
        </p>
      </div>

      <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {complaints.map((complaint) => (
          <li key={complaint.id}>
            <Link
              href={`/complaints/${complaint.id}`}
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div>
                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                  {complaint.complaintNumber}
                </span>
                <span className="ml-2 text-neutral-400">
                  {complaint.supplier.name} · {complaint.items.length}{" "}
                  {complaint.items.length === 1 ? "avvikelse" : "avvikelser"}
                </span>
              </div>
              <StatusBadge tone={statusTone(complaint.status)}>
                {STATUS_LABELS[complaint.status]}
              </StatusBadge>
            </Link>
          </li>
        ))}
        {complaints.length === 0 && (
          <li className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
            Inga reklamationer ännu.
          </li>
        )}
      </ul>
    </div>
  );
}
