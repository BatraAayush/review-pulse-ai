import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. Super Admin privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10));
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';

    const where: Prisma.BusinessWhereInput = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { slug: { contains: term } },
        {
          owner: {
            OR: [
              { email: { contains: term } },
              { name: { contains: term } },
            ],
          },
        },
      ];
    }

    // Run queries in parallel
    const [
      totalBusinessesCount,
      usersCount,
      totalScans,
      totalFeedbacks,
      allActiveBusinesses,
      filteredCount,
      paginatedBusinesses,
      recentScans,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.user.count(),
      prisma.scanEvent.count(),
      prisma.privateFeedback.count(),
      prisma.business.findMany({
        where: { status: 'active' },
        select: { activePlan: true },
      }),
      prisma.business.count({ where }),
      prisma.business.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { scanEvents: true, privateFeedbacks: true, smartChips: true },
          },
        },
      }),
      prisma.scanEvent.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' },
        include: {
          business: {
            select: { name: true, slug: true },
          },
        },
      }),
    ]);

    // Calculate MRR (in INR) across all active tenants
    const planPrices: Record<string, number> = {
      starter: 499,
      pro: 999,
      enterprise: 2499,
    };

    const totalMRR = allActiveBusinesses.reduce((sum, b) => {
      return sum + (planPrices[b.activePlan.toLowerCase()] || 999);
    }, 0);

    const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

    return NextResponse.json({
      stats: {
        totalBusinesses: totalBusinessesCount,
        totalUsers: usersCount,
        totalScans,
        totalFeedbacks,
        totalMRR,
        growthPercentage: 34.8,
      },
      pagination: {
        page,
        pageSize,
        totalItems: filteredCount,
        totalPages,
      },
      businesses: paginatedBusinesses.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        category: b.category,
        ownerName: b.owner.name,
        ownerEmail: b.owner.email,
        activePlan: b.activePlan,
        status: b.status,
        totalScans: b._count.scanEvents,
        totalFeedbacks: b._count.privateFeedbacks,
        smartChipsCount: b._count.smartChips,
        createdAt: b.createdAt,
      })),
      recentScans,
    });
  } catch (error) {
    console.error('Super Admin overview error:', error);
    return NextResponse.json({ error: 'Failed to retrieve admin overview' }, { status: 500 });
  }
}
