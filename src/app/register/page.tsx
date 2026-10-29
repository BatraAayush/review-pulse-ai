'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Sparkles, 
  ArrowRight, 
  Store, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  Loader2, 
  Link2, 
  HelpCircle,
  CreditCard,
  ShieldCheck,
  Check,
  Search,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import CustomSelect from '@/components/CustomSelect';
import GoogleReviewGuideModal from '@/components/GoogleReviewGuideModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/ToastContext';

const CATEGORY_OPTIONS = [
  { value: 'restaurant', label: 'Dining / Restaurant / Cafe', icon: '🍽️' },
  { value: 'clinic', label: 'Medical / Dental Clinic', icon: '🦷' },
  { value: 'salon', label: 'Salon / Spa / Barbershop', icon: '✂️' },
  { value: 'retail', label: 'Boutique / Retail Store', icon: '🛍️' },
  { value: 'automotive', label: 'Automotive / Auto Repair', icon: '🏎️' },
  { value: 'fitness', label: 'Gym / Fitness Studio', icon: '🏋️' },
];

type PlanTier = 'starter' | 'pro' | 'enterprise';

const PLAN_DETAILS: Record<PlanTier, { name: string; price: number; badge?: string; desc: string }> = {
  starter: {
    name: 'Starter Solo',
    price: 499,
    desc: '1 Location • Unlimited Scans • AI Polish',
  },
  pro: {
    name: 'Pro Growth',
    price: 999,
    badge: 'Most Popular',
    desc: '3 Locations • Full AI Assistant • Custom Analytics',
  },
  enterprise: {
    name: 'Franchise & Agency',
    price: 2499,
    desc: '10 Locations • Super Admin Panel • Central Telemetry',
  },
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const planParam = searchParams.get('plan') as PlanTier;
  const initialPlan: PlanTier = ['starter', 'pro', 'enterprise'].includes(planParam) ? planParam : 'starter';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('restaurant');
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(initialPlan);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showMissingUrlModal, setShowMissingUrlModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    businessName?: string;
    password?: string;
  }>({});

  const executeRegister = async () => {
    setShowMissingUrlModal(false);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          businessName,
          category,
          plan: selectedPlan,
          googleReviewUrl: googleReviewUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create business account');
      }

      toast.success(
        `Business account created! Proceeding to ${PLAN_DETAILS[selectedPlan].name} activation.`,
        'Account Created'
      );
      router.push(data.redirectUrl || `/dashboard?activate=true&plan=${selectedPlan}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      toast.error(msg, 'Registration Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors: typeof fieldErrors = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Please enter a valid name (at least 2 characters)';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid work email address (e.g. name@company.com)';
    }

    const trimmedBizName = businessName.trim();
    if (!trimmedBizName) {
      errors.businessName = 'Business name is required';
    } else if (trimmedBizName.length < 2) {
      errors.businessName = 'Business name must be at least 2 characters';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    if (!googleReviewUrl.trim()) {
      // Explicitly ask for input so correct cafe or place can appear!
      setShowMissingUrlModal(true);
      return;
    }
    await executeRegister();
  };

  const handleUrlChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.startsWith('ChIJ') && !trimmed.includes('http')) {
      const formatted = `https://search.google.com/local/writereview?placeid=${trimmed}`;
      setGoogleReviewUrl(formatted);
      toast.success('Place ID formatted into direct review URL!', 'Auto-Formatted');
    } else {
      setGoogleReviewUrl(val);
    }
  };

  const handleOpenMapsSearch = () => {
    const query = [businessName.trim(), category === 'restaurant' ? 'restaurant cafe' : category].filter(Boolean).join(' ');
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  };

  const currentPlanInfo = PLAN_DETAILS[selectedPlan];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Dedicated Minimalist Auth Header */}
      <AuthHeader type="register" />

      <main className="flex-1 flex flex-col justify-center py-10 sm:py-14 sm:px-6 lg:px-8 relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Instant Setup • Direct Plan Activation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Create Business Account
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Set up your account details and activate your review funnel in under 2 minutes
          </p>

          {/* Feature Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant Activation • Razorpay UPI &amp; Cards • Cancel Anytime</span>
          </div>
        </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form noValidate onSubmit={handleRegister} className="space-y-5">
            {/* PLAN SELECTION SELECTOR */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Subscription Plan
                </label>
                <span className="text-[11px] font-semibold text-blue-400">
                  Instant Activation
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['starter', 'pro', 'enterprise'] as PlanTier[]).map((tierKey) => {
                  const tier = PLAN_DETAILS[tierKey];
                  const isSelected = selectedPlan === tierKey;
                  return (
                    <button
                      key={tierKey}
                      type="button"
                      onClick={() => setSelectedPlan(tierKey)}
                      className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {tier.badge && (
                        <span className="absolute -top-2 right-2 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow">
                          {tier.badge}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{tier.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                          {tier.desc}
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                        <div>
                          <span className="text-sm font-black font-mono text-white">
                            ₹{tier.price}
                          </span>
                          <span className="text-[10px] text-slate-400">/mo</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-800/60 px-1 py-0.5 rounded border border-slate-700/50">
                          Billed Monthly
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${fieldErrors.name ? 'text-rose-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                      if (error) setError(null);
                    }}
                    placeholder="Jane Doe"
                    className={`w-full bg-slate-950/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                      fieldErrors.name
                        ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5 animate-in fade-in-50 duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${fieldErrors.email ? 'text-rose-400' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      if (error) setError(null);
                    }}
                    placeholder="jane@myrestaurant.com"
                    className={`w-full bg-slate-950/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                      fieldErrors.email
                        ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5 animate-in fade-in-50 duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Business Name
                </label>
                <div className="relative">
                  <Store className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${fieldErrors.businessName ? 'text-rose-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (fieldErrors.businessName) setFieldErrors((prev) => ({ ...prev, businessName: undefined }));
                      if (error) setError(null);
                    }}
                    placeholder="e.g. Golden Crust Bakery"
                    className={`w-full bg-slate-950/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                      fieldErrors.businessName
                        ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {fieldErrors.businessName && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5 animate-in fade-in-50 duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.businessName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Business Category
                </label>
                <CustomSelect
                  value={category}
                  onChange={(val) => setCategory(val)}
                  options={CATEGORY_OPTIONS}
                />
              </div>
            </div>

            {/* Direct Google Review URL - prominent and guided */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Direct Google Review URL
                  </label>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Important
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleOpenMapsSearch}
                    className="text-slate-300 hover:text-white font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                    <span>Find on Google Maps ↗</span>
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Guide & Place ID</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={googleReviewUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://g.page/r/.../review or paste Place ID (ChIJ...)"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {googleReviewUrl.trim() ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Google review link configured for {businessName || 'your location'}</span>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-tight">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    Please provide your link or Place ID so your exact cafe or business appears. We will not generate a fake or incorrect URL on your behalf.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${fieldErrors.password ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    if (error) setError(null);
                  }}
                  placeholder="At least 6 characters"
                  className={`w-full bg-slate-950/60 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                    fieldErrors.password
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5 animate-in fade-in-50 duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating your business account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      Continue to Payment Activation (₹{currentPlanInfo.price}/mo)
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2.5">
                Instant plan activation via Razorpay UPI &amp; Cards. Cancel anytime with zero contracts.
              </p>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
      </main>

      {/* Clean Minimal Auth Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500 relative z-10">
        <p>© {new Date().getFullYear()} ReviewPulse AI Micro-SaaS. All rights reserved.</p>
      </footer>

      <ConfirmModal
        isOpen={showMissingUrlModal}
        onClose={() => {
          setShowMissingUrlModal(false);
          setShowGuideModal(true);
        }}
        onConfirm={executeRegister}
        variant="warning"
        title="Direct Google Review URL is Not Set"
        icon={<AlertTriangle className="w-6 h-6 text-amber-400" />}
        description={
          <div className="space-y-3 text-left text-xs text-slate-300">
            <p>
              To ensure happy 5-star customers are directed to the <strong className="text-white">exact profile for {businessName || 'your business'}</strong> on Google Maps, we strongly recommend entering your Direct Google Review URL or Place ID now.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1.5">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                No Guessed or Made-Up Links:
              </span>
              <span className="text-slate-400 leading-relaxed block">
                ReviewPulse AI will never fabricate a random or incorrect review URL for your business. If you continue without it now, you will be prompted to configure it in your dashboard before going live.
              </span>
            </div>
          </div>
        }
        cancelText="Find & Enter Link Now"
        confirmText="Continue Without Link"
      />

      <GoogleReviewGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        defaultBusinessName={businessName}
        onSelectUrl={(url) => setGoogleReviewUrl(url)}
        isSignUp={true}
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading registration portal...</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
