import crypto from "node:crypto";

/** Returns a SHA-256 hex digest of the given token. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Generates a cryptographically secure random token (URL-safe base64). */
export function generateRandomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
