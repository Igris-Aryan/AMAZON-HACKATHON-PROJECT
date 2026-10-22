/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommandExecutionRecord,
  DeviceState,
  FailureInjectionConfig,
  UserSettings,
} from '../types';

const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.error) errMsg = body.error;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Health
  getHealth: () => request<any>('/health'),

  // Devices
  getDevices: () => request<{ devices: DeviceState[]; total: number }>('/devices'),
  getDevice: (deviceId: string) => request<{ device: DeviceState }>(`/devices/${deviceId}`),
  operateDevice: (deviceId: string, toolName: string, args: Record<string, any>) =>
    request<{ success: boolean; result: any; device: DeviceState }>(`/devices/${deviceId}/operate`, {
      method: 'POST',
      body: JSON.stringify({ toolName, args }),
    }),

  // Commands
  planCommand: (command: string, scenarioId?: string, idempotencyKey?: string) =>
    request<CommandExecutionRecord>('/commands/plan', {
      method: 'POST',
      body: JSON.stringify({ command, scenarioId, idempotencyKey }),
    }),

  approveCommand: (commandId: string, actionId?: string) =>
    request<CommandExecutionRecord>(`/commands/${commandId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ actionId }),
    }),

  rejectCommand: (commandId: string, actionId: string, reason?: string) =>
    request<CommandExecutionRecord>(`/commands/${commandId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ actionId, reason }),
    }),

  executeCommand: (commandId: string) =>
    request<CommandExecutionRecord>(`/commands/${commandId}/execute`, {
      method: 'POST',
    }),

  retryAction: (commandId: string, actionId: string) =>
    request<CommandExecutionRecord>(`/commands/${commandId}/retry`, {
      method: 'POST',
      body: JSON.stringify({ actionId }),
    }),

  getCommand: (commandId: string) =>
    request<CommandExecutionRecord>(`/commands/${commandId}`),

  getCommandEvents: (commandId: string) =>
    request<{ events: any[] }>(`/commands/${commandId}/events`),

  // History
  getHistory: (outcome?: string, limit = 50) => {
    const q = new URLSearchParams();
    if (outcome) q.set('outcome', outcome);
    q.set('limit', limit.toString());
    return request<{ records: CommandExecutionRecord[]; total: number }>(`/history?${q.toString()}`);
  },

  getHistoryDetail: (executionId: string) =>
    request<CommandExecutionRecord>(`/history/${executionId}`),

  // Verification & Reconcile
  reconcileVerification: () =>
    request<{ reconciledAt: string; results: any[] }>('/verification/reconcile', {
      method: 'POST',
    }),

  // Simulator & Failures
  getFailures: () => request<FailureInjectionConfig>('/simulator/failures'),
  updateFailures: (failures: Partial<FailureInjectionConfig>) =>
    request<{ success: boolean; failures: FailureInjectionConfig }>('/simulator/failures', {
      method: 'POST',
      body: JSON.stringify(failures),
    }),
  resetSimulator: () =>
    request<{ success: boolean; message: string; devices: DeviceState[]; failures: FailureInjectionConfig }>(
      '/simulator/reset',
      { method: 'POST' }
    ),

  // Integrations & Bedrock
  getIntegrations: () => request<any>('/integrations'),
  testBedrock: () => request<{ success: boolean; message: string; details: any }>('/integrations/bedrock/test', {
    method: 'POST',
  }),

  // Settings
  getSettings: () => request<UserSettings>('/settings'),
  updateSettings: (settings: Partial<UserSettings>) =>
    request<{ success: boolean; settings: UserSettings }>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
};
