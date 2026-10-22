/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  History,
  Cpu,
  Sparkles,
  Activity,
  Layers,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type NavItem =
  | 'overview'
  | 'command_centre'
  | 'history'
  | 'devices'
  | 'scenarios'
  | 'activity'
  | 'integrations'
  | 'settings';

interface SidebarProps {
  currentNav: NavItem;
  onSelectNav: (item: NavItem) => void;
  activeExecutionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  activeExecutionsCount = 0,
}) => {
  const items: Array<{ id: NavItem; label: string; icon: React.FC<any>; badge?: number; badgeColor?: string }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'command_centre',
      label: 'Command Centre',
      icon: Terminal,
      badge: activeExecutionsCount > 0 ? activeExecutionsCount : undefined,
      badgeColor: 'bg-sky-500 text-slate-950',
    },
    { id: 'history', label: 'Execution History', icon: History },
    { id: 'devices', label: 'Devices', icon: Cpu },
    { id: 'scenarios', label: 'Scenarios', icon: Sparkles },
    { id: 'activity', label: 'Agent Activity', icon: Activity },
    { id: 'integrations', label: 'Integrations', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 bg-[#090B0F] border-r border-white/[0.07] flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] select-none">
      {/* Navigation Links */}
      <div className="p-3.5 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-1.5 font-mono">
          System Console
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white/[0.08] text-white font-semibold border border-white/[0.12] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="p-3.5 border-t border-white/[0.07]">
        <div className="p-3 bg-[#12161D] rounded-xl border border-white/[0.06] text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Verified State</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
            Every physical action is corroborated by an independent post-execution telemetry query.
          </p>
        </div>
      </div>
    </aside>
  );
};
