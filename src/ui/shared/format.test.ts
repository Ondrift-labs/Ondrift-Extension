import { describe, expect, it } from 'vitest';
import type { HistoryItem } from './contracts';
import { filterHistory, formatRelativeTime, summarizeUsage } from './format';

const now = Date.UTC(2026, 7, 10, 12);
const history: HistoryItem[] = [
  { id: '1', service: 'chatgpt', originalText: 'write release notes', improvedText: 'Draft concise release notes', score: 84, previousScore: 52, applied: true, createdAt: now - 60_000, inputTokens: 20, outputTokens: 30 },
  { id: '2', service: 'claude', originalText: 'plan migration', improvedText: 'Create a staged database migration plan', score: 72, previousScore: 60, applied: false, createdAt: now - 2 * 86_400_000, inputTokens: 10, outputTokens: 15 },
  { id: 'unscored', service: 'gemini', originalText: 'plain submission', applied: false, createdAt: now - 30_000 },
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

  it('excludes prompts that were never scored from rewrite metrics', () => {
    const summary = summarizeUsage(history, now);

    expect(summary.rewritesThisWeek).toBe(2);
    expect(summary.averageScore).toBe(78);
    expect(summary.adoptionRate).toBe(50);
  });

  it('searches prompt text and service names case-insensitively', () => {
    expect(filterHistory(history, 'DATABASE')).toHaveLength(1);
    expect(filterHistory(history, 'claude')[0]?.id).toBe('2');
    expect(filterHistory(history, '   ')).toBe(history);
  });

  it('formats recent timestamps compactly in English by default', () => {
    expect(formatRelativeTime(now - 60_000, now)).toBe('1m ago');
    expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe('3h ago');
    expect(formatRelativeTime(now - 10_000, now)).toBe('Just now');
    expect(formatRelativeTime(now - 2 * 86_400_000, now)).toBe('2d ago');
  });

  it('localizes relative time units for Korean and Japanese', () => {
    expect(formatRelativeTime(now - 60_000, now, 'ko')).toBe('1분 전');
    expect(formatRelativeTime(now - 3 * 3_600_000, now, 'ko')).toBe('3시간 전');
    expect(formatRelativeTime(now - 2 * 86_400_000, now, 'ko')).toBe('2일 전');
    expect(formatRelativeTime(now - 10_000, now, 'ko')).toBe('방금 전');

    expect(formatRelativeTime(now - 60_000, now, 'ja')).toBe('1分前');
    expect(formatRelativeTime(now - 3 * 3_600_000, now, 'ja')).toBe('3時間前');
    expect(formatRelativeTime(now - 2 * 86_400_000, now, 'ja')).toBe('2日前');
    expect(formatRelativeTime(now - 10_000, now, 'ja')).toBe('たった今');
  });

  it('falls back to a locale-aware month/day date once a week has passed', () => {
    const older = now - 9 * 86_400_000;
    expect(formatRelativeTime(older, now, 'en')).toMatch(/[A-Za-z]{3}\s\d{1,2}/);
    expect(formatRelativeTime(older, now, 'ja')).toMatch(/\d{1,2}月\d{1,2}日/);
    expect(formatRelativeTime(older, now, 'ko')).toMatch(/\d{1,2}월\s?\d{1,2}일/);
  });
});
