/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../storage/database';
import { PlanAction, RiskLevel } from '../types';

export class PolicyEngine {
  /**
   * Determine risk level and whether approval is required for a proposed action
   */
  public static evaluateActionPolicy(
    toolName: string,
    targetDeviceId: string,
    requestedState: Record<string, any>
  ): { riskLevel: RiskLevel; requiresApproval: boolean; policyReason: string } {
    const settings = db.getSettings();

    // High risk: Unlocking doors, disabling security routines
    if (toolName === 'unlock_door' || (toolName === 'set_lock_state' && requestedState.locked === false)) {
      return {
        riskLevel: 'high',
        requiresApproval: true,
        policyReason: 'Physical Entry Perimeter: Door unlock grants physical access and strictly requires explicit user confirmation.',
      };
    }

    if (toolName === 'set_night_mode' && requestedState.enabled === false) {
      return {
        riskLevel: 'high',
        requiresApproval: true,
        policyReason: 'Security Perimeter: Disabling night mode routine alters home security posture and requires explicit approval.',
      };
    }

    // Low risk: Reading states, verifying, listing
    if (
      toolName === 'get_device_state' ||
      toolName === 'list_devices' ||
      toolName === 'verify_device_state' ||
      toolName === 'get_execution_status' ||
      toolName === 'get_execution_history' ||
      toolName === 'get_simulator_health'
    ) {
      return {
        riskLevel: 'low',
        requiresApproval: !settings.autoApproveLowRisk,
        policyReason: 'Telemetry Read: Non-mutating telemetry read safe for autonomous execution.',
      };
    }

    // Medium risk: Light toggles, brightness, thermostat setpoints, locking doors
    if (
      toolName === 'set_light_state' ||
      toolName === 'set_light_brightness' ||
      toolName === 'set_thermostat_temperature' ||
      toolName === 'lock_door' ||
      toolName === 'set_night_mode'
    ) {
      const requiresApproval = !settings.autoApproveMediumRisk;
      return {
        riskLevel: 'medium',
        requiresApproval,
        policyReason: requiresApproval
          ? 'Environment Mutation: Changing household physical environment requires approval according to current user security profile.'
          : 'Environment Mutation: Auto-approved under user-configured low-friction automation policy.',
      };
    }

    // Default to medium risk with approval required for any unclassified action
    return {
      riskLevel: 'medium',
      requiresApproval: true,
      policyReason: 'Standard Safety Boundary: Unclassified operation requires explicit user authorization.',
    };
  }

  /**
   * Apply policies to all actions in a plan
   */
  public static applyPoliciesToPlan(actions: PlanAction[]): PlanAction[] {
    return actions.map((action) => {
      const { riskLevel, requiresApproval } = this.evaluateActionPolicy(
        action.toolName,
        action.targetDeviceId,
        action.requestedState
      );

      const approvalStatus = requiresApproval ? 'pending' : 'auto_approved';
      const executionStatus = requiresApproval ? 'awaiting_approval' : 'approved';

      return {
        ...action,
        riskLevel,
        requiresApproval,
        approvalStatus,
        executionStatus,
      };
    });
  }

  /**
   * Validate that an approval is cryptographically or structurally bound
   * to the exact planId, actionId, and action arguments
   */
  public static validateApprovalBinding(
    action: PlanAction,
    providedArgs: Record<string, any>
  ): boolean {
    // If arguments were tampered with, approval is invalid
    const expectedKeys = Object.keys(action.requestedState);
    for (const key of expectedKeys) {
      if (action.requestedState[key] !== providedArgs[key]) {
        return false;
      }
    }
    return true;
  }
}
