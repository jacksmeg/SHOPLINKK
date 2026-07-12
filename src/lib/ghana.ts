export const dunkwaAreas = [
  "Town Centre",
  "Dunkwa Market",
  "Atechem",
  "Atechem Extension",
  "Kyekyewere",
  "Kyekyewere New Site",
  "Boa Amponsem",
  "Akyempim",
  "Aboabo",
  "Asikuma",
  "Ayanfuri Road",
  "Denkyira Obuasi Road",
  "Dunkwa Junction",
  "Dunkwa Zongo",
  "Fire Service Area",
  "Government Hospital Area",
  "Jukwa Road",
  "Kotokrom",
  "Market Circle",
  "Methodist Area",
  "Mfuom",
  "New Town",
  "Nkotompo",
  "Offin Road",
  "Old Town",
  "Oponso",
  "Police Station Area",
  "Post Office Area",
  "Presby Area",
  "Railway Station Area",
  "Roman Area",
  "Senior High School Area",
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
