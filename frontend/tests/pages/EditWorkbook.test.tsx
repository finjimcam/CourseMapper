/** @jest-environment jsdom */
import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import EditWorkbook from '../../src/pages/EditWorkbook';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
const mockParams = { workbook_id: '1' };
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    React.createElement('a', props, children)
  ),
}));

describe('EditWorkbook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading spinner initially', () => {
    render(<EditWorkbook />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show error message on fetch failure', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Failed to load'));
    
    render(<EditWorkbook />);
    
    await waitFor(() => {
      const errorMessage = screen.getByText((content) => 
        content.startsWith('Error:') && content.includes('Failed to load')
      );
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
