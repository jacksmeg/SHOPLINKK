import {
  Armchair,
  BriefcaseBusiness,
  Car,
  Hammer,
  Home,
  Laptop,
  Package,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Wheat,
} from "lucide-react";

const icons = {
  Armchair,
  BriefcaseBusiness,
  Car,
  Hammer,
  Home,
  Laptop,
  Package,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Wheat,
};

export function CategoryIcon({ name, size = 21 }: { name?: string | null; size?: number }) {
  const Icon = name && name in icons ? icons[name as keyof typeof icons] : Package;
  return <Icon size={size} />;
}
