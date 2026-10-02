import { PrismaClient } from "@prisma/client"
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const adapter = process.env.DATABASE_URL
  ? new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      ...(process.env.DB_POOL_MAX ? { max: Number(process.env.DB_POOL_MAX) } : {}),
    })
  : undefined

export const prisma =
  globalForPrisma.prisma ||
  (adapter ? new PrismaClient({ adapter }) : new PrismaClient())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
