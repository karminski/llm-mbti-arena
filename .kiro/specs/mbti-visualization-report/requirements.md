# Requirements Document

## Introduction

本需求文档定义了 LLM MBTI Arena 项目的可视化报告系统。该系统将为 benchmark-result 目录中的 MBTI 测试结果提供两种可视化方式：

1. **静态图片生成**：生成展示所有大模型 MBTI 性格分布的图片，嵌入到 README.md 中
2. **交互式 HTML 页面**：提供一个独立的 index.html 页面，展示详细的 MBTI Arena 结果，包括交互式图表和可筛选的数据表格

系统需要支持自动化更新机制，当有新的测试结果提交到 benchmark-result 目录时，通过 GitHub Actions 自动重新生成可视化内容。

## Requirements

### Requirement 1: 静态图片生成系统

**User Story:** 作为项目维护者，我希望能够自动生成展示所有大模型 MBTI 分布的静态图片，以便在 README.md 中直观展示测试结果。

#### Acceptance Criteria

1. WHEN 运行图片生成脚本 THEN 系统 SHALL 扫描 benchmark-result 目录下的所有 JSON 文件
2. WHEN 系统读取测试结果数据 THEN 系统 SHALL 提取每个模型的 modelName、personalityType 和 percentages 信息
3. WHEN 系统生成可视化图片 THEN 系统 SHALL 使用雷达图展示每个模型在 E-I、S-N、T-F、J-P 四个维度的百分比分布
4. WHEN 多个模型具有相同的 MBTI 类型 THEN 图表 SHALL 能够清晰显示它们在百分比分数上的细微差别
5. WHEN 生成图片 THEN 系统 SHALL 在图片底部添加项目 logo 水印
6. WHEN 图片生成完成 THEN 系统 SHALL 将图片保存到 assets/images/mbti-distribution.png
7. WHEN 图片保存成功 THEN 系统 SHALL 自动更新 README.md 中的图片引用链接

### Requirement 2: 交互式 HTML 页面

**User Story:** 作为用户，我希望能够通过一个交互式网页查看所有大模型的 MBTI 测试详细结果，以便进行深入分析和对比。

#### Acceptance Criteria

1. WHEN 用户打开 index.html THEN 页面 SHALL 显示标题 "LLM MBTI Arena"
2. WHEN 页面加载 THEN 系统 SHALL 自动检测并加载 benchmark-result 目录下的所有 JSON 文件
3. WHEN 数据加载完成 THEN 页面 SHALL 显示一个交互式雷达图或散点图，展示所有模型的 MBTI 分布
4. WHEN 用户查看图表 THEN 图表 SHALL 支持鼠标悬停显示详细信息（模型名称、MBTI 类型、各维度百分比）
5. WHEN 页面显示数据表格 THEN 表格 SHALL 包含以下列：模型名称、MBTI 类型、E-I%、S-N%、T-F%、J-P%、测试时间
6. WHEN 用户使用筛选功能 THEN 系统 SHALL 支持按 MBTI 类型筛选模型
7. WHEN 用户使用筛选功能 THEN 系统 SHALL 支持按提供商（如 openai、anthropic、google 等）筛选模型
8. WHEN 用户点击表格列标题 THEN 系统 SHALL 支持按该列进行升序或降序排序
9. WHEN 用户点击表格中的某个模型 THEN 系统 SHALL 显示该模型的详细信息面板，包括完整的 93 题答案
10. WHEN 页面底部显示 THEN 系统 SHALL 展示项目 logo

### Requirement 3: 数据汇总文件生成

**User Story:** 作为开发者，我希望系统能够生成一个汇总的 JSON 文件，以便 HTML 页面快速加载数据而无需逐个读取所有测试结果文件。

#### Acceptance Criteria

