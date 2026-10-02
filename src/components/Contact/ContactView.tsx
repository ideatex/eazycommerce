"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/clientApi";

export default function ContactView() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest("/api/contact", {
      body: {
        fullName: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      },
    });
    setIsSubmitting(false);

    if (res.ok) {
      toast.success("Thank you! Your message has been sent.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="pb-24 pt-10 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-blue uppercase tracking-widest block mb-2">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark mb-4">
            We&apos;d Love to Hear From You
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Have questions about a product, shipping, or need technical help? Send us a message and our support team will get right back to you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left 1 Column: Contact Cards */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue/10 text-blue flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-dark mb-1">Phone Support</h3>
              <p className="text-xs text-gray-400 mb-3">Mon-Fri from 8am to 6pm PST</p>
              <a href="tel:+15557869843" className="text-sm font-semibold text-blue hover:underline">
                +1 (555) 786-9843
              </a>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue/10 text-blue flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-dark mb-1">Email Inquiry</h3>
              <p className="text-xs text-gray-400 mb-3">Our friendly team is here to help.</p>
              <a href="mailto:support@vanigam.com" className="text-sm font-semibold text-blue hover:underline">
                support@vanigam.com
              </a>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue/10 text-blue flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-dark mb-1">Office Headquarters</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                452 Innovation Blvd, Suite 300<br />
                San Francisco, CA 94105, USA
              </p>
            </div>
          </div>

          {/* Right 2 Columns: Contact Form */}
          <div className="lg:col-span-2 bg-white p-8 sm:p-12 rounded-2xl border border-gray-3 shadow-xs">
            <h2 className="text-xl font-bold text-dark mb-6">Send Us a Direct Message</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Order inquiry / Product questions"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Your Message *</label>
                <textarea
                  rows={5}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us how we can assist you..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-3 bg-gray-2 text-dark text-sm focus:outline-none focus:border-blue"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-8 bg-blue text-white rounded-lg text-sm font-bold hover:bg-blue-dark transition duration-200 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Sending Message..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
