import { Metadata } from "next";
import BlogDetailsContent from "@/components/Blog/BlogDetailsContent";
import BlogSidebar from "@/components/Blog/BlogSidebar";

export const metadata: Metadata = {
  title: "Blog Details with Sidebar | VANIGAM",
  description: "Read full article with related stories and categories.",
};

export default function BlogDetailsWithSidebarPage() {
  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <BlogDetailsContent showSidebar={true} />
          </div>
          <div className="lg:col-span-1">
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
