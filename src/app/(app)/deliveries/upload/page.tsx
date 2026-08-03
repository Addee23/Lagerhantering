import Link from "next/link";
import { analyzeDeliveryDocumentAction } from "@/lib/actions/ai-delivery-actions";
import { Alert } from "@/components/Alert";
import { FileInput } from "@/components/FileInput";

export default async function UploadDeliveryDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/deliveries" className="inline-block text-sm text-neutral-500 hover:underline">
        ← Tillbaka till inleveranser
      </Link>

      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        Ladda upp dokument för AI-tolkning
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Ladda upp en faktura, följesedel eller orderbekräftelse (PDF, foto eller skärmbild). AI:n
        föreslår leverantör, ordernummer och produktrader - du granskar och godkänner allt
        manuellt innan lagret påverkas.
      </p>

      {error && <Alert tone="error">{error}</Alert>}

      <form action={analyzeDeliveryDocumentAction} className="space-y-3">
        <FileInput name="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Tolka dokument
        </button>
      </form>

      <p className="text-xs text-neutral-400">
        Detta kan ta någon sekund medan AI:n läser dokumentet. Du landar på ett redigerbart
        granskningsutkast när det är klart.
      </p>
    </div>
  );
}