1. WHEN 运行数据汇总脚本 THEN 系统 SHALL 扫描 benchmark-result 目录下的所有 JSON 文件
2. WHEN 系统读取测试结果 THEN 系统 SHALL 提取关键信息（modelName、personalityType、percentages、testTime）
3. WHEN 系统生成汇总数据 THEN 系统 SHALL 创建一个包含所有模型摘要信息的 JSON 数组
4. WHEN 汇总数据生成完成 THEN 系统 SHALL 将数据保存到 assets/data/summary.json
5. WHEN HTML 页面加载 THEN 页面 SHALL 优先读取 summary.json 文件以提高加载速度
6. IF summary.json 不存在 THEN 页面 SHALL 回退到直接读取 benchmark-result 目录下的 JSON 文件

### Requirement 4: GitHub Actions 自动化构建

**User Story:** 作为项目维护者，我希望当有新的测试结果提交时，系统能够自动重新生成可视化内容，以便 README.md 和 index.html 始终展示最新数据。

#### Acceptance Criteria

1. WHEN 有新文件提交到 benchmark-result 目录 THEN GitHub Actions SHALL 自动触发构建流程
2. WHEN 构建流程启动 THEN 系统 SHALL 依次执行：数据汇总脚本、图片生成脚本、README 更新脚本
3. WHEN 所有脚本执行完成 THEN 系统 SHALL 自动提交更新后的文件（summary.json、mbti-distribution.png、README.md）
4. WHEN 构建失败 THEN 系统 SHALL 记录错误日志并通知维护者
5. WHEN 构建成功 THEN 用户访问 README.md 和 index.html SHALL 看到最新的测试结果

### Requirement 5: Logo 集成

**User Story:** 作为项目维护者，我希望在生成的图片和 HTML 页面中都能展示项目 logo，以便增强品牌识别度。

#### Acceptance Criteria

1. WHEN 系统生成静态图片 THEN 图片底部 SHALL 包含项目 logo 水印
2. WHEN HTML 页面渲染 THEN 页面底部 SHALL 显示项目 logo
3. WHEN logo 文件不存在 THEN 系统 SHALL 使用默认占位符或文本标识
4. WHEN logo 显示 THEN logo SHALL 不遮挡主要数据内容
5. WHEN 用户查看图片或页面 THEN logo SHALL 清晰可见且美观

### Requirement 6: 可视化图表设计

**User Story:** 作为用户，我希望可视化图表能够清晰展示即使 MBTI 类型相同的模型之间的细微差别，以便进行精确对比。

#### Acceptance Criteria

1. WHEN 图表展示多个相同 MBTI 类型的模型 THEN 图表 SHALL 使用不同颜色或标记区分不同模型
2. WHEN 图表显示百分比数据 THEN 坐标轴 SHALL 使用 0-100% 的刻度范围
3. WHEN 两个模型的某个维度百分比差异小于 5% THEN 图表 SHALL 仍能清晰显示这种差异
4. WHEN 用户查看雷达图 THEN 每个维度 SHALL 清晰标注（如 "E-I: 65% E"）
5. WHEN 图表包含多个模型 THEN 系统 SHALL 提供图例说明每个颜色/标记对应的模型
6. WHEN 静态图片生成 THEN 图片分辨率 SHALL 至少为 1200x800 像素以确保清晰度

### Requirement 7: 错误处理和数据验证

**User Story:** 作为开发者，我希望系统能够妥善处理异常情况，以便在数据不完整或格式错误时不会导致整个系统崩溃。

#### Acceptance Criteria

1. WHEN 系统读取 JSON 文件失败 THEN 系统 SHALL 记录错误并跳过该文件，继续处理其他文件
2. WHEN JSON 文件缺少必需字段（modelName、personalityType、percentages）THEN 系统 SHALL 记录警告并跳过该文件
3. WHEN percentages 数据格式不正确 THEN 系统 SHALL 使用默认值或跳过该模型
4. WHEN benchmark-result 目录为空 THEN 系统 SHALL 显示友好的提示信息
5. WHEN HTML 页面无法加载数据 THEN 页面 SHALL 显示错误提示而不是空白页面
6. WHEN 图片生成失败 THEN 系统 SHALL 保留旧图片并记录错误日志
