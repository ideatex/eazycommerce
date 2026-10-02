"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/clientApi";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest("/api/newsletter", { body: { email } });
    setIsSubmitting(false);

    if (res.ok) {
      toast.success("Thank you for subscribing!");
      setEmail("");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 sm:flex-row">
        <input
          type="email"
          name="email"
          id="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your business or personal email"
          className="w-full px-5 py-3 border rounded-lg bg-gray-1 border-gray-3 outline-hidden placeholder:text-dark-4 text-dark text-sm focus:border-blue"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center py-3 font-medium text-white duration-200 ease-out rounded-lg px-7 bg-blue hover:bg-blue-dark disabled:opacity-50 text-sm font-bold shrink-0"
        >
          {isSubmitting ? "Subscribing..." : "Subscribe"}
        </button>
      </div>
    </form>
  );
}
