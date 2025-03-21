/** @jest-environment jsdom */
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import MyWorkbooks from '../../src/pages/MyWorkbooks';
import { Workbook } from '../../src/utils/workbookUtils';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    React.createElement('a', props, children)
  ),
}));

// Mock the Grid component
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

// Mock the Carousel component
// Import type for Carousel items
jest.mock('../../src/components/Carousel', () => ({
  __esModule: true,
  default: ({ items }: { items: Array<{
    id: number;
    workbookId: string;
    course_name: string;
    start_date: string;
    end_date: string;
    course_lead_id: string;
    learning_platform_id: string;
    course_lead: string;
    learning_platform: string;
    area_id: string;
    school_id: string | null;
  }> }) => (
    <div data-testid="mock-carousel">
      {items.map((item) => (
        <div key={item.id}>{item.course_name}</div>
      ))}
    </div>
  ),
}));

// Mock the SearchBar component
jest.mock('../../src/components/Searchbar', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-searchbar">Search Bar</div>,
}));

// Mock the CreateWorkbookModal component
jest.mock('../../src/components/modals/CreateWorkbookModal', () => ({
  CreateWorkbookModal: ({ show, onSubmit }: { 
    show: boolean; 
    onSubmit: (data: {
      courseName: string;
      learningPlatformId: string;
      startDate: string;
      endDate: string;
      coordinatorIds: string[];
      areaId: string;
      schoolId: string | null;
      learningPlatform: string;
    }) => void 
  }) => (
    show ? (
      <div data-testid="mock-create-modal">
        <button onClick={() => onSubmit({
          courseName: 'New Course',
          learningPlatformId: 'platform1',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          coordinatorIds: ['user1'],
          areaId: 'area1',
          schoolId: 'school1',
          learningPlatform: 'Moodle',
        })}>Submit</button>
      </div>
    ) : null
  ),
}));

describe('MyWorkbooks', () => {
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

  const mockSessionResponse = {
    data: {
      user_id: 'user1',
    },
  };

  const mockUsersResponse = {
    data: [
      {
        id: 'user1',
        name: 'John Doe',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    beforeEach(() => {
      // Default successful responses
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/session/')) return Promise.resolve(mockSessionResponse);
        if (url.includes('/users/')) return Promise.resolve(mockUsersResponse);
        if (url.includes('/workbooks/search/')) return Promise.resolve({ data: mockWorkbooks });
        return Promise.reject(new Error('Not found'));
      });
    });

    it('should render loading state initially', () => {
      // Mock the first axios call to delay so we can see loading state
      const delayedPromise = new Promise((resolve) => {
        setTimeout(() => resolve(mockSessionResponse), 100);
      });
      mockedAxios.get.mockImplementationOnce(() => delayedPromise);
      
      render(<MyWorkbooks />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render user welcome message after loading', async () => {
      render(<MyWorkbooks />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should load and display workbooks', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/session/')) return Promise.resolve(mockSessionResponse);
        if (url.includes('/users/')) return Promise.resolve(mockUsersResponse);
        if (url.includes('/workbooks/search/')) return Promise.resolve({ data: mockWorkbooks });
        return Promise.reject(new Error('Not found'));
      });

      render(<MyWorkbooks />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-grid')).toBeInTheDocument();
        expect(screen.getByTestId('mock-carousel')).toBeInTheDocument();
        expect(screen.getAllByText('React Course')).toHaveLength(2); // One in grid, one in carousel
      });
    });

    it('should handle workbook loading error', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/session/')) return Promise.resolve(mockSessionResponse);
        if (url.includes('/users/')) return Promise.resolve(mockUsersResponse);
        return Promise.reject(new Error('Failed to fetch workbooks'));
      });

      render(<MyWorkbooks />);
      
      await waitFor(() => {
        expect(screen.getByText(/error:/i)).toBeInTheDocument();
      });
    });

    it('should handle user data loading error', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/session/')) return Promise.reject(new Error('Failed to fetch session'));
        return Promise.resolve({ data: [] });
      });

      render(<MyWorkbooks />);
      
      await waitFor(() => {
        expect(screen.getByText(/error: Failed to fetch session/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workbook Creation', () => {
    beforeEach(() => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/session/')) return Promise.resolve(mockSessionResponse);
        if (url.includes('/users/')) return Promise.resolve(mockUsersResponse);
        if (url.includes('/workbooks/search/')) return Promise.resolve({ data: mockWorkbooks });
        return Promise.reject(new Error('Not found'));
      });
    });

    it('should open create workbook modal when button is clicked', async () => {
      render(<MyWorkbooks />);
      
      await waitFor(() => {
        expect(screen.getByText('Create Workbook')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Workbook'));
      
      expect(screen.getByTestId('mock-create-modal')).toBeInTheDocument();
    });

    it('should handle workbook creation and navigation', async () => {
      render(<MyWorkbooks />);
      
      await waitFor(() => {
        expect(screen.getByText('Create Workbook')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Workbook'));
      fireEvent.click(screen.getByText('Submit'));
      
      expect(mockNavigate).toHaveBeenCalledWith('/workbooks/create');
      expect(sessionStorage.getItem('newWorkbookData')).toBeTruthy();
    });
  });

  describe('API Integration', () => {
    it('should make correct API calls for user workbooks', async () => {
      render(<MyWorkbooks />);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${process.env.VITE_API}/session/`,
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${process.env.VITE_API}/users/`
        );
      });

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringMatching(/\/workbooks\/search\/\?led_by=/)
        );
      });
    });

    it('should combine and deduplicate workbooks from lead and contributor responses', async () => {
      const duplicateWorkbook = { ...mockWorkbooks[0] };
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/session/')) return Promise.resolve(mockSessionResponse);
        if (url.includes('/users/')) return Promise.resolve(mockUsersResponse);
        if (url.includes('led_by=')) return Promise.resolve({ data: mockWorkbooks });
        if (url.includes('contributed_by=')) return Promise.resolve({ data: [duplicateWorkbook] });
        return Promise.reject(new Error('Not found'));
      });

      render(<MyWorkbooks />);
      
      await waitFor(() => {
        // Should only show one instance of the workbook, not two
        expect(screen.getAllByText('React Course')).toHaveLength(2); // One in grid, one in carousel
      });
    });
  });
});
