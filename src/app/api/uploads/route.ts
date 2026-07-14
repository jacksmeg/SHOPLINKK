import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError, requireApiSession } from "@/lib/api";
import { uploadImageAsset, uploadPurposes, uploadVideoAsset, type UploadPurpose } from "@/lib/storage";

const sellerPurposes: UploadPurpose[] = ["store-logo", "store-cover", "advert", "product", "seller-document", "product-video"];
const adminOnlyPurposes: UploadPurpose[] = ["category", "platform-logo"];
const riderPurposes: UploadPurpose[] = ["rider-document"];
const signedInPurposes: UploadPurpose[] = ["payment-proof", "chat", "profile"];

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "uploads", 30, 60_000);
  if (limited) return limited;

  const { session, error } = await requireApiSession();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file");
  const type = formData.get("type");
  const purpose = formData.get("purpose");

  if (!(file instanceof File)) {
    return jsonError("No file uploaded");
  }

  if (typeof purpose !== "string" || !uploadPurposes.includes(purpose as UploadPurpose)) {
    return jsonError("Choose a valid upload type");
  }

  const uploadPurpose = purpose as UploadPurpose;
  if (sellerPurposes.includes(uploadPurpose) && !["SELLER", "ADMIN"].includes(session.user.role)) {
    return jsonError("Only sellers can upload this type of media", 403);
  }

  if (riderPurposes.includes(uploadPurpose) && !["BUYER", "SELLER", "RIDER", "ADMIN"].includes(session.user.role)) {
    return jsonError("Only signed-in rider applicants can upload rider documents", 403);
  }

  if (signedInPurposes.includes(uploadPurpose) && !session.user.id) {
    return jsonError("Please sign in before uploading this file", 401);
  }

  if (adminOnlyPurposes.includes(uploadPurpose) && session.user.role !== "ADMIN") {
    return jsonError("Only admins can upload this type of media", 403);
  }

  if (type === "video" && uploadPurpose !== "product-video") {
    return jsonError("Videos can only be attached to product listings");
  }

  if (type !== "image" && type !== "video") {
    return jsonError("Choose an image or video file to upload");
  }

  if (type !== "video" && uploadPurpose === "product-video") {
    return jsonError("Choose a video file for this upload");
  }

  try {
    const url = type === "video"
      ? await uploadVideoAsset(file)
      : await uploadImageAsset(file, uploadPurpose as Exclude<UploadPurpose, "product-video">);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return jsonError(message, message.includes("must be configured") ? 503 : 400);
  }
}
