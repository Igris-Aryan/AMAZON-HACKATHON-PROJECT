/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../server/storage/database';
import { DeviceRegistry } from '../server/simulator/deviceRegistry';
import { ToolRegistry } from '../server/tools/toolRegistry';
import { IndependentVerificationEngine } from '../server/verification/verifier';
import { PolicyEngine } from '../server/policy/policyEngine';
import { AIPlanner } from '../server/ai/planner';
import { OrchestratorStateMachine } from '../server/orchestrator/stateMachine';
import { PlanAction } from '../server/types';

describe('ActionGuard AI Unit & Integration Tests', () => {
  beforeEach(() => {
    db.resetDemo();
    db.updateSettings({ preferredPlanner: 'deterministic' });
  });

  describe('1. Device Simulator & Validations', () => {
    it('initializes 5 simulated devices with correct initial states', () => {
      const devices = DeviceRegistry.getAllDevices();
      expect(devices.length).toBe(5);

      const livingRoom = DeviceRegistry.getDevice('living_room_lights');
      expect(livingRoom.state.power).toBe('on');

      const thermostat = DeviceRegistry.getDevice('bedroom_thermostat');
      expect(thermostat.state.temperature).toBe(24);

      const door = DeviceRegistry.getDevice('front_door_lock');
      expect(door.state.locked).toBe(false);
    });

    it('rejects invalid thermostat temperature outside 16-30°C', () => {
      expect(() => {
        DeviceRegistry.setThermostatTemperature('bedroom_thermostat', 14);
      }).toThrow(/Invalid temperature 14°C/);

      expect(() => {
        DeviceRegistry.setThermostatTemperature('bedroom_thermostat', 35);
      }).toThrow(/Invalid temperature 35°C/);
    });

    it('mutates device state on valid tool execution and preserves state', () => {
      DeviceRegistry.setLightState('living_room_lights', 'off');
      const updated = DeviceRegistry.getDevice('living_room_lights');
      expect(updated.state.power).toBe('off');
    });

    it('throws when targeting an unknown device', () => {
      expect(() => {
        DeviceRegistry.getDevice('nonexistent_toaster');
      }).toThrow(/not found in registry/);
    });
  });

  describe('2. Tool Registry Security & Execution', () => {
    it('executes registered tools with schema validation', async () => {
      const result = await ToolRegistry.executeTool('set_light_brightness', {
        deviceId: 'bedroom_lights',
        brightness: 45,
      });
      expect(result.success).toBe(true);
      expect(result.newState.brightness).toBe(45);
    });

    it('rejects unknown tools strictly without executing arbitrary code', async () => {
      await expect(
        ToolRegistry.executeTool('eval_shell_script', { cmd: 'rm -rf' })
      ).rejects.toThrow(/not registered/);
    });
  });

  describe('3. Policy Engine & Safety Gates', () => {
    it('marks door unlocking as HIGH RISK requiring explicit approval', () => {
      const policy = PolicyEngine.evaluateActionPolicy('unlock_door', 'front_door_lock', {});
      expect(policy.riskLevel).toBe('high');
      expect(policy.requiresApproval).toBe(true);
    });

    it('marks reading device state as LOW RISK', () => {
      const policy = PolicyEngine.evaluateActionPolicy('get_device_state', 'front_door_lock', {});
      expect(policy.riskLevel).toBe('low');
      expect(policy.requiresApproval).toBe(false);
    });

    it('binds approvals strictly to action arguments and invalidates tampered args', () => {
      const action: any = {
        actionId: 'act-1',
        requestedState: { deviceId: 'bedroom_thermostat', temperatureCelsius: 22 },
      };
      // Matching args
      expect(
        PolicyEngine.validateApprovalBinding(action, {
          deviceId: 'bedroom_thermostat',
          temperatureCelsius: 22,
        })
      ).toBe(true);

      // Tampered args
      expect(
        PolicyEngine.validateApprovalBinding(action, {
          deviceId: 'bedroom_thermostat',
          temperatureCelsius: 28,
        })
      ).toBe(false);
    });
  });

  describe('4. Independent Verification Engine', () => {
    it('returns VERIFIED when postcondition matches independent state read', async () => {
      DeviceRegistry.setLightState('living_room_lights', 'off');
      const verification = await IndependentVerificationEngine.verifyAction('living_room_lights', {
        property: 'power',
        expectedValue: 'off',
      });
      expect(verification.status).toBe('verified');
      expect(verification.evidence.isMatch).toBe(true);
      expect(verification.evidence.observedValue).toBe('off');
    });

    it('returns FAILED when observed state contradicts expected postcondition', async () => {
      // Light is currently ON
      const verification = await IndependentVerificationEngine.verifyAction('bedroom_lights', {
        property: 'power',
        expectedValue: 'off',
      });
      expect(verification.status).toBe('failed');
      expect(verification.evidence.isMatch).toBe(false);
      expect(verification.evidence.observedValue).toBe('on');
    });

    it('returns UNVERIFIED when verification read failure is injected (CRC error)', async () => {
      db.updateFailures({ verificationReadFail: true });
      const verification = await IndependentVerificationEngine.verifyAction('living_room_lights', {
        property: 'power',
        expectedValue: 'on',
      });
      expect(verification.status).toBe('unverified');
      expect(verification.evidence.details).toContain('Injected Failure');
    });
  });

  describe('5. Deterministic AI Planner & Exceptions', () => {
    it('formulates correct structured plan for Good Night sleep routine', () => {
      const cmd =
        'Prepare my house for sleep. Turn off the living room lights, set the bedroom temperature to 22 degrees, and check whether the front door is locked.';
      const devices = DeviceRegistry.getAllDevices();
      const plan = AIPlanner.generateDeterministicPlan('test-cmd-1', cmd, devices);

      expect(plan.actions.length).toBeGreaterThanOrEqual(3);
      expect(plan.actions.some((a: PlanAction) => a.targetDeviceId === 'living_room_lights')).toBe(true);
      expect(plan.actions.some((a: PlanAction) => a.targetDeviceId === 'bedroom_thermostat')).toBe(true);
      expect(plan.actions.some((a: PlanAction) => a.targetDeviceId === 'front_door_lock')).toBe(true);
    });

    it('respects contradictory exceptions (keep bedroom lights on)', () => {
      const cmd = 'Turn off all the lights, but keep the bedroom lights on.';
      const devices = DeviceRegistry.getAllDevices();
      const plan = AIPlanner.generateDeterministicPlan('test-cmd-2', cmd, devices);

      const bedroomAction = plan.actions.find((a: PlanAction) => a.targetDeviceId === 'bedroom_lights');
      expect(bedroomAction).toBeUndefined(); // Bedroom lights should NOT be turned off

      const livingRoomAction = plan.actions.find((a: PlanAction) => a.targetDeviceId === 'living_room_lights');
      expect(livingRoomAction).toBeDefined();
    });
  });

  describe('6. End-to-End Orchestrator & Failure Recovery', () => {
    it('executes full Good Night lifecycle: Plan -> Approve -> Execute -> Verify', async () => {
      // First ensure door is locked so sleep verification passes all conditions
      DeviceRegistry.setLockState('front_door_lock', true);

      const cmd =
        'Prepare my house for sleep. Turn off the living room lights, set the bedroom temperature to 22 degrees, and check whether the front door is locked.';
      const record = await OrchestratorStateMachine.initiateCommand(cmd);
      expect(record.plan).toBeDefined();

      // Approve plan
      const approved = OrchestratorStateMachine.approveActions(record.id);
      expect(approved.plan?.actions.every((a: PlanAction) => a.approvalStatus !== 'pending')).toBe(true);

      // Execute plan
      const executed = await OrchestratorStateMachine.executePlan(record.id);
      expect(executed.finalReport).toBeDefined();
      expect(executed.finalReport?.overallOutcome).toBe('Completed and verified');
      expect(executed.phase).toBe('completed');
    });

    it('honestly reports failure and recovers upon retry', async () => {
      // 1. Inject thermostat write failure
      db.updateFailures({ thermostatWriteFail: true });

      const cmd = 'Set the bedroom temperature to 22 degrees.';
      const record = await OrchestratorStateMachine.initiateCommand(cmd);
      OrchestratorStateMachine.approveActions(record.id);

      // 2. Execute plan with failure
      const executed = await OrchestratorStateMachine.executePlan(record.id);
      expect(executed.finalReport?.overallOutcome).toBe('Failed');
      expect(executed.finalReport?.failedActions.length).toBe(1);

      // 3. Device state must remain unchanged at 24°C
      const dev = DeviceRegistry.getDevice('bedroom_thermostat');
      expect(dev.state.temperature).toBe(24);

      // 4. Clear failure and retry
      db.updateFailures({ thermostatWriteFail: false });
      const retried = await OrchestratorStateMachine.retryAction(record.id, 'act-1');
      expect(retried.finalReport?.overallOutcome).toBe('Completed and verified');

      // 5. Verify updated state
      const verifiedDev = DeviceRegistry.getDevice('bedroom_thermostat');
      expect(verifiedDev.state.temperature).toBe(22);
    });

    it('handles idempotency keys and prevents repeated physical execution', async () => {
      const key = 'idem-unique-123';
      const cmd = 'Set the bedroom temperature to 22 degrees.';

      const first = await OrchestratorStateMachine.initiateCommand(cmd, undefined, key);
      const duplicate = await OrchestratorStateMachine.initiateCommand(cmd, undefined, key);

      expect(duplicate.id).toBe(first.id);
    });
  });
});
