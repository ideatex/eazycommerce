import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 12;

/** Detects the real image type from file contents; the client-declared type is not trusted. */
function sniffImage(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: ".jpg", mime: "image/jpeg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: ".png", mime: "image/png" };
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return { ext: ".gif", mime: "image/gif" };
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return { ext: ".webp", mime: "image/webp" };
  if (buf.subarray(4, 8).toString("ascii") === "ftyp" && /avif|avis/.test(buf.subarray(8, 16).toString("ascii"))) return { ext: ".avif", mime: "image/avif" };
  return null;
}

/**
 * Admin-only product image upload. Accepts one or many files under the `files`
 * (or legacy `file`) field. SVG is rejected: it can carry scripts and would be
 * served from the site's own origin.
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    await AuthEngine.requireAdmin("products");

    const form = await request.formData();
    const files = [...form.getAll("files"), ...form.getAll("file")].filter(
      (f): f is File => typeof f !== "string"
    );
    if (files.length === 0) throw new ApiError(400, "VALIDATION", "No image file provided.");
    if (files.length > MAX_FILES) throw new ApiError(400, "VALIDATION", `Upload at most ${MAX_FILES} images at a time.`);

    const targetDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(targetDir, { recursive: true });

    const urls: string[] = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) throw new ApiError(400, "VALIDATION", `${file.name} exceeds the 10MB limit.`);
      const buffer = Buffer.from(await file.arrayBuffer());
      const type = sniffImage(buffer);
      if (!type) {
        throw new ApiError(400, "VALIDATION", `${file.name} is not a supported image. Use JPG, PNG, WEBP, GIF or AVIF.`);
      }
      const name = `product_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${type.ext}`;
      await fs.writeFile(path.join(targetDir, name), buffer);
      urls.push(`/uploads/products/${name}`);
    }

    // `url` is kept for the legacy single-file caller.
    const res = ok({ urls, url: urls[0] });
    return res;
  });
}
