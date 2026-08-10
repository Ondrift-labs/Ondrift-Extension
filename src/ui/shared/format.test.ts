import { describe, expect, it } from 'vitest';
import type { HistoryItem } from './contracts';
import { filterHistory, formatRelativeTime, summarizeUsage } from './format';

const now = Date.UTC(2026, 7, 10, 12);
const history: HistoryItem[] = [
  { id: '1', service: 'chatgpt', originalText: 'write release notes', improvedText: 'Draft concise release notes', score: 84, previousScore: 52, applied: true, createdAt: now - 60_000, inputTokens: 20, outputTokens: 30 },
  { id: '2', service: 'claude', originalText: 'plan migration', improvedText: 'Create a staged database migration plan', score: 72, previousScore: 60, applied: false, createdAt: now - 2 * 86_400_000, inputTokens: 10, outputTokens: 15 },
  { id: 'old', service: 'chatgpt', originalText: 'old item', improvedText: 'old item', score: 30, applied: true, createdAt: now - 9 * 86_400_000 },
];

describe('popup view logic', () => {
  it('aggregates only the current week and calculates adoption and score lift', () => {
    expect(summarizeUsage(history, now)).toMatchObject({
      rewritesThisWeek: 2,
      averageScore: 78,
      scoreDelta: 22,
      adoptionRate: 50,
      totalTokens: 75,
    });
  });

  it('searches prompt text and service names case-insensitively', () => {
    expect(filterHistory(history, 'DATABASE')).toHaveLength(1);
    expect(filterHistory(history, 'claude')[0]?.id).toBe('2');
    expect(filterHistory(history, '   ')).toBe(history);
  });

  it('formats recent timestamps compactly', () => {
    expect(formatRelativeTime(now - 60_000, now)).toBe('1m ago');
    expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe('3h ago');
  });
});
