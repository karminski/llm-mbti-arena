# GitHub Pages 配置指南

本指南将帮助你配置 GitHub Pages，使交互式 MBTI 可视化页面可以通过公开 URL 访问。

## 目录

- [前置要求](#前置要求)
- [快速配置](#快速配置)
- [详细步骤](#详细步骤)
- [验证部署](#验证部署)
- [自定义域名](#自定义域名)
- [故障排除](#故障排除)

## 前置要求

- GitHub 账号
- 已 fork 或创建的 LLM MBTI Arena 仓库
- 仓库中包含 `index.html` 文件

## 快速配置

### 方法 1：通过 GitHub 网页界面

1. 进入你的仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages**
4. 在 **Source** 部分：
   - Branch: 选择 `main`（或你的主分支）
   - Folder: 选择 `/ (root)`
5. 点击 **Save**
6. 等待几分钟，页面会显示访问 URL

### 方法 2：通过 GitHub CLI

```bash
# 启用 GitHub Pages
gh repo edit --enable-pages --pages-branch main --pages-path /

# 查看状态
gh repo view --web
```

## 详细步骤

### 步骤 1：访问仓库设置

1. 登录 GitHub
2. 进入你的 `llm-mbti-arena` 仓库
3. 点击页面顶部的 **Settings** 标签

![Settings Tab](https://docs.github.com/assets/cb-28266/images/help/repository/repo-actions-settings.png)

### 步骤 2：找到 Pages 设置

在左侧导航栏中，向下滚动找到 **Pages** 选项（在 Code and automation 部分）。

### 步骤 3：配置 Source

在 **Build and deployment** 部分：

#### Source 设置

- **Source**: 选择 "Deploy from a branch"
- **Branch**: 
  - 选择 `main`（或你的默认分支）
  - 文件夹选择 `/ (root)`
- 点击 **Save** 按钮

![GitHub Pages Source](https://docs.github.com/assets/cb-47267/images/help/pages/select-branch.png)

### 步骤 4：等待部署

保存后，GitHub 会开始构建和部署你的站点：

1. 页面顶部会显示一个蓝色提示框
2. 几分钟后，提示框会变成绿色
3. 显示你的站点 URL：`https://username.github.io/llm-mbti-arena/`

### 步骤 5：验证部署

点击显示的 URL 或访问：

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

你应该能看到交互式 MBTI Arena 页面。

## 配置选项

### 使用 GitHub Actions 部署（推荐）

如果你想要更多控制，可以使用 GitHub Actions 部署：

1. 在 Pages 设置中，**Source** 选择 "GitHub Actions"
2. 创建 `.github/workflows/deploy-pages.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 自定义 404 页面

创建 `404.html` 文件：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - 页面未找到</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
    }
    h1 {
      font-size: 6rem;
      margin: 0;
    }
    p {
      font-size: 1.5rem;
    }
    a {
      color: white;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>页面未找到</p>
    <p><a href="/">返回首页</a></p>
  </div>
</body>
</html>
```

## 验证部署

### 检查清单

- [ ] 页面可以正常访问
- [ ] 雷达图正确显示
- [ ] 数据表格加载成功
- [ ] 筛选功能正常工作
- [ ] 排序功能正常工作
- [ ] 详情弹窗可以打开
- [ ] Logo 正确显示
- [ ] 移动端响应式布局正常

### 测试步骤

1. **访问主页**
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
   ```

2. **检查控制台**
   - 打开浏览器开发者工具（F12）
   - 查看 Console 标签，确保没有错误

3. **测试功能**
   - 尝试筛选不同的 MBTI 类型
   - 尝试搜索模型名称
   - 点击表格行查看详情
   - 点击表头进行排序

4. **测试移动端**
   - 在开发者工具中切换到移动设备视图
   - 验证布局是否正常

### 常见问题检查

如果页面无法正常工作，检查以下内容：

```bash
# 1. 确保所有必需文件都已提交
git status

# 2. 检查文件路径是否正确
ls -la index.html
ls -la assets/data/summary.json
ls -la assets/images/mbti-distribution.png
ls -la assets/css/styles.css
ls -la assets/js/app.js

# 3. 验证 JSON 文件格式
cat assets/data/summary.json | jq .

# 4. 提交缺失的文件
git add .
git commit -m "chore: add missing files for GitHub Pages"
git push
```

## 自定义域名

### 使用自定义域名

如果你有自己的域名，可以配置自定义域名：

#### 步骤 1：添加 CNAME 记录

在你的域名提供商处添加 CNAME 记录：

```
Type: CNAME
Name: mbti (或其他子域名)
Value: YOUR_USERNAME.github.io
```

#### 步骤 2：在 GitHub 配置

1. 在 Pages 设置页面
2. 在 **Custom domain** 输入框输入你的域名
3. 点击 **Save**
4. 等待 DNS 检查完成
5. 勾选 **Enforce HTTPS**

#### 步骤 3：添加 CNAME 文件

在仓库根目录创建 `CNAME` 文件：

```bash
echo "mbti.yourdomain.com" > CNAME
git add CNAME
git commit -m "chore: add custom domain"
git push
```

### 使用 Apex 域名

如果要使用根域名（如 `yourdomain.com`）：

1. 在 DNS 提供商添加 A 记录：

```
Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

2. 在 GitHub Pages 设置中输入你的域名

## 更新和维护

### 自动更新

配置了 GitHub Actions 后，每次推送新的测试结果都会自动更新页面：

```bash
# 添加新的测试结果
git add benchmark-result/new-model.json
git commit -m "feat: add new model test result"
git push

# GitHub Actions 会自动：
# 1. 生成新的 summary.json
# 2. 更新 mbti-distribution.png
# 3. 更新 README.md
# 4. 部署到 GitHub Pages
```

### 手动更新

如果需要手动更新：

```bash
# 1. 生成可视化内容
npm run generate:summary
npm run generate:image
npm run update:readme

# 2. 提交更改
git add assets/
git add README.md
git commit -m "chore: update visualization"
git push

# 3. 等待 GitHub Pages 重新部署（约 1-2 分钟）
```

### 查看部署状态

1. 进入仓库的 **Actions** 标签
2. 查看最近的工作流运行
3. 绿色勾号表示部署成功
4. 红色叉号表示部署失败，点击查看日志

## 性能优化

### 启用缓存

在 `index.html` 中添加缓存控制：

```html
<meta http-equiv="Cache-Control" content="max-age=3600">
```

### 压缩资源

使用 GitHub Actions 压缩资源：

```yaml
- name: Optimize assets
  run: |
    # 压缩 CSS
    npx csso assets/css/styles.css -o assets/css/styles.min.css
    
    # 压缩 JS
    npx terser assets/js/app.js -o assets/js/app.min.js
    
    # 优化图片
    npx imagemin assets/images/*.png --out-dir=assets/images/
```

### 使用 CDN

将大型库从 CDN 加载：

```html
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- 或使用 unpkg -->
<script src="https://unpkg.com/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

## 安全性

### HTTPS

始终启用 HTTPS：

1. 在 Pages 设置中勾选 **Enforce HTTPS**
2. 这会自动将 HTTP 请求重定向到 HTTPS

### 内容安全策略

在 `index.html` 中添加 CSP 头：

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data:;">
```

## 监控和分析

### 添加 Google Analytics

在 `index.html` 的 `<head>` 中添加：

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 使用 GitHub Insights

GitHub 提供内置的流量统计：

1. 进入仓库的 **Insights** 标签
2. 点击 **Traffic**
3. 查看访问量、访客数、热门页面等

## 故障排除

### 页面显示 404

**原因**：
- GitHub Pages 未正确配置
- 分支或路径设置错误
- 部署尚未完成

**解决方案**：
1. 检查 Pages 设置中的分支和路径
2. 确保 `index.html` 在正确的位置
3. 等待几分钟让部署完成
4. 清除浏览器缓存

### 资源加载失败

**原因**：
- 文件路径错误
- 文件未提交到仓库
- CORS 问题

**解决方案**：
```bash
# 检查文件是否存在
git ls-files | grep assets

# 确保所有资源文件都已提交
git add assets/
git commit -m "chore: add missing assets"
git push
```

### 数据不显示

**原因**：
- `summary.json` 文件缺失或格式错误
- JavaScript 错误

**解决方案**：
1. 打开浏览器控制台查看错误
2. 验证 `summary.json` 格式：
   ```bash
   cat assets/data/summary.json | jq .
   ```
3. 重新生成数据：
   ```bash
   npm run generate:summary
   git add assets/data/summary.json
   git commit -m "fix: regenerate summary data"
   git push
   ```

### 样式不正确

**原因**：
- CSS 文件路径错误
- CSS 文件未加载

**解决方案**：
1. 检查 `index.html` 中的 CSS 引用路径
2. 确保使用相对路径：
   ```html
   <link rel="stylesheet" href="assets/css/styles.css">
   ```
3. 不要使用绝对路径或 `/` 开头的路径

### 部署后更改未生效

**原因**：
- 浏览器缓存
- GitHub Pages 缓存
- 部署尚未完成

**解决方案**：
1. 强制刷新浏览器（Ctrl+Shift+R 或 Cmd+Shift+R）
2. 清除浏览器缓存
3. 等待 5-10 分钟
4. 检查 Actions 标签确认部署成功

## 最佳实践

### 1. 使用分支保护

保护 `main` 分支，要求 PR 审查：

```bash
# 通过 GitHub 网页界面设置
Settings → Branches → Add rule
- Branch name pattern: main
- Require pull request reviews before merging
- Require status checks to pass before merging
```

### 2. 自动化测试

在部署前运行测试：

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run test:local
  
  deploy:
    needs: test
    # ... 部署步骤
```

### 3. 版本标签

为重要更新创建版本标签：

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 4. 定期备份

定期备份测试结果：

```bash
# 创建备份分支
git checkout -b backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)
```

## 相关资源

- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [自定义域名配置](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Jekyll 主题](https://pages.github.com/themes/)（可选）

## 获取帮助

如果遇到问题：

1. 查看 [GitHub Pages 状态](https://www.githubstatus.com/)
2. 搜索 [GitHub Community](https://github.community/)
3. 提交 Issue 到项目仓库
4. 参考 [可视化功能指南](visualization-guide.md)

---

配置完成后，你的 MBTI Arena 页面将可以通过公开 URL 访问！
