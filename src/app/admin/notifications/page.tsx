import { Bell, ChefHat, Mail, MessageCircle, Smartphone, Users } from "lucide-react";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  await requireRole(["ADMIN"]);
  const [notifications, users, sellers, riders] = await Promise.all([
    prisma.notification.count(),
    prisma.user.count(),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { role: "RIDER" } }),
  ]);
  return (
    <AdminModulePage
      title="Notification center"
      description="Send push notifications, email, and future SMS messages to buyers, sellers, restaurants, and riders."
      stats={[
        { label: "Notifications", value: notifications, icon: Bell, helper: "System alerts sent", tone: "sea" },
        { label: "Users", value: users, icon: Users, helper: "Everyone target", tone: "pink" },
        { label: "Sellers", value: sellers, icon: ChefHat, helper: "Sellers and restaurants", tone: "yellow" },
        { label: "Riders", value: riders, icon: Smartphone, helper: "Delivery workforce", tone: "blue" },
      ]}
      actions={[
        { title: "Push notification", body: "Send device alerts for orders, delivery, chat, promotions, and safety messages.", href: "/admin/integrations" },
        { title: "Email broadcast", body: "Use the connected email provider for announcements, reports, and system updates.", href: "/admin/integrations" },
        { title: "SMS later", body: "Arkesel/Twilio SMS targeting can be expanded for Ghana phone numbers.", href: "/admin/integrations" },
        { title: "Chat alerts", body: "Notify buyers and sellers when product-linked messages arrive.", href: "/admin/chats" },
      ]}
    />
  );
}
