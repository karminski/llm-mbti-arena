import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRadarChartConfig, modelToDataset, COLOR_PALETTE } from '../scripts/lib/chart-config.js';
import type { ModelSummary } from '../src/types.js';

describe('Image Generation Module', () => {
  describe('Chart Configuration', () => {
    let mockModels: ModelSummary[];

    beforeEach(() => {
      mockModels = [
        {
          modelName: 'openai/gpt-4o-mini',
          provider: 'openai',
          personalityType: 'ENTJ',
          testTime: '2025-10-07T13:26:08.874Z',
          dimensions: {
            E: 67,
            I: 33,
            S: 42,
            N: 58,
            T: 71,
            F: 29,
            J: 64,
            P: 36,
          },
          filePath: 'benchmark-result/test.json',
        },
        {
          modelName: 'anthropic/claude-3.5-sonnet',
          provider: 'anthropic',
          personalityType: 'INFP',
          testTime: '2025-10-07T13:27:18.859Z',
          dimensions: {
            E: 33,
            I: 67,
            S: 38,
            N: 62,
            T: 46,
            F: 54,
            J: 41,
            P: 59,
          },
          filePath: 'benchmark-result/test2.json',
        },
      ];
    });

    describe('createRadarChartConfig', () => {
      it('should create valid chart configuration structure', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('data');
        expect(config).toHaveProperty('options');
        expect(config.type).toBe('radar');
      });

      it('should include correct axis labels', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.data.labels).toEqual([
          'E (Extrovert)',
          'N (Intuitive)',
          'T (Thinking)',
          'J (Judging)',
        ]);
      });

      it('should create datasets for all models', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.data.datasets).toHaveLength(2);
        expect(config.data.datasets[0].label).toContain('openai/gpt-4o-mini');
        expect(config.data.datasets[1].label).toContain('anthropic/claude-3.5-sonnet');
      });

      it('should include MBTI type in dataset labels', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.data.datasets[0].label).toContain('ENTJ');
        expect(config.data.datasets[1].label).toContain('INFP');
      });

      it('should configure scale with correct min and max values', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.scales.r.min).toBe(0);
        expect(config.options.scales.r.max).toBe(100);
      });

      it('should configure scale with correct step size', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.scales.r.ticks.stepSize).toBe(20);
      });

      it('should format tick labels with percentage', () => {
        const config = createRadarChartConfig(mockModels);

        const tickCallback = config.options.scales.r.ticks.callback;
        expect(tickCallback(50)).toBe('50%');
        expect(tickCallback(0)).toBe('0%');
        expect(tickCallback(100)).toBe('100%');
      });

      it('should enable legend display', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.plugins.legend.display).toBe(true);
      });

      it('should position legend at bottom', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.plugins.legend.position).toBe('bottom');
      });

      it('should display chart title', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.plugins.title.display).toBe(true);
        expect(config.options.plugins.title.text).toBe('LLM MBTI Distribution - Radar Chart');
      });

      it('should limit models to maxModels parameter', () => {
        const manyModels = Array.from({ length: 25 }, (_, i) => ({
          ...mockModels[0],
          modelName: `model-${i}`,
        }));

        const config = createRadarChartConfig(manyModels, 10);

        expect(config.data.datasets).toHaveLength(10);
      });

      it('should use default maxModels of 20', () => {
        const manyModels = Array.from({ length: 25 }, (_, i) => ({
          ...mockModels[0],
          modelName: `model-${i}`,
        }));

        const config = createRadarChartConfig(manyModels);

        expect(config.data.datasets).toHaveLength(20);
      });

      it('should handle empty model array', () => {
        const config = createRadarChartConfig([]);

        expect(config.data.datasets).toHaveLength(0);
      });

      it('should handle single model', () => {
        const config = createRadarChartConfig([mockModels[0]]);

        expect(config.data.datasets).toHaveLength(1);
        expect(config.data.datasets[0].label).toContain('openai/gpt-4o-mini');
      });

      it('should set responsive to true', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.responsive).toBe(true);
      });

      it('should set maintainAspectRatio to false', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.maintainAspectRatio).toBe(false);
      });
    });

    describe('modelToDataset', () => {
      it('should convert model to valid dataset structure', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset).toHaveProperty('label');
        expect(dataset).toHaveProperty('data');
        expect(dataset).toHaveProperty('backgroundColor');
        expect(dataset).toHaveProperty('borderColor');
        expect(dataset).toHaveProperty('borderWidth');
        expect(dataset).toHaveProperty('pointBackgroundColor');
        expect(dataset).toHaveProperty('pointBorderColor');
        expect(dataset).toHaveProperty('pointHoverBackgroundColor');
        expect(dataset).toHaveProperty('pointHoverBorderColor');
      });

      it('should extract correct dimension values in correct order', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        // Should be [E, N, T, J]
        expect(dataset.data).toEqual([67, 58, 71, 64]);
      });

      it('should use different dimension values for different models', () => {
        const dataset1 = modelToDataset(mockModels[0], 0);
        const dataset2 = modelToDataset(mockModels[1], 1);

        expect(dataset1.data).toEqual([67, 58, 71, 64]);
        expect(dataset2.data).toEqual([33, 62, 46, 41]);
      });

      it('should include model name and MBTI type in label', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.label).toBe('openai/gpt-4o-mini (ENTJ)');
      });

      it('should set border width to 2', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.borderWidth).toBe(2);
      });

      it('should set point border color to white', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.pointBorderColor).toBe('#fff');
      });

      it('should set point hover background color to white', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.pointHoverBackgroundColor).toBe('#fff');
      });

      it('should handle models with extreme dimension values', () => {
        const extremeModel: ModelSummary = {
          modelName: 'test/extreme',
          provider: 'test',
          personalityType: 'ENTJ',
          testTime: '2025-10-07T13:26:08.874Z',
          dimensions: {
            E: 100,
            I: 0,
            S: 0,
            N: 100,
            T: 100,
            F: 0,
            J: 100,
            P: 0,
          },
          filePath: 'test.json',
        };

        const dataset = modelToDataset(extremeModel, 0);

        expect(dataset.data).toEqual([100, 100, 100, 100]);
      });

      it('should handle models with balanced dimension values', () => {
        const balancedModel: ModelSummary = {
          modelName: 'test/balanced',
          provider: 'test',
          personalityType: 'XXXX',
          testTime: '2025-10-07T13:26:08.874Z',
          dimensions: {
            E: 50,
            I: 50,
            S: 50,
            N: 50,
            T: 50,
            F: 50,
            J: 50,
            P: 50,
          },
          filePath: 'test.json',
        };

        const dataset = modelToDataset(balancedModel, 0);

        expect(dataset.data).toEqual([50, 50, 50, 50]);
      });
    });

    describe('Color Allocation', () => {
      it('should assign colors from COLOR_PALETTE', () => {
        const dataset1 = modelToDataset(mockModels[0], 0);
        const dataset2 = modelToDataset(mockModels[1], 1);

        expect(dataset1.borderColor).toBe(COLOR_PALETTE[0]);
        expect(dataset2.borderColor).toBe(COLOR_PALETTE[1]);
      });

      it('should cycle through colors when index exceeds palette length', () => {
        const dataset = modelToDataset(mockModels[0], COLOR_PALETTE.length);

        expect(dataset.borderColor).toBe(COLOR_PALETTE[0]);
      });

      it('should handle large color indices', () => {
        const dataset = modelToDataset(mockModels[0], COLOR_PALETTE.length * 2 + 3);

        expect(dataset.borderColor).toBe(COLOR_PALETTE[3]);
      });

      it('should add transparency to background color', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.backgroundColor).toBe(`${COLOR_PALETTE[0]}33`);
      });

      it('should use same color for border and point background', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.borderColor).toBe(dataset.pointBackgroundColor);
      });

      it('should use same color for point hover border', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.borderColor).toBe(dataset.pointHoverBorderColor);
      });

      it('should assign different colors to consecutive models', () => {
        const datasets = mockModels.map((model, index) => modelToDataset(model, index));

        expect(datasets[0].borderColor).not.toBe(datasets[1].borderColor);
      });

      it('should have at least 10 colors in palette', () => {
        expect(COLOR_PALETTE.length).toBeGreaterThanOrEqual(10);
      });

      it('should have valid hex color codes in palette', () => {
        const hexColorRegex = /^#[0-9A-F]{6}$/i;

        COLOR_PALETTE.forEach((color) => {
          expect(color).toMatch(hexColorRegex);
        });
      });
    });

    describe('Data Extraction', () => {
      it('should extract E dimension from E_I pair', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.data[0]).toBe(mockModels[0].dimensions.E);
      });

      it('should extract N dimension from S_N pair', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.data[1]).toBe(mockModels[0].dimensions.N);
      });

      it('should extract T dimension from T_F pair', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.data[2]).toBe(mockModels[0].dimensions.T);
      });

      it('should extract J dimension from J_P pair', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.data[3]).toBe(mockModels[0].dimensions.J);
      });

      it('should maintain data array length of 4', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        expect(dataset.data).toHaveLength(4);
      });

      it('should extract numeric values only', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        dataset.data.forEach((value) => {
          expect(typeof value).toBe('number');
        });
      });

      it('should extract values in range 0-100', () => {
        const dataset = modelToDataset(mockModels[0], 0);

        dataset.data.forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        });
      });
    });

    describe('Chart Options Configuration', () => {
      it('should configure point label font size', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.scales.r.pointLabels.font.size).toBe(14);
      });

      it('should configure legend font size', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.plugins.legend.labels.font.size).toBe(10);
      });

      it('should configure legend box width', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.plugins.legend.labels.boxWidth).toBe(15);
      });

      it('should configure title font size', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.plugins.title.font.size).toBe(20);
      });

      it('should configure title font weight to bold', () => {
        const config = createRadarChartConfig(mockModels);

        expect(config.options.plugins.title.font.weight).toBe('bold');
      });
    });
  });
});
