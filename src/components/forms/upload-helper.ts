import type { UploadPurpose } from "@/lib/storage";

export async function uploadImage(file: File, purpose: Exclude<UploadPurpose, "product-video"> = "profile") {
  const prepared = await prepareImage(file, purpose);
  return uploadFile(prepared, "image", purpose);
}

export async function uploadVideo(file: File) {
  return uploadFile(file, "video", "product-video");
}

async function uploadFile(file: File, type: "image" | "video", purpose: UploadPurpose) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("purpose", purpose);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Upload failed");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export async function prepareImage(file: File, purpose: Exclude<UploadPurpose, "product-video">) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const settings = {
    "store-logo": { width: 800, height: 800, crop: true },
    profile: { width: 800, height: 800, crop: true },
    "store-cover": { width: 1600, height: 900, crop: true },
    category: { width: 900, height: 700, crop: true },
    "platform-logo": { width: 800, height: 800, crop: true },
    product: { width: 1600, height: 1200, crop: false },
    advert: { width: 1200, height: 760, crop: true },
    chat: { width: 1280, height: 1280, crop: false },
    "seller-document": { width: 1600, height: 1600, crop: false },
    "rider-document": { width: 1600, height: 1600, crop: false },
  } satisfies Record<Exclude<UploadPurpose, "product-video">, { width: number; height: number; crop: boolean }>;

  const target = settings[purpose];
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = target.crop
    ? Math.max(target.width / bitmap.width, target.height / bitmap.height)
    : Math.min(1, target.width / bitmap.width, target.height / bitmap.height);
  const width = Math.round(target.crop ? target.width : bitmap.width * scale);
  const height = Math.round(target.crop ? target.height : bitmap.height * scale);
  const sourceWidth = target.crop ? Math.round(target.width / scale) : bitmap.width;
  const sourceHeight = target.crop ? Math.round(target.height / scale) : bitmap.height;
  const sourceX = target.crop ? Math.max(0, Math.round((bitmap.width - sourceWidth) / 2)) : 0;
  const sourceY = target.crop ? Math.max(0, Math.round((bitmap.height - sourceHeight) / 2)) : 0;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;

  context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") || "shoplinkk-image";
  return new File([blob], `${name}.webp`, { type: "image/webp" });
}
