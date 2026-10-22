/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { MagneticButton } from '../common/MagneticButton';
import { api } from '../../api/client';
import {
  Layers,
  Sparkles,
  Cloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const [bedrockTesting, setBedrockTesting] = useState(false);
  const [bedrockResult, setBedrockResult] = useState<any>(null);

  const testBedrock = async () => {
    try {
      setBedrockTesting(true);
      const res = await api.testBedrock();
      setBedrockResult(res);
    } catch (err: any) {
      setBedrockResult({ success: false, message: err.message });
    } finally {
      setBedrockTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
            Ecosystem Connectivity
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-400" />
          <span>System Integrations & Architecture Adapters</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Inspect connection status across local simulators, Google Gemini AI, Amazon Bedrock, and Alexa+ / MCP extensions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Local Smart-Home Simulator */}
        <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              1. Local Smart-Home Simulator
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              STANDALONE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Operational (5 Virtual Actuators)
              </span>
              <span>ZERO DEPENDENCY</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              Maintains full stateful simulation for living room lights, bedroom lights, bedroom thermostat, front-door lock,
              and whole-home night mode routine controller. All tool execution mutates real state with durable JSON backing.
            </p>
            <div className="p-2 rounded-lg bg-[#12161D] font-mono text-[11px] text-slate-400 border border-white/[0.05]">
              Module: <span className="text-sky-300">server/simulator/deviceRegistry.ts</span>
            </div>
          </div>
        </div>

        {/* 2. Google Gemini Planning Service */}
        <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              2. Google Gemini Planning Service
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
              SERVER-SIDE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-[11px]">
              <span className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Server Integration Active
              </span>
              <span>GEMINI 3.8 FLASH</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              Provides structured reasoning for natural-language intent decomposition, generating strict JSON plans constrained
              exclusively to registered tools. Supported by robust deterministic fallback when offline.
            </p>
            <div className="p-2 rounded-lg bg-[#12161D] font-mono text-[11px] text-slate-400 border border-white/[0.05]">
              Module: <span className="text-sky-300">server/ai/planner.ts</span>
            </div>
          </div>
        </div>

        {/* 3. Amazon Bedrock (AWS Builder Challenge) */}
        <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              3. Amazon Bedrock (AWS Challenge)
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              OPTIONAL
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#12161D] border border-white/[0.08] text-slate-300">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-amber-400" />
                <span className="font-medium text-[11px]">AWS Status: Server-Side Adapter Ready</span>
              </div>
              <MagneticButton
                variant="primary"
                size="sm"
                onClick={testBedrock}
                disabled={bedrockTesting}
              >
                <RefreshCw className={`w-3 h-3 ${bedrockTesting ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </MagneticButton>
            </div>

            <p className="text-slate-300 leading-relaxed font-sans">
              ActionGuard AI includes a dedicated Amazon Bedrock adapter. When server environment contains{' '}
              <code className="text-sky-300 bg-black/60 px-1 py-0.5 rounded font-mono text-[11px]">AWS_ACCESS_KEY_ID</code> and{' '}
              <code className="text-sky-300 bg-black/60 px-1 py-0.5 rounded font-mono text-[11px]">AWS_SECRET_ACCESS_KEY</code>, Bedrock can be
              selected as the active planner. If unconfigured, the application gracefully reports "AWS NOT CONFIGURED" without
              disrupting demo operation.
            </p>

            {bedrockResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  bedrockResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="font-semibold mb-1">{bedrockResult.message}</div>
                {bedrockResult.details && (
                  <pre className="mt-1 p-2 bg-black/60 rounded text-[10px] text-slate-300 font-mono overflow-x-auto">
                    {JSON.stringify(bedrockResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}

            <div className="p-2 rounded-lg bg-[#12161D] font-mono text-[11px] text-slate-400 border border-white/[0.05]">
              Module: <span className="text-sky-300">server/ai/bedrockAdapter.ts</span>
            </div>
          </div>
        </div>

        {/* 4. Alexa+ / Model Context Protocol (MCP) Extension */}
        <div className="p-5 rounded-2xl bg-[#0D1016] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              4. Alexa+ / MCP Architecture Layer
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              STREAMABLE HTTP
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[11px]">
              <span className="font-semibold flex items-center gap-1.5">
                <Terminal className="w-4 h-4" /> MCP Ready Architecture
              </span>
              <span>SPEC 2025-11-25</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              Designed around clean decoupling of Tool Definitions, Parameter Validation, and Authorization Policies. The
              same 12 tool schemas exposed by ActionGuard can be bound directly to a Model Context Protocol server for
              Alexa+ and multimodal AI agent consumption.
            </p>
            <div className="p-2 rounded-lg bg-[#12161D] font-mono text-[11px] text-slate-400 border border-white/[0.05]">
              Module: <span className="text-sky-300">server/tools/toolRegistry.ts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
