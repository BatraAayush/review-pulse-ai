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

    const { label, category, phrase, icon, businessId } = await req.json();

    if (!label || !phrase) {
      return NextResponse.json({ error: 'Label and phrase are required' }, { status: 400 });
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
        label: label.trim(),
        category: category?.trim() || 'General',
        phrase: phrase.trim(),
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
