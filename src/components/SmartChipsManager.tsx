'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  RotateCcw, 
  BookOpen, 
  Check, 
  Smartphone, 
  Search, 
  Loader2, 
  X,
  Info
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { Business } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import { CATEGORY_DEFAULT_CHIPS, normalizeCategory } from '@/lib/chips';

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
    desc: 'Emphasizes painless care, zero wait times, compassionate doctors, and transparent billing.',
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
  onUpdateBusiness,
  onReloadDashboard,
}: SmartChipsManagerProps) {
  const { toast } = useToast();

  // Active filter category
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSimulator, setShowSimulator] = useState<boolean>(true);

  // Form states
  const [newChipLabel, setNewChipLabel] = useState('');
  const [newChipPhrase, setNewChipPhrase] = useState('');
  const [newChipCategory, setNewChipCategory] = useState('Service');
  const [isAddingChip, setIsAddingChip] = useState(false);

  // Template Library Modal states
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [previewTemplateCategory, setPreviewTemplateCategory] = useState<string>(
    normalizeCategory(business.category)
  );
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

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
    if (!newChipLabel.trim() || !newChipPhrase.trim()) {
      toast.error('Please enter both a chip label and a review phrase.', 'Missing Fields');
      return;
    }
    setIsAddingChip(true);

    try {
      const res = await fetch('/api/dashboard/chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newChipLabel.trim(),
          phrase: newChipPhrase.trim(),
          category: newChipCategory.trim(),
          businessId: business.id,
        }),
      });

      if (res.ok) {
        toast.success(`Prompt "${newChipLabel.trim()}" added to funnel!`, 'Tag Created');
        setNewChipLabel('');
        setNewChipPhrase('');
        if (onReloadDashboard) await onReloadDashboard();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to add smart chip', 'Error');
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

  // 4. Apply Industry Template Pack
  const handleApplyTemplatePack = async (targetCat: string) => {
    setIsApplyingTemplate(true);
    try {
      const res = await fetch('/api/dashboard/chips', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: targetCat,
          businessId: business.id,
        }),
      });

      if (res.ok) {
        const packInfo = INDUSTRY_CONFIG[targetCat] || { label: targetCat };
        toast.success(
          `Switched to ${packInfo.label} prompt pack! All prompts and category updated.`,
          'Template Applied'
        );
        if (onUpdateBusiness) {
          await onUpdateBusiness({ category: targetCat as any });
        }
        setShowTemplateLibrary(false);
        if (onReloadDashboard) await onReloadDashboard();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to apply template pack', 'Error');
      }
    } catch (err) {
      console.error('Failed to apply template pack:', err);
      toast.error('Network error applying template pack', 'Error');
    } finally {
      setIsApplyingTemplate(false);
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

            {/* Template Library Button */}
            <button
              type="button"
              onClick={() => {
                setPreviewTemplateCategory(canonicalCategory);
                setShowTemplateLibrary(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Template Library</span>
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
            <div className="flex flex-wrap gap-2 pt-1">
              {(business.smartChips || []).map((chip) => {
                const isSelected = simulatedSelectedIds.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => toggleSimulatedChip(chip.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/25 scale-105'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <span>{chip.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
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
          <div className="flex items-center gap-1.5 flex-wrap">
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
                Try resetting your search filter or restore industry defaults from the Template Library above.
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
            className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Create Custom Review Highlight</span>
              </span>
              <span className="text-[11px] text-slate-500">Auto-injects sentence into Google draft</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Chip Tag Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🍷 Fine Wine Selection"
                  value={newChipLabel}
                  onChange={(e) => setNewChipLabel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Tag Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Service, Facilities, Vibe"
                  value={newChipCategory}
                  onChange={(e) => setNewChipCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
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
              <label className="text-[11px] text-slate-400 mb-1 block">
                Full Review Sentence (appended to customer draft when tapped)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 'The sommelier was knowledgeable and the wine pairings complemented our dinner perfectly!'"
                value={newChipPhrase}
                onChange={(e) => setNewChipPhrase(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* 6. INDUSTRY TEMPLATE LIBRARY MODAL */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer"
            onClick={() => setShowTemplateLibrary(false)}
            aria-hidden="true"
          />

          <div
            className="w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 relative z-10 overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Industry Template Packs</h3>
                  <p className="text-xs text-slate-400">
                    Pre-configured, high-converting review prompt packs tested for 5-star Google review conversion.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateLibrary(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Left column categories, right column preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto flex-1 pr-1">
              {/* Category Pack Selector List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Select Industry Pack:
                </span>
                {Object.entries(INDUSTRY_CONFIG).map(([key, config]) => {
                  const isSelected = previewTemplateCategory === key;
                  const isCurrentlyActive = canonicalCategory === key;
                  const packChips = CATEGORY_DEFAULT_CHIPS[key] || [];

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPreviewTemplateCategory(key)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-900/20 ring-1 ring-blue-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-xs font-bold text-white">
                          <span className="text-base">{config.icon}</span>
                          <span>{config.label}</span>
                        </span>
                        {isCurrentlyActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{config.desc}</p>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        {packChips.length} curated review highlights
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Template Preview Section */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{INDUSTRY_CONFIG[previewTemplateCategory]?.icon}</span>
                        <span>{INDUSTRY_CONFIG[previewTemplateCategory]?.label} Pack</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {INDUSTRY_CONFIG[previewTemplateCategory]?.desc}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold font-mono">
                      {(CATEGORY_DEFAULT_CHIPS[previewTemplateCategory] || []).length} Prompts
                    </span>
                  </div>

                  {/* Chips Preview list */}
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {(CATEGORY_DEFAULT_CHIPS[previewTemplateCategory] || []).map((chip, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-300">{chip.label}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {chip.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 italic leading-relaxed">&quot;{chip.phrase}&quot;</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Applying this pack replaces your current prompts with these industry defaults.
                  </span>
                  <button
                    type="button"
                    disabled={isApplyingTemplate}
                    onClick={() => handleApplyTemplatePack(previewTemplateCategory)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isApplyingTemplate ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying Pack...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply {INDUSTRY_CONFIG[previewTemplateCategory]?.icon} Template Pack</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
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
