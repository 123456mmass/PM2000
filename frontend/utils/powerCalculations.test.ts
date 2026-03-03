/**
 * Unit tests for powerCalculations utility functions
 */

import {
  avg,
  calculateVoltageUnbalance,
  calculateCurrentUnbalance,
  evaluateHealthLevel,
  HealthLevel,
  levelScore,
  levelText,
  levelClass,
  levelColor,
  calculatePowerQualityScore,
} from '../powerCalculations';

describe('powerCalculations', () => {
  describe('avg', () => {
    it('should calculate average of an array of numbers', () => {
      expect(avg([10, 20, 30, 40, 50])).toBe(30);
    });

    it('should return 0 for empty array', () => {
      expect(avg([])).toBe(0);
    });

    it('should return 0 for null input', () => {
      expect(avg(null as unknown as number[])).toBe(0);
    });

    it('should return 0 for undefined input', () => {
      expect(avg(undefined as unknown as number[])).toBe(0);
    });

    it('should handle array with single element', () => {
      expect(avg([42])).toBe(42);
    });

    it('should handle negative numbers', () => {
      expect(avg([-10, 10, 0])).toBe(0);
    });

    it('should handle decimal numbers', () => {
      expect(avg([1.5, 2.5, 3.5, 4.5])).toBe(3);
    });
  });

  describe('calculateVoltageUnbalance', () => {
    it('should calculate voltage unbalance percentage', () => {
      // Perfectly balanced voltages
      expect(calculateVoltageUnbalance([400, 400, 400])).toBe(0);
    });

    it('should handle unbalanced voltages', () => {
      // Unbalanced: 400, 410, 390 (average = 400, max deviation = 10)
      // Unbalance = (10 / 400) * 100 = 2.5%
      expect(calculateVoltageUnbalance([400, 410, 390])).toBeCloseTo(2.5, 1);
    });

    it('should return 0 for empty array', () => {
      expect(calculateVoltageUnbalance([])).toBe(0);
    });

    it('should return 0 for array with less than 3 elements', () => {
      expect(calculateVoltageUnbalance([400, 400])).toBe(0);
    });

    it('should return 0 for null input', () => {
      expect(calculateVoltageUnbalance(null as unknown as number[])).toBe(0);
    });

    it('should return 0 when average voltage is 0', () => {
      expect(calculateVoltageUnbalance([0, 0, 0])).toBe(0);
    });

    it('should only use first 3 values', () => {
      // Should ignore extra values beyond first 3
      expect(calculateVoltageUnbalance([400, 410, 390, 500, 600])).toBeCloseTo(
        2.5,
        1
      );
    });
  });

  describe('calculateCurrentUnbalance', () => {
    it('should calculate current unbalance percentage', () => {
      // Perfectly balanced currents
      expect(calculateCurrentUnbalance([10, 10, 10])).toBe(0);
    });

    it('should handle unbalanced currents', () => {
      // Unbalanced: 10, 11, 9 (average = 10, max deviation = 1)
      // Unbalance = (1 / 10) * 100 = 10%
      expect(calculateCurrentUnbalance([10, 11, 9])).toBeCloseTo(10, 1);
    });

    it('should return 0 for empty array', () => {
      expect(calculateCurrentUnbalance([])).toBe(0);
    });

    it('should return 0 for array with less than 3 elements', () => {
      expect(calculateCurrentUnbalance([10, 10])).toBe(0);
    });

    it('should return 0 for null input', () => {
      expect(calculateCurrentUnbalance(null as unknown as number[])).toBe(0);
    });

    it('should return 0 when average current is 0', () => {
      expect(calculateCurrentUnbalance([0, 0, 0])).toBe(0);
    });

    it('should handle significant unbalance', () => {
      // Significant unbalance: 10, 15, 5 (average = 10, max deviation = 5)
      // Unbalance = (5 / 10) * 100 = 50%
      expect(calculateCurrentUnbalance([10, 15, 5])).toBeCloseTo(50, 1);
    });
  });

  describe('evaluateHealthLevel', () => {
    it('should return Excellent for score >= 4.5', () => {
      expect(evaluateHealthLevel(5)).toBe(HealthLevel.Excellent);
      expect(evaluateHealthLevel(4.8)).toBe(HealthLevel.Excellent);
      expect(evaluateHealthLevel(4.5)).toBe(HealthLevel.Excellent);
    });

    it('should return Good for score >= 3.5 and < 4.5', () => {
      expect(evaluateHealthLevel(4.4)).toBe(HealthLevel.Good);
      expect(evaluateHealthLevel(4)).toBe(HealthLevel.Good);
      expect(evaluateHealthLevel(3.5)).toBe(HealthLevel.Good);
    });

    it('should return Fair for score >= 2.5 and < 3.5', () => {
      expect(evaluateHealthLevel(3.4)).toBe(HealthLevel.Fair);
      expect(evaluateHealthLevel(3)).toBe(HealthLevel.Fair);
      expect(evaluateHealthLevel(2.5)).toBe(HealthLevel.Fair);
    });

    it('should return Poor for score >= 1.5 and < 2.5', () => {
      expect(evaluateHealthLevel(2.4)).toBe(HealthLevel.Poor);
      expect(evaluateHealthLevel(2)).toBe(HealthLevel.Poor);
      expect(evaluateHealthLevel(1.5)).toBe(HealthLevel.Poor);
    });

    it('should return Critical for score < 1.5', () => {
      expect(evaluateHealthLevel(1.4)).toBe(HealthLevel.Critical);
      expect(evaluateHealthLevel(1)).toBe(HealthLevel.Critical);
      expect(evaluateHealthLevel(0)).toBe(HealthLevel.Critical);
    });
  });

  describe('levelScore', () => {
    it('should return 5 for excellent conditions', () => {
      expect(
        levelScore({
          voltageUnbalance: 0.5,
          currentUnbalance: 1,
          thdAverage: 2,
          powerFactor: 0.95,
        })
      ).toBe(5);
    });

    it('should penalize high voltage unbalance (>5%)', () => {
      expect(
        levelScore({
          voltageUnbalance: 6,
          currentUnbalance: 1,
          thdAverage: 2,
          powerFactor: 0.9,
        })
      ).toBeLessThan(4);
    });

    it('should penalize moderate voltage unbalance (>2%)', () => {
      expect(
        levelScore({
          voltageUnbalance: 3,
          currentUnbalance: 1,
          thdAverage: 2,
          powerFactor: 0.9,
        })
      ).toBeLessThan(5);
    });

    it('should penalize high current unbalance (>10%)', () => {
      expect(
        levelScore({
          voltageUnbalance: 1,
          currentUnbalance: 12,
          thdAverage: 2,
          powerFactor: 0.9,
        })
      ).toBeLessThan(4);
    });

    it('should penalize high THD (>8%)', () => {
      expect(
        levelScore({
          voltageUnbalance: 1,
          currentUnbalance: 1,
          thdAverage: 10,
          powerFactor: 0.9,
        })
      ).toBeLessThan(4);
    });

    it('should penalize low power factor (<0.8)', () => {
      expect(
        levelScore({
          voltageUnbalance: 1,
          currentUnbalance: 1,
          thdAverage: 2,
          powerFactor: 0.7,
        })
      ).toBeLessThan(4);
    });

    it('should return minimum score of 1', () => {
      expect(
        levelScore({
          voltageUnbalance: 10,
          currentUnbalance: 20,
          thdAverage: 15,
          powerFactor: 0.5,
        })
      ).toBeGreaterThanOrEqual(1);
    });

    it('should return maximum score of 5', () => {
      expect(
        levelScore({
          voltageUnbalance: 0,
          currentUnbalance: 0,
          thdAverage: 0,
          powerFactor: 0.98,
        })
      ).toBeLessThanOrEqual(5);
    });
  });

  describe('levelText', () => {
    it('should return Thai text for each health level', () => {
      expect(levelText(HealthLevel.Excellent)).toBe('ยอดเยี่ยม');
      expect(levelText(HealthLevel.Good)).toBe('ดี');
      expect(levelText(HealthLevel.Fair)).toBe('พอใช้');
      expect(levelText(HealthLevel.Poor)).toBe('แย่');
      expect(levelText(HealthLevel.Critical)).toBe('วิกฤต');
    });
  });

  describe('levelClass', () => {
    it('should return CSS class for each health level', () => {
      expect(levelClass(HealthLevel.Excellent)).toBe('health-excellent');
      expect(levelClass(HealthLevel.Good)).toBe('health-good');
      expect(levelClass(HealthLevel.Fair)).toBe('health-fair');
      expect(levelClass(HealthLevel.Poor)).toBe('health-poor');
      expect(levelClass(HealthLevel.Critical)).toBe('health-critical');
    });
  });

  describe('levelColor', () => {
    it('should return color code for each health level', () => {
      expect(levelColor(HealthLevel.Excellent)).toBe('#22c55e');
      expect(levelColor(HealthLevel.Good)).toBe('#84cc16');
      expect(levelColor(HealthLevel.Fair)).toBe('#eab308');
      expect(levelColor(HealthLevel.Poor)).toBe('#f97316');
      expect(levelColor(HealthLevel.Critical)).toBe('#ef4444');
    });
  });

  describe('calculatePowerQualityScore', () => {
    it('should calculate complete power quality score', () => {
      const result = calculatePowerQualityScore({
        voltages: [400, 400, 400],
        currents: [10, 10, 10],
        thdValues: [2, 2, 2],
        powerFactor: 0.95,
      });

      expect(result.score).toBe(5);
      expect(result.level).toBe(HealthLevel.Excellent);
      expect(result.details.voltageUnbalance).toBe(0);
      expect(result.details.currentUnbalance).toBe(0);
      expect(result.details.thdAverage).toBe(2);
    });

    it('should handle poor power quality', () => {
      const result = calculatePowerQualityScore({
        voltages: [400, 430, 370], // Highly unbalanced
        currents: [10, 14, 6], // Highly unbalanced
        thdValues: [8, 9, 10], // High THD
        powerFactor: 0.7, // Low power factor
      });

      expect(result.level).toBe(HealthLevel.Critical);
      expect(result.score).toBeLessThan(2);
    });

    it('should handle missing data gracefully', () => {
      const result = calculatePowerQualityScore({});

      expect(result.details.voltageUnbalance).toBe(0);
      expect(result.details.currentUnbalance).toBe(0);
      expect(result.details.thdAverage).toBe(0);
    });
  });
});
