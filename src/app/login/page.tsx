'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ShieldCheck, Store, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, immediately redirect to respective portal
  React.useEffect(() => {
    async function checkExistingAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            router.push(data.user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard');
            return;
          }
        }
      } catch {
        // Fallback
      } finally {
        setCheckingAuth(false);
      }
    }
    checkExistingAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      toast.success('Welcome back! Signing you in...', 'Login Successful');
      router.push(data.redirectUrl || '/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      toast.error(msg, 'Sign In Failed');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            ReviewPulse <span className="text-blue-400">AI</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to your account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Access your real-time review analytics and QR funnel studio
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Reviewer Logins */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-xs font-medium text-slate-300 mb-1 text-center">
              Pre-seeded Reviewer Accounts
            </p>
            <p className="text-[11px] text-slate-500 mb-3 text-center">
              Sign in to evaluate existing portals, or <Link href="/register?plan=pro" className="text-blue-400 hover:underline">register a new business</Link> to test the live Razorpay payment flow.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillQuickLogin('admin@reviewpulse.ai', 'Admin@123456')}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 text-xs flex items-center justify-between text-slate-300 transition-colors cursor-pointer gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white whitespace-nowrap">Super Admin</span>
                  <span className="text-slate-400 text-[11px] truncate">(admin@reviewpulse.ai)</span>
                </div>
                <span className="text-blue-400 font-medium text-[11px] shrink-0">Select</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickLogin('owner@bellarestaurant.com', 'Owner@123456')}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 text-xs flex items-center justify-between text-slate-300 transition-colors cursor-pointer gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Store className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white truncate">Bella Restaurant Owner</span>
                </div>
                <span className="text-blue-400 font-medium text-[11px] shrink-0">Select</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickLogin('contact@apexdental.com', 'Dental@123456')}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 text-xs flex items-center justify-between text-slate-300 transition-colors cursor-pointer gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Store className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-semibold text-white truncate">Apex Dental Owner</span>
                </div>
                <span className="text-blue-400 font-medium text-[11px] shrink-0">Select</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4">
              Register business
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
