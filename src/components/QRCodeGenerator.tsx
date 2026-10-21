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
  Palette,
  Loader2
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

  const [isUpdatingBrandColor, setIsUpdatingBrandColor] = useState<boolean>(false);

  // Directly update business brand theme color from QR Studio
  const handleUpdateBrandColor = async (newColor: string, alsoSetQrColor: boolean = false) => {
    if (!newColor || newColor === business.primaryColor || isUpdatingBrandColor) return;
    setIsUpdatingBrandColor(true);

    try {
      const res = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: business.id,
          primaryColor: newColor,
        }),
      });

      if (res.ok) {
        toast.success(`Brand color updated to ${newColor.toUpperCase()}!`, 'Brand Color Saved');
        if (onUpdateBusiness) {
          await onUpdateBusiness({ primaryColor: newColor });
        }
        if (alsoSetQrColor) {
          setQrColor(newColor);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to update brand color', 'Error');
      }
    } catch {
      toast.error('Network error saving brand color', 'Error');
    } finally {
      setIsUpdatingBrandColor(false);
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

    toast.info("Opening print dialog... Tip: In print settings, ensure 'Background graphics' is checked for full colors & gradients.", 'Print Table Tent');

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
      window.print();
      return;
    }

    const standTitle = isDirectBypass
      ? `${business.name} - Direct Google Review QR Stand`
      : `${business.name} - Google Review QR Stand`;

    const brandColor = business.primaryColor || '#2563eb';
    const isImage = isImageLogo(business.logoUrl);
    const logoContent = isImage
      ? `<img src="${business.logoUrl}" alt="Logo" class="center-img ${logoShape}" />`
      : `<span>${business.logoUrl || getCategoryEmoji(business.category)}</span>`;

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${standTitle}</title>
          <style>
            @page {
              size: auto;
              margin: 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* --- Base Stand Card --- */
            .outer-stand {
              width: 320px;
              border-radius: 28px;
              text-align: center;
              margin: 0 auto;
            }

            /* 1. Brand Accent Style */
            .outer-stand.accent {
              background: linear-gradient(135deg, ${brandColor} 0%, #0f172a 100%) !important;
              padding: 6px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
            }
            .outer-stand.accent .inner-stand {
              background: #020617 !important;
              color: #ffffff;
              border-radius: 22px;
              padding: 24px 20px;
              border: 1px solid rgba(255, 255, 255, 0.12);
            }
            .outer-stand.accent h1 { color: #ffffff; }
            .outer-stand.accent p.cta { color: #94a3b8; }
            .outer-stand.accent .badge-pill {
              background: ${brandColor}40 !important;
              border: 1px solid rgba(255, 255, 255, 0.25);
              color: #ffffff;
            }

            /* 2. Obsidian Dark Style */
            .outer-stand.badge {
              background: #0f172a !important;
              color: #ffffff;
              border: 2px solid #1e293b;
              border-radius: 28px;
              padding: 6px;
            }
            .outer-stand.badge .inner-stand {
              background: #020617 !important;
              color: #ffffff;
              border-radius: 22px;
              padding: 24px 20px;
              border: 1px solid #1e293b;
            }
            .outer-stand.badge h1 { color: #ffffff; }
            .outer-stand.badge p.cta { color: #94a3b8; }
            .outer-stand.badge .badge-pill {
              background: #0f172a !important;
              border: 1px solid #334155;
              color: #f1f5f9;
            }

            /* 3. Modern Card Style */
            .outer-stand.card {
              background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%) !important;
              color: #0f172a;
              border: 1px solid #cbd5e1;
              padding: 28px 20px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
            }
            .outer-stand.card h1 { color: #0f172a; }
            .outer-stand.card p.cta { color: #475569; }

            /* 4. Minimalist Style */
            .outer-stand.minimal {
              background: #ffffff !important;
              color: #0f172a;
              border: 4px solid #0f172a;
              padding: 28px 20px;
            }
            .outer-stand.minimal h1 { color: #0f172a; }
            .outer-stand.minimal p.cta { color: #475569; }

            /* --- Shared Stand Elements --- */
            .stars {
              font-size: 20px;
              letter-spacing: 3px;
              color: #f59e0b;
              margin-bottom: 6px;
            }
            h1 {
              font-size: 16px;
              font-weight: 800;
              margin: 0 0 4px 0;
              line-height: 1.25;
              letter-spacing: -0.01em;
            }
            p.cta {
              font-size: 11px;
              margin: 0 0 14px 0;
              line-height: 1.4;
            }

            /* --- QR Container & Center Logo --- */
            .qr-box {
              position: relative;
              background: #ffffff !important;
              padding: 12px;
              border-radius: 18px;
              display: inline-block;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            #qr-img {
              width: 195px;
              height: 195px;
              display: block;
              border-radius: 8px;
            }
            .center-logo-box {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              background: #ffffff !important;
              border: 1px solid #cbd5e1;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              overflow: hidden;
              padding: 2px;
            }
            .center-logo-box.circle { border-radius: 50%; }
            .center-logo-box.square { border-radius: 10px; }
            .center-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .center-img.circle { border-radius: 50%; }
            .center-img.square { border-radius: 8px; }

            /* --- Badges & Footers --- */
            .badge-pill {
              margin-top: 14px;
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 5px 14px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.02em;
            }
            .light-indicator {
              margin-top: 14px;
              text-align: center;
            }
            .light-indicator .dot {
              display: inline-block;
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background-color: ${isDirectBypass ? '#f59e0b' : '#10b981'};
              margin-right: 6px;
              vertical-align: middle;
            }
            .light-indicator .title {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #1e293b;
              margin: 0;
            }
            .light-indicator .sub {
              font-size: 10px;
              color: #64748b;
              margin: 2px 0 0 0;
            }

            @media print {
              body {
                padding: 0;
                background-color: #ffffff !important;
              }
              .outer-stand {
                box-shadow: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="outer-stand ${frameStyle}">
            ${frameStyle === 'accent' || frameStyle === 'badge' ? `
              <div class="inner-stand">
                <div class="stars">★★★★★</div>
                <h1>${business.name}</h1>
                <p class="cta">${activeCta}</p>
                <div class="qr-box">
                  <img id="qr-img" src="${dataUrl}" alt="Scan QR Code" />
                  ${includeCenterEmoji ? `
                    <div class="center-logo-box ${logoShape}">
                      ${logoContent}
                    </div>
                  ` : ''}
                </div>
                <div class="badge-pill">
                  ${isDirectBypass ? '⚡ Direct Google Review' : '✨ Scan to Review'}
                </div>
              </div>
            ` : `
              <div class="stars">★★★★★</div>
              <h1>${business.name}</h1>
              <p class="cta">${activeCta}</p>
              <div class="qr-box">
                <img id="qr-img" src="${dataUrl}" alt="Scan QR Code" />
                ${includeCenterEmoji ? `
                  <div class="center-logo-box ${logoShape}">
                    ${logoContent}
                  </div>
                ` : ''}
              </div>
              <div class="light-indicator">
                <p class="title">
                  <span class="dot"></span>
                  ${isDirectBypass ? 'Fast-Track Google Review' : 'Scan with Phone Camera'}
                </p>
                <p class="sub">
                  ${isDirectBypass ? 'Opens Google write-review instantly' : 'Review on Google in seconds'}
                </p>
              </div>
            `}
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
        {/* Left: Interactive Printable QR Stand Preview */}
        <div className="flex flex-col items-center w-full lg:w-auto">
          <div
            ref={printRef}
            className={`w-full max-w-[280px] sm:max-w-[320px] mx-auto rounded-3xl p-4 sm:p-6 transition-all duration-300 ${
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

          <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-[320px]">
            <span className="text-xs text-slate-400 font-medium">Stand Frame Style</span>
            <div className="inline-flex rounded-xl bg-slate-800/90 p-1 border border-slate-700 flex-wrap justify-center gap-1 w-full">
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

            {/* 1. Brand Theme Color Controller */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Business Brand Theme Color</span>
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                      {(business.primaryColor || '#2563eb').toUpperCase()}
                    </span>
                    {isUpdatingBrandColor && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Saving...</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Powers your Brand Accent standee gradient, background card glow, and customer portal theme.
                  </p>
                </div>
              </div>

              {/* Brand Color Pickers & Presets */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                {/* Native Color Picker for Brand Color */}
                <label 
                  className="relative flex items-center gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl cursor-pointer text-xs text-slate-200 transition-all shadow-sm group"
                  title="Click to choose custom brand color"
                >
                  <div 
                    className="w-4 h-4 rounded-full border border-white/50 shadow-inner group-hover:scale-110 transition-transform shrink-0" 
                    style={{ backgroundColor: business.primaryColor || '#2563eb' }} 
                  />
                  <input
                    type="color"
                    value={business.primaryColor?.startsWith('#') && business.primaryColor.length === 7 ? business.primaryColor : '#2563eb'}
                    onChange={(e) => handleUpdateBrandColor(e.target.value, false)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white">Change Brand Color</span>
                </label>

                {/* Quick Brand Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { color: '#2563eb', name: 'Electric Blue' },
                    { color: '#e11d48', name: 'Rose Crimson' },
                    { color: '#059669', name: 'Emerald Green' },
                    { color: '#7c3aed', name: 'Royal Purple' },
                    { color: '#d97706', name: 'Amber Gold' },
                    { color: '#ec4899', name: 'Pink Fuchsia' },
                    { color: '#0f172a', name: 'Obsidian Slate' },
                  ].map((preset) => {
                    const isCurrentBrand = (business.primaryColor || '#2563eb').toLowerCase() === preset.color.toLowerCase();
                    return (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => handleUpdateBrandColor(preset.color, false)}
                        className={`w-6 h-6 rounded-lg border transition-all cursor-pointer relative ${
                          isCurrentBrand
                            ? 'scale-110 border-white ring-2 ring-blue-500/50 shadow-md'
                            : 'border-slate-700 hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={`Set Brand Color: ${preset.name} (${preset.color})`}
                      >
                        {isCurrentBrand && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-extrabold">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. QR Foreground Color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <span>QR Code Foreground Color</span>
                  <span className="text-[10px] text-slate-500 font-mono">({qrColor})</span>
                </span>
                
                {/* One-click button to match QR color to Brand color */}
                <button
                  type="button"
                  onClick={() => setQrColor(business.primaryColor || '#2563eb')}
                  className={`text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                    qrColor.toLowerCase() === (business.primaryColor || '#2563eb').toLowerCase()
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-semibold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Match QR code foreground color to your business brand color"
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-white/50" style={{ backgroundColor: business.primaryColor || '#2563eb' }} />
                  <span>{qrColor.toLowerCase() === (business.primaryColor || '#2563eb').toLowerCase() ? 'Using Brand Color' : 'Use Brand Color'}</span>
                  {qrColor.toLowerCase() === (business.primaryColor || '#2563eb').toLowerCase() && (
                    <Check className="w-3 h-3 text-blue-400" />
                  )}
                </button>
              </div>

              {/* Deduplicated QR Palette Swatches (Fixes duplicate checkmark bug) */}
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const basePresets = [
                    { color: '#0f172a', name: 'Obsidian Slate' },
                    { color: '#2563eb', name: 'Electric Blue' },
                    { color: '#059669', name: 'Emerald Green' },
                    { color: '#7c3aed', name: 'Royal Purple' },
                    { color: '#dc2626', name: 'Crimson Red' },
                    { color: '#d97706', name: 'Amber Gold' },
                    { color: '#ec4899', name: 'Pink Fuchsia' },
                  ];

                  const brandHex = (business.primaryColor || '#2563eb').toLowerCase();
                  const list = basePresets.some((p) => p.color.toLowerCase() === brandHex)
                    ? basePresets
                    : [{ color: business.primaryColor!, name: 'Brand Color' }, ...basePresets];

                  // Deduplicate strictly by lowercase hex
                  const deduped = Array.from(new Map(list.map((item) => [item.color.toLowerCase(), item])).values());

                  return deduped.map((item) => {
                    const isSelected = qrColor.toLowerCase() === item.color.toLowerCase();
                    return (
                      <button
                        key={item.color}
                        type="button"
                        onClick={() => setQrColor(item.color)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer relative ${
                          isSelected
                            ? 'scale-110 border-white ring-2 ring-blue-500/60 shadow-lg'
                            : 'border-transparent hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: item.color }}
                        title={item.name}
                      >
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                        )}
                      </button>
                    );
                  })
                })()}

                {/* Custom Color Input */}
                <label 
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl cursor-pointer text-xs text-slate-300 transition-colors"
                  title="Choose any custom QR foreground hex color"
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
