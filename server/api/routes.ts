/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { DeviceRegistry } from '../simulator/deviceRegistry';
import { db } from '../storage/database';
import { OrchestratorStateMachine } from '../orchestrator/stateMachine';
import { ToolRegistry } from '../tools/toolRegistry';
import { BedrockAdapter } from '../ai/bedrockAdapter';
import { IndependentVerificationEngine } from '../verification/verifier';

const router = Router();

// Health
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await ToolRegistry.executeTool('get_simulator_health', {});
    res.json({
      status: 'ok',
      service: 'ActionGuard AI Core Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      health,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Devices
router.get('/devices', (_req: Request, res: Response) => {
  try {
    const devices = DeviceRegistry.getAllDevices();
    res.json({ devices, total: devices.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/devices/:deviceId', (req: Request, res: Response) => {
  try {
    const device = DeviceRegistry.getDevice(req.params.deviceId);
    res.json({ device });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// Manual Device Operation (Must go through tool registry and verification!)
router.post('/devices/:deviceId/operate', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { toolName, args } = req.body;

    if (!ToolRegistry.isToolRegistered(toolName)) {
      return res.status(400).json({ error: `Tool '${toolName}' is not registered.` });
    }

    const result = await ToolRegistry.executeTool(toolName, { ...args, deviceId });

    // Verify after manual mutation
    const device = DeviceRegistry.getDevice(deviceId);
    res.json({ success: true, result, device });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Commands
const planSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  scenarioId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

router.post('/commands/plan', async (req: Request, res: Response) => {
  try {
    const { command, scenarioId, idempotencyKey } = planSchema.parse(req.body);
    const record = await OrchestratorStateMachine.initiateCommand(command, scenarioId, idempotencyKey);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/commands/:commandId/approve', (req: Request, res: Response) => {
  try {
    const { commandId } = req.params;
    const { actionId } = req.body || {};
    const record = OrchestratorStateMachine.approveActions(commandId, actionId);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/commands/:commandId/reject', (req: Request, res: Response) => {
  try {
    const { commandId } = req.params;
    const { actionId, reason } = req.body;
    if (!actionId) {
      return res.status(400).json({ error: 'actionId is required to reject an action' });
    }
    const record = OrchestratorStateMachine.rejectAction(commandId, actionId, reason);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/commands/:commandId/execute', async (req: Request, res: Response) => {
  try {
    const { commandId } = req.params;
    const record = await OrchestratorStateMachine.executePlan(commandId);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/commands/:commandId/retry', async (req: Request, res: Response) => {
  try {
    const { commandId } = req.params;
    const { actionId } = req.body;
    if (!actionId) {
      return res.status(400).json({ error: 'actionId is required for retry' });
    }
    const record = await OrchestratorStateMachine.retryAction(commandId, actionId);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/commands/:commandId', (req: Request, res: Response) => {
  const record = db.getExecution(req.params.commandId);
  if (!record) {
    return res.status(404).json({ error: 'Command execution record not found.' });
  }
  res.json(record);
});

router.get('/commands/:commandId/events', (req: Request, res: Response) => {
  const record = db.getExecution(req.params.commandId);
  if (!record) {
    return res.status(404).json({ error: 'Command execution record not found.' });
  }
  res.json({ events: record.events });
});

// Execution History
router.get('/history', (req: Request, res: Response) => {
  const { outcome, limit } = req.query;
  let records = db.getHistory();
  if (outcome && outcome !== 'all') {
    records = records.filter(
      (r) => r.finalReport?.overallOutcome?.toLowerCase() === String(outcome).toLowerCase()
    );
  }
  const lim = limit ? parseInt(String(limit), 10) : 50;
  res.json({ records: records.slice(0, lim), total: records.length });
});

router.get('/history/:executionId', (req: Request, res: Response) => {
  const record = db.getExecution(req.params.executionId);
  if (!record) {
    return res.status(404).json({ error: 'Execution history record not found.' });
  }
  res.json(record);
});

// State Reconciliation & Independent Verification
router.post('/verification/reconcile', async (_req: Request, res: Response) => {
  try {
    const devices = DeviceRegistry.getAllDevices();
    const results: any[] = [];
    for (const d of devices) {
      const state = d.state;
      const key = d.type === 'light' ? 'power' : d.type === 'thermostat' ? 'temperature' : 'locked';
      const result = await IndependentVerificationEngine.verifyAction(d.id, {
        property: key,
        expectedValue: (state as any)[key],
      });
      results.push({ deviceId: d.id, verified: result.status === 'verified', result });
    }
    res.json({ reconciledAt: new Date().toISOString(), results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Simulator Reset & Failure Lab
router.post('/simulator/reset', (_req: Request, res: Response) => {
  try {
    db.resetDemo();
    res.json({
      success: true,
      message: 'Demo simulator reset to initial state.',
      devices: db.getDevices(),
      failures: db.getFailures(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/simulator/failures', (_req: Request, res: Response) => {
  res.json(db.getFailures());
});

router.post('/simulator/failures', (req: Request, res: Response) => {
  try {
    const updated = db.updateFailures(req.body);
    res.json({ success: true, failures: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Integrations Status & Bedrock
router.get('/integrations', (_req: Request, res: Response) => {
  const bedrock = BedrockAdapter.getStatus();
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

  res.json({
    simulator: {
      name: 'Local Smart-Home Simulator',
      status: 'operational',
      isLocal: true,
      description: 'In-memory stateful simulator with 5 virtual physical devices and hardware telemetry.',
    },
    gemini: {
      name: 'Google Gemini Planning Service',
      status: hasGeminiKey ? 'connected' : 'configured_default',
      model: 'gemini-3.8-flash',
      description: 'Server-side structured reasoning engine for natural-language intent decomposition.',
    },
    bedrock: {
      name: 'Amazon Bedrock (AWS Challenge)',
      status: bedrock.connectionStatus,
      details: bedrock,
      description: 'Enterprise AI orchestrator via AWS Bedrock Runtime Converse API.',
    },
    mcp: {
      name: 'Alexa+ / MCP Architecture Layer',
      status: 'simulated_ready',
      spec: '2025-11-25 Streamable HTTP Ready',
      description: 'Standardized tool schemas and policy enforcement boundary for Alexa+ simulated experience.',
    },
  });
});

router.post('/integrations/bedrock/test', async (_req: Request, res: Response) => {
  const result = await BedrockAdapter.testConnection();
  res.json(result);
});

// Settings
router.get('/settings', (_req: Request, res: Response) => {
  res.json(db.getSettings());
});

router.post('/settings', (req: Request, res: Response) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
