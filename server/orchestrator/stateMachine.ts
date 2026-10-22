/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIPlanner } from '../ai/planner';
import { db } from '../storage/database';
import { ToolRegistry } from '../tools/toolRegistry';
import { IndependentVerificationEngine } from '../verification/verifier';
import {
  CommandExecutionRecord,
  CommandPhase,
  ExecutionEvent,
  FinalReport,
  PlanAction,
  StructuredPlan,
  VerificationStatus,
} from '../types';

export class OrchestratorStateMachine {
  /**
   * Initializes a new command execution lifecycle
   */
  public static async initiateCommand(
    command: string,
    scenarioId?: string,
    idempotencyKey?: string
  ): Promise<CommandExecutionRecord> {
    const trimmed = command?.trim();
    if (!trimmed) {
      throw new Error('Command cannot be empty.');
    }

    // Check idempotency: If key provided and already executed, return cached record
    if (idempotencyKey) {
      const existing = db.getHistory().find((h) => h.idempotencyKey === idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: CommandExecutionRecord = {
      id: commandId,
      timestamp: now,
      command: trimmed,
      phase: 'planning',
      events: [
        {
          id: `evt-${Date.now()}-1`,
          commandId,
          timestamp: now,
          phase: 'planning',
          type: 'COMMAND_RECEIVED',
          title: 'Command Ingestion',
          description: `Natural language instruction received: "${trimmed}"`,
          metadata: { scenarioId, idempotencyKey },
        },
      ],
      environmentType: 'SIMULATOR_DEMO',
      scenarioId,
      idempotencyKey,
    };

    db.saveExecution(record);

    // Generate Plan according to user's preferred planning provider
    try {
      const settings = db.getSettings();
      let plan: StructuredPlan;
      if (settings.preferredPlanner === 'deterministic') {
        const currentDevices = db.getDevices();
        plan = AIPlanner.generateDeterministicPlan(commandId, trimmed, currentDevices);
      } else {
        plan = await AIPlanner.generatePlan(commandId, trimmed);
      }
      record.plan = plan;

      const hasPendingApproval = plan.actions.some((a) => a.approvalStatus === 'pending');
      record.phase = hasPendingApproval ? 'awaiting_approval' : 'plan_ready';

      record.events.push({
        id: `evt-${Date.now()}-2`,
        commandId,
        timestamp: new Date().toISOString(),
        phase: record.phase,
        type: 'PLAN_GENERATED',
        title: 'Structured Plan Formulated',
        description: `Generated ${plan.actions.length} action(s) via ${plan.plannerType.toUpperCase()} planner.`,
        metadata: {
          summary: plan.humanReadableSummary,
          actionsCount: plan.actions.length,
          pendingApprovals: hasPendingApproval,
        },
      });

      if (hasPendingApproval) {
        record.events.push({
          id: `evt-${Date.now()}-3`,
          commandId,
          timestamp: new Date().toISOString(),
          phase: 'awaiting_approval',
          type: 'APPROVAL_REQUESTED',
          title: 'Safety Gate Enforced',
          description: 'Actions with elevated risk profile or requiring authorization are awaiting user confirmation.',
        });
      }

      db.saveExecution(record);
      return record;
    } catch (err: any) {
      record.phase = 'failed';
      record.events.push({
        id: `evt-${Date.now()}-err`,
        commandId,
        timestamp: new Date().toISOString(),
        phase: 'failed',
        type: 'COMMAND_FINISHED',
        title: 'Planning Aborted',
        description: `Fatal error in planning pipeline: ${err.message}`,
      });
      db.saveExecution(record);
      throw err;
    }
  }

  /**
   * Approves a single action or all actions in a plan
   */
  public static approveActions(
    commandId: string,
    actionId?: string
  ): CommandExecutionRecord {
    const record = db.getExecution(commandId);
    if (!record || !record.plan) {
      throw new Error(`Record or plan not found for commandId: ${commandId}`);
    }

    if (actionId) {
      const targetAction = record.plan.actions.find((a) => a.actionId === actionId);
      if (!targetAction) {
        throw new Error(`Action '${actionId}' not found in plan.`);
      }
      targetAction.approvalStatus = 'approved';
      targetAction.executionStatus = 'approved';

      record.events.push({
        id: `evt-${Date.now()}`,
        commandId,
        timestamp: new Date().toISOString(),
        phase: record.phase,
        type: 'APPROVAL_GRANTED',
        title: 'Action Approved',
        description: `User authorized execution of action: ${targetAction.description}`,
        actionId,
      });
    } else {
      // Approve all pending actions
      record.plan.actions.forEach((a) => {
        if (a.approvalStatus === 'pending') {
          a.approvalStatus = 'approved';
          a.executionStatus = 'approved';
        }
      });

      record.events.push({
        id: `evt-${Date.now()}`,
        commandId,
        timestamp: new Date().toISOString(),
        phase: record.phase,
        type: 'APPROVAL_GRANTED',
        title: 'Full Plan Authorized',
        description: 'User granted authorization for all proposed plan actions.',
      });
    }

    const stillPending = record.plan.actions.some((a) => a.approvalStatus === 'pending');
    record.phase = stillPending ? 'awaiting_approval' : 'plan_ready';
    record.plan.planStatus = stillPending ? 'pending_approval' : 'in_progress';

    db.saveExecution(record);
    return record;
  }

  /**
   * Rejects an action
   */
  public static rejectAction(
    commandId: string,
    actionId: string,
    reason?: string
  ): CommandExecutionRecord {
    const record = db.getExecution(commandId);
    if (!record || !record.plan) {
      throw new Error(`Record or plan not found for commandId: ${commandId}`);
    }

    const action = record.plan.actions.find((a) => a.actionId === actionId);
    if (!action) {
      throw new Error(`Action '${actionId}' not found.`);
    }

    action.approvalStatus = 'rejected';
    action.executionStatus = 'skipped';
    action.failureReason = reason || 'Action authorization rejected by user.';

    record.events.push({
      id: `evt-${Date.now()}`,
      commandId,
      timestamp: new Date().toISOString(),
      phase: record.phase,
      type: 'APPROVAL_REJECTED',
      title: 'Action Denied',
      description: `User rejected authorization for: ${action.description}`,
      actionId,
    });

    db.saveExecution(record);
    return record;
  }

  /**
   * Executes all approved actions in the plan sequentially with independent verification
   */
  public static async executePlan(commandId: string): Promise<CommandExecutionRecord> {
    const record = db.getExecution(commandId);
    if (!record || !record.plan) {
      throw new Error(`Execution record not found: ${commandId}`);
    }

    record.phase = 'executing';
    db.saveExecution(record);

    const failures = db.getFailures();
    const actions = record.plan.actions;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      // Skip unapproved, rejected, or skipped actions
      if (action.approvalStatus === 'pending') {
        action.executionStatus = 'skipped';
        action.verificationStatus = 'not_applicable';
        action.failureReason = 'Action skipped: Required user approval was not granted.';
        continue;
      }
      if (action.approvalStatus === 'rejected') {
        action.executionStatus = 'skipped';
        action.verificationStatus = 'not_applicable';
        continue;
      }

      // Check partial completion mode failure injection: fail action index 1 if partial completion mode enabled
      if (failures.partialCompletionMode && i === 1) {
        action.executionStatus = 'failed';
        action.verificationStatus = 'failed';
        action.failureReason = 'Simulated partial completion failure: Tool timeout in multi-action routine.';
        record.events.push({
          id: `evt-${Date.now()}-${i}`,
          commandId,
          timestamp: new Date().toISOString(),
          phase: 'executing',
          type: 'TOOL_CALL_FAILED',
          title: `Tool Execution Failed: ${action.toolName}`,
          description: action.failureReason,
          actionId: action.actionId,
        });
        continue;
      }

      // Execute tool
      action.executionStatus = 'executing';
      record.events.push({
        id: `evt-${Date.now()}-start-${i}`,
        commandId,
        timestamp: new Date().toISOString(),
        phase: 'executing',
        type: 'TOOL_CALL_STARTED',
        title: `Invoking Tool: ${action.toolName}`,
        description: `Dispatched to ${action.targetDeviceId} with params: ${JSON.stringify(action.requestedState)}`,
        actionId: action.actionId,
      });

      let toolSucceeded = false;
      let toolError = '';

      try {
        await ToolRegistry.executeTool(action.toolName, action.requestedState);
        action.executionStatus = 'executed';
        action.executedAt = new Date().toISOString();
        toolSucceeded = true;

        record.events.push({
          id: `evt-${Date.now()}-comp-${i}`,
          commandId,
          timestamp: new Date().toISOString(),
          phase: 'executing',
          type: 'TOOL_CALL_COMPLETED',
          title: `Tool Completed: ${action.toolName}`,
          description: `Device acknowledged invocation for ${action.targetDeviceId}. Initiating independent verification.`,
          actionId: action.actionId,
        });
      } catch (err: any) {
        action.executionStatus = 'failed';
        action.failureReason = err.message;
        toolError = err.message;

        record.events.push({
          id: `evt-${Date.now()}-err-${i}`,
          commandId,
          timestamp: new Date().toISOString(),
          phase: 'executing',
          type: 'TOOL_CALL_FAILED',
          title: `Tool Failed: ${action.toolName}`,
          description: `Execution error: ${err.message}`,
          actionId: action.actionId,
        });
      }

      // Phase: Independent Post-Action Verification
      record.phase = 'verifying';
      record.events.push({
        id: `evt-${Date.now()}-ver-${i}`,
        commandId,
        timestamp: new Date().toISOString(),
        phase: 'verifying',
        type: 'VERIFICATION_STARTED',
        title: `Independent Verification: ${action.targetDeviceId}`,
        description: `Querying fresh telemetry for postcondition '${action.expectedPostcondition.property}=${action.expectedPostcondition.expectedValue}'`,
        actionId: action.actionId,
      });

      const verificationResult = await IndependentVerificationEngine.verifyAction(
        action.targetDeviceId,
        action.expectedPostcondition,
        !toolSucceeded
      );

      action.verificationStatus = verificationResult.status;
      action.verificationEvidence = verificationResult.evidence;
      action.verifiedAt = new Date().toISOString();

      if (verificationResult.status === 'verified') {
        record.events.push({
          id: `evt-${Date.now()}-vpass-${i}`,
          commandId,
          timestamp: new Date().toISOString(),
          phase: 'verifying',
          type: 'VERIFICATION_PASSED',
          title: 'Verification Passed',
          description: verificationResult.evidence.details || 'Device state verified independently.',
          actionId: action.actionId,
          metadata: { evidence: verificationResult.evidence },
        });
      } else if (verificationResult.status === 'unverified') {
        record.events.push({
          id: `evt-${Date.now()}-vunver-${i}`,
          commandId,
          timestamp: new Date().toISOString(),
          phase: 'verifying',
          type: 'VERIFICATION_UNVERIFIED',
          title: 'Verification Inconclusive (Unverified)',
          description: verificationResult.evidence.details || 'Sensor state could not be validated.',
          actionId: action.actionId,
          metadata: { evidence: verificationResult.evidence },
        });
      } else {
        record.events.push({
          id: `evt-${Date.now()}-vfail-${i}`,
          commandId,
          timestamp: new Date().toISOString(),
          phase: 'verifying',
          type: 'VERIFICATION_FAILED',
          title: 'Verification Failed',
          description: verificationResult.evidence.details || 'Observed device state contradicted expected outcome.',
          actionId: action.actionId,
          metadata: { evidence: verificationResult.evidence },
        });
      }

      db.saveExecution(record);
    }

    // Determine Final Overall Outcome
    const finalReport = this.generateFinalReport(record);
    record.finalReport = finalReport;

    if (finalReport.overallOutcome === 'Completed and verified') {
      record.phase = 'completed';
    } else if (finalReport.overallOutcome === 'Partially completed') {
      record.phase = 'partially_completed';
    } else if (finalReport.overallOutcome === 'Unverified') {
      record.phase = 'unverified';
    } else {
      record.phase = 'failed';
    }

    record.events.push({
      id: `evt-${Date.now()}-fin`,
      commandId,
      timestamp: new Date().toISOString(),
      phase: record.phase,
      type: 'COMMAND_FINISHED',
      title: `Command Concluded: ${finalReport.overallOutcome}`,
      description: `Execution outcome finalized. ${finalReport.completedActions.length} verified, ${finalReport.failedActions.length} failed, ${finalReport.unverifiedActions.length} unverified.`,
    });

    db.saveExecution(record);
    return record;
  }

  /**
   * Retries an eligible failed action
   */
  public static async retryAction(
    commandId: string,
    actionId: string
  ): Promise<CommandExecutionRecord> {
    const record = db.getExecution(commandId);
    if (!record || !record.plan) {
      throw new Error(`Record or plan not found: ${commandId}`);
    }

    const action = record.plan.actions.find((a) => a.actionId === actionId);
    if (!action) {
      throw new Error(`Action '${actionId}' not found.`);
    }

    action.retryCount = (action.retryCount || 0) + 1;
    if (action.retryCount > 3) {
      throw new Error(`Maximum retry limit exceeded (3 attempts) for action ${actionId}.`);
    }

    record.events.push({
      id: `evt-${Date.now()}-retry`,
      commandId,
      timestamp: new Date().toISOString(),
      phase: 'executing',
      type: 'RECOVERY_ATTEMPTED',
      title: `Recovery Attempt #${action.retryCount}`,
      description: `Re-dispatching action '${action.toolName}' after failure reconciliation.`,
      actionId,
    });

    // Execute tool again
    try {
      await ToolRegistry.executeTool(action.toolName, action.requestedState);
      action.executionStatus = 'executed';
      action.failureReason = undefined;
    } catch (err: any) {
      action.executionStatus = 'failed';
      action.failureReason = err.message;
    }

    // Verify again
    const verification = await IndependentVerificationEngine.verifyAction(
      action.targetDeviceId,
      action.expectedPostcondition
    );
    action.verificationStatus = verification.status;
    action.verificationEvidence = verification.evidence;

    // Refresh final report
    record.finalReport = this.generateFinalReport(record);
    if (record.finalReport.overallOutcome === 'Completed and verified') {
      record.phase = 'completed';
    } else if (record.finalReport.overallOutcome === 'Partially completed') {
      record.phase = 'partially_completed';
    } else if (record.finalReport.overallOutcome === 'Unverified') {
      record.phase = 'unverified';
    } else {
      record.phase = 'failed';
    }

    db.saveExecution(record);
    return record;
  }

  /**
   * Generates a truthful, unvarnished final report
   */
  private static generateFinalReport(record: CommandExecutionRecord): FinalReport {
    const plan = record.plan!;
    const completedActions: any[] = [];
    const failedActions: any[] = [];
    const unverifiedActions: any[] = [];
    const skippedActions: any[] = [];
    const evidenceList: any[] = [];

    for (const a of plan.actions) {
      evidenceList.push({
        actionId: a.actionId,
        expected: a.expectedPostcondition.expectedValue,
        observed: a.verificationEvidence?.observedValue,
        status: a.verificationStatus,
      });

      if (a.executionStatus === 'skipped') {
        skippedActions.push({
          actionId: a.actionId,
          description: a.description,
          reason: a.failureReason || 'Action authorization skipped.',
        });
      } else if (a.verificationStatus === 'verified') {
        completedActions.push({
          actionId: a.actionId,
          description: a.description,
          verifiedState: a.verificationEvidence?.observedValue,
        });
      } else if (a.verificationStatus === 'unverified') {
        unverifiedActions.push({
          actionId: a.actionId,
          description: a.description,
          reason: a.verificationEvidence?.details || a.failureReason || 'Physical state confirmation unavailable.',
        });
      } else {
        // Failed
        failedActions.push({
          actionId: a.actionId,
          description: a.description,
          reason: a.failureReason || a.verificationEvidence?.details || 'Target postcondition failed check.',
        });
      }
    }

    // Determine overall outcome
    let overallOutcome: FinalReport['overallOutcome'] = 'Completed and verified';
    if (failedActions.length > 0 && completedActions.length > 0) {
      overallOutcome = 'Partially completed';
    } else if (failedActions.length > 0 && completedActions.length === 0) {
      overallOutcome = 'Failed';
    } else if (unverifiedActions.length > 0) {
      overallOutcome = 'Unverified';
    } else if (completedActions.length === 0 && skippedActions.length > 0) {
      overallOutcome = 'Cancelled';
    }

    const safetyDecisions: string[] = [];
    plan.actions.forEach((a) => {
      if (a.requiresApproval) {
        safetyDecisions.push(`Action [${a.actionId}] evaluated as ${a.riskLevel.toUpperCase()} RISK: Required explicit user consent.`);
      }
    });

    const recovery: string[] = [];
    plan.actions.forEach((a) => {
      if (a.retryCount && a.retryCount > 0) {
        recovery.push(`Action [${a.actionId}] underwent ${a.retryCount} recovery attempt(s).`);
      }
    });

    let nextStep = 'All planned actions verified. System in normal sleep guard mode.';
    if (failedActions.length > 0) {
      nextStep = 'Inspect failed device(s) or initiate a targeted recovery attempt.';
    } else if (unverifiedActions.length > 0) {
      nextStep = 'Initiate manual telemetry reconciliation to confirm unverified hardware state.';
    }

    return {
      commandId: record.id,
      originalRequest: record.command,
      overallOutcome,
      completedActions,
      failedActions,
      unverifiedActions,
      skippedActions,
      safetyDecisions,
      recovery,
      evidence: evidenceList,
      nextStep,
      generatedAt: new Date().toISOString(),
    };
  }
}
