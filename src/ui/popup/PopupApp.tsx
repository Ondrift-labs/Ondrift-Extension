import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, type HistoryItem, type UiBridge, type UiSettings } from '../shared/contracts';
import { filterHistory, formatRelativeTime, summarizeUsage } from '../shared/format';
import { getUiCopy, LOCALE_TAGS, type UiCopy } from '../shared/i18n';
import { Icon } from '../shared/Icon';
import '../shared/ui.css';
import './popup.css';

type LoadState = 'loading' | 'ready' | 'error';
const SERVICE_NAMES: Record<HistoryItem['service'], string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
};
// How long the copy-to-clipboard confirmation (or failure) message stays visible.
const COPY_FEEDBACK_TIMEOUT_MS = 1800;
// Only the most recent entries are shown in the popup's history list; the rest are still
// searchable via the query field and remain in full in the options page's history.
const HISTORY_PREVIEW_LIMIT = 12;
const TREND_WIDTH = 260;
const TREND_HEIGHT = 46;

function ScoreTrend({ scores, copy }: { scores: Array<{ date: string; score: number }>; copy: UiCopy['popup'] }) {
  if (scores.length < 2) return <div className="trend-empty">{copy.trend.emptyMessage}</div>;
  const points = scores.slice(-7);
  const width = TREND_WIDTH;
  const height = TREND_HEIGHT;
  const plot = points.map((item, index) => `${index / (points.length - 1) * width},${height - item.score / 100 * height}`).join(' ');
  const summary = points.map(({ date, score }) => `${date}: ${score}`).join(', ');
  return <svg className="trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={copy.trend.ariaLabel(summary)}><path d={`M0 ${height * .5}H${width}`} /><polyline points={plot} /><circle cx={plot.split(' ').at(-1)?.split(',')[0]} cy={plot.split(' ').at(-1)?.split(',')[1]} r="3" /></svg>;
}

