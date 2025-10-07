# GitHub Actions 设置指南

## 工作流概述

本项目使用 GitHub Actions 自动化可视化内容的更新。当有新的测试结果提交到 `benchmark-result` 目录时，工作流会自动：

1. 生成汇总数据文件 (`assets/data/summary.json`)
2. 生成可视化图片 (`assets/images/mbti-distribution.png`)
3. 更新 README.md 中的图片引用

## 配置步骤

### 1. 更新 README 徽章

在 `README.md` 文件的顶部，将以下占位符替换为实际的仓库信息：

```markdown
[![Update Visualization](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/update-visualization.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/update-visualization.yml)
```

替换为：

```markdown
[![Update Visualization](https://github.com/你的用户名/你的仓库名/actions/workflows/update-visualization.yml/badge.svg)](https://github.com/你的用户名/你的仓库名/actions/workflows/update-visualization.yml)
```

### 2. 启用 GitHub Actions

1. 进入仓库的 **Settings** > **Actions** > **General**
2. 确保 **Actions permissions** 设置为 "Allow all actions and reusable workflows"
3. 在 **Workflow permissions** 部分，选择 "Read and write permissions"
4. 勾选 "Allow GitHub Actions to create and approve pull requests"（可选）

### 3. 触发工作流

工作流会在以下情况自动触发：

- **自动触发**：当有新文件推送到 `benchmark-result/**/*.json` 路径时
- **手动触发**：在 GitHub 仓库的 **Actions** 标签页，选择 "Update Visualization" 工作流，点击 "Run workflow"

### 4. 查看工作流状态

1. 进入仓库的 **Actions** 标签页
2. 选择 "Update Visualization" 工作流
3. 查看最近的运行记录和日志

## 工作流详情

### 触发条件

```yaml
on:
  push:
    paths:
      - 'benchmark-result/**/*.json'
  workflow_dispatch:
```

- `push.paths`: 仅当 `benchmark-result` 目录下的 JSON 文件发生变化时触发
- `workflow_dispatch`: 支持手动触发

### 执行步骤

1. **Checkout repository**: 检出代码
2. **Setup Node.js**: 安装 Node.js 18
3. **Install dependencies**: 安装项目依赖
4. **Generate summary data**: 运行 `npm run generate:summary`
5. **Generate visualization image**: 运行 `npm run generate:image`
6. **Update README**: 运行 `npm run update:readme`
7. **Commit and push changes**: 提交并推送更新的文件

### 错误处理

- 每个生成步骤都使用 `continue-on-error: false`，确保任何错误都会导致工作流失败
- 失败时会记录详细的环境信息和文件系统状态
- 错误日志会作为 artifact 上传，保留 7 天

### 避免无限循环

工作流在提交时使用 `[skip ci]` 标记，防止提交触发新的工作流运行：

```bash
git commit -m "chore: update visualization [skip ci]"
```

## 本地测试

在推送到 GitHub 之前，可以在本地测试生成脚本：

```bash
# 生成汇总数据
npm run generate:summary

# 生成可视化图片
npm run generate:image

# 更新 README
npm run update:readme
```

## 故障排除

### 工作流失败

1. 查看 Actions 标签页中的错误日志
2. 检查是否有语法错误或缺少依赖
3. 下载 error-logs artifact 查看详细日志

### 权限问题

如果工作流无法推送更改，检查：

1. 仓库的 Actions 权限设置
2. 确保 workflow 文件中包含 `permissions: contents: write`

### 图片生成失败

如果图片生成失败，可能是因为：

1. Canvas 依赖未正确安装（需要系统级依赖）
2. 数据格式不正确
3. 内存不足（可以在 workflow 中增加 Node.js 内存限制）

解决方案：

```yaml
- name: Generate visualization image
  run: NODE_OPTIONS="--max-old-space-size=4096" npm run generate:image
```

## 高级配置

### 自定义触发条件

如果需要在其他情况下触发工作流，可以修改 `on` 部分：

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'benchmark-result/**/*.json'
  schedule:
    - cron: '0 0 * * *'  # 每天午夜运行
  workflow_dispatch:
```

### 添加通知

可以添加 Slack 或 Discord 通知：

```yaml
- name: Notify on success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Visualization updated successfully!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [工作流语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [可视化指南](./visualization-guide.md)
