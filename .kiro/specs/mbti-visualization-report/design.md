# Design Document

## Overview

本设计文档描述了 LLM MBTI Arena 可视化报告系统的技术架构和实现方案。系统包含三个核心组件：

1. **数据处理层**：扫描和汇总 benchmark-result 目录中的测试结果
2. **静态图片生成器**：使用 Node.js Canvas 生成 MBTI 分布雷达图
3. **交互式 Web 界面**：纯静态 HTML 页面，使用 Chart.js 进行数据可视化

系统采用静态生成策略，通过 GitHub Actions 实现自动化更新，无需运行时服务器。

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│                                                              │
│  ┌────────────────┐      ┌──────────────────┐              │
│  │ benchmark-result│      │  assets/         │              │
│  │   /*.json      │      │   data/          │              │
│  │                │      │   images/        │              │
│  └────────┬───────┘      └────────┬─────────┘              │
│           │                       │                         │
│           │  ┌────────────────────▼──────────────────┐     │
│           │  │   GitHub Actions Workflow             │     │
│           │  │                                        │     │
│           └──►  1. Detect changes in benchmark-result│     │
│              │  2. Run generate-summary.ts            │     │
│              │  3. Run generate-image.ts              │     │
│              │  4. Run update-readme.ts               │     │
│              │  5. Commit & Push                      │     │
│              └────────────────────────────────────────┘     │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ index.html   │    │ README.md    │    │ summary.json │ │
│  │ (Interactive)│    │ (Static Img) │    │ (Data Cache) │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
benchmark-result/*.json
    ↓
[Data Loader] → Parse & Validate
    ↓
[Data Aggregator] → Group by MBTI type, Extract percentages
    ↓
    ├─→ [Summary Generator] → assets/data/summary.json
    ├─→ [Image Generator] → assets/images/mbti-distribution.png
    └─→ [README Updater] → Update image reference in README.md
```

## Components and Interfaces

### 1. Data Processing Module

**File**: `scripts/generate-summary.ts`

**Purpose**: 扫描所有测试结果并生成汇总数据文件

**Interface**:
```typescript
interface BenchmarkResult {
  modelName: string;
  testTime: string;
  personalityType: string;
  percentages: {
    E_I: { E: number; I: number };
    S_N: { S: number; N: number };
    T_F: { T: number; F: number };
    J_P: { J: number; P: number };
  };
  answers?: Array<{
    questionIndex: number;
    question: string;
    chosenOption: string;
    dimension: string;
  }>;
}

interface ModelSummary {
  modelName: string;
  provider: string; // Extracted from modelName (e.g., "openai", "anthropic")
  personalityType: string;
  testTime: string;
  dimensions: {
    E: number;
    I: number;
    S: number;
    N: number;
    T: number;
    F: number;
    J: number;
    P: number;
  };
}

interface SummaryData {
  generatedAt: string;
  totalModels: number;
  models: ModelSummary[];
  mbtiDistribution: Record<string, number>; // e.g., { "ENTJ": 5, "INFP": 2 }
}

function generateSummary(): Promise<SummaryData>;
function loadBenchmarkResults(dir: string): Promise<BenchmarkResult[]>;
function extractProvider(modelName: string): string;
```

**Key Functions**:
- `loadBenchmarkResults()`: 读取 benchmark-result 目录下所有 JSON 文件
- `extractProvider()`: 从 modelName 提取提供商名称（如 "openai/gpt-4" → "openai"）
- `generateSummary()`: 生成汇总数据并保存到 assets/data/summary.json

### 2. Image Generation Module

**File**: `scripts/generate-image.ts`

**Purpose**: 生成展示所有模型 MBTI 分布的静态图片

**Dependencies**:
- `canvas`: Node.js Canvas API for server-side image generation
- `chart.js`: Chart rendering (with node-canvas backend)
- `chartjs-node-canvas`: Chart.js adapter for Node.js

**Interface**:
```typescript
interface ChartConfig {
  width: number;
  height: number;
  backgroundColor: string;
  chartType: 'radar' | 'scatter';
}

interface RadarDataPoint {
  label: string; // Model name
  data: number[]; // [E-I%, S-N%, T-F%, J-P%] normalized to 0-100
  backgroundColor: string;
  borderColor: string;
}

function generateRadarChart(models: ModelSummary[], config: ChartConfig): Promise<Buffer>;
function addLogoWatermark(imageBuffer: Buffer, logoPath: string): Promise<Buffer>;
function saveImage(buffer: Buffer, outputPath: string): Promise<void>;
```

**Chart Design**:
- **Type**: Multi-series Radar Chart
- **Axes**: 4 axes representing E-I, S-N, T-F, J-P dimensions
- **Scale**: 0-100% for each axis
- **Colors**: Distinct colors for each model (using color palette)
- **Legend**: Model names with corresponding colors
- **Watermark**: Logo at bottom-right corner with 30% opacity

**Color Palette**:
```typescript
const COLOR_PALETTE = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
];
```

### 3. Interactive HTML Page

**File**: `index.html`

**Purpose**: 提供交互式 Web 界面展示 MBTI Arena 结果

**Structure**:
```html
<!DOCTYPE html>
<html>
<head>
  <title>LLM MBTI Arena</title>
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
  <header>
    <h1>LLM MBTI Arena</h1>
    <p>Personality Types of Large Language Models</p>
  </header>
  
  <main>
    <!-- Chart Section -->
    <section id="chart-section">
      <canvas id="mbti-chart"></canvas>
    </section>
    
    <!-- Filters Section -->
    <section id="filters">
      <select id="mbti-filter">
        <option value="">All MBTI Types</option>
        <!-- Dynamically populated -->
      </select>
      <select id="provider-filter">
        <option value="">All Providers</option>
        <!-- Dynamically populated -->
      </select>
      <input type="text" id="search-box" placeholder="Search model name...">
    </section>
    
    <!-- Table Section -->
    <section id="table-section">
      <table id="results-table">
        <thead>
          <tr>
            <th data-sort="modelName">Model Name</th>
            <th data-sort="provider">Provider</th>
            <th data-sort="personalityType">MBTI Type</th>
            <th data-sort="E">E-I %</th>
            <th data-sort="S">S-N %</th>
            <th data-sort="T">T-F %</th>
            <th data-sort="J">J-P %</th>
            <th data-sort="testTime">Test Date</th>
          </tr>
        </thead>
        <tbody>
          <!-- Dynamically populated -->
        </tbody>
      </table>
    </section>
    
    <!-- Detail Modal -->
    <div id="detail-modal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2 id="modal-title"></h2>
        <div id="modal-body"></div>
      </div>
    </div>
  </main>
  
  <footer>
    <img src="assets/images/kcores-llm-arena-logo-black.png" alt="Logo">
    <p>LLM MBTI Arena - Powered by MBTI 93-Question Test</p>
  </footer>
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="assets/js/app.js"></script>
</body>
</html>
```

**JavaScript Module**: `assets/js/app.js`

```typescript
class MBTIArena {
  private data: SummaryData;
  private filteredData: ModelSummary[];
  private chart: Chart;
  
  async init(): Promise<void>;
  async loadData(): Promise<void>;
  renderChart(): void;
  renderTable(): void;
  applyFilters(): void;
  sortTable(column: string): void;
  showDetailModal(modelName: string): void;
}

// Data Loading
async function loadSummaryData(): Promise<SummaryData> {
  try {
    const response = await fetch('assets/data/summary.json');
    return await response.json();
  } catch (error) {
    // Fallback: load individual JSON files
    return await loadIndividualResults();
  }
}

// Chart Rendering
function createRadarChart(canvas: HTMLCanvasElement, data: ModelSummary[]): Chart {
  const datasets = data.map((model, index) => ({
    label: model.modelName,
    data: [
      model.dimensions.E, // E-I axis (E side)
      model.dimensions.N, // S-N axis (N side)
      model.dimensions.T, // T-F axis (T side)
      model.dimensions.J  // J-P axis (J side)
    ],
    backgroundColor: `${COLOR_PALETTE[index % COLOR_PALETTE.length]}33`,
    borderColor: COLOR_PALETTE[index % COLOR_PALETTE.length],
    borderWidth: 2
  }));
  
  return new Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['E (Extrovert)', 'N (Intuitive)', 'T (Thinking)', 'J (Judging)'],
      datasets
    },
    options: {
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const model = data[context.datasetIndex];
              return `${model.modelName}: ${context.parsed.r}%`;
            }
          }
        }
      }
    }
  });
}

// Table Rendering
function renderTable(data: ModelSummary[]): void {
  const tbody = document.querySelector('#results-table tbody');
  tbody.innerHTML = data.map(model => `
    <tr data-model="${model.modelName}">
      <td>${model.modelName}</td>
      <td>${model.provider}</td>
      <td><span class="mbti-badge">${model.personalityType}</span></td>
      <td>${model.dimensions.E}% E / ${model.dimensions.I}% I</td>
      <td>${model.dimensions.S}% S / ${model.dimensions.N}% N</td>
      <td>${model.dimensions.T}% T / ${model.dimensions.F}% F</td>
      <td>${model.dimensions.J}% J / ${model.dimensions.P}% P</td>
      <td>${new Date(model.testTime).toLocaleDateString()}</td>
    </tr>
  `).join('');
  
  // Add click handlers
  tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', () => {
      const modelName = row.dataset.model;
      showDetailModal(modelName);
    });
  });
}

// Filtering
function applyFilters(data: ModelSummary[], filters: Filters): ModelSummary[] {
  return data.filter(model => {
    if (filters.mbtiType && model.personalityType !== filters.mbtiType) return false;
    if (filters.provider && model.provider !== filters.provider) return false;
    if (filters.search && !model.modelName.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
}

// Sorting
function sortTable(data: ModelSummary[], column: string, direction: 'asc' | 'desc'): ModelSummary[] {
  return [...data].sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];
    
    if (column === 'testTime') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    return direction === 'asc' ? aVal - bVal : bVal - aVal;
  });
}
```

### 4. README Updater Module

**File**: `scripts/update-readme.ts`

**Purpose**: 自动更新 README.md 中的图片引用

**Interface**:
```typescript
function updateReadme(imagePath: string): Promise<void>;
function insertImageSection(content: string, imagePath: string): string;
```

**Implementation**:
- 在 README.md 的 "## 特性" 部分后插入图片
- 使用标记注释标识自动生成的内容区域
- 保留其他手动编辑的内容

```markdown
## 特性

- 🤖 支持所有 OpenAI 风格的 API 接口
...

<!-- AUTO-GENERATED-VISUALIZATION-START -->
## MBTI 分布可视化

![LLM MBTI Distribution](assets/images/mbti-distribution.png)

查看 [交互式报告](https://your-username.github.io/llm-mbti-arena/) 了解更多详情。
<!-- AUTO-GENERATED-VISUALIZATION-END -->
```

### 5. GitHub Actions Workflow

**File**: `.github/workflows/update-visualization.yml`

```yaml
name: Update Visualization

on:
  push:
    paths:
      - 'benchmark-result/**/*.json'
  workflow_dispatch:

