import { NextResponse } from "next/server";
import { ApiError } from "@/lib/auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/** Wraps a route handler so ApiError and unexpected failures become consistent JSON errors. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) return fail(err.status, err.code, err.message);
    const code = (err as { code?: string })?.code;
    if (code === "P2002") return fail(409, "CONFLICT", "A record with the same unique value already exists.");
    if (code === "P2025") return fail(404, "NOT_FOUND", "Record not found.");
    console.error("[api]", err);
    return fail(500, "INTERNAL", "Something went wrong. Please try again.");
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new ApiError(400, "BAD_JSON", "Request body must be a JSON object.");
}

export const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v.trim() : undefined;

export function reqStr(v: unknown, field: string, max = 500): string {
  const s = str(v);
  if (!s) throw new ApiError(400, "VALIDATION", `${field} is required.`);
  if (s.length > max) throw new ApiError(400, "VALIDATION", `${field} is too long.`);
  return s;
}

export function num(
  v: unknown,
  field: string,
  opts: { min?: number; max?: number; int?: boolean } = {}
): number {
  const n =
    typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n)) throw new ApiError(400, "VALIDATION", `${field} must be a number.`);
  if (opts.int && !Number.isInteger(n))
    throw new ApiError(400, "VALIDATION", `${field} must be a whole number.`);
  if (opts.min !== undefined && n < opts.min)
    throw new ApiError(400, "VALIDATION", `${field} must be at least ${opts.min}.`);
  if (opts.max !== undefined && n > opts.max)
    throw new ApiError(400, "VALIDATION", `${field} must be at most ${opts.max}.`);
  return n;
}

export { round2, slugify } from "@/lib/math";
