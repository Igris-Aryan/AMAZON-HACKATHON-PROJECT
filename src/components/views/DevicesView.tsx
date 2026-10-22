/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { DeviceCard } from '../simulator/DeviceCard';
import { HouseholdMap } from '../visualization/HouseholdMap';
import { MagneticButton } from '../common/MagneticButton';
import { DeviceState, UserSettings } from '../../types';
import {
  Cpu,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
} from 'lucide-react';

interface DevicesViewProps {
  devices: DeviceState[];
  settings: UserSettings;
  onOperateDevice: (deviceId: string, toolName: string, args: Record<string, any>) => Promise<void>;
  onReconcile: () => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  settings,
  onOperateDevice,
  onReconcile,
  onResetDemo,
}) => {
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  const handleReconcile = async () => {
    try {
      setReconciling(true);
      await onReconcile();
      setReconcileResult('State reconciliation complete: All device telemetry corroborated independently.');
      setTimeout(() => setReconcileResult(null), 5000);
    } finally {
      setReconciling(false);
    }
  };

  const onlineDevices = devices.filter((d) => d.isOnline);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
              Physical Topology Registry
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <span>Smart-Home Device Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real stateful simulator actuators. Manual operations invoke the same backend tool registry and verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MagneticButton
            variant="secondary"
            size="sm"
            onClick={handleReconcile}
            disabled={reconciling}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${reconciling ? 'animate-spin' : ''}`} />
            <span>Reconcile Telemetry</span>
          </MagneticButton>
        </div>
      </div>

      {reconcileResult && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{reconcileResult}</span>
        </div>
      )}

      {/* Spatial Household Blueprint */}
      <HouseholdMap
        devices={devices}
        onOperateDevice={onOperateDevice}
        temperatureUnit={settings.temperatureUnit}
      />

      {/* Simulator Health & Status Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-[#0D1016] rounded-2xl border border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Registered Actuators</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">{devices.length} Devices</div>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-mono">
            VIRTUAL BUS
          </span>
        </div>

        <div className="p-4 bg-[#0D1016] rounded-2xl border border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Telemetry Corroboration</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {onlineDevices.length} / {devices.length} Online
            </div>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
            OPERATIONAL
          </span>
        </div>

        <div className="p-4 bg-[#0D1016] rounded-2xl border border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Policy Engine</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">Per-Action Gates</div>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
            ACTIVE
          </span>
        </div>
      </div>

      {/* Full Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onOperate={onOperateDevice}
            temperatureUnit={settings.temperatureUnit}
          />
        ))}
      </div>

      {/* Policy Notice Card */}
      <div className="p-4 rounded-2xl bg-[#0D1016] border border-white/[0.08] text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ActionGuard Physical Device Safety Contract</span>
        </div>
        <p className="leading-relaxed">
          State changes performed through these controls execute the exact same server-side tool functions, schema
          validators, and independent verification engines as AI-planned commands.
        </p>
      </div>
    </div>
  );
};
