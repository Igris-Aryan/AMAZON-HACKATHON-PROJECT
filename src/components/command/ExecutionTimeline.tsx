/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExecutionEvent, CommandPhase } from '../../types';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';

interface ExecutionTimelineProps {
  events: ExecutionEvent[];
  phase: CommandPhase;
  onOpenReport?: () => void;
  onRetryAction?: (actionId: string) => void;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  events,
  phase,
  onOpenReport,
  onRetryAction,
}) => {
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyTelemetry = (id: string, data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderEventIcon = (type: ExecutionEvent['type']) => {
    switch (type) {
      case 'COMMAND_RECEIVED':
      case 'PLAN_GENERATED':
        return <Sparkles className="w-3.5 h-3.5 text-sky-400" />;
      case 'APPROVAL_REQUESTED':
      case 'APPROVAL_REJECTED':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'APPROVAL_GRANTED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'TOOL_CALL_STARTED':
      case 'TOOL_CALL_COMPLETED':
        return <Terminal className="w-3.5 h-3.5 text-sky-300" />;
      case 'VERIFICATION_PASSED':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'VERIFICATION_FAILED':
      case 'TOOL_CALL_FAILED':
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'VERIFICATION_UNVERIFIED':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
      case 'RECOVERY_ATTEMPTED':
        return <RotateCcw className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#0D1016] border border-white/[0.08] rounded-2xl p-5 shadow-2xl flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Live Execution Stream
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]">
            {events.length} Events
          </span>
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="text-xs px-2.5 py-1 bg-white/[0.05] hover:bg-white/[0.1] text-sky-300 rounded-lg border border-white/[0.08] transition-colors font-medium cursor-pointer"
            >
              Audit Report
            </button>
          )}
        </div>
      </div>

      {/* Events Stream */}
      <div className="overflow-y-auto space-y-3 pr-1 flex-1">
        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            // No execution events recorded yet.
            <br />
            Submit a command to begin verified orchestration.
          </div>
        ) : (
          events.map((event, i) => {
            const isExpanded = Boolean(expandedEvents[event.id]);
            const hasMetadata = Boolean(event.metadata && Object.keys(event.metadata).length > 0);

            return (
              <div
                key={event.id || i}
                className="relative pl-6 pb-2 border-l border-white/[0.08] last:border-transparent group"
              >
                {/* Timeline node icon */}
                <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-[#090B0F] border border-white/[0.15] flex items-center justify-center shadow-sm">
                  {renderEventIcon(event.type)}
                </div>

                <div className="p-3 rounded-xl bg-[#12161D] border border-white/[0.06] hover:border-white/[0.12] transition-all text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-100">{event.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-slate-400 leading-relaxed font-sans">{event.description}</p>

                  {/* Metadata / Technical Inspection Drawer */}
                  {hasMetadata && (
                    <div className="mt-2 pt-2 border-t border-white/[0.05]">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleExpand(event.id)}
                          className="flex items-center gap-1 text-[10px] font-mono text-sky-400 hover:text-sky-300 cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          <span>{isExpanded ? 'Hide Telemetry Proof' : 'Inspect Telemetry Proof'}</span>
                        </button>
                        {isExpanded && (
                          <button
                            onClick={() => copyTelemetry(event.id, event.metadata)}
                            className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-200"
                          >
                            {copiedId === event.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === event.id ? 'Copied' : 'Copy JSON'}</span>
                          </button>
                        )}
                      </div>
                      {isExpanded && (
                        <pre className="mt-2 p-2 rounded bg-black/60 border border-white/[0.05] text-[10px] text-slate-300 font-mono overflow-x-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Retry action button if failure */}
                  {(event.type === 'TOOL_CALL_FAILED' || event.type === 'VERIFICATION_FAILED') &&
                    event.actionId &&
                    onRetryAction && (
                      <div className="mt-2 pt-2 border-t border-white/[0.05] flex justify-end">
                        <button
                          onClick={() => onRetryAction(event.actionId!)}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded border border-rose-500/40 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry Action [{event.actionId}]</span>
                        </button>
                      </div>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
