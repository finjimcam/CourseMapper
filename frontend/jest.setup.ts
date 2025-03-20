import '@testing-library/jest-dom';

// Mock process.env for test environment
process.env.NODE_ENV = 'test';

// Mock global functions
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_API: 'http://test-api'
    }
  }
});
