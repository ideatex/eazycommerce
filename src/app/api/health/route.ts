import { prisma } from "@/lib/prismaDB";
import { AuthEngine } from "@/lib/auth";
import { RBAC } from "@/lib/rbac";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness is public; runtime details are only shown to admin/staff. */
export async function GET() {
  const started = Date.now();
  let dbStatus: "healthy" | "unreachable" = "healthy";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "unreachable";
  }
  const status = dbStatus === "healthy" ? "healthy" : "degraded";
  const httpStatus = dbStatus === "healthy" ? 200 : 503;

  const user = await AuthEngine.getSessionUserFromCookies().catch(() => null);
  if (!user || !RBAC.isAdminOrStaff(user.role)) {
    return NextResponse.json({ status }, { status: httpStatus });
  }

  const memory = process.memoryUsage();
  return NextResponse.json(
    {
      status,
      uptime: process.uptime(),
      checks: {
        database: { status: dbStatus, latencyMs: Date.now() - started },
        memory: {
          heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
          rssMB: Math.round(memory.rss / 1024 / 1024),
        },
      },
    },
    { status: httpStatus }
  );
}
