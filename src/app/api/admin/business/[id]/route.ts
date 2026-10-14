import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin privileges required' }, { status: 403 });
    }

    const { id } = await params;
    const { status, activePlan } = await req.json();

    const updated = await prisma.business.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(activePlan && { activePlan }),
      },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    console.error('Update business status error:', error);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}
