export const dunkwaAreas = [
  "Town Centre",
  "Dunkwa Market",
  "Atechem",
  "Kyekyewere",
  "Boa Amponsem",
  "Ayanfuri Road",
  "Jukwa Road",
];

export function formatGhanaPhone(value?: string | null) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("233")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+233${digits.slice(1)}`;
  }

  return value;
}

export function whatsappLink(phone?: string | null, text = "Hello, I saw your listing on ShopLinkk.") {
  const formatted = formatGhanaPhone(phone).replace(/\D/g, "");
  return formatted ? `https://wa.me/${formatted}?text=${encodeURIComponent(text)}` : "";
}
