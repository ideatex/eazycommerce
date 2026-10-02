import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prismaDB";
import { ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr, str } from "@/lib/api";
import { getDefaultBusiness } from "@/lib/business";
import { rateLimit } from "@/lib/rateLimit";
import { Roles } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Customer self-registration. The role is always CUSTOMER; it cannot be chosen by the caller. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    rateLimit(req, "register", 5, 10 * 60 * 1000);
    const body = await readJson(req);

    const fullName = reqStr(body.name, "Name", 120);
    const email = reqStr(body.email, "Email", 200).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "VALIDATION", "Enter a valid email address.");
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8 || password.length > 128)
      throw new ApiError(400, "VALIDATION", "Password must be between 8 and 128 characters.");
    const phone = str(body.phone)?.slice(0, 20) || null;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new ApiError(409, "CONFLICT", "An account with this email address already exists.");

    const business = await getDefaultBusiness();
    const user = await prisma.user.create({
      data: {
        email,
        name: fullName,
        fullName,
        phone,
        password: await bcrypt.hash(password, 12),
        role: Roles.CUSTOMER,
        businessId: business.id,
        customerProfile: { create: {} },
      },
      select: { id: true },
    });
    return ok({ userId: user.id }, 201);
  });
}
