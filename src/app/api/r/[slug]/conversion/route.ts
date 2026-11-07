import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const {
      rating,
      selectedChips = [],
      reviewLength = 0,
      scanId,
      actionTaken = 'copied_to_google',
      isPreview,
    } = body;

    const isPreviewMode =
      Boolean(isPreview) ||
      scanId === 'preview-scan' ||
      req.nextUrl.searchParams.get('preview') === 'true' ||
      req.nextUrl.searchParams.get('preview') === '1';

    // In merchant preview mode, do not record real customer conversion events
    if (isPreviewMode) {
      return NextResponse.json({ success: true, isPreview: true });
    }

    const business = await prisma.business.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const resolvedAction = String(actionTaken || 'copied_to_google');

    if (scanId && scanId !== 'preview-scan') {
      await prisma.scanEvent.updateMany({
        where: { id: scanId },
        data: {
          actionTaken: resolvedAction,
          ratingSelected: Number(rating) || 5,
          selectedChips: JSON.stringify(selectedChips),
          reviewLength: Number(reviewLength),
        },
      });
    } else {
      await prisma.scanEvent.create({
        data: {
          businessId: business.id,
          actionTaken: resolvedAction,
          ratingSelected: Number(rating) || 5,
          selectedChips: JSON.stringify(selectedChips),
          reviewLength: Number(reviewLength),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Review conversion error:', error);
    return NextResponse.json({ error: 'Failed to record conversion' }, { status: 500 });
  }
}
