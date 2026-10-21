import { GoogleGenAI } from '@google/genai';

/**
 * Words and phrases strictly forbidden by Google Maps anti-spam / "Fake Engagement" filters.
 * Real customers texting reviews on their phone do not use floral adjectives or marketing jargon.
 */
export const FORBIDDEN_WORDS = [
  'delight',
  'haven',
  'impeccable',
  'tapestry',
  'culinary journey',
  'exemplary',
  'patron',
  'patrons',
  'plethora',
  'symphony',
  'testament',
  'nestled',
  'game changer',
  'game-changer',
  'delve',
  'look no further',
  'hidden gem',
  'exceeded all expectations',
  'oasis',
  'beacon',
  'epitome',
  'culinary delight',
  'masterpiece',
  'pinnacle',
  'in conclusion',
  'needless to say',
] as const;

/**
 * 3 distinct persona styles chosen at random so reviews don't follow an identical syntax structure.
 */
export type PersonaId = 'direct_punchy' | 'enthusiastic_regular' | 'specific_shoutout';

export interface ReviewPersona {
  id: PersonaId;
  name: string;
  styleDescription: string;
  promptInstruction: string;
}

export const REVIEW_PERSONAS: ReviewPersona[] = [
  {
    id: 'direct_punchy',
    name: 'Direct & Punchy',
    styleDescription: 'Short, to the point, minimal words, zero fluff. Starts directly with what was good.',
    promptInstruction:
      'Write in a direct and punchy style. Very short, to the point, with zero fluff or introductory filler. Use short sentence fragments or straightforward subject-verb statements (e.g., "Quick service and friendly staff. Everything was clean.")',
  },
  {
    id: 'enthusiastic_regular',
    name: 'Enthusiastic Regular',
    styleDescription: 'Warm, relaxed repeat customer who drops by often, texting a recommendation to a friend.',
    promptInstruction:
      'Write like an enthusiastic regular who visits often. Warm, relaxed, conversational vibe, like texting a friend a casual recommendation (e.g., "Always have a great experience coming here. The staff never disappoints.")',
  },
  {
    id: 'specific_shoutout',
    name: 'Specific Item / Experience Shoutout',
    styleDescription: 'Mentions a concrete moment, specific item, or immediate action from this visit.',
    promptInstruction:
      'Write with a specific shoutout to a concrete detail, item, or moment from this visit (e.g., "Popped in this afternoon and was in and out in minutes. Really clean spot and great service.")',
  },
];

/**
 * Returns one of the 3 persona styles chosen at random.
 */
export function getRandomPersona(): ReviewPersona {
  const index = Math.floor(Math.random() * REVIEW_PERSONAS.length);
  return REVIEW_PERSONAS[index];
}

/**
 * System instruction provided to Gemini via config.systemInstruction
 */
export const GEMINI_SYSTEM_INSTRUCTION = `You are a real, casual customer texting a quick Google Maps review from your phone right after visiting a local business.

CRITICAL RULES:
1. LENGTH: Maximum 1 to 2 short sentences. Absolutely never exceed 2 sentences.
2. TONE: Conversational, casual, natural, and slightly imperfect—sound like a normal person casually texting on a mobile phone keyboard.
3. NEGATIVE CONSTRAINTS (Google Anti-Spam / Fake Engagement Prevention):
   - STRICTLY FORBIDDEN WORDS: Never use "delight", "haven", "impeccable", "tapestry", "culinary journey", "exemplary", "patron", "plethora", "symphony", "testament", "nestled", "game changer", "delve", "look no further", "hidden gem", or "exceeded all expectations".
   - Strictly forbid marketing clichés, floral adjectives, and corporate buzzwords.
   - Do NOT sound like an advertisement, PR copy, or an AI assistant.
4. SYNTAX & PERSONA:
   - Match the requested customer persona style so sentence structure is varied.
5. FORMATTING & CLIPBOARD READINESS:
   - Return ONLY the exact review text.
   - Do NOT wrap in quotation marks.
   - Do NOT include conversational preamble (e.g., "Here is your review:"), markdown bold/italics, code fences, or concluding notes.`;

/**
 * Generation configuration to maximize phrasing variance across users selecting the same chips:
 * temperature: 0.90, topP: 0.95
 */
export const GEMINI_GENERATION_CONFIG = {
  temperature: 0.90,
  topP: 0.95,
  maxOutputTokens: 150,
};

/**
 * Strips quotes, markdown code fences, preambles, and formatting wrappers
 * so the review text is clean and immediately ready for clipboard copy.
 */
