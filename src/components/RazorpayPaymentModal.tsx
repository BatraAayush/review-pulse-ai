'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  Sparkles,
  Loader2,
  Lock,
  ArrowRight,
  AlertCircle,
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ToastContext';
import { PlanKey, BillingCycle, PLANS_CONFIG } from '@/lib/payment';

interface RazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanKey;
  billingCycle: BillingCycle;
  businessId?: string;
  businessName?: string;
  onPaymentSuccess: () => void;
}

export default function RazorpayPaymentModal({
  isOpen,
  onClose,
  plan,
  billingCycle,
  businessId,
  businessName,
  onPaymentSuccess,
}: RazorpayPaymentModalProps) {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and dismiss on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  const handleCopyCard = () => {
    navigator.clipboard.writeText('4386289407660153');
    setCopiedCard(true);
    toast.success('Domestic test card copied to clipboard!', 'Card Copied');
    setTimeout(() => setCopiedCard(false), 2500);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('success@razorpay');
    setCopiedUpi(true);
    toast.success('Test UPI ID copied to clipboard!', 'UPI Copied');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const planConfig = PLANS_CONFIG[plan] || PLANS_CONFIG.starter;
  const isAnnual = billingCycle === 'annual';
  const totalAmount = isAnnual ? planConfig.annualTotal : planConfig.monthlyPrice;

  // Load Razorpay checkout script dynamically
  useEffect(() => {
    if (!isOpen) return;

    if ((window as any).Razorpay) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => console.warn('Could not load Razorpay SDK, simulation mode fallback will be used.');
    document.body.appendChild(script);

    return () => {
      // Keep script cached
    };
  }, [isOpen]);

  // Create order when modal opens or plan/cycle changes
  useEffect(() => {
    if (!isOpen) {
      setOrderData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function initOrder() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            billingCycle,
            businessId,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to initialize payment');
        }

        if (isMounted) {
          setOrderData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error preparing checkout');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initOrder();
    return () => {
      isMounted = false;
    };
  }, [isOpen, plan, billingCycle, businessId]);

  if (!isOpen || !mounted) return null;

  // Verification helper
  const handleVerifyPayment = async (payload: {
    orderId: string;
    paymentId?: string;
    signature?: string;
    paymentMethod?: string;
    isSimulation?: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: payload.orderId,
          paymentId: payload.paymentId,
          signature: payload.signature,
          plan,
          billingCycle,
          businessId,
          paymentMethod: payload.paymentMethod,
          isSimulation: payload.isSimulation,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Payment verification failed');
      }

      // Celebrate!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success(
        `Your ${planConfig.name} plan is now active!`,
        'Payment Successful'
      );

      onPaymentSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment verification failed';
      setError(msg);
      toast.error(msg, 'Payment Error');
    } finally {
      setLoading(false);
    }
  };

  // Launch live Razorpay popup
  const handleLaunchRazorpay = () => {
    if (!orderData || !window) return;

    if (!(window as any).Razorpay) {
      toast.error('Razorpay SDK failed to load. Please try test simulation mode.', 'Gateway Error');
      return;
    }

    try {
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ReviewPulse AI',
        description: `${planConfig.name} (${isAnnual ? 'Annual' : 'Monthly'})`,
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=128&q=80',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          await handleVerifyPayment({
            orderId: response.razorpay_order_id || orderData.orderId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            paymentMethod: 'razorpay_gateway',
            isSimulation: false,
          });
        },
        prefill: {
          name: orderData.business?.name || 'Business Owner',
          email: orderData.business?.email || 'test@reviewpulse.ai',
          contact: orderData.business?.phone || '9876543210',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment was cancelled.', 'Cancelled');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(response.error.description || 'Payment transaction failed.');
        toast.error(response.error.description || 'Payment failed', 'Transaction Failed');
      });
      rzp.open();
    } catch (err) {
      console.error('Error opening Razorpay:', err);
      toast.error('Failed to open payment gateway. You can use test mode below.', 'Error');
    }
  };

  const modalContent = (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Secure Checkout & Plan Activation"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Visual Backdrop Overlay with blur & click to dismiss */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer animate-in fade-in duration-200"
        onClick={() => {
          if (!loading) onClose();
        }}
        aria-hidden="true"
      />

      <div 
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 relative z-10 my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Secure Checkout & Plan Activation
              </h3>
              <p className="text-xs text-slate-400">
                100% RBI & UPI Compliant Indian Gateway
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Plan Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-500/25">
                {planConfig.name}
              </span>
              <h4 className="text-sm font-bold text-white mt-1">
                {businessName || 'Your Business Location'}
              </h4>
              <p className="text-xs text-slate-400">
                Billed {isAnnual ? 'Annually (20% Savings applied)' : 'Monthly'}
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-white font-mono">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-400">
                {isAnnual ? 'for 12 months' : 'for 30 days'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{planConfig.locations} {planConfig.locations === 1 ? 'Location' : 'Locations'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Unlimited QR Scans</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Live Gemini AI Polish</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Negative Review Shield</span>
            </div>
          </div>
        </div>

        {/* DIRECT EMBEDDED TEST PAYMENT GUIDE (ALWAYS VISIBLE TO REVIEWERS) */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-blue-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Razorpay Test Payment Guide
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              Test Mode Active
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Follow any of these 3 verified methods to test approval in Razorpay test mode:
          </p>

          <div className="space-y-2 text-xs">
            {/* Method 1: Netbanking */}
            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/25 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Netbanking (Fastest & Guaranteed)</span>
                </span>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click <strong>Netbanking</strong> in Razorpay pop-up ➔ Pick any bank (<strong>HDFC / ICICI / SBI</strong>) ➔ Click <strong>Pay</strong> ➔ On test screen, click green <strong>&quot;Success&quot;</strong> button.
              </p>
            </div>

            {/* Method 2: Domestic Card */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                  <span>2. Indian Domestic Card (No Block)</span>
                </span>
                <span className="text-[10px] text-slate-400">Zero international block</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="font-mono text-xs text-blue-300 font-bold select-all tracking-wider">
                  4386 2894 0766 0153
                </div>
                <button
                  type="button"
                  onClick={handleCopyCard}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-[10px] font-bold border border-blue-500/30 transition-all cursor-pointer"
                >
                  {copiedCard ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCard ? 'Copied!' : 'Copy Card'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Expiry: any future date (e.g. <code>12/28</code>) • CVV: <code>123</code> ➔ Click <strong>&quot;Success&quot;</strong> on OTP screen.
              </p>
            </div>

            {/* Method 3: UPI */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                  <span>3. UPI VPA ID</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <code className="text-emerald-400 font-mono font-bold text-xs select-all">
                  success@razorpay
                </code>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-[10px] font-bold border border-emerald-500/30 transition-all cursor-pointer"
                >
                  {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Action Section */}
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs text-slate-400 font-medium">Preparing secure gateway session...</p>
          </div>
        ) : orderData?.isSimulation ? (
          /* TEST / SIMULATION MODE SECTION */
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong>Sandbox / Test Mode Active:</strong> Instant simulation of Indian UPI & Card payments.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleVerifyPayment({
                    orderId: orderData.orderId,
                    paymentMethod: 'upi_phonepe',
                    isSimulation: true,
                  })
                }
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>Simulate Instant UPI (PhonePe / GPay / Paytm)</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleVerifyPayment({
                    orderId: orderData.orderId,
                    paymentMethod: 'card_rupay',
                    isSimulation: true,
                  })
                }
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Simulate Card Payment (RuPay / Visa / Mastercard)</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleVerifyPayment({
                    orderId: orderData.orderId,
                    paymentMethod: 'netbanking',
                    isSimulation: true,
                  })
                }
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>Simulate NetBanking (HDFC / ICICI / SBI)</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          /* LIVE RAZORPAY GATEWAY SECTION */
          <div className="space-y-3">
            {/* Primary Action Button: Opens Official Razorpay Checkout */}
            <button
              type="button"
              disabled={loading}
              onClick={handleLaunchRazorpay}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <Lock className="w-4 h-4" />
              <span>Launch Razorpay Gateway (₹{totalAmount.toLocaleString('en-IN')})</span>
            </button>

            {/* Instant 1-Click Simulation Button (Bypass Manual Entry) */}
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handleVerifyPayment({
                  orderId: orderData?.orderId,
                  paymentMethod: 'upi_phonepe',
                  isSimulation: true,
                })
              }
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant 1-Click Test Simulation (Skip Gateway Pop-up)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-center gap-4 text-slate-400 text-[11px] pt-1">
              <span>✓ UPI (GPay/PhonePe)</span>
              <span>•</span>
              <span>✓ Domestic Cards</span>
              <span>•</span>
              <span>✓ NetBanking</span>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>256-bit SSL Encrypted</span>
          </span>
          <span className="text-slate-400">
            Official Razorpay Test Gateway
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
