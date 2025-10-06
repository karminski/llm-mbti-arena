/**
 * Tests for ProgressRenderer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProgressRenderer } from '../src/progress-renderer.js';
import { ProgressState } from '../src/types.js';

describe('ProgressRenderer', () => {
  let stderrWriteSpy: any;
  let originalStderrWrite: any;

  beforeEach(() => {
    // Spy on stderr.write to capture output
    originalStderrWrite = process.stderr.write;
    stderrWriteSpy = vi.fn();
    process.stderr.write = stderrWriteSpy as any;
  });

  afterEach(() => {
    // Restore original stderr.write
    process.stderr.write = originalStderrWrite;
  });

  it('should render progress state with all components', () => {
    const renderer = new ProgressRenderer('test-model');
    
    const state: ProgressState = {
      currentQuestion: 10,
      totalQuestions: 93,
      scores: {
        E: 6,
        I: 4,
        S: 3,
        N: 7,
        T: 4,
        F: 6,
        J: 5,
        P: 5,
      },
      currentType: 'ENFP',
    };

    renderer.render(state);

    // Check that stderr.write was called
    expect(stderrWriteSpy).toHaveBeenCalled();

    // Get the rendered output
    const output = stderrWriteSpy.mock.calls
      .map((call: any) => call[0])
      .join('');

    // Verify key components are present
    expect(output).toContain('test-model');
    expect(output).toContain('10/93');
    expect(output).toContain('ENFP');
    expect(output).toContain('外向型');
    expect(output).toContain('内向型');
    expect(output).toContain('感觉型');
    expect(output).toContain('直觉型');
  });

  it('should calculate progress percentage correctly', () => {
    const renderer = new ProgressRenderer('test-model');
    
    const state: ProgressState = {
      currentQuestion: 50,
      totalQuestions: 100,
      scores: {
        E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
      },
      currentType: 'XXXX',
    };

    renderer.render(state);

    const output = stderrWriteSpy.mock.calls
      .map((call: any) => call[0])
      .join('');

    // Should show 50%
    expect(output).toContain('50%');
  });

  it('should clear previous render', () => {
    const renderer = new ProgressRenderer('test-model');
    
    const state: ProgressState = {
      currentQuestion: 1,
      totalQuestions: 10,
      scores: {
        E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
      },
      currentType: 'XXXX',
    };

    // First render
    renderer.render(state);
    const firstCallCount = stderrWriteSpy.mock.calls.length;

    // Clear spy
    stderrWriteSpy.mockClear();

    // Second render (should clear first)
    renderer.render(state);

    // Should have ANSI escape codes for clearing
    const output = stderrWriteSpy.mock.calls
      .map((call: any) => call[0])
      .join('');

    // Check for ANSI escape codes (cursor movement and line clearing)
    expect(output).toContain('\x1b[');
  });

  it('should finalize and clear display', () => {
    const renderer = new ProgressRenderer('test-model');
    
    const state: ProgressState = {
      currentQuestion: 1,
      totalQuestions: 10,
      scores: {
        E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
      },
      currentType: 'XXXX',
    };

    renderer.render(state);
    stderrWriteSpy.mockClear();

    renderer.finalize();

    // Should have called stderr.write with ANSI codes
    expect(stderrWriteSpy).toHaveBeenCalled();
  });
});
