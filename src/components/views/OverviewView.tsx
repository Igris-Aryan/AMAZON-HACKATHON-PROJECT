/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { CommandInput } from '../command/CommandInput';
import { TrustEngine } from '../visualization/TrustEngine';
import { HouseholdMap } from '../visualization/HouseholdMap';
import { MagneticButton } from '../common/MagneticButton';
import { CommandExecutionRecord, DeviceState, UserSettings } from '../../types';
import {
  ShieldCheck,
  XCircle,
  HelpCircle,
  ArrowRight,
  Cpu,
  Sparkles,
  CheckCircle2,
  Activity,
  Terminal,
} from 'lucide-react';

interface OverviewViewProps {
  devices: DeviceState[];
  currentExecution: CommandExecutionRecord | null;
  history: CommandExecutionRecord[];
  settings: UserSettings;
  onSubmitCommand: (command: string) => Promise<void>;
  onSelectScenarioPreset: (scenarioId: string, command: string) => void;
  onOperateDevice: (deviceId: string, toolName: string, args: Record<string, any>) => Promise<void>;
  onNavigateToCommandCentre: () => void;
  onNavigateToHistory: () => void;
  onOpenReport: (record: CommandExecutionRecord) => void;
  isLoadingCommand: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  devices,
  currentExecution,
  history,
  settings,
  onSubmitCommand,
  onSelectScenarioPreset,
  onOperateDevice,
  onNavigateToCommandCentre,
  onNavigateToHistory,
  onOpenReport,
  isLoadingCommand,
}) => {
  // Derive Trust Summary from actual stored history
  let totalVerified = 0;
  let totalFailed = 0;
  let totalUnverified = 0;

  history.forEach((record) => {
    if (record.finalReport) {
      totalVerified += record.finalReport.completedActions.length;
      totalFailed += record.finalReport.failedActions.length;
      totalUnverified += record.finalReport.unverifiedActions.length;
    }
  });

  const totalActions = totalVerified + totalFailed + totalUnverified;
  const verifiedPercentage = totalActions > 0 ? Math.round((totalVerified / totalActions) * 100) : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Editorial Top Ribbon: Context, Health, and Metric Ticker */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
              Autonomous Operations Workspace
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-[10px] font-mono text-slate-400">Alexa+ Simulated Primary Track</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            ActionGuard System Overview
          </h1>
        </div>

        {/* Compact Precision Metrics Row */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-[#12161D] border border-white/[0.07] text-left">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Corroboration</div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">{verifiedPercentage}%</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#12161D] border border-white/[0.07] text-left">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Verified Actions</div>
            <div className="text-base font-bold font-mono text-white mt-0.5">{totalVerified}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#12161D] border border-white/[0.07] text-left">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Faults Prevented</div>
            <div className="text-base font-bold font-mono text-rose-400 mt-0.5">{totalFailed}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#12161D] border border-white/[0.07] text-left">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Unverified</div>
            <div className="text-base font-bold font-mono text-amber-400 mt-0.5">{totalUnverified}</div>
          </div>
        </div>
      </div>

      {/* Signature Interactive Experience: THE TRUST ENGINE */}
      <TrustEngine currentExecution={currentExecution} />

      {/* Command Composer Entry Point */}
      <CommandInput
        onSubmit={onSubmitCommand}
        isLoading={isLoadingCommand}
        onSelectScenarioPreset={onSelectScenarioPreset}
      />

      {/* Spatial Household Map (Floor Plan View) */}
      <HouseholdMap
        devices={devices}
        onOperateDevice={onOperateDevice}
        temperatureUnit={settings.temperatureUnit}
      />

      {/* Bottom Asymmetric Grid: Current/Latest Execution & Recent Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT (7 cols): Latest Verified Execution Record */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  {currentExecution ? 'Active Orchestration Session' : 'Latest Execution Snapshot'}
                </h3>
              </div>
              {currentExecution && (
                <button
                  onClick={onNavigateToCommandCentre}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Command Centre</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {currentExecution ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-white/[0.06] text-xs">
                  <div className="text-[10px] font-mono uppercase text-slate-500 mb-0.5">Instruction:</div>
                  <div className="font-medium text-slate-100 italic">"{currentExecution.command}"</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#12161D] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase">Phase</div>
                    <div className="font-bold text-sky-400 mt-0.5 uppercase">
                      {currentExecution.phase.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#12161D] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase">Actions</div>
                    <div className="font-bold text-slate-100 mt-0.5">
                      {currentExecution.plan?.actions.length || 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#12161D] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase">Verified</div>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      {currentExecution.plan?.actions.filter((a) => a.verificationStatus === 'verified').length || 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#12161D] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase">Planner</div>
                    <div className="font-bold text-slate-200 mt-0.5">
                      {currentExecution.plan?.plannerType === 'gemini' ? 'Gemini 3.8' : 'Safety Engine'}
                    </div>
                  </div>
                </div>

                {currentExecution.finalReport && (
                  <div className="pt-2 flex justify-end">
                    <MagneticButton
                      variant="primary"
                      size="sm"
                      onClick={() => onOpenReport(currentExecution)}
                    >
                      <span>Inspect Complete Audit Package</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </MagneticButton>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active execution. Enter a command or select a scenario to orchestrate.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT (5 cols): Activity Stream & Audit History Quickfeed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  Recent Corroborated Audits
                </h3>
              </div>
              <button
                onClick={onNavigateToHistory}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <span>All ({history.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No persistent records found. Execute a command to begin verification logging.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {history.slice(0, 4).map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => onOpenReport(rec)}
                    className="py-2.5 px-2 hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 truncate max-w-[70%]">
                      <div className="font-medium text-slate-200 truncate">"{rec.command}"</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {new Date(rec.timestamp).toLocaleTimeString()} • {rec.plan?.actions.length || 0} step(s)
                      </div>
                    </div>

                    {rec.finalReport && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                          rec.finalReport.overallOutcome === 'Completed and verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : rec.finalReport.overallOutcome === 'Failed'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {rec.finalReport.overallOutcome}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
