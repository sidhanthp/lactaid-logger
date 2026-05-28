import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma._prisma) {
    globalForPrisma._prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    });
  }
  return globalForPrisma._prisma;
}
