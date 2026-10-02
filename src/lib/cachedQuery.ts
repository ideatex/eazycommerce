import { unstable_cache } from "next/cache";

const lastLogged = new Map<string, number>();

/** One concise line per minute per label, instead of a stack trace on every request. */
function logOnce(label: string, err: unknown) {
  const now = Date.now();
  if (now - (lastLogged.get(label) ?? 0) < 60_000) return;
  lastLogged.set(label, now);
  const e = err as { code?: string; message?: string };
  const firstLine = (e?.message ?? String(err)).split("\n").map((l) => l.trim()).filter(Boolean).pop();
  console.error(`[${label}] ${e?.code ? `${e.code}: ` : ""}${firstLine}`);
}

/**
 * Site-wide settings (SEO, header, store name) are read on every page render.
 * Cache them briefly so a request does not hit the database three times, and
 * never let a database problem take the page down: fall back instead.
 * A failed read throws inside the cached function, so errors are not cached.
 */
export function cachedSetting<T>(label: string, fn: () => Promise<T>, fallback: T, revalidateSeconds = 300) {
  const cached = unstable_cache(fn, [label], { revalidate: revalidateSeconds, tags: ["site-settings"] });
  return async (): Promise<T> => {
    try {
      return await cached();
    } catch (err) {
      logOnce(label, err);
      return fallback;
    }
  };
}
