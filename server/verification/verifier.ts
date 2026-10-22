/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DeviceRegistry } from '../simulator/deviceRegistry';
import { db } from '../storage/database';
import { ExpectedPostcondition, VerificationEvidence, VerificationStatus } from '../types';

export interface VerificationResult {
  status: VerificationStatus;
  evidence: VerificationEvidence;
  error?: string;
}

export class IndependentVerificationEngine {
  /**
   * Performs an independent read from the stateful device simulator
   * and verifies whether the expected postcondition is genuinely satisfied.
   */
  public static async verifyAction(
    deviceId: string,
    postcondition: ExpectedPostcondition,
    preExecutionFailure?: boolean
  ): Promise<VerificationResult> {
    const failures = db.getFailures();
    const now = new Date().toISOString();

    // Check verification read failure injection
    if (failures.verificationReadFail) {
      return {
        status: 'unverified',
        evidence: {
          verifiedAt: now,
          verificationSource: 'simulator_direct_read',
          propertyChecked: postcondition.property,
          expectedValue: postcondition.expectedValue,
          observedValue: null,
          isMatch: false,
          details: 'Verification read failure: Telemetry sensor bus returned CRC mismatch (Injected Failure). Cannot independently confirm physical state.',
        },
        error: 'Telemetry check failed: unable to read device state.',
      };
    }

    try {
      // Independent fresh read of the device state
      const freshDevice = DeviceRegistry.getDevice(deviceId);

      if (!freshDevice.isOnline) {
        return {
          status: 'unverified',
          evidence: {
            verifiedAt: now,
            verificationSource: 'simulator_direct_read',
            propertyChecked: postcondition.property,
            expectedValue: postcondition.expectedValue,
            observedValue: null,
            isMatch: false,
            details: `Device '${deviceId}' is offline during verification query.`,
          },
          error: `Device '${deviceId}' is offline. Physical state could not be verified.`,
        };
      }

      const observedValue = (freshDevice.state as any)[postcondition.property];
      const isMatch = this.compareValues(observedValue, postcondition.expectedValue, postcondition.comparison);

      if (isMatch) {
        return {
          status: 'verified',
          evidence: {
            verifiedAt: now,
            verificationSource: 'simulator_direct_read',
            propertyChecked: postcondition.property,
            expectedValue: postcondition.expectedValue,
            observedValue,
            isMatch: true,
            details: `Observed state '${postcondition.property}=${observedValue}' matches expected postcondition '${postcondition.expectedValue}'.`,
          },
        };
      } else {
        return {
          status: 'failed',
          evidence: {
            verifiedAt: now,
            verificationSource: 'simulator_direct_read',
            propertyChecked: postcondition.property,
            expectedValue: postcondition.expectedValue,
            observedValue,
            isMatch: false,
            details: `Postcondition mismatch: Expected '${postcondition.property}' to be '${postcondition.expectedValue}', but observed '${observedValue}'.`,
          },
          error: `Observed device state (${observedValue}) does not match expected postcondition (${postcondition.expectedValue}).`,
        };
      }
    } catch (err: any) {
      return {
        status: 'unverified',
        evidence: {
          verifiedAt: now,
          verificationSource: 'simulator_direct_read',
          propertyChecked: postcondition.property,
          expectedValue: postcondition.expectedValue,
          observedValue: null,
          isMatch: false,
          details: `Verification query error: ${err.message}`,
        },
        error: err.message,
      };
    }
  }

  private static compareValues(observed: any, expected: any, comparison?: string): boolean {
    if (observed === undefined || observed === null) {
      return false;
    }
    if (comparison === 'boolean') {
      return Boolean(observed) === Boolean(expected);
    }
    if (comparison === 'in_range' && Array.isArray(expected)) {
      return observed >= expected[0] && observed <= expected[1];
    }
    return observed === expected;
  }
}
