/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { MagneticButton } from '../common/MagneticButton';
import { FinalReport } from '../../types';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  CheckCircle2,
  FileCheck2,
  RotateCcw,
} from 'lucide-react';

interface FinalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: FinalReport | null;
  onRetryAction?: (actionId: string) => void;
}

export const FinalReportModal: React.FC<FinalReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onRetryAction,
}) => {
  if (!report) return null;

  const outcomeColors =
    {
      'Completed and verified': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      'Partially completed': 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      Failed: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      Unverified: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      Cancelled: 'text-slate-400 bg-white/[0.04] border-white/[0.08]',
    }[report.overallOutcome] || 'text-slate-300 bg-white/[0.04] border-white/[0.08]';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verified Execution Audit Report"
      subtitle={`Command ID: ${report.commandId} • Generated ${new Date(report.generatedAt).toLocaleTimeString()}`}
      maxWidth="2xl"
    >
      <div className="space-y-5 text-sm">
        {/* Header Outcome Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${outcomeColors}`}>
          <div className="flex items-center gap-3">
            {report.overallOutcome === 'Completed and verified' ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : report.overallOutcome === 'Failed' ? (
              <XCircle className="w-6 h-6 text-rose-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            )}
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest opacity-80">
                Corroborated Outcome
              </div>
              <div className="text-lg font-bold tracking-tight font-sans">{report.overallOutcome}</div>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-black/40 rounded-lg font-mono">
            {report.evidence.length} Telemetry Records
          </span>
        </div>

        {/* User Request */}
        <div className="p-3.5 bg-[#12161D] rounded-xl border border-white/[0.06]">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
            Original Instruction
          </div>
          <p className="text-slate-100 font-medium italic">"{report.originalRequest}"</p>
        </div>

        {/* Breakdown of Verified, Failed, Unverified */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
            Atomic Outcomes Breakdown
          </h4>

          {/* Verified Actions */}
          {report.completedActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Successful ({report.completedActions.length})</span>
              </div>
              {report.completedActions.map((a) => (
                <div key={a.actionId} className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs">
                  <div className="font-medium text-slate-200">{a.description}</div>
                  <div className="text-slate-400 mt-1 flex items-center gap-2">
                    <span className="font-mono text-[11px]">Corroborated Telemetry:</span>
                    <span className="font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                      {JSON.stringify(a.verifiedState)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Failed Actions */}
          {report.failedActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 font-mono">
                <XCircle className="w-4 h-4" />
                <span>Failed Actions ({report.failedActions.length})</span>
              </div>
              {report.failedActions.map((a) => (
                <div
                  key={a.actionId}
                  className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-200">{a.description}</div>
                    <div className="text-rose-400 mt-1 font-mono text-[11px]">{a.reason}</div>
                  </div>
                  {onRetryAction && (
                    <button
                      onClick={() => onRetryAction(a.actionId)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg border border-rose-500/40 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Unverified Actions */}
          {report.unverifiedActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono">
                <HelpCircle className="w-4 h-4" />
                <span>Unverified Actions ({report.unverifiedActions.length})</span>
              </div>
              {report.unverifiedActions.map((a) => (
                <div key={a.actionId} className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs">
                  <div className="font-medium text-slate-200">{a.description}</div>
                  <div className="text-amber-300 mt-1 font-mono text-[11px]">{a.reason}</div>
                </div>
              ))}
            </div>
          )}

          {/* Skipped Actions */}
          {report.skippedActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 font-mono">
                <span>Skipped / Denied Actions ({report.skippedActions.length})</span>
              </div>
              {report.skippedActions.map((a) => (
                <div key={a.actionId} className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-xs">
                  <div className="font-medium text-slate-300">{a.description}</div>
                  <div className="text-slate-400 mt-0.5">{a.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Independent Telemetry Evidence Matrix */}
        <div className="p-3.5 bg-[#12161D] rounded-xl border border-white/[0.06] text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Independent Telemetry Evidence Matrix
            </span>
            <span className="text-slate-500 font-mono text-[10px]">Source: Direct Read Engine</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="text-slate-500 border-b border-white/[0.06] pb-1">
                  <th className="py-1">Action</th>
                  <th className="py-1">Expected</th>
                  <th className="py-1">Observed</th>
                  <th className="py-1">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {report.evidence.map((ev, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="py-1.5 font-sans">{ev.actionId}</td>
                    <td className="py-1.5 text-sky-300">{JSON.stringify(ev.expected)}</td>
                    <td className="py-1.5 text-slate-200">{JSON.stringify(ev.observed)}</td>
                    <td className="py-1.5">
                      <StatusBadge type="verification" value={ev.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended Next Step */}
        {report.nextStep && (
          <div className="p-3.5 bg-sky-950/20 border border-sky-500/20 rounded-xl flex items-start gap-3 text-xs">
            <FileCheck2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                Recommended Safe Recovery Step
              </div>
              <p className="text-slate-300 mt-0.5">{report.nextStep}</p>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2 border-t border-white/[0.06] flex justify-end">
          <MagneticButton variant="secondary" size="sm" onClick={onClose}>
            Close Audit Report
          </MagneticButton>
        </div>
      </div>
    </Modal>
  );
};
