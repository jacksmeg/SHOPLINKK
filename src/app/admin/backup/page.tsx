import { DatabaseBackup, Download, FileText, Upload } from "lucide-react";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { requireRole } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function AdminBackupPage() {
  await requireRole(["ADMIN"]);
  return (
    <AdminModulePage
      title="Backup and recovery"
      description="Backup database, restore backup, export data, import data, and protect production operations."
      stats={[
        { label: "Database backup", value: "Ready", icon: DatabaseBackup, helper: "Script included", tone: "sea" },
        { label: "Restore", value: "Manual", icon: Upload, helper: "Production safety step", tone: "yellow" },
        { label: "Exports", value: "CSV", icon: Download, helper: "Users, products, reports", tone: "pink" },
        { label: "Audit", value: "Active", icon: FileText, helper: "Admin action logs", tone: "blue" },
      ]}
      actions={[
        { title: "Backup database", body: "Use the production backup command before major releases or imports." },
        { title: "Restore backup", body: "Restore should be done carefully by an admin with database access." },
        { title: "Export data", body: "Export users, products, orders, stores, restaurants, and analytics for reporting.", href: "/admin" },
      ]}
    />
  );
}
