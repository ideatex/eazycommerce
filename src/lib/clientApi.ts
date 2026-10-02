/** Browser-side helper for the JSON API. Never reports success unless the server did. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

export async function apiRequest<T = unknown>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    let json: { success?: boolean; data?: T; error?: { message?: string } } | null = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    if (res.ok && json?.success) return { ok: true, data: json.data as T };
    return {
      ok: false,
      status: res.status,
      error: json?.error?.message || `Request failed (${res.status}). Please try again.`,
    };
  } catch {
    return { ok: false, status: 0, error: "Network error. Check your connection and try again." };
  }
}
