import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Carousel from '../../src/components/Carousel';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to} data-testid="mock-link">
      {children}
    </a>
  ),
}));

describe('Carousel', () => {
  const mockItems = [
    {
      id: 1,
      workbookId: "wb1",
      start_date: "2025-01-01",
      end_date: "2025-12-31",
      course_lead_id: "cl1",
      learning_platform_id: "lp1",
      course_name: "Course 1",
      course_lead: "John Doe",
      learning_platform: "Platform A"
    },
    {
      id: 2,
      workbookId: "wb2",
      start_date: "2025-02-01",
      end_date: "2025-12-31",
      course_lead_id: "cl2",
      learning_platform_id: "lp2",
      course_name: "Course 2",
      course_lead: "Jane Smith",
      learning_platform: "Platform B"
    },
    {
      id: 3,
      workbookId: "wb3",
      start_date: "2025-03-01",
      end_date: "2025-12-31",
      course_lead_id: "cl3",
      learning_platform_id: "lp3",
      course_name: "Course 3",
      course_lead: "Bob Wilson",
      learning_platform: "Platform C"
    }
  ];

  describe('Initial Rendering', () => {
    it('should render with less than MAX_ITEMS', () => {
      render(<Carousel items={mockItems} />);
      expect(screen.getByText('Course 1')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(5); // 3 indicators + 2 navigation buttons
    });

    it('should limit items to MAX_ITEMS', () => {
      const manyItems = Array.from({ length: 10 }, (_, index) => ({
        ...mockItems[0],
        id: index + 1,
        course_name: `Course ${index + 1}`
      }));
      render(<Carousel items={manyItems} />);
      const indicators = screen.getAllByRole('button').filter(
        button => button.getAttribute('data-carousel-slide-to') !== null
      );
      expect(indicators).toHaveLength(5); // MAX_ITEMS is 5
    });

    it('should render with single item', () => {
      render(<Carousel items={[mockItems[0]]} />);
      expect(screen.getByText('Course 1')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(3); // 1 indicator + 2 navigation buttons
    });

    it('should handle empty items array', () => {
      render(<Carousel items={[]} />);
      expect(screen.queryByTestId('mock-link')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Controls', () => {
    it('should navigate to next slide when next button is clicked', () => {
      render(<Carousel items={mockItems} />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      // First slide should be hidden, second slide visible
      const slides = screen.getAllByTestId('mock-link');
      expect(slides[0].parentElement).toHaveClass('hidden');
      expect(slides[1].parentElement).toHaveClass('block');
    });

    it('should navigate to previous slide when previous button is clicked', () => {
      render(<Carousel items={mockItems} />);
      
      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);
      
      // Should wrap to last slide
      const slides = screen.getAllByTestId('mock-link');
      expect(slides[mockItems.length - 1].parentElement).toHaveClass('block');
    });

    it('should update indicators when navigating', () => {
      render(<Carousel items={mockItems} />);
      
      const indicators = screen.getAllByRole('button').filter(
        button => button.getAttribute('data-carousel-slide-to') !== null
      );
      
      // Click second indicator
      fireEvent.click(indicators[1]);
      expect(indicators[1]).toHaveClass('bg-blue-600');
      expect(indicators[0]).toHaveClass('bg-gray-400');
    });

    it('should have accessible navigation controls', () => {
      render(<Carousel items={mockItems} />);
      
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      
      const indicators = screen.getAllByRole('button').filter(
        button => button.getAttribute('aria-label')?.startsWith('Slide')
      );
      expect(indicators.length).toBe(mockItems.length);
    });
  });

  describe('Item Display', () => {
    it('should render item content correctly', () => {
      render(<Carousel items={mockItems} />);
      
      const firstItem = mockItems[0];
      expect(screen.getByText(firstItem.course_name)).toBeInTheDocument();
      expect(screen.getByText(firstItem.course_lead)).toBeInTheDocument();
      expect(screen.getByText(firstItem.learning_platform)).toBeInTheDocument();
    });

    it('should render correct links with workbookId', () => {
      render(<Carousel items={mockItems} />);
      
      const links = screen.getAllByTestId('mock-link');
      expect(links[0]).toHaveAttribute('href', `/workbook/${mockItems[0].workbookId}`);
    });

    it('should fallback to id when workbookId is not provided', () => {
      const itemsWithoutWorkbookId = mockItems.map(({ workbookId, ...item }) => item);
      render(<Carousel items={itemsWithoutWorkbookId} />);
      
      const links = screen.getAllByTestId('mock-link');
      expect(links[0]).toHaveAttribute('href', `/workbook/1`);
    });

    it('should maintain visibility state during transitions', () => {
      render(<Carousel items={mockItems} />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      const slides = screen.getAllByTestId('mock-link').map(link => link.parentElement);
      
      // Initial state
      expect(slides[0]).toHaveClass('block');
      expect(slides[1]).toHaveClass('hidden');
      
      // After transition
      fireEvent.click(nextButton);
      expect(slides[0]).toHaveClass('hidden');
      expect(slides[1]).toHaveClass('block');
    });
  });
});
