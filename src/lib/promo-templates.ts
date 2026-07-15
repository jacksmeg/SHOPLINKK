export type PromoTemplate = {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  bestFor: string;
};

export const advertTemplates: PromoTemplate[] = [
  {
    id: "featured-flash-product",
    name: "Featured Flash Product",
    description: "A bold single-product advert with price, countdown, savings, and shop-now callout.",
    previewUrl: "/marketing/templates/shoplinkk-advert-featured.png",
    bestFor: "Phones, electronics, vehicles, appliances, and one hero product.",
  },
  {
    id: "flash-sale-grid",
    name: "Flash Sale Product Grid",
    description: "A Jumia-style flash sale board for many products with discounts and countdown.",
    previewUrl: "/marketing/templates/shoplinkk-flash-grid.png",
    bestFor: "Multi-product promotions, weekend offers, store campaigns, and homepage flash sales.",
  },
];
