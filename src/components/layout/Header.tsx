/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, Play, Settings, PlusCircle, Cpu, RefreshCw } from 'lucide-react';
import { MagneticButton } from '../common/MagneticButton';
import { FailureInjectionConfig } from '../../types';

interface HeaderProps {
  onNewCommand: () => void;
  onOpenFailureLab: () => void;
  onRunReliabilityDemo: () => void;
  onOpenSettings: () => void;
  failures: FailureInjectionConfig;
  onlineCount: number;
  totalDevices: number;
  isRunningDemo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNewCommand,
  onOpenFailureLab,
  onRunReliabilityDemo,
  onOpenSettings,
  failures,
  onlineCount,
  totalDevices,
  isRunningDemo = false,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeFailuresCount =
    (failures.thermostatWriteFail ? 1 : 0) +
    (failures.verificationReadFail ? 1 : 0) +
    (failures.deviceOfflineId ? 1 : 0) +
    (failures.staleStateSimulation ? 1 : 0) +
    (failures.partialCompletionMode ? 1 : 0) +
    (failures.delayedOperationMs > 0 ? 1 : 0);

  return (
    <header className="h-16 border-b border-white/[0.07] bg-[#090B0F]/90 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Brand & Wordmark */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#12161D] border border-white/[0.12] flex items-center justify-center shadow-lg shadow-black/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Shield className="w-4 h-4 text-sky-400 stroke-[2.2] relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-white text-sm font-mono">
                ACTION<span className="text-sky-400">GUARD</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                KINETIC
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              An AI assistant that proves what it did.
            </p>
          </div>
        </div>

        {/* Environment Badge */}
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-white/[0.08]">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#12161D] border border-white/[0.08] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SIMULATED ALEXA+ ENVIRONMENT</span>
          </span>
        </div>
      </div>

      {/* Center Live Telemetry */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span>
            Telemetry: <span className="text-slate-200">{onlineCount}/{totalDevices} Online</span>
          </span>
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>{time}</span>
        </div>
      </div>

      {/* Action Controls with Magnetic Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Failure Lab Button */}
        <button
          onClick={onOpenFailureLab}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            activeFailuresCount > 0
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
              : 'bg-[#12161D] border-white/[0.08] text-slate-300 hover:bg-[#171C24] hover:border-white/[0.15]'
          }`}
          title="Open Failure Injection Lab"
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${activeFailuresCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Failure Lab</span>
          {activeFailuresCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
              {activeFailuresCount}
            </span>
          )}
        </button>

        {/* 1-Click Run Reliability Demo Magnetic Button */}
        <MagneticButton
          variant="emerald"
          size="sm"
          onClick={onRunReliabilityDemo}
          disabled={isRunningDemo}
          title="Run 1-Click Reliability Demonstration"
        >
          {isRunningDemo ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current text-white" />
          )}
          <span className="hidden sm:inline">Run Reliability Demo</span>
          <span className="sm:hidden">Demo</span>
        </MagneticButton>

        {/* New Command Shortcut */}
        <MagneticButton variant="primary" size="sm" onClick={onNewCommand}>
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden md:inline">New Command</span>
        </MagneticButton>

        {/* Settings Shortcut */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-xl border border-transparent hover:border-white/[0.08] transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
