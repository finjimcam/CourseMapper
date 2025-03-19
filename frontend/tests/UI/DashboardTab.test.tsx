import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import DashboardTab from '../../src/components/DashboardTab';

// Mock the external dependencies
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('react-apexcharts', () => ({
  __esModule: true,
  default: jest.fn(() => null)
}));

jest.mock('../../src/components/GraduateAttributesChart', () => ({
  __esModule: true,
  default: jest.fn(({ data, showTable, toggleShowTable }) => 
    React.createElement('div', { 'data-testid': 'graduate-attributes-chart' },
      React.createElement('button', { onClick: toggleShowTable },
        showTable ? 'Show Graph' : 'Show Table'
      ),
      React.createElement('div', null,
        data.labels.map((label: string, index: number) =>
          React.createElement('div', { key: label },
            `${label}: ${data.series[index]}`
          )
        )
      )
    )
  )
}));

jest.mock('../../src/components/CustomBadge', () => ({
  CustomBadge: ({ label }: { label: string }) => React.createElement('span', { 'data-testid': 'custom-badge' }, label)
}));

describe('DashboardTab', () => {
  const mockProps = {
    series: [{
      name: 'Synchronous',
      data: [30, 40, 35]
    }],
    options: {
      chart: {
        type: 'bar' as const,
        height: 350
      }
    },
    summaryData: [
      {
        week: 'Week 1',
        synchronous: '01:00',
        asynchronous: '00:30',
        total: '01:30'
      },
      {
        week: 'Week 2',
        synchronous: '02:00',
        asynchronous: '01:00',
        total: '03:00'
      }
    ],
    allLearningTypes: ['Synchronous', 'Asynchronous'],
    showTable: false,
    toggleShowTable: jest.fn(),
    workbook_id: '123'
  };

  const mockGraduateAttributes = [
    { id: '1', name: 'Attribute 1' },
    { id: '2', name: 'Attribute 2' }
  ];

  const mockWeekGraduateAttributes = [
    { week_workbook_id: '123', week_number: 1, graduate_attribute_id: '1' },
    { week_workbook_id: '123', week_number: 1, graduate_attribute_id: '1' },
    { week_workbook_id: '123', week_number: 2, graduate_attribute_id: '2' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup axios mock responses
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/graduate_attributes')) {
        return Promise.resolve({ data: mockGraduateAttributes });
      }
      if (url.includes('/week-graduate-attributes')) {
        return Promise.resolve({ data: mockWeekGraduateAttributes });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      render(React.createElement(DashboardTab, mockProps));
      expect(screen.getByText('Loading graduate attributes data...')).toBeInTheDocument();
    });

    it('should render error state when API fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));
      render(React.createElement(DashboardTab, mockProps));
      
      await waitFor(() => {
        expect(screen.getByText(/Error loading graduate attributes/)).toBeInTheDocument();
      });
    });

    it('should render successfully with data', async () => {
      render(React.createElement(DashboardTab, mockProps));
      
      await waitFor(() => {
        expect(screen.getByText('Weekly Notional Learning Hours')).toBeInTheDocument();
        expect(screen.getByText('Total Graduate Attributes')).toBeInTheDocument();
      });
    });
  });

  describe('Learning Hours Section', () => {
    it('should render chart when showTable is false', async () => {
      render(React.createElement(DashboardTab, { ...mockProps, showTable: false }));
      
      await waitFor(() => {
        const ReactApexChart = require('react-apexcharts').default;
        expect(ReactApexChart).toHaveBeenCalledWith(
          expect.objectContaining({
            options: mockProps.options,
            series: mockProps.series,
            type: 'bar',
            height: 350
          }),
          expect.any(Object)
        );
      });
    });

    it('should render table when showTable is true', async () => {
      render(React.createElement(DashboardTab, { ...mockProps, showTable: true }));
      
      await waitFor(() => {
        mockProps.summaryData.forEach(row => {
          expect(screen.getByText(row.week)).toBeInTheDocument();
          expect(screen.getByText(row.total)).toBeInTheDocument();
        });
      });
    });

    it('should call toggleShowTable when button is clicked', async () => {
      render(React.createElement(DashboardTab, mockProps));
      
      await waitFor(() => {
        const toggleButton = screen.getByText(/Show Table|Show Graph/);
        fireEvent.click(toggleButton);
        expect(mockProps.toggleShowTable).toHaveBeenCalled();
      });
    });
  });

  describe('Graduate Attributes Section', () => {
    it('should fetch and process graduate attributes data', async () => {
      render(React.createElement(DashboardTab, mockProps));
      
      await waitFor(() => {
        // Verify API calls
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/graduate_attributes/')
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/week-graduate-attributes')
        );
      });
    });

    it('should update graduate attributes data when refresh trigger changes', async () => {
      const { rerender } = render(React.createElement(DashboardTab, { ...mockProps, attributesRefreshTrigger: 1 }));
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });

      rerender(React.createElement(DashboardTab, { ...mockProps, attributesRefreshTrigger: 2 }));
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
      });
    });

    it('should pass correct data to GraduateAttributesChart', async () => {
      render(React.createElement(DashboardTab, mockProps));
      
      await waitFor(() => {
        const chart = screen.getByTestId('graduate-attributes-chart');
        expect(chart).toBeInTheDocument();
        expect(screen.getByText('Attribute 1: 2')).toBeInTheDocument();
        expect(screen.getByText('Attribute 2: 1')).toBeInTheDocument();
      });
    });
  });
});
