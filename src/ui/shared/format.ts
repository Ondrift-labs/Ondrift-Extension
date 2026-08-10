import type { HistoryItem, LanguageId, UsageSummary } from './contracts';
import { LOCALE_TAGS } from './i18n';

const RELATIVE_TIME_UNITS: Record<LanguageId, { justNow: string; minutes: (n: number) => string; hours: (n: number) => string; days: (n: number) => string }> = {
  ko: { justNow: '방금 전', minutes: (n) => `${n}분 전`, hours: (n) => `${n}시간 전`, days: (n) => `${n}일 전` },
  en: { justNow: 'Just now', minutes: (n) => `${n}m ago`, hours: (n) => `${n}h ago`, days: (n) => `${n}d ago` },
  ja: { justNow: 'たった今', minutes: (n) => `${n}分前`, hours: (n) => `${n}時間前`, days: (n) => `${n}日前` },
};

export function formatRelativeTime(timestamp: number, now = Date.now(), language: LanguageId = 'en'): string {
  const units = RELATIVE_TIME_UNITS[language] ?? RELATIVE_TIME_UNITS.en;
  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000));
  if (minutes < 1) return units.justNow;
  if (minutes < 60) return units.minutes(minutes);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return units.hours(hours);
  const days = Math.round(hours / 24);
  if (days < 7) return units.days(days);
  return new Intl.DateTimeFormat(LOCALE_TAGS[language] ?? LOCALE_TAGS.en, { month: 'short', day: 'numeric' }).format(timestamp);
}

export function summarizeUsage(items: HistoryItem[], now = Date.now()): UsageSummary {
  const weekStart = now - 7 * 24 * 60 * 60 * 1_000;
  const recent = items.filter((item) => item.createdAt >= weekStart);
  const scored = recent.filter((item) => Number.isFinite(item.score));
  const averageScore = scored.length
    ? Math.round(scored.reduce((total, item) => total + item.score, 0) / scored.length)
    : null;
  const deltas = scored.filter((item) => item.previousScore !== undefined);
  const scoreDelta = deltas.length
    ? Math.round(deltas.reduce((total, item) => total + item.score - (item.previousScore ?? item.score), 0) / deltas.length)
    : null;
  const adoptionRate = recent.length
    ? Math.round((recent.filter((item) => item.applied).length / recent.length) * 100)
    : null;
  const grouped = new Map<string, number[]>();
  for (const item of scored) {
    const date = new Date(item.createdAt).toISOString().slice(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), item.score]);
  }
  const dailyScores = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scores]) => ({
      date,
      score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    }));
  return {
    rewritesThisWeek: recent.length,
    averageScore,
    scoreDelta,
    adoptionRate,
    totalTokens: recent.reduce((total, item) => total + (item.inputTokens ?? 0) + (item.outputTokens ?? 0), 0),
    dailyScores,
  };
}

export function filterHistory(items: HistoryItem[], query: string): HistoryItem[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return items;
  return items.filter((item) =>
    `${item.originalText} ${item.improvedText} ${item.service}`.toLocaleLowerCase().includes(normalized),
  );
}
