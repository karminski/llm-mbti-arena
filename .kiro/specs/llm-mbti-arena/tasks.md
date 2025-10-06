# 实施计划

- [x] 1. 项目初始化和基础配置
  - 创建 package.json 并配置项目元数据、依赖项和脚本
  - 创建 tsconfig.json 配置TypeScript编译选项
  - 创建 tsup.config.ts 配置打包工具
  - 安装生产依赖：openai、commander、chalk
  - 安装开发依赖：typescript、vitest、@types/node、tsx、tsup
  - _需求: 6.1, 6.5_

- [x] 2. 定义核心类型和接口
  - 在 src/types.ts 中定义所有共享的TypeScript接口和类型
  - 包括：Question、Choice、Config、DimensionScores、PersonalityResult、TestResult等
  - _需求: 6.5, 8.3_

- [x] 3. 实现配置管理模块
  - 创建 src/config.ts 实现环境变量读取和验证
  - 实现 loadConfig() 函数读取 LLMMBIT_API、LLMMBIT_API_KEY、LLMMBIT_API_MODEL
  - 实现 validateConfig() 函数验证必需配置项
  - 提供清晰的错误信息当配置缺失时
  - _需求: 1.1, 1.2, 1.3, 1.4, 7.4_

- [x] 4. 实现题目加载器模块
  - 创建 src/question-loader.ts 实现题目加载和验证
  - 实现 loadQuestions() 函数从 src/datasets/mbti-questions.json 加载题目
  - 实现 validateQuestions() 函数验证题目格式和必需字段
  - 处理文件不存在和JSON格式错误的情况
  - _需求: 8.1, 8.2, 8.3, 7.5_

- [ ]* 4.1 编写题目加载器单元测试
  - 在 tests/question-loader.test.ts 中测试正常加载、格式验证和错误处理
  - _需求: 8.2, 8.3_

- [x] 5. 实现MBTI计算器模块
  - 创建 src/mbti-calculator.ts 实现 MBTICalculator 类
  - 实现 addAnswer() 方法累加维度分数
  - 实现 getCurrentType() 方法计算当前人格类型
  - 实现 getResult() 方法生成完整的PersonalityResult
  - 实现 getScores() 方法返回当前分数
  - 实现百分比计算逻辑
  - _需求: 3.4, 3.5, 4.2, 4.3_

- [x] 5.1 编写MBTI计算器单元测试
  - 在 tests/mbti-calculator.test.ts 中测试分数累加、百分比计算、人格类型判定
  - 测试边界情况（分数相等时的处理）
  - _需求: 4.2, 4.3_

- [x] 6. 实现API客户端模块
  - 创建 src/api-client.ts 实现 APIClient 类
  - 使用 openai SDK 初始化客户端，支持自定义 baseURL
  - 实现 askQuestion() 方法构造提示词并调用模型
  - 实现响应解析逻辑，提取A或B选择
  - 实现错误处理和重试机制（最多3次）
  - _需求: 1.1, 1.2, 1.3, 1.5, 3.6, 6.1, 6.6, 7.1, 7.2, 7.3_

- [x] 7. 实现进度渲染器模块
  - 创建 src/progress-renderer.ts 实现 ProgressRenderer 类
  - 实现 render() 方法使用ANSI转义码动态更新终端显示
  - 显示题目进度、进度条、八个维度分数和当前人格类型
  - 实现 clear() 和 finalize() 方法
  - 使用 chalk 库实现彩色输出
  - _需求: 3.2, 3.3, 3.4, 3.5, 6.3_

- [x] 8. 实现报告生成器模块
  - 创建 src/reporter.ts 实现 Reporter 类
  - 实现 generateConsoleReport() 方法生成美观的终端报告
  - 实现 generateJSONReport() 方法生成JSON格式报告
  - 实现 saveReport() 方法保存报告到文件
  - 格式化百分比和统计数据
  - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 6.4_

- [ ]* 8.1 编写报告生成器单元测试
  - 在 tests/reporter.test.ts 中测试终端报告格式、JSON报告结构和数据转换
  - _需求: 4.6, 5.3_

- [x] 9. 实现测试运行器模块
  - 创建 src/test-runner.ts 实现 TestRunner 类
  - 实现 run() 方法协调整个测试流程
  - 逐题调用 APIClient，更新 MBTICalculator，触发 ProgressRenderer
  - 收集所有回答记录并返回 TestResult
  - 处理测试过程中的错误（API错误、解析错误）
  - _需求: 3.1, 3.6, 3.7, 6.2, 7.1, 7.3_

- [x] 10. 实现CLI入口
  - 创建 src/main.ts 实现命令行入口
  - 使用 commander 库解析命令行参数
  - 实现 --help 选项显示帮助信息
  - 实现 --bench 选项启动测试
  - 实现 --json-report 选项输出JSON报告
  - 初始化所有模块并协调执行
  - 处理顶层异常并设置正确的退出码
  - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 4.4, 5.1, 5.4, 6.1_

- [x] 11. 配置构建和打包
  - 确保 tsup.config.ts 正确配置
  - 在 package.json 中配置 bin 字段指向编译后的 main.js
  - 测试 npm run build 命令
  - 测试生成的可执行文件 llmmbtibenchmark
  - _需求: 6.1_

- [x] 12. 编写README文档
  - 创建 README.md 包含项目介绍、安装说明、使用示例
  - 说明环境变量配置方法
  - 提供命令行参数说明
  - 包含示例输出截图或文本
  - _需求: 2.3, 2.4_

- [x] 13. 端到端测试
  - 使用mock API客户端进行完整流程测试
  - 验证从加载题目到生成报告的整个流程
  - 测试终端报告和JSON报告输出
  - _需求: 3.1, 4.1, 5.1_

- [ ] 14. 集成真实API测试（可选）
  - 使用真实的OpenAI API或兼容API进行测试
  - 验证与实际模型的交互
  - 检查报告的准确性和完整性
  - _需求: 1.1, 1.2, 1.3, 3.1_
