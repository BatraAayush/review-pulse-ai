import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getPlanAmountPaise,
  isRazorpayConfigured,
  PlanKey,
  BillingCycle,
  PLANS_CONFIG,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
} from '@/lib/payment';
import { createTransaction } from '@/lib/transactions';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan = 'pro', billingCycle = 'monthly', businessId: reqBizId } = body;

    const validPlan = (['starter', 'pro', 'enterprise'].includes(plan) ? plan : 'starter') as PlanKey;
    const validCycle = (['monthly', 'annual'].includes(billingCycle) ? billingCycle : 'monthly') as BillingCycle;

    // Identify target business
    const business = await prisma.business.findFirst({
      where: reqBizId
        ? session.role === 'SUPER_ADMIN'
          ? { id: reqBizId }
          : { id: reqBizId, ownerId: session.userId }
        : { ownerId: session.userId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business location not found' }, { status: 404 });
    }

    const amountPaise = getPlanAmountPaise(validPlan, validCycle);
    const planDetails = PLANS_CONFIG[validPlan];

    let orderId: string;
    const isLiveGateway = isRazorpayConfigured();

    if (isLiveGateway) {
      // Call official Razorpay Orders API
      const authHeader = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt: `rcpt_${business.id.slice(-6)}_${Date.now().toString().slice(-6)}`,
          notes: {
            businessId: business.id,
            businessName: business.name,
            plan: validPlan,
            billingCycle: validCycle,
            userEmail: session.email,
          },
        }),
      });

      const rzpData = await rzpRes.json();
      if (!rzpRes.ok || !rzpData.id) {
        console.error('Razorpay Order API Error:', rzpData);
        throw new Error(rzpData.error?.description || 'Failed to initialize payment gateway order');
      }

      orderId = rzpData.id;
    } else {
      // Simulated / Sandbox Mode (allows testing full checkout, UPI flow & activation immediately)
      orderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // Record pending transaction in database
    await createTransaction({
      businessId: business.id,
      orderId,
      amount: amountPaise,
      currency: 'INR',
      status: 'pending',
      plan: validPlan,
      billingCycle: validCycle,
    });

    return NextResponse.json({
      success: true,
      orderId,
      amount: amountPaise,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID || 'rzp_test_simulated_key',
      isSimulation: !isLiveGateway,
      plan: validPlan,
      planName: planDetails.name,
      billingCycle: validCycle,
      business: {
        id: business.id,
        name: business.name,
        email: session.email,
        phone: business.phone || '',
      },
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
