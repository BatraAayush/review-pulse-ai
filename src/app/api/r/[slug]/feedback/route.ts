import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { rating, feedbackText, customerName, customerContact, scanId } = await req.json();

    if (!rating || !feedbackText) {
      return NextResponse.json(
        { error: 'Rating and feedback message are required' },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Save private feedback
    const feedback = await prisma.privateFeedback.create({
      data: {
        businessId: business.id,
        rating: Number(rating),
        feedbackText: String(feedbackText).trim(),
        customerName: customerName ? String(customerName).trim() : null,
        customerContact: customerContact ? String(customerContact).trim() : null,
        status: 'unread',
      },
    });

    // Update scan event if scanId was provided
    if (scanId) {
      await prisma.scanEvent.updateMany({
        where: { id: scanId },
        data: {
          actionTaken: 'private_feedback',
          ratingSelected: Number(rating),
          reviewLength: feedbackText.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      message: 'Feedback received privately and forwarded to the management team.',
    });
  } catch (error) {
    console.error('Private feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
