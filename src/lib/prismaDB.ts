import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  dbConfigWarned?: boolean;
};

const url = process.env.DATABASE_URL;

// A hosted deployment cannot reach a database on the developer's machine.
// Warn once, at runtime only (the build compiles pages in several workers and does not need a database).
if (
  !globalForPrisma.dbConfigWarned &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  process.env.VERCEL &&
  (!url || /(^|@)(localhost|127\.0\.0\.1|\[::1\])([:/]|$)/.test(url))
) {
  globalForPrisma.dbConfigWarned = true;
  console.error(
    "[database] DATABASE_URL is missing or points at localhost. Set it to a hosted PostgreSQL URL in the Vercel project's Environment Variables (see docs/DEPLOY-VERCEL.md)."
  );
}

// Serverless functions each hold their own pool, so keep it tiny there and let the
// database's pooler (Neon/Supabase/PgBouncer) do the sharing. DB_POOL_MAX overrides.
const poolMax = process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : process.env.VERCEL ? 1 : undefined;

const adapter = url
  ? new PrismaPg({
      connectionString: url,
      ...(poolMax ? { max: poolMax } : {}),
    })
  : undefined;

export const prisma = globalForPrisma.prisma || (adapter ? new PrismaClient({ adapter }) : new PrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
