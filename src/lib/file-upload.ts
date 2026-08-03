import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

// skills/ui-and-mobile-rules.md / projektplanens "26. Dokument och bilder":
// tillåtna filtyper och maximal filstorlek. Filerna sparas lokalt under
// public/uploads (inte i Git - se .gitignore) - för produktion hade en
// molnlagring (t.ex. S3) varit bättre, men lokal disk räcker för projektet.

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function saveUploadedFile(
  file: File | null,
  subfolder: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Filen är för stor (max 5 MB).");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Filtypen stöds inte (tillåtet: JPG, PNG, WEBP, PDF).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name) || "";
  const filename = `${crypto.randomUUID()}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${subfolder}/${filename}`;
}
