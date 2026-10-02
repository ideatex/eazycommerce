import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr, str } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  return handle(async () => {
    rateLimit(req, "contact", 5, 10 * 60 * 1000);
    const body = await readJson(req);

    const email = reqStr(body.email, "Email", 200).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "VALIDATION", "Enter a valid email address.");

    await prisma.contactMessage.create({
      data: {
        fullName: reqStr(body.fullName, "Name", 120),
        email,
        phone: str(body.phone)?.slice(0, 20) || null,
        subject: str(body.subject)?.slice(0, 200) || "General enquiry",
        message: reqStr(body.message, "Message", 5000),
      },
    });
    return ok({ received: true }, 201);
  });
}
