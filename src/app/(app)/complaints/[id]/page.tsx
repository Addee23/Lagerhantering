import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveStaffMembers } from "@/lib/actions/staff-actions";
import { StaffPinFields } from "@/components/StaffPinFields";
import {
  createManualComplaintEmailDraftAction,
  generateComplaintEmailDraftAction,
  updateComplaintEmailDraftAction,
  deleteComplaintEmailDraftAction,
  sendComplaintEmailAction,
  updateComplaintStatusAction,
} from "@/lib/actions/complaint-actions";
import { inputClass, labelClass } from "@/lib/form-styles";
import { Alert } from "@/components/Alert";
import { StatusBadge } from "@/components/StatusBadge";
import { ISSUE_TYPE_LABELS } from "@/lib/issue-labels";

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

export default async function ComplaintDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; pinError?: string }>;
}) {
  const { id } = await params;
  const { error, pinError } = await searchParams;
  const complaintId = Number(id);

  const [complaint, staffMembers] = await Promise.all([
    prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        delivery: true,
        supplier: true,
        items: {
          include: {
            deliveryIssue: {
              include: { deliveryItem: { include: { product: true } }, images: true },
            },
          },
        },
        emails: {
          include: { attachments: true, sentByStaffMember: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getActiveStaffMembers(),
  ]);

  if (!complaint) {
    notFound();
  }

  const draft = complaint.emails.find((e) => !e.sentAt) ?? null;
  const sentEmails = complaint.emails.filter((e) => e.sentAt);
  const missingComplaintEmail = !complaint.supplier.complaintEmail;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/complaints" className="mb-4 inline-block text-sm text-neutral-500 hover:underline">
          ← Tillbaka till reklamationer
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            {complaint.complaintNumber}
          </h1>
          <StatusBadge tone="neutral">{STATUS_LABELS[complaint.status]}</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {complaint.supplier.name} ·{" "}
          <Link href={`/deliveries/${complaint.deliveryId}`} className="hover:underline">
            Leverans #{complaint.deliveryId}
          </Link>
          {complaint.delivery.invoiceNumber && ` · Faktura ${complaint.delivery.invoiceNumber}`}
          {complaint.delivery.orderNumber && ` · Order ${complaint.delivery.orderNumber}`}
        </p>

        {pinError && (
          <div className="mt-3">
            <Alert tone="error">{pinError}</Alert>
          </div>
        )}
        {error === "leverantor-saknar-reklamationsadress" && (
          <div className="mt-3">
            <Alert tone="error">
              Leverantören saknar en registrerad reklamationsadress - mejlet kan inte skickas
              förrän det är ifyllt på{" "}
              <Link href={`/suppliers/${complaint.supplierId}/edit`} className="underline">
                leverantörens sida
              </Link>
              .
            </Alert>
          </div>
        )}
        {error && error !== "leverantor-saknar-reklamationsadress" && (
          <div className="mt-3">
            <Alert tone="error">{decodeURIComponent(error)}</Alert>
          </div>
        )}
        {missingComplaintEmail && error !== "leverantor-saknar-reklamationsadress" && (
          <div className="mt-3">
            <Alert tone="warning">
              Leverantören saknar en registrerad reklamationsadress -{" "}
              <Link href={`/suppliers/${complaint.supplierId}/edit`} className="underline">
                lägg till en
              </Link>{" "}
              innan mejlet kan skickas.
            </Alert>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-medium text-neutral-900 dark:text-neutral-50">
          Avvikelser ({complaint.items.length})
        </h2>
        <ul className="space-y-3">
          {complaint.items.map((item) => {
            const issue = item.deliveryIssue;
            const productName = issue.deliveryItem.product?.name ?? issue.deliveryItem.rawProductName ?? "Okänd produkt";
            return (
              <li key={item.id} className="rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
                <p className="font-medium text-neutral-900 dark:text-neutral-50">{productName}</p>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {ISSUE_TYPE_LABELS[issue.type] ?? issue.type}
                  {issue.damagedQuantity != null && ` · ${issue.damagedQuantity} st`}
                  {issue.discarded === true && " · Kasserad"}
                  {issue.discarded === false && " · Sparas/returneras"}
                </p>
                {issue.comment && <p className="mt-1 text-neutral-400">{issue.comment}</p>}
                {issue.wantedAction && (
                  <p className="mt-1 text-neutral-400">Önskad åtgärd: {issue.wantedAction}</p>
                )}
                {issue.images.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {issue.images.map((img) => (
                      <a key={img.id} href={img.filePath} target="_blank">
                        <img
                          src={img.filePath}
                          alt="Skadebild"
                          className="h-16 w-16 rounded object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Mejl</h2>

        {!draft && (
          <div className="flex flex-wrap gap-3">
            <form action={generateComplaintEmailDraftAction.bind(null, complaint.id)}>
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
              >
                Generera utkast med AI
              </button>
            </form>
            <form action={createManualComplaintEmailDraftAction.bind(null, complaint.id)}>
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
              >
                Skriv utkast manuellt
              </button>
            </form>
          </div>
        )}

        {draft && (
          <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-neutral-500">
                {draft.aiGenerated ? "AI-genererat utkast" : "Manuellt utkast"} - ej skickat än
              </p>
              <div className="flex gap-3 text-xs">
                <form action={generateComplaintEmailDraftAction.bind(null, complaint.id)}>
                  <button type="submit" className="text-neutral-500 hover:underline">
                    Generera om med AI
                  </button>
                </form>
                <form action={deleteComplaintEmailDraftAction.bind(null, complaint.id, draft.id)}>
                  <button type="submit" className="text-neutral-500 hover:underline">
                    Ta bort utkast
                  </button>
                </form>
              </div>
            </div>

            <form action={updateComplaintEmailDraftAction.bind(null, complaint.id, draft.id)} className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="toAddress">
                    Till
                  </label>
                  <input
                    id="toAddress"
                    name="toAddress"
                    type="email"
                    required
                    defaultValue={draft.toAddress}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="ccAddress">
                    Kopia (valfritt)
                  </label>
                  <input
                    id="ccAddress"
                    name="ccAddress"
                    type="email"
                    defaultValue={draft.ccAddress ?? ""}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="subject">
                  Ämne
                </label>
                <input id="subject" name="subject" required defaultValue={draft.subject} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="body">
                  Meddelande
                </label>
                <textarea id="body" name="body" rows={10} defaultValue={draft.body} className={inputClass} />
              </div>

              {complaint.items.some((i) => i.deliveryIssue.images.length > 0) && (
                <p className="text-xs text-neutral-400">
                  Skadebilderna bifogas automatiskt när mejlet skickas.
                </p>
              )}

              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
              >
                Spara utkast
              </button>

              <div className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <p className="text-xs font-medium text-neutral-500">
                  Skicka (kräver PIN - går inte att ångra)
                </p>
                <StaffPinFields staffMembers={staffMembers} />
                <button
                  type="submit"
                  formAction={sendComplaintEmailAction.bind(null, complaint.id, draft.id)}
                  disabled={missingComplaintEmail}
                  className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  Skicka reklamationsmejl
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {sentEmails.length > 0 && (
        <div className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Skickade mejl</h2>
          <ul className="space-y-3">
            {sentEmails.map((email) => (
              <li key={email.id} className="rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
                <p className="font-medium text-neutral-900 dark:text-neutral-50">{email.subject}</p>
                <p className="text-xs text-neutral-400">
                  Till {email.toAddress}
                  {email.ccAddress && `, kopia ${email.ccAddress}`} · Skickat{" "}
                  {email.sentAt?.toLocaleString("sv-SE")} av {email.sentByStaffMember?.name ?? "okänd"}
                  {email.attachments.length > 0 && ` · ${email.attachments.length} bilaga(or)`}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">{email.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {complaint.status !== "UTKAST" && (
        <div className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Uppdatera status</h2>
          <p className="text-xs text-neutral-400">
            Ingen automatisk koppling till leverantörens svar än (byggs i Fas 10) - uppdatera
            manuellt efter kontakt med leverantören.
          </p>
          <form action={updateComplaintStatusAction.bind(null, complaint.id)} className="flex gap-2">
            <select name="status" defaultValue={complaint.status} className={inputClass}>
              <option value="VANTAR_PA_SVAR">Väntar på svar</option>
              <option value="BEHOVER_KOMPLETTERAS">Behöver kompletteras</option>
              <option value="KREDITERAD">Krediterad</option>
              <option value="ERSATT">Ersatt</option>
              <option value="AVVISAD_AV_LEVERANTOR">Avvisad av leverantör</option>
              <option value="AVSLUTAD">Avslutad</option>
              <option value="AVBRUTEN">Avbruten</option>
            </select>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
            >
              Spara status
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
