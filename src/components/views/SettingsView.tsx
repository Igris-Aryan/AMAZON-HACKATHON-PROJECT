/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { MagneticButton } from '../common/MagneticButton';
import { UserSettings } from '../../types';
import {
  Settings,
  RefreshCw,
  Download,
  ShieldCheck,
  Thermometer,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (updated: Partial<UserSettings>) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDemo,
}) => {
  const [resetting, setResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleToggle = async (key: keyof UserSettings, val: any) => {
    await onUpdateSettings({ [key]: val });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleConfirmReset = async () => {
    try {
      setResetting(true);
      await onResetDemo();
      setShowConfirmReset(false);
    } finally {
      setResetting(false);
    }
  };

  const exportDiagnostics = () => {
    const diagnostics = {
      system: 'ActionGuard AI (Project Kinetic)',
      timestamp: new Date().toISOString(),
      environment: 'DEMO_SIMULATOR',
      settings,
      clientCapabilities: {
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
      },
    };
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `actionguard-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
              Configuration Registry
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <span>Application Settings & Safety Policies</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure default environmental units, risk approval thresholds, and demo state parameters.
          </p>
        </div>

        {savedNotice && (
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Settings Saved
          </span>
        )}
      </div>

      {/* 1. Units & Display Preferences */}
      <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Units & Telemetry Conventions
          </span>
          <Thermometer className="w-4 h-4 text-sky-400" />
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Temperature Scale</div>
              <p className="text-slate-400">Scale for household climate displays & verification</p>
            </div>
            <div className="flex items-center bg-[#12161D] p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => handleToggle('temperatureUnit', 'celsius')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  settings.temperatureUnit === 'celsius'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Celsius (°C)
              </button>
              <button
                onClick={() => handleToggle('temperatureUnit', 'fahrenheit')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  settings.temperatureUnit === 'fahrenheit'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fahrenheit (°F)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Automation Safety & Permission Gates */}
      <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Automation Safety & Authorization Gates
          </span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="space-y-4 text-xs">
          {/* Low Risk */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
            <div>
              <div className="font-semibold text-slate-200">Auto-Approve Low-Risk Operations</div>
              <p className="text-slate-400">Telemetry read queries, device listing, and status verification</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoApproveLowRisk}
              onChange={(e) => handleToggle('autoApproveLowRisk', e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          {/* Medium Risk */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
            <div>
              <div className="font-semibold text-slate-200">Auto-Approve Medium-Risk Operations</div>
              <p className="text-slate-400">
                Light toggles, brightness dimming, and thermostat setpoints (Disable to require confirmation)
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoApproveMediumRisk}
              onChange={(e) => handleToggle('autoApproveMediumRisk', e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          {/* High Risk */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Enforce Strict Door Unlock Confirmation</div>
              <p className="text-slate-400">
                Always require explicit per-action authorization before disengaging entrance deadbolts
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireExplicitDoorUnlock}
              onChange={(e) => handleToggle('requireExplicitDoorUnlock', e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Demo Reset & Diagnostics */}
      <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            Diagnostics & Maintenance
          </span>
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Export Application Diagnostics</div>
              <p className="text-slate-400">Generates clean configuration telemetry with zero secrets or tokens</p>
            </div>
            <MagneticButton variant="secondary" size="sm" onClick={exportDiagnostics}>
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export JSON</span>
            </MagneticButton>
          </div>

          <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
            <div>
              <div className="font-semibold text-rose-400">Reset Demo Simulator</div>
              <p className="text-slate-400">Restores default device states and clears all injected failure flags</p>
            </div>
            <MagneticButton
              variant="danger"
              size="sm"
              onClick={() => setShowConfirmReset(true)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Environment...</span>
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showConfirmReset && (
        <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-300 font-bold font-mono">
            <AlertTriangle className="w-4 h-4" />
            <span>Confirm Demo Environment Reset</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">
            This will restore all simulated devices to initial states (Living Room: ON, Bedroom: ON, Thermostat: 24°C, Door:
            UNLOCKED), clear failure injection flags, and wipe execution history.
          </p>
          <div className="flex items-center gap-2 justify-end pt-2">
            <button
              onClick={() => setShowConfirmReset(false)}
              className="px-3.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <MagneticButton
              variant="danger"
              size="sm"
              disabled={resetting}
              onClick={handleConfirmReset}
            >
              {resetting ? 'Resetting...' : 'Yes, Reset Demo'}
            </MagneticButton>
          </div>
        </div>
      )}
    </div>
  );
};
