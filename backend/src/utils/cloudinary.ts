import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CLOUDINARY_URL_PREFIX = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;

export function isOurCloudinaryUrl(url: unknown): url is string {
  return typeof url === "string" && url.startsWith(CLOUDINARY_URL_PREFIX);
}

// Best-effort: a failed cleanup shouldn't block the request that replaced
// the avatar, it just leaves one orphaned asset behind.
export async function destroyAsset(publicId?: string | null) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Failed to delete Cloudinary asset", publicId, (err as Error).message);
  }
}

export { cloudinary };
