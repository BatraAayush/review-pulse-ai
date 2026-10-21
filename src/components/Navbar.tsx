'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  QrCode, 
  LayoutDashboard, 
  ShieldCheck, 
  ExternalLink, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'OWNER';
}

interface CurrentBusiness {
  id: string;
  slug: string;
  name: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<CurrentBusiness | null>(null);
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
            setCurrentBusiness(data.currentBusiness || null);
          } else if (isMounted) {
            setUser(null);
            setCurrentBusiness(null);
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
      setCurrentBusiness(null);
      setShowLogoutModal(false);
      toast.info('You have been signed out successfully.', 'Signed Out');
      router.push('/');
      router.refresh();
    } catch {
      setShowLogoutModal(false);
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // If on customer review page `/r/[slug]`, hide SaaS header for clean mobile experience
  if (pathname.startsWith('/r/')) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <QrCode className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Review<span className="text-blue-400">Pulse</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                AI SaaS
              </span>
            </div>
          </Link>

          {/* Right Action: Clean single button */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Single Role-Specific Portal Button */}
                {user.role === 'SUPER_ADMIN' ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Super Admin Portal</span>
                  </Link>
                ) : (
                  <>
                    {currentBusiness && (
                      <Link
                        href={`/r/${currentBusiness.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-700 transition-all"
                        title="Open customer review funnel"
                      >
                        <span>View Scan Page</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    )}
                    <Link
                      href="/dashboard?tab=overview"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </>
                )}

                {/* User Info & Logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <Link
                    href="/dashboard?tab=settings"
                    title="Account & Business Settings"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all cursor-pointer group"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <span className="font-semibold text-white truncate max-w-[120px] group-hover:underline">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700 transition-colors">
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </span>
                  </Link>

                  <button
                    onClick={handleOpenLogoutModal}
                    title="Sign out and return to Home"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* When not logged in: guest navigation */
              <div className="flex items-center gap-4">
                <Link
                  href="/#features"
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/#how-it-works"
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  How It Works
                </Link>
                <Link
                  href="/#pricing"
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register?plan=pro"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 text-white hover:brightness-110 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>Start Free</span>
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
                  href="/register?plan=pro"
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20"
                >
                  Start Free
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
                  Super Admin Portal
                </Link>
              ) : (
                <>
                  {currentBusiness && (
                    <Link
                      href={`/r/${currentBusiness.slug}`}
                      target="_blank"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-900 flex items-center justify-between"
                    >
                      <span>View Customer Scan Page</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                  )}
                  <Link
                    href="/dashboard?tab=overview"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-sm text-blue-400 font-bold hover:bg-slate-900"
                  >
                    Admin Dashboard
                  </Link>
                </>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href="/dashboard?tab=settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-[11px] text-blue-400">Account &amp; Settings →</p>
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
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
              >
                How It Works
              </Link>
              <Link
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-900 font-medium"
              >
                Pricing Plans
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
                  href="/register?plan=pro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  <span>Start Free</span>
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