jobs:
  update-visualization:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate summary data
        run: npm run generate:summary
      
      - name: Generate visualization image
        run: npm run generate:image
      
      - name: Update README
        run: npm run update:readme
      
      - name: Commit and push changes
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add assets/data/summary.json
          git add assets/images/mbti-distribution.png
          git add README.md
          git diff --quiet && git diff --staged --quiet || git commit -m "chore: update visualization [skip ci]"
          git push
```

## Data Models

### BenchmarkResult (Input)
```typescript
interface BenchmarkResult {
  modelName: string;           // e.g., "openai/gpt-4o"
  testTime: string;            // ISO 8601 format
  personalityType: string;     // e.g., "ENTJ"
  percentages: {
    E_I: { E: number; I: number };
    S_N: { S: number; N: number };
    T_F: { T: number; F: number };
    J_P: { J: number; P: number };
  };
  answers: Array<{
    questionIndex: number;
    question: string;
    chosenOption: "A" | "B";
    dimension: string;
  }>;
}
```

### ModelSummary (Processed)
```typescript
interface ModelSummary {
  modelName: string;
  provider: string;
  personalityType: string;
  testTime: string;
  dimensions: {
    E: number;  // 0-100
    I: number;  // 0-100
    S: number;  // 0-100
    N: number;  // 0-100
    T: number;  // 0-100
    F: number;  // 0-100
    J: number;  // 0-100
    P: number;  // 0-100
  };
  filePath: string; // For loading full details
}
```

### SummaryData (Output)
```typescript
interface SummaryData {
  generatedAt: string;
  totalModels: number;
  models: ModelSummary[];
  mbtiDistribution: Record<string, number>;
  providerDistribution: Record<string, number>;
}
```

## Error Handling

### Data Loading Errors
- **Invalid JSON**: Skip file and log warning
- **Missing required fields**: Skip file and log warning
- **Empty directory**: Generate empty summary with warning message

### Image Generation Errors
- **Canvas initialization failure**: Throw error with helpful message
- **Logo file not found**: Continue without logo, log warning
- **Save failure**: Throw error and preserve old image

### HTML Page Errors
- **summary.json not found**: Fallback to loading individual JSON files
- **Individual JSON loading failure**: Display error message in UI
- **Chart rendering failure**: Display error message in chart section

## Testing Strategy

### Unit Tests

**Data Processing**:
- Test `loadBenchmarkResults()` with valid and invalid JSON files
- Test `extractProvider()` with various modelName formats
- Test `generateSummary()` output structure

**Image Generation**:
- Test chart configuration generation
- Test color palette assignment
- Mock canvas operations

**README Updater**:
- Test markdown parsing and insertion
- Test preservation of existing content

### Integration Tests

- Test full pipeline: JSON → Summary → Image → README
- Test GitHub Actions workflow locally using `act`

### Manual Testing

- Visual inspection of generated images
- Test HTML page in multiple browsers
- Test filtering and sorting functionality
- Test responsive design on mobile devices

## Performance Considerations

### Data Loading
- Cache summary.json to avoid loading all individual files
- Lazy load full benchmark results only when detail modal is opened

### Image Generation
- Limit number of models displayed in single chart (max 20)
- Generate multiple charts if needed (grouped by MBTI type)

### HTML Page
- Use virtual scrolling for large tables (if > 100 models)
- Debounce filter and search inputs

## Security Considerations

- All data is static JSON files (no user input)
- No server-side processing required
- GitHub Actions uses official actions only
- No external API calls from HTML page

## Deployment

### GitHub Pages Setup
1. Enable GitHub Pages in repository settings
2. Set source to `main` branch, root directory
3. Access at `https://username.github.io/llm-mbti-arena/`

### Local Development
```bash
# Generate visualization locally
npm run generate:summary
npm run generate:image
npm run update:readme

# Serve HTML page locally
npx http-server . -p 8080
```

## Future Enhancements

1. **Advanced Visualizations**:
   - 3D scatter plot for multi-dimensional comparison
   - Time-series chart showing MBTI evolution across model versions
   - Heatmap showing correlation between dimensions

2. **Additional Filters**:
   - Filter by date range
   - Filter by model size/parameters
   - Compare specific models side-by-side

3. **Export Features**:
   - Export filtered data as CSV
   - Download custom charts as PNG
   - Generate PDF reports

4. **Analytics**:
   - Track most common MBTI types
   - Identify trends across providers
   - Statistical analysis of dimension distributions
