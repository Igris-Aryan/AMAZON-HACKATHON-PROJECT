/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { MagneticButton } from '../common/MagneticButton';
import { StructuredPlan, PlanAction } from '../../types';
import {
  ShieldAlert,
  Play,
  Check,
  XCircle,
  Cpu,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';

interface PlanViewProps {
  plan: StructuredPlan;
  onApproveAction: (actionId?: string) => Promise<void>;
  onRejectAction: (actionId: string, reason?: string) => Promise<void>;
  onExecutePlan: () => Promise<void>;
  isExecuting: boolean;
}

export const PlanView: React.FC<PlanViewProps> = ({
  plan,
  onApproveAction,
  onRejectAction,
  onExecutePlan,
  isExecuting,
}) => {
  const pendingActions = plan.actions.filter((a) => a.approvalStatus === 'pending');
  const hasPending = pendingActions.length > 0;
  const canExecute = !hasPending && plan.actions.some((a) => a.executionStatus === 'approved');

  return (
    <div className="bg-[#0D1016] border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Plan Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-mono font-bold text-sky-400 uppercase tracking-widest">
              STRUCTURED PLAN
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-300 border border-white/[0.08]">
              Planner: {plan.plannerType.toUpperCase()}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                hasPending
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {hasPending ? `${pendingActions.length} APPROVAL(S) REQUIRED` : 'READY TO EXECUTE'}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-white leading-snug">
            {plan.humanReadableSummary}
          </h3>
        </div>

        {/* Global Plan Approval / Execution Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {hasPending && (
            <MagneticButton
              variant="emerald"
              size="sm"
              onClick={() => onApproveAction()}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Authorize All ({pendingActions.length})</span>
            </MagneticButton>
          )}

          <MagneticButton
            variant="primary"
            size="sm"
            onClick={onExecutePlan}
            disabled={hasPending || isExecuting}
          >
            {isExecuting ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Executing...
              </span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Verified Plan</span>
              </>
            )}
          </MagneticButton>
        </div>
      </div>

      {/* Assumptions & Clarifications */}
      {plan.assumptions.length > 0 && (
        <div className="p-3 bg-[#12161D] rounded-xl border border-white/[0.06] text-xs text-slate-400">
          <span className="font-semibold text-slate-300 font-mono text-[10px] uppercase tracking-wider mr-2">
            Plan Assumptions:
          </span>
          {plan.assumptions.join(' • ')}
        </div>
      )}

      {/* Connected Action Sequence List */}
      <div className="space-y-3 relative">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>SEQUENCE ({plan.actions.length} ATOMIC ACTIONS)</span>
          <span>RISK & VERIFICATION POSTCONDITIONS</span>
        </div>

        {plan.actions.map((action, idx) => (
          <div
            key={action.actionId}
            className={`p-4 rounded-xl border transition-all duration-200 relative ${
              action.approvalStatus === 'pending'
                ? 'bg-amber-950/20 border-amber-500/30 shadow-md shadow-amber-950/10'
                : 'bg-[#12161D] border-white/[0.07] hover:border-white/[0.14]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Action Info */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-400 font-bold">#{idx + 1}</span>
                  <span className="text-xs font-mono font-semibold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/80">
                    {action.toolName}
                  </span>
                  <span className="text-xs font-mono text-slate-400">→ {action.targetDeviceId}</span>
                  <StatusBadge type="risk" value={action.riskLevel} />
                  <StatusBadge type="execution" value={action.executionStatus} />
                  {action.verificationStatus !== 'not_checked' && (
                    <StatusBadge type="verification" value={action.verificationStatus} />
                  )}
                </div>

                <p className="text-xs text-slate-200 font-medium">{action.description}</p>

                {/* Requested State & Expected Postcondition Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="p-2 rounded bg-black/40 border border-white/[0.05] text-slate-400">
                    <span className="text-slate-500">Params: </span>
                    <span className="text-slate-300">{JSON.stringify(action.requestedState)}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/[0.05] text-slate-400">
                    <span className="text-slate-500">Expected Postcondition: </span>
                    <span className="text-emerald-400 font-semibold">
                      {action.expectedPostcondition.property} ={' '}
                      {JSON.stringify(action.expectedPostcondition.expectedValue)}
                    </span>
                  </div>
                </div>

                {/* Failure reason if applicable */}
                {action.failureReason && (
                  <div className="text-xs text-rose-300 bg-rose-950/30 border border-rose-500/30 px-3 py-1.5 rounded-lg font-mono">
                    Fault Reason: {action.failureReason}
                  </div>
                )}
              </div>

              {/* Right Action Approval Buttons */}
              {action.approvalStatus === 'pending' && (
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => onApproveAction(action.actionId)}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Authorize</span>
                  </button>
                  <button
                    onClick={() => onRejectAction(action.actionId, 'User denied approval in plan view')}
                    className="flex items-center gap-1 px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-rose-400 hover:text-rose-300 rounded-lg text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
