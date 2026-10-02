"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import toast from "react-hot-toast";

export default function SignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        toast.error("Invalid email or password.");
        return;
      }

      // Only same-site paths are honoured as a post-login destination.
      const callback = searchParams.get("callbackUrl");
      const safeCallback = callback && /^\/(?!\/)/.test(callback) ? callback : null;
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      const isStaff = role === "SUPER_ADMIN" || role === "ADMIN" || role === "STAFF";

      toast.success("Signed in successfully.");
      router.push(safeCallback ?? (isStaff ? "/admin" : "/account"));
      router.refresh();
    } catch {
      toast.error("We could not sign you in right now. Please try again.");
    } finally {
      setIsLoading(false);
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
            <h1 className="text-2xl font-black text-dark mb-1.5">Sign in to your account</h1>
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-blue font-semibold hover:underline">
                Sign up free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-dark mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 border border-gray-3 rounded-lg text-sm bg-gray-2 text-dark focus:outline-none focus:border-blue"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-dark">Password</label>
                <button
                  type="button"
                  onClick={() => toast("Password reset link sent to demo email")}
                  className="text-xs text-blue hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-gray-3 rounded-lg text-sm bg-gray-2 text-dark focus:outline-none focus:border-blue pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-xs text-gray-400 hover:text-dark"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                <input type="checkbox" defaultChecked className="text-blue rounded focus:ring-blue" />
                <span>Remember me on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue text-white rounded-lg text-sm font-bold hover:bg-blue-dark transition duration-200 shadow-sm disabled:opacity-50 mt-2"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-2 text-center">
            <p className="text-xs text-gray-400">
              Demo credentials are prefilled for your convenience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
