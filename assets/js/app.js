/**
 * LLM MBTI Arena - Interactive Visualization Application
 */

// Color palette for charts
const COLOR_PALETTE = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
  '#E74C3C', '#3498DB', '#F39C12', '#1ABC9C', '#9B59B6',
  '#E67E22', '#95A5A6', '#34495E', '#16A085', '#27AE60'
];

/**
 * Load summary data from assets/data/summary.json
 * @returns {Promise<Object>} Summary data object
 */
async function loadSummaryData() {
  try {
    const response = await fetch('assets/data/summary.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Successfully loaded summary.json', data);
    return data;
  } catch (error) {
    console.warn('Failed to load summary.json, falling back to individual files:', error);
    return await loadIndividualResults();
  }
}

/**
 * Fallback: Load individual benchmark result files
 * @returns {Promise<Object>} Aggregated summary data
 */
async function loadIndividualResults() {
  try {
    // Try to get list of files from benchmark-result directory
    // Since we can't list directory in browser, we'll try to load a known set
    // This is a fallback and may not work in all scenarios
    console.log('Attempting to load individual benchmark results...');

    // In a real scenario, you would need a file listing endpoint or
    // pre-generated list of files. For now, return empty data with error
    throw new Error('Cannot load individual files without summary.json');
  } catch (error) {
    console.error('Failed to load individual results:', error);
    throw new Error('Unable to load data. Please ensure summary.json exists.');
  }
}

/**
 * Extract provider name from model name
 * @param {string} modelName - Full model name (e.g., "openai/gpt-4")
 * @returns {string} Provider name
 */
function extractProvider(modelName) {
  if (!modelName) return 'unknown';

  // Handle different formats
  if (modelName.includes('/')) {
    return modelName.split('/')[0];
  }

  if (modelName.includes('_')) {
    return modelName.split('_')[0];
  }

  // Try to extract from common patterns
  const lowerName = modelName.toLowerCase();
  const providers = ['openai', 'anthropic', 'google', 'meta', 'mistral', 'deepseek', 'qwen', 'grok', 'x-ai'];

  for (const provider of providers) {
    if (lowerName.includes(provider)) {
      return provider;
    }
  }

  return 'other';
}

/**
 * Format date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error-message');

  if (loadingEl) loadingEl.style.display = 'none';
  if (errorEl) {
    errorEl.style.display = 'block';
    errorEl.querySelector('p').textContent = `⚠️ ${message}`;
  }
}

/**
 * Hide loading indicator and show content
 */
function hideLoading() {
  const loadingEl = document.getElementById('loading');
  const chartSection = document.getElementById('chart-section');
  const filtersSection = document.getElementById('filters');
  const tableSection = document.getElementById('table-section');

  if (loadingEl) loadingEl.style.display = 'none';
  if (chartSection) chartSection.style.display = 'block';
  if (filtersSection) filtersSection.style.display = 'block';
  if (tableSection) tableSection.style.display = 'block';
}


/**
 * Create a horizontal bar chart for a dimension pair
 * @param {string} canvasId - Canvas element ID
 * @param {Array} models - Array of model summary objects
 * @param {string} leftDim - Left dimension (e.g., 'E')
 * @param {string} rightDim - Right dimension (e.g., 'I')
 * @param {string} leftLabel - Left label (e.g., 'Extrovert')
 * @param {string} rightLabel - Right label (e.g., 'Introvert')
 * @returns {Chart} Chart.js instance
 */
