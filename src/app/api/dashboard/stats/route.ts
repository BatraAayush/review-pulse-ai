import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTransactionsForBusiness } from '@/lib/transactions';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const requestedBizId = searchParams.get('businessId');

    let business;
    if (session.role === 'SUPER_ADMIN') {
      if (requestedBizId) {
        business = await prisma.business.findUnique({
          where: { id: requestedBizId },
          include: { smartChips: { orderBy: { sortOrder: 'asc' } } },
        });
      } else {
        business = await prisma.business.findFirst({
          where: { ownerId: session.userId },
          include: { smartChips: { orderBy: { sortOrder: 'asc' } } },
        });
        // If super admin has no personal business profile, fallback to the latest registered platform business
        if (!business) {
          business = await prisma.business.findFirst({
            include: { smartChips: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { createdAt: 'desc' },
          });
        }
      }
    } else if (requestedBizId) {
      business = await prisma.business.findFirst({
        where: { id: requestedBizId, ownerId: session.userId },
        include: { smartChips: { orderBy: { sortOrder: 'asc' } } },
      });
    } else {
      business = await prisma.business.findFirst({
        where: { ownerId: session.userId },
        include: { smartChips: { orderBy: { sortOrder: 'asc' } } },
      });
    }

    if (!business) {
      return NextResponse.json({ error: 'No business found for this account' }, { status: 404 });
    }

    // Fetch all locations owned by this user (with fallback if Prisma client cached old schema)
    let userBusinesses: any[] = [];
    try {
      userBusinesses = await (prisma.business as any).findMany({
        where: session.role === 'SUPER_ADMIN' ? {} : { ownerId: session.userId },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          activePlan: true,
          status: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          address: true,
          logoUrl: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch {
      userBusinesses = await prisma.$queryRawUnsafe<any[]>(
        session.role === 'SUPER_ADMIN'
          ? `SELECT id, name, slug, category, activePlan, status, subscriptionStatus, trialEndsAt, address, logoUrl FROM Business ORDER BY createdAt ASC`
          : `SELECT id, name, slug, category, activePlan, status, subscriptionStatus, trialEndsAt, address, logoUrl FROM Business WHERE ownerId = '${session.userId}' ORDER BY createdAt ASC`
      );
    }

    // Ensure business has subscription & bypass fields even if cached Prisma model omitted them
    if (business && ((business as any).subscriptionStatus === undefined || (business as any).trialEndsAt === undefined || (business as any).bypassAiReview === undefined)) {
      try {
        const rawBiz = await prisma.$queryRawUnsafe<any[]>(
          `SELECT "subscriptionStatus", "trialEndsAt", "subscriptionCycle", "subscriptionRenewsAt", "bypassAiReview" FROM "Business" WHERE id = '${business.id}' LIMIT 1`
        );
        if (rawBiz && rawBiz[0]) {
          (business as any).subscriptionStatus = rawBiz[0].subscriptionStatus || 'pending_payment';
          (business as any).trialEndsAt = rawBiz[0].trialEndsAt;
          (business as any).subscriptionCycle = rawBiz[0].subscriptionCycle || 'monthly';
          (business as any).subscriptionRenewsAt = rawBiz[0].subscriptionRenewsAt;
          (business as any).bypassAiReview = Boolean(rawBiz[0].bypassAiReview);
        }
      } catch (e) {
        console.error('Stats rawBiz query error:', e);
      }
    }

    const [totalScans, googleConversions, privateFeedbacks, scans, transactions] = await Promise.all([
      prisma.scanEvent.count({ where: { businessId: business.id } }),
      prisma.scanEvent.count({
        where: {
          businessId: business.id,
          actionTaken: { in: ['copied_to_google', 'direct_google_redirect', 'BYPASS_TO_GOOGLE'] },
        },
      }),
      prisma.privateFeedback.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.scanEvent.findMany({
        where: { businessId: business.id },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
      getTransactionsForBusiness(business.id, 10),
    ]);

    // Auto-reconcile subscription status from captured payments
    const latestCaptured = transactions.find((t: any) => t.status === 'captured');
    if (latestCaptured && (business as any).subscriptionStatus !== 'active') {
      try {
        const cycle = latestCaptured.billingCycle === 'annual' ? 'annual' : 'monthly';
        const daysToAdd = cycle === 'annual' ? 365 : 30;
        const renewsAt = new Date(new Date(latestCaptured.createdAt).getTime() + daysToAdd * 24 * 60 * 60 * 1000);

        await prisma.business.update({
          where: { id: business.id },
          data: {
            subscriptionStatus: 'active',
            status: 'active',
            subscriptionCycle: cycle,
            subscriptionRenewsAt: renewsAt,
            activePlan: latestCaptured.plan || (business as any).activePlan || 'pro',
          },
        });

        (business as any).subscriptionStatus = 'active';
        (business as any).subscriptionCycle = cycle;
        (business as any).subscriptionRenewsAt = renewsAt;
        (business as any).activePlan = latestCaptured.plan || (business as any).activePlan || 'pro';
      } catch (err) {
        console.warn('Auto-reconcile subscription error:', err);
      }
    }

    // Calculate device breakdown
    const iosScans = scans.filter((s) => s.deviceType === 'ios').length;
    const androidScans = scans.filter((s) => s.deviceType === 'android').length;
    const desktopScans = scans.filter((s) => s.deviceType === 'desktop').length;

    // Calculate average rating
    const ratedScans = scans.filter((s) => s.ratingSelected !== null);
    const avgRating = ratedScans.length > 0
      ? Number((ratedScans.reduce((acc, curr) => acc + (curr.ratingSelected || 0), 0) / ratedScans.length).toFixed(1))
      : 4.8;

    const conversionRate = totalScans > 0
      ? Number(((googleConversions / totalScans) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      business,
      userBusinesses,
      stats: {
        totalScans,
        googleConversions,
        privateFeedbackCount: privateFeedbacks.length,
        unreadFeedbackCount: privateFeedbacks.filter((f) => f.status === 'unread').length,
        conversionRate,
        averageRating: avgRating,
        devices: {
          ios: iosScans,
          android: androidScans,
          desktop: desktopScans,
        },
      },
      recentScans: scans.slice(0, 10),
      feedbacks: privateFeedbacks,
      transactions,
    });
  } catch (error: any) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve dashboard statistics', details: error?.message || String(error) }, { status: 500 });
  }
}
