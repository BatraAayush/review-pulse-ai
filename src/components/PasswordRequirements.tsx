'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { validatePassword } from '@/lib/passwordValidation';

interface PasswordRequirementsProps {
  password: string;
}

export default function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) return null;

  const { rules } = validatePassword(password);

  return (
    <div className="mt-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] space-y-1.5 animate-in fade-in-50 duration-150">
      <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">
        Password Requirements:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {rules.map((rule) => (
          <div
            key={rule.key}
            className={`flex items-center gap-1.5 transition-colors ${
              rule.passed ? 'text-emerald-400 font-medium' : 'text-slate-500'
            }`}
          >
            {rule.passed ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full border border-slate-700 inline-block shrink-0 ml-0.5 mr-0.5" />
            )}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

