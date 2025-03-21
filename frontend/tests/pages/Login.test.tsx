
/** @jest-environment jsdom */
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Login from '../../src/pages/Login';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    React.createElement('a', props, children)
  ),
}));

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render login form with all elements', () => {
      render(<Login />);
      
      // Check for essential elements
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    });

    it('should render input with correct attributes', () => {
      render(<Login />);
      const input = screen.getByLabelText('Username');
      
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('required');
    });
  });

  describe('Form Interaction', () => {
    it('should update username input value on change', () => {
      render(<Login />);
      const input = screen.getByLabelText('Username');
      
      fireEvent.change(input, { target: { value: 'testuser' } });
      expect(input).toHaveValue('testuser');
    });

    it('should handle form submission with valid data', async () => {
      mockedAxios.post.mockResolvedValueOnce({});
      
      render(<Login />);
      const input = screen.getByLabelText('Username');
      const submitButton = screen.getByRole('button', { name: 'Log In' });

      fireEvent.change(input, { target: { value: 'testuser' } });
      fireEvent.click(submitButton);

      // Wait for loading state if any
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/session/testuser'),
          {},
          { withCredentials: true }
        );
      });

      // Verify navigation occurred
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
      (window.alert as jest.Mock).mockRestore();
    });

    it('should show alert on login failure', async () => {
      const errorMessage = 'Login failed. Ensure username exists on the backend.';
      mockedAxios.post.mockRejectedValueOnce(new Error('Login failed'));
      
      render(<Login />);
      const input = screen.getByLabelText('Username');
      const submitButton = screen.getByRole('button', { name: 'Log In' });

      fireEvent.change(input, { target: { value: 'testuser' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(errorMessage);
      });
    });
  });
});
