'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Copy, Check, Sparkles, ExternalLink, Star } from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { Business } from '@/types';
import { isImageLogo, getCategoryEmoji } from '@/lib/logo';

interface QRCodeGeneratorProps {
  business: Business;
  baseUrl?: string;
}

export default function QRCodeGenerator({ business, baseUrl = '' }: QRCodeGeneratorProps) {
  const { toast } = useToast();
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [frameStyle, setFrameStyle] = useState<'card' | 'minimal' | 'badge'>('card');
  const [qrColor, setQrColor] = useState<string>('#0f172a');
  const [includeCenterEmoji, setIncludeCenterEmoji] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const reviewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${business.slug}`
    : `${baseUrl}/r/${business.slug}`;

  // Generate QR on parameter changes
  useEffect(() => {
    QRCode.toDataURL(reviewUrl, {
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

    QRCode.toString(reviewUrl, {
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
  }, [reviewUrl, qrColor]);

  const copyUrl = () => {
    navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    toast.success('Direct review link copied to clipboard!', 'Link Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPNG = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${business.slug}-google-review-qr.png`;
    a.click();
    toast.success('High-resolution PNG QR Code downloaded!', 'Downloaded');
  };

  const downloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${business.slug}-google-review-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Vector SVG QR Code downloaded!', 'Downloaded');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=700,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${business.name} - Google Review QR Stand</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
              color: #111827;
            }
            .card {
              border: 3px solid #111827;
              border-radius: 24px;
              padding: 40px;
              text-align: center;
              max-width: 420px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .stars { color: #f59e0b; font-size: 28px; margin-bottom: 12px; }
            h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; }
            p { font-size: 14px; color: #4b5563; margin: 0 0 24px 0; }
            .qr-wrapper {
              background: #ffffff;
              padding: 16px;
              border-radius: 16px;
              display: inline-block;
              border: 1px solid #e5e7eb;
            }
            img { width: 260px; height: 260px; display: block; }
            .footer-tip {
              margin-top: 24px;
              font-size: 13px;
              font-weight: 600;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            @media print {
              body { padding: 0; }
              .card { box-shadow: none; border-width: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="stars">★★★★★</div>
            <h1>${business.name}</h1>
            <p>${business.tagline}</p>
            <div class="qr-wrapper">
              <img src="${dataUrl}" alt="Scan QR Code" />
            </div>
            <div class="footer-tip">📸 Scan with camera to review us on Google</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                : frameStyle === 'minimal'
                ? 'bg-white text-slate-900 border-4 border-slate-900 shadow-xl'
                : 'bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 p-1 text-white shadow-2xl rounded-3xl'
            }`}
          >
            {frameStyle === 'badge' ? (
              <div className="bg-slate-950 text-white rounded-[22px] p-5 text-center border border-blue-500/20">
                <div className="flex justify-center items-center gap-1 text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <h3 className="font-extrabold text-sm tracking-tight text-white mb-0.5">
                  {business.name}
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">Google 5-Star Review Funnel</p>
                <div className="relative bg-white p-2.5 rounded-xl mx-auto w-fit shadow-md">
                  {dataUrl ? (
                    <img src={dataUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg" />
                  )}
                  {includeCenterEmoji && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-lg overflow-hidden p-0.5">
                        {isImageLogo(business.logoUrl) ? (
                          <img
                            src={business.logoUrl!}
                            alt="Logo"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span>{business.logoUrl || getCategoryEmoji(business.category)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold border border-blue-500/30">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Scan to Review</span>
                </div>
              </div>
            ) : (
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
                  {business.tagline || 'Rate your experience with us!'}
                </p>

                <div className="relative bg-white p-3 rounded-2xl mx-auto w-fit shadow-sm border border-slate-200">
                  {dataUrl ? (
                    <img src={dataUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg" />
                  )}
                  {includeCenterEmoji && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-lg overflow-hidden p-0.5">
                        {isImageLogo(business.logoUrl) ? (
                          <img
                            src={business.logoUrl!}
                            alt="Logo"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span>{business.logoUrl || getCategoryEmoji(business.category)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-bold tracking-wider uppercase text-slate-800">
                    Scan with Phone Camera
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Review on Google in seconds</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-slate-400">Frame Style:</span>
            <div className="inline-flex rounded-lg bg-slate-800/80 p-0.5 border border-slate-700">
              <button
                onClick={() => setFrameStyle('card')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  frameStyle === 'card' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stand Card
              </button>
              <button
                onClick={() => setFrameStyle('badge')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  frameStyle === 'badge' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark Badge
              </button>
              <button
                onClick={() => setFrameStyle('minimal')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  frameStyle === 'minimal' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Minimal
              </button>
            </div>
          </div>
        </div>

        {/* Right: Controls & Instant Actions */}
        <div className="flex-1 w-full space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart QR Studio</span>
            </div>
            <h2 className="text-xl font-bold text-white">Your Live Google Review QR Kit</h2>
            <p className="text-sm text-slate-400 mt-1">
              Place this QR on table tents, front counters, receipt slips, or checkout stands. Customers scan directly with their camera.
            </p>
          </div>

          {/* Unique Link Field with copy button */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <label className="text-xs font-medium text-slate-400 flex items-center justify-between">
              <span>Customer Review Link:</span>
              <span className="text-[11px] text-emerald-400 font-mono">Active & Synced</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={reviewUrl}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 selection:bg-blue-600 selection:text-white focus:outline-none"
              />
              <button
                onClick={copyUrl}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors"
                title="Open Review Page in New Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Color & customization controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <label className="text-xs text-slate-400 block mb-2 font-medium">QR Foreground Color</label>
              <div className="flex items-center gap-2">
                {[
                  { color: '#0f172a', name: 'Dark Slate' },
                  { color: '#2563eb', name: 'Electric Blue' },
                  { color: '#0ea5e9', name: 'Sky Blue' },
                  { color: '#1d4ed8', name: 'Royal Navy' },
                  { color: '#38bdf8', name: 'Ice Blue' },
                ].map((item) => (
                  <button
                    key={item.color}
                    onClick={() => setQrColor(item.color)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      qrColor === item.color ? 'scale-110 border-white ring-2 ring-blue-500/50' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: item.color }}
                    title={item.name}
                  />
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-300 font-medium">Center Icon Badge</p>
                <p className="text-[11px] text-slate-500">Show brand logo emoji</p>
              </div>
              <input
                type="checkbox"
                checked={includeCenterEmoji}
                onChange={(e) => setIncludeCenterEmoji(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
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
    </div>
  );
}
