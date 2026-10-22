/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { OverviewView } from './components/views/OverviewView';
import { CommandCentreView } from './components/views/CommandCentreView';
import { HistoryView } from './components/views/HistoryView';
import { DevicesView } from './components/views/DevicesView';
import { ScenariosView } from './components/views/ScenariosView';
import { AgentActivityView } from './components/views/AgentActivityView';
import { IntegrationsView } from './components/views/IntegrationsView';
import { SettingsView } from './components/views/SettingsView';
import { FailureLabModal } from './components/simulator/FailureLabModal';
import { FinalReportModal } from './components/command/FinalReportModal';
import { CustomCursor } from './components/common/CustomCursor';
import { api } from './api/client';
import {
  DeviceState,
  CommandExecutionRecord,
  FailureInjectionConfig,
  UserSettings,
} from './types';

export default function App() {
  const [currentNav, setCurrentNav] = useState<NavItem>('overview');
  const [devices, setDevices] = useState<DeviceState[]>([]);
  const [currentExecution, setCurrentExecution] = useState<CommandExecutionRecord | null>(null);
  const [history, setHistory] = useState<CommandExecutionRecord[]>([]);
  const [failures, setFailures] = useState<FailureInjectionConfig>({
    thermostatWriteFail: false,
    verificationReadFail: false,
    delayedOperationMs: 0,
    deviceOfflineId: null,
    staleStateSimulation: false,
    partialCompletionMode: false,
  });
  const [settings, setSettings] = useState<UserSettings>({
    temperatureUnit: 'celsius',
    preferredPlanner: 'gemini',
    autoApproveLowRisk: true,
    autoApproveMediumRisk: false,
    requireExplicitDoorUnlock: true,
    reducedMotion: false,
    interfaceDensity: 'comfortable',
    retentionDays: 30,
  });

  const [isFailureLabOpen, setIsFailureLabOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CommandExecutionRecord | null>(null);
  const [isLoadingCommand, setIsLoadingCommand] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRunningReliabilityDemo, setIsRunningReliabilityDemo] = useState(false);

  // Initial Load
  const refreshData = async () => {
    try {
      const [devRes, histRes, failRes, setRes] = await Promise.all([
        api.getDevices(),
        api.getHistory(),
        api.getFailures(),
        api.getSettings(),
      ]);
      setDevices(devRes.devices);
      setHistory(histRes.records);
      setFailures(failRes);
      setSettings(setRes);
    } catch (err) {
      console.error('[ActionGuard] Data refresh failed:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Command Submission & Planning
  const handlePlanCommand = async (command: string, scenarioId?: string) => {
    try {
      setIsLoadingCommand(true);
      const record = await api.planCommand(command, scenarioId);
      setCurrentExecution(record);
      setCurrentNav('command_centre');
      await refreshData();
    } catch (err: any) {
      alert(`Planning error: ${err.message}`);
    } finally {
      setIsLoadingCommand(false);
    }
  };

  // Approvals
  const handleApproveAction = async (actionId?: string) => {
    if (!currentExecution) return;
    try {
      const updated = await api.approveCommand(currentExecution.id, actionId);
      setCurrentExecution(updated);
      await refreshData();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleRejectAction = async (actionId: string, reason?: string) => {
    if (!currentExecution) return;
    try {
      const updated = await api.rejectCommand(currentExecution.id, actionId, reason);
      setCurrentExecution(updated);
      await refreshData();
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  // Execution & Verification
  const handleExecutePlan = async () => {
    if (!currentExecution) return;
    try {
      setIsExecuting(true);
      const updated = await api.executeCommand(currentExecution.id);
      setCurrentExecution(updated);
      await refreshData();
      if (updated.finalReport) {
        setSelectedReport(updated);
      }
    } catch (err: any) {
      alert(`Execution error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Retry Action
  const handleRetryAction = async (actionId: string) => {
    if (!currentExecution) return;
    try {
      // Clear thermostat write failure if active so retry succeeds
      if (failures.thermostatWriteFail) {
        await api.updateFailures({ thermostatWriteFail: false });
        setFailures((prev) => ({ ...prev, thermostatWriteFail: false }));
      }
      const updated = await api.retryAction(currentExecution.id, actionId);
      setCurrentExecution(updated);
      await refreshData();
      if (updated.finalReport) {
        setSelectedReport(updated);
      }
    } catch (err: any) {
      alert(`Retry error: ${err.message}`);
    }
  };

  // Device Manual Operation
  const handleOperateDevice = async (deviceId: string, toolName: string, args: Record<string, any>) => {
    try {
      await api.operateDevice(deviceId, toolName, args);
      await refreshData();
    } catch (err: any) {
      alert(`Device operation error: ${err.message}`);
    }
  };

  // Update Failures
  const handleUpdateFailures = async (updated: Partial<FailureInjectionConfig>) => {
    const res = await api.updateFailures(updated);
    setFailures(res.failures);
  };

  // Reset Demo
  const handleResetDemo = async () => {
    await api.resetSimulator();
    setCurrentExecution(null);
    setSelectedReport(null);
    await refreshData();
  };

  // 1-Click Run Reliability Demo (Hackathon Workflow)
  const handleRunReliabilityDemo = async () => {
    try {
      setIsRunningReliabilityDemo(true);

      // Step 1: Reset to clean baseline
      await api.resetSimulator();
      await refreshData();

      // Step 2: Inject Thermostat Failure for the demo
      await api.updateFailures({ thermostatWriteFail: true });
      setFailures((prev) => ({ ...prev, thermostatWriteFail: true }));

      // Step 3: Plan Good Night Command
      const cmd =
        'Prepare my house for sleep. Turn off the living room lights, set the bedroom temperature to 22 degrees, and check whether the front door is locked.';
      const planned = await api.planCommand(cmd, 'good_night');
      setCurrentExecution(planned);
      setCurrentNav('command_centre');

      // Step 4: Authorize plan actions
      const approved = await api.approveCommand(planned.id);
      setCurrentExecution(approved);

      // Step 5: Execute with the injected failure
      setIsExecuting(true);
      const executed = await api.executeCommand(approved.id);
      setCurrentExecution(executed);
      await refreshData();
      setIsExecuting(false);

      // Step 6: Present honest failure audit report
      if (executed.finalReport) {
        setSelectedReport(executed);
      }
    } catch (err: any) {
      console.error('[ActionGuard] Reliability Demo failed:', err);
    } finally {
      setIsExecuting(false);
      setIsRunningReliabilityDemo(false);
    }
  };

  const onlineDevicesCount = devices.filter((d) => d.isOnline).length;
  const activeCount = currentExecution?.phase === 'executing' || currentExecution?.phase === 'awaiting_approval' ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#090B0F] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200 relative bg-precision-grid">
      <CustomCursor />
      {/* Top Application Header */}
      <Header
        onNewCommand={() => {
          setCurrentNav('command_centre');
        }}
        onOpenFailureLab={() => setIsFailureLabOpen(true)}
        onRunReliabilityDemo={handleRunReliabilityDemo}
        onOpenSettings={() => setCurrentNav('settings')}
        failures={failures}
        onlineCount={onlineDevicesCount}
        totalDevices={devices.length}
        isRunningDemo={isRunningReliabilityDemo}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          currentNav={currentNav}
          onSelectNav={setCurrentNav}
          activeExecutionsCount={activeCount}
        />

        {/* View Content Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-925 to-slate-950">
          {currentNav === 'overview' && (
            <OverviewView
              devices={devices}
              currentExecution={currentExecution}
              history={history}
              settings={settings}
              onSubmitCommand={handlePlanCommand}
              onSelectScenarioPreset={(sId, cmd) => handlePlanCommand(cmd, sId)}
              onOperateDevice={handleOperateDevice}
              onNavigateToCommandCentre={() => setCurrentNav('command_centre')}
              onNavigateToHistory={() => setCurrentNav('history')}
              onOpenReport={(rec) => setSelectedReport(rec)}
              isLoadingCommand={isLoadingCommand}
            />
          )}

          {currentNav === 'command_centre' && (
            <CommandCentreView
              currentExecution={currentExecution}
              devices={devices}
              settings={settings}
              onSubmitCommand={handlePlanCommand}
              onApproveAction={handleApproveAction}
              onRejectAction={handleRejectAction}
              onExecutePlan={handleExecutePlan}
              onRetryAction={handleRetryAction}
              onOpenReport={(rec) => setSelectedReport(rec)}
              isLoading={isLoadingCommand}
              isExecuting={isExecuting}
            />
          )}

          {currentNav === 'history' && (
            <HistoryView
              history={history}
              onOpenReport={(rec) => setSelectedReport(rec)}
            />
          )}

          {currentNav === 'devices' && (
            <DevicesView
              devices={devices}
              settings={settings}
              onOperateDevice={handleOperateDevice}
              onReconcile={async () => {
                await api.reconcileVerification();
                await refreshData();
              }}
              onResetDemo={handleResetDemo}
            />
          )}

          {currentNav === 'scenarios' && (
            <ScenariosView
              onRunScenario={async (sId, cmd, failSetup) => {
                if (failSetup) {
                  await api.updateFailures(failSetup);
                  setFailures((prev) => ({ ...prev, ...failSetup }));
                }
                await handlePlanCommand(cmd, sId);
              }}
              isLoading={isLoadingCommand}
            />
          )}

          {currentNav === 'activity' && (
            <AgentActivityView
              currentExecution={currentExecution}
              history={history}
            />
          )}

          {currentNav === 'integrations' && <IntegrationsView />}

          {currentNav === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={async (upd) => {
                const res = await api.updateSettings(upd);
                setSettings(res.settings);
              }}
              onResetDemo={handleResetDemo}
            />
          )}
        </main>
      </div>

      {/* Interactive Failure Lab Modal */}
      <FailureLabModal
        isOpen={isFailureLabOpen}
        onClose={() => setIsFailureLabOpen(false)}
        failures={failures}
        devices={devices}
        onUpdateFailures={handleUpdateFailures}
        onResetDemo={handleResetDemo}
      />

      {/* Final Truthful Audit Report Modal */}
      <FinalReportModal
        isOpen={Boolean(selectedReport && selectedReport.finalReport)}
        onClose={() => setSelectedReport(null)}
        report={selectedReport?.finalReport || null}
        onRetryAction={(actionId) => {
          setSelectedReport(null);
          handleRetryAction(actionId);
        }}
      />
    </div>
  );
}
