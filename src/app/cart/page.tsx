import { ProductCartSection } from "@/components/cart/product-cart-section";
import { FoodCartPage } from "@/components/food/food-cart-page";
import { getCurrentSession } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await getCurrentSession();

  return (
    <>
      <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <ProductCartSection
          signedIn={Boolean(session?.user?.id)}
          defaultName={session?.user?.name}
          defaultPhone={session?.user?.phone}
        />
      </div>
      <FoodCartPage
        signedIn={Boolean(session?.user?.id)}
        defaultName={session?.user?.name}
        defaultPhone={session?.user?.phone}
      />
    </>
  );
}
