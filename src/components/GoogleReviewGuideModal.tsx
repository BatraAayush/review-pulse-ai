'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { 
  X, 
  HelpCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Store, 
  Search, 
  ArrowRight,
  Info
} from 'lucide-react';

interface GoogleReviewGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUrl?: (url: string) => void;
  defaultBusinessName?: string;
  isSignUp?: boolean;
}

export default function GoogleReviewGuideModal({
  isOpen,
  onClose,
  onSelectUrl,
  defaultBusinessName = '',
  isSignUp,
}: GoogleReviewGuideModalProps) {
  const pathname = usePathname();
  const showSignUpTip = isSignUp ?? (pathname ? pathname.includes('/register') : false);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'gbp' | 'placeid' | 'quick'>('gbp');
  const [placeIdInput, setPlaceIdInput] = useState('');
  const [quickName, setQuickName] = useState(defaultBusinessName);
  const [quickCity, setQuickCity] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and dismiss on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      setTimeout(() => setCopiedLink(null), 2500);
    } catch {
      // Fallback silently
    }
  };

  const handleApplyPlaceId = () => {
    const trimmed = placeIdInput.trim();
    if (!trimmed) return;
    const finalUrl = `https://search.google.com/local/writereview?placeid=${trimmed}`;
    if (onSelectUrl) {
      onSelectUrl(finalUrl);
      onClose();
    } else {
      handleCopy(finalUrl);
    }
  };

  const handleOpenGoogleMapsSearch = () => {
    const name = quickName.trim();
    if (!name) return;
    const combined = quickCity.trim() ? `${name} ${quickCity.trim()}` : name;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(combined)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleApplyGoogleMapsUrl = () => {
    const name = quickName.trim();
    if (!name) return;
    const combined = quickCity.trim() ? `${name} ${quickCity.trim()}` : name;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(combined)}`;
    if (onSelectUrl) {
      onSelectUrl(mapsUrl);
      onClose();
    } else {
      handleCopy(mapsUrl);
    }
  };

  const modalContent = (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Google Review Guide"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Blurred dark backdrop overlay with click-to-close */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div 
        className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">How to Get Your Google Review Link</h2>
              <p className="text-xs text-slate-400">Follow any of these 3 easy methods to get your official link</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 pt-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('gbp')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gbp'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            1. Google Business Profile (Fastest)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('placeid')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'placeid'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            2. Google Place ID Finder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'quick'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            3. Locate on Google Maps
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* TAB 1: GBP */}
          {activeTab === 'gbp' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-3">
                <Store className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold mb-0.5">Best method if you manage your business on Google:</strong>
                  Google automatically generates a verified short link for your profile that opens the review dialog directly on mobile & desktop.
                </div>
              </div>

              <ol className="space-y-3 pl-2">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-white">Go to Google:</span> Make sure you are signed in with the Google account that manages your business/clinic.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <span className="font-semibold text-white">Search your business:</span> Type your business/clinic name, or simply search <code className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300">my business</code> on Google.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-white">Click &quot;Ask for reviews&quot;:</span> Look for the button labeled <span className="text-emerald-400 font-medium">&quot;Ask for reviews&quot;</span> or <span className="text-emerald-400 font-medium">&quot;Get more reviews&quot;</span> on your Google Business card.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <span className="font-semibold text-white">Copy the URL:</span> A popup will display your official short link, for example:
                    <div className="mt-1.5 p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 flex items-center justify-between">
                      <span className="truncate">https://g.page/r/CZnA_sample/review</span>
                      <span className="text-[11px] text-slate-500 shrink-0 ml-2">(Example)</span>
                    </div>
                  </div>
                </li>
              </ol>

              <div className="pt-2">
                <a
                  href="https://business.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  <span>Open Google Business Manager</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: PLACE ID FINDER */}
          {activeTab === 'placeid' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold mb-0.5">The official Google Developer write-review link:</strong>
                  Using your Google Place ID creates a guaranteed 5-star write-review popup on both iPhones and Androids.
                </div>
              </div>

              <ol className="space-y-3 pl-2">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    Open Google&apos;s free{' '}
                    <a
                      href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      Place ID Finder tool <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <div>Search your business name and address in the map search box.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-blue-400 font-bold text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <div>Copy the resulting Place ID (e.g. <code className="text-xs bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded">ChIJN1t_tDeuEmsRUsoyG83frY4</code>) and paste it below:</div>
                </li>
              </ol>

              {/* Live Generator Tool */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Paste your Place ID to format URL:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={placeIdInput}
                    onChange={(e) => setPlaceIdInput(e.target.value)}
                    placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    disabled={!placeIdInput.trim()}
                    onClick={handleApplyPlaceId}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {onSelectUrl ? 'Apply to Form' : 'Generate & Copy'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOCATE ON GOOGLE MAPS */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-3">
                <Search className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold mb-0.5">Find Your Authentic Google Maps Place:</strong>
                  Search your business name and city on Google Maps. Once opened, tap <span className="text-white font-medium">&quot;Share&quot;</span> or <span className="text-white font-medium">&quot;Ask for reviews&quot;</span> to get your official link.
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Business / Cafe / Clinic Name:
                  </label>
                  <input
                    type="text"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="e.g. Blue Bottle Cafe"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City / Neighborhood / Address:
                  </label>
                  <input
                    type="text"
                    value={quickCity}
                    onChange={(e) => setQuickCity(e.target.value)}
                    placeholder="e.g. Indiranagar, Bengaluru"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={!quickName.trim()}
                    onClick={handleOpenGoogleMapsSearch}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border border-slate-700"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <span>Search on Google Maps ↗</span>
                  </button>

                  <button
                    type="button"
                    disabled={!quickName.trim()}
                    onClick={handleApplyGoogleMapsUrl}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{onSelectUrl ? 'Apply Maps Link' : 'Copy Maps Search Link'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  💡 After opening Google Maps, find your exact location, tap <strong>Share</strong> &gt; <strong>Copy Link</strong>, and paste it back into the Review URL box.
                </p>
              </div>
            </div>
          )}

          {/* Bottom Optional Hint Banner - only shown during sign-up */}
          {showSignUpTip && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Tip:</strong> Don&apos;t worry if you don&apos;t have this right now! You can leave the field empty during sign-up and configure it anytime later in your Dashboard.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {copiedLink ? (
              <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Copied to clipboard!
              </span>
            ) : (
              'Works with any Google Business profile'
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
