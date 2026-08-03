import { prisma } from "@/lib/prisma";

// skills/business-rules.md, punkt 9 (dubblettkontroll): varna men blockera
// inte. Vi kollar samma streckkod eller ett namn som innehåller/innehålls i
// det nya namnet. Ligger i en vanlig (icke "use server") fil så att både den
// manuella produktsidan (Fas 2) och AI-flödets "Skapa produkt" (Fas 6) kan
// återanvända samma kontroll istället för att duplicera den.
export async function findPossibleDuplicates(name: string, barcode: string | null) {
  const [byBarcode, bySimilarName] = await Promise.all([
    barcode ? prisma.product.findMany({ where: { barcode } }) : Promise.resolve([]),
    prisma.product.findMany({ where: { name: { contains: name } } }),
  ]);

  const byId = new Map<number, { id: number; name: string }>();
  for (const product of [...byBarcode, ...bySimilarName]) {
    byId.set(product.id, { id: product.id, name: product.name });
  }
  return Array.from(byId.values());
}
