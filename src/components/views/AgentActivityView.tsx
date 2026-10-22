/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { CommandExecutionRecord } from '../../types';
import {
  Activity,
  Code2,
  User,
  Sparkles,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface AgentActivityViewProps {
  currentExecution: CommandExecutionRecord | null;
  history: CommandExecutionRecord[];
}

export const AgentActivityView: React.FC<AgentActivityViewProps> = ({
  currentExecution,
  history,
}) => {
  const [developerMode, setDeveloperMode] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allEvents = [
    ...(currentExecution?.events || []),
    ...history.slice(0, 3).flatMap((h) => h.events),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
              Auditable Pipeline Trace
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <span>Agent Activity & Decision Transparency</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time auditable pipeline trace of model reasoning, policy evaluation, tool dispatches, and verification telemetry.
          </p>
        </div>

        {/* View Mode Toggle: Developer vs Human */}
        <div className="flex items-center gap-1.5 bg-[#0D1016] border border-white/[0.08] p-1 rounded-xl">
          <button
            onClick={() => setDeveloperMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              !developerMode ? 'bg-white/[0.1] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Human Friendly</span>
          </button>
          <button
            onClick={() => setDeveloperMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              developerMode ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer Technical View</span>
          </button>
        </div>
      </div>

      {/* Origin & Architecture Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#0D1016] border border-white/[0.08] text-xs space-y-1">
          <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Active Planner</span>
          <div className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>
              {currentExecution?.plan?.plannerType === 'gemini'
                ? 'Google Gemini 3.8 Flash'
                : 'Deterministic Safety Engine'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Strict JSON schema decomposition with tool restrictions.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D1016] border border-white/[0.08] text-xs space-y-1">
          <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Observation Method</span>
          <div className="font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Independent Verification Read</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Direct simulator actuator state query separate from tool acknowledgment.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D1016] border border-white/[0.08] text-xs space-y-1">
          <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Perimeter Safety</span>
          <div className="font-bold text-white flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Zero Blanket Permissions</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            High-risk operations (e.g. door unlock) strictly require per-action authorization.
          </p>
        </div>
      </div>

      {/* Activity Timeline Stream */}
      <div className="rounded-2xl bg-[#0D1016] border border-white/[0.08] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Sequential State Transitions
          </span>
          <span className="text-[10px] font-mono text-slate-500">{allEvents.length} Recorded Events</span>
        </div>

        {allEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">// No agent events recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {allEvents.map((evt, idx) => {
              const isExpanded = Boolean(expandedEvents[evt.id || idx]);
              const hasMeta = evt.metadata && Object.keys(evt.metadata).length > 0;

              return (
                <div
                  key={evt.id || idx}
                  className="p-3.5 rounded-xl bg-[#12161D] border border-white/[0.06] hover:border-white/[0.12] transition-colors text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sky-400 font-bold text-[11px]">{evt.type}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-semibold text-white">{evt.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-sans">{evt.description}</p>

                  {/* Technical View Details */}
                  {developerMode && hasMeta && (
                    <div className="mt-2.5 pt-2 border-t border-white/[0.05]">
                      <button
                        onClick={() => toggleExpand(evt.id || String(idx))}
                        className="flex items-center gap-1 text-[10px] font-mono text-sky-400 hover:text-sky-300 cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span>{isExpanded ? 'Hide Raw Telemetry Payload' : 'Inspect Raw Telemetry Payload'}</span>
                      </button>
                      {isExpanded && (
                        <pre className="mt-2 p-2.5 rounded bg-black/60 border border-white/[0.05] text-[10px] text-slate-300 font-mono overflow-x-auto">
                          {JSON.stringify(evt.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
