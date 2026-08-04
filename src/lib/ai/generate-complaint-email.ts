import OpenAI from "openai";

// skills/complaint-and-email-rules.md: AI:n skapar ett professionellt
// mejlutkast utifrån avvikelserna - mejlet skickas ALDRIG automatiskt,
// personalen läser igenom, redigerar och PIN-bekräftar innan sändning
// (samma "utkast, aldrig ett beslut"-princip som leveranstolkningen i Fas 6).

export type ComplaintEmailIssue = {
  productName: string;
  type: string;
  comment: string | null;
  damagedQuantity: number | null;
  discarded: boolean | null;
  wantedAction: string | null;
};

export type ComplaintEmailContext = {
  complaintNumber: string;
  supplierName: string;
  deliveryDate: string | null;
  orderNumber: string | null;
  invoiceNumber: string | null;
  issues: ComplaintEmailIssue[];
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
  additionalProperties: false,
} as const;

const PROMPT = `Du skriver ett professionellt reklamationsmejl på svenska från butiken "Hela Rubbet" till en
leverantör, baserat på strukturerad data om en leverans och dess avvikelser.

Regler:
- Använd ENDAST informationen som ges nedan - hitta aldrig på datum, nummer eller avvikelser som
  inte finns i datan.
- Ämnesraden ska innehålla reklamationsnumret, t.ex. "Reklamation REK-2026-0001 - Faktura 45872"
  (använd fakturanummer om det finns, annars ordernummer, annars inget nummer alls i ämnesraden).
- Brödtexten ska vara kortfattad, saklig och professionell: hänvisa till leveransen (datum/order-
  /fakturanummer om det finns), lista varje avvikelse tydligt, och avsluta med vad butiken önskar
  (kreditering, ny leverans, eller vad "wantedAction" anger per rad - om den saknas, be leverantören
  återkomma med förslag på lösning).
- Skriv brödtexten som vanlig text (inga markdown-rubriker eller HTML), redo att klistras in i ett
  vanligt mejl. Avsluta med en enkel hälsningsfras och "Hela Rubbet".`;

export async function generateComplaintEmailDraft(
  context: ComplaintEmailContext,
): Promise<{ subject: string; body: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY saknas i .env - kan inte generera mejlutkast.");
  }

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: PROMPT },
          { type: "input_text", text: JSON.stringify(context) },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "complaint_email_draft",
        schema: RESPONSE_SCHEMA,
        strict: true,
      },
    },
  });

  if (!response.output_text) {
    throw new Error("AI:n kunde inte skapa ett mejlutkast (tomt svar) - försök igen.");
  }

  try {
    return JSON.parse(response.output_text) as { subject: string; body: string };
  } catch {
    throw new Error("AI:ns svar gick inte att tolka - försök igen.");
  }
}
