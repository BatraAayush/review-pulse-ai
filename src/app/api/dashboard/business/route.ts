import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie } from '@/lib/auth';
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

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      category,
      slug: requestedSlug,
      tagline,
      address,
      phone,
      googlePlaceId,
      googleReviewUrl,
      primaryColor,
      welcomeMessage,
      customPromptMessage,
      status,
      resetChipsToCategory,
      logoUrl,
      bypassAiReview,
    } = body;

    // Find the business owned by this user (or specific branch if multi-location)
    const business = await prisma.business.findFirst({
      where: session.role === 'SUPER_ADMIN' && body.id
        ? { id: body.id }
        : body.id
        ? { id: body.id, ownerId: session.userId }
        : { ownerId: session.userId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    let updatedSlug: string | undefined = undefined;

    // If slug is being updated
    if (requestedSlug && requestedSlug.trim()) {
      const cleanSlug = slugify(requestedSlug);
      if (cleanSlug.length < 2) {
        return NextResponse.json(
          { error: 'Custom URL slug must be at least 2 characters long' },
          { status: 400 }
        );
      }

      if (cleanSlug !== business.slug) {
        const existingWithSlug = await prisma.business.findUnique({
          where: { slug: cleanSlug },
        });

        if (existingWithSlug && existingWithSlug.id !== business.id) {
          return NextResponse.json(
            { error: 'This URL slug is already taken by another business. Please pick another one.' },
            { status: 409 }
          );
        }

        updatedSlug = cleanSlug;
      }
    }

    const targetCategory = normalizeCategory(category || business.category || 'restaurant');
    const categoryChanged = targetCategory !== normalizeCategory(business.category);

    let updatedReviewUrl = googleReviewUrl;
    let updatedPlaceId = googlePlaceId;

    if (googleReviewUrl !== undefined) {
      const rawUrl = typeof googleReviewUrl === 'string' ? googleReviewUrl.trim() : '';
      if (!rawUrl || rawUrl.includes('writereview?business=')) {
        updatedReviewUrl = null;
      } else if (rawUrl.startsWith('ChIJ')) {
        updatedReviewUrl = `https://search.google.com/local/writereview?placeid=${rawUrl}`;
        if (!updatedPlaceId) updatedPlaceId = rawUrl;
      } else {
        updatedReviewUrl = rawUrl;
        const placeIdMatch = rawUrl.match(/placeid=([a-zA-Z0-9_-]+)/i);
        if (placeIdMatch && placeIdMatch[1] && !updatedPlaceId) {
          updatedPlaceId = placeIdMatch[1];
        }
      }
    }

    if (googlePlaceId !== undefined) {
      const rawPlace = typeof googlePlaceId === 'string' ? googlePlaceId.trim() : '';
      if (!rawPlace) {
        updatedPlaceId = null;
      } else if (rawPlace.startsWith('http://') || rawPlace.startsWith('https://')) {
        if (!updatedReviewUrl) updatedReviewUrl = rawPlace;
        const placeIdMatch = rawPlace.match(/placeid=([a-zA-Z0-9_-]+)/i);
        updatedPlaceId = placeIdMatch ? placeIdMatch[1] : null;
      } else {
        updatedPlaceId = rawPlace;
      }
    }

    await prisma.business.update({
      where: { id: business.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category: targetCategory }),
        ...(updatedSlug && { slug: updatedSlug }),
        ...(tagline !== undefined && { tagline }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(googlePlaceId !== undefined && { googlePlaceId: updatedPlaceId }),
        ...(googleReviewUrl !== undefined && { googleReviewUrl: updatedReviewUrl }),
        ...(primaryColor && { primaryColor }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(customPromptMessage !== undefined && { customPromptMessage }),
        ...(status && { status }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl ? logoUrl.trim() : null }),
      },
    });

    if (bypassAiReview !== undefined) {
      try {
        await (prisma.business as any).update({
          where: { id: business.id },
          data: { bypassAiReview: Boolean(bypassAiReview) },
        });
      } catch {
        await prisma.$executeRawUnsafe(
          `UPDATE "Business" SET "bypassAiReview" = ${Boolean(bypassAiReview)} WHERE id = '${business.id}'`
        );
      }
    }

    // Check if existing chips are mismatched (e.g. food chips on a gym/salon/clinic) or empty
    const existingChips = await prisma.smartChip.findMany({
      where: { businessId: business.id },
    });
    const hasFoodChips = existingChips.some(
      (c) => c.label.includes('Food') || c.label.includes('Pizza') || c.label.includes('Dessert') || c.label.includes('Wine')
    );
    const chipsMismatch = targetCategory !== 'restaurant' && hasFoodChips;

    // If category changed, explicit reset requested, or chips are mismatched with category, auto-seed correct chips
    if (categoryChanged || resetChipsToCategory || chipsMismatch || existingChips.length === 0) {
      const newChipsTemplate = getDefaultChipsForCategory(targetCategory);

      // Remove existing chips and insert the new category chips
      await prisma.smartChip.deleteMany({
        where: { businessId: business.id },
      });

      await prisma.smartChip.createMany({
        data: newChipsTemplate.map((chip, idx) => ({
          businessId: business.id,
          label: chip.label,
          category: chip.category,
          phrase: chip.phrase,
          icon: chip.icon,
          sortOrder: idx + 1,
        })),
      });
    }

    // Retrieve fresh business with smart chips
    const updated = await prisma.business.findUnique({
      where: { id: business.id },
      include: { smartChips: { orderBy: { sortOrder: 'asc' } } },
    });

    if (updated && (updated as any).bypassAiReview === undefined) {
      try {
        const raw = await prisma.$queryRawUnsafe<any[]>(
          `SELECT "bypassAiReview" FROM "Business" WHERE id = '${business.id}' LIMIT 1`
        );
        if (raw && raw[0]) {
          (updated as any).bypassAiReview = Boolean(raw[0].bypassAiReview);
        }
      } catch {}
    }

    // If slug changed, update the session cookie so links and QR work immediately
    if (updatedSlug && updatedSlug !== session.businessSlug && updated) {
      await setSessionCookie({
        ...session,
        businessSlug: updatedSlug,
        businessId: updated.id,
      });
    }

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    console.error('Update business settings error:', error);
    return NextResponse.json({ error: 'Failed to update business settings', details: error?.message || String(error) }, { status: 500 });
  }
}

