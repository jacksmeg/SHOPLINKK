import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";

const sections: LegalSection[] = [
  { id: "honesty", title: "Be honest", bullets: ["Use your real contact details and accurate location.", "Describe the actual product, price, condition, defects, ownership, and availability.", "Do not create fake reviews, badges, receipts, documents, urgency, or discounts."] },
  { id: "lawful", title: "List only lawful items", paragraphs: ["Do not offer stolen, counterfeit, dangerous, recalled, prohibited, or illegally obtained products or services. Sellers are responsible for any license, ownership document, permission, tax, or regulatory requirement that applies."] },
  { id: "respect", title: "Communicate respectfully", bullets: ["Keep chat related to the product or transaction.", "Do not threaten, harass, discriminate, send sexual content, spam, or pressure someone for private information.", "Respect a block or request to stop contact."] },
  { id: "inspection", title: "Inspect before paying", paragraphs: ["ShopLinkk does not currently process or protect payments. Meet safely, inspect the item, verify documents and serial numbers, and avoid advance payment to an unknown person."] },
  { id: "privacy", title: "Protect private information", bullets: ["Never request or share passwords, OTP codes, bank PINs, card details, or account recovery codes.", "Do not publish another person's phone, address, identity document, image, or chat without a lawful reason.", "Use seller verification upload tools rather than public listing fields for documents."] },
  { id: "listings", title: "Keep listings useful", bullets: ["Use clear photos and short videos of the real item.", "Choose the correct category, town, area, condition, and stock status.", "Avoid duplicate listings, keyword stuffing, unrelated images, and misleading prices.", "Mark an item sold and renew only while it remains available."] },
  { id: "reports", title: "Report responsibly", paragraphs: ["Report suspected scams, prohibited goods, impersonation, harassment, or unsafe messages with specific facts. Do not file false reports to harm a seller, buyer, or competitor."] },
  { id: "adverts", title: "Sponsored adverts", paragraphs: ["Only approved, available products may be advertised. Sponsored status must remain visible. Promotion does not allow misleading claims or remove the seller's ordinary responsibilities."] },
  { id: "moderation", title: "Respect moderation", paragraphs: ["Follow listing notes, verification requests, warnings, and suspension decisions. Do not create another account to evade a restriction. Use the support channel if you believe a decision should be reviewed."] },
  { id: "local", title: "Strengthen local commerce", paragraphs: ["Treat people fairly across Dunkwa-on-Offin and every expansion town. Keep meeting arrangements clear, reply in reasonable time, and leave reviews based on a genuine interaction."] },
];

export default function CommunityRulesPage() {
  return <LegalDocument eyebrow="Safety" title="ShopLinkk Community Rules" introduction="These practical rules apply to buyers, sellers, staff, listings, adverts, and marketplace messages." sections={sections} />;
}
