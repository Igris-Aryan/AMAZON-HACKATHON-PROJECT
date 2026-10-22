/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../storage/database';
import { DeviceState } from '../types';

export class DeviceRegistry {
  public static getAllDevices(): DeviceState[] {
    const devices = db.getDevices();
    const failures = db.getFailures();

    // Check if offline failure is active for any device
    return devices.map((d) => {
      if (failures.deviceOfflineId === d.id) {
        return { ...d, isOnline: false };
      }
      return d;
    });
  }

  public static getDevice(deviceId: string): DeviceState {
    const dev = db.getDevice(deviceId);
    if (!dev) {
      throw new Error(`Device '${deviceId}' not found in registry.`);
    }

    const failures = db.getFailures();
    if (failures.deviceOfflineId === deviceId) {
      return { ...dev, isOnline: false };
    }

    // Stale state simulation: if enabled for bedroom thermostat or lights, return slightly offset state for test
    if (failures.staleStateSimulation && deviceId === 'bedroom_thermostat') {
      return {
        ...dev,
        state: {
          ...dev.state,
          temperature: (dev.state.temperature ?? 24) + 1,
        },
      };
    }

    return dev;
  }

  public static setLightState(deviceId: string, state: 'on' | 'off'): DeviceState {
    const dev = this.getDevice(deviceId);
    if (dev.type !== 'light') {
      throw new Error(`Device '${deviceId}' is not a light (type is ${dev.type}).`);
    }
    if (!dev.isOnline) {
      throw new Error(`Device '${deviceId}' is currently offline.`);
    }

    return db.updateDeviceState(deviceId, { power: state });
  }

  public static setLightBrightness(deviceId: string, brightness: number): DeviceState {
    const dev = this.getDevice(deviceId);
    if (dev.type !== 'light') {
      throw new Error(`Device '${deviceId}' is not a light.`);
    }
    if (!dev.isOnline) {
      throw new Error(`Device '${deviceId}' is currently offline.`);
    }
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 100) {
      throw new Error(`Brightness must be an integer between 0 and 100. Received: ${brightness}`);
    }

    const power = brightness === 0 ? 'off' : 'on';
    return db.updateDeviceState(deviceId, { brightness, power });
  }

  public static setThermostatTemperature(deviceId: string, temperatureCelsius: number): DeviceState {
    const dev = this.getDevice(deviceId);
    if (dev.type !== 'thermostat') {
      throw new Error(`Device '${deviceId}' is not a thermostat.`);
    }
    if (!dev.isOnline) {
      throw new Error(`Device '${deviceId}' is currently offline.`);
    }

    if (
      typeof temperatureCelsius !== 'number' ||
      temperatureCelsius < 16 ||
      temperatureCelsius > 30 ||
      Number.isNaN(temperatureCelsius)
    ) {
      throw new Error(`Invalid temperature ${temperatureCelsius}°C. Supported range is 16°C to 30°C.`);
    }

    // Check failure injection
    const failures = db.getFailures();
    if (failures.thermostatWriteFail) {
      // Injected failure: operation fails without mutating state
      throw new Error('Hardware write command rejected: Thermostat actuator communication timed out (Injected Failure).');
    }

    return db.updateDeviceState(deviceId, {
      temperature: temperatureCelsius,
      targetTemperature: temperatureCelsius,
    });
  }

  public static setLockState(deviceId: string, locked: boolean): DeviceState {
    const dev = this.getDevice(deviceId);
    if (dev.type !== 'lock') {
      throw new Error(`Device '${deviceId}' is not a lock.`);
    }
    if (!dev.isOnline) {
      throw new Error(`Device '${deviceId}' is currently offline.`);
    }

    return db.updateDeviceState(deviceId, { locked });
  }

  public static setNightMode(enabled: boolean): DeviceState {
    const dev = this.getDevice('night_mode');
    if (!dev) {
      throw new Error('Night mode controller not found.');
    }
    if (!dev.isOnline) {
      throw new Error('Night mode controller is offline.');
    }

    return db.updateDeviceState('night_mode', { active: enabled });
  }
}
