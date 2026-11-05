// Attendance Utils Unit Tests
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal
// These tests run with no database connection required.
import { describe, it, expect } from 'vitest';
import {
  getTodayIST,
  isFutureDateIST,
  daysBetweenIST,
} from '../../utils/istDate.js';

describe('getTodayIST', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const today = getTodayIST();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a parseable date', () => {
    const today = getTodayIST();
    const parsed = new Date(today);
    expect(isNaN(parsed.getTime())).toBe(false);
  });
});

describe('isFutureDateIST', () => {
  it('returns true for a clearly future date', () => {
    expect(isFutureDateIST('2099-01-01')).toBe(true);
  });

  it('returns false for a clearly past date', () => {
    expect(isFutureDateIST('2000-01-01')).toBe(false);
  });

  it('returns false for today', () => {
    const today = getTodayIST();
    expect(isFutureDateIST(today)).toBe(false);
  });
});

describe('daysBetweenIST', () => {
  it('returns 0 for the same date', () => {
    expect(daysBetweenIST('2024-01-15', '2024-01-15')).toBe(0);
  });

  it('returns 1 for consecutive dates', () => {
    expect(daysBetweenIST('2024-01-15', '2024-01-16')).toBe(1);
  });

  it('returns 7 for one week apart', () => {
    expect(daysBetweenIST('2024-01-01', '2024-01-08')).toBe(7);
  });

  it('returns 365 for one year apart (non-leap year)', () => {
    expect(daysBetweenIST('2023-01-01', '2024-01-01')).toBe(365);
  });

  it('returns negative for reversed dates', () => {
    expect(daysBetweenIST('2024-01-16', '2024-01-15')).toBe(-1);
  });

  it('handles month boundaries correctly', () => {
    expect(daysBetweenIST('2024-01-31', '2024-02-01')).toBe(1);
  });

  it('handles leap year correctly', () => {
    // 2024 is a leap year — Feb has 29 days
    expect(daysBetweenIST('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('attendance edit window: 7 days ago is at the boundary', () => {
    const session = '2024-06-01';
    const today = '2024-06-08';
    expect(daysBetweenIST(session, today)).toBe(7);
  });

  it('attendance edit window: 8 days ago exceeds the boundary', () => {
    const session = '2024-06-01';
    const today = '2024-06-09';
    expect(daysBetweenIST(session, today)).toBeGreaterThan(7);
  });
});
