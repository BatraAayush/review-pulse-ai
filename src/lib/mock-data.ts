import { Business, ScanEvent, PrivateFeedback } from '@/types';

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: 'biz-1',
    slug: 'rustic-spoon',
    name: 'The Rustic Spoon Bistro',
    category: 'restaurant',
    tagline: 'Artisan Wood-Fired Kitchen & Craft Bar',
    address: '442 Market Street, San Francisco, CA 94105',
    phone: '+1 (415) 555-0194',
    googlePlaceId: 'ChIJES2xk80EdkgRm49tmBgjTUw',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJES2xk80EdkgRm49tmBgjTUw',
    logoUrl: '🍝',
    primaryColor: '#F59E0B',
    totalScans: 1482,
    totalReviewsAttempted: 1018,
    averageRating: 4.88,
    activePlan: 'pro',
    status: 'active',
    ownerEmail: 'marco@rusticspoonbistro.com',
    welcomeMessage: 'We hope you enjoyed dining with us today! Tap a rating to share your experience with others.',
    customPromptMessage: 'Help fellow foodies discover us on Google!',
    createdAt: '2025-01-12',
    smartChips: [
      { id: 'c1', label: '🍕 Wood-Fired Pizza', category: 'Food', phrase: 'The artisanal wood-fired pizza had an incredible crust and fresh toppings' },
      { id: 'c2', label: '🍷 Exceptional Wine', category: 'Drink', phrase: 'The wine selection and pairing recommendations were spot on' },
      { id: 'c3', label: '⚡ Fast Friendly Service', category: 'Staff', phrase: 'Our server was attentive, warm, and brought our orders swiftly' },
      { id: 'c4', label: '🕯️ Cozy Ambiance', category: 'Vibe', phrase: 'The rustic atmosphere and intimate lighting made it a memorable evening' },
      { id: 'c5', label: '🍮 Tiramisu To Die For', category: 'Dessert', phrase: 'Do not skip the homemade tiramisu, it was perfection' },
      { id: 'c6', label: '🌟 10/10 Must Visit', category: 'Overall', phrase: 'Hands down one of the best dining experiences in town, will definitely be back!' }
    ]
  },
  {
    id: 'biz-2',
    slug: 'lumina-dental',
    name: 'Lumina Dental & Aesthetics',
    category: 'clinic',
    tagline: 'Gentle, State-of-the-Art Smile Architecture',
    address: '880 Ocean Avenue, Suite 300, Santa Monica, CA 90403',
    phone: '+1 (310) 555-0812',
    googlePlaceId: 'ChIJHw9jB2L7DDkR1qoMaPPxWrc',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJHw9jB2L7DDkR1qoMaPPxWrc',
    logoUrl: '🦷',
    primaryColor: '#0EA5E9',
    totalScans: 934,
    totalReviewsAttempted: 672,
    averageRating: 4.94,
    activePlan: 'pro',
    status: 'active',
    ownerEmail: 'dr.carter@luminaspa.com',
    welcomeMessage: 'Your comfort and healthy smile mean the world to us. Let us know how your visit went!',
    customPromptMessage: 'Tell Google about your scheduling, reception, and care experience today!',
    createdAt: '2025-02-04',
    smartChips: [
      { id: 'c7', label: 'Clean and hygienic facility', category: 'Facility', phrase: 'The clinic was spotlessly clean, modern, and very hygienic.' },
      { id: 'c8', label: 'Minimal wait time', category: 'Punctuality', phrase: 'Minimal wait time before being seen for my appointment.' },
      { id: 'c9', label: 'Polite and helpful reception staff', category: 'Staff', phrase: 'The reception and front desk staff were polite, friendly, and helpful.' },
      { id: 'c10', label: 'Doctor explained procedure clearly', category: 'Communication', phrase: 'The doctor explained the procedure clearly and answered all questions.' },
      { id: 'c11', label: 'Gentle and patient doctor', category: 'Patient Care', phrase: 'The doctor was very gentle, patient, and made me feel comfortable.' },
      { id: 'c12', label: 'Easy appointment scheduling', category: 'Scheduling', phrase: 'Easy and hassle-free appointment scheduling.' }
    ]
  },
  {
    id: 'biz-3',
    slug: 'velvet-stone',
    name: 'Velvet & Stone Hair Lounge',
    category: 'salon',
    tagline: 'Modern Balayage, Cut & Color Specialists',
    address: '112 Broadway St, New York, NY 10006',
    phone: '+1 (212) 555-9831',
    googlePlaceId: 'ChIJ5zS1d0muEmsRwK32e84sB22',
    logoUrl: '✂️',
    primaryColor: '#EC4899',
    totalScans: 1210,
    totalReviewsAttempted: 890,
    averageRating: 4.91,
    activePlan: 'enterprise',
    status: 'active',
    ownerEmail: 'elena@velvetandstone.com',
    welcomeMessage: 'Thank you for choosing Velvet & Stone! Show off your glow and drop us a review on Google.',
    customPromptMessage: 'Share your fresh style on Google!',
    createdAt: '2025-01-20',
    smartChips: [
      { id: 'c13', label: '🎨 Flawless Balayage', category: 'Color', phrase: 'The color blending and balayage technique was absolute magic' },
      { id: 'c14', label: '💇‍♀️ Precision Haircut', category: 'Cut', phrase: 'Got the exact face-framing cut I dreamed of with effortless volume' },
      { id: 'c15', label: '☕ Complimentary Drinks', category: 'Perks', phrase: 'Loved the specialty iced matcha latte and relaxed aesthetic' },
      { id: 'c16', label: '💬 Expert Consultation', category: 'Stylist', phrase: 'Elena listened deeply to what I wanted and tailored the look to my hair type' },
      { id: 'c17', label: '✨ Silky Smooth Blowout', category: 'Styling', phrase: 'Leaves hair feeling like pure silk for days afterwards' },
      { id: 'c18', label: '💖 Loyal Customer Forever', category: 'Loyalty', phrase: 'Found my forever salon in NYC, will never let anyone else touch my hair!' }
    ]
  },
  {
    id: 'biz-4',
    slug: 'apex-auto',
    name: 'Apex Performance Auto Care',
    category: 'automotive',
    tagline: 'Honest Mechanical Diagnostics & Precision Tuning',
    address: '7100 Industrial Pkwy, Austin, TX 78745',
    phone: '+1 (512) 555-6677',
    googlePlaceId: 'ChIJ4wT2a0iuEmsReL02c93rQ11',
    logoUrl: '🏎️',
    primaryColor: '#EF4444',
    totalScans: 742,
    totalReviewsAttempted: 489,
    averageRating: 4.82,
    activePlan: 'starter',
    status: 'active',
    ownerEmail: 'service@apexperformance.io',
    welcomeMessage: 'Your vehicle safety and performance is our priority. Let our community know about your repair experience!',
    customPromptMessage: 'Rate our mechanics on Google!',
    createdAt: '2025-02-18',
    smartChips: [
      { id: 'c19', label: '🔧 Transparent Pricing', category: 'Cost', phrase: 'No hidden fees or unnecessary upsells, completely honest estimate' },
      { id: 'c20', label: '🏎️ Quick Turnaround', category: 'Speed', phrase: 'Diagnosed and repaired within the same afternoon as promised' },
      { id: 'c21', label: '📊 Video Inspection Sent', category: 'Tech', phrase: 'Sent a full video inspection report before performing any work' },
      { id: 'c22', label: '🏆 Master Mechanics', category: 'Skill', phrase: 'Fixed an electrical issue three other shops failed to diagnose' },
      { id: 'c23', label: '🧼 Clean Waiting Lounge', category: 'Lounge', phrase: 'High speed Wi-Fi and comfortable workstation while waiting' },
      { id: 'c24', label: '🤝 Trusted For Life', category: 'Trust', phrase: 'The most trustworthy auto repair team in Austin!' }
    ]
  }
];

