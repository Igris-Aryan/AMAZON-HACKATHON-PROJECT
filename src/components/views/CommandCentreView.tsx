/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { PlanView } from '../command/PlanView';
import { ExecutionTimeline } from '../command/ExecutionTimeline';
import { TrustEngine } from '../visualization/TrustEngine';
import { MagneticButton } from '../common/MagneticButton';
import { DeviceState, CommandExecutionRecord, UserSettings } from '../../types';
import {
  Terminal,
  Send,
  Sparkles,
  Cpu,
  Layers,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface CommandCentreViewProps {
  currentExecution: CommandExecutionRecord | null;
  devices: DeviceState[];
  settings: UserSettings;
  onSubmitCommand: (command: string, scenarioId?: string) => Promise<void>;
  onApproveAction: (actionId?: string) => Promise<void>;
  onRejectAction: (actionId: string, reason?: string) => Promise<void>;
  onExecutePlan: () => Promise<void>;
  onRetryAction: (actionId: string) => Promise<void>;
  onOpenReport: (record: CommandExecutionRecord) => void;
  isLoading: boolean;
  isExecuting: boolean;
}

export const CommandCentreView: React.FC<CommandCentreViewProps> = ({
  currentExecution,
  devices,
  settings,
  onSubmitCommand,
  onApproveAction,
  onRejectAction,
  onExecutePlan,
  onRetryAction,
  onOpenReport,
  isLoading,
  isExecuting,
}) => {
  const [inputCommand, setInputCommand] = useState(
    currentExecution?.command ||
      'Prepare my house for sleep. Turn off the living room lights, set the bedroom temperature to 22 degrees, and check whether the front door is locked.'
  );

  const scenarios = [
    {
      id: 'good_night',
      title: '1. Good Night (Sleep Mode)',
      cmd: 'Prepare my house for sleep. Turn off the living room lights, set the bedroom temperature to 22 degrees, and check whether the front door is locked.',
    },
    {
      id: 'failure_recovery',
      title: '2. Thermostat Failure Recovery',
      cmd: 'Set the bedroom temperature to 22 degrees.',
    },
    {
      id: 'unverified_execution',
      title: '3. Unverified Sensor Read',
      cmd: 'Turn off the bedroom lights.',
    },
    {
      id: 'safety_boundary',
      title: '4. Consequential Safety Boundary',
      cmd: 'Unlock the front door and turn on night mode.',
    },
    {
      id: 'contradictory_request',
      title: '5. Contradictory Exception Handling',
      cmd: 'Turn off all the lights, but keep the bedroom lights on.',
    },
  ];

  const handleRunCommand = async (cmdToRun: string, sId?: string) => {
    setInputCommand(cmdToRun);
    await onSubmitCommand(cmdToRun, sId);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Top Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0D1016] border border-white/[0.08] rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#12161D] border border-white/[0.1] flex items-center justify-center">
            <Terminal className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Autonomous Command Operations Console
            </h2>
            <p className="text-xs text-slate-400">
              Controlled State Machine: Plan → Authorize → Execute → Verify → Truthful Audit
            </p>
          </div>
        </div>

        {currentExecution && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Phase:</span>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase">
              {currentExecution.phase.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Trust Engine Banner in Command Centre */}
      <TrustEngine currentExecution={currentExecution} />

      {/* 3-Region Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL (4 cols): Context & Device Availability */}
        <div className="lg:col-span-4 space-y-4">
          {/* Editable Command Card */}
          <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                Instruction Context
              </span>
              <span className="text-[10px] font-mono text-slate-500">Natural Language</span>
            </div>

            <textarea
              rows={3}
              value={inputCommand}
              onChange={(e) => setInputCommand(e.target.value)}
              placeholder="Enter command..."
              className="w-full bg-[#12161D] border border-white/[0.1] rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none resize-none font-medium leading-relaxed"
            />

            <MagneticButton
              variant="primary"
              size="sm"
              disabled={isLoading || !inputCommand.trim()}
              onClick={() => handleRunCommand(inputCommand)}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Formulating Plan...
                </span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Formulate Action Plan</span>
                </>
              )}
            </MagneticButton>
          </div>

          {/* Quick Scenario Presets */}
          <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                Benchmark Scenarios
              </span>
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            </div>

            <div className="space-y-1.5">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleRunCommand(s.cmd, s.id)}
                  className="w-full text-left p-2.5 rounded-xl bg-[#12161D] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] transition-all text-xs group cursor-pointer"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
                    {s.title}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{s.cmd}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Hardware Telemetry Preview */}
          <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                Hardware Topology
              </span>
              <span className="text-[10px] font-mono text-slate-500">Live Simulator</span>
            </div>

            <div className="space-y-2">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-xl bg-[#12161D] border border-white/[0.05] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-200">{d.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {d.type === 'light' && `Power: ${d.state.power?.toUpperCase()} (${d.state.brightness}%)`}
                      {d.type === 'thermostat' && `Temp: ${d.state.temperature}°C`}
                      {d.type === 'lock' && `Deadbolt: ${d.state.locked ? 'LOCKED' : 'UNLOCKED'}`}
                      {d.type === 'routine' && `Active: ${d.state.active ? 'YES' : 'NO'}`}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      d.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {d.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTRE PANEL (4 cols): Action Plan & Gates */}
        <div className="lg:col-span-4 space-y-4">
          {currentExecution?.plan ? (
            <PlanView
              plan={currentExecution.plan}
              onApproveAction={onApproveAction}
              onRejectAction={onRejectAction}
              onExecutePlan={onExecutePlan}
              isExecuting={isExecuting}
            />
          ) : (
            <div className="bg-[#0D1016] border border-white/[0.08] rounded-2xl p-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">No Active Plan Formulated</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Submit an instruction or select a benchmark scenario to generate a verified action plan.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL (4 cols): Live Execution Stream */}
        <div className="lg:col-span-4 space-y-4">
          <ExecutionTimeline
            events={currentExecution?.events || []}
            phase={currentExecution?.phase || 'idle'}
            onOpenReport={
              currentExecution?.finalReport ? () => onOpenReport(currentExecution) : undefined
            }
            onRetryAction={onRetryAction}
          />
        </div>
      </div>
    </div>
  );
};
