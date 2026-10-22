/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export type ActionExecutionStatus =
  | 'proposed'
  | 'awaiting_approval'
  | 'approved'
  | 'executing'
  | 'executed'
  | 'failed'
  | 'skipped'
  | 'cancelled';

export type VerificationStatus =
  | 'not_checked'
  | 'verified'
  | 'failed'
  | 'unverified'
  | 'not_applicable';

export type CommandPhase =
  | 'idle'
  | 'planning'
  | 'plan_ready'
  | 'awaiting_approval'
  | 'executing'
  | 'verifying'
  | 'completed'
  | 'partially_completed'
  | 'failed'
  | 'unverified'
  | 'cancelled';

export type DeviceType = 'light' | 'thermostat' | 'lock' | 'routine';

export interface DeviceState {
  id: string;
  name: string;
  type: DeviceType;
  room: string;
  isOnline: boolean;
  isSimulated: boolean;
  lastUpdated: string;
  state: {
    power?: 'on' | 'off';
    brightness?: number;
    temperature?: number;
    targetTemperature?: number;
    locked?: boolean;
    active?: boolean;
  };
}

export interface ExpectedPostcondition {
  property: string;
  expectedValue: any;
  comparison?: 'equals' | 'in_range' | 'boolean';
}

export interface VerificationEvidence {
  verifiedAt: string;
  verificationSource: 'simulator_direct_read' | 'device_telemetry' | 'inferred';
  propertyChecked: string;
  expectedValue: any;
  observedValue: any;
  isMatch: boolean;
  details?: string;
}

export interface PlanAction {
  actionId: string;
  toolName: string;
  targetDeviceId: string;
  description: string;
  requestedState: Record<string, any>;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  dependencies: string[];
  expectedPostcondition: ExpectedPostcondition;
  executionStatus: ActionExecutionStatus;
  verificationStatus: VerificationStatus;
  failureReason?: string;
  executionAttempt?: number;
  executedAt?: string;
  verifiedAt?: string;
  verificationEvidence?: VerificationEvidence;
  retryCount?: number;
}

export interface StructuredPlan {
  planId: string;
  commandId: string;
  originalCommand: string;
  humanReadableSummary: string;
  assumptions: string[];
  clarificationQuestions: string[];
  actions: PlanAction[];
  createdAt: string;
  planStatus: 'draft' | 'pending_approval' | 'in_progress' | 'completed' | 'failed';
  plannerType: 'gemini' | 'bedrock' | 'deterministic_fallback';
}

export interface ExecutionEvent {
  id: string;
  commandId: string;
  timestamp: string;
  phase: CommandPhase;
  type:
    | 'COMMAND_RECEIVED'
    | 'PLAN_GENERATED'
    | 'APPROVAL_REQUESTED'
    | 'APPROVAL_GRANTED'
    | 'APPROVAL_REJECTED'
    | 'TOOL_CALL_STARTED'
    | 'TOOL_CALL_COMPLETED'
    | 'TOOL_CALL_FAILED'
    | 'VERIFICATION_STARTED'
    | 'VERIFICATION_PASSED'
    | 'VERIFICATION_FAILED'
    | 'VERIFICATION_UNVERIFIED'
    | 'RECOVERY_ATTEMPTED'
    | 'COMMAND_FINISHED';
  title: string;
  description: string;
  actionId?: string;
  metadata?: Record<string, any>;
}

export interface FinalReport {
  commandId: string;
  originalRequest: string;
  overallOutcome:
    | 'Completed and verified'
    | 'Partially completed'
    | 'Failed'
    | 'Unverified'
    | 'Cancelled';
  completedActions: Array<{
    actionId: string;
    description: string;
    verifiedState: any;
  }>;
  failedActions: Array<{
    actionId: string;
    description: string;
    reason: string;
  }>;
  unverifiedActions: Array<{
    actionId: string;
    description: string;
    reason: string;
  }>;
  skippedActions: Array<{
    actionId: string;
    description: string;
    reason: string;
  }>;
  safetyDecisions: string[];
  recovery: string[];
  evidence: Array<{
    actionId: string;
    expected: any;
    observed: any;
    status: VerificationStatus;
  }>;
  nextStep?: string;
  generatedAt: string;
}

export interface CommandExecutionRecord {
  id: string;
  timestamp: string;
  command: string;
  phase: CommandPhase;
  plan?: StructuredPlan;
  events: ExecutionEvent[];
  finalReport?: FinalReport;
  environmentType: 'SIMULATOR_DEMO' | 'PRODUCTION_AWS' | 'HYBRID';
  scenarioId?: string;
  idempotencyKey?: string;
}

export interface FailureInjectionConfig {
  thermostatWriteFail: boolean;
  verificationReadFail: boolean;
  delayedOperationMs: number;
  deviceOfflineId: string | null;
  staleStateSimulation: boolean;
  partialCompletionMode: boolean;
}

export interface UserSettings {
  temperatureUnit: 'celsius' | 'fahrenheit';
  preferredPlanner: 'gemini' | 'bedrock' | 'deterministic';
  autoApproveLowRisk: boolean;
  autoApproveMediumRisk: boolean;
  requireExplicitDoorUnlock: boolean;
  reducedMotion: boolean;
  interfaceDensity: 'comfortable' | 'compact';
  retentionDays: number;
}
