import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomBadge } from '../../src/components/CustomBadge';

describe('CustomBadge', () => {
  describe('normaliseKey', () => {
    // Since normaliseKey is not exported, we'll test it through the component's behavior
    it('should normalize keys in color mapping lookup', () => {
      const colorMapping = {
        'test': '#ff0000',
        'hello world': '#00ff00'
      };
      
      render(<CustomBadge label="TEST" colorMapping={colorMapping} />);
      const badge = screen.getByText('TEST');
      expect(badge).toHaveStyle({ backgroundColor: '#ff0000' });

      render(<CustomBadge label="Hello   World" colorMapping={colorMapping} />);
      const badge2 = screen.getByText('Hello   World');
      expect(badge2).toHaveStyle({ backgroundColor: '#00ff00' });
    });
  });

  describe('color mapping', () => {
    it('should apply the correct color from mapping', () => {
      const colorMapping = {
        'test': '#ff0000'
      };
      
      render(<CustomBadge label="test" colorMapping={colorMapping} />);
      const badge = screen.getByText('test');
      expect(badge).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('should apply default gray when color not found', () => {
      const colorMapping = {
        'other': '#ff0000'
      };
      
      render(<CustomBadge label="test" colorMapping={colorMapping} />);
      const badge = screen.getByText('test');
      expect(badge).toHaveStyle({ backgroundColor: '#6c757d' });
    });

    it('should handle empty color mapping', () => {
      render(<CustomBadge label="test" colorMapping={{}} />);
      const badge = screen.getByText('test');
      expect(badge).toHaveStyle({ backgroundColor: '#6c757d' });
    });
  });

  describe('rendering', () => {
    const colorMapping = {
      'test': '#ff0000'
    };

    it('should render with correct label text', () => {
      render(<CustomBadge label="test" colorMapping={colorMapping} />);
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('should render with correct styles', () => {
      render(<CustomBadge label="test" colorMapping={colorMapping} />);
      const badge = screen.getByText('test');
      
      expect(badge).toHaveStyle({
        backgroundColor: '#ff0000',
        borderRadius: '12px',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center'
      });
    });

    it('should handle empty label', () => {
      render(<CustomBadge label="" colorMapping={colorMapping} />);
      const badge = screen.getByText('');
      expect(badge).toBeInTheDocument();
    });

    it('should handle long labels', () => {
      const longLabel = 'This is a very long label for testing purposes';
      render(<CustomBadge label={longLabel} colorMapping={colorMapping} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });

  describe('props', () => {
    it('should handle all required props', () => {
      const colorMapping = {
        'test': '#ff0000'
      };
      
      expect(() => {
        render(<CustomBadge label="test" colorMapping={colorMapping} />);
      }).not.toThrow();
    });

    // TypeScript will handle prop types validation at compile time
    it('should handle color mapping prop correctly', () => {
      const colorMapping = {
        'test': '#ff0000',
        'other': '#00ff00'
      };
      
      render(<CustomBadge label="test" colorMapping={colorMapping} />);
      const badge = screen.getByText('test');
      expect(badge).toHaveStyle({ backgroundColor: '#ff0000' });
    });
  });
});
