/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { DeviceRegistry } from '../simulator/deviceRegistry';
import { PolicyEngine } from '../policy/policyEngine';
import { StructuredPlan, PlanAction } from '../types';
import { toolsMap } from '../tools/toolRegistry';

export class AIPlanner {
  private static getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  /**
   * Plans actions for a natural-language command using Gemini or Deterministic Fallback
   */
  public static async generatePlan(commandId: string, command: string): Promise<StructuredPlan> {
    const ai = this.getGeminiClient();
    const currentDevices = DeviceRegistry.getAllDevices();

    if (ai) {
      try {
        const plan = await this.generateWithGemini(ai, commandId, command, currentDevices);
        return plan;
      } catch (err) {
        console.warn('[AIPlanner] Gemini planning failed or timed out. Using deterministic fallback:', err);
      }
    }

    return this.generateDeterministicPlan(commandId, command, currentDevices);
  }

  private static async generateWithGemini(
    ai: GoogleGenAI,
    commandId: string,
    command: string,
    devices: any[]
  ): Promise<StructuredPlan> {
    const systemInstruction = `You are ActionGuard AI's core orchestrator.
Your goal is to parse natural-language commands for a smart home and produce a rigorous, structured action plan.
Guiding principle: "Never claim an action succeeded merely because the AI intended it to succeed."

Registered Tools:
- set_light_state(deviceId: string, state: 'on' | 'off')
- set_light_brightness(deviceId: string, brightness: number 0-100)
- set_thermostat_temperature(deviceId: string, temperatureCelsius: number 16-30)
- lock_door(deviceId: string)
- unlock_door(deviceId: string) [HIGH RISK]
- set_night_mode(enabled: boolean)
- get_device_state(deviceId: string)

Registered Devices:
${JSON.stringify(
  devices.map((d) => ({ id: d.id, name: d.name, type: d.type, state: d.state })),
  null,
  2
)}

Rules:
1. ONLY reference existing device IDs.
2. ONLY use registered tools.
3. If the user explicitly asks an exception (e.g., "keep bedroom lights on"), strictly respect it!
4. Formulate an expectedPostcondition for each action (property and expectedValue).
5. Unlocking doors is HIGH RISK.
6. Return valid JSON adhering to the specified schema.`;

    const prompt = `User Command: "${command}"
Generate a structured action plan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            humanReadableSummary: { type: Type.STRING },
            assumptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            clarificationQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  actionId: { type: Type.STRING },
                  toolName: { type: Type.STRING },
                  targetDeviceId: { type: Type.STRING },
                  description: { type: Type.STRING },
                  requestedState: {
                    type: Type.OBJECT,
                    description: 'Key-value map of requested arguments',
                  },
                  expectedPostcondition: {
                    type: Type.OBJECT,
                    properties: {
                      property: { type: Type.STRING },
                      expectedValue: { type: Type.STRING },
                    },
                    required: ['property', 'expectedValue'],
                  },
                },
                required: [
                  'actionId',
                  'toolName',
                  'targetDeviceId',
                  'description',
                  'requestedState',
                  'expectedPostcondition',
                ],
              },
            },
          },
          required: ['humanReadableSummary', 'actions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    // Validate tools and devices
    const actions: PlanAction[] = (parsed.actions || []).map((rawAction: any, index: number) => {
      const toolName = rawAction.toolName;
      const targetDeviceId = rawAction.targetDeviceId;

      if (!toolsMap[toolName]) {
        throw new Error(`Plan contains unknown tool: ${toolName}`);
      }
      if (!devices.some((d) => d.id === targetDeviceId)) {
        throw new Error(`Plan targets nonexistent device: ${targetDeviceId}`);
      }

      // Convert expectedValue if number or boolean
      let expVal = rawAction.expectedPostcondition.expectedValue;
      if (expVal === 'true') expVal = true;
      if (expVal === 'false') expVal = false;
      if (!isNaN(Number(expVal)) && typeof expVal === 'string' && expVal.trim() !== '') {
        expVal = Number(expVal);
      }

      return {
        actionId: rawAction.actionId || `act-${index + 1}`,
        toolName,
        targetDeviceId,
        description: rawAction.description,
        requestedState: rawAction.requestedState || {},
        riskLevel: 'medium',
        requiresApproval: false,
        approvalStatus: 'pending',
        dependencies: [],
        expectedPostcondition: {
          property: rawAction.expectedPostcondition.property,
          expectedValue: expVal,
        },
        executionStatus: 'proposed',
        verificationStatus: 'not_checked',
      };
    });

    const policedActions = PolicyEngine.applyPoliciesToPlan(actions);
    const hasPendingApprovals = policedActions.some((a) => a.approvalStatus === 'pending');

    return {
      planId: `plan-${Date.now()}`,
      commandId,
      originalCommand: command,
      humanReadableSummary: parsed.humanReadableSummary || 'Proposed household automation sequence.',
      assumptions: parsed.assumptions || ['Assumes standard home sleep routine preferences.'],
      clarificationQuestions: parsed.clarificationQuestions || [],
      actions: policedActions,
      createdAt: new Date().toISOString(),
      planStatus: hasPendingApprovals ? 'pending_approval' : 'draft',
      plannerType: 'gemini',
    };
  }

  /**
   * Deterministic fallback planner supporting all benchmark scenarios
   * and generic natural-language commands when offline.
   */
  public static generateDeterministicPlan(
    commandId: string,
    command: string,
    devices: any[]
  ): StructuredPlan {
    const lower = command.toLowerCase();
    const actions: PlanAction[] = [];
    const assumptions: string[] = ['Generated via deterministic safety planner.'];
    let summary = 'Execution plan based on semantic parsing of command.';

    // SCENARIO 5 / Contradictory check: "keep the bedroom lights on" or "turn off all lights but..."
    const keepBedroomLightsOn = lower.includes('keep the bedroom lights on') || lower.includes("don't turn off bedroom");

    // SCENARIO 1: Good Night
    if (lower.includes('prepare my house for sleep') || lower.includes('good night') || lower.includes('sleep mode')) {
      summary = 'Sleep routine: Turn off living room lights, adjust bedroom temperature to 22°C, and verify front-door lock perimeter.';
      assumptions.push('Preserves bedroom lighting if occupant is currently in bedroom.');

      actions.push({
        actionId: 'act-1',
        toolName: 'set_light_state',
        targetDeviceId: 'living_room_lights',
        description: 'Turn off living room lights for nighttime energy conservation.',
        requestedState: { deviceId: 'living_room_lights', state: 'off' },
        riskLevel: 'medium',
        requiresApproval: false,
        approvalStatus: 'pending',
        dependencies: [],
        expectedPostcondition: { property: 'power', expectedValue: 'off' },
        executionStatus: 'proposed',
        verificationStatus: 'not_checked',
      });

      actions.push({
        actionId: 'act-2',
        toolName: 'set_thermostat_temperature',
        targetDeviceId: 'bedroom_thermostat',
        description: 'Set bedroom thermostat to optimal sleep temperature (22°C).',
        requestedState: { deviceId: 'bedroom_thermostat', temperatureCelsius: 22 },
        riskLevel: 'medium',
        requiresApproval: false,
        approvalStatus: 'pending',
        dependencies: [],
        expectedPostcondition: { property: 'temperature', expectedValue: 22 },
        executionStatus: 'proposed',
        verificationStatus: 'not_checked',
      });

      actions.push({
        actionId: 'act-3',
        toolName: 'get_device_state',
        targetDeviceId: 'front_door_lock',
        description: 'Audit front-door lock status for nighttime perimeter security.',
        requestedState: { deviceId: 'front_door_lock' },
        riskLevel: 'low',
        requiresApproval: false,
        approvalStatus: 'auto_approved',
        dependencies: [],
        expectedPostcondition: { property: 'locked', expectedValue: true },
        executionStatus: 'proposed',
        verificationStatus: 'not_checked',
      });
    } else if (lower.includes('unlock') && lower.includes('front door')) {
      // SCENARIO 4: Safety Boundary
      summary = 'Security sensitive: Disengage front door deadbolt.';
      actions.push({
        actionId: 'act-1',
        toolName: 'unlock_door',
        targetDeviceId: 'front_door_lock',
        description: 'Disengage deadbolt on front entrance door (Perimeter Security Boundary).',
        requestedState: { deviceId: 'front_door_lock' },
        riskLevel: 'high',
        requiresApproval: true,
        approvalStatus: 'pending',
        dependencies: [],
        expectedPostcondition: { property: 'locked', expectedValue: false },
        executionStatus: 'proposed',
        verificationStatus: 'not_checked',
      });

      if (lower.includes('night mode')) {
        actions.push({
          actionId: 'act-2',
          toolName: 'set_night_mode',
          targetDeviceId: 'night_mode',
          description: 'Enable night mode routine controller.',
          requestedState: { enabled: true },
          riskLevel: 'medium',
          requiresApproval: false,
          approvalStatus: 'pending',
          dependencies: [],
          expectedPostcondition: { property: 'active', expectedValue: true },
          executionStatus: 'proposed',
          verificationStatus: 'not_checked',
        });
      }
    } else if (lower.includes('lock') && lower.includes('front door')) {
      summary = 'Perimeter security: Lock front entrance door deadbolt.';
      actions.push({
        actionId: 'act-1',
        toolName: 'lock_door',
        targetDeviceId: 'front_door_lock',
        description: 'Engage front entrance door lock.',
        requestedState: { deviceId: 'front_door_lock' },
        riskLevel: 'medium',
        requiresApproval: false,
        approvalStatus: 'pending',
        dependencies: [],
        expectedPostcondition: { property: 'locked', expectedValue: true },
        executionStatus: 'proposed',
        verificationStatus: 'not_checked',
      });
    } else {
      // General light/temperature/device commands
      let actionIdx = 1;

      // Thermostat command check
      const tempMatch = lower.match(/(?:temperature|thermostat|temp|degrees).*?(\d+)/i) ||
                        lower.match(/(\d+)\s*(?:degrees|celsius|°c)/i);
      if (tempMatch && (lower.includes('thermostat') || lower.includes('temperature') || lower.includes('bedroom'))) {
        const tempVal = parseInt(tempMatch[1], 10);
        const validTemp = Math.min(30, Math.max(16, isNaN(tempVal) ? 22 : tempVal));
        actions.push({
          actionId: `act-${actionIdx++}`,
          toolName: 'set_thermostat_temperature',
          targetDeviceId: 'bedroom_thermostat',
          description: `Set bedroom thermostat temperature to ${validTemp}°C.`,
          requestedState: { deviceId: 'bedroom_thermostat', temperatureCelsius: validTemp },
          riskLevel: 'medium',
          requiresApproval: false,
          approvalStatus: 'pending',
          dependencies: [],
          expectedPostcondition: { property: 'temperature', expectedValue: validTemp },
          executionStatus: 'proposed',
          verificationStatus: 'not_checked',
        });
      }

      // Lights check
      if (lower.includes('turn off') || lower.includes('lights off')) {
        if (lower.includes('living room') || lower.includes('all lights') || lower.includes('lights')) {
          actions.push({
            actionId: `act-${actionIdx++}`,
            toolName: 'set_light_state',
            targetDeviceId: 'living_room_lights',
            description: 'Turn off living room lighting.',
            requestedState: { deviceId: 'living_room_lights', state: 'off' },
            riskLevel: 'medium',
            requiresApproval: false,
            approvalStatus: 'pending',
            dependencies: [],
            expectedPostcondition: { property: 'power', expectedValue: 'off' },
            executionStatus: 'proposed',
            verificationStatus: 'not_checked',
          });
        }

        if ((lower.includes('bedroom') || lower.includes('all lights')) && !keepBedroomLightsOn) {
          actions.push({
            actionId: `act-${actionIdx++}`,
            toolName: 'set_light_state',
            targetDeviceId: 'bedroom_lights',
            description: 'Turn off bedroom lighting.',
            requestedState: { deviceId: 'bedroom_lights', state: 'off' },
            riskLevel: 'medium',
            requiresApproval: false,
            approvalStatus: 'pending',
            dependencies: [],
            expectedPostcondition: { property: 'power', expectedValue: 'off' },
            executionStatus: 'proposed',
            verificationStatus: 'not_checked',
          });
        }
      } else if (lower.includes('turn on') || lower.includes('lights on')) {
        if (lower.includes('living room') || lower.includes('all lights')) {
          actions.push({
            actionId: `act-${actionIdx++}`,
            toolName: 'set_light_state',
            targetDeviceId: 'living_room_lights',
            description: 'Turn on living room lighting.',
            requestedState: { deviceId: 'living_room_lights', state: 'on' },
            riskLevel: 'medium',
            requiresApproval: false,
            approvalStatus: 'pending',
            dependencies: [],
            expectedPostcondition: { property: 'power', expectedValue: 'on' },
            executionStatus: 'proposed',
            verificationStatus: 'not_checked',
          });
        }
        if (lower.includes('bedroom') || lower.includes('all lights')) {
          actions.push({
            actionId: `act-${actionIdx++}`,
            toolName: 'set_light_state',
            targetDeviceId: 'bedroom_lights',
            description: 'Turn on bedroom lighting.',
            requestedState: { deviceId: 'bedroom_lights', state: 'on' },
            riskLevel: 'medium',
            requiresApproval: false,
            approvalStatus: 'pending',
            dependencies: [],
            expectedPostcondition: { property: 'power', expectedValue: 'on' },
            executionStatus: 'proposed',
            verificationStatus: 'not_checked',
          });
        }
      }

      // Door lock check
      if (lower.includes('check') && (lower.includes('door') || lower.includes('lock'))) {
        actions.push({
          actionId: `act-${actionIdx++}`,
          toolName: 'get_device_state',
          targetDeviceId: 'front_door_lock',
          description: 'Audit front-door lock state.',
          requestedState: { deviceId: 'front_door_lock' },
          riskLevel: 'low',
          requiresApproval: false,
          approvalStatus: 'auto_approved',
          dependencies: [],
          expectedPostcondition: { property: 'locked', expectedValue: true },
          executionStatus: 'proposed',
          verificationStatus: 'not_checked',
        });
      }

      // Default fallback if no specific rule matched
      if (actions.length === 0) {
        summary = `Audit and reconcile smart home status for command: "${command}".`;
        actions.push({
          actionId: 'act-1',
          toolName: 'list_devices',
          targetDeviceId: 'night_mode',
          description: 'Enumerate devices to inspect current household configuration.',
          requestedState: {},
          riskLevel: 'low',
          requiresApproval: false,
          approvalStatus: 'auto_approved',
          dependencies: [],
          expectedPostcondition: { property: 'isOnline', expectedValue: true },
          executionStatus: 'proposed',
          verificationStatus: 'not_checked',
        });
      }
    }

    const policedActions = PolicyEngine.applyPoliciesToPlan(actions);
    const hasPendingApprovals = policedActions.some((a) => a.approvalStatus === 'pending');

    return {
      planId: `plan-${Date.now()}`,
      commandId,
      originalCommand: command,
      humanReadableSummary: summary,
      assumptions,
      clarificationQuestions: [],
      actions: policedActions,
      createdAt: new Date().toISOString(),
      planStatus: hasPendingApprovals ? 'pending_approval' : 'draft',
      plannerType: 'deterministic_fallback',
    };
  }
}
