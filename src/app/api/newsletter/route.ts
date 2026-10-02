import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  return handle(async () => {
    rateLimit(req, "newsletter", 10, 10 * 60 * 1000);
    const body = await readJson(req);
    const email = reqStr(body.email, "Email", 200).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "VALIDATION", "Enter a valid email address.");

    // Subscribing twice is not an error.
    await prisma.newsletterSubscriber.upsert({ where: { email }, create: { email }, update: {} });
    return ok({ subscribed: true }, 201);
  });
}
