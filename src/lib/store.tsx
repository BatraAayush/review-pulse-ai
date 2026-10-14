'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Business, ScanEvent, PrivateFeedback, SmartChip, AdminStats } from '@/types';
import { INITIAL_BUSINESSES, INITIAL_SCAN_EVENTS, INITIAL_PRIVATE_FEEDBACK } from './mock-data';

interface SaaSContextType {
  businesses: Business[];
  currentBusiness: Business;
  setCurrentBusinessId: (id: string) => void;
  scanEvents: ScanEvent[];
  privateFeedbacks: PrivateFeedback[];
  recordScan: (slug: string, device?: 'ios' | 'android' | 'desktop') => void;
  recordReviewSubmission: (
    slug: string,
    action: 'copied_to_google' | 'private_feedback',
    rating: number,
    chips: string[],
    reviewText: string,
    customerInfo?: { name?: string; contact?: string }
  ) => void;
  updateBusiness: (id: string, updates: Partial<Business>) => void;
  addSmartChip: (businessId: string, chip: { label: string; category: string; phrase: string }) => void;
  removeSmartChip: (businessId: string, chipId: string) => void;
  registerBusiness: (data: Partial<Business>) => Business;
  toggleBusinessStatus: (id: string) => void;
  adminStats: AdminStats;
  getBusinessBySlug: (slug: string) => Business | undefined;
}

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'reviewpulse_saas_v1_';

