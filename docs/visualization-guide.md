# 可视化功能使用指南

本指南详细说明了 LLM MBTI Arena 项目的可视化功能，包括静态图片生成和交互式 Web 界面。

## 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [静态图片生成](#静态图片生成)
- [交互式 Web 界面](#交互式-web-界面)
- [自动化更新](#自动化更新)
- [本地开发](#本地开发)
- [故障排除](#故障排除)

## 概述

可视化系统提供两种方式展示 MBTI 测试结果：

1. **静态图片**：自动生成的雷达图，嵌入在 README.md 中
2. **交互式页面**：功能完整的 Web 界面，支持筛选、排序和详细查看

### 系统架构

```
benchmark-result/*.json
    ↓
[数据汇总] → assets/data/summary.json
    ↓
    ├─→ [图片生成] → assets/images/mbti-distribution.png
    ├─→ [README 更新] → README.md
    └─→ [Web 界面] → index.html
```

## 快速开始

### 1. 生成可视化内容

运行以下命令生成所有可视化内容：

```bash
# 生成数据汇总
npm run generate:summary

# 生成可视化图片
npm run generate:image

# 更新 README
npm run update:readme
```

### 2. 查看结果

- **静态图片**：查看 `assets/images/mbti-distribution.png`
- **交互式页面**：在浏览器中打开 `index.html`

### 3. 本地预览

使用任何 HTTP 服务器预览交互式页面：

```bash
# 使用 http-server
npx http-server . -p 8080

# 使用 Python
python -m http.server 8080

# 使用 PHP
php -S localhost:8080
```

然后访问 `http://localhost:8080`

## 静态图片生成

### 功能说明

静态图片生成器会创建一个展示所有模型 MBTI 分布的雷达图。

### 生成流程

1. **扫描数据**：读取 `benchmark-result/` 目录下的所有 JSON 文件
2. **数据处理**：提取每个模型的 MBTI 维度百分比
3. **图表渲染**：使用 Chart.js 和 Canvas 生成雷达图
4. **添加水印**：在图片右下角添加项目 logo（如果存在）
5. **保存图片**：输出到 `assets/images/mbti-distribution.png`

### 图表特性

- **类型**：多系列雷达图
- **维度**：E-I、S-N、T-F、J-P 四个轴
- **刻度**：0-100% 范围
- **颜色**：每个模型使用不同颜色
- **分辨率**：1200x800 像素

### 自定义配置

编辑 `scripts/lib/chart-config.ts` 可以自定义：

```typescript
// 修改图表尺寸
export const CHART_WIDTH = 1200;
export const CHART_HEIGHT = 800;

// 修改颜色方案
export const COLOR_PALETTE = [
  '#FF6384', '#36A2EB', '#FFCE56', // ...
];

// 修改图表选项
export function createRadarChartConfig(models: ModelSummary[]) {
  // 自定义配置...
}
```

### 手动生成

```bash
npm run generate:image
```

输出示例：
```
🎨 开始生成 MBTI 分布图片...
📊 加载了 61 个模型的数据
🖼️  正在渲染雷达图...
✅ 图片已保存到 assets/images/mbti-distribution.png
🎉 图片生成完成！
```

## 交互式 Web 界面

### 功能概览

交互式页面提供以下功能：

1. **动态雷达图**：实时展示所有模型的 MBTI 分布
2. **数据表格**：显示详细的模型信息
3. **筛选功能**：按 MBTI 类型、提供商筛选
4. **搜索功能**：模糊搜索模型名称
5. **排序功能**：点击表头按任意列排序
6. **详情查看**：点击模型查看完整的 93 题答案

### 页面结构

```html
index.html
├── Header（标题和说明）
├── Chart Section（雷达图）
├── Filters Section（筛选器）
│   ├── MBTI 类型下拉菜单
│   ├── 提供商下拉菜单
│   └── 搜索框
├── Table Section（数据表格）
│   └── 可排序的列
├── Detail Modal（详情弹窗）
└── Footer（Logo 和版权信息）
```

### 使用说明

#### 1. 查看雷达图

- 鼠标悬停在图表上查看详细信息
- 图例显示每个模型的颜色对应关系

#### 2. 筛选数据

**按 MBTI 类型筛选：**
```
选择下拉菜单中的 MBTI 类型（如 ENTJ）
→ 图表和表格自动更新，只显示该类型的模型
```

**按提供商筛选：**
```
选择下拉菜单中的提供商（如 openai）
→ 只显示该提供商的模型
```

**搜索模型：**
```
在搜索框输入关键词（如 "gpt"）
→ 实时过滤匹配的模型
```

**组合筛选：**
```
可以同时使用多个筛选条件
例如：MBTI=ENTJ + Provider=openai + Search="gpt-4"
```

#### 3. 排序表格

点击任意表头进行排序：

- **首次点击**：升序排序
- **再次点击**：降序排序
- **第三次点击**：恢复默认顺序

支持排序的列：
- 模型名称
- 提供商
- MBTI 类型
- 各维度百分比
- 测试时间

#### 4. 查看详情

点击表格中的任意行，弹出详情窗口显示：

- 模型基本信息
- MBTI 类型和维度百分比
- 完整的 93 题答案记录
- 每题的选择和对应维度

### 数据加载机制

页面优先加载 `assets/data/summary.json`：

```javascript
// 优先加载汇总文件（快速）
try {
  const response = await fetch('assets/data/summary.json');
  data = await response.json();
} catch (error) {
  // 回退：逐个加载 JSON 文件（较慢）
  data = await loadIndividualResults();
}
```

### 自定义样式

编辑 `assets/css/styles.css` 自定义外观：

```css
/* 修改主题颜色 */
:root {
  --primary-color: #4a90e2;
  --secondary-color: #f39c12;
  --background-color: #f5f5f5;
}

/* 修改表格样式 */
table {
  /* 自定义样式 */
}

/* 修改图表容器 */
#chart-section {
  /* 自定义样式 */
}
```

## 自动化更新

### GitHub Actions 工作流

项目配置了自动化工作流，当有新的测试结果提交时自动更新可视化内容。

### 触发条件

工作流在以下情况下触发：

1. **自动触发**：当 `benchmark-result/` 目录下的 JSON 文件发生变化
2. **手动触发**：在 GitHub Actions 页面手动运行

### 工作流程

```yaml
1. Checkout 代码
2. 设置 Node.js 环境
3. 安装依赖
4. 生成数据汇总 (npm run generate:summary)
5. 生成可视化图片 (npm run generate:image)
6. 更新 README (npm run update:readme)
7. 提交并推送更改
```

### 查看工作流状态

访问仓库的 Actions 页面查看：

```
https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions
```

### 手动触发

1. 进入 Actions 页面
2. 选择 "Update Visualization" 工作流
3. 点击 "Run workflow"
4. 选择分支并确认

## 本地开发

### 开发环境设置

```bash
# 克隆仓库
git clone <repository-url>
cd llm-mbti-arena

# 安装依赖
npm install

# 安装可视化相关依赖
npm install canvas chart.js chartjs-node-canvas
```

### 开发工作流

#### 1. 添加测试数据

在 `test-assets/` 目录创建示例数据：

```json
{
  "modelName": "test-provider/test-model",
  "testTime": "2025-01-01T10:00:00.000Z",
  "personalityType": "ENTJ",
  "percentages": {
    "E_I": { "E": 65, "I": 35 },
    "S_N": { "S": 40, "N": 60 },
    "T_F": { "T": 70, "F": 30 },
    "J_P": { "J": 55, "P": 45 }
  }
}
```

#### 2. 运行本地测试

```bash
# 运行完整测试套件
npm run test:local
```

测试脚本会验证：
- ✓ 测试数据文件存在
- ✓ 数据汇总生成成功
- ✓ 图片生成成功
- ✓ README 更新成功
- ✓ HTML 结构完整
- ✓ JavaScript 功能完整

#### 3. 单独测试各模块

```bash
# 只生成数据汇总
npm run generate:summary

# 只生成图片
npm run generate:image

# 只更新 README
npm run update:readme
```

#### 4. 预览结果

```bash
# 启动本地服务器
npx http-server . -p 8080

# 在浏览器中打开
# http://localhost:8080
```

### 调试技巧

#### 1. 查看生成的数据

```bash
# 查看汇总数据
cat assets/data/summary.json | jq .

# 查看特定模型
cat assets/data/summary.json | jq '.models[] | select(.modelName | contains("gpt"))'
```

#### 2. 验证图片生成

```bash
# 检查图片文件大小
ls -lh assets/images/mbti-distribution.png

# 在终端预览图片（需要支持的终端）
imgcat assets/images/mbti-distribution.png
```

#### 3. 调试 JavaScript

在浏览器中打开开发者工具：

```javascript
// 查看加载的数据
console.log(window.mbtiArena.data);

// 查看当前筛选条件
console.log(window.mbtiArena.filters);

// 手动触发图表更新
window.mbtiArena.renderChart();
```

### 修改和扩展

#### 添加新的图表类型

编辑 `scripts/lib/chart-config.ts`：

```typescript
export function createScatterChartConfig(models: ModelSummary[]) {
  return {
    type: 'scatter',
    data: {
      datasets: models.map(model => ({
        label: model.modelName,
        data: [{
          x: model.dimensions.E,
          y: model.dimensions.N
        }]
      }))
    }
  };
}
```

#### 添加新的筛选器

编辑 `assets/js/app.js`：

```javascript
// 添加日期范围筛选
function applyDateFilter(startDate, endDate) {
  this.filteredData = this.data.models.filter(model => {
    const testDate = new Date(model.testTime);
    return testDate >= startDate && testDate <= endDate;
  });
  this.renderChart();
  this.renderTable();
}
```

## 故障排除

### 常见问题

#### 1. 图片生成失败

**问题**：`Error: Canvas initialization failed`

**解决方案**：
```bash
# 重新安装 canvas 依赖
npm uninstall canvas
npm install canvas

# Windows 用户可能需要安装额外依赖
# 参考：https://github.com/Automattic/node-canvas#installation
```

#### 2. 数据汇总为空

**问题**：`summary.json` 中 `totalModels: 0`

**解决方案**：
- 检查 `benchmark-result/` 目录是否包含 JSON 文件
- 验证 JSON 文件格式是否正确
- 查看控制台错误信息

```bash
# 验证 JSON 文件
cat benchmark-result/*.json | jq .
```

#### 3. Web 页面无法加载数据

**问题**：页面显示 "无法加载数据"

**解决方案**：
- 确保使用 HTTP 服务器访问（不是 `file://` 协议）
- 检查浏览器控制台的 CORS 错误
- 验证 `assets/data/summary.json` 文件存在

```bash
# 正确的访问方式
npx http-server . -p 8080
# 然后访问 http://localhost:8080

# 错误的访问方式
# file:///path/to/index.html （会有 CORS 问题）
```

#### 4. GitHub Actions 失败

**问题**：工作流运行失败

**解决方案**：
1. 查看 Actions 日志找到具体错误
2. 常见原因：
   - 依赖安装失败：检查 `package.json`
   - 权限问题：确保 Actions 有写入权限
   - 脚本错误：本地测试脚本是否正常

```bash
# 本地模拟 GitHub Actions
npm ci
npm run generate:summary
npm run generate:image
npm run update:readme
```

#### 5. Logo 水印不显示

**问题**：生成的图片没有 logo

**解决方案**：
- 确保 logo 文件存在于 `assets/images/kcores-llm-arena-logo-black.png`
- 检查 logo 文件格式（支持 PNG、JPG）
- 查看生成脚本的警告信息

### 性能优化

#### 大量数据处理

如果有超过 100 个模型：

1. **图表优化**：只显示前 20 个模型
2. **表格优化**：使用虚拟滚动
3. **数据加载**：启用分页加载

编辑 `assets/js/app.js`：

```javascript
// 限制图表显示数量
const MAX_CHART_MODELS = 20;
const chartData = this.filteredData.slice(0, MAX_CHART_MODELS);

// 启用表格分页
const PAGE_SIZE = 50;
const currentPage = 0;
const tableData = this.filteredData.slice(
  currentPage * PAGE_SIZE,
  (currentPage + 1) * PAGE_SIZE
);
```

### 获取帮助

如果遇到其他问题：

1. 查看项目 Issues：`https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/issues`
2. 提交新 Issue 并附上：
   - 错误信息
   - 操作步骤
   - 环境信息（OS、Node.js 版本）
3. 参考相关文档：
   - [Chart.js 文档](https://www.chartjs.org/docs/)
   - [Canvas API 文档](https://github.com/Automattic/node-canvas)

## 最佳实践

### 1. 定期更新

建议每次添加新的测试结果后运行：

```bash
npm run test:local
```

### 2. 版本控制

提交可视化文件到 Git：

```bash
git add assets/data/summary.json
git add assets/images/mbti-distribution.png
git add README.md
git commit -m "chore: update visualization"
```

### 3. 备份数据

定期备份 `benchmark-result/` 目录：

```bash
tar -czf backup-$(date +%Y%m%d).tar.gz benchmark-result/
```

### 4. 监控文件大小

如果图片文件过大，考虑：

- 降低分辨率
- 使用图片压缩
- 分组显示模型

## 相关资源

- [Chart.js 官方文档](https://www.chartjs.org/)
- [Canvas API 参考](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [MBTI 可视化最佳实践](https://www.16personalities.com/)

## 更新日志

### v1.0.0 (2025-01-08)

- ✨ 初始版本发布
- 📊 静态图片生成功能
- 🌐 交互式 Web 界面
- 🤖 GitHub Actions 自动化
- 📝 完整文档

---

如有问题或建议，欢迎提交 Issue 或 Pull Request！
