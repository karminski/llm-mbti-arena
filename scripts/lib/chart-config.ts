import { ModelSummary } from '../../src/types';

/**
 * Color palette for chart datasets
 * Using distinct colors to differentiate models
 */
export const COLOR_PALETTE = [
  '#FF6384', // Red
  '#36A2EB', // Blue
  '#FFCE56', // Yellow
  '#4BC0C0', // Teal
  '#9966FF', // Purple
  '#FF9F40', // Orange
  '#FF6384', // Red (repeat)
  '#C9CBCF', // Gray
  '#4BC0C0', // Teal (repeat)
  '#FF6384', // Red (repeat)
];

/**
 * Chart.js dataset structure for radar chart
 */
export interface RadarDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  pointBackgroundColor: string;
  pointBorderColor: string;
  pointHoverBackgroundColor: string;
  pointHoverBorderColor: string;
}

/**
 * Chart.js configuration for radar chart
 */
export interface RadarChartConfig {
  type: 'radar';
  data: {
    labels: string[];
    datasets: RadarDataset[];
  };
  options: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    scales: {
      r: {
        min: number;
        max: number;
        ticks: {
          stepSize: number;
          callback: (value: number) => string;
        };
        pointLabels: {
          font: {
            size: number;
          };
        };
      };
    };
    plugins: {
      legend: {
        display: boolean;
        position: 'top' | 'bottom' | 'left' | 'right';
        labels: {
          font: {
            size: number;
          };
          boxWidth: number;
        };
      };
      title: {
        display: boolean;
        text: string;
        font: {
          size: number;
          weight: string;
        };
      };
    };
  };
}

/**
 * Convert ModelSummary to Chart.js dataset
 * @param model - Model summary data
 * @param colorIndex - Index for color palette
 * @returns Chart.js dataset object
 */
export function modelToDataset(model: ModelSummary, colorIndex: number): RadarDataset {
  const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
  
  // Extract dimension values for radar chart
  // Using E, N, T, J as the four axes (one from each dimension pair)
  const data = [
    model.dimensions.E, // E-I axis (E side)
    model.dimensions.N, // S-N axis (N side)
    model.dimensions.T, // T-F axis (T side)
    model.dimensions.J, // J-P axis (J side)
  ];
  
  return {
    label: `${model.modelName} (${model.personalityType})`,
    data,
    backgroundColor: `${color}33`, // 20% opacity
    borderColor: color,
    borderWidth: 2,
    pointBackgroundColor: color,
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: color,
  };
}

/**
 * Create Chart.js radar chart configuration
 * @param models - Array of model summaries
 * @param maxModels - Maximum number of models to display (default: 20)
 * @returns Chart.js configuration object
 */
export function createRadarChartConfig(
  models: ModelSummary[],
  maxModels: number = 20
): RadarChartConfig {
  // Limit number of models to avoid overcrowding
  const displayModels = models.slice(0, maxModels);
  
  // Convert models to datasets
  const datasets = displayModels.map((model, index) => 
    modelToDataset(model, index)
  );
  
  return {
    type: 'radar',
    data: {
      labels: [
        'E (Extrovert)',
        'N (Intuitive)',
        'T (Thinking)',
        'J (Judging)',
      ],
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: (value: number) => `${value}%`,
          },
          pointLabels: {
            font: {
              size: 14,
            },
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: {
              size: 10,
            },
            boxWidth: 15,
          },
        },
        title: {
          display: true,
          text: 'LLM MBTI Distribution - Radar Chart',
          font: {
            size: 20,
            weight: 'bold',
          },
        },
      },
    },
  };
}
