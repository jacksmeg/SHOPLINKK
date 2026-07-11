import type { UploadPurpose } from "@/lib/storage";

export async function uploadImage(file: File, purpose: Exclude<UploadPurpose, "product-video"> = "profile") {
  return uploadFile(file, "image", purpose);
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
