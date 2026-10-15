'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ShieldCheck,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  ExternalLink,
  Power,
  CheckCircle2,
  AlertCircle,
  Eye,
  Settings2,
  QrCode,
  Filter,
  Loader2,
  Lock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  Smartphone,
  Laptop,
  Sparkles,
  ArrowDown,
  X
} from 'lucide-react';

interface ScanLogItem {
  id: string;
  timestamp: string;
  deviceType: string;
  actionTaken: string;
  business: {
    name: string;
    slug: string;
  };
}

function formatRelativeTime(dateString: string): string {
  const now = new Date().getTime();
  const past = new Date(dateString).getTime();
  const diffSecs = Math.max(0, Math.floor((now - past) / 1000));

  if (diffSecs < 10) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffSecs / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

interface BusinessTenant {
  id: string;
  name: string;
  slug: string;
  category: string;
  ownerName: string;
  ownerEmail: string;
  activePlan: string;
  status: string;
  totalScans: number;
  totalFeedbacks: number;
  smartChipsCount: number;
  createdAt: string;
}

interface AdminOverviewData {
  stats: {
    totalBusinesses: number;
    totalUsers: number;
    totalScans: number;
    totalFeedbacks: number;
    totalMRR: number;
    growthPercentage: number;
  };
  businesses: BusinessTenant[];
  recentScans: Array<ScanLogItem>;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New business form state
  const [newName, setNewName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newCategory, setNewCategory] = useState('restaurant');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Password@123');
  const [newReviewUrl, setNewReviewUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Telemetry Scan Stream State
  const [scans, setScans] = useState<ScanLogItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamLoading, setStreamLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [pendingScans, setPendingScans] = useState<ScanLogItem[]>([]);
  const [scanFilterAction, setScanFilterAction] = useState<string>('all');
  const [scanSearch, setScanSearch] = useState<string>('');
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set());

  const scansRef = useRef(scans);
  scansRef.current = scans;

  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;

  const pendingScansRef = useRef(pendingScans);
  pendingScansRef.current = pendingScans;

  const loadAdminData = async () => {
    try {
      // 1. Check current session
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authRes.ok || !authData.authenticated) {
        router.push('/login');
        return;
      }

      if (authData.user.role !== 'SUPER_ADMIN') {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      // 2. Fetch admin overview
      const adminRes = await fetch('/api/admin/overview');
      if (adminRes.ok) {
        const adminData: AdminOverviewData = await adminRes.json();
        setData(adminData);
        if (scansRef.current.length === 0 && adminData.recentScans?.length > 0) {
          setScans(adminData.recentScans);
          setHasMoreOlder(adminData.recentScans.length >= 20);
        }
      }
    } catch (err) {
      console.error('Failed to load super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialScans = async (action = scanFilterAction, search = scanSearch) => {
    setStreamLoading(true);
    try {
      const url = new URL('/api/admin/scans', window.location.origin);
      url.searchParams.set('limit', '20');
      if (action !== 'all') {
        url.searchParams.set('action', action);
      }
      if (search.trim()) {
        url.searchParams.set('search', search.trim());
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const result = await res.json();
        setScans(result.scans || []);
        setHasMoreOlder(result.hasMore || false);
        setPendingScans([]);
      }
    } catch (err) {
      console.error('Failed to load initial scans:', err);
    } finally {
      setStreamLoading(false);
    }
  };

  const handleLoadOlder = async () => {
    if (loadingOlder || scans.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldestTimestamp = scans[scans.length - 1].timestamp;
      const url = new URL('/api/admin/scans', window.location.origin);
      url.searchParams.set('limit', '20');
      url.searchParams.set('before', oldestTimestamp);
      if (scanFilterAction !== 'all') {
        url.searchParams.set('action', scanFilterAction);
      }
      if (scanSearch.trim()) {
        url.searchParams.set('search', scanSearch.trim());
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const result = await res.json();
        const olderScans = result.scans || [];
        setHasMoreOlder(result.hasMore || false);
        setScans((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const uniqueOlder = olderScans.filter((s: ScanLogItem) => !existingIds.has(s.id));
          return [...prev, ...uniqueOlder];
        });
      }
    } catch (err) {
      console.error('Failed to load older scans:', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleFlushPending = () => {
    if (pendingScans.length === 0) return;
    setScans((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const uniqueNew = pendingScans.filter((s) => !existingIds.has(s.id));
      if (uniqueNew.length > 0) {
        setNewlyArrivedIds(new Set(uniqueNew.map((s) => s.id)));
        setTimeout(() => setNewlyArrivedIds(new Set()), 3000);
      }
      return [...uniqueNew, ...prev];
    });
    setPendingScans([]);
  };

  const handleToggleStreaming = () => {
    if (!isStreaming) {
      handleFlushPending();
      setIsStreaming(true);
    } else {
      setIsStreaming(false);
    }
  };

  const handleFilterActionChange = (action: string) => {
    setScanFilterAction(action);
    loadInitialScans(action, scanSearch);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadInitialScans(scanFilterAction, scanSearch);
  };

  // Real-time polling effect for scan stream
  useEffect(() => {
    if (!authorized) return;

    const interval = setInterval(async () => {
      try {
        const currentScans = scansRef.current;
        const latestTimestamp = currentScans.length > 0 ? currentScans[0].timestamp : null;

        const url = new URL('/api/admin/scans', window.location.origin);
        url.searchParams.set('limit', '30');
        if (latestTimestamp) {
          url.searchParams.set('after', latestTimestamp);
        }
        if (scanFilterAction !== 'all') {
          url.searchParams.set('action', scanFilterAction);
        }
        if (scanSearch.trim()) {
          url.searchParams.set('search', scanSearch.trim());
        }

        const res = await fetch(url.toString());
        if (!res.ok) return;

        const incomingData = await res.json();
        const incoming: ScanLogItem[] = incomingData.scans || [];
        if (incoming.length === 0) return;

        if (isStreamingRef.current) {
          setScans((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newItems = incoming.filter((s) => !existingIds.has(s.id));
            if (newItems.length === 0) return prev;

            setNewlyArrivedIds(new Set(newItems.map((s) => s.id)));
            setTimeout(() => {
              setNewlyArrivedIds(new Set());
            }, 3000);

            return [...newItems, ...prev];
          });
        } else {
          setPendingScans((prev) => {
            const existingIds = new Set([
              ...scansRef.current.map((s) => s.id),
              ...prev.map((s) => s.id),
            ]);
            const newItems = incoming.filter((s) => !existingIds.has(s.id));
            return [...newItems, ...prev];
          });
        }
      } catch (err) {
        // Background poll error handled silently
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [authorized, scanFilterAction, scanSearch]);

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, pageSize]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/admin/business/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        await loadAdminData();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCreating(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOwnerName || 'Business Owner',
          email: newEmail,
          password: newPassword,
          businessName: newName,
          category: newCategory,
          googleReviewUrl: newReviewUrl || undefined,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to create business');
      }

      // Reset form
      setNewName('');
      setNewOwnerName('');
      setNewEmail('');
      setNewReviewUrl('');
      setShowAddModal(false);
      await loadAdminData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to create business');
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Verifying Super Admin clearance...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-4 p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Super Admin Access Required</h2>
        <p className="text-sm text-slate-400 max-w-md">
          This portal requires Super Admin privileges. Please log in with the administrator account.
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-500 transition-colors"
          >
            Sign in as Super Admin
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors"
          >
            Go to Business Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { stats, businesses, recentScans } = data || {
    stats: { totalBusinesses: 0, totalUsers: 0, totalScans: 0, totalFeedbacks: 0, totalMRR: 0, growthPercentage: 0 },
    businesses: [],
    recentScans: [],
  };

  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBusinesses.length / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = filteredBusinesses.length === 0 ? 0 : (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredBusinesses.length);
  const paginatedBusinesses = filteredBusinesses.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (validPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (validPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', validPage - 1, validPage, validPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Super Admin Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super-Admin Command Center</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Multi-Tenant Engine Online</span>
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Platform Overview & Business Directory
            </h1>
            <p className="text-xs text-slate-400">
              Live multi-tenant telemetry queried from SQLite/Prisma production database.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New Business</span>
            </button>
          </div>
        </div>

        {/* Global SaaS Platform Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Monthly Revenue (MRR)</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              ₹{stats.totalMRR.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{stats.growthPercentage}% MoM expansion</span>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Business Tenants</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {stats.totalBusinesses}
            </div>
            <div className="text-xs text-slate-400">
              Across restaurants, clinics & salons
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Registered Accounts</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {stats.totalUsers}
            </div>
            <div className="text-xs text-slate-400">
              Store managers & administrators
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total QR Funnel Scans</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {stats.totalScans.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">
              {stats.totalFeedbacks} private negative shields
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search business, slug, or owner email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              <option value="restaurant">Restaurants & Dining</option>
              <option value="clinic">Clinics & Medical</option>
              <option value="salon">Salons & Spas</option>
              <option value="retail">Retail Stores</option>
              <option value="automotive">Automotive</option>
            </select>
          </div>
        </div>

        {/* Business Tenants Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl backdrop-blur-xl flex flex-col">
          {/* Table Header Info Bar */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-tight">Active Tenants Directory</h2>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-semibold">
                    {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'tenant' : 'tenants'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Manage provisioned accounts, view status and monitor scans
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-slate-400">
              <span className="text-[11px] text-slate-500 hidden md:inline">
                Vertical & horizontal scroll enabled
              </span>
              <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1">
                <span className="text-[11px] text-slate-400">Page</span>
                <span className="text-[11px] font-bold text-white">{validPage}</span>
                <span className="text-[11px] text-slate-500">/</span>
                <span className="text-[11px] font-medium text-slate-400">{totalPages}</span>
              </div>
            </div>
          </div>

          {/* Scrollable Container with sticky header */}
          <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
            <table className="w-full text-left text-xs text-slate-300 min-w-[900px] border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[11px] tracking-wider shadow-sm">
                <tr>
                  <th className="py-3.5 px-4 bg-slate-950">Business & Slug</th>
                  <th className="py-3.5 px-4 bg-slate-950">Owner Account</th>
                  <th className="py-3.5 px-4 bg-slate-950">Category</th>
                  <th className="py-3.5 px-4 bg-slate-950">Subscription Plan</th>
                  <th className="py-3.5 px-4 bg-slate-950">Total Scans</th>
                  <th className="py-3.5 px-4 bg-slate-950">Shield Intercepts</th>
                  <th className="py-3.5 px-4 bg-slate-950">Status</th>
                  <th className="py-3.5 px-4 text-right bg-slate-950">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-400">
                          <Building2 className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <p className="text-sm font-semibold text-white">No businesses found</p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          {searchQuery || categoryFilter !== 'all'
                            ? 'No business tenants matched your search query or category filter.'
                            : 'There are no business tenants currently provisioned.'}
                        </p>
                        {(searchQuery || categoryFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setCategoryFilter('all');
                            }}
                            className="mt-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors cursor-pointer border border-slate-700/60"
                          >
                            Reset filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBusinesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-white text-sm">{biz.name}</p>
                          <p className="font-mono text-slate-500 text-[11px]">/r/{biz.slug}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div>
                          <p className="text-slate-200 font-medium">{biz.ownerName}</p>
                          <p className="text-slate-500 text-[11px]">{biz.ownerEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700/60">
                          {biz.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="capitalize px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20 text-[11px]">
                          {biz.activePlan} (₹
                          {biz.activePlan.toLowerCase() === 'starter' ? 499 : biz.activePlan.toLowerCase() === 'pro' ? 999 : 2499}
                          /mo)
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-200 whitespace-nowrap">
                        {biz.totalScans}
                      </td>
                      <td className="py-4 px-4 font-mono text-rose-400 font-bold whitespace-nowrap">
                        {biz.totalFeedbacks}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          biz.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${biz.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span>{biz.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/r/${biz.slug}`}
                            target="_blank"
                            title="Open Live Funnel"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleToggleStatus(biz.id, biz.status)}
                            title={biz.status === 'active' ? 'Pause Tenant' : 'Activate Tenant'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              biz.status === 'active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination & Summary Footer */}
          <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 w-full md:w-auto justify-between md:justify-start">
              <div>
                {filteredBusinesses.length === 0 ? (
                  <span>No results</span>
                ) : (
                  <span>
                    Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-white">{endIndex}</span> of{' '}
                    <span className="font-semibold text-white">{filteredBusinesses.length}</span> tenants
                    {filteredBusinesses.length !== businesses.length && (
                      <span className="text-slate-500"> (filtered from {businesses.length})</span>
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Page Navigation Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 w-full md:w-auto justify-center md:justify-end">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={validPage === 1}
                  title="First page"
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validPage === 1}
                  title="Previous page"
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers().map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-slate-600 select-none">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = pageNum === validPage;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum as number)}
                        className={`min-w-8 h-8 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validPage === totalPages}
                  title="Next page"
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validPage === totalPages}
                  title="Last page"
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Activity Telemetry Stream */}
        <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm font-bold text-white">Global Platform Scan Stream</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium">
                {scans.length} events buffered
              </span>
              {isStreaming ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE (Polling 5s)</span>
                </span>
              ) : (
                <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>STREAM PAUSED</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleToggleStreaming}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  isStreaming
                    ? 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
                title={isStreaming ? 'Pause real-time updates' : 'Resume real-time updates'}
              >
                {isStreaming ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pause Stream</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    <span>Resume Stream</span>
                  </>
                )}
              </button>

              <button
                onClick={() => loadInitialScans()}
                disabled={streamLoading}
                title="Refresh scan telemetry"
                className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${streamLoading ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter and Search Bar for Telemetry Stream */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                <Filter className="w-3 h-3 text-slate-500" /> Filter:
              </span>
              {[
                { id: 'all', label: 'All Actions' },
                { id: 'copied_to_google', label: 'Google Redirects' },
                { id: 'private_feedback', label: 'Private Feedback' },
                { id: 'scanned', label: 'QR Scanned' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleFilterActionChange(item.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                    scanFilterAction === item.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-56 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by business or slug..."
                value={scanSearch}
                onChange={(e) => setScanSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-7 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {scanSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setScanSearch('');
                    loadInitialScans(scanFilterAction, '');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>
          </div>

          {/* Pending scans alert pill when paused */}
          {pendingScans.length > 0 && (
            <button
              onClick={handleFlushPending}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between hover:border-blue-500/50 transition-all cursor-pointer animate-pulse shadow-lg shadow-blue-500/5"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">
                  {pendingScans.length} new scan{pendingScans.length > 1 ? 's' : ''} captured while paused
                </span>
              </div>
              <span className="font-medium text-blue-400 text-[11px] underline flex items-center gap-1">
                Click to update stream list →
              </span>
            </button>
          )}

          {/* Stream Logs List */}
          <div className="overflow-y-auto max-h-[400px] pr-1 divide-y divide-slate-800/70 space-y-1">
            {streamLoading && scans.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <p className="text-xs">Loading telemetry records...</p>
              </div>
            ) : scans.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No platform scans match the current criteria.
              </div>
            ) : (
              scans.map((scan) => {
                const isNew = newlyArrivedIds.has(scan.id);
                return (
                  <div
                    key={scan.id}
                    className={`py-3 px-3 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                      isNew
                        ? 'bg-emerald-500/10 border border-emerald-500/30 shadow-md shadow-emerald-500/10 animate-pulse'
                        : 'hover:bg-slate-800/40 bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700/50 shrink-0">
                        {scan.deviceType.toLowerCase().includes('desktop') ||
                        scan.deviceType.toLowerCase().includes('laptop') ? (
                          <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white truncate max-w-[200px]">
                            {scan.business.name}
                          </span>
                          <Link
                            href={`/r/${scan.business.slug}`}
                            target="_blank"
                            className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px] hover:bg-blue-500/20 transition-colors flex items-center gap-1 shrink-0"
                            title="Open customer review page"
                          >
                            <span>{scan.business.slug}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </Link>
                        </div>
                        <p className="text-[11px] text-slate-400 capitalize truncate mt-0.5">
                          {scan.deviceType} device
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      {scan.actionTaken === 'copied_to_google' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Google Redirect</span>
                        </span>
                      ) : scan.actionTaken === 'private_feedback' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>Private Feedback</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                          <QrCode className="w-2.5 h-2.5" />
                          <span>QR Scanned</span>
                        </span>
                      )}

                      <div className="text-right">
                        <p className="text-[11px] font-mono text-slate-300">
                          {new Date(scan.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {formatRelativeTime(scan.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cursor-based Load Older Controls */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px]">
                Showing <strong className="text-white">{scans.length}</strong> events in telemetry buffer
              </span>
            </div>

            {hasMoreOlder ? (
              <button
                onClick={handleLoadOlder}
                disabled={loadingOlder}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white transition-all font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-slate-950"
              >
                {loadingOlder ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    <span>Loading older history...</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                    <span>Load Older Telemetry (20 more)</span>
                  </>
                )}
              </button>
            ) : scans.length > 0 ? (
              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500/60" />
                <span>All historical telemetry loaded</span>
              </span>
            ) : null}
          </div>
        </div>
      </main>

      {/* Provision New Business Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer"
            onClick={() => setShowAddModal(false)}
            aria-hidden="true"
          />

          <div 
            className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 relative z-10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Provision New Tenant</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBusiness} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saffron Bistro"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Scott"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Owner Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="michael@saffronbistro.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="restaurant">Restaurant / Dining</option>
                  <option value="clinic">Clinic / Medical</option>
                  <option value="salon">Salon / Spa</option>
                  <option value="retail">Retail Boutique</option>
                  <option value="automotive">Automotive</option>
                  <option value="fitness">Fitness / Gym</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Provision Tenant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
