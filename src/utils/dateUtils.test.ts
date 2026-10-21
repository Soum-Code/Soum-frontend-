import { describe, it, expect } from 'vitest';
import {
  parseDateTimeToMs,
  formatRelativeTime,
  formatFullRelativeTime,
  getTimeDisplayInfo
} from './dateUtils';

describe('dateUtils', () => {
  const baseNow = new Date('2026-10-19T10:00:00.000Z').getTime();

  describe('parseDateTimeToMs', () => {
    it('parses standard ISO and datetime strings', () => {
      const ms = parseDateTimeToMs('2026-10-19 10:00:00');
      expect(ms).toBeGreaterThan(0);
    });

    it('parses relative strings like "2s ago" and "15m ago"', () => {
      const twoSecAgo = parseDateTimeToMs('2s ago', baseNow);
      expect(twoSecAgo).toBe(baseNow - 2000);

      const fifteenMinAgo = parseDateTimeToMs('15m ago', baseNow);
      expect(fifteenMinAgo).toBe(baseNow - 15 * 60 * 1000);

      const twoHoursAgo = parseDateTimeToMs('2h ago', baseNow);
      expect(twoHoursAgo).toBe(baseNow - 2 * 3600 * 1000);

      const justNow = parseDateTimeToMs('Just now', baseNow);
      expect(justNow).toBe(baseNow);
    });
  });

  describe('formatRelativeTime', () => {
    it('correctly formats small second deltas like "2s ago"', () => {
      const ts2s = baseNow - 2000;
      expect(formatRelativeTime(ts2s, baseNow)).toBe('2s ago');

      const ts15s = baseNow - 15000;
      expect(formatRelativeTime(ts15s, baseNow)).toBe('15s ago');
    });

    it('formats "just now" for sub-second and immediate events', () => {
      expect(formatRelativeTime(baseNow - 500, baseNow)).toBe('just now');
    });

    it('formats minutes, hours, and days', () => {
      expect(formatRelativeTime(baseNow - 3 * 60 * 1000, baseNow)).toBe('3m ago');
      expect(formatRelativeTime(baseNow - 2 * 3600 * 1000, baseNow)).toBe('2h ago');
      expect(formatRelativeTime(baseNow - 24 * 3600 * 1000, baseNow)).toBe('yesterday');
      expect(formatRelativeTime(baseNow - 3 * 24 * 3600 * 1000, baseNow)).toBe('3d ago');
    });
  });

  describe('formatFullRelativeTime', () => {
    it('formats full descriptive relative text', () => {
      expect(formatFullRelativeTime(baseNow - 2000, baseNow)).toBe('2 seconds ago');
      expect(formatFullRelativeTime(baseNow - 1000, baseNow)).toBe('1 second ago');
      expect(formatFullRelativeTime(baseNow - 60000, baseNow)).toBe('1 minute ago');
      expect(formatFullRelativeTime(baseNow - 120000, baseNow)).toBe('2 minutes ago');
      expect(formatFullRelativeTime(baseNow - 3600000, baseNow)).toBe('1 hour ago');
    });
  });

  describe('getTimeDisplayInfo', () => {
    it('returns complete structured display info for tooltips and columns', () => {
      const info = getTimeDisplayInfo(baseNow - 2000, baseNow);
      expect(info.relative).toBe('2s ago');
      expect(info.fullRelative).toBe('2 seconds ago');
      expect(info.formattedTime).toBeDefined();
      expect(info.formattedDate).toBeDefined();
      expect(info.formattedDateTime).toBeDefined();
      expect(info.isoString).toContain('2026');
    });
  });
});
