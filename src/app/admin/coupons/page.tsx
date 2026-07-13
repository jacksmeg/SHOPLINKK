import { Gift, PackageCheck, Store, Truck } from "lucide-react";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { requireRole } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  await requireRole(["ADMIN"]);
  return (
    <AdminModulePage
      title="Coupon management"
      description="Create, edit, expire, and delete future coupons for products, restaurants, and delivery."
      stats={[
        { label: "Coupons", value: 0, icon: Gift, helper: "Future discount engine", tone: "pink" },
        { label: "Percentage", value: "Ready", icon: PackageCheck, helper: "Percent discounts", tone: "sea" },
        { label: "Fixed amount", value: "Ready", icon: Store, helper: "GHS discounts", tone: "yellow" },
        { label: "Free delivery", value: "Ready", icon: Truck, helper: "Rider promo option", tone: "blue" },
      ]}
      actions={[
        { title: "Percentage coupons", body: "Create percent-based offers for flash sales, restaurants, and store campaigns." },
        { title: "Fixed amount coupons", body: "Create Ghana cedi coupon values for future checkout and payment flows." },
        { title: "Free delivery coupons", body: "Prepare delivery promotions for riders and restaurants when payments are enabled." },
      ]}
    />
  );
}
