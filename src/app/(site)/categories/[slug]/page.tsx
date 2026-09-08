import { Metadata } from "next";
import ShopWithSidebarContent from "@/components/Shop/ShopWithSidebarContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const formattedTitle = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${formattedTitle} Products | VANIGAM`,
    description: `Shop the best deals and items in the ${formattedTitle} category.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  return <ShopWithSidebarContent initialCategory={slug} />;
}
