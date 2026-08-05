import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

// skills/technology-rules.md: IMAP för att läsa inkommande reklamationsmejl.
// Samma Gmail-konto som SMTP (Fas 9) om inga separata IMAP_*-uppgifter
// finns i .env - i den här testmiljön är det samma inkorg som skickar och
// tar emot.

export type IncomingEmail = {
  messageId: string;
  inReplyTo: string | null;
  fromAddress: string;
  subject: string;
  text: string;
  receivedAt: Date;
};

// Hur långt tillbaka vi letar efter mejl - räcker gott för en reklamation
// som normalt får svar inom några dagar/veckor, och håller varje hämtning
// snabb även om inkorgen har mycket äldre historik.
const LOOKBACK_DAYS = 60;

function normalizeReference(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// Hämtar mejl mottagna de senaste LOOKBACK_DAYS dagarna i inkorgen. Dedup mot
// redan importerade meddelanden görs av anroparen (via messageId), inte här -
// det är enklare och mer robust än att lita på IMAP:s \Seen-flagga, som kan
// råka ändras av att någon bara öppnar mejlet i sin vanliga Gmail-app.
export async function fetchIncomingEmails(): Promise<IncomingEmail[]> {
  const host = process.env.IMAP_HOST || "imap.gmail.com";
  const port = Number(process.env.IMAP_PORT || 993);
  const user = process.env.IMAP_USER || process.env.SMTP_USER;
  const pass = process.env.IMAP_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      "IMAP-uppgifter saknas i .env (IMAP_USER/IMAP_PASS, eller SMTP_USER/SMTP_PASS som återanvänds) - kan inte hämta mejl.",
    );
  }

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const emails: IncomingEmail[] = [];

  await client.connect();
  try {
    await client.mailboxOpen("INBOX");

    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    for await (const message of client.fetch({ since }, { source: true, envelope: true })) {
      if (!message.source) continue;
      const parsed = await simpleParser(message.source);
      if (!parsed.messageId) continue; // kan inte dedupas/matchas utan ett Message-ID

      emails.push({
        messageId: parsed.messageId,
        inReplyTo: parsed.inReplyTo ?? normalizeReference(parsed.references),
        fromAddress: parsed.from?.value[0]?.address ?? "okänd@okänd",
        subject: parsed.subject ?? "(inget ämne)",
        text: parsed.text ?? "",
        receivedAt: parsed.date ?? message.envelope?.date ?? new Date(),
      });
    }
  } finally {
    await client.logout();
  }

  return emails;
}
