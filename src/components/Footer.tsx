'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QrCode, Sparkles, Shield, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Hide on customer review page
  if (pathname.startsWith('/r/')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 p-[1px]">
                <div className="h-full w-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                Review<span className="text-blue-400">Pulse</span> AI
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              The turn-key Micro-SaaS platform empowering physical businesses to capture 5-star Google reviews seamlessly at the point of sale.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Google Places API v3 Active</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Application
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Agency Landing Page
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors flex items-center gap-1">
                  Business Client Portal
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors flex items-center gap-1">
                  Super-Admin Panel
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link href="/register?plan=pro" className="hover:text-white transition-colors">
                  Create Business Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions for */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Industries
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/register?category=restaurant&plan=pro" className="hover:text-white transition-colors">
                  Restaurants & Cafes
                </Link>
              </li>
              <li>
                <Link href="/register?category=clinic&plan=pro" className="hover:text-white transition-colors">
                  Dental & Medical Clinics
                </Link>
              </li>
              <li>
                <Link href="/register?category=salon&plan=pro" className="hover:text-white transition-colors">
                  Salons, Spas & Wellness
                </Link>
              </li>
              <li>
                <Link href="/register?category=automotive&plan=pro" className="hover:text-white transition-colors">
                  Auto Repair & Dealerships
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Security & Stack
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Engineered with Next.js 16 App Router, Tailwind CSS, TypeScript, and Google URL write-review scheme.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Private Negative Feedback Shield</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Smart Template Chip Synthesis</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ReviewPulse AI Micro-SaaS. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Built with precision & high aesthetic standards</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>
      </div>
    </footer>
  );
}
