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

const optionalFloatSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.union([z.coerce.number(), z.null()]).optional(),
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
  role: z.enum(["BUYER", "SELLER", "RIDER"]).default("BUYER"),
  storeKind: z.enum(["GENERAL", "FOOD"]).optional().default("GENERAL"),
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
  email: z.email("Enter a valid store email").optional().or(z.literal("")),
  phone: ghanaPhoneSchema,
  whatsapp: ghanaPhoneSchema.optional().or(z.literal("")),
  momoNumber: ghanaPhoneSchema.optional().or(z.literal("")),
  location: z.string().min(2).default("Dunkwa-on-Offin"),
  area: z.string().max(80).optional().or(z.literal("")),
  address: z.string().max(160).optional().or(z.literal("")),
  gpsLatitude: optionalFloatSchema.refine((value) => value === null || value === undefined || (value >= -90 && value <= 90), "Latitude must be between -90 and 90"),
  gpsLongitude: optionalFloatSchema.refine((value) => value === null || value === undefined || (value >= -180 && value <= 180), "Longitude must be between -180 and 180"),
  openingHours: z.string().max(160).optional().or(z.literal("")),
  socialLinks: z
    .object({
      facebook: z.url().optional().or(z.literal("")),
      instagram: z.url().optional().or(z.literal("")),
      tiktok: z.url().optional().or(z.literal("")),
      x: z.url().optional().or(z.literal("")),
    })
    .optional(),
  deliveryCoverage: z.string().max(500).optional().or(z.literal("")),
  announcementBanner: z.string().max(180).optional().or(z.literal("")),
  accentColor: z.string().max(40).optional().or(z.literal("")),
  storeTheme: z.string().max(40).optional().or(z.literal("")),
  acceptOrders: z.coerce.boolean().default(true),
  vacationMode: z.coerce.boolean().default(false),
  deliveryAvailable: z.coerce.boolean().default(true),
  pickupAvailable: z.coerce.boolean().default(true),
  chatEnabled: z.coerce.boolean().default(true),
  callsEnabled: z.coerce.boolean().default(true),
  seoTitle: z.string().max(80).optional().or(z.literal("")),
  seoDescription: z.string().max(160).optional().or(z.literal("")),
  logoUrl: imageValue.optional().or(z.literal("")),
  coverUrl: imageValue.optional().or(z.literal("")),
});

export const productSchema = z.object({
  listingType: z.enum(["PRODUCT", "SERVICE"]).default("PRODUCT"),
  priceMode: z.enum(["FIXED", "CONTACT"]).default("FIXED"),
  title: z.string().min(4),
  description: z.string().min(20),
  brand: z.string().max(80).optional().or(z.literal("")),
  sku: z.string().max(80).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  weightKg: optionalFloatSchema.refine((value) => value === null || value === undefined || (value >= 0 && value <= 100000), "Weight is too high"),
  deliveryOptions: z.string().max(500).optional().or(z.literal("")),
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
  provider: z.enum(["PAYSTACK", "KORA", "HUBTEL"]).optional(),
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
  category: z.string().max(80).optional().or(z.literal("")),
  basePrice: z.coerce.number().positive("Enter the base price"),
  imageUrl: imageValue.optional().or(z.literal("")),
  imageUrls: z.array(imageValue).max(8, "Upload 8 food photos or fewer").optional().default([]),
  prepMinutes: z.coerce.number().int().min(1).max(240).optional().or(z.literal("")),
  deliveryMinutes: z.coerce.number().int().min(1).max(240).optional().or(z.literal("")),
  isSpicy: z.coerce.boolean().default(false),
  isVegetarian: z.coerce.boolean().default(false),
  isAvailable: z.coerce.boolean().default(true),
  status: z.enum(["DRAFT", "PENDING"]).default("PENDING"),
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
  paymentProofUrl: imageValue.optional().or(z.literal("")),
  buyerPaymentNote: z.string().max(500).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(50),
        optionIds: z.array(z.string()).max(20).optional().default([]),
        options: z.array(z.object({
          optionId: z.string().min(1),
          quantity: z.coerce.number().int().min(1).max(50),
        })).max(20).optional().default([]),
      }),
    )
    .min(1, "Choose at least one food item"),
});

