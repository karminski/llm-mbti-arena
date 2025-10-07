/**
 * Core type definitions for llm-mbti-arena
 */

// MBTI dimension types
export type Dimension = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

// Choice structure for each question option
export interface Choice {
  value: Dimension;
  text: string;
}

// Question structure from the dataset
export interface Question {
  question: string;
  choice_a: Choice;
  choice_b: Choice;
}

// Configuration from environment variables
export interface Config {
  apiUrl: string;
  apiKey: string;
  modelName: string;
}

// Dimension scores tracking
export interface DimensionScores {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
}

// Personality result with scores and percentages
export interface PersonalityResult {
  scores: DimensionScores;
  percentages: {
    E_I: { E: number; I: number };
    S_N: { S: number; N: number };
    T_F: { T: number; F: number };
    J_P: { J: number; P: number };
  };
  type: string; // e.g., "ENFP"
}

// Individual answer record
export interface AnswerRecord {
  questionIndex: number;
  question: string;
  chosenOption: 'A' | 'B';
  dimension: Dimension;
}

// Complete test result
export interface TestResult {
  modelName: string;
  testTime: string;
  answers: AnswerRecord[];
  personalityResult: PersonalityResult;
}

// Progress state for rendering
export interface ProgressState {
  currentQuestion: number;
  totalQuestions: number;
  scores: DimensionScores;
  currentType: string;
}

// API client options
export interface APIClientOptions {
  apiUrl: string;
  apiKey: string;
  modelName: string;
  maxRetries?: number;
}

// Report options
export interface ReportOptions {
  format: 'console' | 'json';
  outputPath?: string;
}

// ============================================
// Visualization & Summary Types
// ============================================

// Benchmark result structure (from JSON files)
export interface BenchmarkResult {
  modelName: string;
  testTime: string;
  personalityType: string;
  percentages: {
    E_I: { E: number; I: number };
    S_N: { S: number; N: number };
    T_F: { T: number; F: number };
    J_P: { J: number; P: number };
  };
  answers?: Array<{
    questionIndex: number;
    question: string;
    chosenOption: 'A' | 'B';
    dimension: string;
  }>;
}

// Model summary for visualization
export interface ModelSummary {
  modelName: string;
  provider: string;
  personalityType: string;
  testTime: string;
  dimensions: {
    E: number;
    I: number;
    S: number;
    N: number;
    T: number;
    F: number;
    J: number;
    P: number;
  };
  filePath?: string;
}

// Summary data structure
export interface SummaryData {
  generatedAt: string;
  totalModels: number;
  models: ModelSummary[];
  mbtiDistribution: Record<string, number>;
  providerDistribution: Record<string, number>;
}

// Filter options for HTML page
export interface Filters {
  mbtiType?: string;
  provider?: string;
  search?: string;
}

// Chart configuration
export interface ChartConfig {
  width: number;
  height: number;
  backgroundColor: string;
  chartType: 'radar' | 'scatter';
}
