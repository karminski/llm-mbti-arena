/**
 * Configuration management module
 * Handles loading and validating environment variables
 */

import { Config } from './types.js';

/**
 * Load configuration from environment variables
 * @returns Config object with API settings
 */
export function loadConfig(): Config {
  const apiUrl = (process.env.LLMMBIT_API || 'https://api.openai.com/v1').trim();
  const apiKey = (process.env.LLMMBIT_API_KEY || '').trim();
  const modelName = (process.env.LLMMBIT_API_MODEL || '').trim();

  return {
    apiUrl,
    apiKey,
    modelName,
  };
}

/**
 * Validate that all required configuration fields are present
 * @param config - Configuration object to validate
 * @throws Error with clear message if validation fails
 */
export function validateConfig(config: Config): void {
  const errors: string[] = [];

  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.push('LLMMBIT_API_KEY is required but not set');
  }

  if (!config.modelName || config.modelName.trim() === '') {
    errors.push('LLMMBIT_API_MODEL is required but not set');
  }

  if (!config.apiUrl || config.apiUrl.trim() === '') {
    errors.push('LLMMBIT_API is required but not set');
  }

  if (errors.length > 0) {
    const errorMessage = [
      'Configuration Error: Missing required environment variables',
      '',
      ...errors.map(err => `  ✗ ${err}`),
      '',
      'Please set the following environment variables:',
      '  export LLMMBIT_API_KEY="your-api-key"',
      '  export LLMMBIT_API_MODEL="openai/gpt-4o"',
      '  export LLMMBIT_API="https://api.openai.com/v1"  # Optional, defaults to OpenAI',
    ].join('\n');

    throw new Error(errorMessage);
  }
}
