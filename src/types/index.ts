export type BusinessCategory = 'restaurant' | 'clinic' | 'salon' | 'automotive' | 'fitness' | 'retail';

export interface SmartChip {
  id: string;
  label: string;
  category: string;
  phrase: string;
  icon?: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  category: BusinessCategory;
  tagline: string;
  address: string;
  phone: string;
  googlePlaceId: string;
  googleReviewUrl?: string;
  logoUrl?: string | null;
  primaryColor: string;
  totalScans: number;
  totalReviewsAttempted: number;
  averageRating: number;
  activePlan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'paused' | 'pending';
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled' | 'pending_payment' | 'unpaid';
  trialEndsAt?: string | Date | null;
  subscriptionCycle?: 'monthly' | 'annual' | null;
  subscriptionRenewsAt?: string | Date | null;
  ownerEmail: string;
  smartChips: SmartChip[];
  welcomeMessage: string;
  customPromptMessage?: string;
  createdAt: string;
}

export interface PaymentTransactionItem {
  id: string;
  businessId: string;
  orderId: string;
  paymentId?: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'captured' | 'failed';
  plan: string;
  billingCycle: string;
  paymentMethod?: string | null;
  createdAt: string | Date;
}

export interface ScanEvent {
  id: string;
  businessId: string;
  businessSlug?: string;
  timestamp: string | Date;
  deviceType: 'ios' | 'android' | 'desktop';
  ratingSelected?: number | null;
  actionTaken: 'copied_to_google' | 'private_feedback' | 'bounced' | 'scanned';
  selectedChips?: string[] | string | null;
  reviewLength?: number;
}

export interface PrivateFeedback {
  id: string;
  businessId: string;
  businessSlug: string;
  customerName?: string;
  customerContact?: string;
  rating: number;
  feedbackText: string;
  createdAt: string;
  status: 'unread' | 'resolved';
}

export interface AdminStats {
  totalScans: number;
  totalBusinesses: number;
  totalReviewsGenerated: number;
  totalMRR: number;
  growthPercentage: number;
}
