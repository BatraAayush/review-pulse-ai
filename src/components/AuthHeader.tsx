'use client';

import React from 'react';
import Link from 'next/link';
import { QrCode, ArrowLeft, ShieldCheck, ArrowRight } from 'lucide-react';

interface AuthHeaderProps {
  type: 'login' | 'register' | 'forgot-password';
}

export default function AuthHeader({ type }: AuthHeaderProps) {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Back to Home */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Review<span className="text-blue-400">Pulse</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hidden sm:inline-block">
                  AI SaaS
                </span>
              </div>
            </Link>

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors pl-3 border-l border-slate-800 py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Center Trust Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-Bit Encrypted • Direct Google Place Scheme</span>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            {type === 'login' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">New to ReviewPulse?</span>
                <Link
                  href="/register?plan=starter"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 hover:bg-blue-600/25 hover:text-blue-300 transition-all cursor-pointer"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {type === 'register' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">Already registered?</span>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {type === 'forgot-password' && (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

