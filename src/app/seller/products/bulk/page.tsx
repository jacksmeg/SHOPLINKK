import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BulkUploadForm } from "@/components/seller/bulk-upload-form";
import { requireRole } from "@/lib/auth-guards";
import { getCategories } from "@/lib/marketplace";
import { requireGeneralSellerStore } from "@/lib/seller-access";
import { sellerLinks } from "@/lib/seller-navigation";

export default async function BulkUploadPage() {
  const session = await requireRole(["SELLER", "ADMIN"]);
  if (session.user.role !== "ADMIN") {
    await requireGeneralSellerStore(session.user.id);
  }

  const categories = await getCategories();

  return (
    <DashboardShell
      eyebrow="Seller"
      title="Bulk Upload"
      description="Paste product rows from a spreadsheet and submit them for admin approval."
      links={sellerLinks}
    >
      <BulkUploadForm categories={categories} />
    </DashboardShell>
  );
}
