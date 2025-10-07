# 批量测试指南

## 概述

批量测试脚本允许你一次性测试多个 LLM 模型的 MBTI 人格类型，并将结果保存到 `benchmark-result` 目录。

## 使用方法

### 1. 准备模型列表文件

创建一个文本文件（例如 `models.txt`），每行写一个模型名称：

```text
openai/gpt-4o
openai/gpt-4o-mini
anthropic/claude-3.5-sonnet
google/gemini-pro
```

支持使用 `#` 开头的注释行：

```text
# OpenAI 模型
openai/gpt-4o
openai/gpt-4o-mini

# Anthropic 模型
anthropic/claude-3.5-sonnet
```

### 2. 运行批量测试

使用以下命令运行批量测试：

```bash
npm run batch -- \
  --api-url https://api.openai.com/v1 \
  --api-key your-api-key \
  --models-file models.txt
```

或者使用 tsx 直接运行：

```bash
tsx scripts/batch-benchmark.ts \
  --api-url https://api.openai.com/v1 \
  --api-key your-api-key \
  --models-file models.txt
```

### 3. 可选参数

- `--output-dir <dir>`: 指定输出目录（默认: `benchmark-result`）
- `--concurrency <num>`: 设置并发请求数（默认: 5）
- `--retries <num>`: 设置 API 调用失败时的重试次数（默认: 3）

完整示例：

```bash
npm run batch -- \
  --api-url https://openrouter.ai/api/v1 \
  --api-key sk-or-v1-xxx \
  --models-file models.txt \
  --output-dir my-results \
  --concurrency 3 \
  --retries 5
```

## 输出结果

### 测试报告

每个模型的测试结果会保存为独立的 JSON 文件：

```
benchmark-result/
├── openai_gpt-4o_2025-10-07T10-30-00-000Z.json
├── openai_gpt-4o-mini_2025-10-07T10-35-00-000Z.json
└── anthropic_claude-3.5-sonnet_2025-10-07T10-40-00-000Z.json
```

### 汇总报告

批量测试完成后，会生成一个汇总报告：

```
benchmark-result/
└── summary_2025-10-07T10-45-00-000Z.json
```

汇总报告包含：
- 测试时间戳
- 总模型数
- 成功/失败统计
- 每个模型的测试结果和输出文件路径

## 进度显示

脚本会实时显示测试进度：

```
[0.0%] 测试模型 1/3: openai/gpt-4o
✓ 完成: benchmark-result/openai_gpt-4o_2025-10-07T10-30-00-000Z.json

[33.3%] 测试模型 2/3: openai/gpt-4o-mini
✓ 完成: benchmark-result/openai_gpt-4o-mini_2025-10-07T10-35-00-000Z.json

[66.7%] 测试模型 3/3: anthropic/claude-3.5-sonnet
✓ 完成: benchmark-result/anthropic_claude-3.5-sonnet_2025-10-07T10-40-00-000Z.json
```

## 错误处理

### 重试机制

每个问题在失败时会自动重试（默认最多 3 次，可通过 `--retries` 参数调整）：
- 第 1 次失败：等待 1 秒后重试
- 第 2 次失败：等待 2 秒后重试
- 第 3 次失败：等待 3 秒后重试

如果某个问题在所有重试后仍然失败，当前模型的测试会立即终止，并继续测试下一个模型。

对于网络不稳定的环境，可以增加重试次数：

```bash
npm run batch -- \
  --api-url https://api.openai.com/v1 \
  --api-key your-api-key \
  --models-file models.txt \
  --retries 5
```

### 批量测试错误处理

如果某个模型测试失败，脚本会：
1. 显示错误信息
2. 终止当前模型的测试
3. 继续测试下一个模型
4. 在汇总报告中记录失败信息
5. 最终以退出码 1 结束（如果有任何失败）

## 示例：OpenRouter API

使用 OpenRouter 测试多个模型：

```bash
npm run batch -- \
  --api-url https://openrouter.ai/api/v1 \
  --api-key $OPENROUTER_API_KEY \
  --models-file models.txt
```

`models.txt` 内容：

```text
openai/gpt-4o
anthropic/claude-3.5-sonnet
google/gemini-pro-1.5
meta-llama/llama-3.1-70b-instruct
```

## 注意事项

1. **API 配额**: 批量测试会消耗大量 API 调用，请确保你的 API 配额充足
2. **测试时间**: 每个模型需要回答 60 道题目，完整测试可能需要几分钟
3. **并发控制**: 使用 `--concurrency` 参数控制并发数，避免触发 API 速率限制
4. **成本**: 注意 API 调用成本，特别是测试大型模型时

## 故障排查

### 问题：模型名称无效

确保模型名称格式正确，例如：
- OpenAI: `openai/gpt-4o`
- Anthropic: `anthropic/claude-3.5-sonnet`
- Google: `google/gemini-pro`

### 问题：API 速率限制

如果遇到速率限制错误，尝试：
1. 降低并发数：`--concurrency 1`
2. 在模型列表中减少模型数量
3. 等待一段时间后重试

### 问题：输出目录权限

确保脚本有权限在指定目录创建文件。
