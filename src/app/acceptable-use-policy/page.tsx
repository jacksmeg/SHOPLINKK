import { LegalDocument } from "@/components/legal/legal-document";
import { acceptableUseSections } from "@/lib/acceptable-use-policy";

export default function AcceptableUsePolicyPage() {
  return (
    <LegalDocument
      eyebrow="Trust and safety"
      title="ShopLinkk Acceptable Use Policy"
      introduction="These rules explain what buyers, sellers, food sellers, riders, admins, and visitors can and cannot do on ShopLinkk so local commerce stays safe, honest, and useful."
      sections={acceptableUseSections}
      downloadHref="/acceptable-use-policy/download"
      downloadLabel="Download policy"
      sources={[
        { label: "Ghana Cyber Security Authority resources", href: "https://csa.gov.gh/resources.php" },
        { label: "Data Protection Commission documents", href: "https://dataprotection.org.gh/documents/" },
      ]}
    />
  );
}
