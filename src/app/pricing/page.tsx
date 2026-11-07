'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthContext';
import {
  ShieldCheck,
  Check,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Building2,
  QrCode,
  Zap,
  Calculator
} from 'lucide-react';

const FAQS = [
  {
    q: 'Can I change my plan or upgrade later?',
    a: 'Yes, you can upgrade, downgrade, or switch billing cycles anytime directly from your Merchant Dashboard. Plan upgrades take effect immediately with pro-rated billing.',
  },
  {
    q: 'How does the Private Negative Review Shield work?',
    a: 'When an unhappy customer selects 1 to 3 stars, they are seamlessly guided to a private feedback form that alerts management immediately via email and your private dashboard inbox, protecting your public Google rating.',
  },
  {
    q: 'Are there any hidden transaction fees or scan limits?',
    a: 'None! Every plan includes unlimited customer QR scans and review submissions. You pay only the flat monthly or annual subscription fee.',
  },
  {
    q: 'How does the Multi-Location Network Manager work?',
    a: 'Pro tier includes up to 3 separate branch locations, and Franchise & Agency tier supports up to 10 locations. You can switch between branches with 1 click inside your central dashboard.',
  },
  {
    q: 'Do you offer custom printed physical NFC standees?',
    a: 'Yes! Pro and Enterprise tiers include print-ready ultra-high resolution vector QR assets, and our hardware team provisions custom laser-engraved NFC acrylic and wooden stands with express delivery.',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // ROI Calculator interactive state
  const [monthlyFootfall, setMonthlyFootfall] = useState(800);
  const [averageTicket, setAverageTicket] = useState(650);

  // Derived ROI calculations
  const estimatedScans = Math.round(monthlyFootfall * 0.18);
  const estimatedReviews = Math.round(estimatedScans * 0.65);
  const estimatedNewRevenue = Math.round(estimatedReviews * averageTicket * 0.4);

  const getPlanActionUrl = (planKey: 'starter' | 'pro' | 'enterprise') => {
    if (user) {
      return `/dashboard?tab=billing&plan=${planKey}`;
    }
    return `/register?plan=${planKey}`;
  };

  const getPlanActionLabel = (planKey: 'starter' | 'pro' | 'enterprise') => {
    if (user) {
      return 'Manage in Dashboard →';
    }
    if (planKey === 'starter') return 'Start with Starter';
    if (planKey === 'pro') return 'Get Started with Pro';
    return 'Choose Enterprise';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-20">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Transparent Indian Market Pricing • Instant Activation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Predictable Plans for Growing <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Local Businesses</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Boost verified 5-star Google reviews, shield against negative ratings, and deploy AI keyword chips. Switch or cancel anytime with zero lock-in.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-6 flex items-center justify-center gap-3">
            <span className={`text-xs font-semibold ${!billingAnnual ? 'text-white' : 'text-slate-400'}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setBillingAnnual(!billingAnnual)}
              aria-label="Toggle annual billing"
              className="w-12 h-6 rounded-full bg-slate-800 p-1 flex items-center transition-colors focus:outline-none border border-slate-700 cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-full bg-blue-600 transition-transform ${
                  billingAnnual ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold ${billingAnnual ? 'text-white' : 'text-slate-400'} flex items-center gap-1.5`}>
              <span>Annual Billing</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                SAVE 20%
              </span>
            </span>
          </div>
        </div>

        {/* 3 Tier Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* TIER 1: STARTER SOLO */}
          <div className="rounded-3xl p-6 sm:p-8 bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-6 shadow-xl backdrop-blur-xl">
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter Solo</span>
                <h3 className="text-xl font-bold text-white">Single Location</h3>
                <p className="text-xs text-slate-400">
                  Ideal for standalone cafes, boutique salons, and neighborhood dental clinics.
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white font-mono">
                    ₹{billingAnnual ? '399' : '499'}
                  </span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                {billingAnnual ? (
                  <p className="text-[11px] text-emerald-400 font-medium mt-1">Billed annually (₹4,788/yr)</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">Billed monthly • Cancel anytime</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">What is included:</p>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>1 Business Location</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Unlimited</strong> QR Scans & Reviews</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Private Negative Review Shield (1-3★)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Smart Review Keyword Chips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Vector QR Code Generator (PNG)</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link
              href={getPlanActionUrl('starter')}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all shadow-sm"
            >
              {getPlanActionLabel('starter')}
            </Link>
          </div>

          {/* TIER 2: PRO GROWTH (FEATURED) */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border-2 border-blue-500/60 shadow-2xl shadow-blue-500/10 flex flex-col justify-between gap-6">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
              Most Popular Choice
            </div>

            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Pro Growth</span>
                <h3 className="text-xl font-bold text-white">Multi-Branch Outlets</h3>
                <p className="text-xs text-slate-300">
                  Engineered for high-footfall restaurants, fitness studios, and expanding retail chains.
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white font-mono">
                    ₹{billingAnnual ? '799' : '999'}
                  </span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                {billingAnnual ? (
                  <p className="text-[11px] text-emerald-400 font-medium mt-1">Billed annually (₹9,588/yr)</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">Billed monthly • Cancel anytime</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-300">Everything in Starter, plus:</p>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span><strong>Up to 3 Separate Locations</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Gemini AI Sentiment & Keyword Engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Instant 1-Click Multi-Branch Switcher</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Print-Ready High-Res SVG & PNG Vector Assets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Priority WhatsApp & Email Support (2h SLA)</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link
              href={getPlanActionUrl('pro')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:brightness-110 text-white font-bold text-xs text-center shadow-lg shadow-blue-500/25 transition-all"
            >
              {getPlanActionLabel('pro')}
            </Link>
          </div>

          {/* TIER 3: FRANCHISE & AGENCY */}
          <div className="rounded-3xl p-6 sm:p-8 bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-6 shadow-xl backdrop-blur-xl">
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Franchise & Agency</span>
                <h3 className="text-xl font-bold text-white">10 Locations & Portals</h3>
                <p className="text-xs text-slate-400">
                  Built for marketing agencies, franchise groups, and multi-city brands.
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white font-mono">
                    ₹{billingAnnual ? '1,999' : '2,499'}
                  </span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                {billingAnnual ? (
                  <p className="text-[11px] text-emerald-400 font-medium mt-1">Billed annually (₹23,988/yr)</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">Billed monthly • Cancel anytime</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Everything in Pro, plus:</p>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Up to 10 Managed Outlets</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Super Admin Central Telemetry & Scans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom NFC Standees Concierge Provisioning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom Keyword Chip Presets & Templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dedicated Technical Account Manager</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link
              href={getPlanActionUrl('enterprise')}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all shadow-sm"
            >
              {getPlanActionLabel('enterprise')}
            </Link>
          </div>
        </div>

        {/* Complete Feature Comparison Table */}
        <div className="rounded-3xl p-6 sm:p-8 bg-slate-900/60 border border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Full Plan Comparison</h2>
              <p className="text-xs text-slate-400">Detailed breakdown of capabilities across all subscription tiers.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Feature</th>
                  <th className="py-3.5 px-4 text-center">Starter Solo</th>
                  <th className="py-3.5 px-4 text-center text-blue-400 font-bold">Pro Growth</th>
                  <th className="py-3.5 px-4 text-center">Franchise & Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Included Branches / Locations</td>
                  <td className="py-3 px-4 text-center">1 Location</td>
                  <td className="py-3 px-4 text-center text-blue-300 font-bold">Up to 3 Locations</td>
                  <td className="py-3 px-4 text-center">Up to 10 Locations</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Monthly QR Scans & Review Funnels</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-semibold">Unlimited</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-semibold">Unlimited</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-semibold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Private Negative Review Shield (1-3★)</td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Smart Keyword Chips Generator</td>
                  <td className="py-3 px-4 text-center">Up to 10 Chips</td>
                  <td className="py-3 px-4 text-center text-blue-300 font-bold">Up to 25 Chips</td>
                  <td className="py-3 px-4 text-center">Unlimited Custom Packs</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Gemini AI Anti-Spam Polish Engine</td>
                  <td className="py-3 px-4 text-center">Standard</td>
                  <td className="py-3 px-4 text-center text-blue-300 font-bold">Advanced Gemini Pro</td>
                  <td className="py-3 px-4 text-center">Gemini Pro + Custom Tone</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Printable QR Code Studio (PNG & SVG)</td>
                  <td className="py-3 px-4 text-center">PNG Export</td>
                  <td className="py-3 px-4 text-center text-blue-300 font-bold">High-Res PNG + SVG Vector</td>
                  <td className="py-3 px-4 text-center">Ultra-HD SVG + Print Cards</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Custom NFC Tap Hardware Support</td>
                  <td className="py-3 px-4 text-center">Standard Order</td>
                  <td className="py-3 px-4 text-center text-blue-300 font-bold">Priority Production</td>
                  <td className="py-3 px-4 text-center">Dedicated Hardware Concierge</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Support SLA</td>
                  <td className="py-3 px-4 text-center">Email Support (24h)</td>
                  <td className="py-3 px-4 text-center text-blue-300 font-bold">Priority WhatsApp & Email (2h)</td>
                  <td className="py-3 px-4 text-center">24/7 Dedicated Support</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive ROI Calculator */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Interactive Local Business ROI Estimator</h2>
              <p className="text-xs text-slate-400">See how fast a consistent stream of 5-star Google reviews pays for itself.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Monthly In-Store Footfall / Customers:</span>
                  <span className="text-blue-400 font-mono font-bold">{monthlyFootfall} customers</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={monthlyFootfall}
                  onChange={(e) => setMonthlyFootfall(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">Average Order / Bill Value:</span>
                  <span className="text-emerald-400 font-mono font-bold">₹{averageTicket}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={averageTicket}
                  onChange={(e) => setAverageTicket(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Monthly Scans</p>
                <p className="text-xl sm:text-2xl font-black text-white font-mono mt-1">~{estimatedScans}</p>
                <p className="text-[10px] text-slate-500">at 18% tap rate</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-400">5★ Reviews</p>
                <p className="text-xl sm:text-2xl font-black text-blue-400 font-mono mt-1">+{estimatedReviews}</p>
                <p className="text-[10px] text-slate-500">monthly on Google</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-400">Est. Uplift</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">₹{estimatedNewRevenue.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-500">per month</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Everything you need to know about billing, multi-location plans, and security.</p>
          </div>

          <div className="space-y-3.5">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.q}
                  className={`rounded-2xl border transition-all duration-150 ease-out overflow-hidden ${
                    isOpen
                      ? 'bg-gradient-to-b from-slate-900 via-slate-900/95 to-blue-950/20 border-blue-500/40 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/20'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-white hover:text-blue-300 transition-colors cursor-pointer group"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-150 ease-out ${
                        isOpen
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20 rotate-180'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700/60 group-hover:text-white group-hover:border-slate-600 rotate-0'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4 transition-transform duration-150 ease-out" />
                    </div>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-150 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/40 pt-3 transition-opacity duration-150 ease-out">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Card - Premium Slate Obsidian with Subtle Top Highlight */}
        <div className="rounded-3xl p-[1px] bg-gradient-to-b from-slate-700/60 via-slate-800/40 to-slate-900/80 shadow-2xl">
          <div className="rounded-[23px] bg-slate-900/95 backdrop-blur-xl px-6 py-10 sm:px-12 sm:py-14 text-center space-y-6 relative overflow-hidden">
            {/* Subtle top ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Instant Activation • Zero Setup Fees</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                Ready to Dominate <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200 bg-clip-text text-transparent">Local Google Maps Search?</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
                Join growing local restaurants, cafes, clinics, and businesses getting fresh 5-star reviews every week. Set up in under 3 minutes.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={user ? (user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard') : '/register?plan=pro'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>{user ? 'Go to Dashboard' : 'Get Started with Pro'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>Talk to Sales & Support</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