export const directPaymentProofSchema = z.object({
  paymentReference: z.string().max(120).optional().or(z.literal("")),
  paymentProofUrl: imageValue.optional().or(z.literal("")),
  buyerPaymentNote: z.string().max(500).optional().or(z.literal("")),
}).refine((value) => Boolean(value.paymentReference || value.paymentProofUrl || value.buyerPaymentNote), {
  message: "Add a MoMo reference, payment proof, or short payment note.",
  path: ["paymentReference"],
});

export const foodOrderStatusSchema = z.object({
  status: z.enum(["PAID", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
  note: z.string().max(500).optional().or(z.literal("")),
});

export const marketplaceOrderSchema = z.object({
  buyerName: z.string().min(2).max(120).optional().or(z.literal("")),
  buyerPhone: ghanaPhoneSchema.optional().or(z.literal("")),
  deliveryAddress: z.string().min(5, "Enter the pickup or delivery address").max(240),
  deliveryNote: z.string().max(500).optional().or(z.literal("")),
  paymentReference: z.string().max(120).optional().or(z.literal("")),
  paymentProofUrl: imageValue.optional().or(z.literal("")),
  buyerPaymentNote: z.string().max(500).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(999),
      }),
    )
    .min(1, "Choose at least one product or service"),
});

export const marketplaceOrderStatusSchema = z.object({
  status: z.enum(["PAID", "READY", "DELIVERED", "CANCELLED"]),
  note: z.string().max(500).optional().or(z.literal("")),
});

export const riderApplicationSchema = z.object({
  profilePhotoUrl: imageValue.optional().or(z.literal("")),
  ghanaCardUrl: imageValue.optional().or(z.literal("")),
  licenseUrl: imageValue.optional().or(z.literal("")),
  vehicleDocumentUrl: imageValue.optional().or(z.literal("")),
  vehicleType: z.enum(["MOTORCYCLE", "TRICYCLE", "CAR", "VAN"]),
  emergencyContactName: z.string().min(2, "Enter the emergency contact name").max(120),
  emergencyContactPhone: ghanaPhoneSchema,
  momoName: z.string().max(120).optional().or(z.literal("")),
  momoNumber: ghanaPhoneSchema.optional().or(z.literal("")),
  bankName: z.string().max(120).optional().or(z.literal("")),
  bankAccountName: z.string().max(120).optional().or(z.literal("")),
  bankAccountNumber: z.string().max(80).optional().or(z.literal("")),
}).refine((value) => value.momoNumber || value.bankAccountNumber, {
  message: "Add a Mobile Money number or bank account for future payouts",
  path: ["momoNumber"],
});

export const riderAvailabilitySchema = z.object({
  availability: z.enum(["OFFLINE", "ONLINE", "BUSY", "ON_DELIVERY"]),
});

export const riderLocationSchema = z.object({
  deliveryId: z.string().optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().optional(),
  heading: z.coerce.number().optional(),
  speed: z.coerce.number().optional(),
});

export const deliveryRequestSchema = z.object({
  foodOrderId: z.string().optional().or(z.literal("")),
  pickupAddress: z.string().min(5, "Enter the pickup address").max(240),
  pickupLatitude: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  pickupLongitude: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  deliveryAddress: z.string().min(5, "Enter the delivery address").max(240),
  deliveryLatitude: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  deliveryLongitude: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  productName: z.string().min(2).max(180),
  deliveryFee: z.coerce.number().min(0, "Delivery fee cannot be negative"),
  distanceKm: z.coerce.number().min(0).optional().or(z.literal("")),
  estimatedMinutes: z.coerce.number().int().min(1).max(1440).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
});

export const riderDeliveryDecisionSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
});

export const deliveryStatusSchema = z.object({
  status: z.enum(["HEADING_TO_SELLER", "ITEM_PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED"]),
});

export const deliveryConfirmSchema = z.object({
  role: z.enum(["BUYER", "SELLER"]),
});

export const riderRatingSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(700).optional().or(z.literal("")),
});

export const deliveryReportSchema = z.object({
  reason: z.enum(["LATE_DELIVERY", "MISSING_ITEM", "DAMAGED_PACKAGE", "RIDER_MISCONDUCT", "OTHER"]),
  details: z.string().max(1000).optional().or(z.literal("")),
});

export const adminRiderDecisionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "SUSPEND", "UNSUSPEND"]),
  note: z.string().max(1000).optional().or(z.literal("")),
});

export const adminDeliveryAssignSchema = z.object({
  riderId: z.string().min(1),
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
