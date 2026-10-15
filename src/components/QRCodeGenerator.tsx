'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Star, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Palette
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { Business } from '@/types';
import { isImageLogo, getCategoryEmoji } from '@/lib/logo';
import GoogleReviewGuideModal from '@/components/GoogleReviewGuideModal';

interface QRCodeGeneratorProps {
  business: Business;
  baseUrl?: string;
  onUpdateBusiness?: (updated: Partial<Business>) => Promise<void> | void;
  onNavigateToSettings?: () => void;
}

export default function QRCodeGenerator({ 
  business, 
  baseUrl = '', 
  onUpdateBusiness,
  onNavigateToSettings,
}: QRCodeGeneratorProps) {
  const { toast } = useToast();
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [frameStyle, setFrameStyle] = useState<'card' | 'badge' | 'accent' | 'minimal'>('card');
  const [qrColor, setQrColor] = useState<string>('#0f172a');
  const [includeCenterEmoji, setIncludeCenterEmoji] = useState(true);
  const [logoShape, setLogoShape] = useState<'circle' | 'square'>('circle');
  const [customCta, setCustomCta] = useState<string>('');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Handler when user selects/saves a URL from GoogleReviewGuideModal
  const handleSelectUrlFromGuide = async (url: string) => {
    try {
      const res = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: business.id,
          googleReviewUrl: url,
        }),
      });
      if (res.ok) {
        toast.success('Google Review link saved from guide!', 'Link Updated');
        if (onUpdateBusiness) {
          await onUpdateBusiness({ googleReviewUrl: url });
        }
      } else {
        toast.error('Failed to update Google Review link', 'Error');
      }
    } catch {
      toast.error('Network error saving Google Review link', 'Error');
    }
  };

  // Dynamic cloud routing state directly reflecting business.bypassAiReview:
  const isDirectBypass = Boolean(business.bypassAiReview);
  const [isSavingRouting, setIsSavingRouting] = useState<boolean>(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : baseUrl;

  // Authentic raw Google destination resolved for customer
  const resolvedGoogleDestination =
    business.googleReviewUrl &&
    business.googleReviewUrl.startsWith('http') &&
    !business.googleReviewUrl.includes('writereview?business=')
      ? business.googleReviewUrl
      : business.googlePlaceId && !business.googlePlaceId.includes('null')
      ? `https://search.google.com/local/writereview?placeid=${business.googlePlaceId.trim()}`
      : business.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${business.address}`)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name)}`;

  // The QR code ALWAYS encodes the dynamic review portal link:
  // 1. Guaranteed scan analytics & conversion metrics in dashboard
  // 2. Physical prints remain dynamic: toggling between AI funnel and Direct Google
  //    instantly updates existing printed table stands without reprinting!
  const activeReviewUrl = `${origin}/r/${business.slug}`;

  const isGoogleLinkConfigured = Boolean(
    (business.googleReviewUrl &&
      business.googleReviewUrl.startsWith('http') &&
      !business.googleReviewUrl.includes('writereview?business=')) ||
    (business.googlePlaceId && !business.googlePlaceId.includes('null'))
  );

  // Generate QR on parameter changes
  useEffect(() => {
    QRCode.toDataURL(activeReviewUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: qrColor,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('QR Gen error', err));

    QRCode.toString(activeReviewUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: qrColor,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((svg) => setSvgString(svg))
      .catch((err) => console.error('QR SVG error', err));
  }, [activeReviewUrl, qrColor]);

  const copyUrl = () => {
    navigator.clipboard.writeText(activeReviewUrl);
    setCopied(true);
    toast.success(
      isDirectBypass
        ? 'Dynamic review link copied! (Routes directly to Google)'
        : 'AI review funnel link copied!',
      'Link Copied'
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRawGoogleUrl = () => {
    navigator.clipboard.writeText(resolvedGoogleDestination);
    toast.success('Direct Google Review URL copied to clipboard!', 'Google Link Copied');
  };

  // Toggle business-level routing mode via API
  const handleToggleRouting = async (enableDirectBypass: boolean) => {
    if (enableDirectBypass === isDirectBypass || isSavingRouting) return;
    setIsSavingRouting(true);
    try {
      const res = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: business.id,
          bypassAiReview: enableDirectBypass,
        }),
      });

      if (res.ok) {
        toast.success(
          enableDirectBypass
            ? 'Direct Google Review bypass active! All scans (including printed QR codes) now open Google directly.'
            : 'AI Smart Review Funnel restored! Customer scans will now receive AI review assistance and rating protection.',
          enableDirectBypass ? 'Direct Bypass Active' : 'AI Funnel Active'
        );
        if (onUpdateBusiness) {
          await onUpdateBusiness({ bypassAiReview: enableDirectBypass });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to update QR routing setting', 'Error');
      }
    } catch (err) {
      console.error('Failed to toggle QR routing:', err);
      toast.error('Network error updating QR routing setting', 'Error');
    } finally {
      setIsSavingRouting(false);
    }
  };

  const downloadPNG = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${business.slug}-review-qr.png`;
    a.click();
    toast.success(
      'High-resolution Dynamic QR Code downloaded!',
      'Downloaded'
    );
  };

  const downloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${business.slug}-review-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      'Vector SVG Dynamic QR Code downloaded!',
      'Downloaded'
    );
  };

  const activeCta = customCta.trim() ||
    (isDirectBypass ? 'Review us directly on Google' : (business.tagline || 'Rate your experience with us!'));

  const handlePrint = () => {
    if (!dataUrl) {
      toast.error('QR code is still generating, please wait a moment.', 'Please Wait');
      return;
    }

    toast.info('Opening print dialog...', 'Print Table Tent');

    // Remove any previous temporary print iframe
    const oldIframe = document.getElementById('review-pulse-print-iframe');
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'review-pulse-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document;
    if (!frameDoc || !iframe.contentWindow) {
      // Fallback if iframe content window inaccessible
      window.print();
      return;
    }

    const standTitle = isDirectBypass
      ? `${business.name} - Direct Google Review QR Stand`
      : `${business.name} - Google Review QR Stand`;

    const footerText = isDirectBypass
      ? '📸 Scan with camera to review us directly on Google'
      : '📸 Scan with camera to review us on Google';

    const isDark = frameStyle === 'badge';

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${standTitle}</title>
          <style>
            @page {
              size: auto;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 24px;
              background-color: ${isDark ? '#0b0f19' : '#ffffff'};
              color: ${isDark ? '#f8fafc' : '#111827'};
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .card {
              border: 3px solid ${isDark ? '#334155' : '#111827'};
              background-color: ${isDark ? '#030712' : '#ffffff'};
              border-radius: 28px;
              padding: 40px;
              text-align: center;
              max-width: 420px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
            }
            .stars { color: #f59e0b; font-size: 28px; margin-bottom: 12px; }
            h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; color: ${isDark ? '#ffffff' : '#111827'}; }
            p { font-size: 14px; color: ${isDark ? '#94a3b8' : '#4b5563'}; margin: 0 0 24px 0; }
            .badge {
              display: inline-block;
              background: ${isDark ? '#064e3b' : '#ecfdf5'};
              color: ${isDark ? '#6ee7b7' : '#059669'};
              border: 1px solid ${isDark ? '#059669' : '#a7f3d0'};
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 4px 12px;
              border-radius: 9999px;
              margin-bottom: 16px;
              letter-spacing: 0.05em;
            }
            .qr-wrapper {
              background: #ffffff;
              padding: 16px;
              border-radius: 20px;
              display: inline-block;
              border: 1px solid ${isDark ? '#1e293b' : '#e5e7eb'};
            }
            img { width: 260px; height: 260px; display: block; border-radius: 8px; }
            .footer-tip {
              margin-top: 24px;
              font-size: 13px;
              font-weight: 600;
              color: ${isDark ? '#cbd5e1' : '#111827'};
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            @media print {
              body { padding: 0; background: ${isDark ? '#0b0f19' : '#ffffff'} !important; }
              .card { box-shadow: none; border-width: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="stars">★★★★★</div>
            ${isDirectBypass ? '<div class="badge">⚡ Direct Google Review</div>' : ''}
            <h1>${business.name}</h1>
            <p>${activeCta}</p>
            <div class="qr-wrapper">
              <img id="qr-img" src="${dataUrl}" alt="Scan QR Code" />
            </div>
            <div class="footer-tip">${footerText}</div>
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    const doPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print execution failed:', err);
        window.print();
      }
    };

    const qrImg = frameDoc.getElementById('qr-img') as HTMLImageElement | null;
    if (qrImg && !qrImg.complete) {
      qrImg.onload = () => setTimeout(doPrint, 150);
    } else {
      setTimeout(doPrint, 250);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Left: Interactive Printable QR Stand Preview */}
        <div className="flex flex-col items-center">
          <div
            ref={printRef}
            className={`w-[280px] sm:w-[320px] rounded-3xl p-6 transition-all duration-300 ${
              frameStyle === 'card'
                ? 'bg-gradient-to-b from-white to-slate-100 text-slate-900 shadow-2xl border border-slate-200'
                : frameStyle === 'badge'
                ? 'bg-slate-900 text-white shadow-2xl border-2 border-slate-800'
                : frameStyle === 'accent'
                ? 'p-1 shadow-2xl text-white'
                : 'bg-white text-slate-900 border-4 border-slate-900 shadow-xl'
            }`}
            style={
              frameStyle === 'accent'
                ? { background: `linear-gradient(135deg, ${business.primaryColor || '#6366f1'} 0%, #0f172a 100%)` }
                : undefined
            }
          >
            {frameStyle === 'badge' ? (
              /* Obsidian Dark Standee (Clean neutral dark, no blue surrounding) */
              <div className="bg-slate-950 text-white rounded-[22px] p-5 text-center border border-slate-800/90 shadow-inner">
                <div className="flex justify-center items-center gap-1 text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <h3 className="font-extrabold text-sm tracking-tight text-white mb-0.5">
                  {business.name}
                </h3>
                <p className="text-[11px] text-slate-400 mb-3 flex items-center justify-center gap-1 line-clamp-1">
                  {activeCta}
                </p>
                <div className="relative bg-white p-2.5 rounded-xl mx-auto w-fit shadow-md border border-slate-800">
                  {dataUrl ? (
                    <img src={dataUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg" />
                  )}
                  {includeCenterEmoji && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`w-10 h-10 shadow-lg border border-slate-200 flex items-center justify-center text-lg overflow-hidden p-0.5 bg-white ${
                        logoShape === 'circle' ? 'rounded-full' : 'rounded-xl'
                      }`}>
                        {isImageLogo(business.logoUrl) ? (
                          <img
                            src={business.logoUrl!}
                            alt="Logo"
                            className={`w-full h-full object-cover ${logoShape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
                          />
                        ) : (
                          <span>{business.logoUrl || getCategoryEmoji(business.category)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-slate-200 text-[11px] font-semibold border border-slate-700/80">
                  {isDirectBypass ? (
                    <>
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Direct to Google</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Scan to Review</span>
                    </>
                  )}
                </div>
              </div>
            ) : frameStyle === 'accent' ? (
              /* Brand Accent Standee (Uses business primaryColor gradient) */
              <div className="bg-slate-950 text-white rounded-[22px] p-5 text-center border border-white/10">
                <div className="flex justify-center items-center gap-1 text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <h3 className="font-extrabold text-sm tracking-tight text-white mb-0.5">
                  {business.name}
                </h3>
                <p className="text-[11px] text-slate-400 mb-3 flex items-center justify-center gap-1 line-clamp-1">
                  {activeCta}
                </p>
                <div className="relative bg-white p-2.5 rounded-xl mx-auto w-fit shadow-md">
                  {dataUrl ? (
                    <img src={dataUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg" />
                  )}
                  {includeCenterEmoji && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`w-10 h-10 shadow-lg border border-slate-200 flex items-center justify-center text-lg overflow-hidden p-0.5 bg-white ${
                        logoShape === 'circle' ? 'rounded-full' : 'rounded-xl'
                      }`}>
                        {isImageLogo(business.logoUrl) ? (
                          <img
                            src={business.logoUrl!}
                            alt="Logo"
                            className={`w-full h-full object-cover ${logoShape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
                          />
                        ) : (
                          <span>{business.logoUrl || getCategoryEmoji(business.category)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div 
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[11px] font-semibold border border-white/20 shadow-md"
                  style={{ backgroundColor: `${business.primaryColor || '#6366f1'}40` }}
                >
                  {isDirectBypass ? (
                    <>
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Direct to Google</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-white" />
                      <span>Scan to Review</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Light Stand Card or Minimalist */
              <div className="text-center">
                <div className="flex justify-center items-center gap-1 text-amber-500 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>
                <h3 className="font-extrabold text-base tracking-tight text-slate-900 mb-0.5">
                  {business.name}
                </h3>
                <p className="text-xs text-slate-600 mb-4 line-clamp-1">
                  {activeCta}
                </p>

                <div className="relative bg-white p-3 rounded-2xl mx-auto w-fit shadow-sm border border-slate-200">
                  {dataUrl ? (
                    <img src={dataUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg" />
                  )}
                  {includeCenterEmoji && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`w-10 h-10 shadow-lg border border-slate-200 flex items-center justify-center text-lg overflow-hidden p-0.5 bg-white ${
                        logoShape === 'circle' ? 'rounded-full' : 'rounded-xl'
                      }`}>
                        {isImageLogo(business.logoUrl) ? (
                          <img
                            src={business.logoUrl!}
                            alt="Logo"
                            className={`w-full h-full object-cover ${logoShape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
                          />
                        ) : (
                          <span>{business.logoUrl || getCategoryEmoji(business.category)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isDirectBypass ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                  <p className="text-[11px] font-bold tracking-wider uppercase text-slate-800">
                    {isDirectBypass ? 'Fast-Track Google Review' : 'Scan with Phone Camera'}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isDirectBypass ? 'Opens Google write-review instantly' : 'Review on Google in seconds'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Stand Frame Style</span>
            <div className="inline-flex rounded-xl bg-slate-800/90 p-1 border border-slate-700 flex-wrap justify-center gap-1">
              <button
                type="button"
                onClick={() => setFrameStyle('card')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  frameStyle === 'card' ? 'bg-blue-600 text-white font-semibold shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                Modern Card
              </button>
              <button
                type="button"
                onClick={() => setFrameStyle('badge')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  frameStyle === 'badge' ? 'bg-slate-950 text-white font-semibold border border-slate-700 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                Obsidian Dark
              </button>
              <button
                type="button"
                onClick={() => setFrameStyle('accent')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  frameStyle === 'accent' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                Brand Accent
              </button>
              <button
                type="button"
                onClick={() => setFrameStyle('minimal')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  frameStyle === 'minimal' ? 'bg-white text-slate-900 font-semibold shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                Minimal
              </button>
            </div>
          </div>
        </div>

        {/* Right: Controls, Mode Selection & Instant Actions */}
        <div className="flex-1 w-full space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart QR Studio</span>
            </div>
            <h2 className="text-xl font-bold text-white">Your Live Google Review QR Kit</h2>
            <p className="text-sm text-slate-400 mt-1">
              Place this QR on table tents, front counters, receipt slips, or checkout stands. Customers scan directly with their phone camera.
            </p>
          </div>

          {/* FEATURE: QR SCAN DESTINATION ROUTING */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>QR Scan Routing</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Choose where customers land when scanning your QR code. Saved instantly to the cloud.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {isGoogleLinkConfigured ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold">Google Profile Connected</span>
                    {onNavigateToSettings && (
                      <button
                        type="button"
                        onClick={onNavigateToSettings}
                        className="text-slate-400 hover:text-white ml-1 underline cursor-pointer text-[10px]"
                        title="Edit in Settings"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-[11px] font-medium transition-all cursor-pointer shadow-sm"
                    title="Connect Google Place ID to enable direct review posting"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Connect Google Place ID</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mode Selector Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option 1: AI Review Funnel */}
              <button
                type="button"
                disabled={isSavingRouting}
                onClick={() => handleToggleRouting(false)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                  !isDirectBypass
                    ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-900/20 ring-1 ring-blue-500/40'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Sparkles className={`w-4 h-4 ${!isDirectBypass ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>AI Review Funnel</span>
                  </span>
                  {!isDirectBypass ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                      {isSavingRouting ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 hover:text-slate-300">Click to activate</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Smart chips &amp; AI review draft assist. Automatically intercepts 1–3 star ratings as private feedback to protect your public score.
                </p>
              </button>

              {/* Option 2: Direct Google Review Bypass */}
              <button
                type="button"
                disabled={isSavingRouting}
                onClick={() => handleToggleRouting(true)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                  isDirectBypass
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-500/40'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Zap className={`w-4 h-4 ${isDirectBypass ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>Direct to Google (Bypass)</span>
                  </span>
                  {isDirectBypass ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      {isSavingRouting ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                      <span>Bypass Active</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 hover:text-slate-300">Click to activate</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Zero middleman friction. Phone scans seamlessly open Google Reviews directly, while still logging scan counts in your analytics.
                </p>
              </button>
            </div>

            {/* Dynamic QR Live Sync Badge */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold text-slate-200">Cloud-Synced Dynamic QR</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Any mode change updates all printed table stands immediately in real-time
              </span>
            </div>

            {/* Notice / Warning if Google review URL is missing in direct mode */}
            {isDirectBypass && !isGoogleLinkConfigured && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-semibold text-amber-200">
                    Google Review Link not configured yet
                  </p>
                  <p className="text-[11px] text-amber-300/80">
                    In direct mode, the QR code needs your Google Place ID or short review link so customers land directly on your 5-star write-review popup.
                  </p>
                  <div className="flex items-center gap-2.5 pt-0.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Find Place ID with Guide</span>
                    </button>
                    {onNavigateToSettings && (
                      <button
                        type="button"
                        onClick={onNavigateToSettings}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:underline cursor-pointer"
                      >
                        <span>Open Settings</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Link Field with copy & test buttons */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <span>Dynamic Review Link (Encoded in QR):</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDirectBypass
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                }`}>
                  {isDirectBypass ? '⚡ Direct Google (Live Redirect)' : '✨ AI Assist Funnel'}
                </span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live &amp; Synced</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeReviewUrl}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 selection:bg-blue-600 selection:text-white focus:outline-none"
              />
              <button
                onClick={copyUrl}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                title="Copy Customer Review Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={activeReviewUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                title="Open Review Portal in New Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="text-[11px] space-y-1 pt-0.5">
              {isDirectBypass ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400">
                  <span className="text-emerald-400/90 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Customer scans verify instantly and redirect straight to your Google Review page.</span>
                  </span>
                  {resolvedGoogleDestination && (
                    <button
                      type="button"
                      onClick={copyRawGoogleUrl}
                      className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer text-left sm:text-right shrink-0"
                    >
                      Copy raw Google URL
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">
                  Customers scan this QR code to access your interactive AI review assistant with smart tags and private feedback routing.
                </p>
              )}
            </div>
          </div>

          {/* Pro QR Styling & Customization Studio */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  QR &amp; Standee Appearance Studio
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                Customizable
              </span>
            </div>

            {/* 1. Foreground Color & Brand Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <span>QR Foreground Color</span>
                  <span className="text-[10px] text-slate-500 font-mono">({qrColor})</span>
                </span>
                {business.primaryColor && (
                  <button
                    type="button"
                    onClick={() => setQrColor(business.primaryColor)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Use Brand Color</span>
                    <span className="w-2.5 h-2.5 rounded-full border border-white/40" style={{ backgroundColor: business.primaryColor }} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { color: '#0f172a', name: 'Obsidian Slate' },
                  { color: business.primaryColor || '#6366f1', name: 'Brand Color' },
                  { color: '#2563eb', name: 'Electric Blue' },
                  { color: '#059669', name: 'Emerald Green' },
                  { color: '#7c3aed', name: 'Royal Purple' },
                  { color: '#dc2626', name: 'Crimson Red' },
                  { color: '#d97706', name: 'Amber Gold' },
                ].map((item, idx) => (
                  <button
                    key={`${item.color}-${idx}`}
                    type="button"
                    onClick={() => setQrColor(item.color)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer relative ${
                      qrColor.toLowerCase() === item.color.toLowerCase()
                        ? 'scale-110 border-white ring-2 ring-blue-500/60 shadow-lg'
                        : 'border-transparent hover:scale-105 opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: item.color }}
                    title={item.name}
                  >
                    {qrColor.toLowerCase() === item.color.toLowerCase() && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                    )}
                  </button>
                ))}

                {/* Custom Color Input */}
                <label 
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl cursor-pointer text-xs text-slate-300 transition-colors"
                  title="Choose any custom brand hex color"
                >
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-[11px] font-mono">Custom</span>
                </label>
              </div>
            </div>

            {/* 2. Call-To-Action (CTA) Headline on Table Tent */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs text-slate-300 font-medium block">
                Table Stand Headline / Call-to-Action
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customCta}
                  onChange={(e) => setCustomCta(e.target.value)}
                  placeholder={isDirectBypass ? 'Review us directly on Google' : (business.tagline || 'Rate your experience with us!')}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
                {customCta && (
                  <button
                    type="button"
                    onClick={() => setCustomCta('')}
                    className="px-2.5 py-2 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 shrink-0 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {[
                  'Rate your experience with us!',
                  'Loved our service? Review us on Google!',
                  'Scan in 10s to share your feedback ⭐',
                  'Help our local business grow!',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomCta(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Center Logo Badge & Shape Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-200 font-medium">Center Brand Badge</p>
                  <p className="text-[11px] text-slate-500">Overlay logo or emoji in QR</p>
                </div>
                <input
                  type="checkbox"
                  checked={includeCenterEmoji}
                  onChange={(e) => setIncludeCenterEmoji(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-200 font-medium">Badge Shape</p>
                  <p className="text-[11px] text-slate-500">Logo silhouette styling</p>
                </div>
                <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                  <button
                    type="button"
                    disabled={!includeCenterEmoji}
                    onClick={() => setLogoShape('circle')}
                    className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all cursor-pointer ${
                      logoShape === 'circle' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Circle
                  </button>
                  <button
                    type="button"
                    disabled={!includeCenterEmoji}
                    onClick={() => setLogoShape('square')}
                    className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all cursor-pointer ${
                      logoShape === 'square' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Square
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Download and Print Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={downloadPNG}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={downloadSVG}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Download SVG</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-blue-400 font-semibold text-xs rounded-xl border border-blue-500/30 shadow-lg shadow-blue-900/20 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Table Tent</span>
            </button>
          </div>
        </div>
      </div>

      <GoogleReviewGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        defaultBusinessName={business.name}
        onSelectUrl={handleSelectUrlFromGuide}
        isSignUp={false}
      />
    </div>
  );
}
