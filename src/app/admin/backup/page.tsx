import { DatabaseBackup, Download, FileText, ShieldAlert, Upload } from "lucide-react";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { ButtonLink } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function AdminBackupPage() {
  await requireRole(["ADMIN"]);
  return (
    <AdminModulePage
      title="Backup and recovery"
      description="Download protected platform snapshots, export records, and follow a safer restore workflow for production."
      stats={[
        { label: "Snapshot", value: "JSON", icon: DatabaseBackup, helper: "Core marketplace data", tone: "sea" },
        { label: "CSV exports", value: "Ready", icon: Download, helper: "Users, products, reports", tone: "yellow" },
        { label: "Restore", value: "Guarded", icon: Upload, helper: "Server-only process", tone: "pink" },
        { label: "Audit", value: "Active", icon: FileText, helper: "Admin actions tracked", tone: "blue" },
      ]}
      actions={[
        { title: "Download full snapshot", body: "Exports categories, towns, stores, product metadata, food menu metadata, billing packages, and platform counts.", href: "/api/admin/backup/snapshot" },
        { title: "Export users", body: "Download users CSV for audit and support review.", href: "/api/admin/export/users" },
        { title: "Export products", body: "Download product CSV including category, status, stock, and location.", href: "/api/admin/export/products" },
        { title: "Export reports", body: "Download abuse and moderation report CSV.", href: "/api/admin/export/reports" },
      ]}
    >
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="app-panel p-5">
          <div className="flex items-center gap-2">
            <DatabaseBackup size={18} className="text-[var(--brand)]" />
            <h2 className="text-sm font-black text-[var(--ink)]">One-click downloads</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Use these before major updates, billing changes, migrations, or imports.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/api/admin/backup/snapshot"><Download size={15} /> Snapshot JSON</ButtonLink>
            <ButtonLink href="/api/admin/export/users" variant="secondary"><Download size={15} /> Users CSV</ButtonLink>
            <ButtonLink href="/api/admin/export/products" variant="secondary"><Download size={15} /> Products CSV</ButtonLink>
            <ButtonLink href="/api/admin/export/reports" variant="secondary"><Download size={15} /> Reports CSV</ButtonLink>
          </div>
        </section>

        <section className="app-panel p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-600" />
            <h2 className="text-sm font-black text-[var(--ink)]">Restore protection</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Restoring production data should be done from the server or database panel after downloading a fresh backup. This prevents accidental live data loss from a browser click.
          </p>
          <div className="mt-4 rounded-[8px] bg-[var(--brand-dark)] p-4 text-xs leading-6 text-white">
            <p className="font-black">Safe restore order</p>
            <p>1. Put the site in maintenance mode.</p>
            <p>2. Download a fresh snapshot and database backup.</p>
            <p>3. Restore from Render/PostgreSQL tooling.</p>
            <p>4. Run migrations, seed required categories, then test login and checkout.</p>
          </div>
        </section>
      </div>
    </AdminModulePage>
  );
}
