import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkResult, ModelSummary, SummaryData } from '../src/types';
import { loadBenchmarkResults, extractProvider } from './lib/data-loader';

/**
 * Convert BenchmarkResult to ModelSummary
 * @param result - Benchmark result from JSON file
 * @param filePath - Path to the source JSON file
 * @returns ModelSummary object
 */
function convertToModelSummary(result: BenchmarkResult, filePath: string): ModelSummary {
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
 * Generate summary data from benchmark results
 * @param benchmarkDir - Directory containing benchmark result JSON files
 * @param outputPath - Path to save the summary JSON file
 */
export async function generateSummary(
  benchmarkDir: string = 'benchmark-result',
  outputPath: string = 'assets/data/summary.json'
): Promise<void> {
  try {
    console.log('Starting summary generation...');
    console.log(`Reading benchmark results from: ${benchmarkDir}`);
    
    // Load all benchmark results
    const results = await loadBenchmarkResults(benchmarkDir);
    
    if (results.length === 0) {
      console.warn('No valid benchmark results found. Creating empty summary.');
    }
    
    // Convert to model summaries
    const models: ModelSummary[] = results.map((result, index) => {
      // Get the original filename from directory
      const files = fs.readdirSync(benchmarkDir).filter(f => f.endsWith('.json'));
      const filePath = path.join(benchmarkDir, files[index] || '');
      return convertToModelSummary(result, filePath);
    });
    
    // Calculate MBTI distribution
    const mbtiDistribution: Record<string, number> = {};
    for (const model of models) {
      const mbtiType = model.personalityType;
      mbtiDistribution[mbtiType] = (mbtiDistribution[mbtiType] || 0) + 1;
    }
    
    // Calculate provider distribution
    const providerDistribution: Record<string, number> = {};
    for (const model of models) {
      const provider = model.provider;
      providerDistribution[provider] = (providerDistribution[provider] || 0) + 1;
    }
    
    // Create summary data
    const summaryData: SummaryData = {
      generatedAt: new Date().toISOString(),
      totalModels: models.length,
      models,
      mbtiDistribution,
      providerDistribution,
    };
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write summary to file
    fs.writeFileSync(outputPath, JSON.stringify(summaryData, null, 2), 'utf-8');
    
    console.log(`✓ Summary generated successfully!`);
    console.log(`  Total models: ${summaryData.totalModels}`);
    console.log(`  MBTI types: ${Object.keys(mbtiDistribution).length}`);
    console.log(`  Providers: ${Object.keys(providerDistribution).length}`);
    console.log(`  Output: ${outputPath}`);
    
  } catch (error) {
    console.error('Failed to generate summary:', error);
    throw error;
  }
}

// Run the generation only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSummary()
    .then(() => {
      console.log('Summary generation completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Summary generation failed:', error);
      process.exit(1);
    });
}
