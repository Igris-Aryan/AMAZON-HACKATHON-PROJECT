/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { DeviceRegistry } from '../simulator/deviceRegistry';
import { db } from '../storage/database';
import { IndependentVerificationEngine } from '../verification/verifier';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (args: any) => Promise<any>;
}

export const toolsMap: Record<string, ToolDefinition> = {
  get_device_state: {
    name: 'get_device_state',
    description: 'Reads the real-time telemetry and configuration state of a specified smart-home device.',
    parameters: z.object({
      deviceId: z.string().min(1, 'deviceId is required'),
    }),
    execute: async ({ deviceId }) => {
      const device = DeviceRegistry.getDevice(deviceId);
      return {
        deviceId: device.id,
        name: device.name,
        type: device.type,
        isOnline: device.isOnline,
        state: device.state,
        lastUpdated: device.lastUpdated,
      };
    },
  },

  list_devices: {
    name: 'list_devices',
    description: 'Enumerates all smart-home devices currently registered in the home automation system.',
    parameters: z.object({}),
    execute: async () => {
      const devices = DeviceRegistry.getAllDevices();
      return {
        devices,
        total: devices.length,
        timestamp: new Date().toISOString(),
      };
    },
  },

  set_light_state: {
    name: 'set_light_state',
    description: 'Turns a designated smart light fixture ON or OFF.',
    parameters: z.object({
      deviceId: z.string().min(1),
      state: z.enum(['on', 'off']),
    }),
    execute: async ({ deviceId, state }) => {
      const updated = DeviceRegistry.setLightState(deviceId, state);
      return {
        success: true,
        deviceId: updated.id,
        newState: updated.state,
        timestamp: new Date().toISOString(),
      };
    },
  },

  set_light_brightness: {
    name: 'set_light_brightness',
    description: 'Adjusts the brightness level of a designated dimmable light (0-100%).',
    parameters: z.object({
      deviceId: z.string().min(1),
      brightness: z.number().int().min(0).max(100),
    }),
    execute: async ({ deviceId, brightness }) => {
      const updated = DeviceRegistry.setLightBrightness(deviceId, brightness);
      return {
        success: true,
        deviceId: updated.id,
        newState: updated.state,
        timestamp: new Date().toISOString(),
      };
    },
  },

  set_thermostat_temperature: {
    name: 'set_thermostat_temperature',
    description: 'Sets the target heating/cooling setpoint on a smart thermostat in degrees Celsius (16-30°C).',
    parameters: z.object({
      deviceId: z.string().min(1),
      temperatureCelsius: z.number().min(16).max(30),
    }),
    execute: async ({ deviceId, temperatureCelsius }) => {
      const updated = DeviceRegistry.setThermostatTemperature(deviceId, temperatureCelsius);
      return {
        success: true,
        deviceId: updated.id,
        temperature: updated.state.temperature,
        timestamp: new Date().toISOString(),
      };
    },
  },

  lock_door: {
    name: 'lock_door',
    description: 'Engages the deadbolt on a smart door lock to secure the entryway.',
    parameters: z.object({
      deviceId: z.string().min(1),
    }),
    execute: async ({ deviceId }) => {
      const updated = DeviceRegistry.setLockState(deviceId, true);
      return {
        success: true,
        deviceId: updated.id,
        locked: true,
        timestamp: new Date().toISOString(),
      };
    },
  },

  unlock_door: {
    name: 'unlock_door',
    description: 'Disengages the deadbolt on a smart door lock. Consequential action requiring explicit approval.',
    parameters: z.object({
      deviceId: z.string().min(1),
    }),
    execute: async ({ deviceId }) => {
      const updated = DeviceRegistry.setLockState(deviceId, false);
      return {
        success: true,
        deviceId: updated.id,
        locked: false,
        timestamp: new Date().toISOString(),
      };
    },
  },

  set_night_mode: {
    name: 'set_night_mode',
    description: 'Enables or disables whole-home Night Mode security routine.',
    parameters: z.object({
      enabled: z.boolean(),
    }),
    execute: async ({ enabled }) => {
      const updated = DeviceRegistry.setNightMode(enabled);
      return {
        success: true,
        deviceId: updated.id,
        active: updated.state.active,
        timestamp: new Date().toISOString(),
      };
    },
  },

  get_execution_status: {
    name: 'get_execution_status',
    description: 'Fetches the current lifecycle phase and action progress for an active or past command.',
    parameters: z.object({
      commandId: z.string().min(1),
    }),
    execute: async ({ commandId }) => {
      const execution = db.getExecution(commandId);
      if (!execution) {
        throw new Error(`Execution record not found for commandId: ${commandId}`);
      }
      return {
        commandId: execution.id,
        phase: execution.phase,
        plan: execution.plan,
        finalReport: execution.finalReport,
      };
    },
  },

  get_execution_history: {
    name: 'get_execution_history',
    description: 'Returns filtered execution audit records and verification history.',
    parameters: z.object({
      outcome: z.string().optional(),
      limit: z.number().optional().default(20),
    }),
    execute: async ({ outcome, limit }) => {
      let records = db.getHistory();
      if (outcome && outcome !== 'all') {
        records = records.filter(
          (r) => r.finalReport?.overallOutcome?.toLowerCase().includes(outcome.toLowerCase())
        );
      }
      return {
        records: records.slice(0, limit),
        total: records.length,
      };
    },
  },

  verify_device_state: {
    name: 'verify_device_state',
    description: 'Performs an independent verification read to test if a device state matches an expected value.',
    parameters: z.object({
      deviceId: z.string().min(1),
      property: z.string().min(1),
      expectedValue: z.any(),
    }),
    execute: async ({ deviceId, property, expectedValue }) => {
      return await IndependentVerificationEngine.verifyAction(deviceId, {
        property,
        expectedValue,
      });
    },
  },

  get_simulator_health: {
    name: 'get_simulator_health',
    description: 'Reports simulator runtime status, active failure injections, and persistence health.',
    parameters: z.object({}),
    execute: async () => {
      const failures = db.getFailures();
      const devices = DeviceRegistry.getAllDevices();
      const onlineCount = devices.filter((d) => d.isOnline).length;
      return {
        status: 'healthy',
        environment: 'SIMULATOR_DEMO',
        activeFailures: failures,
        deviceCount: devices.length,
        devicesOnline: onlineCount,
        allOnline: onlineCount === devices.length,
        timestamp: new Date().toISOString(),
      };
    },
  },
};

export class ToolRegistry {
  public static getToolList(): Array<{ name: string; description: string }> {
    return Object.values(toolsMap).map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }

  public static isToolRegistered(toolName: string): boolean {
    return Boolean(toolsMap[toolName]);
  }

  public static async executeTool(toolName: string, rawArgs: any): Promise<any> {
    const tool = toolsMap[toolName];
    if (!tool) {
      throw new Error(`Tool Execution Rejected: '${toolName}' is not registered in the ActionGuard tool registry.`);
    }

    // Delayed operation simulation if configured
    const failures = db.getFailures();
    if (failures.delayedOperationMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, failures.delayedOperationMs));
    }

    // Validate parameters
    const validatedArgs = tool.parameters.parse(rawArgs);
    return await tool.execute(validatedArgs);
  }
}
