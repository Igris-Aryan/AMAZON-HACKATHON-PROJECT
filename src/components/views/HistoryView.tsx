/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { MagneticButton } from '../common/MagneticButton';
import { CommandExecutionRecord } from '../../types';
import {
  History,
  Download,
  Search,
  Filter,
  FileJson,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface HistoryViewProps {
  history: CommandExecutionRecord[];
  onOpenReport: (record: CommandExecutionRecord) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onOpenReport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  const filtered = history.filter((rec) => {
    const matchesSearch =
      rec.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOutcome =
      outcomeFilter === 'all' ||
      (rec.finalReport?.overallOutcome &&
        rec.finalReport.overallOutcome.toLowerCase().includes(outcomeFilter.toLowerCase()));
    return matchesSearch && matchesOutcome;
  });

  const exportJSON = (rec?: CommandExecutionRecord) => {
    const dataToExport = rec || filtered;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = rec
      ? `actionguard-audit-${rec.id}.json`
      : `actionguard-audit-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = [
      'CommandId',
      'Timestamp',
      'Command',
      'Phase',
      'Outcome',
      'VerifiedCount',
      'FailedCount',
      'Environment',
    ];
    const rows = filtered.map((r) => [
      `"${r.id}"`,
      `"${r.timestamp}"`,
      `"${r.command.replace(/"/g, '""')}"`,
      `"${r.phase}"`,
      `"${r.finalReport?.overallOutcome || 'In Progress'}"`,
      r.finalReport?.completedActions.length || 0,
      r.finalReport?.failedActions.length || 0,
      `"${r.environmentType}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `actionguard-audit-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
              Audit Persistence Ledger
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            <span>Execution Audit History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all AI planned actions, user approvals, tool calls, and verified outcomes.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <MagneticButton variant="secondary" size="sm" onClick={() => exportJSON()}>
            <FileJson className="w-3.5 h-3.5 text-sky-400" />
            <span>Export JSON</span>
          </MagneticButton>
          <MagneticButton variant="secondary" size="sm" onClick={exportCSV}>
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </MagneticButton>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0D1016] border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by command instruction or command ID..."
              className="w-full bg-[#12161D] border border-white/[0.1] rounded-xl pl-10 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="bg-[#12161D] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-400 cursor-pointer"
            >
              <option value="all">All Verified Outcomes</option>
              <option value="verified">Verified Succeeded</option>
              <option value="partially">Partially Completed</option>
              <option value="failed">Failed Operations</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit History List */}
      <div className="rounded-2xl bg-[#0D1016] border border-white/[0.08] p-5 shadow-2xl">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            // No execution records matched query.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {filtered.map((record) => (
              <div
                key={record.id}
                className="py-4 px-2 hover:bg-white/[0.02] rounded-xl transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Record Summary */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-300">{record.id}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      {record.environmentType}
                    </span>
                    {record.scenarioId && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800">
                        {record.scenarioId}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white">"{record.command}"</p>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono text-[11px]">
                    <span>Actions: {record.plan?.actions.length || 0}</span>
                    <span>•</span>
                    <span>Events: {record.events.length}</span>
                    {record.plan?.plannerType && (
                      <>
                        <span>•</span>
                        <span className="text-sky-400">Planner: {record.plan.plannerType}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Outcomes & Action Buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  {record.finalReport ? (
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                        record.finalReport.overallOutcome === 'Completed and verified'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : record.finalReport.overallOutcome === 'Failed'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {record.finalReport.overallOutcome}
                    </span>
                  ) : (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
                      {record.phase.toUpperCase()}
                    </span>
                  )}

                  <button
                    onClick={() => onOpenReport(record)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#12161D] hover:bg-white/[0.06] text-slate-200 rounded-xl transition-colors font-medium border border-white/[0.08] cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => exportJSON(record)}
                    title="Export Single Record JSON"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
