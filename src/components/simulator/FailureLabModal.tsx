/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FailureInjectionConfig, DeviceState } from '../../types';
import { MagneticButton } from '../common/MagneticButton';
import { AlertTriangle, Flame, ShieldAlert, WifiOff, Clock, Layers, RefreshCw } from 'lucide-react';

interface FailureLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  failures: FailureInjectionConfig;
  devices: DeviceState[];
  onUpdateFailures: (updated: Partial<FailureInjectionConfig>) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export const FailureLabModal: React.FC<FailureLabModalProps> = ({
  isOpen,
  onClose,
  failures,
  devices,
  onUpdateFailures,
  onResetDemo,
}) => {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const toggle = async (key: keyof FailureInjectionConfig, value: any) => {
    try {
      setLoading(true);
      await onUpdateFailures({ [key]: value });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      await onResetDemo();
      onClose();
    } finally {
      setResetting(false);
    }
  };

  const activeCount =
    (failures.thermostatWriteFail ? 1 : 0) +
    (failures.verificationReadFail ? 1 : 0) +
    (failures.deviceOfflineId ? 1 : 0) +
    (failures.staleStateSimulation ? 1 : 0) +
    (failures.partialCompletionMode ? 1 : 0) +
    (failures.delayedOperationMs > 0 ? 1 : 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Interactive Failure Injection Lab"
      subtitle="Inject deterministic hardware failures to test honest failure reporting & independent verification."
      maxWidth="xl"
    >
      <div className="space-y-4 text-sm">
        {/* Active Injections Alert */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between ${
            activeCount > 0
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-[#12161D] border-white/[0.08] text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${activeCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <span className="font-semibold text-slate-100">{activeCount} Injected Failure(s) Active</span>
              <p className="text-xs text-slate-400 font-mono text-[11px]">
                Mutates actual backend simulator responses in real-time.
              </p>
            </div>
          </div>
          {activeCount > 0 && (
            <button
              onClick={() =>
                onUpdateFailures({
                  thermostatWriteFail: false,
                  verificationReadFail: false,
                  deviceOfflineId: null,
                  staleStateSimulation: false,
                  partialCompletionMode: false,
                  delayedOperationMs: 0,
                })
              }
              className="text-xs px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/40 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Failure Switch Cards */}
        <div className="space-y-2.5">
          {/* 1. Thermostat Write Failure */}
          <div className="flex items-center justify-between p-3.5 bg-[#12161D] rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 mt-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-slate-200">A. Thermostat Actuator Write Failure</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulates actuator timeout on write. Thermostat fails command without mutating state.
                </p>
              </div>
            </div>
            <button
              disabled={loading}
              onClick={() => toggle('thermostatWriteFail', !failures.thermostatWriteFail)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                failures.thermostatWriteFail ? 'bg-rose-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  failures.thermostatWriteFail ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. Verification Read Failure */}
          <div className="flex items-center justify-between p-3.5 bg-[#12161D] rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-slate-200">B. Verification Read Telemetry Failure</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tool execution returns OK, but independent state read fails (CRC mismatch). Marked as UNVERIFIED.
                </p>
              </div>
            </div>
            <button
              disabled={loading}
              onClick={() => toggle('verificationReadFail', !failures.verificationReadFail)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                failures.verificationReadFail ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  failures.verificationReadFail ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Device Offline */}
          <div className="flex items-center justify-between p-3.5 bg-[#12161D] rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 mt-0.5">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-slate-200">D. Device Disconnection / Offline</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Force a simulated smart device offline to test tool and verifier connectivity boundaries.
                </p>
                <div className="mt-2">
                  <select
                    value={failures.deviceOfflineId || ''}
                    onChange={(e) => toggle('deviceOfflineId', e.target.value || null)}
                    className="bg-black/60 border border-white/[0.1] text-xs text-slate-200 rounded px-2.5 py-1 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">None (All Devices Online)</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                failures.deviceOfflineId
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-white/[0.04] text-slate-400'
              }`}
            >
              {failures.deviceOfflineId ? 'DEVICE OFFLINE' : 'ALL ONLINE'}
            </span>
          </div>

          {/* 4. Partial Completion Mode */}
          <div className="flex items-center justify-between p-3.5 bg-[#12161D] rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-slate-200">G. Partial Multi-Action Completion</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Injects a mid-routine failure so one step succeeds while another fails. Proves honest partial reporting.
                </p>
              </div>
            </div>
            <button
              disabled={loading}
              onClick={() => toggle('partialCompletionMode', !failures.partialCompletionMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                failures.partialCompletionMode ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  failures.partialCompletionMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 5. Latency Slider */}
          <div className="flex items-center justify-between p-3.5 bg-[#12161D] rounded-xl border border-white/[0.08] hover:border-white/[0.14] transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium text-slate-200">C. Simulated Hardware Latency</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adds latency ({failures.delayedOperationMs}ms) to observe execution progress and timeouts.
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="500"
                    value={failures.delayedOperationMs}
                    onChange={(e) => toggle('delayedOperationMs', parseInt(e.target.value, 10))}
                    className="w-48 accent-sky-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{failures.delayedOperationMs}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Demo State Button */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <p className="text-xs text-slate-400">Restore default household hardware state and clear failures.</p>
          <MagneticButton
            variant="secondary"
            size="sm"
            onClick={handleReset}
            disabled={resetting}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Environment</span>
          </MagneticButton>
        </div>
      </div>
    </Modal>
  );
};
