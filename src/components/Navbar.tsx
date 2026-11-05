'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  QrCode, 
  LayoutDashboard, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'OWNER';
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check auth session on route change
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user && isMounted) {
            setUser(data.user);
          } else if (isMounted) {
            setUser(null);
          }
        }
      } catch {
        // Safe fallback
      }
    }
    checkAuth();
    return () => { isMounted = false; };
  }, [pathname]);

  const handleOpenLogoutModal = () => {
    setMobileMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setShowLogoutModal(false);
      toast.info('You have been signed out successfully.', 'Signed Out');
      window.location.href = '/login';
    } catch {
      setShowLogoutModal(false);
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      if (pathname === '/') {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', `/#${targetId}`);
        }
      }
    }
  };

  const handleMobileNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      if (pathname === '/') {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', `/#${targetId}`);
        }
      }
    }
  };

  // If on customer review page `/r/[slug]` or internal portal dashboards, hide SaaS website navbar
  if (
    pathname.startsWith('/r/') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  ) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Zone 1: Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Review<span className="text-blue-400">Pulse</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hidden sm:inline-block">
                  AI SaaS
                </span>
              </div>
            </Link>

            {/* Zone 2: Centered Glass Pill Navigation Menu */}
            <nav className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-inner">
              <Link
                href="/#features"
                onClick={(e) => handleNavClick(e, '/#features')}
                className="px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-full transition-all cursor-pointer"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                onClick={(e) => handleNavClick(e, '/#how-it-works')}
                className="px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-full transition-all cursor-pointer"
              >
                How It Works
              </Link>
              <Link
                href="/pricing"
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  pathname === '/pricing'
                    ? 'text-blue-400 bg-blue-500/15 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Pricing
              </Link>
              <Link
                href="/#roi-calculator"
                onClick={(e) => handleNavClick(e, '/#roi-calculator')}
                className="px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-full transition-all cursor-pointer"
              >
                ROI Calculator
              </Link>
              <Link
                href="/contact"
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  pathname === '/contact'
                    ? 'text-blue-400 bg-blue-500/15 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* Zone 3: Auth & Action CTAs */}
            <div className="hidden sm:flex items-center gap-2.5 shrink-0">
              {user ? (
                <div className="flex items-center gap-2.5">
                  {user.role === 'SUPER_ADMIN' ? (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20 group"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                      <span>Super Admin</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20 group"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}

                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                    <Link
                      href={user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard?tab=settings'}
                      title={user.role === 'SUPER_ADMIN' ? 'Super Admin Portal' : 'Account & Business Settings'}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all cursor-pointer group"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      <span className="font-semibold text-white truncate max-w-[110px]">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {user.role === 'SUPER_ADMIN' ? 'Admin' : 'Owner'}
                      </span>
                    </Link>

                    <button
                      onClick={handleOpenLogoutModal}
                      title="Sign out and return to Home"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-900 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register?plan=starter"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 text-white hover:brightness-110 shadow-lg shadow-blue-500/25 transition-all cursor-pointer group"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              {!user ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register?plan=starter"
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  >
                    Get Started
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle navigation menu"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle user menu"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {user ? (
              <>
                {user.role === 'SUPER_ADMIN' ? (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-sm text-blue-400 font-bold hover:bg-slate-900"
                  >
                    Super Admin Portal →
                  </Link>
                ) : (
                  <Link
                    href="/dashboard?tab=overview"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-sm text-blue-400 font-bold hover:bg-slate-900"
                  >
                    Admin Dashboard →
                  </Link>
                )}

                {/* Public links for logged-in user in mobile menu */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <Link
                    href="/#features"
                    onClick={(e) => handleMobileNavClick(e, '/#features')}
                    className="block px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    Features
                  </Link>
                  <Link
                    href="/#how-it-works"
                    onClick={(e) => handleMobileNavClick(e, '/#how-it-works')}
                    className="block px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    Pricing &amp; Features
                  </Link>
                  <Link
                    href="/#roi-calculator"
                    onClick={(e) => handleMobileNavClick(e, '/#roi-calculator')}
                    className="block px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    ROI Calculator
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-900"
                  >
                    Contact &amp; Support
                  </Link>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <Link
                    href={user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard?tab=settings'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-[11px] text-blue-400">
                        {user.role === 'SUPER_ADMIN' ? 'Super Admin Portal →' : 'Account & Settings →'}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={handleOpenLogoutModal}
                    className="text-xs text-rose-400 flex items-center gap-1 font-semibold p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1 pt-1">
                <Link
                  href="/#features"
                  onClick={(e) => handleMobileNavClick(e, '/#features')}
                  className="block px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
                >
                  Features
                </Link>
                <Link
                  href="/#how-it-works"
                  onClick={(e) => handleMobileNavClick(e, '/#how-it-works')}
                  className="block px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
                >
                  How It Works
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
                >
                  Pricing Plans
                </Link>
                <Link
                  href="/#roi-calculator"
                  onClick={(e) => handleMobileNavClick(e, '/#roi-calculator')}
                  className="block px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
                >
                  ROI Calculator
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
                >
                  Contact Support &amp; Sales
                </Link>
              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register?plan=starter"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  <span>Get Started</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>

    {/* Logout Confirmation Modal */}
    <ConfirmModal
      isOpen={showLogoutModal}
      onClose={() => {
        if (!isLoggingOut) setShowLogoutModal(false);
      }}
      onConfirm={handleConfirmLogout}
      title="Log Out of ReviewPulse?"
      description={
        <div className="space-y-3">
          <p className="text-slate-300">
            Are you sure you want to end your current session? You will need to sign in again to access your business analytics and review funnels.
          </p>
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white truncate text-xs">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate font-mono">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      }
      confirmText={isLoggingOut ? 'Logging out...' : 'Yes, Log Out'}
      cancelText="Stay Signed In"
      variant="danger"
      isLoading={isLoggingOut}
      icon={<LogOut className="w-6 h-6 text-rose-400" />}
    />
  </>
  );
}
