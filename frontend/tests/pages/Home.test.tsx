<<<<<<< HEAD
/** @jest-environment jsdom */
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Home from '../../src/pages/Home';
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

describe('Home', () => {
  const mockWorkbooks: Workbook[] = [
    {
      workbook: {
        id: '1',
        course_name: 'React Fundamentals',
        start_date: '2025-01-01',
        end_date: '2025-06-30',
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
    // Add more mock workbooks to test pagination/show more functionality
    ...Array(20).fill(null).map((_, index) => ({
      workbook: {
        id: String(index + 2),
        course_name: `Course ${index + 2}`,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      },
      course_lead: {
        id: `user${index + 2}`,
        name: `User ${index + 2}`,
      },
      learning_platform: {
        id: 'platform1',
        name: 'Moodle',
      },
    })),
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
    // Setup default mock responses
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/session/')) return Promise.resolve(mockSessionResponse);
      if (url.includes('/users/')) return Promise.resolve(mockUsersResponse);
      if (url.includes('/workbooks/search/')) return Promise.resolve({ data: mockWorkbooks });
      return Promise.reject(new Error('Not found'));
    });
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      render(<Home />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render welcome message with username after loading', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
      });
    });

    it('should render action buttons', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText('My Workbooks')).toBeInTheDocument();
        expect(screen.getByText('Create Workbook')).toBeInTheDocument();
      });
    });
  });

  describe('Workbook Display', () => {
    it('should render recent workbooks section', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText('Recent Workbooks')).toBeInTheDocument();
      });
    });

    it('should render all workbooks section with initial limit', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText('All Workbooks')).toBeInTheDocument();
        // Initially should show only 16 workbooks
        const firstHiddenCourse = `Course ${17}`;
        expect(screen.queryByText(firstHiddenCourse)).not.toBeInTheDocument();
      });
    });

      it('should show more workbooks when clicking show more', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText('Show All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Show All'));

      await waitFor(() => {
        // Verify a workbook from the extended list is now visible
        const lastCourse = `Course ${17}`; // This was hidden before
        expect(screen.getByText(lastCourse)).toBeInTheDocument();
        expect(screen.getByText('Show Less')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to my workbooks page', async () => {
      render(<Home />);
      await waitFor(() => {
        const myWorkbooksButton = screen.getByText('My Workbooks');
        fireEvent.click(myWorkbooksButton);
        expect(mockNavigate).toHaveBeenCalledWith('/my-workbooks');
      });
    });

    it('should open create workbook modal', async () => {
      render(<Home />);
      await waitFor(() => {
        const createButton = screen.getByText('Create Workbook');
        fireEvent.click(createButton);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle session fetch error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed to fetch session'));
      render(<Home />);
      
      await waitFor(() => {
        // Should render with empty username
        expect(screen.getByText('Welcome back, !')).toBeInTheDocument();
      });
    });

    it('should handle workbooks fetch error', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/session/')) return Promise.resolve(mockSessionResponse);
        if (url.includes('/users/')) return Promise.resolve(mockUsersResponse);
        if (url.includes('/workbooks/search/')) return Promise.reject(new Error('Failed to fetch workbooks'));
        return Promise.reject(new Error('Not found'));
      });

      render(<Home />);
      
      // First wait for loading state to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Then check for error message
      expect(screen.getByText((content) => 
        content.includes('Error:') && content.includes('Failed to fetch workbooks')
      )).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search bar', async () => {
      render(<Home />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search workbooks...');
        expect(searchInput).toBeInTheDocument();
        expect(searchInput).toHaveAttribute('type', 'text');
      });
    });
=======
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Home from '../../src/pages/Home';
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

describe('Home', () => {
  const mockWorkbooks: Workbook[] = [
    {
      workbook: {
        id: '1',
        course_name: 'React Fundamentals',
        start_date: '2025-01-01',
        end_date: '2025-06-30',
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
    // Add more mock workbooks to test pagination/show more functionality
    ...Array(20).fill(null).map((_, index) => ({
      workbook: {
        id: String(index + 2),
        course_name: `Course ${index + 2}`,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      },
      course_lead: {
        id: `user${index + 2}`,
        name: `User ${index + 2}`,
      },
      learning_platform: {
        id: 'platform1',
        name: 'Moodle',
      },
    })),
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
    // Setup default mock responses
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/session/')) return Promise.resolve(mockSessionResponse);
      if (url.includes('/users/')) return Promise.resolve(mockUsersResponse);
      if (url.includes('/workbooks/search/')) return Promise.resolve({ data: mockWorkbooks });
      return Promise.reject(new Error('Not found'));
    });
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      render(<Home />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render welcome message with username after loading', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
      });
    });

    it('should render action buttons', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText('My Workbooks')).toBeInTheDocument();
        expect(screen.getByText('Create Workbook')).toBeInTheDocument();
      });
    });
  });

  describe('Workbook Display', () => {
    it('should render recent workbooks section', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText('Recent Workbooks')).toBeInTheDocument();
      });
    });

    it('should render all workbooks section with initial limit', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText('All Workbooks')).toBeInTheDocument();
        // Initially should show only 16 workbooks
        const firstHiddenCourse = `Course ${17}`;
        expect(screen.queryByText(firstHiddenCourse)).not.toBeInTheDocument();
      });
    });

      it('should show more workbooks when clicking show more', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText('Show All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Show All'));

      await waitFor(() => {
        // Verify a workbook from the extended list is now visible
        const lastCourse = `Course ${17}`; // This was hidden before
        expect(screen.getByText(lastCourse)).toBeInTheDocument();
        expect(screen.getByText('Show Less')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to my workbooks page', async () => {
      render(<Home />);
      await waitFor(() => {
        const myWorkbooksButton = screen.getByText('My Workbooks');
        fireEvent.click(myWorkbooksButton);
        expect(mockNavigate).toHaveBeenCalledWith('/my-workbooks');
      });
    });

    it('should open create workbook modal', async () => {
      render(<Home />);
      await waitFor(() => {
        const createButton = screen.getByText('Create Workbook');
        fireEvent.click(createButton);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle session fetch error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed to fetch session'));
      render(<Home />);
      
      await waitFor(() => {
        // Should render with empty username
        expect(screen.getByText('Welcome back, !')).toBeInTheDocument();
      });
    });

    it('should handle workbooks fetch error', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/session/')) return Promise.resolve(mockSessionResponse);
        if (url.includes('/users/')) return Promise.resolve(mockUsersResponse);
        if (url.includes('/workbooks/search/')) return Promise.reject(new Error('Failed to fetch workbooks'));
        return Promise.reject(new Error('Not found'));
      });

      render(<Home />);
      
      // First wait for loading state to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Then check for error message
      expect(screen.getByText((content) => 
        content.includes('Error:') && content.includes('Failed to fetch workbooks')
      )).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search bar', async () => {
      render(<Home />);
    }).not.toThrow();
>>>>>>> 0e28421 (homepage test (not working))
  });
});
