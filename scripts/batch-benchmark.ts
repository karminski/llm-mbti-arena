#!/usr/bin/env node

/**
 * 批量运行 MBTI 测试脚本
 * 支持从文件读取模型列表，批量测试并生成报告
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';

interface BatchConfig {
  apiUrl: string;
  apiKey: string;
  modelsFile: string;
  outputDir: string;
  concurrency: number;
  retries: number;
}

/**
 * 解析命令行参数
 */
function parseArgs(): BatchConfig {
  const args = process.argv.slice(2);
  
  const config: Partial<BatchConfig> = {
    outputDir: 'benchmark-result',
    concurrency: 5,
    retries: 3,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--api-url' && i + 1 < args.length) {
      config.apiUrl = args[++i];
    } else if (arg === '--api-key' && i + 1 < args.length) {
      config.apiKey = args[++i];
    } else if (arg === '--models-file' && i + 1 < args.length) {
      config.modelsFile = args[++i];
    } else if (arg === '--output-dir' && i + 1 < args.length) {
      config.outputDir = args[++i];
    } else if (arg === '--concurrency' && i + 1 < args.length) {
      config.concurrency = parseInt(args[++i], 10);
    } else if (arg === '--retries' && i + 1 < args.length) {
      config.retries = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  // 验证必需参数
  if (!config.apiUrl || !config.apiKey || !config.modelsFile) {
    console.error(chalk.red('\n错误: 缺少必需参数\n'));
    showHelp();
    process.exit(1);
  }

  return config as BatchConfig;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
${chalk.bold.cyan('批量 MBTI 测试工具')}

${chalk.bold('用法:')}
  tsx scripts/batch-benchmark.ts [选项]

${chalk.bold('必需参数:')}
  --api-url <url>          API 基础地址 (例如: https://api.openai.com/v1)
  --api-key <key>          API 密钥
  --models-file <path>     模型列表文件路径 (每行一个模型名称)

${chalk.bold('可选参数:')}
  --output-dir <dir>       输出目录 (默认: benchmark-result)
  --concurrency <num>      并发请求数 (默认: 5)
  --retries <num>          API 调用失败时的重试次数 (默认: 3)
  -h, --help               显示帮助信息

${chalk.bold('示例:')}
  tsx scripts/batch-benchmark.ts \\
    --api-url https://api.openai.com/v1 \\
    --api-key sk-xxx \\
    --models-file models.txt

${chalk.bold('模型列表文件格式:')}
  每行一个模型名称，例如:
  openai/gpt-4o
  openai/gpt-4o-mini
  anthropic/claude-3.5-sonnet
`);
}

/**
 * 读取模型列表
 */
function loadModels(filePath: string): string[] {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const models = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // 过滤空行和注释
    
    if (models.length === 0) {
      throw new Error('模型列表文件为空');
    }
    
    return models;
  } catch (error) {
    console.error(chalk.red(`\n读取模型列表失败: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

/**
 * 确保输出目录存在
 */
function ensureOutputDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(chalk.gray(`创建输出目录: ${dir}`));
  }
}

/**
 * 运行单个模型的测试
 */
async function runSingleTest(
  modelName: string,
  apiUrl: string,
  apiKey: string,
  outputDir: string,
  concurrency: number,
  retries: number
): Promise<{ success: boolean; outputFile?: string; error?: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeModelName = modelName.replace(/[/\\:*?"<>|]/g, '_');
  const outputFile = join(outputDir, `${safeModelName}_${timestamp}.json`);

  return new Promise((resolve) => {
    // 设置环境变量
    const env = {
      ...process.env,
      LLMMBIT_API: apiUrl,
      LLMMBIT_API_KEY: apiKey,
      LLMMBIT_API_MODEL: modelName,
    };

    // 使用 spawn 以便实时捕获输出
    const child = spawn('npm', ['run', 'dev', '--', '--bench', '--json-report', '--concurrency', concurrency.toString(), '--retries', retries.toString()], {
      env,
      shell: true,
    });

    let stdoutData = '';
    let stderrData = '';

    // 捕获标准输出（JSON 数据）
    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    // 捕获标准错误（进度信息）并实时显示
    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderrData += output;
      // 实时显示子进程的进度输出（缩进显示）
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          process.stderr.write(chalk.gray('  │ ') + line + '\n');
        }
      }
    });

    // 进程结束
    child.on('close', (code) => {
      if (code === 0) {
        try {
          // 提取纯 JSON 数据
          const jsonStart = stdoutData.indexOf('{');
          if (jsonStart === -1) {
            resolve({
              success: false,
              error: '未找到有效的 JSON 输出',
            });
            return;
          }

          const jsonOutput = stdoutData.substring(jsonStart).trim();

          // 验证是否为有效 JSON
          JSON.parse(jsonOutput);

          // 保存 JSON 报告
          writeFileSync(outputFile, jsonOutput, 'utf-8');

          resolve({ success: true, outputFile });
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } else {
        resolve({
          success: false,
          error: `进程退出码: ${code}`,
        });
      }
    });

    // 处理错误
    child.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log(chalk.bold.cyan('\n========================================'));
  console.log(chalk.bold.cyan('    批量 MBTI 测试工具'));
  console.log(chalk.bold.cyan('========================================\n'));

  // 解析参数
  const config = parseArgs();

  // 加载模型列表
  console.log(chalk.gray(`加载模型列表: ${config.modelsFile}`));
  const models = loadModels(config.modelsFile);
  console.log(chalk.green(`✓ 已加载 ${models.length} 个模型\n`));

  // 确保输出目录存在
  ensureOutputDir(config.outputDir);

  // 运行测试
  const results: Array<{
    model: string;
    success: boolean;
    outputFile?: string;
    error?: string;
  }> = [];

  console.log(chalk.bold.cyan('开始批量测试...\n'));

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const progress = ((i / models.length) * 100).toFixed(1);
    
    console.log(chalk.cyan(`[${progress}%] 测试模型 ${i + 1}/${models.length}: ${chalk.bold(model)}`));

    const result = await runSingleTest(
      model,
      config.apiUrl,
      config.apiKey,
      config.outputDir,
      config.concurrency,
      config.retries
    );

    results.push({
      model,
      ...result,
    });

    if (result.success) {
      console.log(chalk.green(`✓ 完成: ${result.outputFile}\n`));
    } else {
      console.log(chalk.red(`✗ 失败: ${result.error}\n`));
    }
  }

  // 显示最终统计
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(chalk.bold.cyan('========================================'));
  console.log(chalk.bold.cyan('    测试完成'));
  console.log(chalk.bold.cyan('========================================\n'));

  console.log(chalk.gray('总模型数: ') + chalk.white(models.length));
  console.log(chalk.green('成功: ') + chalk.white(successCount));
  console.log(chalk.red('失败: ') + chalk.white(failCount));
  console.log(chalk.gray('输出目录: ') + chalk.white(config.outputDir) + '\n');

  // 保存汇总报告
  const summaryFile = join(config.outputDir, `summary_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const summary = {
    timestamp: new Date().toISOString(),
    totalModels: models.length,
    successCount,
    failCount,
    results: results.map(r => ({
      model: r.model,
      success: r.success,
      outputFile: r.outputFile,
      error: r.error,
    })),
  };

  writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(chalk.green(`汇总报告已保存: ${summaryFile}\n`));

  // 如果有失败的测试，退出码为 1
  if (failCount > 0) {
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error(chalk.red('\n发生错误:'), error);
  process.exit(1);
});