export function SaaSProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES);
  const [currentBusinessId, setCurrentBusinessId] = useState<string>('biz-1');
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>(INITIAL_SCAN_EVENTS);
  const [privateFeedbacks, setPrivateFeedbacks] = useState<PrivateFeedback[]>(INITIAL_PRIVATE_FEEDBACK);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const storedBiz = localStorage.getItem(`${STORAGE_KEY_PREFIX}businesses`);
      const storedScans = localStorage.getItem(`${STORAGE_KEY_PREFIX}scans`);
      const storedFeedback = localStorage.getItem(`${STORAGE_KEY_PREFIX}feedback`);
      const storedCurrentId = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_biz`);

      if (storedBiz) setBusinesses(JSON.parse(storedBiz));
      if (storedScans) setScanEvents(JSON.parse(storedScans));
      if (storedFeedback) setPrivateFeedbacks(JSON.parse(storedFeedback));
      if (storedCurrentId) setCurrentBusinessId(storedCurrentId);
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}businesses`, JSON.stringify(businesses));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}scans`, JSON.stringify(scanEvents));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}feedback`, JSON.stringify(privateFeedbacks));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}current_biz`, currentBusinessId);
    } catch {
      // Ignore
    }
  }, [businesses, scanEvents, privateFeedbacks, currentBusinessId, isHydrated]);

  const currentBusiness = businesses.find((b) => b.id === currentBusinessId) || businesses[0];

  const getBusinessBySlug = (slug: string) => {
    return businesses.find((b) => b.slug.toLowerCase() === slug.toLowerCase()) || businesses[0];
  };

  const recordScan = (slug: string, device: 'ios' | 'android' | 'desktop' = 'ios') => {
    const targetBiz = businesses.find((b) => b.slug.toLowerCase() === slug.toLowerCase());
    if (!targetBiz) return;

    setBusinesses((prev) =>
      prev.map((b) => (b.id === targetBiz.id ? { ...b, totalScans: b.totalScans + 1 } : b))
    );

    const newScan: ScanEvent = {
      id: `scan-${Date.now()}`,
      businessId: targetBiz.id,
      businessSlug: targetBiz.slug,
      timestamp: 'Just now',
      deviceType: device,
      actionTaken: 'bounced',
      selectedChips: [],
      reviewLength: 0
    };

    setScanEvents((prev) => [newScan, ...prev.slice(0, 49)]);
  };

  const recordReviewSubmission = (
    slug: string,
    action: 'copied_to_google' | 'private_feedback',
    rating: number,
    chips: string[],
    reviewText: string,
    customerInfo?: { name?: string; contact?: string }
  ) => {
    const targetBiz = businesses.find((b) => b.slug.toLowerCase() === slug.toLowerCase());
    if (!targetBiz) return;

    // Update business counters
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id !== targetBiz.id) return b;
        const newTotalReviews = b.totalReviewsAttempted + 1;
        const newRating = Number(((b.averageRating * b.totalReviewsAttempted + rating) / newTotalReviews).toFixed(2));
        return {
          ...b,
          totalReviewsAttempted: newTotalReviews,
          averageRating: newRating
        };
      })
    );

    // Record Event
    const newScan: ScanEvent = {
      id: `scan-${Date.now()}`,
      businessId: targetBiz.id,
      businessSlug: targetBiz.slug,
      timestamp: 'Just now',
      deviceType: 'ios',
      ratingSelected: rating,
      actionTaken: action,
      selectedChips: chips,
      reviewLength: reviewText.length
    };

    setScanEvents((prev) => [newScan, ...prev.slice(0, 49)]);

    // Record Private Feedback if applicable
    if (action === 'private_feedback') {
      const newFeedback: PrivateFeedback = {
        id: `pf-${Date.now()}`,
        businessId: targetBiz.id,
        businessSlug: targetBiz.slug,
        customerName: customerInfo?.name || 'Anonymous Customer',
        customerContact: customerInfo?.contact || 'Not provided',
        rating,
        feedbackText: reviewText,
        createdAt: 'Just now',
        status: 'unread'
      };
      setPrivateFeedbacks((prev) => [newFeedback, ...prev]);
    }
  };

  const updateBusiness = (id: string, updates: Partial<Business>) => {
    setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const addSmartChip = (businessId: string, chip: { label: string; category: string; phrase: string }) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id !== businessId) return b;
        const newChip: SmartChip = {
          id: `chip-${Date.now()}`,
          ...chip
        };
        return {
          ...b,
          smartChips: [...b.smartChips, newChip]
        };
      })
    );
  };

  const removeSmartChip = (businessId: string, chipId: string) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id !== businessId) return b;
        return {
          ...b,
          smartChips: b.smartChips.filter((c) => c.id !== chipId)
        };
      })
    );
  };

  const registerBusiness = (data: Partial<Business>): Business => {
    const slug = data.slug || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : `biz-${Date.now()}`);
    const newBiz: Business = {
      id: `biz-${Date.now()}`,
      slug,
      name: data.name || 'New Business Storefront',
      category: data.category || 'restaurant',
      tagline: data.tagline || 'Proudly serving our local community',
      address: data.address || '100 Main St, Suite 1',
      phone: data.phone || '+1 (555) 010-0000',
      googlePlaceId: data.googlePlaceId || 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      logoUrl: data.logoUrl || null,
      primaryColor: data.primaryColor || '#6366F1',
      totalScans: 0,
      totalReviewsAttempted: 0,
      averageRating: 5.0,
      activePlan: data.activePlan || 'pro',
      status: 'active',
      ownerEmail: data.ownerEmail || 'owner@example.com',
      welcomeMessage: data.welcomeMessage || 'Thank you for your visit! Tap below to rate your experience.',
      customPromptMessage: 'Tell Google about your experience!',
      createdAt: new Date().toISOString().split('T')[0],
      smartChips: [
        { id: `c-${Date.now()}-1`, label: '🌟 Amazing Service', category: 'Staff', phrase: 'The team was incredibly courteous and attentive' },
        { id: `c-${Date.now()}-2`, label: '⚡ Super Fast', category: 'Speed', phrase: 'Very speedy turnaround and no waiting around' },
        { id: `c-${Date.now()}-3`, label: '💎 Top Quality', category: 'Quality', phrase: 'Extremely high quality standard and attention to detail' }
      ]
    };

    setBusinesses((prev) => [newBiz, ...prev]);
    setCurrentBusinessId(newBiz.id);
    return newBiz;
  };

  const toggleBusinessStatus = (id: string) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const nextStatus = b.status === 'active' ? 'paused' : 'active';
        return { ...b, status: nextStatus };
      })
    );
  };

  const adminStats: AdminStats = {
    totalScans: businesses.reduce((acc, b) => acc + b.totalScans, 0),
    totalBusinesses: businesses.length,
    totalReviewsGenerated: businesses.reduce((acc, b) => acc + b.totalReviewsAttempted, 0),
    totalMRR: businesses.reduce((acc, b) => {
      const planCost = b.activePlan === 'starter' ? 499 : b.activePlan === 'pro' ? 999 : 2499;
      return acc + (b.status === 'active' ? planCost : 0);
    }, 0),
    growthPercentage: 34.6
  };

  return (
    <SaaSContext.Provider
      value={{
        businesses,
        currentBusiness,
        setCurrentBusinessId,
        scanEvents,
        privateFeedbacks,
        recordScan,
        recordReviewSubmission,
        updateBusiness,
        addSmartChip,
        removeSmartChip,
        registerBusiness,
        toggleBusinessStatus,
        adminStats,
        getBusinessBySlug
      }}
    >
      {children}
    </SaaSContext.Provider>
  );
}

export function useSaaSStore() {
  const context = useContext(SaaSContext);
  if (!context) {
    throw new Error('useSaaSStore must be used within a SaaSProvider');
  }
  return context;
}
