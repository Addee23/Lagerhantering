"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/file-upload";
import { analyzeDeliveryDocument } from "@/lib/ai/analyze-delivery-document";
import { matchProductForDeliveryItem, matchSupplierByName } from "@/lib/ai/match-product";
import { findPossibleDuplicates } from "@/lib/product-duplicates";

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// AI:n är instruerad att svara med ett heltal, men modellen kan ändå råka
// returnera t.ex. ett decimaltal eller ett negativt värde. `documentedQuantity`
// är en Prisma Int-kolumn, som kastar ett runtime-fel om man skickar in ett
// decimaltal - så vi städar värdet innan det når databasen.
function sanitizeQuantity(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value));
}

// skills/delivery-and-ai-rules.md: AI:n skapar ENDAST ett granskningsutkast.
// Lagret rörs inte här - det händer först vid godkännande (samma
// approveDeliveryAction som den manuella leveransen använder).
export async function analyzeDeliveryDocumentAction(formData: FormData): Promise<void> {
  const file = formData.get("file") as File | null;

  let filePath: string | null;
  try {
    filePath = await saveUploadedFile(file, "delivery-documents");
  } catch (err) {
    redirect(`/deliveries/upload?error=${encodeURIComponent((err as Error).message)}`);
  }
  if (!filePath || !file) return;

  let analysisResult;
  try {
    analysisResult = await analyzeDeliveryDocument(file);
  } catch (err) {
    redirect(`/deliveries/upload?error=${encodeURIComponent((err as Error).message)}`);
  }
  const { analysis, rawResponse } = analysisResult;

  const { supplierId, rawSupplierName } = await matchSupplierByName(analysis.supplierName);

  const delivery = await prisma.delivery.create({
    data: {
      source: "AI",
      supplierId,
      rawSupplierName,
      orderNumber: analysis.orderNumber,
      invoiceNumber: analysis.invoiceNumber,
      deliveryDate: parseDate(analysis.deliveryDate ?? analysis.documentDate),
    },
  });

  await prisma.deliveryDocument.create({
    data: {
      deliveryId: delivery.id,
      filePath,
      fileName: file.name,
      aiAnalyzedAt: new Date(),
      aiRawResponse: JSON.parse(JSON.stringify(rawResponse ?? analysis)),
    },
  });

  // skills/delivery-and-ai-rules.md, 12.6: en rad som inte kan matchas ska
  // ALDRIG utelämnas - vi skapar en DeliveryItem för varje rad AI:n hittade,
  // oavsett matchningsresultat.
  for (const item of analysis.items) {
    const match = await matchProductForDeliveryItem(supplierId, {
      supplierArticleNumber: item.supplierArticleNumber,
      barcode: item.barcode,
      productName: item.productName,
    });
    const quantity = sanitizeQuantity(item.quantity);

    await prisma.deliveryItem.create({
      data: {
        deliveryId: delivery.id,
        productId: match.productId,
        matchStatus: match.matchStatus,
        rawProductName: item.productName,
        supplierArticleNumber: item.supplierArticleNumber,
        rawBarcode: item.barcode,
        fieldConfidence: { overall: item.confidence },
        documentedQuantity: quantity,
        receivedQuantity: quantity,
        expiryDate: parseDate(item.expiryDate),
        comment: item.batchNumber ? `Parti/batch: ${item.batchNumber}` : item.comment,
      },
    });
  }

  revalidatePath("/deliveries");
  redirect(`/deliveries/${delivery.id}`);
}

export async function linkExistingSupplierAction(
  deliveryId: number,
  formData: FormData,
): Promise<void> {
  const supplierId = Number(formData.get("supplierId"));
  if (!supplierId) return;

  await prisma.delivery.update({ where: { id: deliveryId }, data: { supplierId } });
  revalidatePath(`/deliveries/${deliveryId}`);
}

// skills/delivery-and-ai-rules.md, 8.1: första gången behöver bara namnet
// anges/godkännas.
export async function createSupplierFromDeliveryAction(
  deliveryId: number,
  formData: FormData,
): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supplier = await prisma.supplier.create({ data: { name } });
  await prisma.delivery.update({
    where: { id: deliveryId },
    data: { supplierId: supplier.id },
  });

  revalidatePath(`/deliveries/${deliveryId}`);
}

export async function linkDeliveryItemToProductAction(
  deliveryId: number,
  itemId: number,
  formData: FormData,
): Promise<void> {
  const productId = Number(formData.get("productId"));
  if (!productId) return;

  await prisma.deliveryItem.update({
    where: { id: itemId },
    data: { productId, matchStatus: "MATCHED" },
  });

  revalidatePath(`/deliveries/${deliveryId}`);
}

export async function confirmSuggestedMatchAction(
  deliveryId: number,
  itemId: number,
): Promise<void> {
  await prisma.deliveryItem.update({
    where: { id: itemId },
    data: { matchStatus: "MATCHED" },
  });
  revalidatePath(`/deliveries/${deliveryId}`);
}

// skills/delivery-and-ai-rules.md, 12.7: "Skapa produkt" förifyller från
// dokumentraden, men personalen skriver det namn Hela Rubbet vill använda
// och godkänner explicit innan produkten skapas.
export async function createProductFromDeliveryItemAction(
  deliveryId: number,
  itemId: number,
  formData: FormData,
): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const item = await prisma.deliveryItem.findUnique({ where: { id: itemId } });
  if (!item) return;

  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });

  // skills/business-rules.md, punkt 9: varna men blockera inte - samma
  // kontroll som den manuella produktsidan (Fas 2) använder.
  const duplicates = await findPossibleDuplicates(name, item.rawBarcode);

  const product = await prisma.product.create({
    data: {
      name,
      barcode: item.rawBarcode,
    },
  });

  await prisma.deliveryItem.update({
    where: { id: itemId },
    data: { productId: product.id, matchStatus: "MATCHED" },
  });

  if (delivery?.supplierId) {
    await prisma.supplierProduct.create({
      data: {
        productId: product.id,
        supplierId: delivery.supplierId,
        supplierProductName: item.rawProductName,
        supplierArticleNumber: item.supplierArticleNumber,
        barcode: item.rawBarcode,
      },
    });
  }

  revalidatePath(`/deliveries/${deliveryId}`);

  if (duplicates.length > 0) {
    const names = duplicates.map((d) => d.name).join(", ");
    redirect(
      `/deliveries/${deliveryId}?error=${encodeURIComponent(
        `Produkt skapad, men observera att en liknande produkt redan fanns: ${names}`,
      )}`,
    );
  }
}
