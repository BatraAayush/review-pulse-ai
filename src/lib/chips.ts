export interface DefaultChipTemplate {
  label: string;
  category: string;
  phrase: string;
  icon: string;
}

export const CATEGORY_DEFAULT_CHIPS: Record<string, DefaultChipTemplate[]> = {
  restaurant: [
    { label: '🍕 Delicious Food', category: 'Taste', phrase: 'Food was fresh, tasty, and full of flavor.', icon: 'Utensils' },
    { label: '🍷 Warm Hospitality', category: 'Service', phrase: 'Staff was friendly, welcoming, and attentive.', icon: 'HeartHandshake' },
    { label: '✨ Great Atmosphere', category: 'Vibe', phrase: 'Great vibe, comfortable seating, and nice music.', icon: 'Sparkles' },
    { label: '⚡ Fast Service', category: 'Pacing', phrase: 'Food came out quickly and hot.', icon: 'Zap' },
    { label: '🍰 Tasty Desserts', category: 'Dessert', phrase: 'Homemade desserts were fresh, light, and delicious.', icon: 'Coffee' },
    { label: '🌿 Great Menu Variety', category: 'Selection', phrase: 'Lots of good options on the menu for everyone.', icon: 'Smile' },
  ],
  fitness: [
    { label: '🏋️ Top Equipment', category: 'Facilities', phrase: 'Plenty of free weights, clean machines, and good gear.', icon: 'Zap' },
    { label: '🥊 Helpful Coaches', category: 'Coaching', phrase: 'Instructors and trainers are encouraging and knowledgeable.', icon: 'Sparkles' },
    { label: '🧼 Spotless & Clean', category: 'Hygiene', phrase: 'Clean workout areas, sanitized equipment, and fresh locker rooms.', icon: 'Smile' },
    { label: '🔥 Great Classes', category: 'Workouts', phrase: 'The group workout classes have great energy and music.', icon: 'Zap' },
    { label: '🤝 Friendly Community', category: 'Vibe', phrase: 'Supportive environment where everyone feels comfortable working out.', icon: 'HeartHandshake' },
    { label: '⏱️ Easy Access', category: 'Convenience', phrase: 'Convenient hours, easy check-in, and good layout.', icon: 'CheckCircle2' },
  ],
  clinic: [
    { label: 'Clean and hygienic facility', category: 'Facility', phrase: 'The facility was very clean, organized, and hygienic.', icon: 'ShieldCheck' },
    { label: 'Minimal wait time', category: 'Punctuality', phrase: 'Minimal wait time before being seen for my appointment.', icon: 'CheckCircle2' },
    { label: 'Polite and helpful reception staff', category: 'Staff', phrase: 'The reception and front desk staff were polite, friendly, and helpful.', icon: 'HeartHandshake' },
    { label: 'Doctor explained procedure clearly', category: 'Communication', phrase: 'The doctor explained the procedure clearly and answered all questions.', icon: 'Sparkles' },
    { label: 'Gentle and patient doctor', category: 'Patient Care', phrase: 'The doctor was very gentle, patient, and made me feel comfortable.', icon: 'Smile' },
    { label: 'Easy appointment scheduling', category: 'Scheduling', phrase: 'Easy and hassle-free appointment scheduling.', icon: 'CheckCircle2' },
  ],
  salon: [
    { label: '💇 Great Haircut & Style', category: 'Craft', phrase: 'Listened carefully and gave me the exact cut and style I wanted.', icon: 'Sparkles' },
    { label: '💆 Relaxing Vibe', category: 'Ambience', phrase: 'Relaxing atmosphere and great hair wash service.', icon: 'HeartHandshake' },
    { label: '🌟 Friendly Stylists', category: 'Service', phrase: 'Super polite, skilled, and attentive stylists.', icon: 'Smile' },
    { label: '🎨 Great Color Work', category: 'Color', phrase: 'Hair color blending was clean and natural.', icon: 'Sparkles' },
    { label: '☕ Nice Space', category: 'Amenities', phrase: 'Bright, modern salon with good refreshments and relaxed music.', icon: 'Coffee' },
  ],
  automotive: [
    { label: '🔧 Honest Mechanics', category: 'Trust', phrase: 'Honest diagnostic check with zero pushy upselling.', icon: 'ShieldCheck' },
    { label: '🏎️ Fast Turnaround', category: 'Speed', phrase: 'Diagnosed and fixed the car quickly as promised.', icon: 'Zap' },
    { label: '📊 Fair Pricing', category: 'Cost', phrase: 'Clear, reasonable estimate before starting any work.', icon: 'CheckCircle2' },
    { label: '🏆 Skilled Repair', category: 'Skill', phrase: 'Quickly solved an issue other shops missed. Very knowledgeable.', icon: 'Sparkles' },
    { label: '🧼 Clean & Professional', category: 'Service', phrase: 'Clean waiting area, courteous staff, car was returned in great shape.', icon: 'Smile' },
  ],
  retail: [
    { label: '🛍️ Great Selection', category: 'Variety', phrase: 'Good variety of stock and well-organized shelves.', icon: 'Sparkles' },
    { label: '🤝 Helpful Staff', category: 'Service', phrase: 'Friendly team who helped me find what I needed without pressure.', icon: 'HeartHandshake' },
    { label: '⚡ Quick Checkout', category: 'Speed', phrase: 'Fast checkout process with practically no line.', icon: 'Zap' },
    { label: '💎 High Quality', category: 'Quality', phrase: 'Really solid quality on the items I purchased.', icon: 'Smile' },
    { label: '🏷️ Good Value', category: 'Value', phrase: 'Fair prices and good deals across the store.', icon: 'CheckCircle2' },
  ],
};