export function sanitizeReviewText(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();

  // Remove common AI preambles
  cleaned = cleaned.replace(
    /^(?:here(?:'s| is) (?:a |the |your )?(?:short |casual |polished |quick )?(?:review|draft):?|review:?|draft:?)\s*/i,
    ''
  ).trim();

  // Strip wrapping quotes (single, double, smart quotes, backticks, brackets)
  cleaned = cleaned.replace(/^["'“”«»`]+|["'“”«»`]+$/g, '').trim();

  // Remove trailing explanatory notes in parentheses (e.g. "(1 sentence)")
  cleaned = cleaned.replace(/\s*\((?:1|2)\s*sentences?\)\s*$/i, '').trim();

  // Re-strip any inner quotes that might have been revealed
  cleaned = cleaned.replace(/^["'“”«»`]+|["'“”«»`]+$/g, '').trim();

  // Collapse excess whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned;
}

export interface ReviewPromptParams {
  businessName: string;
  businessCategory: string;
  rating?: number;
  selectedChips?: string[];
  selectedPhrases?: string[];
  ownerNote?: string;
  persona: ReviewPersona;
}

/**
 * Builds the user prompt for fresh review generation.
 */
export function buildReviewPrompt({
  businessName,
  businessCategory,
  rating = 5,
  selectedChips = [],
  selectedPhrases = [],
  ownerNote = '',
  persona,
}: ReviewPromptParams): string {
  const highlights = selectedPhrases.length > 0
    ? selectedPhrases.join('. ')
    : selectedChips.join(', ');

  const noteSnippet = ownerNote.trim()
    ? `\nSpecial note from business: ${ownerNote.trim()}`
    : '';

  return `Write a ${rating}-star Google review for "${businessName}" (${businessCategory}).

Customer highlights:
${highlights || 'Great service, friendly staff, clean place.'}${noteSnippet}

${persona.promptInstruction}

Strict constraints:
- Maximum 1 to 2 short sentences.
- Casual customer texting on mobile phone.
- No quotes, no marketing buzzwords, and no forbidden floral words ("haven", "delight", "impeccable", "tapestry", "exemplary", etc.).
- Return ONLY the raw review text ready for clipboard copy.`;
}

export interface PolishPromptParams {
  currentText: string;
  businessName: string;
  businessCategory: string;
  persona: ReviewPersona;
}

/**
 * Builds the prompt for polishing an existing review draft.
 */
export function buildPolishPrompt({
  currentText,
  businessName,
  businessCategory,
  persona,
}: PolishPromptParams): string {
  return `Rewrite and polish this draft Google review for "${businessName}" (${businessCategory}) to sound like a genuine customer casually texting on their phone:

Draft:
"${currentText}"

${persona.promptInstruction}

Strict constraints:
- Maximum 1 to 2 short sentences.
- Casual, conversational, natural, and slightly imperfect tone.
- Strictly NO floral adjectives or marketing clichés (no "haven", "delight", "impeccable", "tapestry", "culinary journey", "exemplary", "patron").
- Return ONLY the clean rewritten text with no quotes, preamble, or markdown.`;
}

/**
 * Fallback review generator adhering to 1-2 short sentences, natural customer tone,
 * and zero spam filter triggers.
 */
export function generateFallbackReview({
  businessName,
  selectedPhrases = [],
  selectedChips = [],
  persona,
}: {
  businessName: string;
  selectedPhrases?: string[];
  selectedChips?: string[];
  persona: ReviewPersona;
}): string {
  const hasDetails = selectedPhrases.length > 0 || selectedChips.length > 0;

  const templates: Record<PersonaId, string[]> = {
    direct_punchy: [
      `Quick service and super friendly staff at ${businessName}. Everything was clean and well kept.`,
      `Really good experience at ${businessName}. Fast service and great vibe.`,
      `Staff was great and everything was taken care of quickly. Definitely recommend ${businessName}.`,
      `Super easy visit to ${businessName}. Great service and fair prices.`,
    ],
    enthusiastic_regular: [
      `Always love stopping by ${businessName}. The team is super friendly and never disappoints.`,
      `One of my favorite spots around here. Consistently great service and friendly folks.`,
      `Always a solid experience at ${businessName}. Great team and dependable quality every time.`,
      `Love coming to ${businessName} whenever I'm in the area. Great service and always welcoming.`,
    ],
    specific_shoutout: [
      `Popped into ${businessName} earlier today and was in and out in minutes. Really helpful staff.`,
      `Stopped by ${businessName} for a quick visit today and had a great experience. Super friendly team.`,
      `First time checking out ${businessName} today and was really impressed with how fast and easy it was.`,
      `Dropped in earlier today and loved the vibe at ${businessName}. Staff took great care of us.`,
    ],
  };

  const personaTemplates = templates[persona.id] || templates.direct_punchy;
  const picked = personaTemplates[Math.floor(Math.random() * personaTemplates.length)];

  if (!hasDetails) {
    return picked;
  }

  const rawHighlight = selectedPhrases[0] || selectedChips[0] || '';
  const cleanHighlight = rawHighlight
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/[.!?]+$/, '')
    .toLowerCase()
    .trim();

  if (cleanHighlight) {
    if (persona.id === 'direct_punchy') {
      return `Loved the ${cleanHighlight} at ${businessName}. Super fast service and friendly staff.`;
    }
    if (persona.id === 'enthusiastic_regular') {
      return `Always a great visit to ${businessName}, especially the ${cleanHighlight}. Team never misses.`;
    }
    if (persona.id === 'specific_shoutout') {
      return `Stopped by ${businessName} today and the ${cleanHighlight} was great. Really friendly team.`;
    }
  }

  return picked;
}

export interface GenerateReviewOptions {
  apiKey?: string;
  businessName: string;
  businessCategory: string;
  rating?: number;
  selectedChips?: string[];
  selectedPhrases?: string[];
  currentText?: string;
  ownerNote?: string;
  action?: 'generate' | 'polish';
}

export interface GenerateReviewResult {
  reviewText: string;
  isRealAI: boolean;
  model: string;
  persona: ReviewPersona;
  notice?: string;
}

/**
 * Main review generator using Gemini with anti-spam instructions and 0.90/0.95 generation config.
 */
export async function generateReviewWithGemini(
  options: GenerateReviewOptions
): Promise<GenerateReviewResult> {
  const {
    apiKey: rawKey,
    businessName,
    businessCategory,
    rating = 5,
    selectedChips = [],
    selectedPhrases = [],
    currentText = '',
    ownerNote = '',
    action = 'generate',
  } = options;

  const persona = getRandomPersona();
  const rawApiKey = (rawKey || process.env.GEMINI_API_KEY || '').trim();
  const apiKey = rawApiKey.replace(/^["']|["']$/g, '').trim();

  let lastErrorMsg = '';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt =
        action === 'polish' && currentText.trim()
          ? buildPolishPrompt({
              currentText,
              businessName,
              businessCategory,
              persona,
            })
          : buildReviewPrompt({
              businessName,
              businessCategory,
              rating,
              selectedChips,
              selectedPhrases,
              ownerNote,
              persona,
            });

      const candidateModels = [
        process.env.GEMINI_MODEL?.trim(),
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
      ].filter(Boolean) as string[];

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
              temperature: GEMINI_GENERATION_CONFIG.temperature,
              topP: GEMINI_GENERATION_CONFIG.topP,
              maxOutputTokens: GEMINI_GENERATION_CONFIG.maxOutputTokens,
            },
          });

          const rawText = response.text?.trim();
          if (rawText) {
            const cleanedReview = sanitizeReviewText(rawText);
            if (cleanedReview) {
              const displayModel = model
                .replace('gemini-', 'Gemini ')
                .replace('-flash-lite', ' Flash Lite')
                .replace('-flash', ' Flash');

              return {
                reviewText: cleanedReview,
                isRealAI: true,
                model: displayModel,
                persona,
              };
            }
          }
        } catch (modelErr: unknown) {
          lastErrorMsg = modelErr instanceof Error ? modelErr.message : String(modelErr);
          console.error(`Gemini model ${model} failed:`, modelErr);
        }
      }
    } catch (err: unknown) {
      lastErrorMsg = err instanceof Error ? err.message : String(err);
      console.error('Gemini API invocation error, using fallback:', err);
    }
  }

  // Fallback if no key or all calls fail
  const fallbackText = generateFallbackReview({
    businessName,
    selectedChips,
    selectedPhrases,
    persona,
  });

  return {
    reviewText: sanitizeReviewText(fallbackText),
    isRealAI: false,
    model: 'Smart Template (Set GEMINI_API_KEY for live AI)',
    persona,
    notice: !apiKey
      ? 'Gemini API key not configured. Add GEMINI_API_KEY in .env to activate live Gemini AI.'
      : `Gemini request could not be completed${lastErrorMsg ? ` (${lastErrorMsg.slice(0, 80)})` : ''}, generated via smart fallback.`,
  };
}