function createDimensionChart(canvasId, models, leftDim, rightDim, leftLabel, rightLabel) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Chart canvas ${canvasId} not found`);
    return null;
  }

  const ctx = canvas.getContext('2d');

  // Display all models
  const displayModels = models;

  // Set dynamic height based on number of models (25px per model, minimum 800px)
  const dynamicHeight = Math.max(800, displayModels.length * 25);
  canvas.parentElement.style.height = dynamicHeight + 'px';

  // Prepare data - convert to diverging bar chart format
  // Negative values for left dimension, positive for right
  const labels = displayModels.map(m => m.modelName);
  const leftData = displayModels.map(m => -m.dimensions[leftDim]);
  const rightData = displayModels.map(m => m.dimensions[rightDim]);

  try {
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: leftLabel,
            data: leftData,
            backgroundColor: '#FF6384',
            borderColor: '#FF6384',
            borderWidth: 1
          },
          {
            label: rightLabel,
            data: rightData,
            backgroundColor: '#36A2EB',
            borderColor: '#36A2EB',
            borderWidth: 1
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            min: -100,
            max: 100,
            ticks: {
              callback: function (value) {
                return Math.abs(value) + '%';
              }
            },
            grid: {
              drawOnChartArea: true
            }
          },
          y: {
            stacked: false,
            ticks: {
              font: {
                size: 16
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 11
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const model = displayModels[context.dataIndex];
                const value = Math.abs(context.parsed.x);
                const dim = context.datasetIndex === 0 ? leftDim : rightDim;
                return `${context.dataset.label}: ${value}% (${model.personalityType})`;
              }
            }
          }
        }
      },
      plugins: [{
        id: 'fiftyPercentLine',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;

          // Draw dashed lines at -50 and 50
          ctx.save();
          ctx.strokeStyle = '#999';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);

          // Left side: -50%
          const leftX = xAxis.getPixelForValue(-50);
          ctx.beginPath();
          ctx.moveTo(leftX, yAxis.top);
          ctx.lineTo(leftX, yAxis.bottom);
          ctx.stroke();

          // Right side: 50%
          const rightX = xAxis.getPixelForValue(50);
          ctx.beginPath();
          ctx.moveTo(rightX, yAxis.top);
          ctx.lineTo(rightX, yAxis.bottom);
          ctx.stroke();

          ctx.restore();
        }
      }]
    });

    console.log(`Chart ${canvasId} created successfully`);
    return chart;
  } catch (error) {
    console.error(`Failed to create chart ${canvasId}:`, error);
    return null;
  }
}

/**
 * Create all four dimension charts
 * @param {Array} models - Array of model summary objects
 * @returns {Object} Object containing all chart instances
 */
function createAllCharts(models) {
  return {
    ei: createDimensionChart('ei-chart', models, 'E', 'I', 'Extrovert (E)', 'Introvert (I)'),
    sn: createDimensionChart('sn-chart', models, 'S', 'N', 'Sensing (S)', 'Intuitive (N)'),
    tf: createDimensionChart('tf-chart', models, 'T', 'F', 'Thinking (T)', 'Feeling (F)'),
    jp: createDimensionChart('jp-chart', models, 'J', 'P', 'Judging (J)', 'Perceiving (P)')
  };
}

/**
 * Update a single dimension chart with new data
 * @param {Chart} chart - Chart.js instance
 * @param {Array} models - Array of model summary objects
 * @param {string} leftDim - Left dimension
 * @param {string} rightDim - Right dimension
 */
function updateDimensionChart(chart, models, leftDim, rightDim) {
  if (!chart) return;

  const displayModels = models;

  // Update dynamic height based on number of models
  const dynamicHeight = Math.max(800, displayModels.length * 25);
  chart.canvas.parentElement.style.height = dynamicHeight + 'px';

  chart.data.labels = displayModels.map(m => m.modelName);
  chart.data.datasets[0].data = displayModels.map(m => -m.dimensions[leftDim]);
  chart.data.datasets[1].data = displayModels.map(m => m.dimensions[rightDim]);

  chart.update();
}

/**
 * Update all charts with new data
 * @param {Object} charts - Object containing all chart instances
 * @param {Array} models - Array of model summary objects
 */
function updateAllCharts(charts, models) {
  if (!charts) return;

  updateDimensionChart(charts.ei, models, 'E', 'I');
  updateDimensionChart(charts.sn, models, 'S', 'N');
  updateDimensionChart(charts.tf, models, 'T', 'F');
  updateDimensionChart(charts.jp, models, 'J', 'P');
}


/**
 * Render data table with model results
 * @param {Array} models - Array of model summary objects
 */
function renderTable(models) {
  const tbody = document.querySelector('#results-table tbody');
  const resultCount = document.getElementById('result-count');

  if (!tbody) {
    console.error('Table body not found');
    return;
  }

  // Update result count
  if (resultCount) {
    resultCount.textContent = models.length;
  }

  // Clear existing rows
  tbody.innerHTML = '';

  // Generate table rows
  models.forEach(model => {
    const row = document.createElement('tr');
    row.dataset.modelName = model.modelName;
    row.dataset.filePath = model.filePath || '';

    // Determine MBTI badge type for styling
    const mbtiType = model.personalityType.charAt(0); // E or I

    row.innerHTML = `
      <td>${escapeHtml(model.modelName)}</td>
      <td>${escapeHtml(model.provider)}</td>
      <td><span class="mbti-badge" data-type="${mbtiType}">${escapeHtml(model.personalityType)}</span></td>
      <td>${model.dimensions.E}% E / ${model.dimensions.I}% I</td>
      <td>${model.dimensions.S}% S / ${model.dimensions.N}% N</td>
      <td>${model.dimensions.T}% T / ${model.dimensions.F}% F</td>
      <td>${model.dimensions.J}% J / ${model.dimensions.P}% P</td>
      <td>${formatDate(model.testTime)}</td>
    `;

    // Add click event to show details
    row.addEventListener('click', () => {
      showDetailModal(model);
    });

    tbody.appendChild(row);
  });

  console.log(`Rendered ${models.length} rows in table`);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


/**
 * Populate filter dropdowns with unique values
 * @param {Array} models - Array of model summary objects
 */
function populateFilters(models) {
  const mbtiFilter = document.getElementById('mbti-filter');
  const providerFilter = document.getElementById('provider-filter');

  if (!mbtiFilter || !providerFilter) {
    console.error('Filter elements not found');
    return;
  }

  // Get unique MBTI types
  const mbtiTypes = [...new Set(models.map(m => m.personalityType))].sort();

  // Clear and populate MBTI filter
  mbtiFilter.innerHTML = '<option value="">All MBTI Types</option>';
  mbtiTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    mbtiFilter.appendChild(option);
  });

  // Get unique providers
  const providers = [...new Set(models.map(m => m.provider))].sort();

  // Clear and populate provider filter
  providerFilter.innerHTML = '<option value="">All Providers</option>';
  providers.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider;
    option.textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
    providerFilter.appendChild(option);
  });

  console.log(`Populated filters: ${mbtiTypes.length} MBTI types, ${providers.length} providers`);
}

/**
 * Apply filters to model data
 * @param {Array} models - Array of all model summary objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered models
 */
function applyFilters(models, filters) {
  return models.filter(model => {
    // MBTI type filter
    if (filters.mbtiType && model.personalityType !== filters.mbtiType) {
      return false;
    }

    // Provider filter
    if (filters.provider && model.provider !== filters.provider) {
      return false;
    }

    // Search filter (case-insensitive)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const modelNameLower = model.modelName.toLowerCase();
      if (!modelNameLower.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get current filter values from UI
 * @returns {Object} Filter values
 */
function getFilterValues() {
  const mbtiFilter = document.getElementById('mbti-filter');
  const providerFilter = document.getElementById('provider-filter');
  const searchBox = document.getElementById('search-box');

  return {
    mbtiType: mbtiFilter ? mbtiFilter.value : '',
    provider: providerFilter ? providerFilter.value : '',
    search: searchBox ? searchBox.value.trim() : ''
  };
}


/**
 * Sort models by specified column
 * @param {Array} models - Array of model summary objects
 * @param {string} column - Column name to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted models
 */
function sortModels(models, column, direction) {
  const sorted = [...models].sort((a, b) => {
    let aVal, bVal;

    // Get values based on column
    switch (column) {
      case 'modelName':
        aVal = a.modelName.toLowerCase();
        bVal = b.modelName.toLowerCase();
        break;
      case 'provider':
        aVal = a.provider.toLowerCase();
        bVal = b.provider.toLowerCase();
        break;
      case 'personalityType':
        aVal = a.personalityType;
        bVal = b.personalityType;
        break;
      case 'E':
      case 'I':
      case 'S':
      case 'N':
      case 'T':
      case 'F':
      case 'J':
      case 'P':
        aVal = a.dimensions[column];
        bVal = b.dimensions[column];
        break;
      case 'testTime':
        aVal = new Date(a.testTime).getTime();
        bVal = new Date(b.testTime).getTime();
        break;
      default:
        return 0;
    }

    // Compare values
    if (typeof aVal === 'string') {
      return direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    } else {
      return direction === 'asc'
        ? aVal - bVal
        : bVal - aVal;
    }
  });

  return sorted;
}

/**
 * Setup table header click handlers for sorting
 * @param {Function} onSort - Callback function when sort is triggered
 */
function setupTableSorting(onSort) {
  const headers = document.querySelectorAll('#results-table th.sortable');

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;

      // Determine new sort direction
      let direction = 'asc';
      if (header.classList.contains('asc')) {
        direction = 'desc';
      }

      // Remove sort classes from all headers
      headers.forEach(h => {
        h.classList.remove('asc', 'desc');
      });

      // Add sort class to clicked header
      header.classList.add(direction);

      // Trigger sort callback
      if (onSort) {
        onSort(column, direction);
      }
    });
  });
}


/**
 * Show detail modal with full model information
 * @param {Object} model - Model summary object
 */
async function showDetailModal(model) {
  const modal = document.getElementById('detail-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  if (!modal || !modalTitle || !modalBody) {
    console.error('Modal elements not found');
    return;
  }

  // Set title
  modalTitle.textContent = model.modelName;

  // Show loading state
  modalBody.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading details...</p></div>';
  modal.style.display = 'block';

  try {
    // Try to load full benchmark result
    let fullData = null;

    if (model.filePath) {
      const response = await fetch(model.filePath);
      if (response.ok) {
        fullData = await response.json();
      }
    }

    // Build modal content
    let content = `
      <div class="modal-section">
        <h3>Basic Information</h3>
        <p><strong>Model Name:</strong> ${escapeHtml(model.modelName)}</p>
        <p><strong>Provider:</strong> ${escapeHtml(model.provider)}</p>
        <p><strong>MBTI Type:</strong> <span class="mbti-badge">${escapeHtml(model.personalityType)}</span></p>
        <p><strong>Test Date:</strong> ${formatDate(model.testTime)}</p>
      </div>

      <div class="modal-section">
        <h3>Dimension Scores</h3>
        <div class="dimension-grid">
          <div class="dimension-item">
            <strong>${model.dimensions.E}%</strong>
            <span>Extrovert (E)</span>
          </div>
          <div class="dimension-item">
            <strong>${model.dimensions.I}%</strong>
            <span>Introvert (I)</span>
          </div>
          <div class="dimension-item">
            <strong>${model.dimensions.S}%</strong>
            <span>Sensing (S)</span>
          </div>
          <div class="dimension-item">
            <strong>${model.dimensions.N}%</strong>
            <span>Intuitive (N)</span>
          </div>
          <div class="dimension-item">
            <strong>${model.dimensions.T}%</strong>
            <span>Thinking (T)</span>
          </div>
          <div class="dimension-item">
            <strong>${model.dimensions.F}%</strong>
            <span>Feeling (F)</span>
          </div>
          <div class="dimension-item">
            <strong>${model.dimensions.J}%</strong>
            <span>Judging (J)</span>
          </div>
          <div class="dimension-item">
            <strong>${model.dimensions.P}%</strong>
            <span>Perceiving (P)</span>
          </div>
        </div>
      </div>
    `;

    // Add answers if available
    if (fullData && fullData.answers && fullData.answers.length > 0) {
      content += `
        <div class="modal-section">
          <h3>Test Answers (${fullData.answers.length} questions)</h3>
          <div class="answers-list">
      `;

      fullData.answers.forEach(answer => {
        content += `
          <div class="answer-item">
            <div class="question-number">Question ${answer.questionIndex + 1} (${answer.dimension})</div>
            <div class="question-text">${escapeHtml(answer.question)}</div>
            <div class="answer-choice">Chosen: Option ${answer.chosenOption}</div>
          </div>
        `;
      });

      content += `
          </div>
        </div>
      `;
    } else {
      content += `
        <div class="modal-section">
          <p><em>Detailed answer data not available for this model.</em></p>
        </div>
      `;
    }

    modalBody.innerHTML = content;
  } catch (error) {
    console.error('Failed to load model details:', error);
    modalBody.innerHTML = `
      <div class="modal-section">
        <p class="error-message">Failed to load detailed information.</p>
      </div>
    `;
  }
}

/**
 * Close detail modal
 */
function closeModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Setup modal event handlers
 */
function setupModalHandlers() {
  const modal = document.getElementById('detail-modal');
  const closeBtn = document.querySelector('.close');

  // Close button click
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Click outside modal to close
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  // ESC key to close
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}


/**
 * Main MBTIArena Application Class
 */
class MBTIArena {
  constructor() {
    this.allModels = [];
    this.filteredModels = [];
    this.charts = null;
    this.currentSort = {
      column: null,
      direction: 'asc'
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('Initializing LLM MBTI Arena...');

    try {
      // Load data
      const data = await loadSummaryData();

      if (!data || !data.models || data.models.length === 0) {
        throw new Error('No model data available');
      }

      this.allModels = data.models;
      this.filteredModels = [...this.allModels];

      console.log(`Loaded ${this.allModels.length} models`);

      // Hide loading, show content
      hideLoading();

      // Initialize UI components
      this.setupUI();

      // Render initial data
      this.render();

      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      showError(error.message || 'Failed to load data. Please try again later.');
    }
  }

  /**
   * Setup UI event handlers
   */
  setupUI() {
    // Populate filter dropdowns
    populateFilters(this.allModels);

    // Setup filter change handlers
    const mbtiFilter = document.getElementById('mbti-filter');
    const providerFilter = document.getElementById('provider-filter');
    const searchBox = document.getElementById('search-box');
    const resetBtn = document.getElementById('reset-filters');

    if (mbtiFilter) {
      mbtiFilter.addEventListener('change', () => this.handleFilterChange());
    }

    if (providerFilter) {
      providerFilter.addEventListener('change', () => this.handleFilterChange());
    }

    if (searchBox) {
      // Debounce search input
      let searchTimeout;
      searchBox.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => this.handleFilterChange(), 300);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetFilters());
    }

    // Setup table sorting
    setupTableSorting((column, direction) => {
      this.currentSort = { column, direction };
      this.handleSort();
    });

    // Setup modal handlers
    setupModalHandlers();
  }

  /**
   * Handle filter changes
   */
  handleFilterChange() {
    const filters = getFilterValues();
    this.filteredModels = applyFilters(this.allModels, filters);

    // Apply current sort if any
    if (this.currentSort.column) {
      this.filteredModels = sortModels(
        this.filteredModels,
        this.currentSort.column,
        this.currentSort.direction
      );
    }

    this.render();
  }

  /**
   * Handle sort changes
   */
  handleSort() {
    if (this.currentSort.column) {
      this.filteredModels = sortModels(
        this.filteredModels,
        this.currentSort.column,
        this.currentSort.direction
      );
      this.render();
    }
  }

  /**
   * Reset all filters
   */
  resetFilters() {
    const mbtiFilter = document.getElementById('mbti-filter');
    const providerFilter = document.getElementById('provider-filter');
    const searchBox = document.getElementById('search-box');

    if (mbtiFilter) mbtiFilter.value = '';
    if (providerFilter) providerFilter.value = '';
    if (searchBox) searchBox.value = '';

    this.filteredModels = [...this.allModels];

    // Apply current sort if any
    if (this.currentSort.column) {
      this.filteredModels = sortModels(
        this.filteredModels,
        this.currentSort.column,
        this.currentSort.direction
      );
    }

    this.render();
  }

  /**
   * Render all UI components
   */
  render() {
    // Render or update charts
    if (this.charts) {
      updateAllCharts(this.charts, this.filteredModels);
    } else {
      this.charts = createAllCharts(this.filteredModels);
    }

    // Render table
    renderTable(this.filteredModels);
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new MBTIArena();
  app.init();
});
