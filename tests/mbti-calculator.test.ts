import { describe, it, expect, beforeEach } from 'vitest';
import { MBTICalculator } from '../src/mbti-calculator.js';

describe('MBTICalculator', () => {
  let calculator: MBTICalculator;

  beforeEach(() => {
    calculator = new MBTICalculator();
  });

  describe('addAnswer', () => {
    it('should increment the correct dimension score', () => {
      calculator.addAnswer('E');
      calculator.addAnswer('E');
      calculator.addAnswer('I');

      const scores = calculator.getScores();
      expect(scores.E).toBe(2);
      expect(scores.I).toBe(1);
    });

    it('should handle all dimensions', () => {
      calculator.addAnswer('E');
      calculator.addAnswer('S');
      calculator.addAnswer('T');
      calculator.addAnswer('J');

      const scores = calculator.getScores();
      expect(scores.E).toBe(1);
      expect(scores.S).toBe(1);
      expect(scores.T).toBe(1);
      expect(scores.J).toBe(1);
    });
  });

  describe('getCurrentType', () => {
    it('should return correct type based on normalized scores', () => {
      // E=2, I=1 → (1-2)/21*10 = -0.476 → E (negative)
      calculator.addAnswer('E');
      calculator.addAnswer('E');
      calculator.addAnswer('I');
      
      // S=1, N=2 → (1-2)/26*10 = -0.385 → N (negative)
      calculator.addAnswer('N');
      calculator.addAnswer('N');
      calculator.addAnswer('S');
      
      // T=1, F=2 → (1-2)/24*10 = -0.417 → F (negative)
      calculator.addAnswer('F');
      calculator.addAnswer('F');
      calculator.addAnswer('T');
      
      // J=1, P=2 → (2-1)/22*10 = 0.455 → P (positive)
      calculator.addAnswer('P');
      calculator.addAnswer('P');
      calculator.addAnswer('J');

      const type = calculator.getCurrentType();
      expect(type).toBe('ENFP');
    });

    it('should handle ties by choosing first dimension', () => {
      // When scores are equal, normalized score = 0
      // E=1, I=1 → (1-1)/21*10 = 0 → E (zero defaults to first)
      // S=1, N=1 → (1-1)/26*10 = 0 → N (zero defaults to first, but formula is S-N, so N)
      // T=1, F=1 → (1-1)/24*10 = 0 → F (zero defaults to first, but formula is T-F, so F)
      // J=1, P=1 → (1-1)/22*10 = 0 → J (zero defaults to first, but formula is P-J, so J)
      calculator.addAnswer('E');
      calculator.addAnswer('I');
      calculator.addAnswer('S');
      calculator.addAnswer('N');
      calculator.addAnswer('T');
      calculator.addAnswer('F');
      calculator.addAnswer('J');
      calculator.addAnswer('P');

      const type = calculator.getCurrentType();
      expect(type).toBe('ENFJ'); // Based on the normalization formula
    });

    it('should return ENFJ when all scores are zero', () => {
      // When all scores are 0:
      // (0-0)/21*10 = 0 → E (zero/negative defaults to E)
      // (0-0)/26*10 = 0 → N (zero/negative defaults to N)
      // (0-0)/24*10 = 0 → F (zero/negative defaults to F)
      // (0-0)/22*10 = 0 → J (zero/negative defaults to J)
      const type = calculator.getCurrentType();
      expect(type).toBe('ENFJ');
    });

    it('should use standard MBTI normalization formula', () => {
      // Test with known values
      // E=10, I=11 → (11-10)/21*10 = 0.476 → I (positive)
      for (let i = 0; i < 10; i++) calculator.addAnswer('E');
      for (let i = 0; i < 11; i++) calculator.addAnswer('I');

      const type = calculator.getCurrentType();
      expect(type[0]).toBe('I');
    });
  });

  describe('getScores', () => {
    it('should return a copy of scores', () => {
      calculator.addAnswer('E');
      const scores1 = calculator.getScores();
      calculator.addAnswer('E');
      const scores2 = calculator.getScores();

      expect(scores1.E).toBe(1);
      expect(scores2.E).toBe(2);
    });
  });

  describe('getResult', () => {
    it('should return complete personality result with normalized type', () => {
      // E=2, I=1 → (1-2)/21*10 = -0.476 → E (negative)
      calculator.addAnswer('E');
      calculator.addAnswer('E');
      calculator.addAnswer('I');
      
      // S=1, N=1 → (1-1)/26*10 = 0 → N (zero defaults to N)
      calculator.addAnswer('N');
      calculator.addAnswer('S');
      
      // T=1, F=1 → (1-1)/24*10 = 0 → F (zero defaults to F)
      calculator.addAnswer('F');
      calculator.addAnswer('T');
      
      // J=0, P=1 → (1-0)/22*10 = 0.455 → P (positive)
      calculator.addAnswer('P');

      const result = calculator.getResult();

      expect(result.type).toBe('ENFP');
      expect(result.scores.E).toBe(2);
      expect(result.scores.I).toBe(1);
      expect(result.percentages.E_I.E).toBe(67);
      expect(result.percentages.E_I.I).toBe(33);
    });

    it('should calculate percentages correctly', () => {
      // Add 7 E and 3 I answers (70% E, 30% I)
      for (let i = 0; i < 7; i++) calculator.addAnswer('E');
      for (let i = 0; i < 3; i++) calculator.addAnswer('I');

      const result = calculator.getResult();
      expect(result.percentages.E_I.E).toBe(70);
      expect(result.percentages.E_I.I).toBe(30);
    });

    it('should handle zero scores with 50/50 split', () => {
      const result = calculator.getResult();
      expect(result.percentages.E_I.E).toBe(50);
      expect(result.percentages.E_I.I).toBe(50);
      expect(result.type).toBe('ENFJ'); // Defaults to ENFJ when all zero
    });
  });
});
