/**
 * Admin-entered links and image URLs are rendered into the public site, so only
 * site-relative paths and http(s) URLs are allowed (no javascript:, data:, etc.).
 */
export function safeHref(url: unknown, fallback = "/"): string {
  if (typeof url !== "string") return fallback;
  const value = url.trim();
  if (/^\/(?!\/)/.test(value)) return value;
  if (/^https?:\/\/[^\s]+$/i.test(value)) return value;
  return fallback;
}

export function safeImage(url: unknown): string | null {
  const href = safeHref(url, "");
  return href || null;
}

export const asString = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
export const asNumber = (v: unknown, fallback: number): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
