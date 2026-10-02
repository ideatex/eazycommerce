import { prisma } from "@/lib/prismaDB";

/**
 * The platform currently runs a single storefront. This returns that Business,
 * creating the default record on first use so a fresh database still works.
 */
export async function getDefaultBusiness() {
  const existing = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  try {
    return await prisma.business.create({
      data: { name: "Vanigam Commerce", slug: "vanigam" },
    });
  } catch {
    // Lost a creation race with another request; read the winner.
    const winner = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
    if (winner) return winner;
    throw new Error("Unable to initialise the default business record.");
  }
}
