import crypto from 'crypto';

export type PlanKey = 'starter' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanConfig {
  name: string;
  monthlyPrice: number;
  annualPricePerMonth: number;
  annualTotal: number;
  locations: number;
  popular?: boolean;
  features: string[];
}

export const PLANS_CONFIG: Record<PlanKey, PlanConfig> = {
  starter: {
    name: 'Starter Solo',
    monthlyPrice: 499,
    annualPricePerMonth: 399,
    annualTotal: 4788,
    locations: 1,
    features: [
      '1 Business Location',
      'Unlimited QR Code Scans',
      'Interactive 1-5★ Customer Portal',
      'Direct Google Maps Place ID Sync',
      'Up to 6 Custom Smart Review Chips',
      'Live Gemini AI Review Polish & Writer',
      'Private Negative Review Shield (1-3★)',
      'High-Resolution QR Code Standee Printables'
    ]
  },
  pro: {
    name: 'Pro Growth',
    monthlyPrice: 999,
    annualPricePerMonth: 799,
    annualTotal: 9588,
    locations: 3,
    popular: true,
    features: [
      'Up to 3 Business Locations',
      'Unlimited QR Code Scans & Live Gemini AI',
      'Unlimited Smart Review Chips & Templates',
      'All Industry Presets (Gym, Salon, Dining, Auto, Clinic)',
      'Feedback Status Tracking (New, Reviewed, Resolved)',
      'Interactive Scan vs Conversion Analytics',
      'Custom Brand Theme Colors & Welcome Message',
      'High-Resolution PNG & SVG QR Code Export',
      'Multi-Location Switcher in Dashboard'
    ]
  },
  enterprise: {
    name: 'Franchise & Agency',
    monthlyPrice: 2499,
    annualPricePerMonth: 1999,
    annualTotal: 23988,
    locations: 10,
    features: [
      'Up to 10 Locations (Expandable)',
      'Central Super-Admin Platform Dashboard',
      'Global Multi-Tenant Overview & Telemetry',
      'Business Directory with Active/Paused Toggles',
      'Instant Business Provisioning Modal',
      'Full Pro Features across All 10 Locations',
      'Direct Access to Location Portals & Settings'
    ]
  }
};

export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

export function isRazorpayConfigured(): boolean {
  return Boolean(
    RAZORPAY_KEY_ID &&
    RAZORPAY_KEY_SECRET &&
    !RAZORPAY_KEY_ID.includes('YOUR_KEY') &&
    !RAZORPAY_KEY_SECRET.includes('YOUR_KEY')
  );
}

export function getPlanAmountPaise(plan: PlanKey, cycle: BillingCycle): number {
  const cfg = PLANS_CONFIG[plan] || PLANS_CONFIG.starter;
  const inRupees = cycle === 'annual' ? cfg.annualTotal : cfg.monthlyPrice;
  return inRupees * 100;
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!RAZORPAY_KEY_SECRET) return false;
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}
