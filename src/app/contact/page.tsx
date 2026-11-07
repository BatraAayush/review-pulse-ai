'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ToastContext';
import confetti from 'canvas-confetti';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  Building,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import CustomSelect, { CustomSelectOption } from '@/components/CustomSelect';

const INQUIRY_TOPIC_OPTIONS: CustomSelectOption[] = [
  { value: 'General Inquiry', label: 'General Inquiry', icon: '💬' },
  { value: 'Sales & Enterprise Deployment', label: 'Sales & Enterprise Deployment', icon: '💼' },
  { value: 'Franchise & Multi-Location Plans', label: 'Franchise & Multi-Location Plans', icon: '🏢' },
  { value: 'Custom NFC Standees & QR Cards', label: 'Custom NFC Standees & QR Cards', icon: '🪪' },
  { value: 'Billing & Subscription Support', label: 'Billing & Subscription Support', icon: '💳' },
  { value: 'Technical & API Assistance', label: 'Technical & API Assistance', icon: '🛠️' },
];

const INQUIRY_TOPICS = INQUIRY_TOPIC_OPTIONS.map((opt) => opt.value);

const FAQS = [
  {
    q: 'How quickly can our business go live with ReviewPulse AI?',
    a: 'Your review funnel is generated instantaneously upon registration. You can start printing your tailored QR code, configuring smart keyword chips, and placing NFC cards within 3 minutes.',
  },
  {
    q: 'How does the Private Negative Review Shield protect our Google Place rating?',
    a: 'When an unhappy customer selects 1 to 3 stars, they are automatically guided to a private feedback form that alerts management instantly via email and private dashboard inbox. Dissatisfied guests vent privately instead of posting a permanent 1-star public Google review.',
  },
  {
    q: 'Do you offer custom printed acrylic QR stands or NFC tap cards?',
    a: 'Yes! Pro and Enterprise tiers include print-ready ultra-high resolution vector QR assets, and our hardware team provisions custom laser-engraved NFC wooden and acrylic stands with worldwide delivery.',
  },
  {
    q: 'Can an agency or franchise brand manage 10+ locations under a single login?',
    a: 'Absolutely. Our Enterprise and Super-Admin architecture supports central multi-branch dashboards, individual location review telemetry, aggregated analytics, and delegated manager access.',
  },
  {
    q: 'What is your response time for support inquiries?',
    a: 'Our technical support and merchant onboarding specialists reply in under 2 hours during active business hours (Monday through Saturday, 9:00 AM – 8:00 PM IST).',
  },
];

