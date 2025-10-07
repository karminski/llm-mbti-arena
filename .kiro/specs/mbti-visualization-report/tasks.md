# Implementation Plan

- [x] 1. 设置项目基础结构和依赖
  - 创建必要的目录结构（assets/data, assets/images, assets/css, assets/js）
  - 安装图片生成所需的依赖包（canvas, chart.js, chartjs-node-canvas）
  - 在 package.json 中添加新的 npm scripts（generate:summary, generate:image, update:readme）
  - _Requirements: 1.1, 3.1_

- [x] 2. 实现数据处理模块
- [x] 2.1 创建数据类型定义
  - 在 src/types.ts 中添加 BenchmarkResult, ModelSummary, SummaryData 接口
  - 定义 Filters 和 ChartConfig 类型
  - _Requirements: 3.1, 3.2_

- [x] 2.2 实现 benchmark 结果加载器
  - 创建 scripts/lib/data-loader.ts
  - 实现 loadBenchmarkResults() 函数读取所有 JSON 文件
  - 实现 extractProvider() 函数从 modelName 提取提供商名称
  - 添加 JSON 验证和错误处理逻辑
  - _Requirements: 3.1, 7.1, 7.2_

- [x] 2.3 实现数据汇总生成器
  - 创建 scripts/generate-summary.ts
  - 实现 generateSummary() 函数生成汇总数据
  - 计算 mbtiDistribution 和 providerDistribution 统计
  - 将汇总数据保存到 assets/data/summary.json
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 2.4 编写数据处理模块的单元测试
  - 测试 loadBenchmarkResults() 处理有效和无效 JSON
  - 测试 extractProvider() 处理各种 modelName 格式
  - 测试 generateSummary() 输出结构正确性
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 3. 实现静态图片生成器
- [x] 3.1 创建图表配置生成器
  - 创建 scripts/lib/chart-config.ts
  - 实现 createRadarChartConfig() 生成 Chart.js 配置
  - 定义颜色调色板（COLOR_PALETTE）
  - 实现数据集转换逻辑（ModelSummary → Chart.js dataset）
  - _Requirements: 1.3, 6.1, 6.2_

- [x] 3.2 实现图片生成核心功能
  - 创建 scripts/generate-image.ts
  - 使用 chartjs-node-canvas 渲染雷达图
  - 实现 generateRadarChart() 函数
  - 设置图片尺寸为 1200x800px
  - _Requirements: 1.2, 1.3, 6.6_

- [x] 3.3 添加 Logo 水印功能
  - 实现 addLogoWatermark() 函数
  - 使用 Canvas API 在图片右下角添加 logo
  - 设置 logo 透明度为 30%
  - 处理 logo 文件不存在的情况
  - _Requirements: 1.5, 5.1, 5.3, 5.4_

- [x] 3.4 实现图片保存和错误处理
  - 实现 saveImage() 函数保存到 assets/images/mbti-distribution.png
  - 添加文件写入错误处理
  - 在失败时保留旧图片
  - _Requirements: 1.6, 7.6_

- [x] 3.5 编写图片生成模块的单元测试
  - 测试图表配置生成
  - 测试颜色分配逻辑
  - Mock Canvas 操作进行测试
  - _Requirements: 6.1, 6.2_

- [x] 4. 实现 README 更新器
- [x] 4.1 创建 README 解析和更新逻辑
  - 创建 scripts/update-readme.ts
  - 实现 updateReadme() 函数读取当前 README.md
  - 实现 insertImageSection() 函数插入可视化部分
  - 使用注释标记（AUTO-GENERATED-VISUALIZATION-START/END）标识自动生成区域
  - _Requirements: 1.7_

- [x] 4.2 实现内容保留和错误处理
  - 确保保留手动编辑的其他内容
  - 处理 README.md 不存在的情况
  - 添加文件写入错误处理
  - _Requirements: 7.6_

- [ ]* 4.3 编写 README 更新器的单元测试
  - 测试 markdown 解析和插入
  - 测试现有内容保留
  - 测试边界情况处理
  - _Requirements: 1.7_

- [x] 5. 创建交互式 HTML 页面
- [x] 5.1 创建 HTML 结构
  - 创建 index.html 文件
  - 实现页面布局（header, main, footer）
  - 添加 canvas 元素用于图表渲染
  - 添加筛选器区域（MBTI 类型、提供商、搜索框）
  - 添加数据表格结构
  - 添加详情模态框
  - 在 footer 中添加 logo 图片引用
  - _Requirements: 2.1, 2.4, 2.5, 2.10, 5.2_

