import { AlertTriangle, LifeBuoy, MessageCircle, Shield } from "lucide-react";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  await requireRole(["ADMIN"]);
  const openReports = await prisma.report.count({ where: { status: "OPEN" } });
  return (
    <AdminModulePage
      title="Support tickets"
      description="Manage customer support requests, assign tickets, and track open, in-progress, resolved, and closed issues."
      stats={[
        { label: "Open reports", value: openReports, icon: AlertTriangle, helper: "Needs review", tone: "red" },
        { label: "Live chat", value: "Ready", icon: MessageCircle, helper: "Support chat later", tone: "sea" },
        { label: "Safety issues", value: openReports, icon: Shield, helper: "Reports queue", tone: "yellow" },
        { label: "Help center", value: "Ready", icon: LifeBuoy, helper: "FAQ and contact", tone: "pink" },
      ]}
      actions={[
        { title: "Open tickets", body: "Convert reports and contact form messages into assignable support tickets.", href: "/admin/reports" },
        { title: "In progress", body: "Support staff can own tickets and leave action history notes." },
        { title: "Resolved", body: "Resolved cases can be audited for safety, moderation, and customer experience." },
      ]}
    />
  );
}
