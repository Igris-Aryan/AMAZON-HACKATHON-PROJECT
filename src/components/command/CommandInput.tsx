/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Terminal, CornerDownLeft } from 'lucide-react';
import { MagneticButton } from '../common/MagneticButton';

interface CommandInputProps {
  onSubmit: (command: string) => Promise<void>;
  isLoading: boolean;
  initialValue?: string;
  onSelectScenarioPreset?: (scenarioId: string, command: string) => void;
}

export const CommandInput: React.FC<CommandInputProps> = ({
  onSubmit,
  isLoading,
  initialValue = '',
  onSelectScenarioPreset,
}) => {
  const [command, setCommand] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      id: 'good_night',
      label: 'Prepare house for sleep',
      cmd: 'Prepare my house for sleep. Turn off the living room lights, set the bedroom temperature to 22 degrees, and check whether the front door is locked.',
    },
    {
      id: 'failure_recovery',
      label: 'Set bedroom temp to 22°C',
      cmd: 'Set the bedroom temperature to 22 degrees.',
    },
    {
      id: 'safety_boundary',
      label: 'Unlock front door & night mode',
      cmd: 'Unlock the front door and turn on night mode.',
    },
    {
      id: 'contradictory',
      label: 'Lights off except bedroom',
      cmd: 'Turn off all the lights, but keep the bedroom lights on.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) {
      setError('Please enter a natural language command.');
      return;
    }
    setError(null);
    try {
      await onSubmit(command.trim());
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectPreset = (p: (typeof presets)[0]) => {
    setCommand(p.cmd);
    setError(null);
    if (onSelectScenarioPreset) {
      onSelectScenarioPreset(p.id, p.cmd);
    }
  };

  return (
    <div className="bg-[#0D1016] border border-white/[0.08] rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
      {/* Precision grid highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono uppercase tracking-wider text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>Autonomous Command Composer</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-400">
              Enter ↵
            </kbd>
            <span>to generate plan</span>
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={2}
            value={command}
            onChange={(e) => {
              setCommand(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Instruct ActionGuard AI... (e.g. Prepare my house for sleep, check locks, set climate)"
            className="w-full bg-[#12161D] border border-white/[0.1] rounded-xl px-4 py-3.5 text-slate-100 placeholder:text-slate-500 text-sm focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20 focus:outline-none transition-all resize-none font-medium leading-relaxed shadow-inner"
          />

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {command.trim() && (
              <button
                type="button"
                onClick={() => setCommand('')}
                className="text-[11px] font-mono text-slate-500 hover:text-slate-300 px-2 py-1 transition-colors"
              >
                Clear
              </button>
            )}
            <MagneticButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoading || !command.trim()}
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Planning...
                </span>
              ) : (
                <>
                  <span>Formulate Plan</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </>
              )}
            </MagneticButton>
          </div>
        </div>

        {error && (
          <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 px-3 py-2 rounded-lg font-mono">
            {error}
          </div>
        )}

        {/* Quick Scenario Preset Chips */}
        <div className="pt-1 flex items-center flex-wrap gap-2 text-xs">
          <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-sky-400" /> Quick Presets:
          </span>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};
