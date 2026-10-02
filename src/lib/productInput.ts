import { ApiError } from "@/lib/auth";
import { str, num, reqStr } from "@/lib/api";
import { ProductStatus } from "@/lib/types";

const STATUSES: string[] = Object.values(ProductStatus);
const HSN_RE = /^[0-9.]{2,12}$/;
const GST_SLABS = [0, 5, 12, 18, 28];

export interface ProductFields {
  title?: string;
  sku?: string;
  description?: string;
  shortDescription?: string | null;
  basePrice?: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  moq?: number;
  hsnCode?: string | null;
  taxRatePercent?: number;
  status?: string;
  tags?: string | null;
  brand?: string | null;
  categoryId?: string | null;
}

const optNullableNum = (v: unknown, field: string) =>
  v === null || v === "" ? null : num(v, field, { min: 0 });

/** Validates the fields present in `body`. With `requireCore`, title/sku/basePrice are mandatory. */
export function parseProductFields(body: Record<string, unknown>, requireCore: boolean): ProductFields {
  const out: ProductFields = {};

  if (requireCore || body.title !== undefined) out.title = reqStr(body.title, "Product title", 200);
  if (requireCore || body.sku !== undefined) {
    const sku = reqStr(body.sku, "SKU", 64).toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(sku))
      throw new ApiError(400, "VALIDATION", "SKU may only contain letters, numbers, dot, dash and underscore.");
    out.sku = sku;
  }
  if (requireCore || body.basePrice !== undefined)
    out.basePrice = num(body.basePrice, "Selling price", { min: 0.01, max: 100_000_000 });

  if (body.description !== undefined) out.description = (str(body.description) ?? "").slice(0, 20000);
  if (body.shortDescription !== undefined) out.shortDescription = (str(body.shortDescription) || "").slice(0, 500) || null;
  if (body.compareAtPrice !== undefined) out.compareAtPrice = optNullableNum(body.compareAtPrice, "Compare-at price");
  if (body.costPrice !== undefined) out.costPrice = optNullableNum(body.costPrice, "Cost price");
  if (body.moq !== undefined) out.moq = num(body.moq, "Minimum order quantity", { int: true, min: 1, max: 100000 });
  if (body.hsnCode !== undefined) {
    const hsn = str(body.hsnCode) || "";
    if (hsn && !HSN_RE.test(hsn)) throw new ApiError(400, "VALIDATION", "HSN code must be digits (dots allowed).");
    out.hsnCode = hsn || null;
  }
  if (body.taxRatePercent !== undefined) {
    const rate = num(body.taxRatePercent, "GST rate", { min: 0, max: 28 });
    if (!GST_SLABS.includes(rate)) throw new ApiError(400, "VALIDATION", "GST rate must be 0, 5, 12, 18 or 28.");
    out.taxRatePercent = rate;
  }
  if (body.status !== undefined) {
    const status = reqStr(body.status, "Status", 20);
    if (!STATUSES.includes(status)) throw new ApiError(400, "VALIDATION", "Status must be DRAFT, PUBLISHED or ARCHIVED.");
    out.status = status;
  }
  if (body.tags !== undefined) out.tags = (str(body.tags) || "").slice(0, 500) || null;
  if (body.brand !== undefined) out.brand = (str(body.brand) || "").slice(0, 120) || null;
  if (body.categoryId !== undefined) out.categoryId = str(body.categoryId) || null;

  if (out.compareAtPrice != null && out.basePrice != null && out.compareAtPrice < out.basePrice) {
    throw new ApiError(400, "VALIDATION", "Compare-at price must not be lower than the selling price.");
  }
  return out;
}

export function parseImages(v: unknown): string[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) throw new ApiError(400, "VALIDATION", "images must be a list of URLs.");
  if (v.length > 12) throw new ApiError(400, "VALIDATION", "A product can have at most 12 images.");
  return v.map((u) => {
    const url = typeof u === "string" ? u.trim() : "";
    // Local uploads (/uploads/...) or absolute http(s) URLs only; no javascript:/data: URLs.
    if (!/^(\/[^/\s]|https?:\/\/)[^\s]*$/.test(url) || url.length > 1000)
      throw new ApiError(400, "VALIDATION", "Every image must be an http(s) URL or an uploaded file path.");
    return url;
  });
}

export function parseTiers(v: unknown): Array<{ minQuantity: number; price: number }> | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) throw new ApiError(400, "VALIDATION", "priceTiers must be a list.");
  if (v.length > 10) throw new ApiError(400, "VALIDATION", "At most 10 wholesale tiers are allowed.");
  const tiers = v.map((t) => {
    const row = (t ?? {}) as Record<string, unknown>;
    return {
      minQuantity: num(row.minQuantity, "Tier quantity", { int: true, min: 2, max: 1_000_000 }),
      price: num(row.price, "Tier price", { min: 0.01 }),
    };
  });
  const seen = new Set<number>();
  for (const t of tiers) {
    if (seen.has(t.minQuantity)) throw new ApiError(400, "VALIDATION", "Wholesale tiers must have unique quantities.");
    seen.add(t.minQuantity);
  }
  return tiers.sort((a, b) => a.minQuantity - b.minQuantity);
}

export interface VariantInput {
  title: string;
  sku: string;
  price: number;
  stock: number;
  attributesJson: string;
}

export function parseVariants(v: unknown, fallback: { sku: string; price: number }): VariantInput[] {
  if (v === undefined) return [{ title: "Standard", sku: fallback.sku, price: fallback.price, stock: 0, attributesJson: "{}" }];
  if (!Array.isArray(v) || v.length === 0 || v.length > 50)
    throw new ApiError(400, "VALIDATION", "Provide between 1 and 50 variants.");
  const skus = new Set<string>();
  return v.map((raw) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    const sku = reqStr(row.sku, "Variant SKU", 64).toUpperCase();
    if (skus.has(sku)) throw new ApiError(400, "VALIDATION", `Duplicate variant SKU ${sku}.`);
    skus.add(sku);
    let attributesJson = "{}";
    if (row.attributesJson !== undefined) {
      try {
        const parsed = JSON.parse(String(row.attributesJson));
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        attributesJson = JSON.stringify(parsed);
      } catch {
        throw new ApiError(400, "VALIDATION", "Variant attributes must be a JSON object.");
      }
    }
    return {
      title: (str(row.title) || "Standard").slice(0, 120),
      sku,
      price: num(row.price, "Variant price", { min: 0.01 }),
      stock: num(row.stock ?? 0, "Variant stock", { int: true, min: 0, max: 10_000_000 }),
      attributesJson,
    };
  });
}
