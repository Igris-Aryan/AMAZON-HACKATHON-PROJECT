/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  borderVariant?: 'default' | 'sky' | 'emerald' | 'amber' | 'rose';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  onClick,
  borderVariant = 'default',
}) => {
  const borderStyles = {
    default: 'border-white/[0.08] hover:border-white/[0.14]',
    sky: 'border-sky-500/30 hover:border-sky-500/50',
    emerald: 'border-emerald-500/30 hover:border-emerald-500/50',
    amber: 'border-amber-500/30 hover:border-amber-500/50',
    rose: 'border-rose-500/30 hover:border-rose-500/50',
  }[borderVariant];

  return (
    <div
      onClick={onClick}
      className={`bg-[#0D1016] backdrop-blur-md rounded-2xl border ${borderStyles} p-5 shadow-2xl transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:translate-y-[-1px]' : ''
      } ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
