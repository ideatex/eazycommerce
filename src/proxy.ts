import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect Business Workspace and Platform Admin routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "vanigam-b2b2c-ecommerce-secret-key-2026",
    });

    // 1. If authenticated as a retail customer, strictly redirect away from /admin
    if (token && (token.role === "CUSTOMER" || (token as any).userType === "CUSTOMER")) {
      const url = req.nextUrl.clone();
      url.pathname = "/orders";
      url.searchParams.set("error", "AccessDeniedBusinessWorkspace");
      return NextResponse.redirect(url);
    }

    // 2. Protect Platform Super Admin routes (/admin/businesses)
    if (pathname.startsWith("/admin/businesses")) {
      if (token) {
        const isPlatform =
          token.role === "SUPER_ADMIN" ||
          token.activeOrgId === "org-platform" ||
          token.email === "admin@vanigam.com";

        if (!isPlatform) {
          const url = req.nextUrl.clone();
          url.pathname = "/admin";
          url.searchParams.set("error", "PlatformAdminRequired");
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return NextResponse.next();
}

export const middleware = proxy;

export const config = {
  matcher: ["/admin/:path*"],
};
