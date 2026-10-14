import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedbackId, status } = await req.json();

    if (!feedbackId || !status) {
      return NextResponse.json({ error: 'Feedback ID and status are required' }, { status: 400 });
    }

    const feedback = await prisma.privateFeedback.findUnique({
      where: { id: feedbackId },
      include: { business: true },
    });

    if (!feedback || (session.role !== 'SUPER_ADMIN' && feedback.business.ownerId !== session.userId)) {
      return NextResponse.json({ error: 'Feedback not found or access denied' }, { status: 403 });
    }

    const updated = await prisma.privateFeedback.update({
      where: { id: feedbackId },
      data: { status },
    });

    return NextResponse.json({ success: true, feedback: updated });
  } catch (error) {
    console.error('Update feedback error:', error);
    return NextResponse.json({ error: 'Failed to update feedback status' }, { status: 500 });
  }
}
