import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// If schema models were added during dev hot-reloading, re-instantiate client
const isCachedClientStale = globalForPrisma.prisma && !(globalForPrisma.prisma as any).paymentTransaction;

export const prisma =
  (!isCachedClientStale && globalForPrisma.prisma) ? globalForPrisma.prisma :
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
