import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTransactionsForBusiness } from '@/lib/transactions';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    const business = await prisma.business.findFirst({
      where: businessId
        ? session.role === 'SUPER_ADMIN'
          ? { id: businessId }
          : { id: businessId, ownerId: session.userId }
        : { ownerId: session.userId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const transactions = await getTransactionsForBusiness(business.id, 20);

    return NextResponse.json({
      transactions,
      subscription: {
        activePlan: business.activePlan,
        subscriptionStatus: business.subscriptionStatus,
        trialEndsAt: business.trialEndsAt,
        subscriptionCycle: business.subscriptionCycle,
        subscriptionRenewsAt: business.subscriptionRenewsAt,
      },
    });
  } catch (error) {
    console.error('Payment history error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
  }
}
