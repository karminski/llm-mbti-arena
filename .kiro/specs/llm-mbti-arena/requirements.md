# 需求文档

## 简介

llm-mbti-arena 是一个用于测试大语言模型（LLM）人格类型的命令行工具。该项目通过标准的MBTI（Myers-Briggs Type Indicator）测试题目与大模型进行交互，分析其回答倾向，最终得出模型的16型人格类型。该工具使用TypeScript开发，支持OpenAI风格的API接口，能够实时展示测试进度和人格数据累计，并生成详细的测试报告。

## 需求

### 需求 1：环境配置与API集成

**用户故事：** 作为测试人员，我希望能够通过环境变量配置不同的大模型API，以便测试各种OpenAI兼容的模型。

#### 验收标准

1. WHEN 用户设置环境变量 `LLMMBIT_API` THEN 系统 SHALL 使用该变量指定的OpenAI风格API地址进行模型调用
2. WHEN 用户设置环境变量 `LLMMBIT_API_KEY` THEN 系统 SHALL 使用该密钥进行API认证
3. WHEN 用户设置环境变量 `LLMMBIT_API_MODEL` THEN 系统 SHALL 使用指定的模型名称（如"openai/gpt-4o"）进行测试
4. IF 任何必需的环境变量未设置 THEN 系统 SHALL 显示清晰的错误信息并退出
5. WHEN 系统调用API THEN 系统 SHALL 使用openai库进行通信

### 需求 2：命令行界面与帮助信息

**用户故事：** 作为用户，我希望能够轻松了解工具的使用方法，以便快速开始测试。

#### 验收标准

1. WHEN 用户直接运行 `llmmbtibenchmark` 命令不带参数 THEN 系统 SHALL 显示帮助信息
2. WHEN 用户运行 `llmmbtibenchmark --help` THEN 系统 SHALL 显示完整的使用说明
3. WHEN 显示帮助信息 THEN 系统 SHALL 包含所有可用命令和参数的说明
4. WHEN 显示帮助信息 THEN 系统 SHALL 包含环境变量配置的说明
5. WHEN 显示帮助信息 THEN 系统 SHALL 包含使用示例

### 需求 3：测试执行与进度展示

**用户故事：** 作为测试人员，我希望在测试过程中能够实时看到进度和中间结果，以便了解测试状态和模型的人格倾向。

#### 验收标准

1. WHEN 用户运行 `llmmbtibenchmark --bench` THEN 系统 SHALL 开始MBTI测试流程
2. WHEN 测试进行中 THEN 系统 SHALL 显示当前题目编号（如"题目 15/93"）
3. WHEN 测试进行中 THEN 系统 SHALL 显示进度条反映测试完成百分比
4. WHEN 测试进行中 THEN 系统 SHALL 实时显示八个维度的累计数据：
   - E（外向型）vs I（内向型）
   - S（感觉型）vs N（直觉型）
   - T（思考型）vs F（感情型）
   - J（判断型）vs P（感知型）
5. WHEN 测试进行中 THEN 系统 SHALL 根据当前累计数据显示模型倾向的16型人格类型
6. WHEN 每道题目提交给模型 THEN 系统 SHALL 解析模型回答并识别选择的选项（A或B）
7. IF 模型回答无法解析 THEN 系统 SHALL 记录错误并继续下一题

### 需求 4：测试报告生成

**用户故事：** 作为测试人员，我希望在测试完成后获得详细的报告，以便分析模型的人格特征。

#### 验收标准

1. WHEN 所有测试题目完成 THEN 系统 SHALL 生成并显示测试报告
2. WHEN 生成报告 THEN 系统 SHALL 包含每个维度的百分比（如 E: 65%, I: 35%）
3. WHEN 生成报告 THEN 系统 SHALL 显示最终确定的16型人格类型（如"ENFP"）
4. WHEN 生成报告 THEN 系统 SHALL 显示测试的模型名称
5. WHEN 生成报告 THEN 系统 SHALL 显示测试完成时间
6. WHEN 报告显示在终端 THEN 系统 SHALL 使用清晰易读的格式

### 需求 5：JSON报告输出

**用户故事：** 作为开发者或自动化测试系统，我希望能够获得机器可读的JSON格式报告，以便进行后续处理和分析。

#### 验收标准

1. WHEN 用户运行 `llmmbtibenchmark --bench --json-report` THEN 系统 SHALL 输出JSON格式的测试报告
2. WHEN 输出JSON报告 THEN 系统 SHALL 包含以下字段：
   - `modelName`: 测试的模型名称
   - `testTime`: 测试完成的时间戳
   - `answers`: 每道题的回答选项数组
   - `percentages`: 每个维度的百分比对象
   - `personalityType`: 最终的16型人格类型字符串
3. WHEN 输出JSON报告 THEN 系统 SHALL 确保JSON格式有效且可解析
4. WHEN 同时需要终端显示和JSON输出 THEN 系统 SHALL 将JSON输出到标准输出，进度信息输出到标准错误

### 需求 6：模块化架构设计

**用户故事：** 作为开发者，我希望代码具有良好的模块化结构，以便于维护和扩展。

#### 验收标准

1. WHEN 设计系统架构 THEN 系统 SHALL 将API调用逻辑封装在独立模块中
2. WHEN 设计系统架构 THEN 系统 SHALL 将测试运行逻辑封装在独立模块中
3. WHEN 设计系统架构 THEN 系统 SHALL 将进度渲染逻辑封装在独立模块中
4. WHEN 设计系统架构 THEN 系统 SHALL 将MBTI计算逻辑封装在独立模块中
5. WHEN 设计系统架构 THEN 系统 SHALL 确保各模块之间通过清晰的接口通信
6. WHEN 设计系统架构 THEN 系统 SHALL 使用openai库处理API调用，不自行实现HTTP客户端

### 需求 7：错误处理与健壮性

**用户故事：** 作为用户，我希望工具能够优雅地处理各种错误情况，以便在出现问题时获得有用的反馈。

#### 验收标准

1. WHEN API调用失败 THEN 系统 SHALL 显示清晰的错误信息并提供重试选项或跳过当前题目
2. WHEN 网络连接中断 THEN 系统 SHALL 捕获异常并提示用户
3. WHEN 模型返回格式异常 THEN 系统 SHALL 尝试解析并在失败时记录警告
4. WHEN 环境变量配置错误 THEN 系统 SHALL 在启动时验证并提供具体的修正建议
5. WHEN 测试题目文件缺失或格式错误 THEN 系统 SHALL 显示错误并退出

### 需求 8：测试数据管理

**用户故事：** 作为系统，我需要正确加载和使用MBTI测试题目数据，以便进行准确的测试。

#### 验收标准

1. WHEN 系统启动 THEN 系统 SHALL 从 `src/datasets/mbti-questions.json` 加载测试题目
2. WHEN 加载题目 THEN 系统 SHALL 验证JSON格式的正确性
3. WHEN 加载题目 THEN 系统 SHALL 确保每道题包含必需的字段（question, choice_a, choice_b）
4. WHEN 进行测试 THEN 系统 SHALL 按顺序向模型提问所有题目
5. WHEN 向模型提问 THEN 系统 SHALL 将题目和选项格式化为清晰的提示词