export default function ContactPage() {
  const { toast } = useToast();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(INQUIRY_TOPICS[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});

  // Copy helper states
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // FAQ accordion open states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      toast.success('Email address copied to clipboard!', 'Copied');
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      toast.success('Phone number copied to clipboard!', 'Copied');
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof fieldErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Please enter a valid name (at least 2 characters)';
    }

    if (!trimmedEmail) {
      errors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!trimmedMessage) {
      errors.message = 'Please enter your message';
    } else if (trimmedMessage.length < 10) {
      errors.message = 'Message must be at least 10 characters long';
    } else if (trimmedMessage.length > 3000) {
      errors.message = 'Message cannot exceed 3,000 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please fix the errors in the form.', 'Validation Error');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: phone.trim() || undefined,
          subject,
          message: trimmedMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      setSubmitted(true);
      toast.success('Thank you! Your message has been dispatched to our team.', 'Message Sent');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      toast.error(msg, 'Submission Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSubject(INQUIRY_TOPICS[0]);
    setMessage('');
    setSubmitted(false);
    setFieldErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-sky-500/10 to-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>We&apos;re Here to Help • 24/7 Support &amp; Onboarding</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Get in touch with our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400">
              review automation
            </span>{' '}
            experts
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Have questions about enterprise deployment, multi-location franchise plans, custom laser-engraved NFC standees, or billing? Reach out and our team will get back to you promptly.
          </p>
        </div>
      </section>

      {/* Main Content: Form + Contact Info Cards */}
      <section className="pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left: Contact Form Card (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden">
                {/* Glow accent */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                {submitted ? (
                  <div className="py-12 px-4 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Message Received!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      Thank you for contacting ReviewPulse AI. A dedicated support and onboarding specialist has been notified and will reply to <strong className="text-white font-mono">{email}</strong> within 2 hours.
                    </p>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                      >
                        Send Another Message
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                    <div className="border-b border-slate-800 pb-4 mb-2">
                      <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <span>Send Us a Message</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Fill out the details below and we&apos;ll direct your inquiry to the right specialist.
                      </p>
                    </div>

                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Full Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                          }}
                          placeholder="Jane Doe"
                          className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${fieldErrors.name
                              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                              : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                        />
                        {fieldErrors.name && (
                          <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fieldErrors.name}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Work Email <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                          }}
                          placeholder="jane@company.com"
                          className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${fieldErrors.email
                              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                              : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                        />
                        {fieldErrors.email && (
                          <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{fieldErrors.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone & Subject Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Phone Number <span className="text-slate-500 text-[10px] lowercase">(optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 83970 82347"
                          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Inquiry Topic
                        </label>
                        <CustomSelect
                          value={subject}
                          onChange={(val) => setSubject(val)}
                          options={INQUIRY_TOPIC_OPTIONS}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Message Box */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Message <span className="text-rose-400">*</span>
                        </label>
                        <span className={`text-[10px] font-mono ${message.length > 3000 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                          {message.length}/3000
                        </span>
                      </div>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: undefined }));
                        }}
                        placeholder="Tell us about your business, number of locations, or specific questions..."
                        className={`w-full bg-slate-950/70 border rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all resize-y min-h-[110px] ${fieldErrors.message
                            ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                            : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                      />
                      {fieldErrors.message && (
                        <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.message}</span>
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Transmitting Message...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send Message</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-slate-500 text-center mt-2.5">
                        We respect your privacy. No spam or unsolicited marketing communications guaranteed.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Right: Direct Contact Cards & Headquarters (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">

              {/* Direct Support Email Card */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Direct Email Support</h3>
                    <p className="text-[11px] text-slate-400">Guaranteed response within 2 hours</p>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Official Support Email</span>
                      <span className="font-mono text-white font-semibold">aayushbatra33@gmail.com</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('aayushbatra33@gmail.com', 'email')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Copy email address"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Phone & WhatsApp Card */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Phone &amp; WhatsApp Hotline</h3>
                    <p className="text-[11px] text-slate-400">Direct phone support for active merchants</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Priority Line</span>
                    <a href="tel:+918397082347" className="font-mono text-white font-semibold hover:text-blue-400 transition-colors">
                      +91 83970 82347
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('+918397082347', 'phone')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy phone number"
                  >
                    {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Hours & Location Card */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Operating Hours</span>
                    <span className="text-slate-400 text-[11px] leading-relaxed block">
                      Monday to Saturday: 9:00 AM – 8:00 PM IST (UTC+5:30)
                    </span>
                    <span className="text-emerald-400 text-[10px] font-semibold mt-0.5 block flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Support Desk Active Now
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Headquarters</span>
                    <span className="text-slate-400 text-[11px] leading-relaxed block">
                      ReviewPulse AI Technologies Pvt. Ltd.<br />
                      100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Shield Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/20 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-white">Enterprise Compliance:</strong> 100% compliant with Google Review Guidelines, RBI payments, and end-to-end 256-bit encryption.
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section className="py-16 border-t border-slate-900 bg-slate-950/60 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Everything you need to know about setting up and scaling your physical business reviews.
            </p>
          </div>

          <div className="space-y-3.5">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-150 ease-out overflow-hidden ${
                    isOpen
                      ? 'bg-gradient-to-b from-slate-900 via-slate-900/95 to-blue-950/20 border-blue-500/40 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/20'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-white hover:text-blue-300 transition-colors cursor-pointer group"
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
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 transition-opacity duration-150 ease-out">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-14 border-t border-slate-900 bg-gradient-to-b from-slate-950 to-slate-900/90 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Ready to turn daily customer visits into 5-star Google momentum?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Join hundreds of dining venues, dental clinics, luxury salons, and retail stores capturing genuine 5-star reviews on auto-pilot.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register?plan=pro"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Free 14-Day Pro Trial</span>
            </Link>
            <Link
              href="/#pricing"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore Plans (From ₹499/mo)</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

