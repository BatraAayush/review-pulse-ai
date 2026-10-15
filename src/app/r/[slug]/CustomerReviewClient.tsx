'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Star, 
  Sparkles, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  RefreshCw, 
  ShieldCheck,
  MapPin,
  Loader2,
  Zap,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_BUSINESSES } from '@/lib/mock-data';
import { useToast } from '@/components/ToastContext';
import { isImageLogo, getCategoryEmoji } from '@/lib/logo';

interface CustomerReviewClientProps {
  slug: string;
  initialDirect?: boolean;
}

interface SmartChipItem {
  id: string;
  label: string;
  category: string;
  phrase: string;
  icon?: string;
}

interface BusinessData {
  id?: string;
  name: string;
  slug: string;
  category: string;
  tagline?: string;
  address?: string;
  phone?: string;
  googlePlaceId?: string;
  googleReviewUrl?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  welcomeMessage?: string;
  customPromptMessage?: string;
  smartChips: SmartChipItem[];
  bypassAiReview?: boolean;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removePhraseFromReview(text: string, phrase: string): string {
  if (!text || !phrase) return text;
  const clean = phrase.trim();
  const corePhrase = clean.replace(/[.!?,]+$/, '').trim();
  if (!corePhrase) return text;

  const regex = new RegExp(`(?:\\s+|^)${escapeRegExp(corePhrase)}[.!?,]*(?:\\s+|$)`, 'i');
  let result = text.replace(regex, ' ').trim();
  result = result
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/([.!?])\s*([.!?])/g, '$1')
    .trim();
  return result;
}

