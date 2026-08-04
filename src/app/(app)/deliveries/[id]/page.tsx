import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveStaffMembers } from "@/lib/actions/staff-actions";
import { StaffPinFields } from "@/components/StaffPinFields";
import {
  addDeliveryItemAction,
  markItemConfirmedOkAction,
  markAllOkAction,
  addDeliveryIssueAction,
  resolveShortExpiryAction,
  approveDeliveryAction,
  uploadDeliveryDocumentAction,
} from "@/lib/actions/delivery-actions";
import {
  linkExistingSupplierAction,
  createSupplierFromDeliveryAction,
  linkDeliveryItemToProductAction,
  confirmSuggestedMatchAction,
  createProductFromDeliveryItemAction,
} from "@/lib/actions/ai-delivery-actions";
import { inputClass, labelClass } from "@/lib/form-styles";
import { Alert } from "@/components/Alert";
import { StatusBadge } from "@/components/StatusBadge";
import { FileInput } from "@/components/FileInput";
import { ISSUE_TYPE_LABELS } from "@/lib/issue-labels";

const ERROR_MESSAGES: Record<string, string> = {
  "obehandlade-rader": "Alla rader måste markeras som klara eller ha en avvikelse registrerad.",
  "mottaget-antal-saknas": "Mottaget antal saknas på en eller flera rader.",
  "bast-fore-ej-hanterat": "En rad har ett kort bäst före-datum som inte är hanterat än.",
  "leverantor-saknas": "Leverantören måste registreras eller kopplas innan leveransen kan godkännas.",
  "produkt-ej-kopplad": "En eller flera rader saknar fortfarande en kopplad produkt.",
};

const MATCH_STATUS_LABELS: Record<string, string> = {
  MATCHED: "Kopplad till produkt",
  SUGGESTED: "Föreslagen koppling",
  UNMATCHED: "Ej kopplad till produkt",
};

// skills/delivery-and-ai-rules.md, 12.4: fält med låg säkerhet ska markeras
// för manuell kontroll. fieldConfidence sparas som fri JSON (Prisma
// JsonValue), så vi läser ut "overall" manuellt istället för att lita på
// typen rakt av.
const LOW_CONFIDENCE_LABELS: Record<string, string> = {
  lag: "AI: Låg säkerhet - kontrollera raden",
  okand: "AI: Kunde inte tolkas säkert - kontrollera raden",
};

function getLowConfidenceLabel(fieldConfidence: unknown): string | null {
  if (!fieldConfidence || typeof fieldConfidence !== "object") return null;
  const overall = (fieldConfidence as { overall?: unknown }).overall;
  return typeof overall === "string" ? (LOW_CONFIDENCE_LABELS[overall] ?? null) : null;
}

const DEFAULT_SHORT_EXPIRY_DAYS = 90;

// Egen (icke-komponent) funktion, så att den impure Date.now()-anropet inte
// sker direkt inuti sidkomponentens render (react-hooks/purity-regeln).
function getItemView<
  T extends {
    confirmedOk: boolean;
    issues: unknown[];
    expiryDate: Date | null;
    shortExpiryHandled: boolean;
    receivedQuantity: number | null;
  },
>(item: T, thresholdDays: number) {
  const now = Date.now();
  const isHandled = item.confirmedOk || item.issues.length > 0;
  const isShort =
    item.expiryDate != null && (item.expiryDate.getTime() - now) / (1000 * 60 * 60 * 24) < thresholdDays;
  const shortExpiryOk = !isShort || item.shortExpiryHandled;
  const receivedOk = item.receivedQuantity != null;
  return { item, isHandled, isShort, shortExpiryOk, receivedOk };
}