export function PopupApp({ bridge }: { bridge: UiBridge }) {
  const [state, setState] = useState<LoadState>('loading');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<UiSettings | null>(null);
  const [query, setQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<{ id: string; message: string } | null>(null);
  const language = settings?.language ?? DEFAULT_SETTINGS.language;
  const copy = getUiCopy(language).popup;

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = 'Ondrift';
  }, [language]);
  useEffect(() => {
    if (!copyFeedback) return;
    const timeout = window.setTimeout(() => setCopyFeedback(null), COPY_FEEDBACK_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [copyFeedback]);

  async function load() {
    setState('loading');
    try {
      const [nextHistory, nextSettings] = await Promise.all([bridge.getHistory(), bridge.getSettings()]);
      setHistory(nextHistory.sort((a, b) => b.createdAt - a.createdAt));
      setSettings(nextSettings);
      setState('ready');
    } catch { setState('error'); }
  }
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => filterHistory(history, query), [history, query]);
  const usage = useMemo(() => summarizeUsage(history), [history]);

  async function copyImprovedPrompt(item: HistoryItem) {
    if (!item.improvedText) return;
    try {
      await navigator.clipboard.writeText(item.improvedText);
      setCopyFeedback({ id: item.id, message: copy.history.copiedImprovedAria });
    } catch {
      setCopyFeedback({ id: item.id, message: copy.history.copyFailedMessage });
    }
  }

  return <main className="popup-shell">
    <header className="popup-header"><div className="popup-brand"><img className="popup-brand-logo" src="/icons/ondrift-32.png" alt="" /><span>Ondrift</span></div><button className="icon-button" aria-label={copy.headerAria.openSettings} onClick={() => bridge.openOptions()}><Icon name="settings" /></button></header>
    {!settings?.apiKeyConfigured && state !== 'loading' && <button className="setup-banner" onClick={() => bridge.openOptions()}><Icon name="key" /><span><strong>{copy.setupBanner.title}</strong>{copy.setupBanner.body}</span><Icon name="chevron" /></button>}
    {state === 'loading' && <div className="popup-state" role="status"><span className="loader" />{copy.loading}</div>}
    {state === 'error' && <div className="popup-state"><p><strong>{copy.error.title}</strong><br />{copy.error.body}</p><button className="ui-button ui-button--secondary" onClick={load}>{copy.error.retryCta}</button></div>}
    {state === 'ready' && <>
      <section className="usage-strip" aria-label={copy.usage.ariaLabel}>
        <div className="usage-main"><span>{copy.usage.last7Days}</span><strong>{usage.rewritesThisWeek}</strong><small>{copy.usage.rewrites}</small></div>
        <div className="usage-stat"><span>{copy.usage.avgScore}</span><strong>{usage.averageScore ?? '—'}</strong><small>{usage.scoreDelta === null ? copy.usage.noBaseline : copy.usage.pointLift(usage.scoreDelta)}</small></div>
        <div className="usage-stat"><span>{copy.usage.applied}</span><strong>{usage.adoptionRate === null ? '—' : `${usage.adoptionRate}%`}</strong><small>{copy.usage.tokensLabel(usage.totalTokens.toLocaleString(LOCALE_TAGS[language]))}</small></div>
      </section>
      <ScoreTrend scores={usage.dailyScores} copy={copy} />
      <section className="history-section">
        <div className="section-heading"><div><p className="ui-eyebrow">{copy.history.eyebrow}</p><h1>{copy.history.title}</h1></div><span>{history.length}</span></div>
        <label className="search-field"><Icon name="search" /><span className="sr-only">{copy.history.searchSrLabel}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.history.searchPlaceholder} /></label>
        {history.length === 0 && <div className="empty-state"><Icon name="history" /><strong>{copy.history.emptyTitle}</strong><p>{copy.history.emptyBody}</p></div>}
        {history.length > 0 && visible.length === 0 && <div className="empty-state empty-state--compact"><strong>{copy.history.noMatchTitle}</strong><p>{copy.history.noMatchBody}</p></div>}
        <div className="history-list">
          {visible.slice(0, HISTORY_PREVIEW_LIMIT).map((item) => <article className="history-item" key={item.id}>
            <div className="history-meta"><span className={`service-dot service-dot--${item.service}`} />{SERVICE_NAMES[item.service]}<span>·</span><time dateTime={new Date(item.createdAt).toISOString()}>{formatRelativeTime(item.createdAt, undefined, language)}</time>{typeof item.score === 'number' && <span className="score-badge" aria-label={typeof item.previousScore === 'number' ? copy.history.scoreChangeAria(item.previousScore, item.score, item.score - item.previousScore) : `${copy.usage.avgScore} ${item.score}`}>{typeof item.previousScore === 'number' && <><span>{item.previousScore}</span><i aria-hidden="true">→</i></>}<strong>{item.score}</strong>{typeof item.previousScore === 'number' && <small>{item.score - item.previousScore >= 0 ? '+' : ''}{item.score - item.previousScore}</small>}</span>}</div>
            <p>{item.improvedText || item.originalText}</p>
            <div className="history-actions">{item.applied && <span className="applied-label"><Icon name="check" />{copy.history.appliedLabel}</span>}<span className="history-spacer" />{item.improvedText && <button className={copyFeedback?.id === item.id && copyFeedback.message === copy.history.copiedImprovedAria ? 'is-copied' : undefined} aria-label={copyFeedback?.id === item.id ? copyFeedback.message : copy.history.copyImprovedAria} title={copyFeedback?.id === item.id ? copyFeedback.message : copy.history.copyImprovedAria} onClick={() => void copyImprovedPrompt(item)}><Icon name={copyFeedback?.id === item.id && copyFeedback.message === copy.history.copiedImprovedAria ? 'check' : 'copy'} /></button>}{item.sourceUrl && <button aria-label={copy.history.openConversationAria} onClick={() => bridge.openExternal(item.sourceUrl!)}><Icon name="external" /></button>}<button aria-label={copy.history.deleteAria} onClick={async () => { await bridge.deleteHistory(item.id); setHistory((current) => current.filter(({ id }) => id !== item.id)); }}><Icon name="trash" /></button></div>
          </article>)}
        </div>
      </section>
      <span className="sr-only" role="status">{copyFeedback?.message}</span>
    </>}
    <footer><span><i className="privacy-dot" />{copy.footer.storedLabel}</span><button onClick={() => bridge.openOptions()}>{copy.footer.settingsCta}</button></footer>
  </main>;
}
