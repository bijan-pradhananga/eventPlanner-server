// Input sanitization utilities
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const sanitizeSearchQuery = (query: string): string => {
  // Remove special characters that might be used for SQL injection
  return query.replace(/[<>\"'%;()&+]/g, '').trim();
};

export const parseIntArray = (str: string): number[] => {
  if (!str) return [];
  
  return str.split(',')
    .map(item => parseInt(item.trim()))
    .filter(num => !isNaN(num) && num > 0);
};

export const validatePagination = (page?: string | number, limit?: string | number) => {
  const parsedPage = typeof page === 'string' ? parseInt(page) : page || 1;
  const parsedLimit = typeof limit === 'string' ? parseInt(limit) : limit || 10;
  
  return {
    page: Math.max(1, parsedPage),
    limit: Math.min(100, Math.max(1, parsedLimit)) // Cap at 100, minimum 1
  };
};