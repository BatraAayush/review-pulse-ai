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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const before = searchParams.get('before'); // older records: timestamp < before
    const after = searchParams.get('after');   // newer records: timestamp > after
    const action = searchParams.get('action');
    const search = searchParams.get('search');

    const where: Prisma.ScanEventWhereInput = {};

    if (before) {
      where.timestamp = { lt: new Date(before) };
    } else if (after) {
      where.timestamp = { gt: new Date(after) };
    }

    if (action && action !== 'all') {
      where.actionTaken = action;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.business = {
        OR: [
          { name: { contains: term } },
          { slug: { contains: term } },
        ],
      };
    }

    // When fetching newer events (after), we still want them ordered newest first
    // When fetching older events (before) or initial page, order newest first
    const scans = await prisma.scanEvent.findMany({
      where,
      take: after ? limit : limit + 1,
      orderBy: { timestamp: 'desc' },
      include: {
        business: {
          select: { name: true, slug: true },
        },
      },
    });

    let hasMore = false;
    let resultScans = scans;

    if (!after && scans.length > limit) {
      hasMore = true;
      resultScans = scans.slice(0, limit);
    }

    return NextResponse.json({
      scans: resultScans,
      hasMore,
    });
  } catch (error) {
    console.error('Super Admin scans query error:', error);
    return NextResponse.json({ error: 'Failed to retrieve scan telemetry' }, { status: 500 });
  }
}
