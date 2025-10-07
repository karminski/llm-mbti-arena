import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkResult } from '../../src/types';

/**
 * Extract provider name from model name
 * @param modelName - Full model name (e.g., "openai/gpt-4o-mini")
 * @returns Provider name (e.g., "openai")
 */
export function extractProvider(modelName: string): string {
  // Handle format: "provider/model-name"
  if (modelName.includes('/')) {
    return modelName.split('/')[0];
  }
  
  // Handle format: "provider_model-name" (from filename)
  if (modelName.includes('_')) {
    return modelName.split('_')[0];
  }
  
  // Default: return the whole name
  return modelName;
}

/**
 * Validate if a benchmark result has all required fields
 * @param data - Parsed JSON data
 * @returns true if valid, false otherwise
 */
function isValidBenchmarkResult(data: any): data is BenchmarkResult {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check required fields
  if (!data.modelName || typeof data.modelName !== 'string') {
    return false;
  }
  
  if (!data.testTime || typeof data.testTime !== 'string') {
    return false;
  }
  
  if (!data.personalityType || typeof data.personalityType !== 'string') {
    return false;
  }
  
  // Check percentages structure
  if (!data.percentages || typeof data.percentages !== 'object') {
    return false;
  }
  
  const requiredDimensions = ['E_I', 'S_N', 'T_F', 'J_P'];
  for (const dim of requiredDimensions) {
    if (!data.percentages[dim] || typeof data.percentages[dim] !== 'object') {
      return false;
    }
  }
  
  return true;
}

/**
 * Load all benchmark results from the benchmark-result directory
 * @param dir - Directory path containing benchmark result JSON files
 * @returns Array of valid benchmark results
 */
export async function loadBenchmarkResults(dir: string): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  try {
    // Check if directory exists
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      return results;
    }
    
    // Read all files in directory
    const files = fs.readdirSync(dir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.warn(`No JSON files found in ${dir}`);
      return results;
    }
    
    console.log(`Found ${jsonFiles.length} JSON files in ${dir}`);
    
    // Process each JSON file
    for (const file of jsonFiles) {
      const filePath = path.join(dir, file);
      
      try {
        // Read and parse JSON file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        // Validate data structure
        if (!isValidBenchmarkResult(data)) {
          console.warn(`Invalid benchmark result structure in ${file}, skipping...`);
          continue;
        }
        
        results.push(data);
      } catch (error) {
        // Handle individual file errors
        if (error instanceof SyntaxError) {
          console.error(`Failed to parse JSON in ${file}: ${error.message}`);
        } else {
          console.error(`Failed to read ${file}: ${error}`);
        }
        // Continue processing other files
        continue;
      }
    }
    
    console.log(`Successfully loaded ${results.length} benchmark results`);
    return results;
    
  } catch (error) {
    console.error(`Error loading benchmark results from ${dir}:`, error);
    throw error;
  }
}
