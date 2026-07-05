// Minimal cookie-based admin auth. One env-var password.
// We sign a session cookie so the password isn't stored client-side.

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "gigi_admin";
const SESSION_DURATION_DAYS = 7;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Missing env: ADMIN_SESSION_SECRET");
  return secret;
}

function getPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("Missing env: ADMIN_PASSWORD");
  return pw;
}

// Sign a payload with HMAC so we can verify it later
function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

// Build a "{timestamp}.{signature}" cookie value
function makeToken(): string {
  const ts = Date.now().toString();
  return `${ts}.${sign(ts)}`;
}

// Verify a cookie value is signed by us and not expired
function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [tsStr, sig] = token.split(".");
  if (!tsStr || !sig) return false;
  const expected = sign(tsStr);
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const ts = parseInt(tsStr, 10);
  if (isNaN(ts)) return false;
  const ageMs = Date.now() - ts;
  return ageMs < SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
}

// Check if request is authenticated (call in server components / route handlers)
export async function isAdminAuthed(): Promise<boolean> {
  const c = await cookies();
  return verifyToken(c.get(COOKIE_NAME)?.value);
}

// Set the auth cookie after a successful password match
export async function setAdminCookie(): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

// Wipe the auth cookie (logout)
export async function clearAdminCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

// Constant-time password check
export function checkPassword(submitted: string): boolean {
  const actual = getPassword();
  if (submitted.length !== actual.length) return false;
  try {
    return timingSafeEqual(Buffer.from(submitted), Buffer.from(actual));
  } catch {
    return false;
  }
}
