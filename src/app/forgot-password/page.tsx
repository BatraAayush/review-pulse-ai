'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Inbox,
  ShieldCheck,
} from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import { useToast } from '@/components/ToastContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'otp' | 'new-password' | 'success'>('email');

  // Form values
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Input refs for 6-box OTP inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Derived joined 6-digit OTP string
  const otp = otpDigits.join('');

  // States
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer for OTP resend
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus first OTP box automatically upon reaching step 'otp'
  useEffect(() => {
    if (step === 'otp') {
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 80);
    }
  }, [step]);

  // Handle individual OTP digit box changes
  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // If multiple digits pasted or typed
    if (cleaned.length > 1) {
      handlePastedCode(cleaned, index);
      return;
    }

    const next = [...otpDigits];
    next[index] = cleaned[0];
    setOtpDigits(next);
    setError(null);

    // Auto-advance to next box if digit entered
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle pasting code (splits digits across all boxes)
  const handlePastedCode = (pasted: string, startIndex: number = 0) => {
    const digitsOnly = pasted.replace(/\D/g, '').slice(0, 6);
    if (!digitsOnly) return;

    const next = [...otpDigits];
    for (let i = 0; i < digitsOnly.length; i++) {
      const targetIdx = startIndex + i < 6 ? startIndex + i : i;
      next[targetIdx] = digitsOnly[i];
    }
    setOtpDigits(next);
    setError(null);

    const nextFocus = Math.min(startIndex + digitsOnly.length, 5);
    inputRefs.current[nextFocus]?.focus();
  };

  // Keyboard navigation (backspace to previous box, arrow keys)
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Box already empty, move to previous box and clear it
        const next = [...otpDigits];
        next[index - 1] = '';
        setOtpDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...otpDigits];
        next[index] = '';
        setOtpDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    handlePastedCode(pasted, index);
  };

  // Step 1: Request OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      const msg = data.message || `Verification code sent to ${email.trim()}`;
      setSuccessMsg(msg);
      toast.success(msg, 'Code Dispatched');
      setCountdown(60);
      setStep('otp');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      toast.error(msg, 'Error Sending OTP');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError(null);
    setResending(true);

    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      const msg = `A fresh verification code has been dispatched to ${email.trim()}.`;
      setSuccessMsg(msg);
      toast.success(msg, 'Fresh Code Sent');
      setCountdown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code';
      setError(msg);
      toast.error(msg, 'Resend Failed');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (otp.length !== 6) {
      const msg = 'Please fill all 6 boxes with the verification code sent to your email';
      setError(msg);
      toast.error(msg, 'Incomplete Code');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setSuccessMsg('Code verified! Please set your new password.');
      toast.success('Code verified! Please set your new password.', 'Verified');
      setStep('new-password');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code';
      setError(msg);
      toast.error(msg, 'Invalid Code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      const msg = 'New password must be at least 6 characters long';
      setError(msg);
      toast.error(msg, 'Validation Error');
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg);
      toast.error(msg, 'Validation Error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success('Your password has been reset successfully! You can now log in.', 'Password Reset');
      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password';
      setError(msg);
      toast.error(msg, 'Reset Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Dedicated Minimalist Auth Header */}
      <AuthHeader type="forgot-password" />

      <main className="flex-1 flex flex-col justify-center py-10 sm:py-14 sm:px-6 lg:px-8 relative z-10">
        {/* Header Content */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Account Security</span>
          </div>

          {/* Step indicator breadcrumbs */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div
            className={`w-7 h-1.5 rounded-full transition-all ${
              step === 'email' ? 'bg-blue-500 w-10' : 'bg-slate-800'
            }`}
          />
          <div
            className={`w-7 h-1.5 rounded-full transition-all ${
              step === 'otp' ? 'bg-blue-500 w-10' : 'bg-slate-800'
            }`}
          />
          <div
            className={`w-7 h-1.5 rounded-full transition-all ${
              step === 'new-password' ? 'bg-blue-500 w-10' : 'bg-slate-800'
            }`}
          />
          <div
            className={`w-7 h-1.5 rounded-full transition-all ${
              step === 'success' ? 'bg-emerald-500 w-10' : 'bg-slate-800'
            }`}
          />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          {step === 'email' && 'Forgot your password?'}
          {step === 'otp' && 'Check your email inbox'}
          {step === 'new-password' && 'Create new password'}
          {step === 'success' && 'Password reset complete!'}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {step === 'email' && "Enter your registered email and we'll send a 6-digit verification code to your inbox."}
          {step === 'otp' && `We sent a 6-digit verification code to ${email}`}
          {step === 'new-password' && 'Choose a strong password with at least 6 characters.'}
          {step === 'success' && 'Your credentials have been updated. You can now log in.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && step !== 'success' && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: ENTER EMAIL */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Account Work Email
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending email verification code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY OTP (SEGMENTED 6 BOXES INPUT) */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* Inbox instruction notice */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <Inbox className="w-4 h-4 text-blue-400" />
                  <span>Check your email</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  We sent a 6-digit code to <strong className="text-white">{email}</strong>. Check your inbox (and spam or junk folder) and enter each digit in the boxes below.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Enter 6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setError(null);
                    }}
                    className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                {/* 6 Individual Digit Boxes */}
                <div className="grid grid-cols-6 gap-2 sm:gap-2.5 py-1">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      onPaste={(e) => handleDigitPaste(e, idx)}
                      className={`w-full h-12 sm:h-14 text-center font-mono font-black text-xl sm:text-2xl rounded-xl transition-all outline-none select-none ${
                        digit
                          ? 'bg-slate-900 border-2 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-slate-950/80 border-2 border-slate-800 text-slate-300 hover:border-slate-700'
                      } focus:border-blue-400 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/20`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  Tip: You can paste the whole 6-digit code directly into the first box.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Didn&apos;t receive the email?</span>
                <button
                  type="button"
                  disabled={countdown > 0 || resending}
                  onClick={handleResendOtp}
                  className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 disabled:text-slate-600 disabled:cursor-not-allowed cursor-pointer"
                >
                  {resending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    'Resend Email'
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Start Over</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {step === 'new-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password & Complete</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Password Reset Successfully</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Your password has been securely updated. You can now use your new password to access your dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
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
