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

const optionalPriceSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.union([z.coerce.number().positive(), z.null()]).optional(),
);

const optionalDateSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.union([z.coerce.date(), z.null()]).optional(),
);

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
  kind: z.enum(["GENERAL", "FOOD"]).default("GENERAL"),
  description: z.string().max(900).optional().or(z.literal("")),
  phone: ghanaPhoneSchema,
  whatsapp: ghanaPhoneSchema.optional().or(z.literal("")),
  momoNumber: ghanaPhoneSchema.optional().or(z.literal("")),
  location: z.string().min(2).default("Dunkwa-on-Offin"),
  area: z.string().max(80).optional().or(z.literal("")),
  address: z.string().max(160).optional().or(z.literal("")),
  openingHours: z.string().max(160).optional().or(z.literal("")),
  logoUrl: imageValue.optional().or(z.literal("")),
  coverUrl: imageValue.optional().or(z.literal("")),
});

export const productSchema = z.object({
  listingType: z.enum(["PRODUCT", "SERVICE"]).default("PRODUCT"),
  priceMode: z.enum(["FIXED", "CONTACT"]).default("FIXED"),
  title: z.string().min(4),
  description: z.string().min(20),
  categoryId: z.string().min(1),
  price: z.preprocess((value) => (value === "" || value === null || value === undefined ? 0 : value), z.coerce.number().min(0)),
  salePrice: optionalPriceSchema,
  saleStartsAt: optionalDateSchema,
  saleEndsAt: optionalDateSchema,
  quantity: z.coerce.number().int().min(0).max(999999).default(1),
  condition: z.enum(["NEW", "USED", "REFURBISHED"]).default("USED"),
  location: z.string().min(2).default("Dunkwa-on-Offin"),
  area: z.string().min(2, "Choose your area").max(80),
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
}).refine((value) => value.priceMode === "CONTACT" || value.price > 0, {
  message: "Enter a price or choose Contact for price",
  path: ["price"],
}).refine((value) => value.priceMode === "FIXED" || !value.salePrice, {
  message: "Flash sale price is only available when a fixed price is entered",
  path: ["salePrice"],
}).refine((value) => !value.salePrice || value.salePrice < value.price, {
  message: "Flash sale price must be lower than the normal price",
  path: ["salePrice"],
}).refine((value) => !value.salePrice || (value.saleStartsAt && value.saleEndsAt), {
  message: "Add flash sale start and end dates",
  path: ["saleStartsAt"],
}).refine((value) => !value.saleStartsAt || !value.saleEndsAt || value.saleEndsAt > value.saleStartsAt, {
  message: "Flash sale end time must be after the start time",
  path: ["saleEndsAt"],
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
  packageId: z.string().optional().or(z.literal("")),
  headline: z.string().min(4, "Write a short advert headline").max(70),
  durationDays: z.coerce.number().int().min(3).max(30).default(7),
  note: z.string().max(500).optional().or(z.literal("")),
  imageUrls: z.array(imageValue).max(8).optional().default([]),
});

export const billingPackageSchema = z.object({
  name: z.string().min(3, "Name the package"),
  description: z.string().max(500).optional().or(z.literal("")),
  type: z.enum(["PRODUCT_LISTING", "ADVERT"]),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  currency: z.string().min(3).max(3).default("GHS"),
  durationDays: z.coerce.number().int().min(1).max(365).optional().or(z.literal("")),
  listingCount: z.coerce.number().int().min(1).max(1000).optional().or(z.literal("")),
  placement: z.enum(["HOMEPAGE", "MARKETPLACE"]).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const checkoutSchema = z.object({
  packageId: z.string().min(1),
  productId: z.string().optional(),
  boostRequestId: z.string().optional(),
  provider: z.enum(["PAYSTACK", "KORA"]).optional(),
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

export const foodMenuItemSchema = z.object({
  name: z.string().min(2, "Name the food item"),
  description: z.string().max(500).optional().or(z.literal("")),
  basePrice: z.coerce.number().positive("Enter the base price"),
  imageUrl: imageValue.optional().or(z.literal("")),
  isAvailable: z.coerce.boolean().default(true),
  options: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        price: z.coerce.number().min(0),
      }),
    )
    .max(20)
    .optional()
    .default([]),
});

export const foodOrderSchema = z.object({
  buyerName: z.string().min(2).max(120).optional().or(z.literal("")),
  buyerPhone: ghanaPhoneSchema.optional().or(z.literal("")),
  deliveryAddress: z.string().min(5, "Enter the delivery address").max(240),
  deliveryNote: z.string().max(500).optional().or(z.literal("")),
  paymentReference: z.string().max(120).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(50),
        optionIds: z.array(z.string()).max(20).optional().default([]),
      }),
    )
    .min(1, "Choose at least one food item"),
});

export const foodOrderStatusSchema = z.object({
  status: z.enum(["PAID", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
  note: z.string().max(500).optional().or(z.literal("")),
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
