'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  Smartphone, 
  Search, 
  Loader2, 
  X,
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { Business } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import {
  CATEGORY_DEFAULT_CHIPS,
  DefaultChipTemplate,
  getSuggestionsForCategory,
  normalizeCategory,
  validateMedicalChipContent,
} from '@/lib/chips';

interface SmartChipsManagerProps {
  business: Business;
  onUpdateBusiness?: (updated: Partial<Business>) => Promise<void> | void;
  onReloadDashboard?: () => Promise<void> | void;
}

const INDUSTRY_CONFIG: Record<string, { label: string; icon: string; desc: string }> = {
  restaurant: {
    label: 'Dining, Cafe & Restaurant',
    icon: '🍕',
    desc: 'Highlights food freshness, warm hospitality, cozy ambience, and fast service.',
  },
  fitness: {
    label: 'Fitness Center & Gym',
    icon: '🏋️',
    desc: 'Highlights certified trainers, spotless equipment, high-energy classes, and 24/7 access.',
  },
  clinic: {
    label: 'Healthcare & Dental Clinic',
    icon: '🩺',
    desc: 'Focuses on clean and hygienic facilities, minimal wait times, polite staff, and clear doctor communication.',
  },
  salon: {
    label: 'Salon, Spa & Barbershop',
    icon: '💇',
    desc: 'Focuses on precision styling, relaxing spa wash, master color blending, and chic vibes.',
  },
  automotive: {
    label: 'Automotive & Repair Garage',
    icon: '🔧',
    desc: 'Showcases honest diagnostics, same-day turnaround, master mechanics, and fair quotes.',
  },
  retail: {
    label: 'Retail Store & Boutique',
    icon: '🛍️',
    desc: 'Highlights curated inventory, helpful staff, fast checkout, and top-tier value.',
  },
};