function addPhraseToReview(text: string, phrase: string, businessName: string): string {
  const cleanPhrase = phrase.trim();
  if (!cleanPhrase) return text;
  if (!text.trim()) return cleanPhrase;

  const corePhrase = cleanPhrase.replace(/[.!?,]+$/, '').trim().toLowerCase();
  if (text.toLowerCase().includes(corePhrase)) {
    return text;
  }

  const formattedPhrase = /[.!?]$/.test(cleanPhrase) ? cleanPhrase : `${cleanPhrase}.`;

  const closingRegex = /(?:(\s+|^))(can['’]t wait|will definitely|highly recommend|cannot recommend|10\/10|so glad|thank you|hands down|looking forward|definitely recommend|best [a-z0-9\s]+in town|5 stars)[^.!?]*[.!?]*$/i;
  const match = text.match(closingRegex);

  if (match && match.index !== undefined && match.index > 0) {
    const beforeClosing = text.slice(0, match.index).trim();
    const closingPart = text.slice(match.index).trim();
    const formattedBefore = /[.!?]$/.test(beforeClosing) ? beforeClosing : `${beforeClosing}.`;
    return `${formattedBefore} ${formattedPhrase} ${closingPart}`;
  }

  const formattedText = /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
  return `${formattedText} ${formattedPhrase}`;
}

export default function CustomerReviewClient({ slug, initialDirect }: CustomerReviewClientProps) {
  const { toast } = useToast();
  const fallbackBiz = INITIAL_BUSINESSES.find((b) => b.slug.toLowerCase() === slug.toLowerCase()) || null;
  const [business, setBusiness] = useState<BusinessData | null>(fallbackBiz);
  const [loadingBusiness, setLoadingBusiness] = useState(!fallbackBiz);
  const [notFound, setNotFound] = useState(false);
  const [pendingActivation, setPendingActivation] = useState<{ businessName?: string } | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);

  // Direct Bypass state
  const [forceShowAiFunnel, setForceShowAiFunnel] = useState(false);
  const [clientHasDirectParam, setClientHasDirectParam] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const isDirectQuery =
        sp.get('direct') === '1' ||
        sp.get('direct') === 'true' ||
        sp.get('bypass') === '1' ||
        sp.get('bypass') === 'true';
      if (isDirectQuery) {
        setClientHasDirectParam(true);
      }
    }
  }, []);

  const isDirectBypass = !forceShowAiFunnel && (
    Boolean(initialDirect) ||
    clientHasDirectParam ||
    Boolean(business?.bypassAiReview)
  );

  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [isPrivateFeedbackSubmitted, setIsPrivateFeedbackSubmitted] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const hasInitializedRef = React.useRef(false);

  // AI Rephrase / Polish / Generate feature (Powered by Gemini AI with smart fallback)
  const handleAIPolish = async (
    actionType: 'polish' | 'generate' = 'polish',
    overrideChips?: string[],
    overrideBiz?: BusinessData,
    overrideRating?: number
  ) => {
    const biz = overrideBiz || business;
    if (!biz) return;
    setIsAIGenerating(true);
    setAiNotice(null);

    const activeChipIds = overrideChips !== undefined ? overrideChips : selectedChips;
    const currentRating = overrideRating !== undefined ? overrideRating : rating;

    try {
      const selectedLabels = activeChipIds
        .map((id) => biz.smartChips.find((c) => c.id === id)?.label)
        .filter(Boolean);

      const phrases = activeChipIds
        .map((id) => biz.smartChips.find((c) => c.id === id)?.phrase)
        .filter(Boolean);

      const res = await fetch(`/api/r/${slug}/ai-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: currentRating,
          selectedChips: selectedLabels,
          selectedPhrases: phrases,
          currentText: actionType === 'polish' ? reviewText : '',
          action: actionType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reviewText) {
          setReviewText(data.reviewText);
          if (data.isRealAI) {
            setAiNotice(data.model ? `✨ Freshly written by ${data.model}` : '✨ Fresh review crafted with Gemini AI');
          } else {
            setAiNotice(data.notice || 'Refreshed via smart template');
          }
          setTimeout(() => setAiNotice(null), 5000);
          return;
        }
      }
    } catch (err) {
      console.warn('AI review error, using local fallback:', err);
    } finally {
      setIsAIGenerating(false);
    }

    // Client-side fallback if network is completely down
    const intros = [
      `Cannot recommend ${biz.name} enough!`,
      `Truly blown away by my visit to ${biz.name}.`,
      `Such a standout experience at ${biz.name}.`,
      `5 stars all the way for ${biz.name}!`,
      `Had a fantastic time at ${biz.name}.`,
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

    const phrases = activeChipIds
      .map((id) => biz.smartChips.find((c) => c.id === id)?.phrase)
      .filter(Boolean);

    const body = phrases.length > 0
      ? phrases.join('. ') + '.'
      : 'Everything exceeded my expectations from start to finish.';

    setReviewText(`${randomIntro} ${body} ${randomClosing}`);
  };

  // Helper to seed chips and generate fresh AI review for this customer on scan
  const initBusinessReview = (biz: BusinessData) => {
    const allChips = biz.smartChips || [];
    // Randomize 2 chips so each scan gets a unique combination of highlights
    const shuffled = [...allChips].sort(() => 0.5 - Math.random());
    const initialChips = shuffled.slice(0, Math.min(2, shuffled.length));
    const chipIds = initialChips.map((c) => c.id);
    setSelectedChips(chipIds);

    const phrases = initialChips.map((c) => c.phrase).filter(Boolean);
    if (phrases.length > 0) {
      setReviewText(`Had a wonderful experience at ${biz.name}! ${phrases.join('. ')}. Truly top notch!`);
    } else {
      setReviewText(`Had a great experience at ${biz.name}! Highly recommended.`);
    }

    // Automatically trigger fresh AI review for this QR scan (skipped in direct mode)
    if (!isDirectBypass) {
      handleAIPolish('generate', chipIds, biz, 5);
    }
  };

  const handleAIBtnClick = () => {
    // If the customer wrote custom text, polish it; otherwise generate fresh review variation
    const isCustomText = reviewText.trim() && !reviewText.startsWith('Had a ');
    handleAIPolish(isCustomText ? 'polish' : 'generate');
  };

  // 1. Fetch real business data from API
  useEffect(() => {
    let isMounted = true;
    async function loadBusiness() {
      try {
        const res = await fetch(`/api/r/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.business && isMounted) {
            setBusiness(data.business);
            if (!hasInitializedRef.current) {
              hasInitializedRef.current = true;
              initBusinessReview(data.business);
            }
          }
        } else if (res.status === 402 && isMounted) {
          const errData = await res.json().catch(() => ({}));
          setBusiness(null);
          setPendingActivation({
            businessName: errData.businessName || 'Business Location',
          });
        } else if (res.status === 404 && isMounted) {
          if (!fallbackBiz) {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.warn('Using local business fallback:', err);
        if (fallbackBiz && isMounted && !hasInitializedRef.current) {
          hasInitializedRef.current = true;
          initBusinessReview(fallbackBiz);
        }
      } finally {
        if (isMounted) setLoadingBusiness(false);
      }
    }
    loadBusiness();
    return () => { isMounted = false; };
  }, [slug]);

  // 2. Record real QR scan in database on mount
  useEffect(() => {
    let isMounted = true;
    async function recordRealScan() {
      try {
        const res = await fetch(`/api/r/${slug}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isDirect: isDirectBypass,
            actionTaken: isDirectBypass ? 'direct_google_redirect' : 'scanned',
          }),
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.scanId) {
            setScanId(data.scanId);
          }
        }
      } catch {
        // Fallback silently if offline
      }
    }
    recordRealScan();
    return () => { isMounted = false; };
  }, [slug, isDirectBypass]);

  // 3. Direct Google Review Auto-Redirection
  useEffect(() => {
    if (!isDirectBypass || !business) return;

    const targetUrl = getGoogleReviewUrl();
    if (!targetUrl || targetUrl === '#') return;

    // Smooth 750ms auto redirect so customer gets clear visual verification of verified portal
    const timer = setTimeout(() => {
      window.location.replace(targetUrl);
    }, 750);

    return () => clearTimeout(timer);
  }, [isDirectBypass, business]);

  const activeRating = hoveredRating || rating;


  // Toggle Chip without losing AI review
  const toggleChip = (chipId: string) => {
    if (!business) return;
    const chip = business.smartChips.find((c) => c.id === chipId);
    if (!chip) return;

    const isCurrentlySelected = selectedChips.includes(chipId);
    let updatedChips: string[];

    if (isCurrentlySelected) {
      updatedChips = selectedChips.filter((id) => id !== chipId);
      setSelectedChips(updatedChips);
      // Cleanly remove the phrase from the review text
      const newText = removePhraseFromReview(reviewText, chip.phrase);
      if (!newText.trim() && updatedChips.length === 0) {
        setReviewText(`Had a wonderful experience at ${business.name}! Highly recommended.`);
      } else {
        setReviewText(newText);
      }
      toast.info(`Removed "${chip.label}"`);
    } else {
      updatedChips = [...selectedChips, chipId];
      setSelectedChips(updatedChips);
      // Seamlessly add phrase into existing review text, preserving the AI review!
      const newText = addPhraseToReview(reviewText, chip.phrase, business.name);
      setReviewText(newText);
      toast.success(`Added "${chip.label}" into your review!`, 'Review Updated');
    }
  };

  // Check if restaurant has direct Google review URL or place ID configured
  const hasDirectGoogleReviewUrl = Boolean(
    business && (
      (business.googleReviewUrl &&
        business.googleReviewUrl.startsWith('http') &&
        !business.googleReviewUrl.includes('writereview?business=')) ||
      (business.googlePlaceId && !business.googlePlaceId.includes('null'))
    )
  );

  // Resolve authentic Google Review link - never make up invalid writereview?business= URL
  const getGoogleReviewUrl = () => {
    if (!business) return '#';
    if (
      business.googleReviewUrl &&
      business.googleReviewUrl.startsWith('http') &&
      !business.googleReviewUrl.includes('writereview?business=')
    ) {
      return business.googleReviewUrl;
    }
    if (business.googlePlaceId && !business.googlePlaceId.includes('null')) {
      return `https://search.google.com/local/writereview?placeid=${business.googlePlaceId}`;
    }
    // Genuine Google Maps search query fallback so the real cafe/restaurant profile appears on Google Maps!
    const query = [business.name, business.address].filter(Boolean).join(' ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // Handle Google Review Submission
  const handlePostOnGoogle = async () => {
    if (!business) return;
    setIsSubmitting(true);

    // 1. Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899'],
      });
    } catch {
      // safe fallback
    }

    // 2. Copy text to clipboard
    try {
      await navigator.clipboard.writeText(reviewText);
      toast.success('Review copied to clipboard! Opening Google...', 'Ready to Post');
    } catch {
      // fallback
    }

    // 3. Record conversion in real database
    const chipLabels = selectedChips
      .map((id) => business.smartChips.find((c) => c.id === id)?.label)
      .filter((lbl): lbl is string => Boolean(lbl));

    try {
      await fetch(`/api/r/${slug}/conversion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          rating,
          selectedChips: chipLabels,
          reviewLength: reviewText.length,
        }),
      });
    } catch {
      // fallback
    }

    // 4. Show modal with instant Google redirect
    setShowRedirectModal(true);
    setIsSubmitting(false);

    const targetUrl = getGoogleReviewUrl();

    // Auto redirect after a brief countdown
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 2200);
  };

  // Handle Private Feedback submission (for 1-3 stars)
  const handlePrivateFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    try {
      await fetch(`/api/r/${slug}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          rating,
          feedbackText: reviewText,
          customerName,
          customerContact,
        }),
      });
    } catch {
      // fallback
    }

    setIsPrivateFeedbackSubmitted(true);
    toast.success('Your feedback has been sent directly to the business owner.', 'Thank You');
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return 'Absolutely Amazing! 🤩';
      case 4:
        return 'Great Experience! 😊';
      case 3:
        return 'It Was Okay 😐';
      case 2:
        return 'Could Be Better 😕';
      case 1:
        return 'Disappointing 😞';
      default:
        return 'Tap a star to rate';
    }
  };

  if (loadingBusiness) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
        <h2 className="text-base font-bold text-white">Loading review portal...</h2>
        <p className="text-xs text-slate-400 mt-1">Preparing verified Google review link</p>
      </div>
    );
  }

  if (pendingActivation) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 shadow-xl">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold mb-3">
          <span>Subscription Awaiting Activation</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          {pendingActivation.businessName}
        </h2>
        <p className="text-xs text-slate-300 mt-2 max-w-sm leading-relaxed">
          This Google review portal has been provisioned and is currently awaiting plan activation via Razorpay / UPI.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/25"
          >
            Owner Login & Complete Payment
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Business Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          The review link <span className="font-mono text-blue-400">/r/{slug}</span> does not exist or may have been updated.
        </p>
        <Link href="/" className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all">
          Go to ReviewPulse AI
        </Link>
      </div>
    );
  }

  const finalGoogleUrl = getGoogleReviewUrl();

  // If in direct bypass mode, render the direct redirect screen
  if (isDirectBypass) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div 
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-30"
          style={{ backgroundColor: business.primaryColor || '#2563eb' }}
        />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

        {/* Top bar with verified badge */}
        <header className="relative z-10 max-w-md mx-auto w-full flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-300">Verified Review Portal</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Direct to Google</span>
          </div>
        </header>

        {/* Main card */}
        <main className="relative z-10 max-w-md mx-auto w-full my-auto py-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 backdrop-blur-xl shadow-2xl text-center space-y-6">
            {/* Logo or Emoji */}
            <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 p-1 shadow-xl flex items-center justify-center">
              {isImageLogo(business.logoUrl) ? (
                <img
                  src={business.logoUrl!}
                  alt={business.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-3xl">{business.logoUrl || getCategoryEmoji(business.category)}</span>
              )}
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div>
              <div className="flex justify-center items-center gap-1.5 text-amber-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">{business.name}</h1>
              {business.address && (
                <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="line-clamp-1">{business.address}</span>
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-200">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span>Opening Google Review page...</span>
              </div>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Scan verified! Taking you straight to Google to post your rating for {business.name}.
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-400 rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <a
                href={finalGoogleUrl}
                onClick={() => {
                  window.location.href = finalGoogleUrl;
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Continue to Google Review</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setForceShowAiFunnel(true)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors pt-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Want AI writing help? Switch to AI Review Funnel</span>
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center text-[11px] text-slate-500">
          Powered by ReviewPulse AI • Verified Direct Google Reviews
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-25"
        style={{ backgroundColor: business.primaryColor || '#2563eb' }}
      />

      <div className="max-w-md w-full mx-auto space-y-6 relative z-10">
        {/* Business Branding Card */}
        <div className="rounded-3xl p-6 bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl text-center space-y-3">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20 mx-auto flex items-center justify-center text-3xl overflow-hidden">
              <div className="bg-slate-950 w-full h-full rounded-[14px] flex items-center justify-center overflow-hidden">
                {isImageLogo(business.logoUrl) ? (
                  <img
                    src={business.logoUrl!}
                    alt={business.name}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <span>{business.logoUrl || getCategoryEmoji(business.category)}</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-md" title="Google Verified Location">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-medium text-slate-300 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Official Review Hub</span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {business.name}
            </h1>
            {business.address && (
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate max-w-[280px]">{business.address}</span>
              </p>
            )}
          </div>

          <p className="text-xs text-slate-300 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 leading-relaxed">
            {business.welcomeMessage || 'Thank you for visiting us! How was your experience today?'}
          </p>
        </div>

        {/* 1-to-5 Star Interactive Selector */}
        <div className="rounded-3xl p-6 bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl text-center space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Rate your overall experience:
          </label>

          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((starValue) => {
              const isFilled = (hoveredRating || rating) >= starValue;
              return (
                <button
                  key={starValue}
                  type="button"
                  onMouseEnter={() => setHoveredRating(starValue)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(starValue)}
                  className="p-1.5 transition-transform active:scale-125 focus:outline-none group cursor-pointer"
                >
                  <Star
                    className={`w-9 h-9 sm:w-10 sm:h-10 transition-all duration-200 ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                        : 'text-slate-700 hover:text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="text-sm font-bold text-blue-400 tracking-wide transition-all h-6">
            {getRatingLabel(activeRating)}
          </div>
        </div>

        {/* Conditional Routing: 4-5 Stars (Google Public Review Flow) vs 1-3 Stars (Private Feedback Shield) */}
        {rating >= 4 ? (
          <div className="space-y-5">
            {/* Smart Review Template Chips */}
            <div className="rounded-3xl p-5 bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tap Highlights To Add To Review:</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedChips.length} active
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {business.smartChips.map((chip) => {
                  const isSelected = selectedChips.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggleChip(chip.id)}
                      className={`text-xs px-3 py-2 rounded-xl font-medium transition-all duration-150 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 border border-blue-500 ring-1 ring-blue-400/50'
                          : 'bg-slate-800/80 text-slate-300 border border-slate-700/80 hover:bg-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span>{chip.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Review Textbox */}
            <div className="rounded-3xl p-5 bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Your Review (editable):
                  </label>
                  {isAIGenerating && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 font-medium animate-pulse">
                      <Sparkles className="w-3 h-3" /> Crafting with AI...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isAIGenerating || !reviewText.trim()}
                    onClick={() => handleAIPolish('polish')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                    title="Polish and blend added chips smoothly with Gemini AI"
                  >
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>AI Polish</span>
                  </button>
                  <button
                    type="button"
                    disabled={isAIGenerating}
                    onClick={() => handleAIPolish('generate')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                    title="Generate another fresh review variation with Gemini AI"
                  >
                    <RefreshCw className={`w-3 h-3 ${isAIGenerating ? 'animate-spin text-blue-400' : ''}`} />
                    <span>New Draft</span>
                  </button>
                </div>
              </div>

              {aiNotice && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{aiNotice}</span>
                </div>
              )}

              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={isAIGenerating ? "Crafting fresh review with Gemini AI..." : "Write or edit your review here..."}
                className="w-full rounded-2xl bg-slate-950/80 border border-slate-700 p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none leading-relaxed transition-all"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Auto-copied when you tap below</span>
                <span>{reviewText.length} characters</span>
              </div>
            </div>

            {/* Post on Google CTA Button */}
            <button
              type="button"
              disabled={isSubmitting || !reviewText.trim()}
              onClick={handlePostOnGoogle}
              className="w-full group relative overflow-hidden rounded-2xl bg-blue-600 hover:bg-blue-500 p-4 font-extrabold text-white shadow-xl shadow-blue-600/30 transition-all hover:brightness-110 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-base tracking-wide">Preparing Google Review...</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="text-base tracking-wide">Copy & Post on Google</span>
                    <ExternalLink className="w-4 h-4 opacity-80" />
                  </>
                )}
              </div>
            </button>

            <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copies text to clipboard & opens official Google Review page</span>
            </p>
          </div>
        ) : (
          /* Negative Feedback Shield (Ratings <= 3) */
          <div className="rounded-3xl p-6 bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">We want to make this right!</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your feedback goes directly to our management team before anything is published.
                </p>
              </div>
            </div>

            {isPrivateFeedbackSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-300">Feedback Received</h4>
                <p className="text-xs text-slate-300">
                  Thank you for helping us improve. Our manager has been alerted and will review this personally.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePrivateFeedbackSubmit} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What went wrong during your visit? Please tell us how we can improve..."
                  className="w-full rounded-2xl bg-slate-950/80 border border-slate-700 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700 p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone or Email"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700 p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white p-2.5 text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Direct to Management</span>
                </button>

                <div className="pt-2 text-center">
                  <a
                    href={finalGoogleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-slate-400 hover:text-slate-300 underline"
                  >
                    I still want to post publicly on Google
                  </a>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Brand Footer */}
        <div className="text-center pt-2 pb-6 text-xs text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <span>Powered by</span>
            <span className="font-semibold text-slate-300">ReviewPulse AI</span>
          </p>
          <p className="text-[10px] text-slate-500">Takes less than 15 seconds to review</p>
        </div>
      </div>

      {/* Instant Redirect Modal Toast */}
      {showRedirectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer"
            onClick={() => setShowRedirectModal(false)}
            aria-hidden="true"
          />

          <div 
            className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-4 relative z-10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Review Copied to Clipboard!</h3>
              <p className="text-xs text-slate-300 mt-1">
                {hasDirectGoogleReviewUrl ? (
                  <>
                    Redirecting to Google now. When the review box opens, simply <strong className="text-blue-400">Paste</strong> and tap <strong className="text-blue-400">Post</strong>!
                  </>
                ) : (
                  <>
                    Opening <strong className="text-blue-400">{business.name}</strong> on Google Maps. Tap <strong className="text-emerald-400">&quot;Write a review&quot;</strong>, then <strong className="text-blue-400">Paste</strong>!
                  </>
                )}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-slate-400 max-h-20 overflow-y-auto">
              &quot;{reviewText}&quot;
            </div>

            <a
              href={finalGoogleUrl}
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs hover:brightness-110 shadow-lg shadow-blue-600/30"
            >
              <span>{hasDirectGoogleReviewUrl ? 'Opening Google Review...' : `Opening ${business.name} on Maps...`} (Click if not redirected)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
