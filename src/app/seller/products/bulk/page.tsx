import { MessageCircle, PackagePlus, Store, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BulkUploadForm } from "@/components/seller/bulk-upload-form";
import { requireRole } from "@/lib/auth-guards";
import { getCategories } from "@/lib/marketplace";

export default async function BulkUploadPage() {
  await requireRole(["SELLER", "ADMIN"]);
  const categories = await getCategories();

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Bulk Upload"
      description="Paste product rows from a spreadsheet and submit them for admin approval."
      links={[
        { href: "/seller", label: "Overview", icon: Store },
        { href: "/seller/products/new", label: "Add product", icon: PackagePlus },
        { href: "/seller/products/bulk", label: "Bulk upload", icon: PackagePlus },
        { href: "/chat", label: "Buyer messages", icon: MessageCircle },
        { href: "/profile", label: "Profile", icon: UserRound },
      ]}
    >
      <BulkUploadForm categories={categories} />
    </DashboardShell>
  );
}
