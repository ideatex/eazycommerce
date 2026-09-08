import { prisma } from "@/lib/prismaDB";
import { unstable_cache } from "next/cache";
import defaultCategories from "@/components/Home/Categories/categoryData";

// get all categories
export const getCategories = unstable_cache(
  async () => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { updatedAt: "desc" },
      });
      if (categories && categories.length > 0) {
        return categories;
      }
      return defaultCategories as any;
    } catch {
      return defaultCategories as any;
    }
  },
  ['categories'], { tags: ['categories'] }
);

// GET CATEGORY BY SLUG
export const getCategoryBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const category = await prisma.category.findUnique({
        where: {
          slug: slug
        }
      });
      if (category) return category;
      return (defaultCategories.find((c) => c.slug === slug) as any) || null;
    } catch {
      return (defaultCategories.find((c) => c.slug === slug) as any) || null;
    }
  },
  ['categories'], { tags: ['categories'] }
);

// GET CATEGORY BY ID
export const getCategoryById = unstable_cache(
  async (id: number) => {
    try {
      const category = await prisma.category.findUnique({
        where: {
          id: id
        }
      });
      if (category) return category;
      return (defaultCategories.find((c) => c.id === id) as any) || null;
    } catch {
      return (defaultCategories.find((c) => c.id === id) as any) || null;
    }
  },
  ['categories'], { tags: ['categories'] }
);