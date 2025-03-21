import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GraduateAttributesChart from '../../src/components/GraduateAttributesChart';

// Mock the external dependencies
jest.mock('react-apexcharts', () => ({
  __esModule: true,
  default: jest.fn(() => null)
}));

jest.mock('font-color-contrast', () => ({
  __esModule: true,
  default: jest.fn(() => '#ffffff')
}));

describe('GraduateAttributesChart', () => {
  const mockData = {
    labels: ['Attribute 1', 'Attribute 2', 'Attribute 3'],
    series: [5, 0, 3],
    colors: ['#ff0000', '#00ff00', '#0000ff']
  };

  const mockToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Props and Initialization', () => {
    it('should render with initial props in chart mode', () => {
      render(
        React.createElement(GraduateAttributesChart, {
          data: mockData,
          showTable: false,
          toggleShowTable: mockToggle
        })
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Show Table');
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with initial props in table mode', () => {
      render(
        React.createElement(GraduateAttributesChart, {
          data: mockData,
          showTable: true,
          toggleShowTable: mockToggle
        })
      );
      
      expect(screen.getByRole('button')).toHaveTextContent('Show Chart');
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle empty data arrays', () => {
      const emptyData = {
        labels: [],
        series: [],
        colors: []
      };

      render(
        React.createElement(GraduateAttributesChart, {
          data: emptyData,
          showTable: true,
          toggleShowTable: mockToggle
        })
      );
      
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Table Mode', () => {
    beforeEach(() => {
      render(
        React.createElement(GraduateAttributesChart, {
          data: mockData,
          showTable: true,
          toggleShowTable: mockToggle
        })
      );
    });

    it('should render table headers correctly', () => {
      expect(screen.getByText('Graduate Attribute')).toBeInTheDocument();
      expect(screen.getByText('Count')).toBeInTheDocument();
    });

    it('should render all data rows', () => {
      mockData.labels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('should render correct series values', () => {
      mockData.series.forEach(value => {
        expect(screen.getByText(value.toString())).toBeInTheDocument();
      });
    });
  });

  describe('Toggle Functionality', () => {
    it('should call toggle function when button is clicked', () => {
      render(
        React.createElement(GraduateAttributesChart, {
          data: mockData,
          showTable: false,
          toggleShowTable: mockToggle
        })
      );

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('should show correct button text based on mode', () => {
      const { rerender } = render(
        React.createElement(GraduateAttributesChart, {
          data: mockData,
          showTable: false,
          toggleShowTable: mockToggle
        })
      );

      expect(screen.getByRole('button')).toHaveTextContent('Show Table');

      rerender(
        React.createElement(GraduateAttributesChart, {
          data: mockData,
          showTable: true,
          toggleShowTable: mockToggle
        })
      );

      expect(screen.getByRole('button')).toHaveTextContent('Show Chart');
    });
  });

  describe('Chart Mode', () => {
    beforeEach(() => {
      render(
        React.createElement(GraduateAttributesChart, {
          data: mockData,
          showTable: false,
          toggleShowTable: mockToggle
        })
      );
    });

    it('should render chart container', () => {
      const chartContainer = document.querySelector('#chart');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should pass correct props to ReactApexChart', () => {
      // eslint-disable-next-line
      const ReactApexChart = require('react-apexcharts').default;
      expect(ReactApexChart).toHaveBeenCalledWith(
        expect.objectContaining({
          series: mockData.series,
          type: 'pie',
          width: 600,
          options: expect.objectContaining({
            labels: mockData.labels,
            colors: mockData.colors,
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('Data Processing', () => {
    it('should handle zero values correctly in table mode', () => {
      render(
        React.createElement(GraduateAttributesChart, {
          data: mockData,
          showTable: true,
          toggleShowTable: mockToggle
        })
      );

      const zeroValueRow = screen.getByText('Attribute 2');
      expect(zeroValueRow).toHaveStyle({ fontWeight: 'normal' });
    });

    it('should handle non-zero values correctly in table mode', () => {
      render(
        React.createElement(GraduateAttributesChart, {
          data: mockData,
          showTable: true,
          toggleShowTable: mockToggle
        })
      );

      const nonZeroValueRow = screen.getByText('Attribute 1');
      expect(nonZeroValueRow).toHaveStyle({ fontWeight: 'bold' });
    });
  });
});
