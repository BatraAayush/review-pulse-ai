import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getDefaultChipsForCategory,
  normalizeCategory,
  isMedicalCategory,
  validateMedicalChipContent,
} from '@/lib/chips';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // 1. Batch insert mode
    if (Array.isArray(body.chips)) {
      const { chips, businessId } = body;
      if (!chips.length) {
        return NextResponse.json({ error: 'No prompts provided in batch' }, { status: 400 });
      }

      const business = await prisma.business.findFirst({
        where: session.role === 'SUPER_ADMIN' && businessId
          ? { id: businessId }
          : businessId
          ? { id: businessId, ownerId: session.userId }
          : { ownerId: session.userId },
        select: { id: true, category: true },
      });

      if (!business) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      const isClinic = isMedicalCategory(business.category);

      // Fetch existing chips for this business to skip duplicates
      const existingChips = await prisma.smartChip.findMany({
        where: { businessId: business.id },
        select: { label: true },
      });
      const existingLabels = new Set(
        existingChips.map((c) => c.label.toLowerCase().trim())
      );

      const maxSort = await prisma.smartChip.aggregate({
        where: { businessId: business.id },
        _max: { sortOrder: true },
      });
      let currentSort = maxSort._max.sortOrder || 0;

      const toInsert: Array<{
        businessId: string;
        label: string;
        category: string;
        phrase: string;
        icon: string;
        sortOrder: number;
      }> = [];

      const seenInBatch = new Set<string>();

      for (const chip of chips) {
        const trimmedLabel = (chip.label || '').trim();
        const trimmedPhrase = (chip.phrase || '').trim();
        const trimmedCategory = (chip.category || 'General').trim();
        const key = trimmedLabel.toLowerCase();

        if (!trimmedLabel || trimmedLabel.length < 2 || trimmedLabel.length > 40) continue;
        if (!trimmedPhrase || trimmedPhrase.length < 10 || trimmedPhrase.length > 300) continue;
        if (existingLabels.has(key) || seenInBatch.has(key)) continue;

        if (isClinic) {
          const validation = validateMedicalChipContent(trimmedLabel, trimmedPhrase, trimmedCategory);
          if (!validation.valid) continue;
        }

        seenInBatch.add(key);
        currentSort += 1;
        toInsert.push({
          businessId: business.id,
          label: trimmedLabel,
          category: trimmedCategory,
          phrase: trimmedPhrase,
          icon: chip.icon || 'Sparkles',
          sortOrder: currentSort,
        });
      }

      if (toInsert.length === 0) {
        return NextResponse.json({
          error: 'All selected prompts are already active in your funnel or invalid.',
        }, { status: 400 });
      }

      await prisma.smartChip.createMany({
        data: toInsert,
      });

      const updatedChips = await prisma.smartChip.findMany({
        where: { businessId: business.id },
        orderBy: { sortOrder: 'asc' },
      });

      return NextResponse.json({
        success: true,
        addedCount: toInsert.length,
        chips: updatedChips,
      });
    }

    // 2. Single chip creation mode
    const { label, category, phrase, icon, businessId } = body;

    const trimmedLabel = (label || '').trim();
    const trimmedPhrase = (phrase || '').trim();
    const trimmedCategory = (category || 'General').trim();

    if (!trimmedLabel) {
      return NextResponse.json({ error: 'Tag label is required' }, { status: 400 });
    }
    if (trimmedLabel.length < 2) {
      return NextResponse.json({ error: 'Tag label must be at least 2 characters' }, { status: 400 });
    }
    if (trimmedLabel.length > 40) {
      return NextResponse.json({ error: 'Tag label cannot exceed 40 characters' }, { status: 400 });
    }

    if (!trimmedPhrase) {
      return NextResponse.json({ error: 'Review sentence is required' }, { status: 400 });
    }
    if (trimmedPhrase.length < 10) {
      return NextResponse.json({ error: 'Review sentence must be at least 10 characters' }, { status: 400 });
    }
    if (trimmedPhrase.length > 300) {
      return NextResponse.json({ error: 'Review sentence cannot exceed 300 characters' }, { status: 400 });
    }

    if (trimmedCategory.length < 2) {
      return NextResponse.json({ error: 'Category must be at least 2 characters' }, { status: 400 });
    }
    if (trimmedCategory.length > 30) {
      return NextResponse.json({ error: 'Category cannot exceed 30 characters' }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: session.role === 'SUPER_ADMIN' && businessId
        ? { id: businessId }
        : businessId
        ? { id: businessId, ownerId: session.userId }
        : { ownerId: session.userId },
      select: { id: true, category: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check duplicate label within this business
    const existingChip = await prisma.smartChip.findFirst({
      where: {
        businessId: business.id,
        label: { equals: trimmedLabel, mode: 'insensitive' },
      },
    });

    if (existingChip) {
      return NextResponse.json(
        { error: 'A review highlight with this label already exists for this business' },
        { status: 400 }
      );
    }

    // Backend validation check: reject prohibited medical claim keywords for CLINIC / HEALTHCARE
    if (isMedicalCategory(business.category)) {
      const validation = validateMedicalChipContent(label, phrase, category);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: `Medical compliance violation: Review chips for healthcare and clinic businesses cannot contain prohibited medical claim keywords ("${validation.prohibitedWord}"). Please use operational and patient-care feedback instead (e.g., cleanliness, wait time, staff courtesy, doctor communication).`,
          },
          { status: 400 }
        );
      }
    }

    const maxSort = await prisma.smartChip.aggregate({
      where: { businessId: business.id },
      _max: { sortOrder: true },
    });

    const newChip = await prisma.smartChip.create({
      data: {
        businessId: business.id,
        label: trimmedLabel,
        category: trimmedCategory,
        phrase: trimmedPhrase,
        icon: icon || 'Sparkles',
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({ success: true, chip: newChip });
  } catch (error) {
    console.error('Create smart chip error:', error);
    return NextResponse.json({ error: 'Failed to create smart chip' }, { status: 500 });
  }
}

// PUT /api/dashboard/chips - Reset chips to category defaults
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const business = await prisma.business.findFirst({
      where: session.role === 'SUPER_ADMIN' && body.businessId
        ? { id: body.businessId }
        : body.businessId
        ? { id: body.businessId, ownerId: session.userId }
        : { ownerId: session.userId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const targetCategory = normalizeCategory(body.category || business.category || 'restaurant');
    const defaultChips = getDefaultChipsForCategory(targetCategory);

    // If category was specified and differs from current business category, sync it
    if (body.category && business.category !== targetCategory) {
      await prisma.business.update({
        where: { id: business.id },
        data: { category: targetCategory },
      });
    }

    // Delete existing chips and create category defaults
    await prisma.smartChip.deleteMany({
      where: { businessId: business.id },
    });

    await prisma.smartChip.createMany({
      data: defaultChips.map((chip, idx) => ({
        businessId: business.id,
        label: chip.label,
        category: chip.category,
        phrase: chip.phrase,
        icon: chip.icon,
        sortOrder: idx + 1,
      })),
    });

    const updatedChips = await prisma.smartChip.findMany({
      where: { businessId: business.id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: `Reset chips to ${targetCategory} defaults successfully`,
      chips: updatedChips,
    });
  } catch (error) {
    console.error('Reset smart chips error:', error);
    return NextResponse.json({ error: 'Failed to reset smart chips' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const chipId = searchParams.get('id');

    if (!chipId) {
      return NextResponse.json({ error: 'Chip ID is required' }, { status: 400 });
    }

    // Ensure the chip belongs to the user's business
    const chip = await prisma.smartChip.findUnique({
      where: { id: chipId },
      include: { business: true },
    });

    if (!chip || (session.role !== 'SUPER_ADMIN' && chip.business.ownerId !== session.userId)) {
      return NextResponse.json({ error: 'Chip not found or access denied' }, { status: 403 });
    }

    await prisma.smartChip.delete({
      where: { id: chipId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete smart chip error:', error);
    return NextResponse.json({ error: 'Failed to delete smart chip' }, { status: 500 });
  }
}