export const INITIAL_SCAN_EVENTS: ScanEvent[] = [
  {
    id: 'scan-1',
    businessId: 'biz-1',
    businessSlug: 'rustic-spoon',
    timestamp: '2 mins ago',
    deviceType: 'ios',
    ratingSelected: 5,
    actionTaken: 'copied_to_google',
    selectedChips: ['🍕 Wood-Fired Pizza', '⚡ Fast Friendly Service'],
    reviewLength: 124
  },
  {
    id: 'scan-2',
    businessId: 'biz-1',
    businessSlug: 'rustic-spoon',
    timestamp: '14 mins ago',
    deviceType: 'android',
    ratingSelected: 5,
    actionTaken: 'copied_to_google',
    selectedChips: ['🕯️ Cozy Ambiance', '🍮 Tiramisu To Die For'],
    reviewLength: 98
  },
  {
    id: 'scan-3',
    businessId: 'biz-1',
    businessSlug: 'rustic-spoon',
    timestamp: '42 mins ago',
    deviceType: 'ios',
    ratingSelected: 4,
    actionTaken: 'copied_to_google',
    selectedChips: ['🍕 Wood-Fired Pizza'],
    reviewLength: 82
  },
  {
    id: 'scan-4',
    businessId: 'biz-2',
    businessSlug: 'lumina-dental',
    timestamp: '1 hour ago',
    deviceType: 'ios',
    ratingSelected: 5,
    actionTaken: 'copied_to_google',
    selectedChips: ['🛋️ Painless Treatment', '👩‍⚕️ Caring Dental Team'],
    reviewLength: 140
  },
  {
    id: 'scan-5',
    businessId: 'biz-1',
    businessSlug: 'rustic-spoon',
    timestamp: '2 hours ago',
    deviceType: 'android',
    ratingSelected: 3,
    actionTaken: 'private_feedback',
    selectedChips: [],
    reviewLength: 65
  },
  {
    id: 'scan-6',
    businessId: 'biz-3',
    businessSlug: 'velvet-stone',
    timestamp: '3 hours ago',
    deviceType: 'ios',
    ratingSelected: 5,
    actionTaken: 'copied_to_google',
    selectedChips: ['🎨 Flawless Balayage', '✨ Silky Smooth Blowout'],
    reviewLength: 110
  }
];

export const INITIAL_PRIVATE_FEEDBACK: PrivateFeedback[] = [
  {
    id: 'pf-1',
    businessId: 'biz-1',
    businessSlug: 'rustic-spoon',
    customerName: 'David K.',
    customerContact: 'david.k@gmail.com',
    rating: 3,
    feedbackText: 'The pasta was delicious, but table 14 had a noticeable draft from the patio door that cooled down the food quickly.',
    createdAt: 'Today, 2:15 PM',
    status: 'unread'
  },
  {
    id: 'pf-2',
    businessId: 'biz-4',
    businessSlug: 'apex-auto',
    customerName: 'Sarah M.',
    customerContact: '+1 (512) 555-9012',
    rating: 2,
    feedbackText: 'The repair work was great, but the counter receptionist was on a personal phone call when I arrived to pick up my keys.',
    createdAt: 'Yesterday, 5:40 PM',
    status: 'resolved'
  }
];
