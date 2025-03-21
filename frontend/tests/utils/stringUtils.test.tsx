import { normalizeKey } from '../../src/utils/stringUtils';

describe('stringUtils', () => {
  describe('normalizeKey', () => {
    it('should convert strings to lowercase', () => {
      expect(normalizeKey('HELLO WORLD')).toBe('helloworld');
      expect(normalizeKey('MixedCase')).toBe('mixedcase');
    });

    it('should remove spaces from strings', () => {
      expect(normalizeKey('hello world')).toBe('helloworld');
      expect(normalizeKey('spaces between words')).toBe('spacesbetweenwords');
    });

    it('should handle strings with multiple spaces', () => {
      expect(normalizeKey('multiple   spaces')).toBe('multiplespaces');
      expect(normalizeKey('space   between   words')).toBe('spacebetweenwords');
    });

    it('should trim leading and trailing spaces', () => {
      expect(normalizeKey('  leading spaces')).toBe('leadingspaces');
      expect(normalizeKey('trailing spaces  ')).toBe('trailingspaces');
      expect(normalizeKey('  both sides  ')).toBe('bothsides');
    });

    it('should handle empty strings and whitespace', () => {
      expect(normalizeKey('')).toBe('');
      expect(normalizeKey('   ')).toBe('');
    });

    it('should handle special characters and numbers', () => {
      expect(normalizeKey('Hello123')).toBe('hello123');
      expect(normalizeKey('special!@#$%^&*characters')).toBe('special!@#$%^&*characters');
    });

    it('should handle mixed case strings with spaces and special characters', () => {
      expect(normalizeKey('  Mixed CASE with  Spaces!  ')).toBe('mixedcasewithspaces!');
      expect(normalizeKey('USER NAME  123')).toBe('username123');
    });

    it('should preserve underscores and special characters', () => {
      expect(normalizeKey('USER_NAME_123')).toBe('user_name_123');
      expect(normalizeKey('test@email.com')).toBe('test@email.com');
    });
  });
});
