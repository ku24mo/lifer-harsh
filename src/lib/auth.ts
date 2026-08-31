import { cookies } from "next/headers";
import crypto from "crypto";
import { SESSION_COOKIE } from "@/lib/auth-constants";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * The expected passcode hash (sha256 hex) is stored in PASSCODE_HASH env var.
 * Generate one with: node -e "console.log(require('crypto').createHash('sha256').digest('yourpass').toString('hex'))"
 * Wait — that hashes empty string. Use:
 *   node -e "console.log(require('crypto').createHash('sha256').update('yourpass').digest('hex'))"
 */
export function hashPasscode(passcode: string): string {
  return crypto.createHash("sha256").update(passcode).digest("hex");
}

export function expectedHash(): string | undefined {
  return process.env.PASSCODE_HASH;
}

export function verifyPasscode(passcode: string): boolean {
  const expected = expectedHash();
  if (!expected) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hashPasscode(passcode), "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/** Random session token, stored in cookie + verified against nothing else
 * (the cookie itself is the proof of login). HttpOnly + Secure in prod. */
export function issueSession(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  // If no passcode is configured, allow everything (local dev convenience).
  if (!expectedHash()) return true;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return Boolean(token && token.length === 64);
}
