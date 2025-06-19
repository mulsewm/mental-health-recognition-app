import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmotionChart } from './EmotionChart';
import { EmotionData } from '@/types/emotion';
import 'jest-canvas-mock';

// Create a mock register function
const mockRegister = jest.fn();

// Mock the Chart.js module
jest.mock('chart.js', () => ({
  __esModule: true,
  ...jest.requireActual('chart.js'),
  Chart: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn(),
  })),
  register: mockRegister,
  registerables: [],
}));

// Import the mocked chart after setting up the mock
import { Chart } from 'chart.js';

describe('EmotionChart', () => {
  const mockData: EmotionData[] = [
    {
      timestamp: '2023-01-01T00:00:00Z',
      emotion: 'happy',
      confidence: 0.8,
      dominant: true,
      boundingBox: { x: 0, y: 0, width: 100, height: 100 },
    },
    {
      timestamp: '2023-01-02T00:00:00Z',
      emotion: 'neutral',
      confidence: 0.7,
      dominant: true,
      boundingBox: { x: 0, y: 0, width: 100, height: 100 },
    },
  ];

  it('renders without crashing', () => {
    const { container } = render(
      <EmotionChart 
        data={mockData} 
        chartType="line" 
        title="Test Chart"
        width="100%"
        height={400}
      />
    );
    
    // Check if the canvas is rendered
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders with bar chart type', () => {
    const { container } = render(
      <EmotionChart 
        data={mockData} 
        chartType="bar" 
        title="Test Bar Chart"
        width="100%"
        height={400}
      />
    );
    
    // Check if the chart container has the correct class for bar chart
    expect(container.firstChild).toHaveClass('emotion-chart');
  });

  it('displays the correct title', () => {
    const testTitle = 'Test Chart Title';
    const { container } = render(
      <div>
        <h2>{testTitle}</h2>
        <EmotionChart 
          data={mockData} 
          chartType="line" 
          title={testTitle}
          height={400}
        />
      </div>
    );
    
    // Check if the title is rendered
    const titleElement = container.querySelector('h2');
    expect(titleElement).toHaveTextContent(testTitle);
  });

  it('handles empty data gracefully', () => {
    const { container } = render(
      <EmotionChart 
        data={[]} 
        chartType="line" 
        title="Empty Chart"
        height={400}
      />
    );
    
    // Check if the canvas is still rendered
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
  
  it('cleans up chart on unmount', () => {
    const { unmount } = render(
      <EmotionChart 
        data={mockData} 
        chartType="line" 
        title="Test Cleanup"
        height={400}
      />
    );
    
    unmount();
    expect(mockDestroy).toHaveBeenCalled();
  });
  
  it('registers Chart.js components', () => {
    render(
      <EmotionChart 
        data={mockData} 
        chartType="line" 
        title="Test Registration"
        height={400}
      />
    );
    
    expect(mockRegister).toHaveBeenCalled();
  });
});
