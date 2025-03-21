import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import Home from '../../src/pages/Home';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

describe('Home', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<Home />);
    }).not.toThrow();
  });
});
