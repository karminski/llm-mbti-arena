/**
 * Reporter module for generating test reports
 */

import { writeFileSync } from 'fs';
import chalk from 'chalk';
import type { TestResult, ReportOptions } from './types.js';

export class Reporter {
  /**
   * Generate a beautiful console report
   */
  generateConsoleReport(result: TestResult): void {
    const { modelName, testTime, personalityResult, answers } = result;
    const { type, percentages } = personalityResult;

    console.log('\n' + chalk.cyan('====================================='));
    console.log(chalk.cyan.bold('    MBTI 人格测试报告'));
    console.log(chalk.cyan('=====================================') + '\n');

    console.log(chalk.gray('测试模型：') + chalk.white.bold(modelName));
    console.log(chalk.gray('测试时间：') + chalk.white(testTime) + '\n');

    console.log(chalk.green.bold('最终人格类型：') + chalk.yellow.bold(type) + '\n');

    console.log(chalk.blue.bold('维度百分比：'));
    
    // E vs I
    const ePercent = percentages.E_I.E.toFixed(1);
    const iPercent = percentages.E_I.I.toFixed(1);
    console.log(
      chalk.gray('  外向型 (E): ') + 
      chalk.cyan(`${ePercent}%`) + 
      chalk.gray('  |  内向型 (I): ') + 
      chalk.cyan(`${iPercent}%`)
    );

    // N vs S
    const nPercent = percentages.S_N.N.toFixed(1);
    const sPercent = percentages.S_N.S.toFixed(1);
    console.log(
      chalk.gray('  直觉型 (N): ') + 
      chalk.cyan(`${nPercent}%`) + 
      chalk.gray('  |  感觉型 (S): ') + 
      chalk.cyan(`${sPercent}%`)
    );

    // F vs T
    const fPercent = percentages.T_F.F.toFixed(1);
    const tPercent = percentages.T_F.T.toFixed(1);
    console.log(
      chalk.gray('  感情型 (F): ') + 
      chalk.cyan(`${fPercent}%`) + 
      chalk.gray('  |  思考型 (T): ') + 
      chalk.cyan(`${tPercent}%`)
    );

    // P vs J
    const pPercent = percentages.J_P.P.toFixed(1);
    const jPercent = percentages.J_P.J.toFixed(1);
    console.log(
      chalk.gray('  感知型 (P): ') + 
      chalk.cyan(`${pPercent}%`) + 
      chalk.gray('  |  判断型 (J): ') + 
      chalk.cyan(`${jPercent}%`)
    );

    console.log('\n' + chalk.gray('总题目数：') + chalk.white(answers.length));
    console.log(chalk.green.bold('测试完成！'));
    console.log(chalk.cyan('=====================================') + '\n');
  }

  /**
   * Generate JSON format report
   */
  generateJSONReport(result: TestResult): string {
    const { modelName, testTime, personalityResult, answers } = result;
    
    const jsonReport = {
      modelName,
      testTime,
      personalityType: personalityResult.type,
      percentages: {
        E_I: {
          E: Math.round(personalityResult.percentages.E_I.E * 10) / 10,
          I: Math.round(personalityResult.percentages.E_I.I * 10) / 10
        },
        S_N: {
          S: Math.round(personalityResult.percentages.S_N.S * 10) / 10,
          N: Math.round(personalityResult.percentages.S_N.N * 10) / 10
        },
        T_F: {
          T: Math.round(personalityResult.percentages.T_F.T * 10) / 10,
          F: Math.round(personalityResult.percentages.T_F.F * 10) / 10
        },
        J_P: {
          J: Math.round(personalityResult.percentages.J_P.J * 10) / 10,
          P: Math.round(personalityResult.percentages.J_P.P * 10) / 10
        }
      },
      answers: answers.map(answer => ({
        questionIndex: answer.questionIndex,
        question: answer.question,
        chosenOption: answer.chosenOption,
        dimension: answer.dimension
      }))
    };

    return JSON.stringify(jsonReport, null, 2);
  }

  /**
   * Save report content to a file
   */
  saveReport(content: string, path: string): void {
    try {
      writeFileSync(path, content, 'utf-8');
      console.log(chalk.green(`报告已保存到: ${path}`));
    } catch (error) {
      console.error(chalk.red(`保存报告失败: ${error instanceof Error ? error.message : String(error)}`));
      throw error;
    }
  }
}
