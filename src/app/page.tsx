'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSaaSStore } from '@/lib/store';
import {
  Sparkles,
  Star,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Smartphone,
  Utensils,
  Stethoscope,
  Scissors,
  Wrench,
  Check,
  BarChart3,
  Award,
  CreditCard
} from 'lucide-react';

export default function LandingPage() {
  const { currentBusiness } = useSaaSStore();

  // Hero Simulator Interactive State
  const [demoRating, setDemoRating] = useState(5);
  const [demoChips, setDemoChips] = useState<string[]>(['Pizza', 'Staff']);
  const [demoCopied, setDemoCopied] = useState(false);

  // Industry Tab
  const [activeIndustry, setActiveIndustry] = useState<'restaurant' | 'clinic' | 'salon' | 'auto'>('restaurant');

  // ROI Calculator State
  const [monthlyCustomers, setMonthlyCustomers] = useState(1200);

  // Pricing Billing Toggle (Defaults to Monthly so base ₹499 shows immediately)
  const [annualBilling, setAnnualBilling] = useState(false);

  // FAQ open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Computed ROI
  const estimatedReviews = Math.round(monthlyCustomers * 0.12);
  const estimatedRevenue = Math.round(estimatedReviews * 38);

  const toggleDemoChip = (chip: string) => {
    if (demoChips.includes(chip)) {
      setDemoChips(demoChips.filter((c) => c !== chip));
    } else {
      setDemoChips([...demoChips, chip]);
    }
  };

  const getSimulatedReviewText = () => {
    const parts = [];
    if (demoChips.includes('Pizza')) parts.push('The artisan wood-fired pizza had an incredible crust');
    if (demoChips.includes('Staff')) parts.push('Our server was attentive, friendly, and swift');
    if (demoChips.includes('Ambiance')) parts.push('The cozy rustic ambiance made the evening special');
    if (demoChips.includes('Dessert')) parts.push('The homemade tiramisu was pure perfection');

    if (parts.length === 0) {
      return 'Had an incredible experience! High quality service and delicious food. Highly recommended to everyone.';
    }
    return `Had an amazing visit! ${parts.join('. ')}. 10/10 will definitely be back soon!`;
  };

  const handleDemoCopy = () => {
    navigator.clipboard.writeText(getSimulatedReviewText());
    setDemoCopied(true);
    setTimeout(() => setDemoCopied(false), 2000);
  };

  const industryData = {
    restaurant: {
      name: 'Restaurants, Cafes & Bars',
      icon: Utensils,
      quote: 'Boost table turns and highlight signature dishes with food-centric chips.',
      chips: ['🍕 Wood-Fired Pizza', '🍷 Great Wine List', '⚡ Fast Friendly Staff', '🍮 Must-Try Dessert'],
      slug: 'rustic-spoon'
    },
    clinic: {
      name: 'Dental & Medical Clinics',
      icon: Stethoscope,
      quote: 'Eliminate patient hesitation by highlighting gentle care and zero wait times.',
      chips: ['🛋️ Gentle Pain-Free Care', '👩‍⚕️ Kind Doctors', '⏱️ Zero Waiting Time', '✨ Pristine Clinic'],
      slug: 'lumina-dental'
    },
    salon: {
      name: 'Salons, Spas & Beauty',
      icon: Scissors,
      quote: 'Turn post-treatment glow into enthusiastic, detailed stylist reviews.',
      chips: ['🎨 Flawless Balayage', '💇‍♀️ Precision Haircut', '☕ Free Matchas', '✨ Silky Blowout'],
      slug: 'velvet-stone'
    },
    auto: {
      name: 'Auto Repair & Services',
      icon: Wrench,
      quote: 'Build iron-clad local trust with honest mechanic and transparent pricing praise.',
      chips: ['🔧 Transparent Pricing', '🏎️ Fast Turnaround', '📊 Video Inspection Sent', '🤝 Trusted Mechanics'],
      slug: 'apex-auto'
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-grid-pattern">
        {/* Ambient Gradient Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-sky-500/15 to-blue-800/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold shadow-lg shadow-blue-500/10 animate-float">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>AI-Powered Smart QR Google Review SaaS</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">Used by 1,200+ Businesses</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Turn Physical Foot Traffic Into{' '}
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                5-Star Google Reviews
              </span>{' '}
              Instantly.
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Customers scan your custom QR stand, tap 2-3 highlight chips to build a glowing natural review, and post to Google with 1 click. Negative feedback is intercepted privately.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register?plan=pro"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>Get Started with Pro Funnel</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl border border-slate-700/80 transition-all hover:border-slate-600"
              >
                <span>Sign In to Dashboard</span>
              </Link>

              <a
                href="#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-slate-400 hover:text-blue-400 text-sm font-semibold transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>View Subscription Plans</span>
              </a>
            </div>

            {/* Trust Points */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Google Places API Integrated</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No App Download Required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Smart Negative Review Shield</span>
              </span>
            </div>
          </div>

          {/* Interactive Live Hero Simulator */}
          <div className="mt-14 max-w-4xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-slate-800 to-slate-900/60 shadow-2xl border border-slate-800">
            <div className="rounded-[22px] bg-slate-950 p-6 sm:p-8">
              <div className="text-center mb-6">
                <span className="text-xs font-mono uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  Interactive Simulator: Try It Now
                </span>
                <h3 className="text-lg font-bold text-white mt-2">
                  See how simple it is for your customers:
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Simulator Left: Customer Controls */}
                <div className="space-y-5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      1. Customer Selects Star Rating:
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setDemoRating(star)}
                          className="p-1 transition-transform active:scale-125"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              demoRating >= star
                                ? 'fill-blue-400 text-blue-400'
                                : 'text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-blue-400 ml-2">
                        {demoRating === 5 ? '5.0 ★ Excellent!' : `${demoRating}.0 ★`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      2. Customer Taps Quick Highlights:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'Pizza', label: '🍕 Wood-Fired Pizza' },
                        { key: 'Staff', label: '⚡ Attentive Staff' },
                        { key: 'Ambiance', label: '🕯️ Cozy Ambiance' },
                        { key: 'Dessert', label: '🍮 Tiramisu' },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => toggleDemoChip(item.key)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                            demoChips.includes(item.key)
                              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      3. Instant 1-Click Copy & Google Redirect:
                    </label>
                    <button
                      onClick={handleDemoCopy}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      {demoCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{demoCopied ? 'Copied to Clipboard!' : 'Copy Review & Post on Google'}</span>
                    </button>
                  </div>
                </div>

                {/* Simulator Right: Live Generated Output */}
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Dynamically Formed Review</span>
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">Zero Typing Required</span>
                    </div>

                    <div className="pt-3 min-h-[90px] text-xs text-slate-200 font-mono leading-relaxed">
                      &quot;{getSimulatedReviewText()}&quot;
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Google Places URL:</span>
                      <span className="font-mono text-blue-400">search.google.com/local/writereview...</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Smart Guard:</strong> If a customer ever selects 1-3 stars, the system automatically swaps to a private owner grievance form so complaints never land on your public Google profile.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-400">
              The Google Review Dilemma
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Why 90% of Your Happy Customers Leave Without Reviewing
            </h2>
            <p className="text-sm text-slate-400">
              Leaving a review traditionally requires too many steps and mental friction. ReviewPulse AI cuts down 6 friction points into 1 seamless tap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* The Old Way */}
            <div className="rounded-3xl p-8 bg-slate-900/40 border border-rose-500/20 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
                  ✕
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">The Old Painful Way</h3>
                  <p className="text-xs text-rose-400">High friction, 95% bounce rate</p>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Customer has to open browser or Google Maps app manually</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Types business name and risks choosing the wrong branch</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Hunts for the hidden &quot;Write a review&quot; button</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Stares at a blank text box, unsure what to write, and closes tab</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Unhappy customers always find a way to leave 1-star rants publicly</span>
                </li>
              </ul>
            </div>

            {/* The ReviewPulse AI Way */}
            <div className="rounded-3xl p-8 bg-slate-900/90 border border-blue-500/30 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">The ReviewPulse AI Way</h3>
                  <p className="text-xs text-blue-400">70%+ conversion rate in 15 seconds</p>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Customer scans desk tent QR code instantly with camera</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>One tap on 5-stars pre-selects genuine positive sentiment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Tapping 2 smart chips writes a full, keyword-rich sentence</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>One tap auto-copies text and opens Google Write Review scheme</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Negative 1-3 star ratings are caught privately so you can fix issues</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Solutions Showcase */}
      <section id="features" className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-400">
              Tailored For Every Physical Business
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Pre-Configured Smart Chips For Your Industry
            </h2>
            <p className="text-sm text-slate-400">
              Select your business type to see how ReviewPulse structures authentic reviews highlighting your unique strengths.
            </p>
          </div>

          {/* Industry Tab Buttons */}
          <div className="flex justify-center flex-wrap gap-3 mb-10">
            {(['restaurant', 'clinic', 'salon', 'auto'] as const).map((key) => {
              const item = industryData[key];
              const Icon = item.icon;
              const isActive = activeIndustry === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveIndustry(key)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Industry Tab Content Card */}
          <div className="max-w-3xl mx-auto rounded-3xl p-8 bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">{industryData[activeIndustry].name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{industryData[activeIndustry].quote}</p>
                </div>
                <Link
                  href="/register?plan=pro"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
                >
                  <span>Start with Pro Funnel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Sample High-Converting Chips:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {industryData[activeIndustry].chips.map((chip, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200 text-center"
                    >
                      {chip}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span>Fully editable in your Client Dashboard</span>
                </span>
                <span className="font-mono text-emerald-400">Active Template</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-2xl">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
              <span className="text-xs font-semibold tracking-wider uppercase text-blue-400 flex items-center justify-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                <span>Interactive ROI Calculator</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Calculate Your Review Growth & Revenue Impact
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                See how many verified 5-star Google reviews you can generate this month and the revenue uplift from climbing Google Maps search results.
              </p>
            </div>

            <div className="space-y-8">
              {/* Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-200">
                    Monthly Walk-In Customers / Patients:
                  </label>
                  <span className="text-lg font-black text-blue-400 font-mono">
                    {monthlyCustomers.toLocaleString()} customers
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="100"
                  value={monthlyCustomers}
                  onChange={(e) => setMonthlyCustomers(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>200 (Boutique)</span>
                  <span>2,500 (Bustling Venue)</span>
                  <span>5,000+ (High Volume)</span>
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <p className="text-xs font-medium text-slate-400">Estimated New Reviews / Mo</p>
                  <p className="text-3xl font-black text-blue-400 font-mono">+{estimatedReviews}</p>
                  <p className="text-[11px] text-emerald-400">~12% scan-to-post rate</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <p className="text-xs font-medium text-slate-400">Google Maps Rank Jump</p>
                  <p className="text-3xl font-black text-white font-mono">Top #3</p>
                  <p className="text-[11px] text-blue-400">Local 3-Pack placement</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <p className="text-xs font-medium text-slate-400">Projected Revenue Uplift</p>
                  <p className="text-3xl font-black text-emerald-400 font-mono">+${estimatedRevenue.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">Harvard Business School study</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="pricing" className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Instant Activation • Secure Razorpay & UPI Gateway</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Invest in Reviews That Pay For Themselves
            </h2>
            <p className="text-sm text-slate-400">
              Just one extra customer a month pays for your entire year. Cancel anytime with zero contracts.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-xs font-semibold ${!annualBilling ? 'text-white' : 'text-slate-400'}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className="w-12 h-6 rounded-full bg-slate-800 p-1 flex items-center transition-colors focus:outline-none border border-slate-700 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-blue-600 transition-transform ${
                    annualBilling ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${annualBilling ? 'text-white' : 'text-slate-400'} flex items-center gap-1.5`}>
                <span>Annual Billing</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  SAVE 20%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="rounded-3xl p-8 bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter Solo</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                    Instant Activation
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">Boutique Local</h3>
                <p className="text-xs text-slate-400">Ideal for single-location cafes, salons, clinics, gyms & local shops.</p>
                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white font-mono">
                      ₹{annualBilling ? '399' : '499'}
                    </span>
                    <span className="text-xs text-slate-400"> / month</span>
                  </div>
                  {annualBilling && (
                    <p className="text-[11px] text-emerald-400 font-medium mt-1">
                      Billed annually (₹4,788/yr) • 2 Months Free
                    </p>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>1 Business Location</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Unlimited QR Scans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Interactive 1-5 Star Review Portal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Direct Google Place ID & Maps Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Up to 6 Custom Smart Review Chips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Live Gemini AI Review Writer & Polish</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Private Negative Review Shield (1-3★)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Private Feedback Inbox in Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Instant High-Res QR Code Generator</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register?plan=starter"
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-colors shadow-md"
              >
                Get Started with Starter (₹{annualBilling ? '399' : '499'}/mo)
              </Link>
            </div>

            {/* Pro Plan - Highlighted */}
            <div className="rounded-3xl p-8 bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/20 border-2 border-blue-500 shadow-2xl shadow-blue-500/10 space-y-6 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                Most Popular Choice
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Pro Growth</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    Instant Activation
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">Fast-Growing Business</h3>
                <p className="text-xs text-slate-400">For busy gyms, fitness centers, multi-chair clinics & restaurants.</p>
                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white font-mono">
                      ₹{annualBilling ? '799' : '999'}
                    </span>
                    <span className="text-xs text-slate-400"> / month</span>
                  </div>
                  {annualBilling && (
                    <p className="text-[11px] text-emerald-400 font-medium mt-1">
                      Billed annually (₹9,588/yr) • Best Value
                    </p>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-200 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Up to 3 Business Locations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Unlimited QR Scans & Live Gemini AI</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Unlimited Smart Review Chips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>All Category Presets (Gym, Salon, Dining, Auto)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Feedback Status Tracking (New, Reviewed, Resolved)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Interactive Scan vs Review Conversion Analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Custom Brand Theme Colors & Welcome Message</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>High-Resolution PNG & SVG QR Code Export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Multi-Location Switcher in Dashboard</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register?plan=pro"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center shadow-lg shadow-blue-500/25 transition-all hover:scale-102"
              >
                Get Started with Pro (₹{annualBilling ? '799' : '999'}/mo)
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-3xl p-8 bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Enterprise</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                    Instant Activation
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">Franchise & Agency</h3>
                <p className="text-xs text-slate-400">For multi-unit gym chains, dental groups & marketing agencies.</p>
                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white font-mono">
                      ₹{annualBilling ? '1,999' : '2,499'}
                    </span>
                    <span className="text-xs text-slate-400"> / month</span>
                  </div>
                  {annualBilling && (
                    <p className="text-[11px] text-emerald-400 font-medium mt-1">
                      Billed annually (₹23,988/yr)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Up to 10 Locations (Expandable)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Central Super-Admin Platform Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Global Multi-Tenant Overview & Telemetry</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Business Directory with Active/Paused Toggles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Instant Business Provisioning Modal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Full Pro Features across All 10 Locations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Direct Access to Location Portals & Settings</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register?plan=enterprise"
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-colors shadow-md"
              >
                Get Started with Enterprise
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-400">
              Verified Case Studies
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Trusted by 1,200+ Local Storefronts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center gap-1 text-blue-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-blue-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &quot;We went from 48 Google reviews over 2 years to over 420 reviews in just 60 days. Our weekend dinner reservations are now completely booked 3 weeks out. The table stands paid for themselves in 48 hours.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-3xl">🍝</span>
                <div>
                  <p className="text-xs font-bold text-white">Marco Rossi</p>
                  <p className="text-[11px] text-slate-400">Owner, The Rustic Spoon Bistro</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center gap-1 text-blue-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-blue-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &quot;Patients love how quick it is right after hygiene cleanings. The private feedback shield saved us twice when patients had an insurance question that would have otherwise ended up as a 1-star rant.&quot;
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="text-3xl">🦷</span>
                <div>
                  <p className="text-xs font-bold text-white">Dr. Elena Carter</p>
                  <p className="text-[11px] text-slate-400">Founder, Lumina Dental & Aesthetics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-400">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Everything You Need To Know
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Does this comply with Google’s Review Policies?',
                a: 'Yes, 100%. ReviewPulse AI does not bribe, gate, or offer monetary rewards for reviews. Customers are always free to navigate directly to Google, and our tool acts as an assistive natural-language builder to make writing reviews effortless.'
              },
              {
                q: 'How does the "Post on Google" clipboard feature work?',
                a: 'When a customer taps "Post on Google", their synthesized review text is copied to their phone’s clipboard instantly, and our system immediately redirects them to the official Google Place Review Scheme URL (https://search.google.com/local/writereview?placeid=...). The customer simply pastes and taps Post in under 2 seconds.'
              },
              {
                q: 'What hardware do I need?',
                a: 'Zero special hardware! You can download high-resolution PNG or SVG QR codes immediately from your dashboard and print our included tabletop stand layout on regular cardstock or display them on counter tablets.'
              },
              {
                q: 'How does plan activation and payment work?',
                a: 'When you create an account, you can select your plan and activate it instantly using our integrated Indian payment gateway (Razorpay). We support UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cards with instant activation and receipts.'
              },
              {
                q: 'What payment methods are supported in India?',
                a: 'We support all major Indian payment gateways including UPI (Google Pay, PhonePe, Paytm), Net Banking, Credit/Debit cards, and UPI Autopay mandates.'
              },
              {
                q: 'How does the Private Negative Review Shield work?',
                a: 'If a customer selects 1, 2, or 3 stars, the interface smoothly prompts them to send private, confidential feedback directly to the business owner instead of posting to Google. This gives you a chance to resolve customer grievances privately before public damage occurs.'
              }
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white focus:outline-none cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-10 sm:p-14 bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-950 border border-blue-500/30 text-white shadow-2xl relative overflow-hidden text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to Dominate Your Local Google Search Results?
            </h2>
            <p className="text-sm sm:text-base font-medium max-w-xl mx-auto text-slate-300">
              Join over 1,200 physical storefronts getting dozens of fresh 5-star reviews every week. Set up in under 3 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                Get Started Free Today
              </Link>
              <Link
                href={`/r/${currentBusiness.slug}`}
                target="_blank"
                className="w-full sm:w-auto px-7 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl backdrop-blur-md transition-all"
              >
                Scan Customer Preview
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
