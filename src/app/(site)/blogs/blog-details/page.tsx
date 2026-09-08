import { Metadata } from "next";
import BlogDetailsContent from "@/components/Blog/BlogDetailsContent";

export const metadata: Metadata = {
  title: "Blog Details | VANIGAM",
  description: "Read full article and insights on modern workspace gadgets.",
};

export default function BlogDetailsPage() {
  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-4xl sm:px-8 xl:px-0">
        <BlogDetailsContent />
      </div>
    </div>
  );
}
