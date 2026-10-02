"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/clientApi";

export default function SignUpView() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!formData.agreeTerms) {
      toast.error("Please agree to the Terms & Conditions.");
      return;
    }

    setIsLoading(true);
    const res = await apiRequest("/api/auth/register", {
      body: { name: formData.name, email: formData.email, password: formData.password },
    });
    setIsLoading(false);

    if (res.ok) {
      toast.success("Account created! Please sign in.");
      router.push("/signin");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="pb-24 pt-12 bg-gray-1 min-h-[75vh] flex items-center justify-center">
      <div className="w-full px-4 mx-auto max-w-md">
        <div className="bg-white rounded-3xl border border-gray-3 p-8 sm:p-10 shadow-xs">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo/logo.svg"
                alt="Vanigam Commerce"
                width={220}
                height={54}
                className="h-12 sm:h-14 w-auto mx-auto object-contain"
                priority
              />
            </Link>
            <h1 className="text-2xl font-black text-dark mb-1.5">Create an account</h1>
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/signin" className="text-blue font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-dark mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Alex Morgan"
                className="w-full px-3.5 py-2.5 border border-gray-3 rounded-lg text-sm bg-gray-2 text-dark focus:outline-none focus:border-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 border border-gray-3 rounded-lg text-sm bg-gray-2 text-dark focus:outline-none focus:border-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2.5 border border-gray-3 rounded-lg text-sm bg-gray-2 text-dark focus:outline-none focus:border-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repeat your password"
                className="w-full px-3.5 py-2.5 border border-gray-3 rounded-lg text-sm bg-gray-2 text-dark focus:outline-none focus:border-blue"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="text-blue rounded mt-0.5 focus:ring-blue"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms-conditions" className="text-blue underline">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-blue underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue text-white rounded-lg text-sm font-bold hover:bg-blue-dark transition duration-200 shadow-sm disabled:opacity-50 mt-4"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
