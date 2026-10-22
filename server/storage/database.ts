/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import {
  DeviceState,
  CommandExecutionRecord,
  FailureInjectionConfig,
  UserSettings,
} from '../types';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.resolve(DATA_DIR, 'actionguard_db.json');

export const INITIAL_DEVICES: DeviceState[] = [
  {
    id: 'living_room_lights',
    name: 'Living Room Lights',
    type: 'light',
    room: 'Living Room',
    isOnline: true,
    isSimulated: true,
    lastUpdated: new Date().toISOString(),
    state: {
      power: 'on',
      brightness: 100,
    },
  },
  {
    id: 'bedroom_lights',
    name: 'Bedroom Lights',
    type: 'light',
    room: 'Bedroom',
    isOnline: true,
    isSimulated: true,
    lastUpdated: new Date().toISOString(),
    state: {
      power: 'on',
      brightness: 80,
    },
  },
  {
    id: 'bedroom_thermostat',
    name: 'Bedroom Thermostat',
    type: 'thermostat',
    room: 'Bedroom',
    isOnline: true,
    isSimulated: true,
    lastUpdated: new Date().toISOString(),
    state: {
      temperature: 24,
      targetTemperature: 24,
    },
  },
  {
    id: 'front_door_lock',
    name: 'Front-Door Lock',
    type: 'lock',
    room: 'Entrance',
    isOnline: true,
    isSimulated: true,
    lastUpdated: new Date().toISOString(),
    state: {
      locked: false,
    },
  },
  {
    id: 'night_mode',
    name: 'Night Mode Controller',
    type: 'routine',
    room: 'Whole House',
    isOnline: true,
    isSimulated: true,
    lastUpdated: new Date().toISOString(),
    state: {
      active: false,
    },
  },
];

export const INITIAL_SETTINGS: UserSettings = {
  temperatureUnit: 'celsius',
  preferredPlanner: 'gemini',
  autoApproveLowRisk: true,
  autoApproveMediumRisk: false,
  requireExplicitDoorUnlock: true,
  reducedMotion: false,
  interfaceDensity: 'comfortable',
  retentionDays: 30,
};

export const INITIAL_FAILURES: FailureInjectionConfig = {
  thermostatWriteFail: false,
  verificationReadFail: false,
  delayedOperationMs: 0,
  deviceOfflineId: null,
  staleStateSimulation: false,
  partialCompletionMode: false,
};

interface DatabaseSchema {
  devices: DeviceState[];
  history: CommandExecutionRecord[];
  failures: FailureInjectionConfig;
  settings: UserSettings;
}

class StorageAdapter {
  private memoryDb: DatabaseSchema;

  constructor() {
    this.memoryDb = {
      devices: JSON.parse(JSON.stringify(INITIAL_DEVICES)),
      history: [],
      failures: JSON.parse(JSON.stringify(INITIAL_FAILURES)),
      settings: JSON.parse(JSON.stringify(INITIAL_SETTINGS)),
    };
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.devices && Array.isArray(parsed.devices)) {
          this.memoryDb.devices = parsed.devices;
        }
        if (parsed.history && Array.isArray(parsed.history)) {
          this.memoryDb.history = parsed.history;
        }
        if (parsed.failures) {
          this.memoryDb.failures = { ...INITIAL_FAILURES, ...parsed.failures };
        }
        if (parsed.settings) {
          this.memoryDb.settings = { ...INITIAL_SETTINGS, ...parsed.settings };
        }
      } else {
        this.saveToDisk();
      }
    } catch (err) {
      console.warn('[Storage] Failed to read disk DB, using in-memory store:', err);
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Storage] Failed to save DB to disk:', err);
    }
  }

  // Devices
  public getDevices(): DeviceState[] {
    return JSON.parse(JSON.stringify(this.memoryDb.devices));
  }

  public getDevice(deviceId: string): DeviceState | undefined {
    const dev = this.memoryDb.devices.find((d) => d.id === deviceId);
    return dev ? JSON.parse(JSON.stringify(dev)) : undefined;
  }

  public updateDeviceState(deviceId: string, partialState: Partial<DeviceState['state']>): DeviceState {
    const dev = this.memoryDb.devices.find((d) => d.id === deviceId);
    if (!dev) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    dev.state = { ...dev.state, ...partialState };
    dev.lastUpdated = new Date().toISOString();
    this.saveToDisk();
    return JSON.parse(JSON.stringify(dev));
  }

  public setDeviceOnline(deviceId: string, isOnline: boolean): DeviceState {
    const dev = this.memoryDb.devices.find((d) => d.id === deviceId);
    if (!dev) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    dev.isOnline = isOnline;
    dev.lastUpdated = new Date().toISOString();
    this.saveToDisk();
    return JSON.parse(JSON.stringify(dev));
  }

  // History / Execution Records
  public getHistory(): CommandExecutionRecord[] {
    return JSON.parse(JSON.stringify(this.memoryDb.history));
  }

  public getExecution(id: string): CommandExecutionRecord | undefined {
    const item = this.memoryDb.history.find((h) => h.id === id);
    return item ? JSON.parse(JSON.stringify(item)) : undefined;
  }

  public saveExecution(record: CommandExecutionRecord): CommandExecutionRecord {
    const idx = this.memoryDb.history.findIndex((h) => h.id === record.id);
    if (idx >= 0) {
      this.memoryDb.history[idx] = JSON.parse(JSON.stringify(record));
    } else {
      this.memoryDb.history.unshift(JSON.parse(JSON.stringify(record)));
    }
    this.saveToDisk();
    return JSON.parse(JSON.stringify(record));
  }

  // Failures Config
  public getFailures(): FailureInjectionConfig {
    return JSON.parse(JSON.stringify(this.memoryDb.failures));
  }

  public updateFailures(partial: Partial<FailureInjectionConfig>): FailureInjectionConfig {
    this.memoryDb.failures = { ...this.memoryDb.failures, ...partial };
    this.saveToDisk();
    return JSON.parse(JSON.stringify(this.memoryDb.failures));
  }

  // Settings
  public getSettings(): UserSettings {
    return JSON.parse(JSON.stringify(this.memoryDb.settings));
  }

  public updateSettings(partial: Partial<UserSettings>): UserSettings {
    this.memoryDb.settings = { ...this.memoryDb.settings, ...partial };
    this.saveToDisk();
    return JSON.parse(JSON.stringify(this.memoryDb.settings));
  }

  // Reset Demo
  public resetDemo(): void {
    this.memoryDb.devices = JSON.parse(JSON.stringify(INITIAL_DEVICES));
    this.memoryDb.failures = JSON.parse(JSON.stringify(INITIAL_FAILURES));
    // Clear history or keep seed
    this.memoryDb.history = [];
    this.saveToDisk();
  }
}

export const db = new StorageAdapter();
