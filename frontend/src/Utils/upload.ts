import { api } from "./api";

export interface UploadResult {
    url: string;
    publicId: string;
}

// Uploads directly from the browser to Cloudinary (not proxied through our
// API server) using a short-lived signature from the backend, so image
// bytes never load onto the Node process.
export async function uploadImage(file: File | Blob, folder: string): Promise<UploadResult> {
    const { timestamp, signature, apiKey, cloudName } = await api.getUploadSignature(folder);

    const form = new FormData();
    form.append("file", file, file instanceof File ? file.name : "avatar.jpg");
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
    form.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");

    return { url: data.secure_url, publicId: data.public_id };
}
