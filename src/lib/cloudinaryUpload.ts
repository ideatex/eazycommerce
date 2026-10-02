import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "@/lib/auth";

const cloudName = () => process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** True when Cloudinary credentials are present (CLOUDINARY_URL, or the three separate variables). */
export function cloudinaryConfigured(): boolean {
  return !!(process.env.CLOUDINARY_URL || (cloudName() && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET));
}

let configured = false;
function configure() {
  if (configured) return;
  // CLOUDINARY_URL is read by the SDK itself; the split variables need explicit config.
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: cloudName(),
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  configured = true;
}

/** Uploads an already-validated image buffer and returns its HTTPS URL. */
export async function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  configure();
  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "vanigam/products", public_id: publicId, resource_type: "image", overwrite: false }, (err, res) =>
          err || !res ? reject(err ?? new Error("Empty Cloudinary response")) : resolve(res)
        )
        .end(buffer);
    });
    return result.secure_url;
  } catch (err) {
    console.error("[upload] Cloudinary upload failed:", (err as Error).message);
    throw new ApiError(502, "STORAGE_ERROR", "The image could not be stored. Please try again.");
  }
}
