import { cookies } from "next/headers";

// Signerar sessionen med Web Crypto API (inte Node:s "crypto"-modul), eftersom
// den här filen används både i middleware (körs i Edge-miljö) och i vanliga
// server-actions (körs i Node) - Web Crypto fungerar i båda.

const COOKIE_NAME = "lagerhantering_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 dagar

const encoder = new TextEncoder();

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET saknas i .env");
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToHex(signature);
}

async function isValidSignature(payload: string, signatureHex: string): Promise<boolean> {
  const key = await getSigningKey();
  const signatureBytes = hexToBytes(signatureHex) as unknown as BufferSource;
  return crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(payload));
}

export type Session = { username: string };

/** Verifierar en rå sessionstoken-sträng (t.ex. från middleware). */
export async function verifySessionToken(token: string): Promise<Session | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [username, expiresAtRaw, signature] = parts;
  const payload = `${username}.${expiresAtRaw}`;

  if (!(await isValidSignature(payload, signature))) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return { username };
}

/** Skapar en inloggad session och sparar den som en httpOnly-cookie. */
export async function createSessionCookie(username: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${username}.${expiresAt}`;
  const signature = await sign(payload);
  const token = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Läser och verifierar sessionen från cookien (i Server Components/Actions). */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
