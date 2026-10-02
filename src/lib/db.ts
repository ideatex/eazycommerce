import { prisma } from "@/lib/prismaDB";

/** Shared Prisma client used by the admin panel and commerce APIs. */
export const db = prisma;
export default prisma;
