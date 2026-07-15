import { redirect } from "next/navigation";
import type { StoreKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { sellerFoodLinks } from "@/lib/seller-food-navigation";
import { sellerLinks } from "@/lib/seller-navigation";

export async function getSellerStoreKind(userId: string) {
  return prisma.store.findUnique({
    where: { ownerId: userId },
    select: { id: true, kind: true },
  });
}

export async function requireGeneralSellerStore(userId: string) {
  const store = await getSellerStoreKind(userId);

  if (store?.kind === "FOOD") {
    redirect("/seller/food");
  }

  return store;
}

export async function requireFoodSellerStore(userId: string) {
  const store = await getSellerStoreKind(userId);

  if (store?.kind !== "FOOD") {
    redirect("/seller");
  }

  return store;
}

export function sellerLinksForKind(kind?: StoreKind | string | null) {
  return kind === "FOOD" ? sellerFoodLinks : sellerLinks;
}
