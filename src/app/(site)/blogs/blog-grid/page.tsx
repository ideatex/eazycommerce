import { Metadata } from "next";
import { blogPosts } from "@/data/blogData";
import BlogCard from "@/components/Blog/BlogCard";

export const metadata: Metadata = {
  title: "Blog Grid | VANIGAM",
  description: "Read the latest news, guides, and tech gadget reviews on VANIGAM.",
};

export default function BlogGridPage() {
  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-blue uppercase tracking-widest block mb-2">
            News & Articles
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark mb-4">
            VANIGAM Commerce Blog
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Latest trends, product comparisons, tech advice, and ecommerce insights from industry experts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
