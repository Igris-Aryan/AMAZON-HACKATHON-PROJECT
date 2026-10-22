/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { RiskLevel, VerificationStatus, ActionExecutionStatus } from '../../types';

interface StatusBadgeProps {
  type: 'verification' | 'risk' | 'execution' | 'phase';
  value: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  className = '',
  size = 'sm',
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (type === 'verification') {
    const v = value as VerificationStatus;
    if (v === 'verified') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>VERIFIED</span>
        </span>
      );
    }
    if (v === 'failed') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses} ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>FAILED</span>
        </span>
      );
    }
    if (v === 'unverified') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses} ${className}`}
        >
          <HelpCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>UNVERIFIED</span>
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses} ${className}`}
      >
        <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span>NOT CHECKED</span>
      </span>
    );
  }

  if (type === 'risk') {
    const r = value as RiskLevel;
    if (r === 'high') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses} ${className}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>HIGH RISK</span>
        </span>
      );
    }
    if (r === 'medium') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses} ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>MEDIUM RISK</span>
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 ${sizeClasses} ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-sky-400" />
        <span>LOW RISK</span>
      </span>
    );
  }

  if (type === 'execution') {
    const e = value as ActionExecutionStatus;
    if (e === 'executed') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800 ${sizeClasses} ${className}`}
        >
          <Check className="w-3 h-3 text-emerald-400" />
          <span>EXECUTED</span>
        </span>
      );
    }
    if (e === 'awaiting_approval') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-950/60 text-amber-300 border border-amber-800 ${sizeClasses} ${className}`}
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>AWAITING APPROVAL</span>
        </span>
      );
    }
    if (e === 'executing') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-sky-950/60 text-sky-300 border border-sky-800 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          <span>EXECUTING</span>
        </span>
      );
    }
    if (e === 'failed') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-rose-950/60 text-rose-300 border border-rose-800 ${sizeClasses} ${className}`}
        >
          <XCircle className="w-3 h-3 text-rose-400" />
          <span>FAILED</span>
        </span>
      );
    }
    if (e === 'skipped' || e === 'cancelled') {
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses} ${className}`}
        >
          <span>SKIPPED</span>
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 ${sizeClasses} ${className}`}
      >
        <span>PROPOSED</span>
      </span>
    );
  }

  // Phase fallback
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses} ${className}`}
    >
      {value.toUpperCase().replace('_', ' ')}
    </span>
  );
};