// Category aliases
CATEGORY_DEFAULT_CHIPS.gym = CATEGORY_DEFAULT_CHIPS.fitness;
CATEGORY_DEFAULT_CHIPS.food = CATEGORY_DEFAULT_CHIPS.restaurant;
CATEGORY_DEFAULT_CHIPS.auto = CATEGORY_DEFAULT_CHIPS.automotive;
CATEGORY_DEFAULT_CHIPS.dental = CATEGORY_DEFAULT_CHIPS.clinic;
CATEGORY_DEFAULT_CHIPS.healthcare = CATEGORY_DEFAULT_CHIPS.clinic;
CATEGORY_DEFAULT_CHIPS.spa = CATEGORY_DEFAULT_CHIPS.salon;

export function normalizeCategory(category: string): 'restaurant' | 'fitness' | 'clinic' | 'salon' | 'automotive' | 'retail' {
  const normalized = (category || '').toLowerCase().trim();
  if (normalized === 'fitness' || normalized.includes('gym') || normalized.includes('fit') || normalized.includes('workout')) {
    return 'fitness';
  }
  if (
    normalized === 'clinic' ||
    normalized === 'dental' ||
    normalized === 'healthcare' ||
    normalized.includes('dental') ||
    normalized.includes('med') ||
    normalized.includes('health') ||
    normalized.includes('doctor') ||
    normalized.includes('clinic')
  ) {
    return 'clinic';
  }
  if (normalized === 'salon' || normalized.includes('hair') || normalized.includes('spa') || normalized.includes('barber')) {
    return 'salon';
  }
  if (normalized === 'automotive' || normalized.includes('car') || normalized.includes('mechanic') || normalized.includes('repair') || normalized.includes('auto')) {
    return 'automotive';
  }
  if (normalized === 'retail' || normalized.includes('store') || normalized.includes('shop') || normalized.includes('boutique')) {
    return 'retail';
  }
  return 'restaurant';
}

export function getDefaultChipsForCategory(category: string): DefaultChipTemplate[] {
  const canonical = normalizeCategory(category);
  return CATEGORY_DEFAULT_CHIPS[canonical] || CATEGORY_DEFAULT_CHIPS.restaurant;
}

/**
 * Medical ethics & compliance: Prohibited medical claim keywords.
 * Healthcare, Clinic, and Dental review chips must not mention cures,
 * medical diagnoses, medical outcomes, guarantees, or superlative doctor claims.
 */
export const PROHIBITED_MEDICAL_KEYWORDS = [
  'cure',
  'guarantee',
  'diagnose',
  'miracle',
  'prescribe',
] as const;

export function isMedicalCategory(category: string | undefined | null): boolean {
  if (!category) return false;
  const normalized = category.toLowerCase().trim();
  return (
    normalized === 'clinic' ||
    normalized === 'dental' ||
    normalized === 'healthcare' ||
    normalized.includes('dental') ||
    normalized.includes('clinic') ||
    normalized.includes('health') ||
    normalized.includes('med') ||
    normalized.includes('doctor')
  );
}

export function validateMedicalChipContent(...texts: (string | undefined | null)[]): {
  valid: boolean;
  prohibitedWord?: string;
} {
  const combined = texts.filter(Boolean).join(' ').toLowerCase();

  for (const keyword of PROHIBITED_MEDICAL_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}`, 'i');
    if (regex.test(combined) || combined.includes(keyword)) {
      return { valid: false, prohibitedWord: keyword };
    }
  }

  // Also catch direct related medical claim inflections like diagnosis, prescription
  if (/\bdiagnos/i.test(combined)) {
    return { valid: false, prohibitedWord: 'diagnose' };
  }
  if (/\bprescri/i.test(combined)) {
    return { valid: false, prohibitedWord: 'prescribe' };
  }

  return { valid: true };
}