export default function SmartChipsManager({
  business,
  onUpdateBusiness: _onUpdateBusiness,
  onReloadDashboard,
}: SmartChipsManagerProps) {
  const { toast } = useToast();

  // Active filter category
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Form states
  const [newChipLabel, setNewChipLabel] = useState('');
  const [newChipPhrase, setNewChipPhrase] = useState('');
  const [newChipCategory, setNewChipCategory] = useState('Service');
  const [isAddingChip, setIsAddingChip] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    label?: string;
    category?: string;
    phrase?: string;
  }>({});

  // Suggested Prompts Modal states (locked to business category)
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [addingSuggestionLabel, setAddingSuggestionLabel] = useState<string | null>(null);
  const [isApplyingFullPack, setIsApplyingFullPack] = useState(false);

  // Confirmation Modals
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [chipToDelete, setChipToDelete] = useState<string | null>(null);
  const [isDeletingChip, setIsDeletingChip] = useState(false);

  // Simulator selections (toggled chip ids)
  const [simulatedSelectedIds, setSimulatedSelectedIds] = useState<string[]>(() => {
    return business.smartChips?.slice(0, 2).map((c) => c.id) || [];
  });

  const canonicalCategory = normalizeCategory(business.category);
  const currentIndustryMeta = INDUSTRY_CONFIG[canonicalCategory] || INDUSTRY_CONFIG.restaurant;

  // Curated ideas strictly locked to this business's category
  const categoryIdeas = useMemo(() => {
    const defaults = CATEGORY_DEFAULT_CHIPS[canonicalCategory] || [];
    const extra = getSuggestionsForCategory(canonicalCategory) || [];
    const combined = [...defaults, ...extra];
    const seen = new Set<string>();
    return combined.filter((c) => {
      const key = c.label.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [canonicalCategory]);

  const isChipAlreadyAdded = (label: string) => {
    return (business.smartChips || []).some(
      (c) => c.label.toLowerCase().trim() === label.toLowerCase().trim()
    );
  };

  // Extract all unique categories across active chips
  const chipCategories = useMemo(() => {
    const cats = new Set<string>();
    business.smartChips?.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats);
  }, [business.smartChips]);

  // Filtered chips based on category pill & search query
  const filteredChips = useMemo(() => {
    return (business.smartChips || []).filter((chip) => {
      const matchesCat =
        selectedFilterCategory === 'all' ||
        chip.category.toLowerCase() === selectedFilterCategory.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        chip.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chip.phrase.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [business.smartChips, selectedFilterCategory, searchQuery]);

  // Simulated AI review text based on selected simulator chips
  const simulatedAiReviewText = useMemo(() => {
    const selectedChips = (business.smartChips || []).filter((c) =>
      simulatedSelectedIds.includes(c.id)
    );
    if (selectedChips.length === 0) {
      return 'Tap any highlight tag above to generate an instant 5-star review draft!';
    }
    return selectedChips.map((c) => c.phrase).join(' ');
  }, [business.smartChips, simulatedSelectedIds]);

  const toggleSimulatedChip = (chipId: string) => {
    setSimulatedSelectedIds((prev) =>
      prev.includes(chipId) ? prev.filter((id) => id !== chipId) : [...prev, chipId]
    );
  };

  // 1. Add New Chip
  const handleAddChip = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof fieldErrors = {};
    const trimmedLabel = newChipLabel.trim();
    const trimmedCategory = newChipCategory.trim();
    const trimmedPhrase = newChipPhrase.trim();

    // 1. Label validation
    if (!trimmedLabel) {
      errors.label = 'Tag label is required';
    } else if (trimmedLabel.length < 2) {
      errors.label = 'Tag label must be at least 2 characters';
    } else if (trimmedLabel.length > 40) {
      errors.label = 'Tag label cannot exceed 40 characters';
    } else if (
      business.smartChips?.some(
        (c) => c.label.toLowerCase() === trimmedLabel.toLowerCase()
      )
    ) {
      errors.label = 'A review highlight with this label already exists';
    }

    // 2. Category validation
    if (!trimmedCategory) {
      errors.category = 'Tag category is required';
    } else if (trimmedCategory.length < 2) {
      errors.category = 'Category must be at least 2 characters';
    } else if (trimmedCategory.length > 30) {
      errors.category = 'Category cannot exceed 30 characters';
    }

    // 3. Phrase validation
    if (!trimmedPhrase) {
      errors.phrase = 'Review sentence is required';
    } else if (trimmedPhrase.length < 10) {
      errors.phrase = 'Review sentence must be at least 10 characters';
    } else if (trimmedPhrase.length > 300) {
      errors.phrase = 'Review sentence cannot exceed 300 characters';
    }

    // 4. Medical compliance check for healthcare/clinic businesses
    if (canonicalCategory === 'clinic') {
      const labelMed = validateMedicalChipContent(trimmedLabel);
      if (!labelMed.valid && !errors.label) {
        errors.label = `Prohibited medical claim keyword ("${labelMed.prohibitedWord}")`;
      }

      const catMed = validateMedicalChipContent(trimmedCategory);
      if (!catMed.valid && !errors.category) {
        errors.category = `Prohibited medical keyword ("${catMed.prohibitedWord}")`;
      }

      const phraseMed = validateMedicalChipContent(trimmedPhrase);
      if (!phraseMed.valid && !errors.phrase) {
        errors.phrase = `Prohibited medical claim keyword ("${phraseMed.prohibitedWord}"). Focus on cleanliness, wait time, or communication.`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please resolve the errors highlighted below.', 'Validation Error');
      return;
    }

    setFieldErrors({});
    setIsAddingChip(true);

    try {
      const res = await fetch('/api/dashboard/chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: trimmedLabel,
          phrase: trimmedPhrase,
          category: trimmedCategory,
          businessId: business.id,
        }),
      });

      if (res.ok) {
        toast.success(`Prompt "${trimmedLabel}" added to funnel!`, 'Tag Created');
        setNewChipLabel('');
        setNewChipPhrase('');
        setFieldErrors({});
        if (onReloadDashboard) await onReloadDashboard();
      } else {
        const err = await res.json().catch(() => ({}));
        const errMsg = err.error || 'Failed to add smart chip';
        toast.error(errMsg, 'Error');
        if (errMsg.toLowerCase().includes('label') || errMsg.toLowerCase().includes('already exists')) {
          setFieldErrors((prev) => ({ ...prev, label: errMsg }));
        } else if (errMsg.toLowerCase().includes('phrase') || errMsg.toLowerCase().includes('sentence')) {
          setFieldErrors((prev) => ({ ...prev, phrase: errMsg }));
        } else if (errMsg.toLowerCase().includes('category')) {
          setFieldErrors((prev) => ({ ...prev, category: errMsg }));
        }
      }
    } catch (err) {
      console.error('Failed to add chip:', err);
      toast.error('Network error adding smart chip', 'Error');
    } finally {
      setIsAddingChip(false);
    }
  };

  // 2. Remove Chip
  const handleConfirmDeleteChip = async () => {
    if (!chipToDelete) return;
    setIsDeletingChip(true);

    try {
      const res = await fetch(`/api/dashboard/chips?id=${chipToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Smart prompt removed.', 'Deleted');
        setSimulatedSelectedIds((prev) => prev.filter((id) => id !== chipToDelete));
        if (onReloadDashboard) await onReloadDashboard();
      } else {
        toast.error('Failed to remove prompt', 'Error');
      }
    } catch (err) {
      console.error('Failed to delete chip:', err);
      toast.error('Network error deleting prompt', 'Error');
    } finally {
      setIsDeletingChip(false);
      setChipToDelete(null);
    }
  };

  // 3. Reset to Registered Category Defaults
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/dashboard/chips', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: canonicalCategory,
          businessId: business.id,
        }),
      });

      if (res.ok) {
        toast.success(
          `Restored official default prompts for ${currentIndustryMeta.label}!`,
          'Defaults Restored'
        );
        setConfirmResetOpen(false);
        if (onReloadDashboard) await onReloadDashboard();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to reset prompts', 'Error');
      }
    } catch (err) {
      console.error('Failed to reset chips:', err);
      toast.error('Network error resetting prompts', 'Error');
    } finally {
      setIsResetting(false);
    }
  };

  // 4. Add Curated Suggestion to Funnel
  const handleAddSuggestion = async (suggestion: DefaultChipTemplate) => {
    if (isChipAlreadyAdded(suggestion.label) || Boolean(addingSuggestionLabel)) return;

    setAddingSuggestionLabel(suggestion.label);
    try {
      const res = await fetch('/api/dashboard/chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: suggestion.label,
          category: suggestion.category,
          phrase: suggestion.phrase,
          icon: suggestion.icon || 'Sparkles',
          businessId: business.id,
        }),
      });

      if (res.ok) {
        toast.success(`Prompt "${suggestion.label}" added to your funnel!`, 'Prompt Added');
        if (onReloadDashboard) await onReloadDashboard();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to add prompt', 'Error');
      }
    } catch (err) {
      console.error('Failed to add suggestion:', err);
      toast.error('Network error adding prompt', 'Error');
    } finally {
      setAddingSuggestionLabel(null);
    }
  };

  // 5. Apply Default Pack from Modal
  const handleApplyDefaultPack = async () => {
    setIsApplyingFullPack(true);
    try {
      const res = await fetch('/api/dashboard/chips', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: canonicalCategory,
          businessId: business.id,
        }),
      });

      if (res.ok) {
        toast.success(
          `Restored official default prompts for ${currentIndustryMeta.label}!`,
          'Defaults Restored'
        );
        setShowSuggestionsModal(false);
        if (onReloadDashboard) await onReloadDashboard();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to apply defaults', 'Error');
      }
    } catch (err) {
      console.error('Failed to apply default pack:', err);
      toast.error('Network error restoring defaults', 'Error');
    } finally {
      setIsApplyingFullPack(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Header & Pro Controls */}
      <div className="rounded-2xl p-6 bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">Smart Review Assist Prompts</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <span>{currentIndustryMeta.icon}</span>
                <span>{currentIndustryMeta.label}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                {business.smartChips?.length || 0} Active Prompts
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Customers tap these experience tags when scanning your QR code. Each tag auto-drafts tailored, high-converting sentences that customers easily copy directly to Google.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Customer Simulator Toggle */}
            <button
              type="button"
              onClick={() => setShowSimulator(!showSimulator)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                showSimulator
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Toggle interactive live customer review simulator"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>{showSimulator ? 'Hide Simulator' : 'Live Simulator'}</span>
            </button>

            {/* Suggested Prompts Button */}
            <button
              type="button"
              onClick={() => setShowSuggestionsModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
              title={`Browse curated prompt suggestions for ${currentIndustryMeta.label}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Suggested Prompts</span>
            </button>

            {/* Restore Factory Defaults Button */}
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all active:scale-95 cursor-pointer"
              title={`Restore default ${currentIndustryMeta.label} prompt pack`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restore Defaults</span>
            </button>
          </div>
        </div>

        {/* 2. Interactive Live Customer Review Simulator */}
        {showSimulator && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Live Customer Funnel Simulator</span>
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Click any tag below to test how customer Google drafts are compiled in real-time
              </span>
            </div>

            {/* Tappable Simulator Chips */}
            <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-1">
              {(business.smartChips || []).map((chip) => {
                const isSelected = simulatedSelectedIds.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => toggleSimulatedChip(chip.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border active:scale-95 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/25 ring-1 ring-blue-400/40'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <span>{chip.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>

            {/* Compiled AI Draft Output Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-200">Simulated 5-Star Customer Review Draft:</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">★★★★★ Verified Google Draft</span>
              </div>
              <p className="text-xs text-slate-200 italic leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                &quot;{simulatedAiReviewText}&quot;
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>{simulatedSelectedIds.length} highlight tags selected</span>
                <button
                  type="button"
                  onClick={() => setSimulatedSelectedIds([])}
                  className="hover:text-slate-300 underline cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedFilterCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Prompts ({business.smartChips?.length || 0})
            </button>
            {chipCategories.map((cat) => {
              const count = (business.smartChips || []).filter((c) => c.category === cat).length;
              const isActive = selectedFilterCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/25'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="ml-1.5 text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* 4. Active Chips Grid */}
        <div className="space-y-2.5">
          {filteredChips.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <Info className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No prompt chips found matching your filter</p>
              <p className="text-[11px] text-slate-500">
                Try resetting your search filter or add prompts from Suggested Prompts above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredChips.map((chip) => (
                <div
                  key={chip.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-all flex items-start justify-between gap-3 group shadow-sm"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                        {chip.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80">
                        {chip.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic leading-relaxed line-clamp-2">
                      &quot;{chip.phrase}&quot;
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setChipToDelete(chip.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                    title="Delete prompt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Add New Prompt Form */}
        <div className="pt-2 border-t border-slate-800/80">
          <form
            onSubmit={handleAddChip}
            noValidate
            className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Create Custom Review Highlight</span>
              </span>
              <span className="text-[11px] text-slate-500">Auto-injects sentence into Google draft</span>
            </div>

            {canonicalCategory === 'clinic' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-amber-200">Medical Ethics Policy:</strong> Healthcare & clinic review chips must focus on operational experience (cleanliness, minimal wait times, friendly staff, clear explanations). Claims regarding cures, diagnoses, guarantees, miracles, or prescriptions are strictly prohibited.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-400 block">Chip Tag Label</label>
                  <span className={`text-[10px] font-mono ${newChipLabel.length > 40 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                    {newChipLabel.length}/40
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 🍷 Fine Wine Selection"
                  value={newChipLabel}
                  onChange={(e) => {
                    setNewChipLabel(e.target.value);
                    if (fieldErrors.label) setFieldErrors((prev) => ({ ...prev, label: undefined }));
                  }}
                  className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                    fieldErrors.label
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.label && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5 animate-in fade-in-50 duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.label}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-400 block">Tag Category</label>
                  <span className={`text-[10px] font-mono ${newChipCategory.length > 30 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                    {newChipCategory.length}/30
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Service, Facilities, Vibe"
                  value={newChipCategory}
                  onChange={(e) => {
                    setNewChipCategory(e.target.value);
                    if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                    fieldErrors.category
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.category && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5 animate-in fade-in-50 duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.category}</span>
                  </p>
                )}
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isAddingChip}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/20"
                >
                  {isAddingChip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save to Review Funnel</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400 block">
                  Full Review Sentence (appended to customer draft when tapped)
                </label>
                <span className={`text-[10px] font-mono ${newChipPhrase.length > 300 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                  {newChipPhrase.length}/300
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. 'The sommelier was knowledgeable and the wine pairings complemented our dinner perfectly!'"
                value={newChipPhrase}
                onChange={(e) => {
                  setNewChipPhrase(e.target.value);
                  if (fieldErrors.phrase) setFieldErrors((prev) => ({ ...prev, phrase: undefined }));
                }}
                className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                  fieldErrors.phrase
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-700 focus:border-blue-500'
                }`}
              />
              {fieldErrors.phrase && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5 animate-in fade-in-50 duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.phrase}</span>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 6. CATEGORY-LOCKED SUGGESTED PROMPTS MODAL */}
      {showSuggestionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer"
            onClick={() => {
              if (!addingSuggestionLabel && !isApplyingFullPack) setShowSuggestionsModal(false);
            }}
            aria-hidden="true"
          />

          <div
            className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-6 space-y-5 relative z-10 overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-2xl flex items-center justify-center shrink-0">
                  {currentIndustryMeta.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {currentIndustryMeta.label} Prompt Library
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Category Locked
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    High-converting review prompts curated exclusively for your business category. Add any prompt directly to your funnel.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={Boolean(addingSuggestionLabel) || isApplyingFullPack}
                onClick={() => setShowSuggestionsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Curated Suggestions Grid */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>{categoryIdeas.length} curated review highlights available</span>
                <span className="text-slate-500 text-[11px] font-mono">
                  {(business.smartChips || []).length} active in funnel
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {categoryIdeas.map((idea) => {
                  const alreadyAdded = isChipAlreadyAdded(idea.label);
                  const isCurrentlyAdding = addingSuggestionLabel === idea.label;

                  return (
                    <div
                      key={idea.label}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        alreadyAdded
                          ? 'bg-slate-950/40 border-slate-800/80 opacity-90'
                          : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{idea.label}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80">
                            {idea.category}
                          </span>
                          {alreadyAdded && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>In Funnel</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 italic leading-relaxed">
                          &quot;{idea.phrase}&quot;
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center justify-end">
                        {alreadyAdded ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 select-none">
                            <Check className="w-3.5 h-3.5 text-emerald-500/70" />
                            <span>Added</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={Boolean(addingSuggestionLabel) || isApplyingFullPack}
                            onClick={() => handleAddSuggestion(idea)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            {isCurrentlyAdding ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Adding...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Funnel</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer: Restore Factory Defaults Option */}
            <div className="pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400">
                Want to restore your funnel back to official {currentIndustryMeta.label} defaults?
              </span>
              <button
                type="button"
                disabled={Boolean(addingSuggestionLabel) || isApplyingFullPack}
                onClick={handleApplyDefaultPack}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                title={`Reset all smart chips to official ${currentIndustryMeta.label} defaults`}
              >
                {isApplyingFullPack ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying Default Pack...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Restore {currentIndustryMeta.label} Defaults</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Restore Defaults Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleConfirmReset}
        title={`Restore ${currentIndustryMeta.label} Defaults?`}
        description={
          <div className="space-y-2">
            <p>
              This will replace all your current smart chips with the official default review prompts for{' '}
              <strong className="text-white capitalize">{currentIndustryMeta.label}</strong>.
            </p>
            <p className="text-xs text-amber-400/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              ⚠️ Any custom tags or phrases you created will be replaced with standard high-converting review highlights.
            </p>
          </div>
        }
        confirmText="Restore Factory Prompts"
        cancelText="Keep Current Prompts"
        variant="warning"
        isLoading={isResetting}
      />

      {/* 8. Delete Single Chip Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(chipToDelete)}
        onClose={() => setChipToDelete(null)}
        onConfirm={handleConfirmDeleteChip}
        title="Remove Review Prompt Tag?"
        description="Customers will no longer see this highlight tag when scanning your QR code to draft their review."
        confirmText="Delete Tag"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingChip}
      />
    </div>
  );
}
