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

    const scan = await prisma.scanEvent.create({
      data: {
        businessId: business.id,
        userAgent,
        ipAddress,
        deviceType,
        actionTaken: 'scanned',
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
