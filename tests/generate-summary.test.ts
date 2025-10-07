import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { generateSummary } from '../scripts/generate-summary.js';

describe('Generate Summary Module', () => {
  let testBenchmarkDir: string;
  let testOutputDir: string;
  let testOutputPath: string;
  
  beforeEach(() => {
    // Create unique test directories for each test
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    testBenchmarkDir = `test-benchmark-results-${uniqueId}`;
    testOutputDir = `test-assets-${uniqueId}/data`;
    testOutputPath = path.join(testOutputDir, 'summary.json');
    
    if (!fs.existsSync(testBenchmarkDir)) {
      fs.mkdirSync(testBenchmarkDir, { recursive: true });
    }
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });
  
  afterEach(() => {
    // Clean up test directories
    try {
      if (fs.existsSync(testBenchmarkDir)) {
        const files = fs.readdirSync(testBenchmarkDir);
        files.forEach(file => {
          const filePath = path.join(testBenchmarkDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
        fs.rmdirSync(testBenchmarkDir);
      }
      
      if (fs.existsSync(testOutputPath)) {
        fs.unlinkSync(testOutputPath);
      }
      
      const outputDirParent = path.dirname(testOutputDir);
      if (fs.existsSync(testOutputDir)) {
        fs.rmdirSync(testOutputDir);
      }
      if (fs.existsSync(outputDirParent)) {
        fs.rmdirSync(outputDirParent);
      }
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Failed to clean up test directories:', error);
    }
  });

  describe('generateSummary', () => {
    it('should generate summary with correct structure', async () => {
      // Create test benchmark result
      const testData = {
        modelName: 'openai/gpt-4o-mini',
        testTime: '2025-10-07T13:26:08.874Z',
        personalityType: 'ENTJ',
        percentages: {
          E_I: { E: 67, I: 33 },
          S_N: { S: 42, N: 58 },
          T_F: { T: 71, F: 29 },
          J_P: { J: 64, P: 36 }
        }
      };
      
      fs.writeFileSync(
        path.join(testBenchmarkDir, 'test-model.json'),
        JSON.stringify(testData, null, 2)
      );
      
      await generateSummary(testBenchmarkDir, testOutputPath);
      
      // Read generated summary
      const summaryContent = fs.readFileSync(testOutputPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      
      // Verify structure
      expect(summary).toHaveProperty('generatedAt');
      expect(summary).toHaveProperty('totalModels');
      expect(summary).toHaveProperty('models');
      expect(summary).toHaveProperty('mbtiDistribution');
      expect(summary).toHaveProperty('providerDistribution');
      
      // Verify types
      expect(typeof summary.generatedAt).toBe('string');
      expect(typeof summary.totalModels).toBe('number');
      expect(Array.isArray(summary.models)).toBe(true);
      expect(typeof summary.mbtiDistribution).toBe('object');
      expect(typeof summary.providerDistribution).toBe('object');
    });

    it('should correctly convert benchmark results to model summaries', async () => {
      const testData = {
        modelName: 'openai/gpt-4o-mini',
        testTime: '2025-10-07T13:26:08.874Z',
        personalityType: 'ENTJ',
        percentages: {
          E_I: { E: 67, I: 33 },
          S_N: { S: 42, N: 58 },
          T_F: { T: 71, F: 29 },
          J_P: { J: 64, P: 36 }
        }
      };
      
      fs.writeFileSync(
        path.join(testBenchmarkDir, 'test-model.json'),
        JSON.stringify(testData, null, 2)
      );
      
      await generateSummary(testBenchmarkDir, testOutputPath);
      
      const summaryContent = fs.readFileSync(testOutputPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      
      expect(summary.models).toHaveLength(1);
      
      const model = summary.models[0];
      expect(model.modelName).toBe('openai/gpt-4o-mini');
      expect(model.provider).toBe('openai');
      expect(model.personalityType).toBe('ENTJ');
      expect(model.testTime).toBe('2025-10-07T13:26:08.874Z');
      
      // Verify dimensions are correctly extracted
      expect(model.dimensions.E).toBe(67);
      expect(model.dimensions.I).toBe(33);
      expect(model.dimensions.S).toBe(42);
      expect(model.dimensions.N).toBe(58);
      expect(model.dimensions.T).toBe(71);
      expect(model.dimensions.F).toBe(29);
      expect(model.dimensions.J).toBe(64);
      expect(model.dimensions.P).toBe(36);
    });

    it('should calculate MBTI distribution correctly', async () => {
      // Create multiple models with different MBTI types
      const models = [
        {
          modelName: 'openai/gpt-4o-mini',
          testTime: '2025-10-07T13:26:08.874Z',
          personalityType: 'ENTJ',
          percentages: {
            E_I: { E: 67, I: 33 },
            S_N: { S: 42, N: 58 },
            T_F: { T: 71, F: 29 },
            J_P: { J: 64, P: 36 }
          }
        },
        {
          modelName: 'anthropic/claude-3.5-sonnet',
          testTime: '2025-10-07T13:27:18.859Z',
          personalityType: 'INFP',
          percentages: {
            E_I: { E: 33, I: 67 },
            S_N: { S: 38, N: 62 },
            T_F: { T: 46, F: 54 },
            J_P: { J: 41, P: 59 }
          }
        },
        {
          modelName: 'google/gemini-2.5-pro',
          testTime: '2025-10-07T15:56:17.378Z',
          personalityType: 'ENTJ',
          percentages: {
            E_I: { E: 62, I: 38 },
            S_N: { S: 46, N: 54 },
            T_F: { T: 67, F: 33 },
            J_P: { J: 59, P: 41 }
          }
        }
      ];
      
      models.forEach((model, index) => {
        fs.writeFileSync(
          path.join(testBenchmarkDir, `model-${index}.json`),
          JSON.stringify(model, null, 2)
        );
      });
      
      await generateSummary(testBenchmarkDir, testOutputPath);
      
      const summaryContent = fs.readFileSync(testOutputPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      
      expect(summary.mbtiDistribution).toEqual({
        ENTJ: 2,
        INFP: 1
      });
    });

    it('should calculate provider distribution correctly', async () => {
      const models = [
        {
          modelName: 'openai/gpt-4o-mini',
          testTime: '2025-10-07T13:26:08.874Z',
          personalityType: 'ENTJ',
          percentages: {
            E_I: { E: 67, I: 33 },
            S_N: { S: 42, N: 58 },
            T_F: { T: 71, F: 29 },
            J_P: { J: 64, P: 36 }
          }
        },
        {
          modelName: 'openai/gpt-5-pro',
          testTime: '2025-10-07T17:21:34.587Z',
          personalityType: 'ENTJ',
          percentages: {
            E_I: { E: 71, I: 29 },
            S_N: { S: 38, N: 62 },
            T_F: { T: 75, F: 25 },
            J_P: { J: 68, P: 32 }
          }
        },
        {
          modelName: 'anthropic/claude-3.5-sonnet',
          testTime: '2025-10-07T13:27:18.859Z',
          personalityType: 'INFP',
          percentages: {
            E_I: { E: 33, I: 67 },
            S_N: { S: 38, N: 62 },
            T_F: { T: 46, F: 54 },
            J_P: { J: 41, P: 59 }
          }
        }
      ];
      
      models.forEach((model, index) => {
        fs.writeFileSync(
          path.join(testBenchmarkDir, `model-${index}.json`),
          JSON.stringify(model, null, 2)
        );
      });
      
      await generateSummary(testBenchmarkDir, testOutputPath);
      
      const summaryContent = fs.readFileSync(testOutputPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      
      expect(summary.providerDistribution).toEqual({
        openai: 2,
        anthropic: 1
      });
    });

    it('should set totalModels correctly', async () => {
      const models = [
        {
          modelName: 'openai/gpt-4o-mini',
          testTime: '2025-10-07T13:26:08.874Z',
          personalityType: 'ENTJ',
          percentages: {
            E_I: { E: 67, I: 33 },
            S_N: { S: 42, N: 58 },
            T_F: { T: 71, F: 29 },
            J_P: { J: 64, P: 36 }
          }
        },
        {
          modelName: 'anthropic/claude-3.5-sonnet',
          testTime: '2025-10-07T13:27:18.859Z',
          personalityType: 'INFP',
          percentages: {
            E_I: { E: 33, I: 67 },
            S_N: { S: 38, N: 62 },
            T_F: { T: 46, F: 54 },
            J_P: { J: 41, P: 59 }
          }
        },
        {
          modelName: 'google/gemini-2.5-pro',
          testTime: '2025-10-07T15:56:17.378Z',
          personalityType: 'ENTJ',
          percentages: {
            E_I: { E: 62, I: 38 },
            S_N: { S: 46, N: 54 },
            T_F: { T: 67, F: 33 },
            J_P: { J: 59, P: 41 }
          }
        }
      ];
      
      models.forEach((model, index) => {
        fs.writeFileSync(
          path.join(testBenchmarkDir, `model-${index}.json`),
          JSON.stringify(model, null, 2)
        );
      });
      
      await generateSummary(testBenchmarkDir, testOutputPath);
      
      const summaryContent = fs.readFileSync(testOutputPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      
      expect(summary.totalModels).toBe(3);
      expect(summary.models).toHaveLength(3);
    });

    it('should handle empty benchmark directory', async () => {
      await generateSummary(testBenchmarkDir, testOutputPath);
      
      const summaryContent = fs.readFileSync(testOutputPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      
      expect(summary.totalModels).toBe(0);
      expect(summary.models).toHaveLength(0);
      expect(summary.mbtiDistribution).toEqual({});
      expect(summary.providerDistribution).toEqual({});
    });

    it('should create output directory if it does not exist', async () => {
      const testData = {
        modelName: 'openai/gpt-4o-mini',
        testTime: '2025-10-07T13:26:08.874Z',
        personalityType: 'ENTJ',
        percentages: {
          E_I: { E: 67, I: 33 },
          S_N: { S: 42, N: 58 },
          T_F: { T: 71, F: 29 },
          J_P: { J: 64, P: 36 }
        }
      };
      
      fs.writeFileSync(
        path.join(testBenchmarkDir, 'test-model.json'),
        JSON.stringify(testData, null, 2)
      );
      
      // Remove output directory if it exists
      if (fs.existsSync(testOutputDir)) {
        fs.rmSync(testOutputDir, { recursive: true });
      }
      
      await generateSummary(testBenchmarkDir, testOutputPath);
      
      expect(fs.existsSync(testOutputDir)).toBe(true);
      expect(fs.existsSync(testOutputPath)).toBe(true);
    });

    it('should generate valid ISO 8601 timestamp for generatedAt', async () => {
      const testData = {
        modelName: 'openai/gpt-4o-mini',
        testTime: '2025-10-07T13:26:08.874Z',
        personalityType: 'ENTJ',
        percentages: {
          E_I: { E: 67, I: 33 },
          S_N: { S: 42, N: 58 },
          T_F: { T: 71, F: 29 },
          J_P: { J: 64, P: 36 }
        }
      };
      
      fs.writeFileSync(
        path.join(testBenchmarkDir, 'test-model.json'),
        JSON.stringify(testData, null, 2)
      );
      
      await generateSummary(testBenchmarkDir, testOutputPath);
      
      const summaryContent = fs.readFileSync(testOutputPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      
      // Verify it's a valid ISO 8601 timestamp
      const timestamp = new Date(summary.generatedAt);
      expect(timestamp.toISOString()).toBe(summary.generatedAt);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });

    it('should include filePath in model summaries', async () => {
      const testData = {
        modelName: 'openai/gpt-4o-mini',
        testTime: '2025-10-07T13:26:08.874Z',
        personalityType: 'ENTJ',
        percentages: {
          E_I: { E: 67, I: 33 },
          S_N: { S: 42, N: 58 },
          T_F: { T: 71, F: 29 },
          J_P: { J: 64, P: 36 }
        }
      };
      
      fs.writeFileSync(
        path.join(testBenchmarkDir, 'test-model.json'),
        JSON.stringify(testData, null, 2)
      );
      
      await generateSummary(testBenchmarkDir, testOutputPath);
      
      const summaryContent = fs.readFileSync(testOutputPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      
      expect(summary.models[0]).toHaveProperty('filePath');
      expect(summary.models[0].filePath).toContain(testBenchmarkDir);
      expect(summary.models[0].filePath).toContain('.json');
    });

    it('should handle models with underscore-separated names', async () => {
      const testData = {
        modelName: 'deepseek_deepseek-chat-v3.1',
        testTime: '2025-10-07T13:40:23.993Z',
        personalityType: 'INTJ',
        percentages: {
          E_I: { E: 38, I: 62 },
          S_N: { S: 35, N: 65 },
          T_F: { T: 79, F: 21 },
          J_P: { J: 55, P: 45 }
        }
      };
      
      fs.writeFileSync(
        path.join(testBenchmarkDir, 'deepseek_model.json'),
        JSON.stringify(testData, null, 2)
      );
      
      await generateSummary(testBenchmarkDir, testOutputPath);
      
      const summaryContent = fs.readFileSync(testOutputPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      
      expect(summary.models[0].provider).toBe('deepseek');
    });
  });
});
