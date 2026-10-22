/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DeviceState } from '../../types';
import {
  Lightbulb,
  Thermometer,
  Lock,
  Unlock,
  Moon,
  Power,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface HouseholdMapProps {
  devices: DeviceState[];
  onOperateDevice: (deviceId: string, toolName: string, args: Record<string, any>) => Promise<void>;
  temperatureUnit?: 'celsius' | 'fahrenheit';
  className?: string;
}

export const HouseholdMap: React.FC<HouseholdMapProps> = ({
  devices,
  onOperateDevice,
  temperatureUnit = 'celsius',
  className = '',
}) => {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceState | null>(null);

  const livingRoomLight = devices.find((d) => d.id === 'living_room_lights');
  const bedroomLight = devices.find((d) => d.id === 'bedroom_lights');
  const thermostat = devices.find((d) => d.id === 'bedroom_thermostat');
  const lock = devices.find((d) => d.id === 'front_door_lock');
  const nightMode = devices.find((d) => d.id === 'night_mode');

  const displayTemp = (celsius?: number) => {
    if (celsius === undefined) return '--';
    if (temperatureUnit === 'fahrenheit') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  return (
    <div className={`p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
              Spatial Household Blueprint
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Interactive physical simulator topology. Click device markers to inspect or trigger operations.
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          Zone: <span className="text-slate-200">{activeRoom || 'Whole House'}</span>
        </div>
      </div>

      {/* Stylized Vector Floor Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 relative min-h-[280px]">
        {/* ROOM 1: LIVING ROOM (5 cols) */}
        <div
          onMouseEnter={() => setActiveRoom('Living Room')}
          onMouseLeave={() => setActiveRoom(null)}
          className={`md:col-span-5 p-4 rounded-xl border transition-all duration-200 relative bg-[#12161D]/70 backdrop-blur-sm flex flex-col justify-between ${
            activeRoom === 'Living Room'
              ? 'border-sky-500/40 shadow-lg shadow-sky-500/5 ring-1 ring-sky-500/20'
              : 'border-white/[0.06] hover:border-white/[0.12]'
          }`}
        >
          {/* Room Label */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Living Room
            </span>
            <span className="text-[10px] font-mono text-slate-500">Zone A</span>
          </div>

          {/* Living Room Device Marker */}
          {livingRoomLight && (
            <div
              onClick={() => setSelectedDevice(livingRoomLight)}
              className="my-4 p-3 rounded-xl bg-slate-950/80 border border-white/[0.08] hover:border-sky-400/40 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    livingRoomLight.state.power === 'on'
                      ? 'bg-amber-400/20 text-amber-300 shadow-sm shadow-amber-400/30'
                      : 'bg-white/[0.04] text-slate-500'
                  }`}
                >
                  <Lightbulb className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
                    {livingRoomLight.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {livingRoomLight.state.power === 'on'
                      ? `Active (${livingRoomLight.state.brightness}%)`
                      : 'Powered Off'}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOperateDevice('living_room_lights', 'set_light_state', {
                    state: livingRoomLight.state.power === 'on' ? 'off' : 'on',
                  });
                }}
                className={`text-[10px] font-mono px-2 py-1 rounded-md border transition-colors ${
                  livingRoomLight.state.power === 'on'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-white/[0.04] text-slate-400 border-white/[0.06] hover:text-slate-200'
                }`}
              >
                TOGGLE
              </button>
            </div>
          )}

          {/* Architectural detail line */}
          <div className="text-[9px] font-mono text-slate-600 border-t border-white/[0.04] pt-2 flex justify-between">
            <span>22.4 m²</span>
            <span>Main Entrance Adjoining</span>
          </div>
        </div>

        {/* ROOM 2: BEDROOM & CLIMATE (4 cols) */}
        <div
          onMouseEnter={() => setActiveRoom('Bedroom Suite')}
          onMouseLeave={() => setActiveRoom(null)}
          className={`md:col-span-4 p-4 rounded-xl border transition-all duration-200 relative bg-[#12161D]/70 backdrop-blur-sm flex flex-col justify-between ${
            activeRoom === 'Bedroom Suite'
              ? 'border-sky-500/40 shadow-lg shadow-sky-500/5 ring-1 ring-sky-500/20'
              : 'border-white/[0.06] hover:border-white/[0.12]'
          }`}
        >
          {/* Room Label */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Bedroom Suite
            </span>
            <span className="text-[10px] font-mono text-slate-500">Zone B</span>
          </div>

          <div className="space-y-2 my-2">
            {/* Bedroom Lights */}
            {bedroomLight && (
              <div
                onClick={() => setSelectedDevice(bedroomLight)}
                className="p-2.5 rounded-lg bg-slate-950/80 border border-white/[0.08] hover:border-sky-400/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Lightbulb
                    className={`w-4 h-4 ${
                      bedroomLight.state.power === 'on' ? 'text-amber-400 fill-amber-400/20' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-200 group-hover:text-sky-300">
                      {bedroomLight.name}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      {bedroomLight.state.power?.toUpperCase()} • {bedroomLight.state.brightness}%
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOperateDevice('bedroom_lights', 'set_light_state', {
                      state: bedroomLight.state.power === 'on' ? 'off' : 'on',
                    });
                  }}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
                >
                  TOGGLE
                </button>
              </div>
            )}

            {/* Bedroom Thermostat */}
            {thermostat && (
              <div
                onClick={() => setSelectedDevice(thermostat)}
                className="p-2.5 rounded-lg bg-slate-950/80 border border-white/[0.08] hover:border-sky-400/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Thermometer className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-200 group-hover:text-sky-300">
                      {thermostat.name}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      Climate: <span className="text-sky-400 font-bold">{displayTemp(thermostat.state.temperature)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[20, 22, 24].map((t) => (
                    <button
                      key={t}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOperateDevice('bedroom_thermostat', 'set_thermostat_temperature', {
                          temperatureCelsius: t,
                        });
                      }}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                        thermostat.state.temperature === t
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-slate-200'
                      }`}
                    >
                      {t}°
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[9px] font-mono text-slate-600 border-t border-white/[0.04] pt-2 flex justify-between">
            <span>18.6 m²</span>
            <span>Sleep Sanctuary Mode</span>
          </div>
        </div>

        {/* ROOM 3: ENTRANCE PERIMETER (3 cols) */}
        <div
          onMouseEnter={() => setActiveRoom('Entrance Perimeter')}
          onMouseLeave={() => setActiveRoom(null)}
          className={`md:col-span-3 p-4 rounded-xl border transition-all duration-200 relative bg-[#12161D]/70 backdrop-blur-sm flex flex-col justify-between ${
            activeRoom === 'Entrance Perimeter'
              ? 'border-sky-500/40 shadow-lg shadow-sky-500/5 ring-1 ring-sky-500/20'
              : 'border-white/[0.06] hover:border-white/[0.12]'
          }`}
        >
          {/* Room Label */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Entryway
            </span>
            <span className="text-[10px] font-mono text-slate-500">Perimeter</span>
          </div>

          {/* Front Door Lock */}
          {lock && (
            <div
              onClick={() => setSelectedDevice(lock)}
              className="my-3 p-3 rounded-xl bg-slate-950/80 border border-white/[0.08] hover:border-sky-400/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-300">
                  {lock.name}
                </span>
                {lock.state.locked ? (
                  <Lock className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-rose-400" />
                )}
              </div>

              <div className="text-[10px] font-mono">
                {lock.state.locked ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> SECURE (LOCKED)
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> UNLOCKED (ENTRY OPEN)
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (lock.state.locked) {
                    if (
                      window.confirm(
                        'ActionGuard Safety Boundary: Are you sure you want to disengage front-door deadbolt?'
                      )
                    ) {
                      onOperateDevice('front_door_lock', 'unlock_door', {});
                    }
                  } else {
                    onOperateDevice('front_door_lock', 'lock_door', {});
                  }
                }}
                className={`w-full py-1 text-[10px] font-mono font-bold rounded border transition-colors ${
                  lock.state.locked
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                {lock.state.locked ? 'DISENGAGE (UNLOCK)' : 'SECURE (LOCK)'}
              </button>
            </div>
          )}

          {/* Night Mode Indicator */}
          {nightMode && (
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/[0.04] pt-2">
              <span className="flex items-center gap-1">
                <Moon className="w-3 h-3 text-indigo-400" /> Night Mode:
              </span>
              <span className={nightMode.state.active ? 'text-indigo-400 font-bold' : 'text-slate-500'}>
                {nightMode.state.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
