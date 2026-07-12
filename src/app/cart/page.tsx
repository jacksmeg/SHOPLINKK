import { FoodCartPage } from "@/components/food/food-cart-page";
import { getCurrentSession } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await getCurrentSession();

  return (
    <FoodCartPage
      signedIn={Boolean(session?.user?.id)}
      defaultName={session?.user?.name}
      defaultPhone={session?.user?.phone}
    />
  );
}
