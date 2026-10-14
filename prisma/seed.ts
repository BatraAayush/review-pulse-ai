import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding production database...');

  // Clean existing data for clean slate
  await prisma.privateFeedback.deleteMany();
  await prisma.scanEvent.deleteMany();
  await prisma.smartChip.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  // Hashes for passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const ownerPasswordHash = await bcrypt.hash('Owner@123456', 10);
  const dentalPasswordHash = await bcrypt.hash('Dental@123456', 10);
  const salonPasswordHash = await bcrypt.hash('Luxe@123456', 10);

  // 1. Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@reviewpulse.ai',
      name: 'Alex Vance (Super Admin)',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Created Super Admin:', superAdmin.email);

  // 2. Create Restaurant Owner & Business
  const owner1 = await prisma.user.create({
    data: {
      email: 'owner@bellarestaurant.com',
      name: 'Marco Rossi',
      passwordHash: ownerPasswordHash,
      role: 'OWNER',
    },
  });

  const business1 = await prisma.business.create({
    data: {
      name: 'Bella Italia Trattoria',
      slug: 'bella-italia',
      category: 'restaurant',
      tagline: 'Authentic Wood-Fired Pizza & Handmade Pasta',
      address: '1 Cranbourn Street, Leicester Square, London WC2H 7AJ',
      phone: '+44 20 3002 7620',
      googlePlaceId: 'ChIJES2xk80EdkgRm49tmBgjTUw',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJES2xk80EdkgRm49tmBgjTUw',
      primaryColor: '#e11d48',
      activePlan: 'pro',
      status: 'active',
      ownerId: owner1.id,
      welcomeMessage: 'Thank you for dining with us! How was your meal?',
      customPromptMessage: 'Mention your server or favorite dish for extra appreciation!',
      smartChips: {
        create: [
          { label: '🍕 Best Truffle Pizza', category: 'Food Quality', phrase: 'The truffle pizza was out of this world! Crispy crust and bursting with authentic flavor.', icon: 'Utensils', sortOrder: 1 },
          { label: '🍷 Exceptional Service', category: 'Staff', phrase: 'Attentive, warm staff who made our anniversary feel truly special.', icon: 'HeartHandshake', sortOrder: 2 },
          { label: '🕯️ Cozy Romantic Vibe', category: 'Ambience', phrase: 'Beautiful intimate lighting, great jazz playlist, and cozy seating.', icon: 'Sparkles', sortOrder: 3 },
          { label: '⚡ Fast Seating', category: 'Speed', phrase: 'Seated immediately even on a busy Friday night. Impeccable pacing.', icon: 'Zap', sortOrder: 4 },
          { label: '🍰 Heavenly Tiramisu', category: 'Dessert', phrase: 'Do not skip the homemade tiramisu — light, fluffy, and perfection!', icon: 'Coffee', sortOrder: 5 },
          { label: '🌿 Great Vegan Options', category: 'Dietary', phrase: 'Loved the dedicated vegan truffle risotto and dairy-free options.', icon: 'Smile', sortOrder: 6 },
        ],
      },
    },
  });

  // Seed scans for Bella Italia
  const now = new Date();
  await prisma.scanEvent.createMany({
    data: [
      { businessId: business1.id, timestamp: new Date(now.getTime() - 1000 * 60 * 12), deviceType: 'ios', actionTaken: 'copied_to_google', ratingSelected: 5, selectedChips: JSON.stringify(['🍕 Best Truffle Pizza', '🍷 Exceptional Service']), reviewLength: 124 },
      { businessId: business1.id, timestamp: new Date(now.getTime() - 1000 * 60 * 45), deviceType: 'android', actionTaken: 'copied_to_google', ratingSelected: 5, selectedChips: JSON.stringify(['🕯️ Cozy Romantic Vibe']), reviewLength: 88 },
      { businessId: business1.id, timestamp: new Date(now.getTime() - 1000 * 60 * 120), deviceType: 'ios', actionTaken: 'private_feedback', ratingSelected: 2, selectedChips: JSON.stringify([]), reviewLength: 165 },
      { businessId: business1.id, timestamp: new Date(now.getTime() - 1000 * 60 * 300), deviceType: 'ios', actionTaken: 'copied_to_google', ratingSelected: 4, selectedChips: JSON.stringify(['⚡ Fast Seating']), reviewLength: 95 },
      { businessId: business1.id, timestamp: new Date(now.getTime() - 1000 * 60 * 600), deviceType: 'android', actionTaken: 'bounced', ratingSelected: null, selectedChips: null, reviewLength: 0 },
    ],
  });

  // Seed private feedback for Bella Italia
  await prisma.privateFeedback.createMany({
    data: [
      {
        businessId: business1.id,
        customerName: 'Marcus Miller',
        customerContact: 'marcus.m@example.com',
        rating: 2,
        feedbackText: 'Our table was right next to the kitchen door which slammed frequently. Food was good, but couldn’t hold a quiet conversation.',
        status: 'unread',
        createdAt: new Date(now.getTime() - 1000 * 60 * 120),
      },
      {
        businessId: business1.id,
        customerName: 'Elena Rostova',
        customerContact: '+1 555-019-2834',
        rating: 3,
        feedbackText: 'Waited 25 minutes for the bill after dessert. Waiter was very polite though.',
        status: 'resolved',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      },
    ],
  });

  // 3. Create Dental Clinic Owner & Business
  const owner2 = await prisma.user.create({
    data: {
      email: 'contact@apexdental.com',
      name: 'Dr. Sarah Jenkins',
      passwordHash: dentalPasswordHash,
      role: 'OWNER',
    },
  });

  const business2 = await prisma.business.create({
    data: {
      name: 'Apex Modern Dentistry',
      slug: 'apex-dentistry',
      category: 'clinic',
      tagline: 'Gentle, Technology-Driven Family Dental Care',
      address: 'Plot-2, 1st & 2nd Floor, Manish Twin Plaza, Sector 4, Dwarka',
      phone: '+91 98184 66335',
      googlePlaceId: 'ChIJHw9jB2L7DDkR1qoMaPPxWrc',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJHw9jB2L7DDkR1qoMaPPxWrc',
      primaryColor: '#0ea5e9',
      activePlan: 'enterprise',
      status: 'active',
      ownerId: owner2.id,
      welcomeMessage: 'Thank you for visiting Apex Dentistry. We appreciate your honest feedback!',
      customPromptMessage: 'Mention whether your procedure felt comfortable and painless!',
      smartChips: {
        create: [
          { label: '✨ 100% Painless Cleaning', category: 'Comfort', phrase: 'Completely painless dental hygiene visit! Dr. Jenkins has the gentlest touch.', icon: 'Smile', sortOrder: 1 },
          { label: '🖥️ High-Tech 3D Scans', category: 'Technology', phrase: 'State-of-the-art office with instant 3D digital imaging. No messy molds!', icon: 'Zap', sortOrder: 2 },
          { label: '⏱️ Zero Waiting Time', category: 'Punctuality', phrase: 'Taken in right at my appointment time with zero waiting room delay.', icon: 'CheckCircle2', sortOrder: 3 },
          { label: '🛡️ Transparent Pricing', category: 'Billing', phrase: 'Clear explanation of insurance coverage with no unexpected fees.', icon: 'ShieldCheck', sortOrder: 4 },
        ],
      },
    },
  });

  // 4. Create Salon Owner & Business
  const owner3 = await prisma.user.create({
    data: {
      email: 'hello@luxesalon.com',
      name: 'Chloe Dupont',
      passwordHash: salonPasswordHash,
      role: 'OWNER',
    },
  });

  await prisma.business.create({
    data: {
      name: 'Luxe Studio & Spa',
      slug: 'luxe-salon',
      category: 'salon',
      tagline: 'Boutique Hair Styling, Colorists & Organic Day Spa',
      address: '220 Fashion Row, West End',
      phone: '+1 (555) 778-9900',
      googlePlaceId: 'ChIJgUb9xW28EIwR4qJiuRhbnt4',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJgUb9xW28EIwR4qJiuRhbnt4',
      primaryColor: '#8b5cf6',
      activePlan: 'pro',
      status: 'active',
      ownerId: owner3.id,
      welcomeMessage: 'Did we give your hair the glow it deserves? Let us know!',
      smartChips: {
        create: [
          { label: '💇 Flawless Balayage', category: 'Color', phrase: 'The most natural, blended balayage highlight I have ever received!', icon: 'Sparkles', sortOrder: 1 },
          { label: '💆 Relaxing Scalp Massage', category: 'Treatment', phrase: 'The botanical scalp massage during washing was pure heaven.', icon: 'HeartHandshake', sortOrder: 2 },
          { label: '☕ Complimentary Espresso', category: 'Amenities', phrase: 'Chic atmosphere, welcoming reception, and delicious cappuccino while getting styled.', icon: 'Coffee', sortOrder: 3 },
        ],
      },
    },
  });

  console.log('Database seeded successfully with Super Admin and 3 live businesses!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
