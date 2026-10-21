'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, RotateCcw, X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
  icon,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on ESC key press & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !mounted) return null;

  const variantStyles = {
    warning: {
      badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      button:
        'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25 border border-amber-500',
      defaultIcon: <RotateCcw className="w-6 h-6 text-amber-400" />,
    },
    danger: {
      badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      button:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 border border-rose-500',
      defaultIcon: <AlertTriangle className="w-6 h-6 text-rose-400" />,
    },
    primary: {
      badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      button:
        'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 border border-blue-500',
      defaultIcon: <Sparkles className="w-6 h-6 text-blue-400" />,
    },
    success: {
      badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      button:
        'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 border border-emerald-500',
      defaultIcon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
    },
  }[variant];

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0 bg-transparent"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-md my-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 backdrop-blur-xl animate-in zoom-in-95 duration-200 space-y-5">
        {/* Header with icon and close button */}
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-2xl ${variantStyles.badge} shadow-inner`}>
            {icon || variantStyles.defaultIcon}
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {title}
          </h3>
          <div className="text-sm text-slate-300 leading-relaxed">
            {description}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50 text-center justify-center"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 text-center ${variantStyles.button}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
