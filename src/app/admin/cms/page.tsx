import { FileText, Newspaper, Shield, Store } from "lucide-react";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { requireRole } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function AdminCmsPage() {
  await requireRole(["ADMIN"]);
  return (
    <AdminModulePage
      title="CMS"
      description="Manage homepage content, about, FAQ, privacy, terms, blog, news, announcements, and safety pages."
      stats={[
        { label: "Homepage", value: "Live", icon: Store, helper: "Marketplace content", tone: "sea" },
        { label: "Legal pages", value: "Ready", icon: Shield, helper: "Terms, privacy, license", tone: "yellow" },
        { label: "News", value: "Ready", icon: Newspaper, helper: "Future blog/news", tone: "pink" },
        { label: "FAQ", value: "Ready", icon: FileText, helper: "Support content", tone: "blue" },
      ]}
      actions={[
        { title: "Homepage", body: "Control featured content, advert trail, flash sales, categories, and local Ghana signals.", href: "/" },
        { title: "About ShopLinkk", body: "Update the public story, contact details, and local-commerce promise.", href: "/about" },
        { title: "Terms and privacy", body: "Maintain legal pages, inspection reminders, safety rules, and licensing language.", href: "/terms" },
      ]}
    />
  );
}
