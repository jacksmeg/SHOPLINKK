export const FOOD_CART_STORAGE_KEY = "shoplinkk_food_cart_v1";
export const FOOD_CART_CHANGED_EVENT = "shoplinkk-food-cart-changed";

export type FoodCartOption = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type FoodCartItem = {
  cartId: string;
  itemId: string;
  storeId: string;
  storeName: string;
  storeSlug?: string;
  momoNumber?: string | null;
  name: string;
  category?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  quantity: number;
  prepMinutes?: number | null;
  deliveryMinutes?: number | null;
  options: FoodCartOption[];
  addedAt: string;
};

export function foodCartItemTotal(item: FoodCartItem) {
  const foodTotal = item.basePrice * item.quantity;
  const optionTotal = item.options.reduce((sum, option) => sum + option.price * option.quantity, 0);
  return foodTotal + optionTotal;
}

export function foodCartCount(items: FoodCartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function readFoodCart(): FoodCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FOOD_CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeFoodCart(items: FoodCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOOD_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(FOOD_CART_CHANGED_EVENT));
}

export function makeCartId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cart-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
