/**
 * MBTI Calculator Module
 * Handles score accumulation and personality type calculation
 */

import type { Dimension, DimensionScores, PersonalityResult } from './types.js';

export class MBTICalculator {
  private scores: DimensionScores;

  constructor() {
    // Initialize all dimension scores to 0
    this.scores = {
      E: 0,
      I: 0,
      S: 0,
      N: 0,
      T: 0,
      F: 0,
      J: 0,
      P: 0,
    };
  }

  /**
   * Add an answer by incrementing the corresponding dimension score
   * @param dimension - The MBTI dimension to increment (E, I, S, N, T, F, J, P)
   */
  addAnswer(dimension: Dimension): void {
    this.scores[dimension]++;
  }

  /**
   * Calculate the current personality type based on accumulated scores
   * Uses standard MBTI formula for normalization:
   * - E/I: (I - E) / 21 * 10
   * - S/N: (S - N) / 26 * 10
   * - T/F: (T - F) / 24 * 10
   * - J/P: (P - J) / 22 * 10
   * 
   * Positive score means second dimension (I, N, F, P)
   * Negative score means first dimension (E, S, T, J)
   * Zero score defaults to first dimension (E, S, T, J)
   * 
   * @returns Four-letter personality type (e.g., "ENFP")
   */
  getCurrentType(): string {
    // Calculate normalized scores using standard MBTI formula
    const normalizedEI = (this.scores.I - this.scores.E) / 21 * 10;
    const normalizedSN = (this.scores.S - this.scores.N) / 26 * 10;
    const normalizedTF = (this.scores.T - this.scores.F) / 24 * 10;
    const normalizedJP = (this.scores.P - this.scores.J) / 22 * 10;

    const type = [
      normalizedEI > 0 ? 'I' : 'E',  // Positive = I, Negative/Zero = E
      normalizedSN > 0 ? 'S' : 'N',  // Positive = S, Negative/Zero = N
      normalizedTF > 0 ? 'T' : 'F',  // Positive = T, Negative/Zero = F
      normalizedJP > 0 ? 'P' : 'J',  // Positive = P, Negative/Zero = J
    ].join('');

    return type;
  }

  /**
   * Get the current dimension scores
   * @returns Copy of current scores
   */
  getScores(): DimensionScores {
    return { ...this.scores };
  }

  /**
   * Generate complete personality result with scores, percentages, and type
   * @returns PersonalityResult object
   */
  getResult(): PersonalityResult {
    const percentages = this.calculatePercentages();

    return {
      scores: this.getScores(),
      percentages,
      type: this.getCurrentType(),
    };
  }

  /**
   * Calculate percentages for each dimension pair
   * Formula: dimension% = dimension / (dimension + opposite) * 100
   * @returns Percentage object for all four dimension pairs
   */
  private calculatePercentages(): PersonalityResult['percentages'] {
    const calculatePair = (a: number, b: number): { a: number; b: number } => {
      const total = a + b;
      if (total === 0) {
        return { a: 50, b: 50 };
      }
      return {
        a: Math.round((a / total) * 100),
        b: Math.round((b / total) * 100),
      };
    };

    const E_I = calculatePair(this.scores.E, this.scores.I);
    const S_N = calculatePair(this.scores.S, this.scores.N);
    const T_F = calculatePair(this.scores.T, this.scores.F);
    const J_P = calculatePair(this.scores.J, this.scores.P);

    return {
      E_I: { E: E_I.a, I: E_I.b },
      S_N: { S: S_N.a, N: S_N.b },
      T_F: { T: T_F.a, F: T_F.b },
      J_P: { J: J_P.a, P: J_P.b },
    };
  }
}
