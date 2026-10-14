import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { plan, businessId } = await req.json();

    const validPlans = ['starter', 'pro', 'enterprise'];
    if (!plan || !validPlans.includes(plan.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid plan selected. Choose starter, pro, or enterprise.' },
        { status: 400 }
      );
    }

    const normalizedPlan = plan.toLowerCase();

    // Find the business owned by this user (or requested business if super admin)
    const business = await prisma.business.findFirst({
      where: session.role === 'SUPER_ADMIN' && businessId ? { id: businessId } : { ownerId: session.userId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found for this account' }, { status: 404 });
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: { activePlan: normalizedPlan },
    });

    return NextResponse.json({
      success: true,
      activePlan: updatedBusiness.activePlan,
      businessId: updatedBusiness.id,
      message: `Your business plan has been updated to ${normalizedPlan.toUpperCase()}.`,
    });
  } catch (error) {
    console.error('Plan update error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    );
  }
}
