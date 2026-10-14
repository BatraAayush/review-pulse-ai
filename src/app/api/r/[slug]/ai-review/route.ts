import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

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

    // Check if Gemini API key is configured
    const rawKey = process.env.GEMINI_API_KEY?.trim() || '';
    const apiKey = rawKey.replace(/^["']|["']$/g, '').trim();
    let lastErrorMsg = '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        let prompt: string;
        if (action === 'polish' && currentText.trim()) {
          prompt = `You are a real customer improving your draft Google Review for a local ${businessCategory} named "${businessName}".
Current draft:
"${currentText}"

Rewrite and polish this review to sound genuine, human, and authentic.
Rules:
- Keep the tone natural, warm, and conversational (like a real person on Google Maps).
- Do NOT use generic AI clichés (such as "tapestry", "game changer", "plethora", "symphony of flavors", "testament", "nestled", "needless to say").
- Length: 2 to 3 sentences (40 to 65 words).
- Return ONLY the review text. Do not wrap in quotes or markdown.`;
        } else {
          const highlights = selectedPhrases.length > 0 
            ? selectedPhrases.join('. ')
            : selectedChips.join(', ');

          const perspectives = [
            'visiting for the first time',
            'stopping by for a quick visit',
            'a local who loves this neighborhood spot',
            'visiting with friends or family',
            'someone who was pleasantly surprised by how good everything was',
            'a returning customer who appreciates the consistent quality',
          ];
          const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
          const ownerNote = business?.customPromptMessage?.trim() 
            ? `\nSpecial highlight from owner: ${business.customPromptMessage}` 
            : '';

          prompt = `You are an authentic, happy customer writing a ${rating}-star Google Review for a local ${businessCategory} named "${businessName}".
Customer perspective: You are ${randomPerspective}.${ownerNote}

Key highlights to mention:
${highlights || 'Great service, friendly staff, and fantastic overall experience.'}

Rules:
- Write in a natural, conversational first-person voice as if posting directly on Google Maps from your phone.
- Sound like a real person, not an advertisement or AI.
- Do NOT use robotic AI words (avoid "delve", "tapestry", "plethora", "testament", "symphony", "game changer", "gem", "nestled", "culinary journey").
- Keep it concise: 2 to 3 sentences (about 40 to 65 words).
- Make this review fresh, distinct, and uniquely phrased.
- Return ONLY the review text. Do not wrap in quotes or add commentary.`;
        }

        const candidateModels = [
          process.env.GEMINI_MODEL?.trim(),
          'gemini-3.5-flash-lite',
          'gemini-3.8-flash',
        ].filter(Boolean) as string[];

        let rawReview: string | undefined;
        let selectedModelName = 'Gemini AI';

        for (const model of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                temperature: action === 'polish' ? 0.7 : 0.85,
                maxOutputTokens: 800,
              },
            });
            rawReview = response.text?.trim();
            if (rawReview) {
              selectedModelName = model
                .replace('gemini-', 'Gemini ')
                .replace('-flash-lite', ' Flash Lite')
                .replace('-flash', ' Flash');
              break;
            }
          } catch (modelErr: any) {
            lastErrorMsg = modelErr?.message || String(modelErr);
            console.error(`Gemini model ${model} call failed:`, modelErr);
          }
        }

        if (rawReview) {
          // Clean up any stray quotes
          const cleanedReview = rawReview.replace(/^["']|["']$/g, '').trim();
          return NextResponse.json({
            success: true,
            reviewText: cleanedReview,
            isRealAI: true,
            model: selectedModelName,
          });
        }
      } catch (geminiError: any) {
        lastErrorMsg = geminiError?.message || String(geminiError);
        console.error('Gemini generation error, falling back to smart template:', geminiError);
        // Continue to fallback below
      }
    }

    // Graceful fallback if no GEMINI_API_KEY or if API call fails
    const intros = [
      `Cannot recommend ${businessName} enough!`,
      `Truly blown away by my visit to ${businessName}.`,
      `Such a standout experience at ${businessName}.`,
      `5 stars all the way for ${businessName}!`,
      `Had a fantastic time at ${businessName}.`,
    ];
    const closings = [
      'Will definitely be returning soon!',
      'So glad I found this place.',
      'Thank you for treating customers with such care!',
      '10/10 recommendation to everyone in the area.',
      'Can’t wait to come back!',
    ];

    const randomIntro = intros[Math.floor(Math.random() * intros.length)];
    const randomClosing = closings[Math.floor(Math.random() * closings.length)];

    const phrasesText = selectedPhrases.length > 0
      ? selectedPhrases.join('. ') + '.'
      : 'Everything exceeded my expectations from start to finish.';

    const fallbackReview = `${randomIntro} ${phrasesText} ${randomClosing}`;

    return NextResponse.json({
      success: true,
      reviewText: fallbackReview,
      isRealAI: false,
      model: 'Smart Template (Set GEMINI_API_KEY for live AI)',
      notice: !apiKey 
        ? 'Gemini API key not configured. Add GEMINI_API_KEY in .env to activate live Gemini AI.'
        : `Gemini request could not be completed${lastErrorMsg ? ` (${lastErrorMsg.slice(0, 80)})` : ''}, generated via smart fallback.`,
    });
  } catch (error) {
    console.error('Error generating review:', error);
    return NextResponse.json(
      { error: 'Failed to generate review' },
      { status: 500 }
    );
  }
}
