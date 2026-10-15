'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import SmartChipsManager from '@/components/SmartChipsManager';
import {
  QrCode,
  TrendingUp,
  Star,
  Users,
  ShieldCheck,
  ExternalLink,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Zap,
  MapPin,
  Loader2,
  RefreshCw,
  Save,
  Check,
  Copy,
  HelpCircle,
  User,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Store,
  AlertCircle,
  Link2,
  CreditCard,
  Clock,
  ArrowRight,
  Building2,
  Building,
  ChevronDown,
  Layers,
  X,
  Upload,
  Image as ImageIcon,
  Receipt,
  FileText,
  Calendar,
  Search,
  LogOut
} from 'lucide-react';
import GoogleReviewGuideModal from '@/components/GoogleReviewGuideModal';
import ConfirmModal from '@/components/ConfirmModal';
import RazorpayPaymentModal from '@/components/RazorpayPaymentModal';
import { useToast } from '@/components/ToastContext';
import { Business, PrivateFeedback, ScanEvent, PaymentTransactionItem } from '@/types';
import { isImageLogo, getCategoryEmoji } from '@/lib/logo';
import { PLANS_CONFIG, PlanKey } from '@/lib/payment';

interface DashboardStatsData {
  business: Business;
  userBusinesses?: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    activePlan: string;
    status: string;
    subscriptionStatus?: string;
    trialEndsAt?: string | Date | null;
    address?: string | null;
    logoUrl?: string | null;
  }>;
  transactions?: PaymentTransactionItem[];
  stats: {
    totalScans: number;
    googleConversions: number;
    privateFeedbackCount: number;
    unreadFeedbackCount: number;
    conversionRate: number;
    averageRating: number;
    devices: {
      ios: number;
      android: number;
      desktop: number;
    };
  };
  recentScans: ScanEvent[];
  feedbacks: PrivateFeedback[];
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const hasAutoPromptedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [data, setData] = useState<DashboardStatsData | null>(null);
  const tabParam = searchParams.get('tab');
  const validTabs = ['overview', 'qr', 'chips', 'feedback', 'billing', 'settings'] as const;
  const initialTab = tabParam && (validTabs as readonly string[]).includes(tabParam)
    ? (tabParam as typeof validTabs[number])
    : 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'qr' | 'chips' | 'feedback' | 'billing' | 'settings'>(initialTab);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<'starter' | 'pro' | 'enterprise'>('starter');

  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Business Settings form
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('restaurant');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [editSlug, setEditSlug] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGoogleReviewUrl, setEditGoogleReviewUrl] = useState('');
  const [editGooglePlaceId, setEditGooglePlaceId] = useState('');
  const [editWelcomeMessage, setEditWelcomeMessage] = useState('');
  const [editPrimaryColor, setEditPrimaryColor] = useState('#2563eb');
  const [editBypassAiReview, setEditBypassAiReview] = useState(false);
  const [syncChipsOnCategoryChange, setSyncChipsOnCategoryChange] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Account Owner Details form
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Password Change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Multi-location state
  const [selectedBizId, setSelectedBizId] = useState<string | null>(null);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocCategory, setNewLocCategory] = useState('fitness');
  const [newLocPlaceId, setNewLocPlaceId] = useState('');
  const [newLocReviewUrl, setNewLocReviewUrl] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocPhone, setNewLocPhone] = useState('');
  const [newLocSlug, setNewLocSlug] = useState('');
  const [newLocLogoUrl, setNewLocLogoUrl] = useState('');
  const [newLocLogoUploading, setNewLocLogoUploading] = useState(false);
  const newLocLogoInputRef = useRef<HTMLInputElement>(null);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [addLocError, setAddLocError] = useState<string | null>(null);

  // Logo file upload helper (FileReader -> base64 data URL)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'settings' | 'newLocation') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image file must be under 2MB. Please choose a smaller image or compressed file.', 'File Too Large');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, SVG, WebP)', 'Invalid File Type');
      return;
    }

    const reader = new FileReader();
    if (target === 'settings') setLogoUploading(true);
    else setNewLocLogoUploading(true);

    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (target === 'settings') {
        setEditLogoUrl(dataUrl);
        setLogoUploading(false);
        toast.success('Logo uploaded! Click "Save Business Details" to persist.', 'Logo Ready');
      } else {
        setNewLocLogoUrl(dataUrl);
        setNewLocLogoUploading(false);
        toast.success('Branch logo selected.', 'Logo Ready');
      }
    };

    reader.onerror = () => {
      if (target === 'settings') setLogoUploading(false);
      else setNewLocLogoUploading(false);
      toast.error('Failed to read image file', 'Error');
    };

    reader.readAsDataURL(file);
  };

  // Close location dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setLocationDropdownOpen(false);
      }
    }
    if (locationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [locationDropdownOpen]);

  // 1. Check Auth & Load Dashboard Data
  const loadDashboardData = async (targetBizId?: string) => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authRes.ok || !authData.authenticated) {
        router.push('/login');
        return;
      }

      setUser(authData.user);
      setEditUserName(authData.user.name || '');
      setEditUserEmail(authData.user.email || '');

      const activeBizId = targetBizId !== undefined ? targetBizId : selectedBizId;
      const url = activeBizId ? `/api/dashboard/stats?businessId=${encodeURIComponent(activeBizId)}` : '/api/dashboard/stats';
      const statsRes = await fetch(url);
      if (statsRes.ok) {
        const statsData: DashboardStatsData = await statsRes.json();
        setData(statsData);
        if (statsData.business?.id) {
          setSelectedBizId(statsData.business.id);
        }

        if (statsData.business) {
          setEditName(statsData.business.name || '');
          setEditCategory(statsData.business.category || 'restaurant');
          setEditSlug(statsData.business.slug || '');
          setEditLogoUrl(statsData.business.logoUrl || '');
          setEditTagline(statsData.business.tagline || '');
          setEditAddress(statsData.business.address || '');
          setEditPhone(statsData.business.phone || '');
          setEditGoogleReviewUrl(statsData.business.googleReviewUrl || '');
          setEditGooglePlaceId(statsData.business.googlePlaceId || '');
          setEditWelcomeMessage(statsData.business.welcomeMessage || '');
          setEditPrimaryColor(statsData.business.primaryColor || '#2563eb');
          setEditBypassAiReview(Boolean(statsData.business.bypassAiReview));
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-launch Razorpay Checkout if coming from signup (?activate=true) or business is pending payment
  useEffect(() => {
    if (data?.business && !hasAutoPromptedRef.current) {
      const activateParam = searchParams.get('activate');
      const planParam = searchParams.get('plan') as PlanKey;
      const isPending = data.business.subscriptionStatus === 'pending_payment' || data.business.subscriptionStatus === 'unpaid';

      if ((activateParam === 'true' || isPending) && data.business.subscriptionStatus !== 'active') {
        hasAutoPromptedRef.current = true;
        const validPlan: PlanKey = (['starter', 'pro', 'enterprise'].includes(planParam) 
          ? planParam 
          : (data.business.activePlan as PlanKey) || 'pro');
        setSelectedPlanForPayment(validPlan);
        setShowPaymentModal(true);
      }
    }
  }, [data, searchParams]);

  // Sync activeTab when query param changes (e.g. clicking Profile Icon or Admin Dashboard in navbar)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'qr', 'chips', 'feedback', 'billing', 'settings'].includes(tab)) {
      setActiveTab(tab as typeof activeTab);
    } else if (!tab) {
      setActiveTab('overview');
    }
  }, [searchParams]);

  // Multi-location helper handlers
  const maxLocations = data?.business?.activePlan === 'enterprise' ? 10 : data?.business?.activePlan === 'pro' ? 3 : 1;
  const currentLocCount = data?.userBusinesses?.length || 1;
  const canAddMoreLocs = currentLocCount < maxLocations;

  const handleOpenAddLocation = () => {
    if (canAddMoreLocs || user?.role === 'SUPER_ADMIN') {
      setShowAddLocationModal(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) {
      setAddLocError('Location name is required');
      return;
    }
    setIsCreatingLocation(true);
    setAddLocError(null);

    try {
      const rawPlaceVal = newLocPlaceId.trim();
      const isFullUrl = rawPlaceVal.startsWith('http://') || rawPlaceVal.startsWith('https://');
      const payloadReviewUrl = isFullUrl ? rawPlaceVal : newLocReviewUrl.trim() || undefined;
      const payloadPlaceId = !isFullUrl && rawPlaceVal ? rawPlaceVal : undefined;

      const res = await fetch('/api/dashboard/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLocName.trim(),
          category: newLocCategory,
          slug: newLocSlug.trim() || undefined,
          logoUrl: newLocLogoUrl.trim() || undefined,
          googlePlaceId: payloadPlaceId,
          googleReviewUrl: payloadReviewUrl,
          address: newLocAddress.trim() || undefined,
          phone: newLocPhone.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.business) {
        toast.success(`Location "${resData.business.name}" created successfully!`, 'Branch Added');
        setShowAddLocationModal(false);
        setNewLocName('');
        setNewLocSlug('');
        setNewLocLogoUrl('');
        setNewLocAddress('');
        setNewLocPhone('');
        setNewLocPlaceId('');
        setNewLocReviewUrl('');
        await loadDashboardData(resData.business.id);
      } else {
        setAddLocError(resData.error || 'Failed to create location');
        toast.error(resData.error || 'Failed to create location', 'Creation Failed');
      }
    } catch (err) {
      console.error('Failed to create location:', err);
      setAddLocError('Network error creating location');
      toast.error('Network error creating location', 'Error');
    } finally {
      setIsCreatingLocation(false);
    }
  };

  // 4. Save Business Settings (Name, Category, Slug, Google Link, Address, Phone, etc.)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.business) return;
    setSavingSettings(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    try {
      const res = await fetch('/api/dashboard/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.business.id,
          name: editName,
          category: editCategory,
          slug: editSlug,
          logoUrl: editLogoUrl,
          tagline: editTagline,
          address: editAddress,
          phone: editPhone,
          googleReviewUrl: editGoogleReviewUrl,
          googlePlaceId: editGooglePlaceId,
          welcomeMessage: editWelcomeMessage,
          primaryColor: editPrimaryColor,
          bypassAiReview: editBypassAiReview,
          resetChipsToCategory: syncChipsOnCategoryChange,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update business settings');
      }

      setSettingsSuccess('Business details updated successfully!');
      toast.success('Business details and settings saved successfully!', 'Saved');
      setTimeout(() => setSettingsSuccess(null), 4000);
      await loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update business settings';
      setSettingsError(msg);
      toast.error(msg, 'Save Failed');
    } finally {
      setSavingSettings(false);
    }
  };

  // 5. Save Account Owner Profile (Name, Email)
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    setAccountSuccess(null);
    setAccountError(null);

    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editUserName,
          email: editUserEmail,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update account profile');
      }

      setAccountSuccess('Account profile updated successfully!');
      toast.success('Account profile updated successfully!', 'Profile Saved');
      if (resData.user) {
        setUser((prev) => prev ? { ...prev, name: resData.user.name, email: resData.user.email } : null);
      }
      setTimeout(() => setAccountSuccess(null), 4000);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update account profile';
      setAccountError(msg);
      toast.error(msg, 'Update Failed');
    } finally {
      setSavingAccount(false);
    }
  };

  // 6. Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      const msg = 'New password must be at least 6 characters long';
      setPasswordError(msg);
      toast.error(msg, 'Validation Error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      const msg = 'New passwords do not match';
      setPasswordError(msg);
      toast.error(msg, 'Validation Error');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update password');
      }

      setPasswordSuccess('Password changed successfully!');
      toast.success('Password updated successfully!', 'Security Updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(msg);
      toast.error(msg, 'Update Failed');
    } finally {
      setSavingPassword(false);
    }
  };

  // 7. Toggle Feedback Resolution
  const handleToggleFeedback = async (feedbackId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'unread' ? 'resolved' : 'unread';
    try {
      const res = await fetch('/api/dashboard/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        toast.success(
          nextStatus === 'resolved' ? 'Private feedback marked as resolved.' : 'Feedback marked as unread.',
          'Feedback Updated'
        );
        await loadDashboardData();
      } else {
        toast.error('Failed to update feedback status', 'Error');
      }
    } catch (err) {
      console.error('Failed to update feedback:', err);
      toast.error('Network error updating feedback', 'Error');
    }
  };

  // Handle Subscription Plan Activation / Upgrade via Razorpay Modal
  const handleSwitchPlan = (planId: string) => {
    const validPlan = (['starter', 'pro', 'enterprise'].includes(planId) ? planId : 'starter') as 'starter' | 'pro' | 'enterprise';
    setSelectedPlanForPayment(validPlan);
    setShowPaymentModal(true);
  };

  // Handle Sign Out from Settings
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setConfirmLogoutOpen(false);
      toast.info('You have been signed out successfully.', 'Signed Out');
      router.push('/');
      router.refresh();
    } catch {
      setConfirmLogoutOpen(false);
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Loading live business portal...</p>
      </div>
    );
  }

  if (!data?.business) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-4 p-4 text-center">
        <AlertTriangle className="w-12 h-12 text-blue-500" />
        <h2 className="text-xl font-bold text-white">No Business Profile Found</h2>
        <p className="text-sm text-slate-400 max-w-md">
          Please register your business location to generate a live QR code and review dashboard.
        </p>
        <Link
          href="/register"
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-500"
        >
          Create Business Account
        </Link>
      </div>
    );
  }

  const { business, stats, recentScans, feedbacks } = data;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-800">
          <div className="flex-1 min-w-0">
            <div className="flex items-start sm:items-center gap-3.5">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-slate-800 bg-slate-900/90 text-blue-400 shrink-0 mt-0.5 sm:mt-0 overflow-hidden"
              >
                {isImageLogo(business.logoUrl) ? (
                  <img
                    src={business.logoUrl!}
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">{business.logoUrl || getCategoryEmoji(business.category)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug break-words">
                    {business.name}
                  </h1>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 whitespace-nowrap">
                      Live Database
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 whitespace-nowrap">
                      {business.activePlan === 'enterprise' ? 'Franchise Plan' : business.activePlan === 'pro' ? 'Pro Plan' : 'Starter Plan'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate max-w-sm">{business.address || 'Address not configured'}</span>
                  </span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="font-mono text-slate-400 shrink-0">slug: /{business.slug}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Live Link */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Multi-Location Switcher Dropdown */}
            <div className="relative shrink-0" ref={locationDropdownRef}>
              <button
                type="button"
                id="location-switcher-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocationDropdownOpen((prev) => !prev);
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-white text-xs font-semibold transition-all shadow-sm group cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="max-w-[140px] sm:max-w-[180px] md:max-w-[210px] truncate">{business.name}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700 shrink-0">
                  {currentLocCount}/{maxLocations}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform shrink-0 ${locationDropdownOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {locationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-3 bg-slate-950/70 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Locations ({currentLocCount})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {business.activePlan === 'enterprise'
                        ? 'Franchise Plan (10 slots)'
                        : business.activePlan === 'pro'
                        ? 'Pro Plan (3 slots)'
                        : 'Starter (1 slot)'}
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                    {data.userBusinesses && data.userBusinesses.length > 0 ? (
                      data.userBusinesses.map((loc) => {
                        const isSelected = loc.id === business.id;
                        return (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setLocationDropdownOpen(false);
                              if (!isSelected) {
                                loadDashboardData(loc.id);
                              }
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600/15 border border-blue-500/30 text-white font-bold'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden text-sm">
                                {isImageLogo(loc.logoUrl) ? (
                                  <img src={loc.logoUrl!} alt={loc.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{loc.logoUrl || getCategoryEmoji(loc.category)}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-white truncate">{loc.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {loc.address || `/${loc.slug}`}
                                </p>
                              </div>
                            </div>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-blue-400 shrink-0" />
                            ) : (
                              <span className="text-[10px] text-slate-500 uppercase font-medium">Switch</span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-2 text-xs text-slate-400 text-center">
                        {business.name}
                      </div>
                    )}
                  </div>

                  <div className="p-2 bg-slate-950/70">
                    <button
                      type="button"
                      onClick={() => {
                        setLocationDropdownOpen(false);
                        handleOpenAddLocation();
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                      <span>+ Add New Location</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Add Location Button - Sleek Dark Aesthetic (No bright blue) */}
            <button
              type="button"
              onClick={handleOpenAddLocation}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>Add Location</span>
            </button>

            <button
              onClick={() => loadDashboardData()}
              title="Refresh Analytics"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href={`/r/${business.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all group shrink-0"
            >
              <span>Scan Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Subscription Plan & Payment Status Notice Banner */}
        {(() => {
          const isPaidActive = business.subscriptionStatus === 'active';
          const isPendingPayment = business.subscriptionStatus === 'pending_payment' || business.subscriptionStatus === 'unpaid';
          const createdDate = new Date(business.createdAt || Date.now());
          const daysElapsed = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          const trialDaysRemaining = Math.max(0, 30 - daysElapsed);
          const isTrialExpired = !isPaidActive && !isPendingPayment && trialDaysRemaining <= 0;

          if (isPaidActive) {
            return (
              <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Subscription Active ({business.activePlan.toUpperCase()})
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {business.subscriptionCycle === 'annual' ? 'Billed Annually' : 'Billed Monthly'}
                      </span>
                      {business.subscriptionRenewsAt && (
                        <span className="text-[11px] text-slate-400">
                          Renews on {new Date(business.subscriptionRenewsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Your business is fully active on Google Review Funnel with unlimited scans and AI assistance.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm cursor-pointer shrink-0"
                >
                  Manage Billing
                </button>
              </div>
            );
          }

          if (isPendingPayment) {
            const planKey = (business.activePlan as PlanKey) || 'pro';
            const planCfg = PLANS_CONFIG[planKey] || PLANS_CONFIG.pro;
            const price = billingAnnual ? planCfg.annualTotal : planCfg.monthlyPrice;

            return (
              <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/70 border-2 border-blue-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Action Required: Payment Activation ({planKey.toUpperCase()} Tier)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Awaiting Payment
                      </span>
                      <span className="text-[11px] text-blue-300 font-medium">
                        ₹{price.toLocaleString('en-IN')} {billingAnnual ? '/year' : '/month'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Complete payment via the integrated Razorpay & UPI gateway to activate your physical QR code stands and live Google review funnel.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSwitchPlan(planKey)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black text-xs shadow-xl shadow-blue-500/25 transition-all cursor-pointer shrink-0 hover:scale-102"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Activate with UPI / Card (₹{price.toLocaleString('en-IN')})</span>
                </button>
              </div>
            );
          }

          if (isTrialExpired) {
            return (
              <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-950/60 via-rose-950/50 to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Subscription Inactive
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Payment Required
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Activate your subscription to keep review QR stands and AI features active.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSwitchPlan('starter')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer shrink-0"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Activate with UPI / Card (₹499)</span>
                </button>
              </div>
            );
          }

          return null;
        })()}

        {/* Google Review URL Setup Warning Banner */}
        {(() => {
          const isReviewUrlMissing = !business.googleReviewUrl || 
            business.googleReviewUrl.includes('writereview?business=') ||
            (!business.googleReviewUrl.startsWith('http') && !business.googlePlaceId);

          if (!isReviewUrlMissing) return null;

          return (
            <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-xl animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Action Required: Direct Google Review URL Not Configured
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Setup Needed
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Your customers need to be redirected to the exact profile for <strong className="text-white">{business.name}</strong>. Configure your verified Google Review URL or Place ID now.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setShowGuideModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
              >
                <Link2 className="w-4 h-4" />
                <span>Configure Review Link</span>
              </button>
            </div>
          );
        })()}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Analytics Overview', icon: TrendingUp },
            { id: 'qr', label: 'QR Kit & Printables', icon: QrCode },
            { id: 'chips', label: `Smart Review Chips (${business.smartChips?.length || 0})`, icon: Sparkles },
            { id: 'feedback', label: `Private Shield (${feedbacks.length})`, icon: ShieldCheck },
            { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
            { id: 'settings', label: 'Account & Business Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  router.replace(`/dashboard?tab=${tab.id}`, { scroll: false });
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Total QR Scans</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <QrCode className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  {stats.totalScans.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Real scan events captured</span>
                </div>
              </div>

              <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Google Redirects</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  {stats.googleConversions.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="font-semibold text-blue-400">{stats.conversionRate}%</span>
                  <span>scan-to-review conversion</span>
                </div>
              </div>

              <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Average Rating</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Star className="w-4 h-4 fill-blue-400 text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  <span>{stats.averageRating.toFixed(1)}</span>
                  <span className="text-xs font-normal text-blue-400">/ 5.0</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-blue-400" />
                  ))}
                  <span className="text-[10px] text-slate-400 ml-1">Customer Sentiment</span>
                </div>
              </div>

              <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Shield Interceptions</span>
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  {stats.privateFeedbackCount}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Negative reviews blocked from Google</span>
                </div>
              </div>
            </div>

            {/* Device breakdown & Recent Scan Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Live Scans Feed */}
              <div className="lg:col-span-2 rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Real-Time Scan Telemetry</h3>
                    <p className="text-xs text-slate-400">Actual foot-traffic scan log recorded in database</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono">
                    {stats.totalScans} Total Logs
                  </span>
                </div>

                <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                  {recentScans.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No scans recorded yet. Scan your QR code to see live events appear here!
                    </div>
                  ) : (
                    recentScans.map((scan) => (
                      <div key={scan.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                            <Smartphone className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-semibold text-white capitalize">
                              {scan.deviceType} User Scan
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {scan.actionTaken === 'copied_to_google' && (
                                <span className="text-emerald-400 font-medium">Copied review & opened Google Maps</span>
                              )}
                              {scan.actionTaken === 'private_feedback' && (
                                <span className="text-sky-400 font-medium">Submitted private resolution feedback</span>
                              )}
                              {scan.actionTaken === 'scanned' && (
                                <span className="text-slate-400">Scanned QR Code</span>
                              )}
                              {scan.actionTaken === 'bounced' && (
                                <span className="text-slate-500">Viewed portal</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Device Split Card */}
              <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Device Breakdown</h3>
                  <p className="text-xs text-slate-400">Operating systems of customers scanning QR</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Apple iOS (iPhone)</span>
                      <span className="font-mono text-slate-400">{stats.devices.ios} scans</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${stats.totalScans > 0 ? (stats.devices.ios / stats.totalScans) * 100 : 65}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Android Mobile</span>
                      <span className="font-mono text-slate-400">{stats.devices.android} scans</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{
                          width: `${stats.totalScans > 0 ? (stats.devices.android / stats.totalScans) * 100 : 30}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Desktop / Tablet</span>
                      <span className="font-mono text-slate-400">{stats.devices.desktop} scans</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full"
                        style={{
                          width: `${stats.totalScans > 0 ? (stats.devices.desktop / stats.totalScans) * 100 : 5}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mt-4 text-xs text-slate-400 leading-relaxed">
                  🛡️ <strong className="text-slate-200">Anti-Spam Filter:</strong> Scans and reviews are validated by IP and user agent to maintain authentic Google Place rating integrity.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QR KIT & PRINT STUDIO */}
        {activeTab === 'qr' && (
          <div className="space-y-6">
            <QRCodeGenerator
              business={business}
              onUpdateBusiness={async (updated) => {
                if (data?.business) {
                  setData({
                    ...data,
                    business: {
                      ...data.business,
                      ...updated,
                    },
                  });
                }
                if (updated.bypassAiReview !== undefined) {
                  setEditBypassAiReview(updated.bypassAiReview);
                }
              }}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          </div>
        )}

        {/* TAB 3: SMART REVIEW CHIPS */}
        {activeTab === 'chips' && (
          <SmartChipsManager
            business={business}
            onUpdateBusiness={async (updated) => {
              if (data?.business) {
                setData({
                  ...data,
                  business: {
                    ...data.business,
                    ...updated,
                  },
                });
              }
            }}
            onReloadDashboard={loadDashboardData}
          />
        )}

        {/* TAB 4: PRIVATE SHIELD FEEDBACK INBOX */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Private Feedback Shield Inbox</h3>
                  <p className="text-xs text-slate-400">
                    Customers who rated 1 to 3 stars had their complaints routed here instead of Google Maps.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {stats.unreadFeedbackCount} Pending Resolution
                </span>
              </div>

              <div className="divide-y divide-slate-800">
                {feedbacks.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No negative feedbacks received! All customers are leaving 4 and 5-star ratings.
                  </div>
                ) : (
                  feedbacks.map((fb) => (
                    <div key={fb.id} className="py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5 text-xs font-bold text-blue-400">
                            {fb.rating} <Star className="w-3 h-3 fill-blue-400" />
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {fb.customerName || 'Anonymous Customer'}
                          </span>
                          {fb.customerContact && (
                            <span className="text-[11px] text-blue-400 font-mono">
                              ({fb.customerContact})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            fb.status === 'unread'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {fb.status}
                          </span>
                          <button
                            onClick={() => handleToggleFeedback(fb.id, fb.status)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          >
                            Mark {fb.status === 'unread' ? 'Resolved' : 'Unread'}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                        &quot;{fb.feedbackText}&quot;
                      </p>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Received on {new Date(fb.createdAt).toLocaleDateString()} at {new Date(fb.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BILLING & SUBSCRIPTION PLANS */}
        {activeTab === 'billing' && (
          <div className="space-y-8 w-full">
            {/* Top Overview Title */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Secure Razorpay & UPI Payment Gateway • Instant Activation</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Subscription Plans & Billing</h2>
              <p className="text-xs text-slate-400 mt-1">
                Transparent Indian market pricing. Select the plan that fits your business or switch anytime with zero downtime.
              </p>
            </div>

            {/* Current Active Plan Status Card */}
            {(() => {
              const isPaid = business.subscriptionStatus === 'active';
              const isPending = business.subscriptionStatus === 'pending_payment' || business.subscriptionStatus === 'unpaid';

              return (
                <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Status:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {business.activePlan} Tier
                      </span>
                      {isPaid ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Subscription</span>
                        </span>
                      ) : isPending ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending Payment Activation</span>
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-2xl font-black text-white capitalize">
                      {business.activePlan === 'starter'
                        ? 'Starter Solo Plan (₹499/mo)'
                        : business.activePlan === 'pro'
                        ? 'Pro Growth Plan (₹999/mo)'
                        : 'Franchise & Agency Plan (₹2,499/mo)'}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      {isPaid
                        ? `Your subscription is active and renewed ${business.subscriptionCycle === 'annual' ? 'annually' : 'monthly'}. You have full access to your review funnel and live features.`
                        : `Your business plan is set to ${business.activePlan.toUpperCase()}. Complete payment below to activate full features.`}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                    <Link
                      href={`/r/${business.slug}`}
                      target="_blank"
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <span>Test Live Funnel</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })()}

            {/* Multi-Location Network Manager Card */}
            <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        Multi-Location Network Manager
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {business.activePlan === 'enterprise'
                          ? 'Franchise & Agency'
                          : business.activePlan === 'pro'
                          ? 'Pro Growth'
                          : 'Starter Solo'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {business.activePlan === 'enterprise'
                        ? `Your Franchise plan supports up to 10 separate gym branches, clinic outlets, or agency accounts (${currentLocCount} of 10 used).`
                        : business.activePlan === 'pro'
                        ? `Your Pro plan supports up to 3 separate business locations (${currentLocCount} of 3 used).`
                        : `Starter Solo supports 1 location. Upgrade to Franchise & Agency to add up to 10 branches.`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddLocation}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700/80 hover:border-slate-600 text-xs font-semibold transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span>+ Add New Location</span>
                </button>
              </div>

              {/* Network Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.userBusinesses && data.userBusinesses.length > 0 ? (
                  data.userBusinesses.map((loc, idx) => {
                    const isCurrent = loc.id === business.id;
                    return (
                      <div
                        key={loc.id}
                        className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                          isCurrent
                            ? 'bg-blue-950/30 border-blue-500/50 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Branch #{idx + 1}
                            </span>
                            {isCurrent ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Active in Dashboard
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Live
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden text-xl shadow-inner">
                              {isImageLogo(loc.logoUrl) ? (
                                <img src={loc.logoUrl!} alt={loc.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{loc.logoUrl || getCategoryEmoji(loc.category)}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-base font-bold text-white tracking-tight truncate">
                                {loc.name}
                              </h4>
                              <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{loc.address || 'Address not configured'}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              /r/{loc.slug}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {loc.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                          {isCurrent ? (
                            <div className="flex-1 py-2 text-center text-xs font-semibold text-blue-400 bg-blue-500/10 rounded-xl border border-blue-500/20">
                              ✓ Current Dashboard
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => loadDashboardData(loc.id)}
                              className="flex-1 py-2 text-center text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                            >
                              Switch Dashboard ➔
                            </button>
                          )}
                          <Link
                            href={`/r/${loc.slug}`}
                            target="_blank"
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Preview Customer Scan Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : null}

                {/* Placeholder Slot Card for Adding Next Location */}
                {canAddMoreLocs && (
                  <button
                    type="button"
                    onClick={handleOpenAddLocation}
                    className="rounded-2xl p-5 border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-950/30 hover:bg-slate-900/40 text-slate-400 hover:text-blue-400 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[160px] cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-blue-500/30 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white">
                      + Add Location #{currentLocCount + 1}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Slot {currentLocCount + 1} of {maxLocations} Available
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Monthly / Annual Billing Toggle */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className={`text-xs font-semibold ${!billingAnnual ? 'text-white' : 'text-slate-400'}`}>
                Monthly Billing
              </span>
              <button
                type="button"
                onClick={() => setBillingAnnual(!billingAnnual)}
                className="w-12 h-6 rounded-full bg-slate-800 p-1 flex items-center transition-colors focus:outline-none border border-slate-700 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-blue-600 transition-transform ${
                    billingAnnual ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${billingAnnual ? 'text-white' : 'text-slate-400'} flex items-center gap-1.5`}>
                <span>Annual Billing</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  SAVE 20%
                </span>
              </span>
            </div>

            {/* REVIEWER & SHOWCASE TEST PAYMENT GUIDE BANNER */}
            <div className="rounded-2xl p-5 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      LinkedIn Showcase & Test Payment Guide
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      You or reviewers can test plan upgrades in live Razorpay test sandbox with any of these methods:
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-bold">
                    Test Mode Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      <span>Netbanking (Recommended)</span>
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Fastest</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Select <strong>HDFC, ICICI, or SBI</strong> in Razorpay pop-up ➔ Click <strong>Pay</strong> ➔ Click green <strong>&quot;Success&quot;</strong> button!
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                      <span>Indian Domestic Card</span>
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-blue-300 font-bold select-all">
                    4386 2894 0766 0153
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Expiry: <code>12/28</code> • CVV: <code>123</code> ➔ Click <strong>&quot;Success&quot;</strong> on OTP
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                      <span>UPI & 1-Click Simulation</span>
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold select-all">
                    success@razorpay
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Or click <strong>Instant 1-Click Simulation</strong> directly inside the checkout modal.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Tier Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* TIER 1: STARTER SOLO */}
              <div className={`rounded-3xl p-6 bg-slate-900/70 border space-y-5 flex flex-col justify-between transition-all ${
                business.activePlan === 'starter'
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xl shadow-blue-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter Solo</span>
                    {business.activePlan === 'starter' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                        Current Active
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white font-mono">
                        ₹{billingAnnual ? '399' : '499'}
                      </span>
                      <span className="text-xs text-slate-400"> / month</span>
                    </div>
                    {billingAnnual && (
                      <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                        Billed annually (₹4,788/yr)
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Perfect for single-location cafes, neighborhood clinics, solo salons & boutique gyms.
                  </p>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>1 Business Location</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Unlimited QR Scans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Interactive 1-5★ Customer Portal</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Direct Google Place ID & Maps Sync</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Up to 6 Custom Smart Review Chips</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Live Gemini AI Review Writer & Polish</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Private Negative Review Shield (1-3★)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Private Feedback Inbox in Dashboard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Instant High-Res QR Code Generator</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={updatingPlan}
                  onClick={() => handleSwitchPlan('starter')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    business.activePlan === 'starter'
                      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {business.activePlan === 'starter' ? '✓ Current Plan (Test Checkout)' : 'Switch to Starter (₹499/mo)'}
                </button>
              </div>

              {/* TIER 2: PRO GROWTH */}
              <div className={`rounded-3xl p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/20 border-2 space-y-5 flex flex-col justify-between relative transition-all ${
                business.activePlan === 'pro'
                  ? 'border-blue-500 shadow-2xl shadow-blue-500/20'
                  : 'border-blue-500/50 hover:border-blue-400'
              }`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                  Most Popular
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Pro Growth</span>
                    {business.activePlan === 'pro' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                        Current Active
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white font-mono">
                        ₹{billingAnnual ? '799' : '999'}
                      </span>
                      <span className="text-xs text-slate-400"> / month</span>
                    </div>
                    {billingAnnual && (
                      <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                        Billed annually (₹9,588/yr)
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    For busy gyms, fitness centers, multi-chair clinics & restaurants scaling review volume.
                  </p>

                  <ul className="space-y-2.5 text-xs text-slate-200 pt-3 border-t border-slate-800">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Up to 3 Business Locations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Unlimited QR Scans & Live Gemini AI</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Unlimited Smart Review Chips</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>All Category Presets (Gym, Salon, Dining, Auto)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Feedback Status Tracking (New, Reviewed, Resolved)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Interactive Scan vs Conversion Analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Custom Brand Theme Colors & Welcome Message</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>High-Resolution PNG & SVG QR Code Export</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Multi-Location Switcher in Dashboard</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={updatingPlan}
                  onClick={() => handleSwitchPlan('pro')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    business.activePlan === 'pro'
                      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {business.activePlan === 'pro' ? '✓ Current Plan (Test Checkout)' : 'Switch to Pro (₹999/mo)'}
                </button>
              </div>

              {/* TIER 3: FRANCHISE & AGENCY */}
              <div className={`rounded-3xl p-6 bg-slate-900/70 border space-y-5 flex flex-col justify-between transition-all ${
                business.activePlan === 'enterprise'
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xl shadow-blue-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Franchise & Agency</span>
                    {business.activePlan === 'enterprise' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                        Current Active
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white font-mono">
                        ₹{billingAnnual ? '1,999' : '2,499'}
                      </span>
                      <span className="text-xs text-slate-400"> / month</span>
                    </div>
                    {billingAnnual && (
                      <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                        Billed annually (₹23,988/yr)
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    For multi-unit gym chains, dental networks, restaurant groups & agency client management.
                  </p>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Up to 10 Locations (Expandable)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Central Super-Admin Platform Dashboard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Global Multi-Tenant Overview & Telemetry</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Business Directory with Active/Paused Toggles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Instant Business Provisioning Modal</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Full Pro Features across All 10 Locations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Direct Access to Location Portals & Settings</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={updatingPlan}
                  onClick={() => handleSwitchPlan('enterprise')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    business.activePlan === 'enterprise'
                      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {business.activePlan === 'enterprise' ? '✓ Current Plan (Test Checkout)' : 'Switch to Franchise (₹2,499/mo)'}
                </button>
              </div>
            </div>

            {/* Payment Methods & Indian Gateway Assurance */}
            <div className="rounded-2xl p-5 bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    RBI-Compliant Indian Payment Gateway
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Supports instant UPI QR code scan (GPay, PhonePe, Paytm), RuPay & Visa debit/credit cards, and NetBanking.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold">
                  UPI / GPay / PhonePe
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold">
                  RuPay & Cards
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold">
                  NetBanking
                </span>
              </div>
            </div>

            {/* Invoices & Payment History Section */}
            <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Invoices & Payment History</h3>
                    <p className="text-xs text-slate-400">
                      View official GST-ready payment receipts and transaction records.
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {data.transactions?.length || 0} {data.transactions?.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>

              {data.transactions && data.transactions.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Plan & Cycle</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">Transaction / Order ID</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {data.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-white font-medium whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            <span className="capitalize">{tx.plan}</span> ({tx.billingCycle === 'annual' ? 'Annual' : 'Monthly'})
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            ₹{(tx.amount / 100).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 uppercase text-[11px] font-mono text-slate-400">
                            {tx.paymentMethod?.replace('_', ' ') || 'UPI'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[140px]" title={tx.orderId}>
                            {tx.orderId}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              <span>Paid</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No Past Invoices Found</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Your business is currently in the 30-Day Free Trial period. Receipts and tax invoices will automatically appear here once payments are made.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: ACCOUNT & BUSINESS SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-8 w-full">
            {/* Top overview title */}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Account & Business Settings</h2>
              <p className="text-xs text-slate-400 mt-1">
                Manage and update all your signup details: Business configuration, Owner Profile credentials, and Password security.
              </p>
            </div>

            {/* SECTION 1: BUSINESS PROFILE & REVIEW FUNNEL */}
            <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Business Profile & Review Links</h3>
                  <p className="text-xs text-slate-400">
                    Update the business information, category, custom URL slug, and Google review target.
                  </p>
                </div>
              </div>

              {settingsSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {settingsError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-5">
                {/* Brand Logo & Custom Icon Manager */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
                    <div>
                      <label className="block text-xs font-bold text-white uppercase tracking-wider">
                        Brand Logo & Custom Icon
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Appears at the top of customer review scanners, center of table standee QR codes, and dashboard header.
                      </p>
                    </div>
                    {editLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditLogoUrl('')}
                        className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors font-medium cursor-pointer"
                      >
                        Reset to Default Icon
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
                    {/* Live Preview Avatar */}
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-slate-700/80 shadow-xl flex items-center justify-center overflow-hidden">
                        {isImageLogo(editLogoUrl) ? (
                          <img
                            src={editLogoUrl}
                            alt="Logo Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">
                            {editLogoUrl || getCategoryEmoji(editCategory)}
                          </span>
                        )}
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        Preview
                      </span>
                    </div>

                    {/* Upload & URL Controls */}
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <input
                          ref={logoFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoFileUpload(e, 'settings')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={logoUploading}
                          onClick={() => logoFileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {logoUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-blue-400" />
                          )}
                          <span>Upload Image (PNG, JPG, SVG, WebP)</span>
                        </button>
                        <span className="text-[11px] text-slate-500">Instant file upload • Max 2MB</span>
                      </div>

                      {/* Direct URL input */}
                      <div>
                        <div className="relative">
                          <Link2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={editLogoUrl.startsWith('data:') ? 'Custom uploaded image (stored)' : editLogoUrl}
                            onChange={(e) => setEditLogoUrl(e.target.value)}
                            placeholder="Or paste direct image URL (https://... or emoji)"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Quick Emoji Presets */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Or Choose Quick Industry Icon:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { emoji: '🏋️', label: 'Gym' },
                            { emoji: '🍽️', label: 'Dining' },
                            { emoji: '🦷', label: 'Clinic' },
                            { emoji: '✂️', label: 'Salon' },
                            { emoji: '🏎️', label: 'Auto' },
                            { emoji: '🛍️', label: 'Retail' },
                            { emoji: '⭐', label: 'Star' },
                            { emoji: '👑', label: 'Crown' },
                            { emoji: '⚡', label: 'Power' },
                            { emoji: '☕', label: 'Cafe' },
                          ].map((item) => (
                            <button
                              key={item.emoji}
                              type="button"
                              onClick={() => setEditLogoUrl(item.emoji)}
                              className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer ${
                                editLogoUrl === item.emoji
                                  ? 'bg-blue-600 text-white font-bold border border-blue-500 shadow-sm'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                              }`}
                              title={item.label}
                            >
                              <span>{item.emoji}</span>
                              <span className="text-[10px]">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Golden Crust Bakery"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Business Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="restaurant">Dining / Restaurant / Cafe</option>
                      <option value="clinic">Medical / Dental Clinic</option>
                      <option value="salon">Salon / Spa / Barbershop</option>
                      <option value="retail">Boutique / Retail Store</option>
                      <option value="automotive">Automotive / Auto Repair</option>
                      <option value="fitness">Gym / Fitness Studio</option>
                    </select>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer text-[11px] text-slate-400 hover:text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={syncChipsOnCategoryChange}
                        onChange={(e) => setSyncChipsOnCategoryChange(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                      />
                      <span>Auto-sync review chips to {editCategory} template on save</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Custom Review URL Slug
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="e.g. golden-crust"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Public scan link: <span className="text-blue-400 font-mono">/r/{editSlug || 'your-slug'}</span></span>
                      <a
                        href={`/r/${editSlug || business.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                        title="Open Customer Review Portal"
                      >
                        <span>Open Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Tagline / Specialty
                    </label>
                    <input
                      type="text"
                      value={editTagline}
                      onChange={(e) => setEditTagline(e.target.value)}
                      placeholder="e.g. Authentic Wood-Fired Pizza"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Physical Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="742 Evergreen Terrace"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Direct Google Review URL
                      </label>
                      {(!editGoogleReviewUrl || editGoogleReviewUrl.includes('writereview?business=')) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Setup Needed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const query = [editName || business.name, editAddress || business.address].filter(Boolean).join(' ');
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-slate-300 hover:text-white font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-blue-400" />
                        <span>Find on Maps ↗</span>
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => setShowGuideModal(true)}
                        className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Guide & Place ID</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Link2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={editGoogleReviewUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          const trimmed = val.trim();
                          if (trimmed.startsWith('ChIJ') && !trimmed.includes('http')) {
                            setEditGoogleReviewUrl(`https://search.google.com/local/writereview?placeid=${trimmed}`);
                            toast.success('Place ID formatted into direct review URL!', 'Auto-Formatted');
                          } else {
                            setEditGoogleReviewUrl(val);
                          }
                        }}
                        placeholder="https://search.google.com/local/writereview?placeid=... or g.page/r/..."
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Copy & Redirect Buttons */}
                    {editGoogleReviewUrl.trim() && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(editGoogleReviewUrl.trim());
                            toast.success('Google review link copied to clipboard!', 'Copied');
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                          title="Copy Google Review Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>

                        <a
                          href={editGoogleReviewUrl.trim()}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                          title="Test Redirect: Open Google Review Link in New Tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {editGoogleReviewUrl.includes('writereview?business=') ? (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-tight">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        ⚠️ Unsupported search URL detected (writereview?business=). Please update this with your verified Google Business short link or Place ID so the exact cafe appears.
                      </span>
                    </div>
                  ) : !editGoogleReviewUrl.trim() ? (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-tight">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        Direct Google Review link is not configured. When customers scan your QR stand, they will be sent to Google Maps search rather than your 5-star write-review popup.
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Direct 5-star review link configured.
                    </p>
                  )}

                  {/* Direct Google Review Bypass Setting */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Bypass AI Review Page (Direct to Google)</span>
                          </label>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                            Fast Track
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          When enabled, camera scans of your QR stand will immediately bypass the AI assistant and open Google Reviews directly.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                        <input
                          type="checkbox"
                          checked={editBypassAiReview}
                          onChange={(e) => setEditBypassAiReview(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {/* Live Redirect Test Link & Destination Preview */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400 truncate flex-1 min-w-0">
                        <span className="text-slate-500 font-medium whitespace-nowrap">Scan Destination:</span>
                        <span className="font-mono text-slate-200 truncate">
                          {editBypassAiReview
                            ? (editGoogleReviewUrl.trim() || 'Google Maps Search')
                            : `/r/${editSlug || business.slug}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={
                            editBypassAiReview
                              ? (editGoogleReviewUrl.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editName || business.name)}`)
                              : `/r/${editSlug || business.slug}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{editBypassAiReview ? 'Test Direct Redirect' : 'Test Review Portal'}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Customer Welcome Prompt
                  </label>
                  <textarea
                    rows={2}
                    value={editWelcomeMessage}
                    onChange={(e) => setEditWelcomeMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/20"
                  >
                    {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Business Details</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SECTION 2: OWNER ACCOUNT PROFILE (SIGNUP NAME & EMAIL) */}
            <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Owner Account Profile</h3>
                  <p className="text-xs text-slate-400">
                    Change your personal name and login work email address.
                  </p>
                </div>
              </div>

              {accountSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{accountSuccess}</span>
                </div>
              )}

              {accountError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{accountError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={editUserName}
                        onChange={(e) => setEditUserName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Work Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={editUserEmail}
                        onChange={(e) => setEditUserEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Account Role:</span>
                    <span className="font-semibold text-white uppercase text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {user?.role || 'OWNER'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Email is used to sign into your dashboard
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingAccount}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/20"
                  >
                    {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Update Account Profile</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SECTION 3: CHANGE PASSWORD & CREDENTIALS */}
            <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Password & Security</h3>
                  <p className="text-xs text-slate-400">
                    Change your account password securely by confirming your current password.
                  </p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 chars"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/20"
                  >
                    {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>Update Password</span>
                  </button>

                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-400 hover:underline cursor-pointer"
                  >
                    Forgot current password? Reset with OTP →
                  </Link>
                </div>
              </form>
            </div>

            {/* SECTION 4: ACTIVE SESSION & LOG OUT */}
            <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Active Session</h3>
                  <p className="text-xs text-slate-400">
                    Currently signed in as <span className="text-white font-medium">{user?.email || 'Admin'}</span>. End your session securely.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmLogoutOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs transition-all cursor-pointer shadow-sm shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Account</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <GoogleReviewGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        defaultBusinessName={data?.business?.name || editName || ''}
        onSelectUrl={(url) => setEditGoogleReviewUrl(url)}
        isSignUp={false}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmLogoutOpen}
        onClose={() => {
          if (!isLoggingOut) setConfirmLogoutOpen(false);
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
                  <User className="w-4 h-4" />
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

      {/* ADD NEW LOCATION MODAL */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer"
            onClick={() => {
              setShowAddLocationModal(false);
              setAddLocError(null);
            }}
            aria-hidden="true"
          />

          <div 
            className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 relative z-10 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Add New Branch Location</h3>
                  <p className="text-xs text-slate-400">
                    {data?.business?.activePlan === 'enterprise' 
                      ? 'Franchise & Agency Plan • Up to 10 locations included'
                      : data?.business?.activePlan === 'pro'
                      ? 'Pro Growth Plan • Up to 3 locations included'
                      : 'Starter Plan • 1 location included'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddLocationModal(false);
                  setAddLocError(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addLocError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addLocError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateLocation} className="space-y-4">
              {/* Location Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Branch / Location Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="e.g. Jack Gym - Downtown Branch"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Industry Category
                  </label>
                  <select
                    value={newLocCategory}
                    onChange={(e) => setNewLocCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="fitness">Fitness & Gym</option>
                    <option value="clinic">Healthcare & Dental Clinic</option>
                    <option value="salon">Salon & Spa</option>
                    <option value="restaurant">Restaurant & Cafe</option>
                    <option value="automotive">Automotive & Garage</option>
                    <option value="retail">Retail & Shopping</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Auto-seeds industry smart review chips
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Custom URL Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={newLocSlug}
                    onChange={(e) => setNewLocSlug(e.target.value)}
                    placeholder="e.g. jack-gym-downtown"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Live link: /r/{"<slug>"}
                  </p>
                </div>
              </div>

              {/* Branch Logo / Custom Icon (Optional) */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Branch Logo / Custom Icon (Optional)
                  </label>
                  {newLocLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setNewLocLogoUrl('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden text-xl">
                    {isImageLogo(newLocLogoUrl) ? (
                      <img src={newLocLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span>{newLocLogoUrl || getCategoryEmoji(newLocCategory)}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        ref={newLocLogoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoFileUpload(e, 'newLocation')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={newLocLogoUploading}
                        onClick={() => newLocLogoInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {newLocLogoUploading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3 text-blue-400" />
                        )}
                        <span>Upload File</span>
                      </button>
                      <input
                        type="text"
                        value={newLocLogoUrl.startsWith('data:') ? 'Custom uploaded image' : newLocLogoUrl}
                        onChange={(e) => setNewLocLogoUrl(e.target.value)}
                        placeholder="Or paste image URL / emoji"
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={newLocAddress}
                    onChange={(e) => setNewLocAddress(e.target.value)}
                    placeholder="e.g. 100 Feet Rd, Indiranagar, Bengaluru"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={newLocPhone}
                    onChange={(e) => setNewLocPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Google Place ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Google Place ID or Direct Review URL
                </label>
                <input
                  type="text"
                  value={newLocPlaceId}
                  onChange={(e) => setNewLocPlaceId(e.target.value)}
                  placeholder="e.g. ChIJK83_fbs5DW0RN8bobnpqt2M"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Where 4 & 5-star positive reviews are routed. Can also be updated later in Settings.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLocationModal(false);
                    setAddLocError(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingLocation || !newLocName.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-sm transition-all cursor-pointer"
                >
                  {isCreatingLocation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Branch...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create & Switch to Location</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPGRADE / PLAN SWITCH PROMPT MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer"
            onClick={() => setShowUpgradeModal(false)}
            aria-hidden="true"
          />

          <div 
            className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 relative z-10 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Unlock Multi-Location</h3>
                  <p className="text-xs text-slate-400">Manage multiple branches from 1 login</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your current <strong>Starter Solo</strong> plan (₹499/mo) includes 1 location. To add another branch, gym outlet, or clinic location, upgrade to:
            </p>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Test Mode Active • Pay via Netbanking, Card 4386..., or 1-Click Simulation</span>
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Franchise & Agency (Recommended)</h4>
                  <p className="text-[11px] text-slate-400">Up to 10 locations + super-admin platform</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    handleSwitchPlan('enterprise');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Switch (₹2,499)
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Pro Growth</h4>
                  <p className="text-[11px] text-slate-400">Up to 3 locations + full AI features</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    handleSwitchPlan('pro');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  Switch (₹999)
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  setActiveTab('billing');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                View Full Plan Comparison ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAZORPAY & UPI PAYMENT CHECKOUT MODAL */}
      <RazorpayPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlanForPayment}
        billingCycle={billingAnnual ? 'annual' : 'monthly'}
        businessId={business.id}
        businessName={business.name}
        onPaymentSuccess={() => {
          loadDashboardData(business.id);
          router.replace('/dashboard');
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading live business portal...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
