import { formatDate, formatDateTime, getRelativeTime } from '@/utils/formatDate';

describe('Date Utilities', () => {
  const testDate = new Date('2024-01-15T10:30:00Z');
  const testDateString = '2024-01-15T10:30:00Z';

  describe('formatDate', () => {
    it('should format date in short format by default', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should format date in short format explicitly', () => {
      const result = formatDate(testDate, 'short');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should format date in long format', () => {
      const result = formatDate(testDate, 'long');
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should format date in time format', () => {
      const result = formatDate(testDate, 'time');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle string input', () => {
      const result = formatDate(testDateString);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle invalid date gracefully', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const result = formatDateTime(testDate);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}/);
    });

    it('should handle string input', () => {
      const result = formatDateTime(testDateString);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}/);
    });
  });

  describe('getRelativeTime', () => {
    beforeEach(() => {
      // Mock current time
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "Just now" for very recent dates', () => {
      const recentDate = new Date('2024-01-15T11:59:30Z');
      const result = getRelativeTime(recentDate);
      expect(result).toBe('Just now');
    });

    it('should return minutes ago for recent dates', () => {
      const recentDate = new Date('2024-01-15T11:30:00Z');
      const result = getRelativeTime(recentDate);
      expect(result).toBe('30 minutes ago');
    });

    it('should return hours ago for same day dates', () => {
      const recentDate = new Date('2024-01-15T08:00:00Z');
      const result = getRelativeTime(recentDate);
      expect(result).toBe('4 hours ago');
    });

    it('should return days ago for recent dates', () => {
      const recentDate = new Date('2024-01-10T12:00:00Z');
      const result = getRelativeTime(recentDate);
      expect(result).toBe('5 days ago');
    });

    it('should return months ago for older dates', () => {
      const recentDate = new Date('2023-11-15T12:00:00Z');
      const result = getRelativeTime(recentDate);
      expect(result).toBe('2 months ago');
    });

    it('should return years ago for very old dates', () => {
      const recentDate = new Date('2022-01-15T12:00:00Z');
      const result = getRelativeTime(recentDate);
      expect(result).toBe('1 years ago');
    });

    it('should handle string input', () => {
      const result = getRelativeTime('2024-01-15T11:30:00Z');
      expect(result).toBe('30 minutes ago');
    });
  });
});
