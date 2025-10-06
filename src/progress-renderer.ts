/**
 * Progress renderer for displaying real-time test progress
 * Uses ANSI escape codes for dynamic terminal updates
 */

import chalk from 'chalk';
import { ProgressState, DimensionScores } from './types.js';

export class ProgressRenderer {
  private linesRendered: number = 0;
  private modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  /**
   * Render the current progress state to the terminal
   */
  render(state: ProgressState): void {
    // Clear previous render
    this.clear();

    const lines: string[] = [];

    // Header
    lines.push(chalk.bold.cyan(`正在测试模型：${this.modelName}`));
    lines.push('');

    // Progress info
    const percentage = Math.round((state.currentQuestion / state.totalQuestions) * 100);
    lines.push(chalk.bold(`进度：题目 ${state.currentQuestion}/${state.totalQuestions}`));
    
    // Progress bar
    const progressBar = this.createProgressBar(percentage);
    lines.push(progressBar);
    lines.push('');

    // Current personality type
    lines.push(chalk.bold.yellow(`当前人格倾向：${state.currentType}`));
    lines.push('');

    // Dimension statistics
    lines.push(chalk.bold('维度统计：'));
    lines.push(this.formatDimensionPair('E', '外向型', 'I', '内向型', state.scores));
    lines.push(this.formatDimensionPair('S', '感觉型', 'N', '直觉型', state.scores));
    lines.push(this.formatDimensionPair('T', '思考型', 'F', '感情型', state.scores));
    lines.push(this.formatDimensionPair('J', '判断型', 'P', '感知型', state.scores));

    // Output all lines
    const output = lines.join('\n');
    process.stderr.write(output + '\n');
    
    // Track how many lines we rendered for next clear
    this.linesRendered = lines.length;
  }

  /**
   * Clear the previously rendered content
   */
  clear(): void {
    if (this.linesRendered > 0) {
      // Move cursor up and clear lines
      for (let i = 0; i < this.linesRendered; i++) {
        process.stderr.write('\x1b[1A'); // Move up one line
        process.stderr.write('\x1b[2K'); // Clear entire line
      }
      this.linesRendered = 0;
    }
  }

  /**
   * Finalize the progress display (clear it)
   */
  finalize(): void {
    this.clear();
  }

  /**
   * Create a visual progress bar
   */
  private createProgressBar(percentage: number): string {
    const barWidth = 50;
    const filledWidth = Math.round((percentage / 100) * barWidth);
    const emptyWidth = barWidth - filledWidth;

    const filled = '='.repeat(Math.max(0, filledWidth - 1));
    const arrow = filledWidth > 0 ? '>' : '';
    const empty = ' '.repeat(Math.max(0, emptyWidth));

    const bar = `[${filled}${arrow}${empty}]`;
    return chalk.green(bar) + ` ${percentage}%`;
  }

  /**
   * Format a dimension pair (e.g., E vs I)
   */
  private formatDimensionPair(
    dim1: keyof DimensionScores,
    label1: string,
    dim2: keyof DimensionScores,
    label2: string,
    scores: DimensionScores
  ): string {
    const score1 = scores[dim1];
    const score2 = scores[dim2];

    // Highlight the dominant dimension
    const part1 = score1 >= score2
      ? chalk.green(`${dim1} (${label1}): ${score1}`)
      : chalk.gray(`${dim1} (${label1}): ${score1}`);

    const part2 = score2 > score1
      ? chalk.green(`${dim2} (${label2}): ${score2}`)
      : chalk.gray(`${dim2} (${label2}): ${score2}`);

    return `  ${part1}  |  ${part2}`;
  }
}
