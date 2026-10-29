import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SaaSProvider } from '@/lib/store';
import { ToastProvider } from '@/components/ToastContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://review-pulse-ai-ab.vercel.app'),
  title: 'ReviewPulse AI | Smart QR & NFC Google Review SaaS',
  description: 'Turn physical foot traffic into 5-star Google reviews in 15 seconds with anti-spam Gemini AI and private negative review routing.',
  openGraph: {
    title: 'ReviewPulse AI — Smart QR & NFC Google Review SaaS Platform',
    description: 'Physical-to-digital review funnel bridging Google Gemini AI persona synthesis, private grievance routing, and real-time conversion telemetry.',
    url: 'https://review-pulse-ai-ab.vercel.app',
    siteName: 'ReviewPulse AI',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'ReviewPulse AI Logo and Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReviewPulse AI | Smart QR Google Review SaaS',
    description: 'Turn physical foot traffic into 5-star Google reviews in 15 seconds.',
    images: ['/icon-512.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark scroll-smooth antialiased`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
        <ToastProvider>
          <SaaSProvider>
            {children}
          </SaaSProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
