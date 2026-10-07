import { createHmac, timingSafeEqual } from "node:crypto";

export const SIGNATURE_HEADER = "x-storefront-signature";

/** Lowercase hex HMAC-SHA256 of the exact request body, as the API sends it. */
export function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

export function verify(body: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret || !signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = Buffer.from(sign(body, secret), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Tags we accept: "site:<slug>" and "host:<domain>". */
export function parseTags(body: string): string[] | null {
  try {
    const parsed = JSON.parse(body) as { tags?: unknown };
    if (!Array.isArray(parsed.tags) || parsed.tags.length === 0 || parsed.tags.length > 50) return null;
    const tags = parsed.tags.filter((t): t is string => typeof t === "string" && /^(site|host):[a-z0-9.-]{1,253}$/.test(t));
    return tags.length === parsed.tags.length ? tags : null;
  } catch {
    return null;
  }
}
