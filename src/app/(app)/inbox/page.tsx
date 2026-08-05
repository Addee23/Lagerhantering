import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  checkInboxAction,
  linkUnmatchedEmailAction,
  markUnmatchedEmailIrrelevantAction,
} from "@/lib/actions/inbox-actions";
import { inputClass } from "@/lib/form-styles";
import { Alert } from "@/components/Alert";
import { StatusBadge } from "@/components/StatusBadge";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [unmatched, openComplaints] = await Promise.all([
    prisma.unmatchedEmail.findMany({
      where: { status: "OMATCHAD" },
      orderBy: { receivedAt: "desc" },
    }),
    prisma.complaint.findMany({
      where: { status: { notIn: ["AVSLUTAD", "AVBRUTEN"] } },
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Mejlinkorg
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Läser leverantörernas svar på reklamationsmejl. Mejl som säkert kan kopplas till ett
          ärende hamnar direkt i reklamationens mejlhistorik - resten visas här för manuell
          hantering (skills/complaint-and-email-rules.md).
        </p>
      </div>

      {error && <Alert tone="error">{decodeURIComponent(error)}</Alert>}

      <form action={checkInboxAction}>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Hämta nya mejl
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="font-medium text-neutral-900 dark:text-neutral-50">
          Ej kopplade mejl ({unmatched.length})
        </h2>
        {unmatched.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Inga omatchade mejl just nu.
          </p>
        ) : (
          <ul className="space-y-3">
            {unmatched.map((email) => (
              <li key={email.id} className="rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">{email.subject}</p>
                  <StatusBadge tone="warning">Omatchad</StatusBadge>
                </div>
                <p className="text-xs text-neutral-400">
                  Från {email.fromAddress} · {email.receivedAt.toLocaleString("sv-SE")}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
                  {email.body.length > 500 ? `${email.body.slice(0, 500)}…` : email.body}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {openComplaints.length > 0 && (
                    <form action={linkUnmatchedEmailAction.bind(null, email.id)} className="flex gap-2">
                      <select name="complaintId" required className={inputClass}>
                        <option value="">Koppla till reklamation...</option>
                        {openComplaints.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.complaintNumber} - {c.supplier.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
                      >
                        Koppla
                      </button>
                    </form>
                  )}
                  <form action={markUnmatchedEmailIrrelevantAction.bind(null, email.id)}>
                    <button type="submit" className="text-neutral-500 hover:underline">
                      Markera irrelevant
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-neutral-400">
        Se hela svarshistoriken under respektive{" "}
        <Link href="/complaints" className="underline">
          reklamation
        </Link>
        .
      </p>
    </div>
  );
}
