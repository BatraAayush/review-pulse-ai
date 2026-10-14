import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const business = await prisma.business.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        smartChips: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (business.status === 'paused') {
      return NextResponse.json(
        { error: 'This review portal is currently paused by the owner' },
        { status: 403 }
      );
    }

    if (business.subscriptionStatus === 'pending_payment' || business.subscriptionStatus === 'unpaid') {
      return NextResponse.json(
        {
          error: 'This business review portal is awaiting payment activation. The business owner must complete plan activation in their dashboard to make this portal live.',
          isPendingPayment: true,
          businessName: business.name,
        },
        { status: 402 }
      );
    }

    const hasValidDirectUrl = Boolean(
      business.googleReviewUrl &&
      business.googleReviewUrl.trim().length > 0 &&
      !business.googleReviewUrl.includes('writereview?business=')
    );

    const resolvedGoogleReviewUrl = hasValidDirectUrl
      ? business.googleReviewUrl
      : business.googlePlaceId && business.googlePlaceId.trim().length > 0 && !business.googlePlaceId.includes('null')
      ? `https://search.google.com/local/writereview?placeid=${business.googlePlaceId.trim()}`
      : null;

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        category: business.category,
        tagline: business.tagline,
        address: business.address,
        phone: business.phone,
        googlePlaceId: business.googlePlaceId || null,
        googleReviewUrl: resolvedGoogleReviewUrl,
        logoUrl: business.logoUrl,
        primaryColor: business.primaryColor,
        welcomeMessage: business.welcomeMessage,
        customPromptMessage: business.customPromptMessage,
        smartChips: business.smartChips,
      },
    });
  } catch (error) {
    console.error('Fetch business review funnel error:', error);
    return NextResponse.json(
      { error: 'Failed to load business review portal' },
      { status: 500 }
    );
  }
}
