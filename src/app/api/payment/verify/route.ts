import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature, isRazorpayConfigured, PlanKey, BillingCycle } from '@/lib/payment';
import { getTransactionByOrderId, updateTransactionStatus } from '@/lib/transactions';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      orderId,
      paymentId,
      signature,
      plan,
      billingCycle = 'monthly',
      businessId: reqBizId,
      isSimulation,
      paymentMethod = 'upi',
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Find the pending transaction
    const transaction = await getTransactionByOrderId(orderId);

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 });
    }

    // Verify ownership
    if (session.role !== 'SUPER_ADMIN' && transaction.business.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isLive = isRazorpayConfigured();

    // Verify Razorpay signature if live
    if (isLive && !isSimulation) {
      if (!paymentId || !signature) {
        return NextResponse.json({ error: 'Missing paymentId or signature for live verification' }, { status: 400 });
      }

      const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
      if (!isValid) {
        await updateTransactionStatus(orderId, { status: 'failed' });
        return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 });
      }
    }

    const finalPaymentId = paymentId || `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const finalMethod = paymentMethod || (isSimulation ? 'test_simulator' : 'upi');

    // 1. Mark transaction as captured
    const updatedTransaction = await updateTransactionStatus(orderId, {
      paymentId: finalPaymentId,
      signature: signature || 'simulated_signature',
      status: 'captured',
      paymentMethod: finalMethod,
    });

    // 2. Compute subscription renewal date
    const cycle = (billingCycle === 'annual' ? 'annual' : 'monthly') as BillingCycle;
    const daysToAdd = cycle === 'annual' ? 365 : 30;
    const renewsAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    // 3. Update business active plan & subscription
    const targetPlan = (plan || transaction.plan || 'pro') as PlanKey;
    const updatedBusiness = await prisma.business.update({
      where: { id: transaction.businessId },
      data: {
        activePlan: targetPlan,
        status: 'active',
        subscriptionStatus: 'active',
        subscriptionCycle: cycle,
        subscriptionRenewsAt: renewsAt,
      },
    });

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "Business" SET "subscriptionStatus" = $1, "subscriptionCycle" = $2, "subscriptionRenewsAt" = $3, "updatedAt" = $4 WHERE "id" = $5`,
        'active',
        cycle,
        renewsAt,
        new Date(),
        transaction.businessId
      );
    } catch (err) {
      console.warn('Subscription status column update fallback warning:', err);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${targetPlan.toUpperCase()} plan!`,
      business: {
        ...updatedBusiness,
        subscriptionStatus: 'active',
        subscriptionCycle: cycle,
        subscriptionRenewsAt: renewsAt,
      },
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
