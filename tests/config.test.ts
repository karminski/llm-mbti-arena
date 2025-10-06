/**
 * Tests for configuration management module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, validateConfig } from '../src/config.js';

describe('Configuration Management', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('should load configuration from environment variables', () => {
      process.env.LLMMBIT_API = 'https://test.api.com/v1';
      process.env.LLMMBIT_API_KEY = 'test-key-123';
      process.env.LLMMBIT_API_MODEL = 'test-model';

      const config = loadConfig();

      expect(config.apiUrl).toBe('https://test.api.com/v1');
      expect(config.apiKey).toBe('test-key-123');
      expect(config.modelName).toBe('test-model');
    });

    it('should use default API URL when not set', () => {
      process.env.LLMMBIT_API_KEY = 'test-key';
      process.env.LLMMBIT_API_MODEL = 'test-model';
      delete process.env.LLMMBIT_API;

      const config = loadConfig();

      expect(config.apiUrl).toBe('https://api.openai.com/v1');
    });

    it('should return empty strings for missing required variables', () => {
      delete process.env.LLMMBIT_API_KEY;
      delete process.env.LLMMBIT_API_MODEL;

      const config = loadConfig();

      expect(config.apiKey).toBe('');
      expect(config.modelName).toBe('');
    });
  });

  describe('validateConfig', () => {
    it('should pass validation with all required fields', () => {
      const config = {
        apiUrl: 'https://api.openai.com/v1',
        apiKey: 'test-key',
        modelName: 'gpt-4',
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should throw error when API key is missing', () => {
      const config = {
        apiUrl: 'https://api.openai.com/v1',
        apiKey: '',
        modelName: 'gpt-4',
      };

      expect(() => validateConfig(config)).toThrow('LLMMBIT_API_KEY is required');
    });

    it('should throw error when model name is missing', () => {
      const config = {
        apiUrl: 'https://api.openai.com/v1',
        apiKey: 'test-key',
        modelName: '',
      };

      expect(() => validateConfig(config)).toThrow('LLMMBIT_API_MODEL is required');
    });

    it('should throw error when API URL is missing', () => {
      const config = {
        apiUrl: '',
        apiKey: 'test-key',
        modelName: 'gpt-4',
      };

      expect(() => validateConfig(config)).toThrow('LLMMBIT_API is required');
    });

    it('should throw error with helpful message for multiple missing fields', () => {
      const config = {
        apiUrl: 'https://api.openai.com/v1',
        apiKey: '',
        modelName: '',
      };

      expect(() => validateConfig(config)).toThrow('Configuration Error');
      expect(() => validateConfig(config)).toThrow('LLMMBIT_API_KEY');
      expect(() => validateConfig(config)).toThrow('LLMMBIT_API_MODEL');
    });

    it('should reject whitespace-only values', () => {
      const config = {
        apiUrl: 'https://api.openai.com/v1',
        apiKey: '   ',
        modelName: 'gpt-4',
      };

      expect(() => validateConfig(config)).toThrow('LLMMBIT_API_KEY is required');
    });
  });
});
