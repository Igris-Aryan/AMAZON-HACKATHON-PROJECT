/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CommandExecutionRecord, CommandPhase, VerificationStatus } from '../../types';
import {
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Play,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Info,
} from 'lucide-react';

interface TrustEngineProps {
  currentExecution: CommandExecutionRecord | null;
  onSelectStage?: (stageId: string) => void;
  className?: string;
}

interface StageDefinition {
  id: string;
  label: string;
  shortDesc: string;
  icon: React.FC<any>;
  getStatus: (exec: CommandExecutionRecord | null) => 'idle' | 'active' | 'completed' | 'warning' | 'failed' | 'unverified';
  getDetails: (exec: CommandExecutionRecord | null) => string;
}

export const TrustEngine: React.FC<TrustEngineProps> = ({ currentExecution, className = '' }) => {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const stages: StageDefinition[] = [
    {
      id: 'request',
      label: 'REQUEST',
      shortDesc: 'Intent Ingestion',
      icon: MessageSquare,
      getStatus: (exec) => {
        if (!exec) return 'idle';
        return 'completed';
      },
      getDetails: (exec) => (exec ? `Received: "${exec.command}"` : 'Awaiting natural-language instruction.'),
    },
    {
      id: 'plan',
      label: 'PLAN',
      shortDesc: 'Structured Strategy',
      icon: Sparkles,
      getStatus: (exec) => {
        if (!exec) return 'idle';
        if (exec.phase === 'planning') return 'active';
        if (exec.plan) return 'completed';
        return 'idle';
      },
      getDetails: (exec) =>
        exec?.plan
          ? `Decomposed into ${exec.plan.actions.length} action(s) via ${exec.plan.plannerType.toUpperCase()} planner.`
          : 'Synthesizing action sequence with expected postconditions.',
    },
    {
      id: 'approval',
      label: 'APPROVAL',
      shortDesc: 'Policy Safety Gate',
      icon: ShieldAlert,
      getStatus: (exec) => {
        if (!exec || !exec.plan) return 'idle';
        const hasPending = exec.plan.actions.some((a) => a.approvalStatus === 'pending');
        if (hasPending) return 'warning';
        if (exec.phase === 'awaiting_approval') return 'warning';
        return 'completed';
      },
      getDetails: (exec) => {
        if (!exec?.plan) return 'Evaluating risk profile of proposed operations.';
        const pending = exec.plan.actions.filter((a) => a.approvalStatus === 'pending');
        if (pending.length > 0) return `${pending.length} action(s) require explicit user authorization.`;
        return 'All proposed operations authorized by policy profile or user confirmation.';
      },
    },
    {
      id: 'execution',
      label: 'EXECUTION',
      shortDesc: 'Hardware Dispatch',
      icon: Play,
      getStatus: (exec) => {
        if (!exec) return 'idle';
        if (exec.phase === 'executing') return 'active';
        if (['verifying', 'completed', 'partially_completed', 'failed', 'unverified'].includes(exec.phase)) {
          const hasFailed = exec.plan?.actions.some((a) => a.executionStatus === 'failed');
          return hasFailed ? 'failed' : 'completed';
        }
        return 'idle';
      },
      getDetails: (exec) => {
        if (exec?.phase === 'executing') return 'Dispatching instructions to simulated device registry.';
        const failed = exec?.plan?.actions.filter((a) => a.executionStatus === 'failed');
        if (failed && failed.length > 0) return `Execution fault on ${failed.length} device(s).`;
        return 'Tool invocation acknowledged by physical simulation layer.';
      },
    },
    {
      id: 'verification',
      label: 'VERIFICATION',
      shortDesc: 'Independent Read',
      icon: ShieldCheck,
      getStatus: (exec) => {
        if (!exec) return 'idle';
        if (exec.phase === 'verifying') return 'active';
        if (['completed', 'partially_completed', 'failed', 'unverified'].includes(exec.phase)) {
          const verStatuses = exec.plan?.actions.map((a) => a.verificationStatus) || [];
          if (verStatuses.includes('unverified')) return 'unverified';
          if (verStatuses.includes('failed')) return 'failed';
          return 'completed';
        }
        return 'idle';
      },
      getDetails: (exec) => {
        if (exec?.phase === 'verifying') return 'Querying independent sensor telemetry for expected postconditions.';
        const unverified = exec?.plan?.actions.filter((a) => a.verificationStatus === 'unverified');
        if (unverified && unverified.length > 0) return 'Independent verification inconclusive (sensor read error).';
        const failed = exec?.plan?.actions.filter((a) => a.verificationStatus === 'failed');
        if (failed && failed.length > 0) return 'Observed device telemetry contradicted expected postcondition.';
        return 'All postconditions confirmed via separate state reads.';
      },
    },
    {
      id: 'result',
      label: 'RESULT',
      shortDesc: 'Truthful Report',
      icon: CheckCircle2,
      getStatus: (exec) => {
        if (!exec?.finalReport) return 'idle';
        if (exec.finalReport.overallOutcome === 'Completed and verified') return 'completed';
        if (exec.finalReport.overallOutcome === 'Failed') return 'failed';
        if (exec.finalReport.overallOutcome === 'Unverified') return 'unverified';
        return 'warning';
      },
      getDetails: (exec) =>
        exec?.finalReport
          ? `Final Status: ${exec.finalReport.overallOutcome} (${exec.finalReport.completedActions.length} verified, ${exec.finalReport.failedActions.length} failed).`
          : 'Pending execution and telemetry corroboration.',
    },
  ];

  const activeStage = selectedStageId ? stages.find((s) => s.id === selectedStageId) : null;

  return (
    <div className={`p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] relative overflow-hidden ${className}`}>
      {/* Precision ambient glow */}
      <div className="absolute top-0 left-1/4 w-1/2 h-20 bg-sky-500/[0.04] blur-3xl pointer-events-none" />

      {/* Trust Engine Banner */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            THE TRUST ENGINE
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
            PATENTED VERIFIED PIPELINE
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          {currentExecution ? `Phase: ${currentExecution.phase.toUpperCase()}` : 'System Ready'}
        </div>
      </div>

      {/* Connected Interactive Stage Topology */}
      <div className="relative py-2">
        {/* SVG Connecting Paths */}
        <div className="hidden lg:block absolute top-[28px] left-[5%] right-[5%] h-0.5 pointer-events-none z-0">
          <svg className="w-full h-2 overflow-visible" preserveAspectRatio="none">
            <line
              x1="0%"
              y1="1"
              x2="100%"
              y2="1"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {currentExecution && (
              <line
                x1="0%"
                y1="1"
                x2="100%"
                y2="1"
                stroke="url(#signalGradient)"
                strokeWidth="2"
                className="animate-signal"
              />
            )}
            <defs>
              <linearGradient id="signalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#76A9FF" />
                <stop offset="50%" stopColor="#71E0D1" />
                <stop offset="100%" stopColor="#5CE0A0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Node Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
          {stages.map((stage, idx) => {
            const status = stage.getStatus(currentExecution);
            const Icon = stage.icon;
            const isSelected = selectedStageId === stage.id;

            const statusColors = {
              idle: 'bg-[#12161D] text-slate-500 border-white/[0.07] hover:border-white/[0.15]',
              active: 'bg-sky-500/10 text-sky-400 border-sky-400/50 shadow-lg shadow-sky-500/20 ring-1 ring-sky-400/30',
              completed:
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10',
              warning:
                'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/30',
              failed:
                'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-md shadow-rose-500/20 ring-1 ring-rose-400/30',
              unverified:
                'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm ring-1 ring-amber-400/20',
            }[status];

            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(isSelected ? null : stage.id)}
                className={`interactive-node flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${statusColors} ${
                  isSelected ? 'scale-[1.03] ring-2 ring-white/20' : ''
                }`}
              >
                {/* Node Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110 ${
                    status === 'active'
                      ? 'bg-sky-500/20 text-sky-300'
                      : status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : status === 'warning'
                      ? 'bg-amber-500/20 text-amber-300'
                      : status === 'failed'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-white/[0.03] text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>

                {/* Node Title */}
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-200 uppercase">
                  {stage.label}
                </span>
                <span className="text-[9px] text-slate-400 truncate max-w-full mt-0.5">
                  {stage.shortDesc}
                </span>

                {/* Status Dot / Flag */}
                <div className="mt-2 flex items-center gap-1 text-[9px] font-mono uppercase">
                  {status === 'active' && (
                    <span className="text-sky-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                      Active
                    </span>
                  )}
                  {status === 'completed' && <span className="text-emerald-400">Verified</span>}
                  {status === 'warning' && <span className="text-amber-400 font-bold">Gate</span>}
                  {status === 'failed' && <span className="text-rose-400 font-bold">Failed</span>}
                  {status === 'unverified' && <span className="text-amber-300">Unresolved</span>}
                  {status === 'idle' && <span className="text-slate-600">Standby</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Drawer */}
      {activeStage && (
        <div className="mt-4 p-3.5 rounded-xl bg-[#12161D] border border-white/[0.08] text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.05] mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sky-400">{activeStage.label} DETAILS</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-medium">{activeStage.shortDesc}</span>
            </div>
            <button
              onClick={() => setSelectedStageId(null)}
              className="text-slate-500 hover:text-slate-300 text-[11px]"
            >
              Close ✕
            </button>
          </div>
          <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
            {activeStage.getDetails(currentExecution)}
          </p>
        </div>
      )}
    </div>
  );
};
