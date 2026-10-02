import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF"];

/**
 * First line of defence for /admin. Authorization is enforced again server-side
 * (admin layout and every /api route re-check the user in the database).
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "";
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  if (!ADMIN_ROLES.includes(String(token.role ?? ""))) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
