import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { createCanvas, loadImage, Canvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { loadBenchmarkResults, extractProvider } from './lib/data-loader';
import { createRadarChartConfig } from './lib/chart-config';
import { ModelSummary, BenchmarkResult } from '../src/types';

/**
 * Convert BenchmarkResult to ModelSummary
 * @param result - Benchmark result from JSON file
 * @param filePath - Path to the source file
 * @returns ModelSummary object
 */
function benchmarkToSummary(result: BenchmarkResult, filePath: string): ModelSummary {
  return {
    modelName: result.modelName,
    provider: extractProvider(result.modelName),
    personalityType: result.personalityType,
    testTime: result.testTime,
    dimensions: {
      E: result.percentages.E_I.E,
      I: result.percentages.E_I.I,
      S: result.percentages.S_N.S,
      N: result.percentages.S_N.N,
      T: result.percentages.T_F.T,
      F: result.percentages.T_F.F,
      J: result.percentages.J_P.J,
      P: result.percentages.J_P.P,
    },
    filePath,
  };
}

/**
 * Generate radar chart image
 * @param models - Array of model summaries
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Image buffer
 */
async function generateRadarChart(
  models: ModelSummary[],
  width: number = 1200,
  height: number = 800
): Promise<Buffer> {
  try {
    // Create Chart.js configuration
    const chartConfig = createRadarChartConfig(models);
    
    // Initialize ChartJS Node Canvas
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: 'white',
    });
    
    // Render chart to buffer
    const buffer = await chartJSNodeCanvas.renderToBuffer(chartConfig as any);
    
    console.log(`✓ Generated radar chart (${width}x${height}px)`);
    return buffer;
    
  } catch (error) {
    console.error('Failed to generate radar chart:', error);
    throw new Error(`Chart generation failed: ${error}`);
  }
}

/**
 * Add logo watermark to image
 * @param imageBuffer - Original image buffer
 * @param logoPath - Path to logo file
 * @param opacity - Logo opacity (0-1)
 * @returns Image buffer with watermark
 */
async function addLogoWatermark(
  imageBuffer: Buffer,
  logoPath: string,
  opacity: number = 0.3
): Promise<Buffer> {
  try {
    // Check if logo file exists
    if (!fs.existsSync(logoPath)) {
      console.warn(`⚠ Logo file not found at ${logoPath}, skipping watermark`);
      return imageBuffer;
    }
    
    // Load the original image
    const originalImage = await loadImage(imageBuffer);
    
    // Create canvas with same dimensions
    const canvas = createCanvas(originalImage.width, originalImage.height);
    const ctx = canvas.getContext('2d');
    
    // Draw original image
    ctx.drawImage(originalImage, 0, 0);
    
    // Load logo
    const logo = await loadImage(logoPath);
    
    // Calculate logo dimensions (max 150px width, maintain aspect ratio)
    const maxLogoWidth = 150;
    const logoAspectRatio = logo.width / logo.height;
    const logoWidth = Math.min(logo.width, maxLogoWidth);
    const logoHeight = logoWidth / logoAspectRatio;
    
    // Position logo at bottom-right corner with padding
    const padding = 20;
    const logoX = canvas.width - logoWidth - padding;
    const logoY = canvas.height - logoHeight - padding;
    
    // Set opacity
    ctx.globalAlpha = opacity;
    
    // Draw logo
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    
    // Reset opacity
    ctx.globalAlpha = 1.0;
    
    console.log(`✓ Added logo watermark (opacity: ${opacity * 100}%)`);
    
    // Convert canvas to buffer
    return canvas.toBuffer('image/png');
    
  } catch (error) {
    console.error('Failed to add logo watermark:', error);
    console.warn('⚠ Continuing without watermark');
    return imageBuffer;
  }
}

/**
 * Save image to file with error handling
 * @param buffer - Image buffer to save
 * @param outputPath - Destination file path
 * @returns true if successful, false otherwise
 */
async function saveImage(buffer: Buffer, outputPath: string): Promise<boolean> {
  try {
    const outputDir = path.dirname(outputPath);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`✓ Created directory: ${outputDir}`);
    }
    
    // Check if old image exists (for backup)
    const backupPath = outputPath + '.backup';
    if (fs.existsSync(outputPath)) {
      try {
        // Create backup of old image
        fs.copyFileSync(outputPath, backupPath);
        console.log(`✓ Created backup of existing image`);
      } catch (backupError) {
        console.warn('⚠ Failed to create backup, continuing anyway');
      }
    }
    
    // Write new image file
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ Saved image to: ${outputPath}`);
    
    // Remove backup if write was successful
    if (fs.existsSync(backupPath)) {
      try {
        fs.unlinkSync(backupPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('Failed to save image:', error);
    
    // Try to restore backup if it exists
    const backupPath = outputPath + '.backup';
    if (fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, outputPath);
        console.log('✓ Restored backup image');
        fs.unlinkSync(backupPath);
      } catch (restoreError) {
        console.error('Failed to restore backup:', restoreError);
      }
    }
    
    return false;
  }
}

/**
 * Main function to generate visualization image
 */
async function main() {
  try {
    console.log('Starting image generation...\n');
    
    // Load benchmark results
    const benchmarkDir = path.join(process.cwd(), 'benchmark-result');
    console.log(`Loading benchmark results from: ${benchmarkDir}`);
    
    const results = await loadBenchmarkResults(benchmarkDir);
    
    if (results.length === 0) {
      console.warn('⚠ No benchmark results found. Cannot generate image.');
      process.exit(0);
    }
    
    // Convert to model summaries
    const models = results.map((result, index) => 
      benchmarkToSummary(result, `benchmark-result/file-${index}.json`)
    );
    
    console.log(`\nProcessing ${models.length} models for visualization`);
    
    // Generate radar chart
    let imageBuffer = await generateRadarChart(models, 1200, 800);
    
    // Add logo watermark
    const logoPath = path.join(process.cwd(), 'assets', 'images', 'kcores-llm-arena-logo-black.png');
    imageBuffer = await addLogoWatermark(imageBuffer, logoPath, 0.3);
    
    // Save image with error handling
    const outputPath = path.join(process.cwd(), 'assets', 'images', 'mbti-distribution.png');
    const saveSuccess = await saveImage(imageBuffer, outputPath);
    
    if (!saveSuccess) {
      console.error('\n❌ Failed to save image');
      process.exit(1);
    }
    
    console.log('\n✅ Image generation completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Image generation failed:', error);
    process.exit(1);
  }
}

// Run main function
main();
