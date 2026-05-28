import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma._prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    globalForPrisma._prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma._prisma;
}
