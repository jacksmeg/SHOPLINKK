export const PRODUCT_CART_STORAGE_KEY = "shoplinkk_product_cart_v1";
export const PRODUCT_CART_CHANGED_EVENT = "shoplinkk-product-cart-changed";

export type ProductCartItem = {
  productId: string;
  slug: string;
  title: string;
  imageUrl?: string | null;
  price: number;
  salePrice?: number | null;
  priceMode?: string | null;
  storeName?: string | null;
  storeSlug?: string | null;
  sellerPhone?: string | null;
  quantity: number;
  maxQuantity?: number | null;
  addedAt: string;
};

export function productCartItemPrice(item: ProductCartItem) {
  return item.salePrice && item.salePrice > 0 && item.salePrice < item.price ? item.salePrice : item.price;
}

export function productCartItemTotal(item: ProductCartItem) {
  return productCartItemPrice(item) * item.quantity;
}

export function productCartCount(items: ProductCartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function readProductCart(): ProductCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRODUCT_CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeProductCart(items: ProductCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRODUCT_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(PRODUCT_CART_CHANGED_EVENT));
}

export function addProductToCart(item: Omit<ProductCartItem, "quantity" | "addedAt">, quantity = 1) {
  const current = readProductCart();
  const existing = current.find((entry) => entry.productId === item.productId);
  const max = item.maxQuantity ?? 99;
  const next = existing
    ? current.map((entry) =>
        entry.productId === item.productId
          ? { ...entry, quantity: Math.max(1, Math.min(max, entry.quantity + quantity)) }
          : entry,
      )
    : [
        ...current,
        {
          ...item,
          quantity: Math.max(1, Math.min(max, quantity)),
          addedAt: new Date().toISOString(),
        },
      ];
  writeProductCart(next);
}
