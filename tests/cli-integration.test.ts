/**
 * CLI Integration Tests
 * Tests the main CLI entry point functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';

describe('CLI Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  it('should display help when no arguments provided', async () => {
    const output = await runCLI([]);
    expect(output).toContain('Usage: llmmbtibenchmark');
    expect(output).toContain('A CLI tool for testing LLM personality types');
    expect(output).toContain('--bench');
    expect(output).toContain('--json-report');
  });

  it('should display help with --help flag', async () => {
    const output = await runCLI(['--help']);
    expect(output).toContain('Usage: llmmbtibenchmark');
    expect(output).toContain('Environment Variables:');
    expect(output).toContain('LLMMBIT_API_KEY');
    expect(output).toContain('LLMMBIT_API_MODEL');
  });

  it('should display version with --version flag', async () => {
    const output = await runCLI(['--version']);
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it('should show configuration error when env vars missing', async () => {
    const { output, exitCode } = await runCLIWithExitCode(['--bench']);
    expect(output).toContain('Configuration Error');
    expect(output).toContain('LLMMBIT_API_KEY is required');
    expect(output).toContain('LLMMBIT_API_MODEL is required');
    expect(exitCode).toBe(1);
  });

  it('should show file error when questions file missing', async () => {
    // This test would require mocking the file system
    // Skipping for now as it requires more complex setup
  });
});

/**
 * Helper function to run CLI and capture output
 */
function runCLI(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['--import', 'tsx', 'src/main.ts', ...args], {
      cwd: process.cwd(),
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      // Combine stdout and stderr for help/error messages
      resolve(output + errorOutput);
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Helper function to run CLI and capture output with exit code
 */
function runCLIWithExitCode(args: string[]): Promise<{ output: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['--import', 'tsx', 'src/main.ts', ...args], {
      cwd: process.cwd(),
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        output: output + errorOutput,
        exitCode: code || 0,
      });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}
