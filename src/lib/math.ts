export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
