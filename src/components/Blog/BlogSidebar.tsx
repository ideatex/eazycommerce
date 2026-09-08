import Link from "next/link";
import Image from "next/image";
import { blogPosts, blogCategories } from "@/data/blogData";

export default function BlogSidebar() {
  const recentPosts = blogPosts.slice(0, 3);
  const allTags = Array.from(new Set(blogPosts.flatMap((p) => p.tags)));

  return (
    <aside className="space-y-8">
      {/* Search */}
      <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
        <h3 className="text-base font-bold text-dark mb-4">Search Articles</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search keywords..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-3 rounded-xl bg-gray-2 text-dark focus:outline-none focus:border-blue"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
        <h3 className="text-base font-bold text-dark mb-4">Categories</h3>
        <div className="space-y-2">
          {blogCategories.map((c, i) => (
            <Link
              key={i}
              href="/blogs/blog-grid"
              className="flex items-center justify-between text-sm text-gray-600 hover:text-blue hover:bg-gray-1 p-2 rounded-lg transition"
            >
              <span>{c.name}</span>
              <span className="text-xs bg-gray-2 px-2 py-0.5 rounded-full text-gray-500">
                {c.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
        <h3 className="text-base font-bold text-dark mb-4">Recent Stories</h3>
        <div className="space-y-4">
          {recentPosts.map((p) => (
            <Link
              key={p.id}
              href="/blogs/blog-details"
              className="flex items-center gap-3 group"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-2 shrink-0 relative">
                <Image
                  src={p.coverImage}
                  alt={p.title}
                  fill
                  className="object-cover group-hover:scale-105 transition"
                />
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">{p.publishedAt}</span>
                <h4 className="text-xs font-bold text-dark group-hover:text-blue transition line-clamp-2 leading-snug">
                  {p.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
        <h3 className="text-base font-bold text-dark mb-4">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag, i) => (
            <Link
              key={i}
              href="/blogs/blog-grid"
              className="px-3 py-1 bg-gray-2 text-xs font-medium text-gray-600 rounded-lg hover:bg-blue hover:text-white transition"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