export default async function DeliveryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; pinError?: string }>;
}) {
  const { id } = await params;
  const { error, pinError } = await searchParams;
  const deliveryId = Number(id);

  const [delivery, staffMembers, products, suppliers] = await Promise.all([
    prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        supplier: true,
        documents: true,
        approvedByStaffMember: { select: { name: true } },
        complaint: { select: { id: true, complaintNumber: true } },
        items: { include: { product: true, issues: { include: { images: true } } }, orderBy: { id: "asc" } },
      },
    }),
    getActiveStaffMembers(),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!delivery) {
    notFound();
  }

  const isDraft = delivery.status === "UTKAST";
  const threshold = delivery.supplier?.defaultShortExpiryDays ?? DEFAULT_SHORT_EXPIRY_DAYS;

  const itemViews = delivery.items.map((item) => getItemView(item, threshold));

  const allReady =
    delivery.items.length > 0 &&
    delivery.supplierId != null &&
    itemViews.every((v) => v.item.productId != null && v.isHandled && v.shortExpiryOk && v.receivedOk);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/deliveries" className="mb-4 inline-block text-sm text-neutral-500 hover:underline">
          ← Tillbaka till inleveranser
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Leverans #{delivery.id} – {delivery.supplier?.name ?? delivery.rawSupplierName ?? "Okänd leverantör"}
          </h1>
          <div className="flex items-center gap-2">
            {delivery.source === "AI" && <StatusBadge tone="neutral">AI-tolkad</StatusBadge>}
            <StatusBadge tone={delivery.status === "GODKAND" ? "success" : "neutral"}>
              {delivery.status === "GODKAND" ? "Godkänd" : "Utkast"}
            </StatusBadge>
          </div>
        </div>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {delivery.deliveryDate && `Leveransdatum ${delivery.deliveryDate.toLocaleDateString("sv-SE")} · `}
          {delivery.orderNumber && `Order ${delivery.orderNumber} · `}
          {delivery.invoiceNumber && `Faktura ${delivery.invoiceNumber}`}
        </p>

        {delivery.complaint && (
          <p className="mt-2 text-sm">
            <Link href={`/complaints/${delivery.complaint.id}`} className="text-amber-700 hover:underline dark:text-amber-400">
              Reklamation {delivery.complaint.complaintNumber} skapad från avvikelserna på den här leveransen →
            </Link>
          </p>
        )}

        {isDraft && !delivery.supplierId && (
          <div className="mt-3 space-y-2 rounded-md bg-amber-50 p-3 text-sm dark:bg-amber-950">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Leverantören är inte registrerad
              {delivery.rawSupplierName && ` (AI läste namnet "${delivery.rawSupplierName}")`}.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <form
                action={createSupplierFromDeliveryAction.bind(null, delivery.id)}
                className="flex gap-2"
              >
                <input
                  name="name"
                  defaultValue={delivery.rawSupplierName ?? ""}
                  placeholder="Leverantörens namn"
                  required
                  className={inputClass}
                />
                <button type="submit" className="whitespace-nowrap rounded-md border border-amber-400 px-3 py-2 text-sm font-medium text-amber-800 dark:text-amber-300">
                  Skapa leverantör
                </button>
              </form>
              {suppliers.length > 0 && (
                <form
                  action={linkExistingSupplierAction.bind(null, delivery.id)}
                  className="flex gap-2"
                >
                  <select name="supplierId" required className={inputClass}>
                    <option value="">Koppla till befintlig...</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700">
                    Koppla
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {pinError && (
          <div className="mt-3">
            <Alert tone="error">{pinError}</Alert>
          </div>
        )}
        {error && (
          <div className="mt-3">
            <Alert tone="error">{ERROR_MESSAGES[error] ?? error}</Alert>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Dokument</h2>
        <ul className="space-y-1 text-sm">
          {delivery.documents.map((doc) => (
            <li key={doc.id}>
              <a href={doc.filePath} target="_blank" className="text-neutral-600 underline dark:text-neutral-300">
                {doc.fileName}
              </a>
            </li>
          ))}
          {delivery.documents.length === 0 && (
            <li className="text-neutral-400">Inga dokument uppladdade.</li>
          )}
        </ul>
        {isDraft && (
          <form
            action={uploadDeliveryDocumentAction.bind(null, delivery.id)}
            className="flex items-center gap-2"
          >
            <FileInput name="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required />
            <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">
              Bifoga
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Leveransrader</h2>

        <ul className="space-y-4">
          {itemViews.map(({ item, isHandled, isShort, shortExpiryOk }) => (
            <li key={item.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                  {item.product?.name ?? item.rawProductName ?? "Okänd produkt"}
                </span>
                <div className="flex items-center gap-2">
                  {item.matchStatus !== "MATCHED" && (
                    <StatusBadge tone={item.matchStatus === "SUGGESTED" ? "warning" : "error"}>
                      {MATCH_STATUS_LABELS[item.matchStatus]}
                    </StatusBadge>
                  )}
                  <StatusBadge
                    tone={item.issues.length > 0 ? "error" : item.confirmedOk ? "success" : "warning"}
                  >
                    {item.issues.length > 0 ? "Avvikelse" : item.confirmedOk ? "Klar" : "Behöver kontrolleras"}
                  </StatusBadge>
                </div>
              </div>
              {getLowConfidenceLabel(item.fieldConfidence) && (
                <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {getLowConfidenceLabel(item.fieldConfidence)}
                </p>
              )}
              <p className="mt-1 text-xs text-neutral-400">
                Dokumenterat: {item.documentedQuantity ?? "–"} · Mottaget: {item.receivedQuantity ?? "–"}
                {item.expiryDate && ` · Bäst före ${item.expiryDate.toLocaleDateString("sv-SE")}`}
                {item.supplierArticleNumber && ` · Art.nr ${item.supplierArticleNumber}`}
              </p>

              {isDraft && item.matchStatus === "SUGGESTED" && (
                <div className="mt-3 space-y-2 rounded-md bg-amber-50 p-3 text-sm dark:bg-amber-950">
                  <p className="text-amber-800 dark:text-amber-300">
                    Föreslagen koppling till <strong>{item.product?.name}</strong> - stämmer det?
                  </p>
                  <div className="flex gap-2">
                    <form action={confirmSuggestedMatchAction.bind(null, delivery.id, item.id)}>
                      <button type="submit" className="rounded-md border border-amber-400 px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
                        Ja, bekräfta kopplingen
                      </button>
                    </form>
                  </div>
                  <details>
                    <summary className="cursor-pointer text-amber-700 hover:underline dark:text-amber-400">
                      Nej, koppla till en annan produkt
                    </summary>
                    <form
                      action={linkDeliveryItemToProductAction.bind(null, delivery.id, item.id)}
                      className="mt-2 flex gap-2"
                    >
                      <select name="productId" required className={inputClass}>
                        <option value="">Välj produkt...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">
                        Koppla
                      </button>
                    </form>
                  </details>
                </div>
              )}

              {isDraft && item.matchStatus === "UNMATCHED" && (
                <div className="mt-3 space-y-3 rounded-md bg-red-50 p-3 text-sm dark:bg-red-950">
                  <p className="font-medium text-red-800 dark:text-red-300">
                    Ej kopplad till produkt{item.rawProductName && ` (dokumentet säger "${item.rawProductName}")`}
                  </p>
                  <form
                    action={linkDeliveryItemToProductAction.bind(null, delivery.id, item.id)}
                    className="flex gap-2"
                  >
                    <select name="productId" required className={inputClass}>
                      <option value="">Sök/välj befintlig produkt...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">
                      Koppla
                    </button>
                  </form>
                  <details>
                    <summary className="cursor-pointer text-red-700 hover:underline dark:text-red-400">
                      Skapa ny produkt istället
                    </summary>
                    <form
                      action={createProductFromDeliveryItemAction.bind(null, delivery.id, item.id)}
                      className="mt-2 flex gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={item.rawProductName ?? ""}
                        placeholder="Produktnamn (Hela Rubbets eget namn)"
                        required
                        className={inputClass}
                      />
                      <button type="submit" className="whitespace-nowrap rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 dark:border-red-800 dark:text-red-400">
                        Skapa produkt
                      </button>
                    </form>
                  </details>
                </div>
              )}

              {isDraft && isShort && !shortExpiryOk && (
                <div className="mt-3 space-y-2 rounded-md bg-amber-50 p-3 text-sm dark:bg-amber-950">
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    Kort bäst före-datum (under {threshold} dagar) - välj hur det ska hanteras:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <form action={resolveShortExpiryAction.bind(null, delivery.id, item.id)} className="space-y-2">
                      <input type="hidden" name="decision" value="accepterad" />
                      <StaffPinFields staffMembers={staffMembers} />
                      <input name="comment" placeholder="Kommentar (valfritt)" className={inputClass} />
                      <button type="submit" className="w-full rounded-md border border-amber-400 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
                        Acceptera leveransen
                      </button>
                    </form>
                    <div className="space-y-2">
                      <form action={resolveShortExpiryAction.bind(null, delivery.id, item.id)}>
                        <input type="hidden" name="decision" value="reklamation" />
                        <button type="submit" className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700">
                          Lägg till i reklamationen
                        </button>
                      </form>
                      <form action={resolveShortExpiryAction.bind(null, delivery.id, item.id)}>
                        <input type="hidden" name="decision" value="kontrollera_senare" />
                        <button type="submit" className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700">
                          Kontrollera senare
                        </button>
                      </form>
                      <form action={resolveShortExpiryAction.bind(null, delivery.id, item.id)}>
                        <input type="hidden" name="decision" value="ej_relevant" />
                        <button type="submit" className="w-full rounded-md border border-neutral-300 py-1.5 text-sm dark:border-neutral-700">
                          Ej relevant för denna produkt
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {item.issues.length > 0 && (
                <ul className="mt-3 space-y-2 text-xs">
                  {item.issues.map((issue) => (
                    <li key={issue.id} className="rounded-md bg-red-50 p-2 dark:bg-red-950">
                      <p className="font-medium text-red-800 dark:text-red-300">
                        {ISSUE_TYPE_LABELS[issue.type] ?? issue.type}
                      </p>
                      {issue.comment && <p className="text-red-700 dark:text-red-300">{issue.comment}</p>}
                      {issue.type === "SKADAD" && (
                        <p className="text-red-700 dark:text-red-300">
                          {issue.damagedQuantity != null && `Antal skadade: ${issue.damagedQuantity}. `}
                          {issue.discarded ? "Kasserad. " : ""}
                          {issue.wantedAction && `Önskad åtgärd: ${issue.wantedAction}.`}
                        </p>
                      )}
                      {issue.images.map((img) => (
                        <a key={img.id} href={img.filePath} target="_blank">
                          <img src={img.filePath} alt="Skadebild" className="mt-1 h-20 w-20 rounded object-cover" />
                        </a>
                      ))}
                    </li>
                  ))}
                </ul>
              )}

              {isDraft && (
                <div className="mt-3 flex items-center gap-4 text-sm">
                  {!isHandled && item.productId != null && (
                    <form action={markItemConfirmedOkAction.bind(null, delivery.id, item.id)}>
                      <button type="submit" className="text-green-700 hover:underline dark:text-green-400">
                        Markera rad som klar
                      </button>
                    </form>
                  )}
                  <details>
                    <summary className="cursor-pointer text-neutral-500 hover:underline">
                      Registrera avvikelse
                    </summary>
                    <form
                      action={addDeliveryIssueAction.bind(null, delivery.id, item.id)}
                      className="mt-2 space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                    >
                      <select name="type" required className={inputClass}>
                        <option value="">Välj typ av avvikelse...</option>
                        {Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <input name="comment" placeholder="Kommentar" className={inputClass} />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          name="damagedQuantity"
                          type="number"
                          min={0}
                          placeholder="Antal skadade (om skada)"
                          className={inputClass}
                        />
                        <select name="wantedAction" className={inputClass}>
                          <option value="">Önskad åtgärd (om skada)</option>
                          <option value="Kreditering">Kreditering</option>
                          <option value="Ersättningsvara">Ersättningsvara</option>
                          <option value="Besked från leverantören">Besked från leverantören</option>
                          <option value="Annan lösning">Annan lösning</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" name="discarded" value="true" /> Produkten har kasserats
                      </label>
                      <div>
                        <label className="mb-1 block text-xs text-neutral-500">Bild (om skada)</label>
                        <FileInput
                          name="image"
                          accept=".jpg,.jpeg,.png,.webp"
                          buttonLabel="Välj bild"
                          placeholder="Ingen bild vald"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-md border border-red-300 py-1.5 text-sm font-medium text-red-700 dark:border-red-800 dark:text-red-400"
                      >
                        Spara avvikelse
                      </button>
                    </form>
                  </details>
                </div>
              )}
            </li>
          ))}
          {delivery.items.length === 0 && (
            <li className="text-sm text-neutral-500 dark:text-neutral-400">Inga rader tillagda ännu.</li>
          )}
        </ul>
      </div>

      {isDraft && (
        <>
          <form
            action={addDeliveryItemAction.bind(null, delivery.id)}
            className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Lägg till produkt</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="productId">
                  Produkt
                </label>
                <select id="productId" name="productId" required className={inputClass}>
                  <option value="">Välj produkt...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="expiryDate">
                  Bäst före-datum (valfritt)
                </label>
                <input id="expiryDate" name="expiryDate" type="date" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="documentedQuantity">
                  Dokumenterat antal
                </label>
                <input
                  id="documentedQuantity"
                  name="documentedQuantity"
                  type="number"
                  min={1}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="receivedQuantity">
                  Faktiskt mottaget antal
                </label>
                <input
                  id="receivedQuantity"
                  name="receivedQuantity"
                  type="number"
                  min={0}
                  placeholder="Samma som dokumenterat om tomt"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
            >
              Lägg till rad
            </button>
          </form>

          <div className="flex items-center gap-4">
            <form action={markAllOkAction.bind(null, delivery.id)}>
              <button type="submit" className="text-sm text-neutral-500 hover:underline">
                Markera alla rader utan avvikelse som klara
              </button>
            </form>
          </div>

          <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="font-medium text-neutral-900 dark:text-neutral-50">Godkänn leverans</h2>
            {!allReady && (
              <Alert tone="warning">
                ⚠️ Alla rader måste vara klara eller ha en avvikelse, ha mottaget antal ifyllt, och
                eventuellt kort bäst före-datum måste vara hanterat, innan leveransen kan godkännas.
              </Alert>
            )}
            <form action={approveDeliveryAction.bind(null, delivery.id)} className="space-y-3">
              <StaffPinFields staffMembers={staffMembers} />
              <button
                type="submit"
                disabled={!allReady}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
              >
                Godkänn och uppdatera lager
              </button>
            </form>
          </div>
        </>
      )}

      {!isDraft && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Godkänd {delivery.approvedAt?.toLocaleString("sv-SE")} av{" "}
          {delivery.approvedByStaffMember?.name ?? "okänd"}. Lagret är uppdaterat.
        </p>
      )}
    </div>
  );
}
