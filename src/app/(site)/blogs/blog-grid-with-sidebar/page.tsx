import { Metadata } from "next";
import { blogPosts } from "@/data/blogData";
import BlogCard from "@/components/Blog/BlogCard";
import BlogSidebar from "@/components/Blog/BlogSidebar";

export const metadata: Metadata = {
  title: "Blog Grid with Sidebar | VANIGAM",
  description: "Browse technology articles and guides with category filters.",
};

export default function BlogGridWithSidebarPage() {
  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-dark mb-2">Our Blog</h1>
          <p className="text-gray-500 text-sm">Explore curated tutorials, tech reviews, and updates.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
            {blogPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          <div className="lg:col-span-1">
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
