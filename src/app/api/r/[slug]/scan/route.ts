import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function detectDevice(userAgent: string): 'ios' | 'android' | 'desktop' {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const deviceType = detectDevice(userAgent);

    const business = await prisma.business.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let actionTaken = 'scanned';
    let isPreview = req.nextUrl.searchParams.get('preview') === 'true';

    try {
      const body = await req.json().catch(() => ({}));
      if (body?.isPreview) {
        isPreview = true;
      }
      if (body?.isDirect || body?.actionTaken === 'direct_google_redirect') {
        actionTaken = 'direct_google_redirect';
      } else if (body?.actionTaken) {
        actionTaken = body.actionTaken;
      }
    } catch {
      // Body empty or not json, default to scanned
    }

    // If opening in merchant preview mode from dashboard, do not record a real customer scan
    if (isPreview) {
      return NextResponse.json({
        success: true,
        scanId: 'preview-scan',
        deviceType,
        isPreview: true,
      });
    }

    // 5-second server-side debounce: prevent duplicate scans caused by React StrictMode, double-mount, or rapid reloads
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentScan = await prisma.scanEvent.findFirst({
      where: {
        businessId: business.id,
        ipAddress,
        userAgent,
        timestamp: { gte: fiveSecondsAgo },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (recentScan) {
      return NextResponse.json({
        success: true,
        scanId: recentScan.id,
        deviceType,
        deduplicated: true,
      });
    }

    const scan = await prisma.scanEvent.create({
      data: {
        businessId: business.id,
        userAgent,
        ipAddress,
        deviceType,
        actionTaken,
      },
    });

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      deviceType,
    });
  } catch (error) {
    console.error('Scan event error:', error);
    return NextResponse.json({ error: 'Failed to record scan' }, { status: 500 });
  }
}
