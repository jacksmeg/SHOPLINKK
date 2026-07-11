import { CategoryActions } from "@/components/admin/category-actions";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryTile } from "@/components/marketplace/category-tile";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth-guards";
import { getCategories } from "@/lib/marketplace";
import { adminLinks } from "@/lib/admin-navigation";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireRole(["ADMIN"]);
  const categories = await getCategories();

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Categories"
      description="Manage the marketplace category system."
      links={adminLinks}
    >
      <CategoryForm />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <div key={category.slug}>
            <CategoryTile category={category} />
            <CategoryActions categoryId={category.id} name={category.name} />
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
