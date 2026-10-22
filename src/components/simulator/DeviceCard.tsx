/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lightbulb,
  Thermometer,
  Lock,
  Unlock,
  Moon,
  Power,
  CheckCircle2,
  XCircle,
  WifiOff,
} from 'lucide-react';
import { DeviceState } from '../../types';

interface DeviceCardProps {
  device: DeviceState;
  onOperate: (deviceId: string, toolName: string, args: Record<string, any>) => Promise<void>;
  temperatureUnit?: 'celsius' | 'fahrenheit';
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onOperate,
  temperatureUnit = 'celsius',
}) => {
  const [loading, setLoading] = useState(false);

  const handleToggleLight = async () => {
    try {
      setLoading(true);
      const next = device.state.power === 'on' ? 'off' : 'on';
      await onOperate(device.id, 'set_light_state', { state: next });
    } finally {
      setLoading(false);
    }
  };

  const handleSetBrightness = async (val: number) => {
    try {
      setLoading(true);
      await onOperate(device.id, 'set_light_brightness', { brightness: val });
    } finally {
      setLoading(false);
    }
  };

  const handleSetTemp = async (temp: number) => {
    try {
      setLoading(true);
      await onOperate(device.id, 'set_thermostat_temperature', { temperatureCelsius: temp });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async () => {
    try {
      setLoading(true);
      if (device.state.locked) {
        if (
          window.confirm(
            `ActionGuard Security Boundary: Are you sure you want to disengage ${device.name}? This disengages entrance perimeter deadbolts.`
          )
        ) {
          await onOperate(device.id, 'unlock_door', {});
        }
      } else {
        await onOperate(device.id, 'lock_door', {});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNightMode = async () => {
    try {
      setLoading(true);
      await onOperate(device.id, 'set_night_mode', { enabled: !device.state.active });
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = () => {
    if (device.type === 'light') {
      return (
        <Lightbulb
          className={`w-5 h-5 ${
            device.state.power === 'on' ? 'text-amber-400 fill-amber-400/20' : 'text-slate-500'
          }`}
        />
      );
    }
    if (device.type === 'thermostat') {
      return <Thermometer className="w-5 h-5 text-sky-400" />;
    }
    if (device.type === 'lock') {
      return device.state.locked ? (
        <Lock className="w-5 h-5 text-emerald-400" />
      ) : (
        <Unlock className="w-5 h-5 text-rose-400" />
      );
    }
    return <Moon className={`w-5 h-5 ${device.state.active ? 'text-indigo-400' : 'text-slate-500'}`} />;
  };

  const displayTemp = (celsius: number) => {
    if (temperatureUnit === 'fahrenheit') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 ${
        !device.isOnline
          ? 'bg-[#0D1016]/50 border-rose-900/30 opacity-70'
          : 'bg-[#12161D] border-white/[0.08] hover:border-white/[0.15] shadow-lg'
      }`}
    >
      {/* Top Details */}
      <div className="flex items-start justify-between pb-3 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08]">{renderIcon()}</div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-100">{device.name}</h4>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-slate-400">
                {device.room}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {device.id}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-mono font-medium px-2 py-0.5 rounded-full ${
              device.isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {device.isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ONLINE
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-400" />
                OFFLINE
              </>
            )}
          </span>
          <span className="text-[9px] text-slate-500 font-mono">SIMULATED</span>
        </div>
      </div>

      {/* Device Interactive State & Controls */}
      <div className="space-y-3">
        {device.type === 'light' && (
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-mono text-[11px]">Power State:</span>
              <button
                disabled={loading || !device.isOnline}
                onClick={handleToggleLight}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono border transition-all cursor-pointer ${
                  device.state.power === 'on'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{device.state.power?.toUpperCase()}</span>
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Brightness</span>
                <span>{device.state.brightness ?? 100}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                disabled={loading || !device.isOnline || device.state.power === 'off'}
                value={device.state.brightness ?? 100}
                onChange={(e) => handleSetBrightness(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer disabled:opacity-30"
              />
            </div>
          </div>
        )}

        {device.type === 'thermostat' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-mono text-[11px]">Telemetry Setpoint:</span>
              <span className="text-base font-bold font-mono text-sky-400">
                {displayTemp(device.state.temperature ?? 24)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.05]">
              <span className="text-[11px] text-slate-400 font-mono">Set:</span>
              <div className="flex items-center gap-1">
                {[19, 21, 22, 24].map((temp) => (
                  <button
                    key={temp}
                    disabled={loading || !device.isOnline}
                    onClick={() => handleSetTemp(temp)}
                    className={`px-2 py-1 rounded-md text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      device.state.temperature === temp
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                        : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-slate-200'
                    }`}
                  >
                    {displayTemp(temp)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {device.type === 'lock' && (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-mono">Perimeter Deadbolt:</span>
              <div className="text-xs font-mono font-bold mt-0.5 text-slate-200">
                {device.state.locked ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SECURE (LOCKED)
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> UNSECURED
                  </span>
                )}
              </div>
            </div>
            <button
              disabled={loading || !device.isOnline}
              onClick={handleToggleLock}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all cursor-pointer ${
                device.state.locked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {device.state.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{device.state.locked ? 'DISENGAGE' : 'SECURE'}</span>
            </button>
          </div>
        )}

        {device.type === 'routine' && (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-mono">Whole-Home Routine:</span>
              <div className="text-xs font-mono font-bold mt-0.5 text-slate-200">
                {device.state.active ? 'ARMED / ACTIVE' : 'INACTIVE'}
              </div>
            </div>
            <button
              disabled={loading || !device.isOnline}
              onClick={handleToggleNightMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono border transition-all cursor-pointer ${
                device.state.active
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
                  : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{device.state.active ? 'DISABLE' : 'ARM ROUTINE'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Timestamp */}
      <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[9px] text-slate-500 font-mono">
        <span>Telemetric Corroboration</span>
        <span>{new Date(device.lastUpdated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
