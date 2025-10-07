#!/usr/bin/env tsx

/**
 * Local Test Script for Visualization Generation
 * 
 * This script tests the complete visualization generation pipeline:
 * 1. Generates summary data from test assets
 * 2. Generates visualization image
 * 3. Updates README with visualization
 * 4. Validates all generated files
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function log(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m'    // Red
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  if (passed) {
    log(`✓ ${name}: ${message}`, 'success');
  } else {
    log(`✗ ${name}: ${message}`, 'error');
  }
}

function fileExists(path: string): boolean {
  return existsSync(path);
}

function validateJsonFile(path: string): boolean {
  try {
    const content = readFileSync(path, 'utf-8');
    JSON.parse(content);
    return true;
  } catch (error) {
    return false;
  }
}

function validateImageFile(path: string): boolean {
  try {
    const stats = statSync(path);
    // Check if file exists and has reasonable size (> 1KB)
    return stats.size > 1024;
  } catch (error) {
    return false;
  }
}

async function runTests() {
  log('\n=== Starting Local Visualization Generation Tests ===\n', 'info');

  // Test 1: Check test data exists
  log('Test 1: Validating test data...', 'info');
  const testFiles = [
    'test-assets/sample-benchmark-1.json',
    'test-assets/sample-benchmark-2.json',
    'test-assets/sample-benchmark-3.json'
  ];
  
  let allTestFilesExist = true;
  for (const file of testFiles) {
    if (!fileExists(file)) {
      allTestFilesExist = false;
      addResult('Test Data', false, `Missing test file: ${file}`);
      break;
    }
  }
  
  if (allTestFilesExist) {
    addResult('Test Data', true, 'All test data files exist');
  }

  // Test 2: Generate summary data
  log('\nTest 2: Generating summary data...', 'info');
  try {
    execSync('npm run generate:summary', { stdio: 'pipe' });
    
    if (fileExists('assets/data/summary.json')) {
      if (validateJsonFile('assets/data/summary.json')) {
        const summary = JSON.parse(readFileSync('assets/data/summary.json', 'utf-8'));
        
        // Validate structure
        const hasRequiredFields = 
          summary.generatedAt &&
          summary.totalModels !== undefined &&
          Array.isArray(summary.models) &&
          summary.mbtiDistribution &&
          summary.providerDistribution;
        
        if (hasRequiredFields) {
          addResult('Summary Generation', true, `Generated summary with ${summary.totalModels} models`);
        } else {
          addResult('Summary Generation', false, 'Summary JSON missing required fields');
        }
      } else {
        addResult('Summary Generation', false, 'Invalid JSON format');
      }
    } else {
      addResult('Summary Generation', false, 'Summary file not created');
    }
  } catch (error) {
    addResult('Summary Generation', false, `Script execution failed: ${error}`);
  }

  // Test 3: Generate visualization image
  log('\nTest 3: Generating visualization image...', 'info');
  try {
    execSync('npm run generate:image', { stdio: 'pipe' });
    
    if (fileExists('assets/images/mbti-distribution.png')) {
      if (validateImageFile('assets/images/mbti-distribution.png')) {
        const stats = statSync('assets/images/mbti-distribution.png');
        addResult('Image Generation', true, `Generated image (${Math.round(stats.size / 1024)}KB)`);
      } else {
        addResult('Image Generation', false, 'Image file too small or corrupted');
      }
    } else {
      addResult('Image Generation', false, 'Image file not created');
    }
  } catch (error) {
    addResult('Image Generation', false, `Script execution failed: ${error}`);
  }

  // Test 4: Update README
  log('\nTest 4: Updating README...', 'info');
  try {
    const readmeBefore = fileExists('README.md') ? readFileSync('README.md', 'utf-8') : '';
    
    execSync('npm run update:readme', { stdio: 'pipe' });
    
    if (fileExists('README.md')) {
      const readmeAfter = readFileSync('README.md', 'utf-8');
      
      // Check if visualization section was added
      const hasVisualizationSection = 
        readmeAfter.includes('AUTO-GENERATED-VISUALIZATION-START') &&
        readmeAfter.includes('AUTO-GENERATED-VISUALIZATION-END') &&
        readmeAfter.includes('mbti-distribution.png');
      
      if (hasVisualizationSection) {
        addResult('README Update', true, 'Visualization section added to README');
      } else {
        addResult('README Update', false, 'Visualization section not found in README');
      }
    } else {
      addResult('README Update', false, 'README.md not found');
    }
  } catch (error) {
    addResult('README Update', false, `Script execution failed: ${error}`);
  }

  // Test 5: Validate HTML page can load data
  log('\nTest 5: Validating HTML page structure...', 'info');
  if (fileExists('index.html')) {
    const html = readFileSync('index.html', 'utf-8');
    
    const hasRequiredElements = 
      html.includes('id="mbti-chart"') &&
      html.includes('id="results-table"') &&
      html.includes('id="mbti-filter"') &&
      html.includes('id="provider-filter"') &&
      html.includes('assets/js/app.js');
    
    if (hasRequiredElements) {
      addResult('HTML Structure', true, 'All required elements present');
    } else {
      addResult('HTML Structure', false, 'Missing required HTML elements');
    }
  } else {
    addResult('HTML Structure', false, 'index.html not found');
  }

  // Test 6: Validate JavaScript app exists
  log('\nTest 6: Validating JavaScript application...', 'info');
  if (fileExists('assets/js/app.js')) {
    const js = readFileSync('assets/js/app.js', 'utf-8');
    
    const hasRequiredFunctions = 
      js.includes('class MBTIArena') &&
      js.includes('loadSummaryData') &&
      js.includes('createRadarChart') &&
      js.includes('renderTable');
    
    if (hasRequiredFunctions) {
      addResult('JavaScript App', true, 'All required functions present');
    } else {
      addResult('JavaScript App', false, 'Missing required functions');
    }
  } else {
    addResult('JavaScript App', false, 'app.js not found');
  }

  // Print summary
  log('\n=== Test Summary ===\n', 'info');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  log(`Total Tests: ${total}`, 'info');
  log(`Passed: ${passed}`, passed === total ? 'success' : 'info');
  log(`Failed: ${total - passed}`, total - passed === 0 ? 'info' : 'error');
  
  if (passed === total) {
    log('\n✓ All tests passed! Visualization generation is working correctly.', 'success');
    process.exit(0);
  } else {
    log('\n✗ Some tests failed. Please check the errors above.', 'error');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\nFatal error: ${error}`, 'error');
  process.exit(1);
});
