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
  title: 'ReviewPulse AI | Smart QR Google Review SaaS',
  description: 'Skyrocket your Google 5-Star reviews effortlessly with AI-powered NFC & QR code review funnels for restaurants, clinics, and local businesses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}>
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
