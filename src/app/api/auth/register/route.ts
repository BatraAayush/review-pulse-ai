import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { getDefaultChipsForCategory } from '@/lib/chips';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, businessName, category = 'restaurant', googleReviewUrl, plan = 'pro' } = await req.json();

    if (!name || !email || !password || !businessName) {
      return NextResponse.json(
        { error: 'Name, email, password, and business name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const validPlan = (['starter', 'pro', 'enterprise'].includes(plan) ? plan : 'starter');
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Generate unique slug
    let baseSlug = slugify(businessName);
    if (!baseSlug) baseSlug = 'biz';
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const passwordHash = await hashPassword(password);
    const chosenCategory = category?.toLowerCase().trim() || 'restaurant';
    const chipsTemplate = getDefaultChipsForCategory(chosenCategory);

    // Clean and validate Google Review URL or Place ID - DO NOT fabricate fake URLs
    let finalGoogleReviewUrl: string | null = null;
    let finalGooglePlaceId: string | null = null;

    if (typeof googleReviewUrl === 'string' && googleReviewUrl.trim().length > 0) {
      const rawUrl = googleReviewUrl.trim();
      if (rawUrl.startsWith('ChIJ')) {
        finalGooglePlaceId = rawUrl;
        finalGoogleReviewUrl = `https://search.google.com/local/writereview?placeid=${rawUrl}`;
      } else if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        // Ignore legacy fake URL if submitted
        if (!rawUrl.includes('writereview?business=')) {
          finalGoogleReviewUrl = rawUrl;
          const placeIdMatch = rawUrl.match(/placeid=([a-zA-Z0-9_-]+)/i);
          if (placeIdMatch && placeIdMatch[1]) {
            finalGooglePlaceId = placeIdMatch[1];
          }
        }
      }
    }

    // Create user and business in transaction
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'OWNER',
        businesses: {
          create: {
            name: businessName.trim(),
            slug,
            category: chosenCategory,
            googleReviewUrl: finalGoogleReviewUrl,
            googlePlaceId: finalGooglePlaceId,
            activePlan: validPlan,
            status: 'active',
            subscriptionStatus: 'pending_payment',
            trialEndsAt: null,
            welcomeMessage: `Welcome to ${businessName}! How was your experience today?`,
            smartChips: {
              create: chipsTemplate.map((chip, idx) => ({
                label: chip.label,
                category: chip.category,
                phrase: chip.phrase,
                icon: chip.icon,
                sortOrder: idx + 1,
              })),
            },
          },
        },
      },
      include: {
        businesses: true,
      },
    });

    const primaryBusiness = newUser.businesses[0];

    const sessionPayload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: 'OWNER' as const,
      businessId: primaryBusiness?.id,
      businessSlug: primaryBusiness?.slug,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      user: sessionPayload,
      redirectUrl: `/dashboard?activate=true&plan=${validPlan}`,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating your account' },
      { status: 500 }
    );
  }
}
