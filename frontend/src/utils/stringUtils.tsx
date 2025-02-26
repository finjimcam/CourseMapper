/**
 * Normalizes a string key by converting to lowercase and removing spaces
 * Used for consistent key mapping across components
 */
export const normalizeKey = (str: string): string => {
    return str.trim().toLowerCase().replace(/\s+/g, '');
  };
  