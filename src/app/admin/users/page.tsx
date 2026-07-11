import { SellerVerifyAction, UserBlockAction } from "@/components/admin/admin-actions";
import { StaffForm } from "@/components/admin/staff-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { titleCase } from "@/lib/utils";
import { adminLinks } from "@/lib/admin-navigation";
import type { Prisma, Role } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;
  const q = String(params.q ?? "");
  const role = String(params.role ?? "");
  const status = String(params.status ?? "");
  const where: Prisma.UserWhereInput = {};
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }];
  if (role) where.role = role as Role;
  if (status === "active") where.isBlocked = false;
  if (status === "blocked") where.isBlocked = true;
  const usersList = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      store: true,
      _count: {
        select: { products: true, conversationsBuyer: true, conversationsSeller: true },
      },
    },
  });

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Users"
      description="Manage buyers, sellers, admins, and suspicious accounts."
      links={adminLinks}
    >
      <StaffForm />
      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_150px_150px_auto]">
        <input name="q" defaultValue={q} placeholder="Search name, email, phone..." className="form-control px-3 text-xs" />
        <select name="role" defaultValue={role} className="form-control bg-white px-3 text-xs"><option value="">All roles</option><option value="BUYER">Buyers</option><option value="SELLER">Sellers</option><option value="ADMIN">Admins</option></select>
        <select name="status" defaultValue={status} className="form-control bg-white px-3 text-xs"><option value="">Any status</option><option value="active">Active</option><option value="blocked">Blocked</option></select>
        <button className="min-h-10 rounded-[7px] bg-[var(--brand)] px-4 text-xs font-semibold text-white">Filter</button>
      </form>
      <div className="grid gap-3 md:hidden">
        {usersList.map((user) => (
          <article key={user.id} className="app-panel p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black text-[var(--ink)]">{user.name ?? "Unnamed user"}</p><p className="truncate text-xs text-[var(--muted)]">{user.email}</p><p className="mt-1 text-xs text-[var(--muted)]">{user.phone ?? "No phone"} · {user.location}</p></div><Badge tone={user.role === "ADMIN" ? "blue" : user.role === "SELLER" ? "gold" : "neutral"}>{titleCase(user.role)}</Badge></div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3">{user.isBlocked ? <Badge tone="red">Blocked</Badge> : <Badge tone="green">Active</Badge>}<span className="text-xs text-[var(--muted)]">{user._count.products} listings</span><div className="ml-auto"><UserBlockAction userId={user.id} blocked={user.isBlocked} /></div></div>
            {user.role === "SELLER" && user.store ? <div className="mt-3 flex items-center justify-between gap-3"><Badge tone={user.store.isVerified ? "green" : "gold"}>{titleCase(user.store.verificationStatus)}</Badge><SellerVerifyAction sellerId={user.id} verified={user.store.isVerified} /></div> : null}
          </article>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-[8px] border border-[var(--line)] bg-white md:block">
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[1040px] text-left text-xs">
            <thead className="bg-[var(--surface-muted)] text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted-strong)]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Listings</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {usersList.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4">
                    <p className="font-black text-[var(--ink)]">{user.name ?? "Unnamed user"}</p>
                    <p className="text-xs text-[var(--muted)]">{user.email}</p>
                  </td>
                  <td className="px-4 py-4"><Badge tone={user.role === "ADMIN" ? "blue" : user.role === "SELLER" ? "gold" : "neutral"}>{titleCase(user.role)}</Badge></td>
                  <td className="px-4 py-4 text-[var(--muted)]">{user.location}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{user._count.products}</td>
                  <td className="px-4 py-4">
                    {user.isBlocked ? <Badge tone="red">Blocked</Badge> : <Badge tone="green">Active</Badge>}
                    {user.suspensionReason ? <p className="mt-2 max-w-xs text-xs text-red-700">{user.suspensionReason}</p> : null}
                  </td>
                  <td className="px-4 py-4">
                    {user.role === "SELLER" && user.store ? (
                      <div className="grid gap-2">
                        <Badge tone={user.store.isVerified ? "green" : "gold"}>{titleCase(user.store.verificationStatus)}</Badge>
                        <SellerVerifyAction sellerId={user.id} verified={user.store.isVerified} />
                      </div>
                    ) : (
                      <span className="text-[var(--muted)]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4"><UserBlockAction userId={user.id} blocked={user.isBlocked} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
