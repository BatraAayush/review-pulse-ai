const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORY_DEFAULT_CHIPS = {
  restaurant: [
    { label: '🍕 Delicious Food', category: 'Taste', phrase: 'The food was exceptionally delicious, fresh, and full of flavor!', icon: 'Utensils' },
    { label: '🍷 Warm Hospitality', category: 'Service', phrase: 'Staff was courteous, welcoming, and made us feel right at home.', icon: 'HeartHandshake' },
    { label: '✨ Great Atmosphere', category: 'Vibe', phrase: 'Wonderful ambiance, comfortable seating, and great energy.', icon: 'Sparkles' },
    { label: '⚡ Fast Service', category: 'Pacing', phrase: 'Our food was served quickly and piping hot.', icon: 'Zap' },
    { label: '🍰 Heavenly Desserts', category: 'Dessert', phrase: 'The homemade desserts were light, fluffy, and absolute perfection!', icon: 'Coffee' },
    { label: '🌿 Great Menu Variety', category: 'Selection', phrase: 'Fantastic variety on the menu with great options for everyone.', icon: 'Smile' },
  ],
  fitness: [
    { label: '🏋️ Top-Tier Equipment', category: 'Facilities', phrase: 'State-of-the-art gym equipment, plenty of free weights, and well-maintained machines!', icon: 'Zap' },
    { label: '🥊 Inspiring Trainers', category: 'Coaching', phrase: 'The personal trainers and instructors are motivating, knowledgeable, and push you to excel.', icon: 'Sparkles' },
    { label: '🧼 Spotless & Clean', category: 'Hygiene', phrase: 'Super clean workout floors, sanitized equipment, and pristine locker rooms.', icon: 'Smile' },
    { label: '🔥 High-Energy Classes', category: 'Workouts', phrase: 'The group workout classes have unbelievable music, energy, and intensity.', icon: 'Zap' },
    { label: '🤝 Welcoming Community', category: 'Vibe', phrase: 'Friendly and supportive environment where everyone feels encouraged, from beginner to pro.', icon: 'HeartHandshake' },
    { label: '⏱️ Easy 24/7 Access', category: 'Convenience', phrase: 'Love the flexible hours, hassle-free entry, and spacious layout.', icon: 'CheckCircle2' },
  ],
  clinic: [
    { label: '🩺 Painless Care', category: 'Comfort', phrase: 'Gentle, painless experience and very comforting staff who put me at ease.', icon: 'Smile' },
    { label: '⏱️ Zero Waiting Time', category: 'Punctuality', phrase: 'Taken in right on time with zero waiting room delay.', icon: 'CheckCircle2' },
    { label: '💎 High-Tech Equipment', category: 'Facilities', phrase: 'Modern, spotlessly clean facility with state-of-the-art equipment.', icon: 'Zap' },
    { label: '👩‍⚕️ Compassionate Team', category: 'Staff', phrase: 'The doctors and assistants explained every step thoroughly and genuinely cared.', icon: 'HeartHandshake' },
    { label: '🛡️ Transparent Pricing', category: 'Billing', phrase: 'Clear explanation of treatment and costs with no unexpected surprises.', icon: 'ShieldCheck' },
  ],
  salon: [
    { label: '💇 Expert Styling', category: 'Craft', phrase: 'Listened carefully and gave me the exact cut and style I dreamed of.', icon: 'Sparkles' },
    { label: '💆 Relaxing Experience', category: 'Ambience', phrase: 'Relaxing atmosphere and excellent scalp massage during washing.', icon: 'HeartHandshake' },
    { label: '🌟 Professional Staff', category: 'Service', phrase: 'Extremely polite, talented, and attentive stylists.', icon: 'Smile' },
    { label: '🎨 Flawless Color & Highlights', category: 'Color', phrase: 'The color blending and highlight technique was seamless and natural!', icon: 'Sparkles' },
    { label: '☕ Chic Vibe & Hospitality', category: 'Amenities', phrase: 'Beautiful modern salon with lovely refreshments and great music.', icon: 'Coffee' },
  ],
  automotive: [
    { label: '🔧 Honest Diagnostics', category: 'Trust', phrase: 'Completely honest inspection with zero unnecessary upsells.', icon: 'ShieldCheck' },
    { label: '🏎️ Fast Turnaround', category: 'Speed', phrase: 'Diagnosed and fixed on the very same day as promised.', icon: 'Zap' },
    { label: '📊 Transparent Pricing', category: 'Cost', phrase: 'Clear, detailed estimate provided before performing any repairs.', icon: 'CheckCircle2' },
    { label: '🏆 Master Mechanics', category: 'Skill', phrase: 'Fixed an issue that other mechanics couldn’t figure out. Highly skilled team!', icon: 'Sparkles' },
    { label: '🧼 Clean & Professional', category: 'Service', phrase: 'Clean waiting area, courteous staff, and my car was returned in great shape.', icon: 'Smile' },
  ],
  retail: [
    { label: '🛍️ Great Selection', category: 'Variety', phrase: 'Outstanding inventory, diverse options, and high-quality products.', icon: 'Sparkles' },
    { label: '🤝 Super Helpful Staff', category: 'Service', phrase: 'Friendly team who helped me find exactly what I needed without pressure.', icon: 'HeartHandshake' },
    { label: '⚡ Quick Checkout', category: 'Speed', phrase: 'Fast, seamless checkout with zero waiting in line.', icon: 'Zap' },
    { label: '💎 Premium Quality', category: 'Quality', phrase: 'The quality of the products exceeded all my expectations.', icon: 'Smile' },
    { label: '🏷️ Excellent Value', category: 'Value', phrase: 'Great prices and fantastic deals for top-notch items.', icon: 'CheckCircle2' },
  ],
};

function normalizeCategory(category) {
  const normalized = (category || '').toLowerCase().trim();
  if (normalized === 'fitness' || normalized.includes('gym') || normalized.includes('fit') || normalized.includes('workout')) {
    return 'fitness';
  }
  if (normalized === 'clinic' || normalized.includes('dental') || normalized.includes('med') || normalized.includes('health') || normalized.includes('doctor')) {
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

async function main() {
  const businesses = await prisma.business.findMany({
    include: { smartChips: true }
  });

  for (const b of businesses) {
    const cat = normalizeCategory(b.category);
    const hasFoodChips = b.smartChips.some(c => c.label.includes('Food') || c.label.includes('Pizza'));
    const isMismatched = cat !== 'restaurant' && hasFoodChips;

    if (isMismatched || b.smartChips.length === 0) {
      console.log(`Syncing chips for business "${b.name}" (${b.slug}) with category "${cat}"...`);
      const defaultChips = CATEGORY_DEFAULT_CHIPS[cat];

      await prisma.smartChip.deleteMany({
        where: { businessId: b.id }
      });

      await prisma.smartChip.createMany({
        data: defaultChips.map((chip, idx) => ({
          businessId: b.id,
          label: chip.label,
          category: chip.category,
          phrase: chip.phrase,
          icon: chip.icon,
          sortOrder: idx + 1,
        }))
      });
      console.log(`Updated ${b.name} to ${defaultChips.length} ${cat} chips.`);
    } else {
      console.log(`Business "${b.name}" (${b.category}) already has matching chips.`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
