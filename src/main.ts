#!/usr/bin/env node

/**
 * CLI Entry Point for llm-mbti-arena
 * Coordinates all modules and handles command-line interface
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, validateConfig } from './config.js';
import { loadQuestions } from './question-loader.js';
import { APIClient } from './api-client.js';
import { MBTICalculator } from './mbti-calculator.js';
import { ProgressRenderer } from './progress-renderer.js';
import { TestRunner } from './test-runner.js';
import { Reporter } from './reporter.js';

/**
 * Main function to run the CLI application
 */
async function main() {
  const program = new Command();

  program
    .name('llmmbtibenchmark')
    .description('A CLI tool for testing LLM personality types using MBTI')
    .version('1.0.0');

  program
    .option('--bench', 'Run the MBTI benchmark test')
    .option('--json-report', 'Output test results in JSON format')
    .option('-c, --concurrency <number>', 'Number of concurrent requests (default: 5)', '5')
    .option('-r, --retries <number>', 'Number of retries on API failure (default: 3)', '3')
    .helpOption('--help', 'Display help information');

  // Add help text
  program.addHelpText('after', `

Environment Variables:
  LLMMBIT_API_KEY      API key for authentication (required)
  LLMMBIT_API_MODEL    Model name to test (e.g., "openai/gpt-4o") (required)
  LLMMBIT_API          API base URL (default: https://api.openai.com/v1)

Examples:
  $ export LLMMBIT_API_KEY="your-api-key"
  $ export LLMMBIT_API_MODEL="openai/gpt-4o"
  $ llmmbtibenchmark --bench
  $ llmmbtibenchmark --bench --json-report
  $ llmmbtibenchmark --bench --concurrency 10
  $ llmmbtibenchmark --bench -c 3
  $ llmmbtibenchmark --bench --retries 5
  $ llmmbtibenchmark --bench -r 5 -c 10
`);

  program.parse(process.argv);

  const options = program.opts();

  // If no arguments provided, show help
  if (process.argv.length === 2) {
    program.help();
    return;
  }

  // Handle --bench option
  if (options.bench) {
    try {
      const concurrency = parseInt(options.concurrency, 10);
      if (isNaN(concurrency) || concurrency < 1) {
        throw new Error('Concurrency must be a positive integer');
      }
      const retries = parseInt(options.retries, 10);
      if (isNaN(retries) || retries < 1) {
        throw new Error('Retries must be a positive integer');
      }
      await runBenchmark(options.jsonReport, concurrency, retries);
    } catch (error) {
      handleError(error);
      process.exit(1);
    }
  } else {
    // No valid command provided
    program.help();
  }
}

/**
 * Run the MBTI benchmark test
 */
async function runBenchmark(jsonReport: boolean = false, concurrency: number = 5, retries: number = 3) {
  // Load and validate configuration
  console.error(chalk.gray('加载配置...'));
  const config = loadConfig();
  validateConfig(config);

  // Load questions
  console.error(chalk.gray('加载测试题目...'));
  const questions = loadQuestions();
  console.error(chalk.green(`✓ 已加载 ${questions.length} 道题目\n`));

  // Initialize modules
  const apiClient = new APIClient({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    modelName: config.modelName,
    maxRetries: retries,
  });

  const calculator = new MBTICalculator();
  const progressRenderer = new ProgressRenderer(config.modelName);
  const testRunner = new TestRunner(
    apiClient,
    questions,
    progressRenderer,
    calculator,
    config.modelName,
    concurrency
  );

  // Run the test
  const result = await testRunner.run();

  // Generate report
  const reporter = new Reporter();

  if (jsonReport) {
    // Output JSON to stdout
    const jsonOutput = reporter.generateJSONReport(result);
    console.log(jsonOutput);
  } else {
    // Display console report
    reporter.generateConsoleReport(result);
  }
}

/**
 * Handle errors with appropriate messages and exit codes
 */
function handleError(error: unknown) {
  if (error instanceof Error) {
    // Configuration errors
    if (error.message.includes('Configuration Error')) {
      console.error(chalk.red('\n' + error.message + '\n'));
      process.exit(1);
    }

    // File loading errors
    if (error.message.includes('Questions file not found') || 
        error.message.includes('Invalid JSON format')) {
      console.error(chalk.red('\n文件加载错误:'));
      console.error(chalk.red(error.message + '\n'));
      process.exit(2);
    }

    // General errors
    console.error(chalk.red('\n错误: ' + error.message));
    
    // Show stack trace for debugging
    if (process.env.DEBUG) {
      console.error(chalk.gray('\n堆栈跟踪:'));
      console.error(chalk.gray(error.stack || ''));
    }
  } else {
    console.error(chalk.red('\n未知错误: ' + String(error)));
  }

  process.exit(255);
}

// Run the CLI
main().catch(handleError);
