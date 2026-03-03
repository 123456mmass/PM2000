/**
 * PM2230 Dashboard Threshold Configuration
 *
 * Defines warning and critical thresholds for power quality monitoring.
 * Values are based on typical electrical standards (IEC 61000, IEEE 519).
 */

export interface ThresholdRange {
  min: number;
  max: number;
  warningLow?: number;
  warningHigh?: number;
}

export interface ThresholdConfig {
  voltage: {
    l1: ThresholdRange;
    l2: ThresholdRange;
    l3: ThresholdRange;
    ll: ThresholdRange; // Line-to-line voltage
  };
  current: {
    l1: ThresholdRange;
    l2: ThresholdRange;
    l3: ThresholdRange;
    neutral: ThresholdRange;
  };
  frequency: ThresholdRange;
  thd: {
    voltage: ThresholdRange;
    current: ThresholdRange;
    individual: {
      maxHarmonicOrder: number;
      warningPercent: number;
    };
  };
  unbalance: {
    voltage: ThresholdRange;
    current: ThresholdRange;
  };
  powerFactor: ThresholdRange;
}

/**
 * Default threshold values for PM2230 power monitoring
 * Adjust these values based on your specific installation requirements
 */
export const defaultThresholds: ThresholdConfig = {
  voltage: {
    l1: {
      min: 198,      // Minimum acceptable voltage (V)
      max: 242,      // Maximum acceptable voltage (V)
      warningLow: 210,  // Warning when below this (V)
      warningHigh: 230, // Warning when above this (V)
    },
    l2: {
      min: 198,
      max: 242,
      warningLow: 210,
      warningHigh: 230,
    },
    l3: {
      min: 198,
      max: 242,
      warningLow: 210,
      warningHigh: 230,
    },
    ll: {
      min: 342,      // Line-to-line minimum (V)
      max: 418,      // Line-to-line maximum (V)
      warningLow: 360,
      warningHigh: 400,
    },
  },
  current: {
    l1: {
      min: 0,
      max: 100,      // Maximum rated current (A)
      warningLow: undefined,
      warningHigh: 80, // Warning at 80% of max
    },
    l2: {
      min: 0,
      max: 100,
      warningLow: undefined,
      warningHigh: 80,
    },
    l3: {
      min: 0,
      max: 100,
      warningLow: undefined,
      warningHigh: 80,
    },
    neutral: {
      min: 0,
      max: 50,       // Neutral current limit (A)
      warningLow: undefined,
      warningHigh: 40,
    },
  },
  frequency: {
    min: 49.5,       // Minimum frequency (Hz)
    max: 50.5,       // Maximum frequency (Hz)
    warningLow: 49.7,
    warningHigh: 50.3,
  },
  thd: {
    voltage: {
      min: 0,
      max: 8,        // Max THD-V per IEEE 519 (%)
      warningLow: undefined,
      warningHigh: 5, // Warning threshold (%)
    },
    current: {
      min: 0,
      max: 15,       // Max THD-I (%)
      warningLow: undefined,
      warningHigh: 10,
    },
    individual: {
      maxHarmonicOrder: 50,  // Monitor up to 50th harmonic
      warningPercent: 3,     // Warning for individual harmonic (%)
    },
  },
  unbalance: {
    voltage: {
      min: 0,
      max: 3,        // Max voltage unbalance (%)
      warningLow: undefined,
      warningHigh: 2, // Warning threshold (%)
    },
    current: {
      min: 0,
      max: 10,       // Max current unbalance (%)
      warningLow: undefined,
      warningHigh: 7, // Warning threshold (%)
    },
  },
  powerFactor: {
    min: 0.85,       // Minimum acceptable PF
    max: 1.0,        // Ideal PF
    warningLow: 0.9, // Warning when below this
    warningHigh: undefined,
  },
};

/**
 * Voltage level standards (for reference)
 */
export const voltageStandards = {
  nominal: {
    phase: 220,      // Nominal phase voltage (V)
    line: 380,       // Nominal line voltage (V)
  },
  tolerance: {
    percent: 10,     // Standard tolerance (%)
  },
};

/**
 * Frequency standard (for reference)
 */
export const frequencyStandard = {
  nominal: 50,       // Nominal frequency (Hz) - Thailand uses 50Hz
  tolerance: 0.5,    // Standard tolerance (Hz)
};

/**
 * Helper function to check if a value is within threshold
 */
export function checkThreshold(
  value: number,
  threshold: ThresholdRange
): { status: 'normal' | 'warning' | 'critical'; message?: string } {
  if (value < threshold.min || value > threshold.max) {
    return {
      status: 'critical',
      message: `Value ${value} is outside acceptable range (${threshold.min}-${threshold.max})`,
    };
  }

  if (
    (threshold.warningLow !== undefined && value < threshold.warningLow) ||
    (threshold.warningHigh !== undefined && value > threshold.warningHigh)
  ) {
    return {
      status: 'warning',
      message: `Value ${value} is approaching limits`,
    };
  }

  return { status: 'normal' };
}

/**
 * Helper function to get threshold status color
 */
export function getStatusColor(status: 'normal' | 'warning' | 'critical'): string {
  switch (status) {
    case 'normal':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'critical':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

export default defaultThresholds;
