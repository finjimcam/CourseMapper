import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Grid from '../../src/components/Grid';
import { Workbook } from '../../src/utils/workbookUtils';

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  return {
    Link: (props: { to: string; children: React.ReactNode }) => 
      React.createElement('a', { 
        href: props.to, 
        'data-testid': 'mock-link' 
      }, props.children),
  };
});


describe('Grid', () => {
  const mockWorkbooks: Workbook[] = [
    {
      workbook: {
        id: '1',
        course_name: 'Course 1',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      },
      course_lead: {
        id: 'user1',
        name: 'John Doe'
      },
      learning_platform: {
        id: 'platform1',
        name: 'Platform A'
      }
    },
    {
      workbook: {
        id: '2',
        course_name: 'Course 2',
        start_date: '2025-02-01',
        end_date: '2025-12-31'
      },
      course_lead: {
        id: 'user2',
        name: 'Jane Smith'
      },
      learning_platform: {
        id: 'platform2',
        name: 'Platform B'
      }
    }
  ];

  describe('Layout Structure', () => {
    it('should render grid with correct responsive classes', () => {
      render(React.createElement(Grid, { workbooks: mockWorkbooks }));
      const gridContainer = document.getElementById('grid-container');
      
      expect(gridContainer).toHaveClass(
        'grid',
        'grid-cols-1',
        'sm:grid-cols-2',
        'md:grid-cols-3',
        'lg:grid-cols-4',
        'gap-6'
      );
    });

    it('should render correct number of grid items', () => {
      render(React.createElement(Grid, { workbooks: mockWorkbooks }));
      const gridItems = screen.getAllByTestId('mock-link');
      expect(gridItems).toHaveLength(mockWorkbooks.length);
    });

    it('should apply proper spacing and border styles', () => {
      render(React.createElement(Grid, { workbooks: mockWorkbooks }));
      const firstCard = screen.getByText('Course 1').closest('div');
      
      expect(firstCard).toHaveClass(
        'bg-white',
        'p-6',
        'rounded-lg',
        'shadow-md',
        'border',
        'border-gray-200'
      );
    });
  });

  describe('Content Display', () => {
    it('should render workbook details correctly', () => {
      render(React.createElement(Grid, { workbooks: mockWorkbooks }));
      
      mockWorkbooks.forEach(workbook => {
        expect(screen.getByText(workbook.workbook.course_name)).toBeInTheDocument();
        expect(screen.getByText("Lead: "+workbook.course_lead.name)).toBeInTheDocument();
        expect(screen.getByText("Platform: "+workbook.learning_platform.name)).toBeInTheDocument();
      });
    });

    it('should render correct links for each workbook', () => {
      render(React.createElement(Grid, { workbooks: mockWorkbooks }));
      
      const links = screen.getAllByTestId('mock-link');
      links.forEach((link, index) => {
        expect(link).toHaveAttribute('href', `/workbook/${mockWorkbooks[index].workbook.id}`);
      });
    });

    it('should render "No workbooks found" when workbooks is null', () => {
      render(React.createElement(Grid, { workbooks: null }));
      expect(screen.getByText('No workbooks found.')).toBeInTheDocument();
    });

    it('should render "No workbooks found" with full column span', () => {
      render(React.createElement(Grid, { workbooks: null }));
      const message = screen.getByText('No workbooks found.');
      expect(message).toHaveClass('col-span-full');
    });
  });

  describe('Card Styling', () => {
    it('should have hover effects on cards', () => {
      render(React.createElement(Grid, { workbooks: mockWorkbooks }));
      const firstCard = screen.getByText('Course 1').closest('div');
      
      expect(firstCard).toHaveClass(
        'hover:shadow-xl',
        'transition-shadow',
        'duration-300'
      );
    });

    it('should apply text styling correctly', () => {
      render(React.createElement(Grid, { workbooks: mockWorkbooks }));
      const workbook = mockWorkbooks[0]

      // Course name styling
      const courseName = screen.getByText(workbook.workbook.course_name);
      expect(courseName).toHaveClass('text-lg', 'font-bold', 'mb-2');
      
      // Course lead and platform stylingmockWorkbooks.forEach(workbook => {
      const courseLeadText = screen.getByText("Lead: "+workbook.course_lead.name);
      expect(courseLeadText).toHaveClass('text-gray-500');
    });
  });

  describe('Empty State', () => {
    it('should handle empty workbooks array', () => {
      render(React.createElement(Grid, { workbooks: [] }));
      expect(screen.getByText('No workbooks found.')).toBeInTheDocument();
    });

    it('should center align empty state message', () => {
      render(React.createElement(Grid, { workbooks: [] }));
      const message = screen.getByText('No workbooks found.');
      expect(message).toHaveClass('text-center', 'text-gray-500');
    });
  });
});
