import OpenAI from "openai";

// skills/delivery-and-ai-rules.md: AI:n läser dokumentet och föreslår
// strukturerad information - den godkänner ALDRIG något själv och hittar
// aldrig på ett värde när informationen saknas (garanteras här genom att
// varje fält uttryckligen får vara null i schemat, och genom instruktionen
// nedan).

export type AiConfidence = "hog" | "medelhog" | "lag" | "okand";

export type AiDeliveryItem = {
  productName: string;
  supplierArticleNumber: string | null;
  barcode: string | null;
  quantity: number | null;
  expiryDate: string | null; // ISO-datum (YYYY-MM-DD) eller null
  batchNumber: string | null;
  comment: string | null;
  confidence: AiConfidence;
};

export type AiDeliveryAnalysis = {
  supplierName: string | null;
  orgNumber: string | null;
  customerNumber: string | null;
  orderNumber: string | null;
  invoiceNumber: string | null;
  documentDate: string | null;
  deliveryDate: string | null;
  items: AiDeliveryItem[];
};

const ITEM_SCHEMA = {
  type: "object",
  properties: {
    productName: { type: "string" },
    supplierArticleNumber: { type: ["string", "null"] },
    barcode: { type: ["string", "null"] },
    quantity: { type: ["number", "null"] },
    expiryDate: { type: ["string", "null"] },
    batchNumber: { type: ["string", "null"] },
    comment: { type: ["string", "null"] },
    confidence: { type: "string", enum: ["hog", "medelhog", "lag", "okand"] },
  },
  required: [
    "productName",
    "supplierArticleNumber",
    "barcode",
    "quantity",
    "expiryDate",
    "batchNumber",
    "comment",
    "confidence",
  ],
  additionalProperties: false,
} as const;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    supplierName: { type: ["string", "null"] },
    orgNumber: { type: ["string", "null"] },
    customerNumber: { type: ["string", "null"] },
    orderNumber: { type: ["string", "null"] },
    invoiceNumber: { type: ["string", "null"] },
    documentDate: { type: ["string", "null"] },
    deliveryDate: { type: ["string", "null"] },
    items: { type: "array", items: ITEM_SCHEMA },
  },
  required: [
    "supplierName",
    "orgNumber",
    "customerNumber",
    "orderNumber",
    "invoiceNumber",
    "documentDate",
    "deliveryDate",
    "items",
  ],
  additionalProperties: false,
} as const;

const PROMPT = `Du läser ett leveransdokument (faktura, följesedel eller orderbekräftelse) från en
leverantör till en butik/lager. Läs ut informationen nedan strukturerat.

Regler:
- Hitta ALDRIG på ett värde. Om ett fält inte går att läsa av i dokumentet, sätt det till null.
- Datum ska anges som YYYY-MM-DD.
- "quantity" är antal förpackningsenheter (flak/pall) som dokumentet anger för raden, som ett
  vanligt heltal.
- Sätt "confidence" per produktrad: "hog" om du är säker, "medelhog" om rimligt säker,
  "lag" om osäker, "okand" om du inte kunde tolka raden alls.
- Ta med VARJE produktrad i dokumentet, även om du är osäker på tolkningen.`;

export async function analyzeDeliveryDocument(
  file: File,
): Promise<{ analysis: AiDeliveryAnalysis; rawResponse: unknown }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY saknas i .env - kan inte köra AI-tolkning.");
  }

  const client = new OpenAI({ apiKey });
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  // file.type är webbläsarens egna Content-Type för filen. saveUploadedFile()
  // har redan validerat att den är en av de tillåtna typerna innan vi når hit,
  // så vi litar på den istället för att gissa MIME-typ utifrån filändelsen
  // (som lätt kan bli fel om filen egentligen är nåt annat än namnet antyder).
  const mimeType = file.type;
  const isImage = mimeType.startsWith("image/");

  const response = await client.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: PROMPT },
          isImage
            ? { type: "input_image", image_url: `data:${mimeType};base64,${base64}`, detail: "high" }
            : {
                type: "input_file",
                filename: file.name,
                file_data: `data:${mimeType};base64,${base64}`,
              },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "delivery_document_analysis",
        schema: RESPONSE_SCHEMA,
        strict: true,
      },
    },
  });

  if (!response.output_text) {
    throw new Error(
      "AI:n kunde inte tolka dokumentet (tomt svar - kan bero på att den vägrade läsa innehållet).",
    );
  }

  let analysis: AiDeliveryAnalysis;
  try {
    analysis = JSON.parse(response.output_text) as AiDeliveryAnalysis;
  } catch {
    throw new Error("AI:ns svar gick inte att tolka som JSON - försök igen eller med en annan fil.");
  }

  return { analysis, rawResponse: response };
}
