export type SalePricedItem = {
  price: number;
  priceMode?: string | null;
  salePrice?: number | string | null;
  saleStartsAt?: Date | string | null;
  saleEndsAt?: Date | string | null;
};

export function getActiveSalePrice(item: SalePricedItem, now = new Date()) {
  if (item.priceMode === "CONTACT") return null;
  const salePrice = item.salePrice === null || item.salePrice === undefined ? null : Number(item.salePrice);
  if (!salePrice || !Number.isFinite(salePrice) || salePrice >= item.price) return null;

  const startsAt = item.saleStartsAt ? new Date(item.saleStartsAt).getTime() : null;
  const endsAt = item.saleEndsAt ? new Date(item.saleEndsAt).getTime() : null;
  const current = now.getTime();
  if (!startsAt || !endsAt || Number.isNaN(startsAt) || Number.isNaN(endsAt)) return null;
  if (startsAt > current || endsAt <= current) return null;

  return salePrice;
}

export function saleEndsInLabel(value?: Date | string | null) {
  if (!value) return "";
  const endsAt = new Date(value).getTime();
  const diff = endsAt - Date.now();
  if (!Number.isFinite(endsAt) || diff <= 0) return "";

  const hours = Math.ceil(diff / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h left`;
  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} left`;
}

export function isContactPrice(item: { priceMode?: string | null }) {
  return item.priceMode === "CONTACT";
}
