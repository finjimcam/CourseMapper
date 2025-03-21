/** @jest-environment jsdom */
import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import SearchResults from '../../src/pages/SearchResults';
import { Workbook } from '../../src/utils/workbookUtils';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-router-dom's useSearchParams
const mockSearchParams = new URLSearchParams();
const mockSetSearchParams = jest.fn();
jest.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    React.createElement('a', props, children)
  ),
}));

// Mock the Grid component since we're only testing SearchResults functionality
jest.mock('../../src/components/Grid', () => ({
  __esModule: true,
  default: ({ workbooks }: { workbooks: Workbook[] }) => (
    <div data-testid="mock-grid">
      {workbooks.map((wb) => (
        <div key={wb.workbook.id}>{wb.workbook.course_name}</div>
      ))}
    </div>
  ),
}));

// Mock the SearchBar component
jest.mock('../../src/components/Searchbar', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-searchbar">Search Bar</div>,
}));

describe('SearchResults', () => {
  const mockWorkbooks: Workbook[] = [
    {
      workbook: {
        id: '1',
        course_name: 'React Course',
        start_date: '2025-01-01',
        end_date: '2025-06-30',
        area_id: 'area1',
        school_id: 'school1',
      },
      course_lead: {
        id: 'user1',
        name: 'John Doe',
      },
      learning_platform: {
        id: 'platform1',
        name: 'Moodle',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset search params before each test
    mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      render(<SearchResults />);
      expect(screen.getByRole('heading', { name: /search results/i })).toBeInTheDocument();
      expect(screen.getByText(/find the best workbooks/i)).toBeInTheDocument();
      expect(screen.getByTestId('mock-searchbar')).toBeInTheDocument();
    });

    it('should render loading spinner when fetching results', async () => {
      // Create a promise that we can control to keep the component in loading state
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockedAxios.get.mockImplementationOnce(() => pendingPromise);

      render(<SearchResults />);
      
      // Find the spinner by its class since it doesn't have a data-testid
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');

      // Resolve the promise to clean up
      resolvePromise!({ data: [] });
      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Results Display', () => {
    it('should display results when data is loaded', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockWorkbooks });
      
      render(<SearchResults />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-grid')).toBeInTheDocument();
        expect(screen.getByText('React Course')).toBeInTheDocument();
      });
    });

    it('should display no results message when empty results returned', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      
      render(<SearchResults />);
      
      await waitFor(() => {
        expect(screen.getByText('No search results found.')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed to fetch'));
      
      render(<SearchResults />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('mock-grid')).not.toBeInTheDocument();
        expect(screen.getByText('No search results found.')).toBeInTheDocument();
      });
    });
  });

  describe('Search Description Generation', () => {
    it('should show default description with no search params', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockWorkbooks });
      
      render(<SearchResults />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing all workbooks')).toBeInTheDocument();
      });
    });

    it('should show correct description for name search', async () => {
      mockSearchParams.set('name', 'React');
      mockedAxios.get.mockResolvedValueOnce({ data: mockWorkbooks });
      
      render(<SearchResults />);
      
      await waitFor(() => {
        expect(screen.getByText('Showing workbooks where name contains "React"')).toBeInTheDocument();
      });
    });

    it('should show correct description for date filters', async () => {
      mockSearchParams.set('starts_after', '2025-01-01');
      mockSearchParams.set('ends_before', '2025-12-31');
      mockedAxios.get.mockResolvedValueOnce({ data: mockWorkbooks });
      
      render(<SearchResults />);
      
      await waitFor(() => {
        const description = screen.getByText((content) => 
          content.includes('starts after') && content.includes('ends before')
        );
        expect(description).toBeInTheDocument();
      });
    });

    it('should show correct description for multiple filters', async () => {
      mockSearchParams.set('led_by', 'John');
      mockSearchParams.set('learning_platform', 'Moodle');
      mockedAxios.get.mockResolvedValueOnce({ data: mockWorkbooks });
      
      render(<SearchResults />);
      
      await waitFor(() => {
        const description = screen.getByText((content) => 
          content.includes('led by "John"') && content.includes('on platform "Moodle"')
        );
        expect(description).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should make API call with correct search parameters', async () => {
      mockSearchParams.set('name', 'React');
      mockSearchParams.set('led_by', 'John');
      mockedAxios.get.mockResolvedValueOnce({ data: mockWorkbooks });
      
      render(<SearchResults />);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/workbooks/search/'),
          expect.objectContaining({
            params: expect.any(URLSearchParams)
          })
        );
      });
    });

  });
});
