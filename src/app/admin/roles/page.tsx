import { LockKeyhole, Shield, UserCog, Users } from "lucide-react";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireRole(["ADMIN"]);
  const admins = await prisma.user.count({ where: { role: "ADMIN" } });
  return (
    <AdminModulePage
      title="Roles and permissions"
      description="Create staff roles such as Super Admin, Moderator, Support Agent, Finance Officer, and Content Manager."
      stats={[
        { label: "Admins", value: admins, icon: Shield, helper: "Current admin accounts", tone: "sea" },
        { label: "Roles", value: 6, icon: UserCog, helper: "Planned staff roles", tone: "pink" },
        { label: "Permissions", value: "Mapped", icon: LockKeyhole, helper: "Module-level access", tone: "yellow" },
        { label: "Staff users", value: admins, icon: Users, helper: "Admin-created accounts", tone: "blue" },
      ]}
      actions={[
        { title: "Super Admin", body: "Full system control including billing, settings, roles, and delete actions." },
        { title: "Moderator", body: "Can review reports, listings, food items, chats, and verification queues." },
        { title: "Support Agent", body: "Can answer support tickets, inspect account status, and guide customers." },
        { title: "Finance Officer", body: "Can manage billing, payment status, coupons, future payouts, and exports." },
        { title: "Content Manager", body: "Can manage CMS, categories, homepage content, adverts, and featured content." },
      ]}
    />
  );
}
