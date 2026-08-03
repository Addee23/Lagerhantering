import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSupplierAction } from "@/lib/actions/supplier-actions";
import { inputClass, labelClass } from "@/lib/form-styles";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id: Number(id) } });

  if (!supplier) {
    notFound();
  }

  const updateAction = updateSupplierAction.bind(null, supplier.id);

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/suppliers" className="inline-block text-sm text-neutral-500 hover:underline">
        ← Tillbaka till leverantörer
      </Link>

      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        Redigera leverantör
      </h1>

      <form action={updateAction} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="name">
            Namn
          </label>
          <input id="name" name="name" required defaultValue={supplier.name} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="orgNumber">
              Organisationsnummer
            </label>
            <input
              id="orgNumber"
              name="orgNumber"
              defaultValue={supplier.orgNumber ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="customerNumber">
              Kundnummer hos leverantören
            </label>
            <input
              id="customerNumber"
              name="customerNumber"
              defaultValue={supplier.customerNumber ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="generalEmail">
              Allmän e-postadress
            </label>
            <input
              id="generalEmail"
              name="generalEmail"
              type="email"
              defaultValue={supplier.generalEmail ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="complaintEmail">
              Reklamationsmejl
            </label>
            <input
              id="complaintEmail"
              name="complaintEmail"
              type="email"
              defaultValue={supplier.complaintEmail ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="ccRecipient">
              Kopia-mottagare
            </label>
            <input
              id="ccRecipient"
              name="ccRecipient"
              type="email"
              defaultValue={supplier.ccRecipient ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">
              Telefonnummer
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={supplier.phone ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="contactPerson">
            Kontaktperson
          </label>
          <input
            id="contactPerson"
            name="contactPerson"
            defaultValue={supplier.contactPerson ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="defaultShortExpiryDays">
            Standardgräns för kort bäst före-datum (dagar)
          </label>
          <input
            id="defaultShortExpiryDays"
            name="defaultShortExpiryDays"
            type="number"
            min={0}
            placeholder="90 (systemets standard) om tomt"
            defaultValue={supplier.defaultShortExpiryDays ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="complaintInstructions">
            Reklamationsinstruktioner
          </label>
          <textarea
            id="complaintInstructions"
            name="complaintInstructions"
            rows={3}
            defaultValue={supplier.complaintInstructions ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="notes">
            Anteckningar
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={supplier.notes ?? ""}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Spara
        </button>
      </form>
    </div>
  );
}
