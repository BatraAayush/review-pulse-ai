import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDefaultChipsForCategory, normalizeCategory } from '@/lib/chips';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/dashboard/locations - List all locations for the current account
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const businesses = await prisma.business.findMany({
      where: session.role === 'SUPER_ADMIN' ? {} : { ownerId: session.userId },
      include: {
        _count: {
          select: {
            scanEvents: true,
            privateFeedbacks: true,
            smartChips: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Check account-wide plan limit
    const primaryBiz = businesses[0];
    const plan = primaryBiz?.activePlan || 'starter';
    const maxLocations = plan === 'enterprise' ? 10 : plan === 'pro' ? 3 : 1;

    return NextResponse.json({
      success: true,
      locations: businesses,
      count: businesses.length,
      maxLocations,
      plan,
      canAddMore: session.role === 'SUPER_ADMIN' || businesses.length < maxLocations,
    });
  } catch (error) {
    console.error('List locations error:', error);
    return NextResponse.json({ error: 'Failed to load locations' }, { status: 500 });
  }
}

// POST /api/dashboard/locations - Add a new location/branch
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      category = 'fitness',
      slug: customSlug,
      googlePlaceId = '',
      googleReviewUrl = '',
      address = '',
      phone = '',
      tagline = '',
      welcomeMessage = '',
      logoUrl = '',
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
    }

    // Check existing locations count and active plan limit
    const existingBusinesses = await prisma.business.findMany({
      where: { ownerId: session.userId },
      orderBy: { createdAt: 'asc' },
    });

    const existingCount = existingBusinesses.length;
    // Inherit the active plan from the user's primary/highest business
    const userPlan = existingBusinesses.find(b => b.activePlan === 'enterprise')?.activePlan 
      || existingBusinesses.find(b => b.activePlan === 'pro')?.activePlan 
      || existingBusinesses[0]?.activePlan 
      || 'starter';

    const maxLocations = userPlan === 'enterprise' ? 10 : userPlan === 'pro' ? 3 : 1;

    if (session.role !== 'SUPER_ADMIN' && existingCount >= maxLocations) {
      return NextResponse.json(
        {
          error: `Your ${userPlan.toUpperCase()} plan allows up to ${maxLocations} location${maxLocations > 1 ? 's' : ''}. Upgrade to Franchise & Agency to add up to 10 locations.`,
          code: 'LIMIT_REACHED',
          currentCount: existingCount,
          maxLocations,
        },
        { status: 403 }
      );
    }

    // Generate unique slug
    let baseSlug = customSlug && customSlug.trim() ? slugify(customSlug) : slugify(name);
    if (!baseSlug) baseSlug = 'branch';
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const cleanCategory = normalizeCategory(category);
    const chipsTemplate = getDefaultChipsForCategory(cleanCategory);

    const cleanUrl = googleReviewUrl.trim();
    const cleanPlaceId = googlePlaceId.trim();

    let targetReviewUrl: string | null = null;
    let targetPlaceId: string | null = null;

    if (cleanUrl) {
      if (cleanUrl.startsWith('ChIJ')) {
        targetPlaceId = cleanUrl;
        targetReviewUrl = `https://search.google.com/local/writereview?placeid=${cleanUrl}`;
      } else if (!cleanUrl.includes('writereview?business=')) {
        targetReviewUrl = cleanUrl;
        const placeIdMatch = cleanUrl.match(/placeid=([a-zA-Z0-9_-]+)/i);
        if (placeIdMatch && placeIdMatch[1]) {
          targetPlaceId = placeIdMatch[1];
        }
      }
    } else if (cleanPlaceId) {
      if (cleanPlaceId.startsWith('http://') || cleanPlaceId.startsWith('https://')) {
        if (!cleanPlaceId.includes('writereview?business=')) {
          targetReviewUrl = cleanPlaceId;
          const placeIdMatch = cleanPlaceId.match(/placeid=([a-zA-Z0-9_-]+)/i);
          if (placeIdMatch && placeIdMatch[1]) {
            targetPlaceId = placeIdMatch[1];
          }
        }
      } else {
        targetPlaceId = cleanPlaceId;
        targetReviewUrl = `https://search.google.com/local/writereview?placeid=${cleanPlaceId}`;
      }
    }

    // Create new branch location
    const newLocation = await prisma.business.create({
      data: {
        ownerId: session.userId,
        name: name.trim(),
        slug,
        category: cleanCategory,
        tagline: tagline.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        googlePlaceId: targetPlaceId || undefined,
        googleReviewUrl: targetReviewUrl || undefined,
        activePlan: userPlan,
        status: 'active',
        logoUrl: logoUrl.trim() || undefined,
        welcomeMessage: welcomeMessage.trim() || `Welcome to ${name.trim()}! How was your experience today?`,
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
      include: {
        smartChips: true,
      },
    });

    return NextResponse.json({
      success: true,
      business: newLocation,
      message: `Location "${newLocation.name}" has been created successfully with ready-to-print QR!`,
    });
  } catch (error) {
    console.error('Create location error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating this location' },
      { status: 500 }
    );
  }
}
