import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { loadBenchmarkResults, extractProvider } from '../scripts/lib/data-loader.js';

describe('Data Loader Module', () => {
  let testDir: string;
  
  beforeEach(() => {
    // Create unique test directory for each test
    testDir = `test-benchmark-results-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      try {
        const files = fs.readdirSync(testDir);
        files.forEach(file => {
          const filePath = path.join(testDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
        fs.rmdirSync(testDir);
      } catch (error) {
        // Ignore cleanup errors
        console.warn(`Failed to clean up ${testDir}:`, error);
      }
    }
  });

  describe('extractProvider', () => {
    it('should extract provider from slash-separated format', () => {
      expect(extractProvider('openai/gpt-4o-mini')).toBe('openai');
      expect(extractProvider('anthropic/claude-3.5-sonnet')).toBe('anthropic');
      expect(extractProvider('google/gemini-2.5-pro')).toBe('google');
    });

    it('should extract provider from underscore-separated format', () => {
      expect(extractProvider('openai_gpt-4o-mini')).toBe('openai');
      expect(extractProvider('deepseek_deepseek-chat')).toBe('deepseek');
      expect(extractProvider('x-ai_grok-3')).toBe('x-ai');
    });

    it('should handle model names without separators', () => {
      expect(extractProvider('gpt4')).toBe('gpt4');
      expect(extractProvider('claude')).toBe('claude');
    });

    it('should prioritize slash over underscore', () => {
      expect(extractProvider('openai/gpt_4o_mini')).toBe('openai');
    });

    it('should handle empty strings', () => {
      expect(extractProvider('')).toBe('');
    });

    it('should handle complex provider names', () => {
      expect(extractProvider('meta-llama/llama-3.3-70b')).toBe('meta-llama');
      expect(extractProvider('mistralai_mistral-medium-3.1')).toBe('mistralai');
    });
  });

  describe('loadBenchmarkResults', () => {
    it('should load valid JSON files successfully', async () => {
      // Create valid test file
      const validData = {
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
        path.join(testDir, 'test-model.json'),
        JSON.stringify(validData, null, 2)
      );
      
      const results = await loadBenchmarkResults(testDir);
      
      expect(results).toHaveLength(1);
      expect(results[0].modelName).toBe('openai/gpt-4o-mini');
      expect(results[0].personalityType).toBe('ENTJ');
      expect(results[0].percentages.E_I.E).toBe(67);
    });

    it('should load multiple valid JSON files', async () => {
      // Create multiple valid test files
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
        }
      ];
      
      models.forEach((model, index) => {
        fs.writeFileSync(
          path.join(testDir, `model-${index}.json`),
          JSON.stringify(model, null, 2)
        );
      });
      
      const results = await loadBenchmarkResults(testDir);
      
      expect(results).toHaveLength(2);
      expect(results[0].modelName).toBe('openai/gpt-4o-mini');
      expect(results[1].modelName).toBe('anthropic/claude-3.5-sonnet');
    });

    it('should skip invalid JSON files and continue processing', async () => {
      // Create one valid and one invalid file
      const validData = {
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
        path.join(testDir, 'valid.json'),
        JSON.stringify(validData, null, 2)
      );
      
      fs.writeFileSync(
        path.join(testDir, 'invalid.json'),
        'This is not valid JSON {'
      );
      
      const results = await loadBenchmarkResults(testDir);
      
      expect(results).toHaveLength(1);
      expect(results[0].modelName).toBe('openai/gpt-4o-mini');
    });

    it('should skip files with missing required fields', async () => {
      // Missing modelName
      const missingModelName = {
        testTime: '2025-10-07T13:26:08.874Z',
        personalityType: 'ENTJ',
        percentages: {
          E_I: { E: 67, I: 33 },
          S_N: { S: 42, N: 58 },
          T_F: { T: 71, F: 29 },
          J_P: { J: 64, P: 36 }
        }
      };
      
      // Missing percentages
      const missingPercentages = {
        modelName: 'test/model',
        testTime: '2025-10-07T13:26:08.874Z',
        personalityType: 'ENTJ'
      };
      
      // Valid data
      const validData = {
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
        path.join(testDir, 'missing-model-name.json'),
        JSON.stringify(missingModelName, null, 2)
      );
      
      fs.writeFileSync(
        path.join(testDir, 'missing-percentages.json'),
        JSON.stringify(missingPercentages, null, 2)
      );
      
      fs.writeFileSync(
        path.join(testDir, 'valid.json'),
        JSON.stringify(validData, null, 2)
      );
      
      const results = await loadBenchmarkResults(testDir);
      
      expect(results).toHaveLength(1);
      expect(results[0].modelName).toBe('openai/gpt-4o-mini');
    });

    it('should skip files with incomplete percentages structure', async () => {
      // Missing E_I dimension
      const incompletePercentages = {
        modelName: 'test/model',
        testTime: '2025-10-07T13:26:08.874Z',
        personalityType: 'ENTJ',
        percentages: {
          S_N: { S: 42, N: 58 },
          T_F: { T: 71, F: 29 },
          J_P: { J: 64, P: 36 }
        }
      };
      
      fs.writeFileSync(
        path.join(testDir, 'incomplete.json'),
        JSON.stringify(incompletePercentages, null, 2)
      );
      
      const results = await loadBenchmarkResults(testDir);
      
      expect(results).toHaveLength(0);
    });

    it('should return empty array for non-existent directory', async () => {
      const results = await loadBenchmarkResults('non-existent-directory');
      
      expect(results).toHaveLength(0);
    });

    it('should return empty array for directory with no JSON files', async () => {
      // Create a text file instead of JSON
      fs.writeFileSync(path.join(testDir, 'readme.txt'), 'This is not a JSON file');
      
      const results = await loadBenchmarkResults(testDir);
      
      expect(results).toHaveLength(0);
    });

    it('should handle files with optional answers field', async () => {
      const dataWithAnswers = {
        modelName: 'openai/gpt-4o-mini',
        testTime: '2025-10-07T13:26:08.874Z',
        personalityType: 'ENTJ',
        percentages: {
          E_I: { E: 67, I: 33 },
          S_N: { S: 42, N: 58 },
          T_F: { T: 71, F: 29 },
          J_P: { J: 64, P: 36 }
        },
        answers: [
          {
            questionIndex: 0,
            question: 'Test question',
            chosenOption: 'A',
            dimension: 'E'
          }
        ]
      };
      
      fs.writeFileSync(
        path.join(testDir, 'with-answers.json'),
        JSON.stringify(dataWithAnswers, null, 2)
      );
      
      const results = await loadBenchmarkResults(testDir);
      
      expect(results).toHaveLength(1);
      expect(results[0].answers).toBeDefined();
      expect(results[0].answers).toHaveLength(1);
    });

    it('should handle files with wrong data types', async () => {
      const wrongTypes = {
        modelName: 123, // Should be string
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
        path.join(testDir, 'wrong-types.json'),
        JSON.stringify(wrongTypes, null, 2)
      );
      
      const results = await loadBenchmarkResults(testDir);
      
      expect(results).toHaveLength(0);
    });
  });
});
