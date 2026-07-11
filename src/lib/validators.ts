import { z } from "zod";

const acceptedTermsSchema = z.preprocess(
  (value) => value === true || value === "true",
  z.boolean().refine((value) => value, "Accept the Terms, Privacy Policy, and License Agreement"),
);

const imageValue = z.union([
  z.url(),
  z.string().regex(/^\/uploads\/.+/, "Upload image first"),
]);

const mediaValue = z.union([
  z.url(),
  z.string().regex(/^\/uploads\/.+/, "Upload media first"),
]);

export const ghanaPhoneSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.replace(/[\s-]/g, "") : value),
  z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^(\+233|0)?[235][0-9]{8}$/, "Use a valid Ghana phone number"),
);

export const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Use at least 3 characters")
    .max(30, "Use 30 characters or fewer")
    .regex(/^[a-z0-9_]+$/, "Use only letters, numbers, and underscore"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
  phone: ghanaPhoneSchema,
  location: z.string().min(2).default("Dunkwa-on-Offin"),
  termsAccepted: acceptedTermsSchema,
});

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your username, email address, or Ghana phone number"),
  password: z.string().min(1, "Enter your password"),
  termsAccepted: acceptedTermsSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
  token: z.string().min(10),
  password: z.string().min(8, "Use at least 8 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Use at least 8 characters"),
});

export const deleteAccountSchema = z.object({
  reason: z.string().max(1000).optional().or(z.literal("")),
});

export const phoneOtpSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, "Enter the 6-digit code"),
});

export const emailVerificationRequestSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  phone: ghanaPhoneSchema,
  whatsapp: ghanaPhoneSchema.optional().or(z.literal("")),
  location: z.string().min(2),
  area: z.string().max(80).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  image: imageValue.optional().or(z.literal("")),
});

export const storeSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(900).optional().or(z.literal("")),
  phone: ghanaPhoneSchema,
  whatsapp: ghanaPhoneSchema.optional().or(z.literal("")),
  location: z.string().min(2).default("Dunkwa-on-Offin"),
  area: z.string().max(80).optional().or(z.literal("")),
  address: z.string().max(160).optional().or(z.literal("")),
  openingHours: z.string().max(160).optional().or(z.literal("")),
  logoUrl: imageValue.optional().or(z.literal("")),
  coverUrl: imageValue.optional().or(z.literal("")),
});

export const productSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(20),
  categoryId: z.string().min(1),
  price: z.coerce.number().positive(),
  condition: z.enum(["NEW", "USED", "REFURBISHED"]).default("USED"),
  location: z.string().min(2).default("Dunkwa-on-Offin"),
  area: z.string().max(80).optional().or(z.literal("")),
  pickupNote: z.string().max(240).optional().or(z.literal("")),
  stockStatus: z.enum(["AVAILABLE", "SOLD", "OUT_OF_STOCK"]).default("AVAILABLE"),
  listingStatus: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "REMOVED"]).optional(),
  negotiable: z.coerce.boolean().default(true),
  allowCalls: z.coerce.boolean().default(true),
  allowWhatsapp: z.coerce.boolean().default(true),
  videoUrl: mediaValue.optional().or(z.literal("")),
  seoTitle: z.string().max(80).optional().or(z.literal("")),
  seoDescription: z.string().max(160).optional().or(z.literal("")),
  imageUrls: z.array(imageValue).min(1, "Add at least one product image").max(12),
});

export const productFilterSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  location: z.string().optional(),
  area: z.string().optional(),
  condition: z.enum(["NEW", "USED", "REFURBISHED"]).optional(),
  sort: z.enum(["featured", "newest", "price_low", "price_high", "popular", "nearest"]).optional(),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(2000),
  attachments: z
    .array(
      z.object({
        url: imageValue,
        type: z.string().min(1),
        name: z.string().optional(),
        size: z.number().optional(),
      }),
    )
    .max(4)
    .optional(),
});

export const reportSchema = z.object({
  productId: z.string().optional(),
  messageId: z.string().optional(),
  reportedUserId: z.string().optional(),
  reason: z.string().min(3),
  details: z.string().max(1000).optional().or(z.literal("")),
});

export const savedSearchSchema = z.object({
  name: z.string().min(2),
  query: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  alertsEnabled: z.coerce.boolean().default(false),
});

export const priceAlertSchema = z.object({
  productId: z.string().min(1),
  targetPrice: z.coerce.number().positive().optional(),
});

export const compareProductSchema = z.object({
  productId: z.string().min(1),
});

export const typingStatusSchema = z.object({
  isTyping: z.coerce.boolean(),
});

export const boostRequestSchema = z.object({
  placement: z.enum(["HOMEPAGE", "MARKETPLACE"]).default("HOMEPAGE"),
  headline: z.string().min(4, "Write a short advert headline").max(70),
  durationDays: z.coerce.number().int().min(3).max(30).default(7),
  note: z.string().max(500).optional().or(z.literal("")),
  imageUrls: z.array(imageValue).max(8).optional().default([]),
});

export const advertExtensionSchema = z.object({
  days: z.coerce.number().int().min(3, "Request at least 3 days").max(30, "Request 30 days or fewer"),
  note: z.string().max(500).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  sellerId: z.string().min(1),
  storeId: z.string().optional(),
  productId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(700).optional().or(z.literal("")),
});

export const adminNoteSchema = z.object({
  targetUserId: z.string().optional(),
  productId: z.string().optional(),
  body: z.string().min(3).max(1000),
});

export const sellerVerificationSchema = z.object({
  businessName: z.string().min(2),
  documentUrl: imageValue.optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.email("Enter a valid email address"),
  message: z.string().min(10, "Tell us a little more").max(2000, "Message is too long"),
});
