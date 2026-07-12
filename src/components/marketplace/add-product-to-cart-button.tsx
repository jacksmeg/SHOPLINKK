"use client";

import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addProductToCart } from "@/lib/product-cart";

export function AddProductToCartButton({
  product,
  compact = false,
}: {
  product: {
    id: string;
    slug: string;
    title: string;
    imageUrl?: string | null;
    price: number;
    salePrice?: number | null;
    priceMode?: string | null;
    quantity?: number | null;
    storeName?: string | null;
    storeSlug?: string | null;
    sellerPhone?: string | null;
  };
  compact?: boolean;
}) {
  const [message, setMessage] = useState("");
  const isContactPrice = product.priceMode === "CONTACT";
  const isUnavailable = typeof product.quantity === "number" && product.quantity <= 0;

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  function add() {
    addProductToCart({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl: product.imageUrl,
      price: product.price,
      salePrice: product.salePrice,
      priceMode: product.priceMode,
      maxQuantity: product.quantity,
      storeName: product.storeName,
      storeSlug: product.storeSlug,
      sellerPhone: product.sellerPhone,
    });
    setMessage("Added to cart.");
  }

  if (isContactPrice || isUnavailable) return null;

  return (
    <span className="relative inline-flex">
      <Button type="button" variant={compact ? "secondary" : "primary"} onClick={add} className={compact ? "min-h-9 px-3" : ""}>
        <ShoppingCart size={15} />
        {compact ? "Cart" : "Add to cart"}
      </Button>
      {message ? (
        <span className="absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-[7px] bg-[var(--brand-dark)] px-3 py-2 text-[0.68rem] font-bold text-white shadow-xl">
          {message}
        </span>
      ) : null}
    </span>
  );
}
