import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/data/blogData";

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="bg-white rounded-2xl border border-gray-3 overflow-hidden shadow-xs hover:shadow-md transition duration-300 flex flex-col group">
      <Link
        href={`/blogs/blog-details`}
        className="block relative aspect-16/10 overflow-hidden bg-gray-2"
      >
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition duration-300"
        />
        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs text-dark text-xs font-bold px-3 py-1 rounded-full shadow-xs">
          {post.category}
        </span>
      </Link>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
            <span>{post.publishedAt}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>

          <h2 className="text-lg font-bold text-dark group-hover:text-blue transition line-clamp-2 mb-2">
            <Link href={`/blogs/blog-details`}>{post.title}</Link>
          </h2>

          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed mb-4">
            {post.excerpt}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-2 relative">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xs font-semibold text-dark">{post.author.name}</span>
          </div>

          <Link
            href={`/blogs/blog-details`}
            className="text-xs font-bold text-blue hover:text-blue-dark flex items-center gap-1"
          >
            Read More →
          </Link>
        </div>
      </div>
    </article>
  );
}
