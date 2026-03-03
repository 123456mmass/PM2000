/**
 * Calculate the average of an array of numbers
 * @param values - Array of numbers to average
 * @returns The average value, or 0 if array is empty
 */
export function avg(values: number[]): number {
  if (!values || values.length === 0) {
    return 0;
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate voltage unbalance percentage
 * Formula: (Max deviation from average / Average voltage) * 100
 * @param voltages - Array of line-to-line or line-to-neutral voltages [Vab, Vbc, Vca] or [Va, Vb, Vc]
 * @returns Voltage unbalance percentage
 */
export function calculateVoltageUnbalance(voltages: number[]): number {
  if (!voltages || voltages.length < 3) {
    return 0;
  }

  const averageVoltage = avg(voltages.slice(0, 3));

  if (averageVoltage === 0) {
    return 0;
  }

  const deviations = voltages.slice(0, 3).map(v => Math.abs(v - averageVoltage));
  const maxDeviation = Math.max(...deviations);

  return (maxDeviation / averageVoltage) * 100;
}

/**
 * Calculate current unbalance percentage
 * Formula: (Max deviation from average / Average current) * 100
 * @param currents - Array of phase currents [Ia, Ib, Ic]
 * @returns Current unbalance percentage
 */
export function calculateCurrentUnbalance(currents: number[]): number {
  if (!currents || currents.length < 3) {
    return 0;
  }

  const averageCurrent = avg(currents.slice(0, 3));

  if (averageCurrent === 0) {
    return 0;
  }

  const deviations = currents.slice(0, 3).map(i => Math.abs(i - averageCurrent));
  const maxDeviation = Math.max(...deviations);

  return (maxDeviation / averageCurrent) * 100;
}

/**
 * Calculate average Total Harmonic Distortion (THD)
 * @param thdValues - Array of THD percentages for each phase
 * @returns Average THD percentage
 */
export function calculateTHDaverage(thdValues: number[]): number {
  return avg(thdValues);
}

/**
 * Health level score enum
 */
export enum HealthLevel {
  Excellent = 5,
  Good = 4,
  Fair = 3,
  Poor = 2,
  Critical = 1,
}

/**
 * Evaluate health level based on score
 * @param score - Numeric score (typically 1-5)
 * @returns HealthLevel enum value
 */
export function evaluateHealthLevel(score: number): HealthLevel {
  if (score >= 4.5) {
    return HealthLevel.Excellent;
  } else if (score >= 3.5) {
    return HealthLevel.Good;
  } else if (score >= 2.5) {
    return HealthLevel.Fair;
  } else if (score >= 1.5) {
    return HealthLevel.Poor;
  } else {
    return HealthLevel.Critical;
  }
}

/**
 * Get numeric score from health parameters
 * @param params - Object containing various health metrics
 * @returns Numeric score (1-5)
 */
export function levelScore(params: {
  voltageUnbalance?: number;
  currentUnbalance?: number;
  thdAverage?: number;
  powerFactor?: number;
}): number {
  let score = 5;

  // Voltage unbalance penalty (NEMA standard: >2% is concerning)
  if (params.voltageUnbalance !== undefined) {
    if (params.voltageUnbalance > 5) {
      score -= 2;
    } else if (params.voltageUnbalance > 2) {
      score -= 1;
    } else if (params.voltageUnbalance > 1) {
      score -= 0.5;
    }
  }

  // Current unbalance penalty
  if (params.currentUnbalance !== undefined) {
    if (params.currentUnbalance > 10) {
      score -= 2;
    } else if (params.currentUnbalance > 5) {
      score -= 1;
    } else if (params.currentUnbalance > 2) {
      score -= 0.5;
    }
  }

  // THD penalty (IEEE 519 standard)
  if (params.thdAverage !== undefined) {
    if (params.thdAverage > 8) {
      score -= 1.5;
    } else if (params.thdAverage > 5) {
      score -= 1;
    } else if (params.thdAverage > 3) {
      score -= 0.5;
    }
  }

  // Power factor bonus/penalty
  if (params.powerFactor !== undefined) {
    if (params.powerFactor < 0.8) {
      score -= 1;
    } else if (params.powerFactor < 0.85) {
      score -= 0.5;
    } else if (params.powerFactor >= 0.95) {
      score = Math.min(5, score + 0.5);
    }
  }

  return Math.max(1, Math.min(5, score));
}

/**
 * Get human-readable text for health level
 * @param level - HealthLevel enum value
 * @returns Localized text description
 */
export function levelText(level: HealthLevel): string {
  switch (level) {
    case HealthLevel.Excellent:
      return 'ยอดเยี่ยม';
    case HealthLevel.Good:
      return 'ดี';
    case HealthLevel.Fair:
      return 'พอใช้';
    case HealthLevel.Poor:
      return 'แย่';
    case HealthLevel.Critical:
      return 'วิกฤต';
    default:
      return 'ไม่ทราบ';
  }
}

/**
 * Get CSS class name for health level styling
 * @param level - HealthLevel enum value
 * @returns CSS class name
 */
export function levelClass(level: HealthLevel): string {
  switch (level) {
    case HealthLevel.Excellent:
      return 'health-excellent';
    case HealthLevel.Good:
      return 'health-good';
    case HealthLevel.Fair:
      return 'health-fair';
    case HealthLevel.Poor:
      return 'health-poor';
    case HealthLevel.Critical:
      return 'health-critical';
    default:
      return 'health-unknown';
  }
}

/**
 * Get color code for health level
 * @param level - HealthLevel enum value
 * @returns Hex color code
 */
export function levelColor(level: HealthLevel): string {
  switch (level) {
    case HealthLevel.Excellent:
      return '#22c55e'; // green-500
    case HealthLevel.Good:
      return '#84cc16'; // lime-500
    case HealthLevel.Fair:
      return '#eab308'; // yellow-500
    case HealthLevel.Poor:
      return '#f97316'; // orange-500
    case HealthLevel.Critical:
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Calculate overall power quality score
 * @param data - Object containing power quality metrics
 * @returns Object with score, level, and details
 */
export function calculatePowerQualityScore(data: {
  voltages?: number[];
  currents?: number[];
  thdValues?: number[];
  powerFactor?: number;
}): {
  score: number;
  level: HealthLevel;
  levelText: string;
  levelClass: string;
  levelColor: string;
  details: {
    voltageUnbalance: number;
    currentUnbalance: number;
    thdAverage: number;
  };
} {
  const voltageUnbalance = data.voltages ? calculateVoltageUnbalance(data.voltages) : 0;
  const currentUnbalance = data.currents ? calculateCurrentUnbalance(data.currents) : 0;
  const thdAverage = data.thdValues ? calculateTHDaverage(data.thdValues) : 0;

  const score = levelScore({
    voltageUnbalance,
    currentUnbalance,
    thdAverage,
    powerFactor: data.powerFactor,
  });

  const level = evaluateHealthLevel(score);

  return {
    score,
    level,
    levelText: levelText(level),
    levelClass: levelClass(level),
    levelColor: levelColor(level),
    details: {
      voltageUnbalance,
      currentUnbalance,
      thdAverage,
    },
  };
}

// Re-export all functions as named exports
export default {
  avg,
  calculateVoltageUnbalance,
  calculateCurrentUnbalance,
  calculateTHDaverage,
  evaluateHealthLevel,
  levelScore,
  levelText,
  levelClass,
  levelColor,
  calculatePowerQualityScore,
  HealthLevel,
};