- [x] 5.2 创建 CSS 样式
  - 创建 assets/css/styles.css
  - 实现响应式布局样式
  - 设计表格样式（包括悬停效果）
  - 设计筛选器和搜索框样式
  - 设计模态框样式
  - 设计 MBTI 徽章样式
  - 设计 footer 和 logo 样式
  - _Requirements: 2.1, 2.10, 5.2, 5.4_

- [x] 5.3 实现数据加载模块
  - 创建 assets/js/app.js
  - 实现 loadSummaryData() 函数加载 summary.json
  - 实现 loadIndividualResults() 作为回退方案
  - 添加加载错误处理和用户提示
  - _Requirements: 2.2, 3.5, 3.6, 7.5_

- [x] 5.4 实现图表渲染功能
  - 实现 createRadarChart() 函数使用 Chart.js 渲染雷达图
  - 配置图表选项（scales, tooltips, legend）
  - 实现鼠标悬停显示详细信息
  - 处理图表渲染失败的情况
  - _Requirements: 2.3, 2.4, 6.3, 6.4, 6.5, 7.5_

- [x] 5.5 实现数据表格渲染
  - 实现 renderTable() 函数动态生成表格行
  - 显示所有必需列（模型名称、提供商、MBTI 类型、各维度百分比、测试时间）
  - 添加行点击事件处理
  - 格式化日期显示
  - _Requirements: 2.5, 2.9_

- [x] 5.6 实现筛选功能
  - 实现 applyFilters() 函数
  - 动态填充 MBTI 类型下拉菜单
  - 动态填充提供商下拉菜单
  - 实现搜索框功能（模糊匹配模型名称）
  - 筛选后更新图表和表格
  - _Requirements: 2.6, 2.7_

- [x] 5.7 实现表格排序功能
  - 实现 sortTable() 函数
  - 为表头添加点击事件监听器
  - 支持升序和降序切换
  - 添加排序指示器（箭头图标）
  - _Requirements: 2.8_

- [x] 5.8 实现详情模态框
  - 实现 showDetailModal() 函数
  - 加载完整的 benchmark 结果（包括 93 题答案）
  - 在模态框中显示详细信息
  - 实现模态框关闭功能
  - _Requirements: 2.9_

- [x] 5.9 实现 MBTIArena 主类
  - 创建 MBTIArena 类整合所有功能
  - 实现 init() 方法初始化应用
  - 协调数据加载、图表渲染、表格渲染
  - 设置事件监听器
  - _Requirements: 2.1, 2.2_

- [x] 6. 配置 GitHub Actions 工作流
- [x] 6.1 创建工作流配置文件
  - 创建 .github/workflows/update-visualization.yml
  - 配置触发条件（push to benchmark-result 目录）
  - 添加 workflow_dispatch 支持手动触发
  - _Requirements: 4.1_

- [x] 6.2 配置工作流步骤
  - 添加 checkout 步骤
  - 添加 Node.js 设置步骤
  - 添加依赖安装步骤
  - 添加三个生成脚本执行步骤（summary, image, readme）
  - 添加 git commit 和 push 步骤
  - 使用 [skip ci] 避免无限循环
  - _Requirements: 4.2, 4.3_

- [x] 6.3 配置错误处理和通知
  - 添加失败时的错误日志记录
  - 配置构建状态徽章
  - _Requirements: 4.4_

- [x] 7. 集成测试和文档
- [x] 7.1 创建本地测试脚本
  - 创建测试数据集（sample benchmark results）
  - 编写本地运行所有生成脚本的测试脚本
  - 验证生成的文件正确性
  - _Requirements: 4.2, 4.3_

- [x] 7.2 更新项目文档
  - 在 README.md 中添加可视化功能说明
  - 创建 docs/visualization-guide.md 详细说明使用方法
  - 添加本地开发指南
  - 添加故障排除部分
  - _Requirements: 1.7, 2.1_

- [x] 7.3 配置 GitHub Pages
  - 在仓库设置中启用 GitHub Pages
  - 设置源为 main 分支根目录
  - 验证 index.html 可访问
  - _Requirements: 2.1_

- [ ]* 7.4 执行端到端测试
  - 手动测试完整流程：添加新 JSON → 触发 Actions → 验证输出
  - 在多个浏览器中测试 HTML 页面
  - 测试移动端响应式设计
  - 测试所有交互功能（筛选、排序、详情查看）
  - _Requirements: 2.3, 2.4, 2.6, 2.7, 2.8, 2.9_
