/**
 * Test Runner Module
 * Coordinates the entire MBTI test flow
 */

import chalk from 'chalk';
import { APIClient } from './api-client.js';
import { MBTICalculator } from './mbti-calculator.js';
import { ProgressRenderer } from './progress-renderer.js';
import type { Question, TestResult, AnswerRecord } from './types.js';

export class TestRunner {
  private apiClient: APIClient;
  private questions: Question[];
  private progressRenderer: ProgressRenderer;
  private calculator: MBTICalculator;
  private modelName: string;
  private concurrency: number;

  constructor(
    apiClient: APIClient,
    questions: Question[],
    progressRenderer: ProgressRenderer,
    calculator: MBTICalculator,
    modelName: string,
    concurrency: number = 5
  ) {
    this.apiClient = apiClient;
    this.questions = questions;
    this.progressRenderer = progressRenderer;
    this.calculator = calculator;
    this.modelName = modelName;
    this.concurrency = Math.max(1, concurrency); // Ensure at least 1
  }

  /**
   * Run the complete MBTI test
   * @returns TestResult with all answers and personality analysis
   * @throws Error if a question fails after 3 retries
   */
  async run(): Promise<TestResult> {
    const answers: AnswerRecord[] = new Array(this.questions.length);
    let completedCount = 0;

    console.error(chalk.bold.cyan('\n开始 MBTI 测试...\n'));
    console.error(chalk.gray(`并发数: ${this.concurrency}\n`));

    try {
      // Process questions with concurrency control
      await this.processWithConcurrency(answers, (completed) => {
        completedCount = completed;
        // Update progress display
        this.progressRenderer.render({
          currentQuestion: completedCount,
          totalQuestions: this.questions.length,
          scores: this.calculator.getScores(),
          currentType: this.calculator.getCurrentType(),
        });
      });

      // Finalize progress display
      this.progressRenderer.finalize();

      // Generate final result
      const personalityResult = this.calculator.getResult();
      const testTime = new Date().toISOString();

      const testResult: TestResult = {
        modelName: this.modelName,
        testTime,
        answers,
        personalityResult,
      };

      return testResult;
    } catch (error) {
      // Finalize progress display even on error
      this.progressRenderer.finalize();
      
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }

  /**
   * Process questions with concurrency control
   */
  private async processWithConcurrency(
    answers: AnswerRecord[],
    onProgress: (completed: number) => void
  ): Promise<void> {
    let currentIndex = 0;
    let completedCount = 0;
    let shouldAbort = false;
    const inProgress = new Set<Promise<void>>();

    const processQuestion = async (index: number): Promise<void> => {
      // Check if we should abort before processing
      if (shouldAbort) {
        return;
      }

      const question = this.questions[index];

      try {
        // Ask the question to the model
        const chosenOption = await this.apiClient.askQuestion(
          question.question,
          question.choice_a.text,
          question.choice_b.text
        );

        // Determine which dimension to increment
        const dimension = chosenOption === 'A' 
          ? question.choice_a.value 
          : question.choice_b.value;

        // Update calculator (thread-safe since we're in Node.js single-threaded)
        this.calculator.addAnswer(dimension);

        // Record the answer
        answers[index] = {
          questionIndex: index,
          question: question.question,
          chosenOption,
          dimension,
        };

      } catch (error) {
        // Handle errors during question processing
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if this is a retry exhaustion error (after 3 attempts)
        if (errorMessage.includes('Failed to get response after')) {
          console.error(
            chalk.red(
              `\n[错误] 题目 ${index + 1} 重试 3 次后仍然失败: ${errorMessage}`
            )
          );
          console.error(chalk.red('终止当前模型测试...\n'));
          
          // Set abort flag to stop processing new questions
          shouldAbort = true;
          
          // Throw error to propagate to the main run() method
          throw new Error(`Question ${index + 1} failed after 3 retries: ${errorMessage}`);
        }
        
        // For other errors, log and continue
        console.error(
          chalk.yellow(
            `\n[警告] 题目 ${index + 1} 处理失败: ${errorMessage}`
          )
        );
        console.error(chalk.yellow('跳过此题目，继续测试...\n'));

        // Record as invalid answer
        answers[index] = {
          questionIndex: index,
          question: question.question,
          chosenOption: 'A', // Default to A for invalid responses
          dimension: question.choice_a.value,
        };
      } finally {
        completedCount++;
        onProgress(completedCount);
      }
    };

    // Start initial batch
    while (currentIndex < this.questions.length && inProgress.size < this.concurrency && !shouldAbort) {
      const promise = processQuestion(currentIndex++);
      inProgress.add(promise);
      promise.finally(() => inProgress.delete(promise));
    }

    // Continue processing as tasks complete
    while (inProgress.size > 0 || (currentIndex < this.questions.length && !shouldAbort)) {
      // Wait for at least one task to complete
      if (inProgress.size > 0) {
        try {
          await Promise.race(inProgress);
        } catch (error) {
          // If a critical error occurred, stop processing
          if (shouldAbort) {
            // Wait for all in-progress tasks to complete
            await Promise.allSettled(inProgress);
            throw error;
          }
        }
      }

      // Start new tasks to maintain concurrency level (only if not aborting)
      while (currentIndex < this.questions.length && inProgress.size < this.concurrency && !shouldAbort) {
        const promise = processQuestion(currentIndex++);
        inProgress.add(promise);
        promise.finally(() => inProgress.delete(promise));
      }
    }
  }
}
