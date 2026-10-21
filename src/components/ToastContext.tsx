'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Sparkles, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => string;
    error: (message: string, title?: string, duration?: number) => string;
    info: (message: string, title?: string, duration?: number) => string;
    warning: (message: string, title?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global trigger support
let globalToastTrigger: ToastContextType['toast'] | null = null;

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    if (globalToastTrigger) return globalToastTrigger.success(message, title, duration);
  },
  error: (message: string, title?: string, duration?: number) => {
    if (globalToastTrigger) return globalToastTrigger.error(message, title, duration);
  },
  info: (message: string, title?: string, duration?: number) => {
    if (globalToastTrigger) return globalToastTrigger.info(message, title, duration);
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalToastTrigger) return globalToastTrigger.warning(message, title, duration);
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 visible

      return id;
    },
    []
  );

  const toastMethods = {
    success: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    error: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration }),
    info: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),
    warning: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration }),
  };

  React.useEffect(() => {
    globalToastTrigger = toastMethods;
  });

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastMethods }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(toast.duration || 4000);

  React.useEffect(() => {
    const totalDuration = toast.duration || 4000;
    const interval = 25; // Update every 25ms

    if (isHovered) return;

    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentRemaining = remainingTimeRef.current - elapsed;
      const currentPercent = Math.max(0, (currentRemaining / totalDuration) * 100);
      setProgress(currentPercent);

      if (currentRemaining <= 0) {
        clearInterval(timerRef.current!);
        onRemove();
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    };
  }, [isHovered, onRemove, toast.duration]);

  const config = {
    success: {
      borderColor: 'border-emerald-500/30',
      glowColor: 'shadow-emerald-500/10',
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      barColor: 'bg-emerald-500',
      defaultTitle: 'Success',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    error: {
      borderColor: 'border-rose-500/30',
      glowColor: 'shadow-rose-500/10',
      badgeBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      barColor: 'bg-rose-500',
      defaultTitle: 'Error',
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
    info: {
      borderColor: 'border-blue-500/30',
      glowColor: 'shadow-blue-500/10',
      badgeBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      barColor: 'bg-blue-500',
      defaultTitle: 'Notice',
      icon: <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />,
    },
    warning: {
      borderColor: 'border-amber-500/30',
      glowColor: 'shadow-amber-500/10',
      badgeBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      barColor: 'bg-amber-500',
      defaultTitle: 'Warning',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
  }[toast.type];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-xl border ${config.borderColor} shadow-2xl ${config.glowColor} p-4 transition-all duration-300 animate-in slide-in-from-top-3 fade-in hover:scale-[1.02]`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${config.badgeBg}`}>
          {config.icon}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-xs font-bold text-white tracking-wide">
            {toast.title || config.defaultTitle}
          </h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress countdown bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80">
        <div
          className={`h-full ${config.barColor} transition-all duration-75 ease-linear opacity-80`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
