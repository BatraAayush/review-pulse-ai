import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateReviewWithGemini } from '@/lib/gemini';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const {
      rating = 5,
      selectedChips = [],
      selectedPhrases = [],
      currentText = '',
      action = 'generate',
    } = body;

    // Fetch business details
    const business = await prisma.business.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        smartChips: true,
      },
    });

    const businessName = business?.name || 'this business';
    const businessCategory = business?.category || 'business';
    const ownerNote = business?.customPromptMessage?.trim() || '';

    const result = await generateReviewWithGemini({
      businessName,
      businessCategory,
      rating,
      selectedChips,
      selectedPhrases,
      currentText,
      ownerNote,
      action,
    });

    return NextResponse.json({
      success: true,
      reviewText: result.reviewText,
      isRealAI: result.isRealAI,
      model: result.model,
      persona: result.persona.name,
      notice: result.notice,
    });
  } catch (error) {
    console.error('Error generating review:', error);
    return NextResponse.json(
      { error: 'Failed to generate review' },
      { status: 500 }
    );
  }
}

