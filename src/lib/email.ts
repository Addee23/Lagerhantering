import nodemailer from "nodemailer";
import path from "path";

// skills/technology-rules.md: SMTP för utgående mejl. Uppgifterna ligger i
// .env och committas aldrig (samma mönster som OPENAI_API_KEY i Fas 6).

export type OutgoingAttachment = { filename: string; filePath: string };

function resolveUploadPath(filePath: string): string {
  // filePath är alltid en webb-sökväg som börjar med /uploads/... (se
  // src/lib/file-upload.ts) - måste göras om till en riktig filsystemssökväg
  // under public/ innan nodemailer kan läsa filen.
  return path.join(process.cwd(), "public", filePath);
}

export async function sendEmail(params: {
  to: string;
  cc?: string | null;
  subject: string;
  text: string;
  attachments?: OutgoingAttachment[];
}): Promise<{ messageId: string }> {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP-uppgifter saknas i .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) - kan inte skicka mejl.",
    );
  }

  // SMTP_SECURE är valfri - om den inte är satt gissar vi utifrån porten
  // (465 = implicit TLS). Port 587 (som Gmail m.fl. använder) vill ha
  // secure: false, TLS förhandlas då fram via STARTTLS istället.
  const secure = SMTP_SECURE != null ? SMTP_SECURE === "true" : Number(SMTP_PORT) === 465;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const info = await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: params.to,
    cc: params.cc || undefined,
    subject: params.subject,
    text: params.text,
    attachments: params.attachments?.map((a) => ({
      filename: a.filename,
      path: resolveUploadPath(a.filePath),
    })),
  });

  // Sparas på ComplaintEmail så att ett inkommande svar kan trådmatchas mot
  // det här mejlet via In-Reply-To/References (Fas 10).
  return { messageId: info.messageId };
}
