import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const README_PATH = join(process.cwd(), 'README.md');
const IMAGE_PATH = 'assets/images/mbti-distribution.png';
const START_MARKER = '<!-- AUTO-GENERATED-VISUALIZATION-START -->';
const END_MARKER = '<!-- AUTO-GENERATED-VISUALIZATION-END -->';

interface UpdateOptions {
  imagePath?: string;
  githubPagesUrl?: string;
}

/**
 * 生成可视化部分的 Markdown 内容
 */
function generateVisualizationSection(options: UpdateOptions = {}): string {
  const imagePath = options.imagePath || IMAGE_PATH;
  const githubPagesUrl = options.githubPagesUrl || '#';
  
  return `${START_MARKER}
## MBTI 分布可视化

![LLM MBTI Distribution](${imagePath})

查看 [交互式报告](${githubPagesUrl}) 了解更多详情。
${END_MARKER}`;
}

/**
 * 在指定位置插入可视化部分
 * 如果已存在标记区域，则替换；否则在 "## 特性" 部分后插入
 */
function insertImageSection(content: string, visualizationSection: string): string {
  // 检查是否已存在自动生成的区域
  const startIndex = content.indexOf(START_MARKER);
  const endIndex = content.indexOf(END_MARKER);
  
  if (startIndex !== -1 && endIndex !== -1) {
    // 替换现有区域
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex + END_MARKER.length);
    return before + visualizationSection + after;
  }
  
  // 查找 "## 特性" 部分后的位置
  const featuresSectionMatch = content.match(/## 特性[\s\S]*?(?=\n## )/);
  
  if (featuresSectionMatch) {
    const featuresSectionEnd = featuresSectionMatch.index! + featuresSectionMatch[0].length;
    const before = content.substring(0, featuresSectionEnd);
    const after = content.substring(featuresSectionEnd);
    return before + '\n\n' + visualizationSection + '\n' + after;
  }
  
  // 如果找不到 "## 特性" 部分，在第一个 ## 标题后插入
  const firstSectionMatch = content.match(/\n## /);
  
  if (firstSectionMatch) {
    const insertPosition = firstSectionMatch.index! + firstSectionMatch[0].length;
    // 找到这个标题的结束位置（下一个 ## 或文件末尾）
    const nextSectionMatch = content.substring(insertPosition).match(/\n## /);
    const sectionEnd = nextSectionMatch 
      ? insertPosition + nextSectionMatch.index! 
      : content.length;
    
    const before = content.substring(0, sectionEnd);
    const after = content.substring(sectionEnd);
    return before + '\n\n' + visualizationSection + '\n' + after;
  }
  
  // 如果没有找到任何 ## 标题，在文件末尾添加
  return content + '\n\n' + visualizationSection + '\n';
}

/**
 * 更新 README.md 文件
 */
export async function updateReadme(options: UpdateOptions = {}): Promise<void> {
  try {
    // 读取当前 README.md
    let content: string;
    try {
      content = await readFile(README_PATH, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn('⚠️  README.md 不存在，将创建新文件');
        content = '# LLM MBTI Arena\n\n一个用于测试大语言模型（LLM）人格类型的命令行工具。\n';
      } else {
        throw error;
      }
    }
    
    // 生成可视化部分
    const visualizationSection = generateVisualizationSection(options);
    
    // 插入或更新可视化部分
    const updatedContent = insertImageSection(content, visualizationSection);
    
    // 写入文件
    await writeFile(README_PATH, updatedContent, 'utf-8');
    
    console.log('✅ README.md 已成功更新');
  } catch (error) {
    console.error('❌ 更新 README.md 失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
// 检查是否为主模块（直接运行而非被导入）
if (import.meta.url.endsWith('update-readme.ts')) {
  updateReadme()
    .then(() => {
      console.log('🎉 README 更新完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 执行失败:', error);
      process.exit(1);
    });
}
