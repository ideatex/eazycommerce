"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { blogPosts } from "@/data/blogData";
import toast from "react-hot-toast";

export default function BlogDetailsContent({ showSidebar = false }: { showSidebar?: boolean }) {
  const post = blogPosts[0]; // Primary featured post for demo details
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([
    {
      name: "Marcus Vance",
      date: "February 25, 2026",
      avatar: "/images/users/user-01.png",
      content: "Really insightful breakdown! The point about mechanical split keyboards saving wrist strain is completely on point.",
    },
    {
      name: "Sophia Chen",
      date: "February 26, 2026",
      avatar: "/images/users/user-02.png",
      content: "Great tips on cable management and ergonomic desk accessories. Added three items to my cart right away!",
    },
  ]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentText) {
      toast.error("Please fill in both your name and comment.");
      return;
    }
    setComments([
      ...comments,
      {
        name: commentName,
        date: "Just now",
        avatar: "/images/users/user-03.png",
        content: commentText,
      },
    ]);
    setCommentName("");
    setCommentText("");
    toast.success("Comment posted successfully!");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-3 p-6 sm:p-10 shadow-xs">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 text-xs font-semibold text-blue mb-3 uppercase tracking-wider">
          <span>{post.category}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400 font-normal">{post.publishedAt}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400 font-normal">{post.readTime}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-dark leading-tight mb-6">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 pb-6 border-b border-gray-2">
          <div className="w-11 h-11 rounded-full overflow-hidden relative bg-gray-2">
            <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
          </div>
          <div>
            <span className="block font-bold text-dark text-sm">{post.author.name}</span>
            <span className="block text-xs text-gray-400">{post.author.role}</span>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative aspect-16/9 rounded-2xl overflow-hidden mb-8 bg-gray-2">
        <Image src={post.coverImage} alt={post.title} fill priority className="object-cover" />
      </div>

      {/* Article Content */}
      <div className="prose max-w-none text-gray-600 leading-relaxed text-base space-y-6 mb-10">
        <p className="text-lg font-medium text-dark leading-relaxed">
          {post.excerpt}
        </p>

        <p>
          Whether you are an engineer writing high performance software, a digital creator editing 4K footage, or managing teams globally, having the right hardware foundation transforms how you perform every single day.
        </p>

        <blockquote className="border-l-4 border-blue pl-6 py-2 my-6 italic text-dark font-medium bg-gray-1 rounded-r-xl">
          &ldquo;Your workspace should be an amplifier of your creativity, not a barrier of friction and ergonomic fatigue.&rdquo;
        </blockquote>

        <h2 className="text-xl font-bold text-dark pt-4">1. Prioritize Precision & Ergonomics</h2>
        <p>
          Repetitive strain from sub-par mice and shallow keyboards is one of the most common productivity killers. Switching to an electromagnetic scroll wheel mouse like the Logitech MX Master 3S allows fluid navigating across thousands of spreadsheet rows without joint fatigue.
        </p>

        <h2 className="text-xl font-bold text-dark pt-4">2. High Bandwidth Wi-Fi 6 Connectivity</h2>
        <p>
          Video calls, multi-gigabyte cloud assets, and high definition streaming require rock-solid wireless throughput. Dual-band Wi-Fi 6 routers manage dozens of client devices seamlessly with zero lag spikes.
        </p>
      </div>

      {/* Tags & Share */}
      <div className="pt-6 border-t border-gray-2 flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-gray-2 text-xs font-semibold text-gray-600 rounded-lg">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-semibold text-dark">Share:</span>
          <button onClick={() => toast.success("Article link copied!")} className="hover:text-blue transition font-medium">
            Copy Link
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="pt-8 border-t border-gray-2">
        <h3 className="text-xl font-bold text-dark mb-6">Comments ({comments.length})</h3>

        <div className="space-y-4 mb-8">
          {comments.map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-1 border border-gray-3 flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-3 shrink-0 overflow-hidden relative">
                <Image src={c.avatar} alt={c.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-dark text-sm">{c.name}</h4>
                  <span className="text-xs text-gray-400">{c.date}</span>
                </div>
                <p className="text-gray-600 text-sm">{c.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Form */}
        <form onSubmit={handleCommentSubmit} className="space-y-4 bg-gray-1 p-6 rounded-2xl border border-gray-3">
          <h4 className="font-bold text-dark text-sm">Join the discussion</h4>
          <div>
            <input
              type="text"
              placeholder="Your name"
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-white text-dark text-sm focus:outline-none focus:border-blue"
            />
          </div>
          <div>
            <textarea
              rows={3}
              placeholder="What are your thoughts on this article?"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-white text-dark text-sm focus:outline-none focus:border-blue"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-6 bg-blue text-white rounded-lg text-sm font-bold hover:bg-blue-dark transition shadow-sm"
          >
            Post Comment
          </button>
        </form>
      </div>
    </div>
  );
}
