import {
  Armchair,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
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
  Wrench,
  Truck,
} from "lucide-react";

const icons = {
  Armchair,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
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
  Wrench,
  Truck,
};

export function CategoryIcon({ name, size = 21 }: { name?: string | null; size?: number }) {
  const Icon = name && name in icons ? icons[name as keyof typeof icons] : Package;
  return <Icon size={size} />;
}
