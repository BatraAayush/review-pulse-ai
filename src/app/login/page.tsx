'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Store, 
  Lock, 
  Mail, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  ChevronDown 
} from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import { useToast } from '@/components/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, immediately redirect to respective portal
  useEffect(() => {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Minimalist Dedicated Auth Header */}
      <AuthHeader type="login" />

      {/* Main Login Form Container */}
      <main className="flex-1 flex flex-col justify-center py-10 sm:py-14 sm:px-6 lg:px-8 relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Welcome Back</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sign in to ReviewPulse AI
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Access your real-time review analytics and QR funnel studio
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
                    Remember my session for 30 days
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Reviewer Logins Accordion */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>One-Click Demo Sandbox Accounts</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showDemoAccounts ? 'rotate-180 text-blue-400' : ''}`} />
              </button>

              {showDemoAccounts && (
                <div className="mt-3 space-y-2 animate-in fade-in-50 duration-150">
                  <p className="text-[11px] text-slate-400 mb-2">
                    Click any pre-seeded profile to evaluate specific portal capabilities:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => fillQuickLogin('admin@reviewpulse.ai', 'Admin@123456')}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 text-xs flex items-center justify-between text-slate-300 transition-all cursor-pointer gap-2 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">Super Admin</p>
                          <p className="text-slate-500 text-[10px] font-mono truncate">admin@reviewpulse.ai</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-blue-400 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 shrink-0">
                        Fill Demo
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fillQuickLogin('owner@bellarestaurant.com', 'Owner@123456')}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 text-xs flex items-center justify-between text-slate-300 transition-all cursor-pointer gap-2 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <Store className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">Bella Restaurant Owner</p>
                          <p className="text-slate-500 text-[10px] font-mono truncate">owner@bellarestaurant.com</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-blue-400 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 shrink-0">
                        Fill Demo
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fillQuickLogin('contact@apexdental.com', 'Dental@123456')}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 text-xs flex items-center justify-between text-slate-300 transition-all cursor-pointer gap-2 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                          <Store className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">Apex Dental Owner</p>
                          <p className="text-slate-500 text-[10px] font-mono truncate">contact@apexdental.com</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-blue-400 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 shrink-0">
                        Fill Demo
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              Don&apos;t have an account yet?{' '}
              <Link href="/register?plan=starter" className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4">
                Register business free
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimal Auth Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500 relative z-10">
        <p>© {new Date().getFullYear()} ReviewPulse AI Micro-SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}
