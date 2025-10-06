import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  minify: false,
  bundle: true,
  outDir: 'dist',
  platform: 'node',
  shims: true,
  onSuccess: async () => {
    // Copy datasets folder to dist
    mkdirSync('dist/datasets', { recursive: true });
    copyFileSync(
      'src/datasets/mbti-questions.json',
      'dist/datasets/mbti-questions.json'
    );
    console.log('✓ Copied datasets to dist/');
  }
});
