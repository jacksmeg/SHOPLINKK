import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getIntegrationConfig } from "@/lib/integration-settings";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

export const uploadPurposes = [
  "profile",
  "store-logo",
  "store-cover",
  "category",
  "platform-logo",
  "product",
  "advert",
  "seller-document",
  "rider-document",
  "payment-proof",
  "chat",
  "product-video",
] as const;

export type UploadPurpose = (typeof uploadPurposes)[number];

const uploadFolders: Record<UploadPurpose, string> = {
  profile: "shoplinkk/profiles",
  "store-logo": "shoplinkk/stores/logos",
  "store-cover": "shoplinkk/stores/covers",
  category: "shoplinkk/categories",
  "platform-logo": "shoplinkk/platform",
  product: "shoplinkk/products",
  advert: "shoplinkk/adverts",
  "seller-document": "shoplinkk/seller-documents",
  "rider-document": "shoplinkk/rider-documents",
  "payment-proof": "shoplinkk/payment-proofs",
  chat: "shoplinkk/chat",
  "product-video": "shoplinkk/products/videos",
};

export function assertImageFile(file: File) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Images must be 5MB or smaller");
  }
}

export async function uploadImageAsset(file: File, purpose: Exclude<UploadPurpose, "product-video">) {
  assertImageFile(file);
  return uploadAsset(await optimizeImage(file), "image", purpose);
}

export function assertVideoFile(file: File) {
  if (!allowedVideoTypes.includes(file.type)) {
    throw new Error("Only MP4, WebM, and MOV videos are allowed");
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new Error("Videos must be 50MB or smaller");
  }
}

export async function uploadVideoAsset(file: File) {
  assertVideoFile(file);
  return uploadAsset(file, "video", "product-video");
}

async function uploadAsset(file: File, resourceType: "image" | "video", purpose: UploadPurpose) {
  const cloudinary = await getIntegrationConfig("CLOUDINARY");
  const cloudName = cloudinary.enabled ? cloudinary.values.cloudName : "";
  const apiKey = cloudinary.enabled ? cloudinary.values.apiKey : "";
  const apiSecret = cloudinary.enabled ? cloudinary.values.apiSecret : "";

  if (cloudName && apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = uploadFolders[purpose];
    const tags = `shoplinkk,${purpose}`;
    const signature = cloudinarySignature({ folder, tags, timestamp, unique_filename: "true" }, apiSecret);
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("folder", folder);
    form.append("tags", tags);
    form.append("unique_filename", "true");
    form.append("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error("Cloud upload failed");
    }

    const data = (await response.json()) as { secure_url?: string };
    if (!data.secure_url) {
      throw new Error("Cloud upload did not return a URL");
    }

    return resourceType === "image" && file.type !== "image/gif"
      ? cloudinaryOptimizedUrl(data.secure_url)
      : data.secure_url;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Cloudinary media storage must be configured before uploads can be used in production");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${randomUUID()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", purpose);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${purpose}/${filename}`;
}

function cloudinarySignature(parameters: Record<string, string | number>, apiSecret: string) {
  const payload = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

function cloudinaryOptimizedUrl(url: string) {
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}

async function optimizeImage(file: File) {
  const tinify = await getIntegrationConfig("TINIFY");
  if (!tinify.enabled || !tinify.values.apiKey || file.type === "image/gif") return file;

  const authorization = `Basic ${Buffer.from(`api:${tinify.values.apiKey}`).toString("base64")}`;
  const shrink = await fetch("https://api.tinify.com/shrink", {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": file.type,
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  const resultUrl = shrink.headers.get("location");
  if (!shrink.ok || !resultUrl) throw new Error("Image optimization failed");
  const optimized = await fetch(resultUrl, { headers: { Authorization: authorization } });
  if (!optimized.ok) throw new Error("Optimized image could not be downloaded");

  return new File([await optimized.arrayBuffer()], file.name, {
    type: optimized.headers.get("content-type") || file.type,
  });
}
