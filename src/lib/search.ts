import { prisma } from "@/lib/prisma";

// skills/ui-and-mobile-rules.md: "Snabb sökning ska täcka: produktnamn,
// streckkod, leverantörens artikelnummer, varumärke, leverantör,
// fakturanummer, ordernummer, reklamationsnummer." En enda sökruta i
// navigationen, istället för att bara /products hade en egen lokal sökning.

const RESULT_LIMIT = 8;

export async function globalSearch(query: string) {
  const q = query.trim();
  if (q.length < 2) {
    return { products: [], suppliers: [], brands: [], deliveries: [], complaints: [] };
  }

  const [products, suppliers, brands, deliveries, complaints] = await Promise.all([
    // active: true - samma konvention som alla andra produkt-/leverantörs-
    // /varumärkesväljare i appen (t.ex. vid tillägg i en hämtlista eller
    // leverans). En inaktiverad post ska inte dyka upp som en vanlig träff.
    prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q } },
          { barcode: { contains: q } },
          { supplierProducts: { some: { supplierArticleNumber: { contains: q } } } },
        ],
      },
      orderBy: { name: "asc" },
      take: RESULT_LIMIT,
    }),
    prisma.supplier.findMany({
      where: { active: true, name: { contains: q } },
      orderBy: { name: "asc" },
      take: RESULT_LIMIT,
    }),
    prisma.brand.findMany({
      where: { active: true, name: { contains: q } },
      orderBy: { name: "asc" },
      take: RESULT_LIMIT,
    }),
    prisma.delivery.findMany({
      where: { OR: [{ orderNumber: { contains: q } }, { invoiceNumber: { contains: q } }] },
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
    }),
    prisma.complaint.findMany({
      where: { complaintNumber: { contains: q } },
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
    }),
  ]);

  return { products, suppliers, brands, deliveries, complaints };
}

export type GlobalSearchResults = Awaited<ReturnType<typeof globalSearch>>;
