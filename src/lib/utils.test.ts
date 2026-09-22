import { describe, expect, it } from 'vitest';

import { cn, formatCurrency, formatDate, formatNumber, initialsFromName } from '@/lib/utils';

describe('cn', () => {
  it('merges and deduplicates tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('formatCurrency', () => {
  it('formats USD values with two decimal places', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });
});

describe('formatNumber', () => {
  it('uses grouping separators', () => {
    expect(formatNumber(1500000)).toMatch(/1[.,\s]500[.,\s]000/);
  });
});

describe('formatDate', () => {
  it('formats ISO dates using the configured locale', () => {
    expect(formatDate('2024-04-15T12:00:00.000Z', { dateStyle: 'medium' })).toMatch(/Apr/);
  });
});

describe('initialsFromName', () => {
  it('returns two initials for full names', () => {
    expect(initialsFromName('Ada Lovelace')).toBe('AL');
  });

  it('returns first two characters for single names', () => {
    expect(initialsFromName('Cher')).toBe('CH');
  });

  it('falls back to ? when empty', () => {
    expect(initialsFromName('')).toBe('?');
  });
});
