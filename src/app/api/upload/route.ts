import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided." },
        { status: 400 }
      );
    }

    // Supported mime types
    const validMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ];

    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file format. Supported formats: JPG, PNG, WEBP, GIF, SVG, AVIF.",
        },
        { status: 400 }
      );
    }

    // Max file size: 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { success: false, error: "File exceeds 10MB limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize base name and preserve extension
    const originalExt = path.extname(file.name) || ".png";
    const sanitizedBase = path
      .basename(file.name, originalExt)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30)
      .toLowerCase();

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const fileName = `product_${timestamp}_${sanitizedBase || "img"}_${randomSuffix}${originalExt.toLowerCase()}`;

    // Target directory: public/uploads/products/
    const targetDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/products/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("Admin image upload error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to upload image." },
      { status: 500 }
    );
  }
}
