/**
 * Manual test script for ProgressRenderer
 * Run with: npx tsx scripts/test-progress-renderer.ts
 */

import { ProgressRenderer } from '../src/progress-renderer.js';
import { ProgressState } from '../src/types.js';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testProgressRenderer() {
  const renderer = new ProgressRenderer('openai/gpt-4o');

  console.log('Testing ProgressRenderer...\n');
  await sleep(1000);

  // Simulate progress through questions
  for (let i = 1; i <= 20; i++) {
    const state: ProgressState = {
      currentQuestion: i,
      totalQuestions: 93,
      scores: {
        E: Math.floor(i * 0.6),
        I: Math.floor(i * 0.4),
        S: Math.floor(i * 0.3),
        N: Math.floor(i * 0.7),
        T: Math.floor(i * 0.4),
        F: Math.floor(i * 0.6),
        J: Math.floor(i * 0.5),
        P: Math.floor(i * 0.5),
      },
      currentType: 'ENFP',
    };

    renderer.render(state);
    await sleep(200); // Simulate time between questions
  }

  // Finalize
  renderer.finalize();
  console.log('\nProgress renderer test completed!');
}

testProgressRenderer().catch(console.error);
