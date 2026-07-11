export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uniqueSlug(value: string) {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${slugify(value)}-${suffix}`;
}
