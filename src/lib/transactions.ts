import { prisma } from './prisma';

export interface CreateTxInput {
  businessId: string;
  orderId: string;
  amount: number;
  currency?: string;
  status?: string;
  plan: string;
  billingCycle?: string;
}

export async function createTransaction(input: CreateTxInput) {
  if ((prisma as any).paymentTransaction?.create) {
    try {
      return await (prisma as any).paymentTransaction.create({
        data: {
          businessId: input.businessId,
          orderId: input.orderId,
          amount: input.amount,
          currency: input.currency || 'INR',
          status: input.status || 'pending',
          plan: input.plan,
          billingCycle: input.billingCycle || 'monthly',
        },
      });
    } catch {
      // Fall through to raw query fallback
    }
  }

  // Fallback to direct SQLite raw query
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "PaymentTransaction" ("id", "businessId", "orderId", "amount", "currency", "status", "plan", "billingCycle", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.businessId,
    input.orderId,
    input.amount,
    input.currency || 'INR',
    input.status || 'pending',
    input.plan,
    input.billingCycle || 'monthly',
    now,
    now
  );
  return { id, ...input, createdAt: now, updatedAt: now };
}

export async function getTransactionByOrderId(orderId: string) {
  if ((prisma as any).paymentTransaction?.findUnique) {
    try {
      const res = await (prisma as any).paymentTransaction.findUnique({
        where: { orderId },
        include: { business: true },
      });
      if (res) return res;
    } catch {
      // Fall through to raw query fallback
    }
  }

  const results: any[] = await prisma.$queryRawUnsafe(
    `SELECT t.*, b.name as businessName, b.ownerId as ownerId FROM "PaymentTransaction" t JOIN "Business" b ON t.businessId = b.id WHERE t.orderId = ? LIMIT 1`,
    orderId
  );
  if (!results || !results.length) return null;
  const row = results[0];
  return {
    ...row,
    business: {
      id: row.businessId,
      name: row.businessName,
      ownerId: row.ownerId,
    },
  };
}

export async function updateTransactionStatus(
  orderId: string,
  data: { paymentId?: string; signature?: string; status: string; paymentMethod?: string }
) {
  if ((prisma as any).paymentTransaction?.update) {
    try {
      return await (prisma as any).paymentTransaction.update({
        where: { orderId },
        data,
      });
    } catch {
      // Fall through to raw query fallback
    }
  }

  const now = new Date().toISOString();
  await prisma.$executeRawUnsafe(
    `UPDATE "PaymentTransaction" SET "paymentId" = ?, "signature" = ?, "status" = ?, "paymentMethod" = ?, "updatedAt" = ? WHERE "orderId" = ?`,
    data.paymentId || null,
    data.signature || null,
    data.status,
    data.paymentMethod || null,
    now,
    orderId
  );
}

export async function getTransactionsForBusiness(businessId: string, limit = 10) {
  if ((prisma as any).paymentTransaction?.findMany) {
    try {
      return await (prisma as any).paymentTransaction.findMany({
        where: { businessId, status: 'captured' },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch {
      // Fall through to raw query fallback
    }
  }

  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "PaymentTransaction" WHERE "businessId" = ? AND "status" = 'captured' ORDER BY "createdAt" DESC LIMIT ?`,
    businessId,
    limit
  );
  return rows;
}
