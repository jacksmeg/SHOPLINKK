import type { LegalSection } from "@/components/legal/legal-document";
import { LEGAL_CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE, TERMS_VERSION } from "@/lib/legal";

export const acceptableUseSections: LegalSection[] = [
  {
    id: "purpose",
    title: "Purpose",
    paragraphs: [
      "This Acceptable Use Policy explains the behaviour, content, listings, payments, food orders, delivery activity, adverts, and security practices allowed on ShopLinkk. It applies to buyers, sellers, food sellers, riders, admins, staff accounts, and visitors.",
      "ShopLinkk is built for trusted local commerce in Dunkwa-on-Offin first, with expansion to other Ghanaian towns. The platform must stay safe, honest, and useful for the community.",
    ],
  },
  {
    id: "account-integrity",
    title: "Account integrity",
    bullets: [
      "Use your real email address, phone number, name, and location details where requested.",
      "Do not create duplicate accounts to avoid moderation, unpaid fees, bad reviews, suspension, or verification checks.",
      "Do not impersonate another person, business, store, rider, admin, government body, or payment provider.",
      "Keep passwords, OTP codes, reset links, admin access, and signed-in devices private.",
      "Report unauthorized access, fake accounts, or suspicious sign-in activity quickly.",
    ],
  },
  {
    id: "marketplace-listings",
    title: "Marketplace listings",
    bullets: [
      "Listings must be accurate, lawful, current, and connected to a real product, food item, service, job, event, property, vehicle, store, or delivery request.",
      "Use truthful prices, stock quantities, condition, location, photos, videos, product dates, and seller contact details.",
      "Do not use bait prices, fake discounts, stolen images, misleading categories, duplicate spam listings, or unrelated keywords.",
      "Mark products as sold, paused, archived, out of stock, or unavailable when the information changes.",
      "Do not post content that encourages unsafe meetings, advance-payment scams, or off-platform deception.",
    ],
  },
  {
    id: "prohibited-items",
    title: "Prohibited products and services",
    bullets: [
      "Illegal, stolen, counterfeit, recalled, dangerous, or restricted products.",
      "Weapons, ammunition, illegal drugs, fake documents, exam leaks, hacking tools, and services that facilitate crime.",
      "Human trafficking, exploitation, sexual services, child sexual abuse material, and abusive or violent content.",
      "Medical claims, medicines, supplements, cosmetics, food, or health services that are unsafe, expired, unlicensed, or falsely described.",
      "Financial scams, fake investments, pyramid schemes, phishing, lottery scams, and requests for passwords, OTP codes, or card details.",
    ],
  },
  {
    id: "food-delivery",
    title: "Food, restaurant, and delivery safety",
    bullets: [
      "Food sellers must describe menu items, add-ons, prices, preparation times, availability, allergens, and delivery options honestly.",
      "Do not sell spoiled, unsafe, expired, contaminated, falsely labelled, or unlawfully prepared food.",
      "Riders must use accurate availability, pickup, delivery, and status updates and must not mark an order delivered before completion.",
      "Buyers, sellers, and riders must not abuse food-order tools, fake delivery status, create false claims, or misuse customer contact details.",
      "Emergency delivery requests must be lawful, safe, and suitable for the selected rider and vehicle type.",
    ],
  },
  {
    id: "payments",
    title: "Payments and billing",
    bullets: [
      "Only use payment methods and billing flows approved by ShopLinkk for the selected feature.",
      "Do not submit fake payment proofs, fake transaction references, edited screenshots, or reversed payments as completed transactions.",
      "Do not pressure buyers to pay before inspection unless the buyer knowingly chooses a supported order or delivery process.",
      "Platform fees, adverts, flash sales, boosts, and future paid features must follow the package and provider settings chosen by admin.",
      "Sellers, food sellers, and riders are responsible for keeping payout and Mobile Money details accurate.",
    ],
  },
  {
    id: "chat-reviews",
    title: "Chat, reviews, and community conduct",
    bullets: [
      "Keep chats related to real buying, selling, food orders, delivery, support, or platform safety.",
      "Do not harass, threaten, insult, blackmail, discriminate, spam, or send offensive, sexual, violent, or hateful messages.",
      "Do not send malware, phishing links, payment scams, OTP requests, or links designed to steal accounts.",
      "Reviews must reflect a real experience. Fake reviews, paid reviews, revenge reviews, and review manipulation are not allowed.",
      "Default chat prompts such as last price, make an offer, and is this available must still be used respectfully.",
    ],
  },
  {
    id: "adverts-promotions",
    title: "Adverts, flash sales, and promotions",
    bullets: [
      "Adverts and flash sales must represent real products, food, stores, services, or approved campaigns.",
      "Admins may reject, pause, expire, delete, or remove adverts that are misleading, unsafe, unpaid, expired, or harmful.",
      "Sellers must not claim official ShopLinkk approval, guaranteed sales, false discounts, or fake limited stock.",
      "Uploaded flyers, banners, videos, logos, and campaign images must belong to the uploader or be used with permission.",
      "Flash sale timers, original prices, discount prices, and stock limits must be honest.",
    ],
  },
  {
    id: "security",
    title: "Platform security",
    bullets: [
      "Do not attempt to bypass sign-in, Turnstile checks, rate limits, role permissions, payment checks, upload limits, moderation queues, or admin controls.",
      "Do not scan, scrape, overload, attack, reverse engineer, or interfere with ShopLinkk systems or connected providers.",
      "Do not upload viruses, harmful files, scripts, hidden tracking, or files pretending to be images, documents, or videos.",
      "Do not access accounts, chats, stores, rider documents, admin pages, or private data without permission.",
      "Responsible security reports should be sent to ShopLinkk with enough detail to investigate safely.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy and personal data",
    bullets: [
      "Do not publish another person's private address, identity number, payment details, phone number, images, documents, or chat messages without permission.",
      "Use buyer, seller, restaurant, rider, and customer contact information only for the relevant order, listing, delivery, support, or transaction.",
      "Do not collect, sell, export, or reuse ShopLinkk user data for spam, harassment, competitor targeting, or unrelated marketing.",
      "Verification documents must be submitted only through approved verification flows.",
    ],
  },
  {
    id: "reports-enforcement",
    title: "Reports and enforcement",
    paragraphs: [
      "Users can report listings, sellers, food sellers, riders, stores, chats, adverts, reviews, and orders. Reports must be honest and must not be used to punish competitors or silence fair feedback.",
      "ShopLinkk may warn, hide content, reject listings, remove adverts, pause stores, suspend accounts, block users, delete content, preserve evidence, contact users, or cooperate with lawful authorities where appropriate.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      `Questions, abuse reports, and responsible security reports can be sent to ${LEGAL_CONTACT_EMAIL}. Include the account, listing, store, order, advert, or chat reference where possible.`,
    ],
  },
];

export const acceptableUsePolicyText = [
  "ShopLinkk Acceptable Use Policy",
  `Effective: ${LEGAL_EFFECTIVE_DATE}`,
  `Version: ${TERMS_VERSION}`,
  "",
  "This text version is provided for download. The website version is the easiest version to read.",
  "",
  ...acceptableUseSections.flatMap((section, index) => [
    `${index + 1}. ${section.title}`,
    ...(section.paragraphs ?? []),
    ...(section.bullets ?? []).map((bullet) => `- ${bullet}`),
    "",
  ]),
].join("\n");
