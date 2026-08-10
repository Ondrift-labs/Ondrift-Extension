import { useEffect, useMemo, useState } from 'react';
import type { HistoryItem, UiBridge, UiSettings } from '../shared/contracts';
import { filterHistory, formatRelativeTime, summarizeUsage } from '../shared/format';
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

function ScoreTrend({ scores }: { scores: Array<{ date: string; score: number }> }) {
  if (scores.length < 2) return <div className="trend-empty">A score trend appears after two days of rewrites.</div>;
  const points = scores.slice(-7);
  const width = 260;
  const height = 46;
  const plot = points.map((item, index) => `${index / (points.length - 1) * width},${height - item.score / 100 * height}`).join(' ');
  const summary = points.map(({ date, score }) => `${date}: ${score}`).join(', ');
  return <svg className="trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Average prompt score over the last 7 days. ${summary}`}><path d={`M0 ${height * .5}H${width}`} /><polyline points={plot} /><circle cx={plot.split(' ').at(-1)?.split(',')[0]} cy={plot.split(' ').at(-1)?.split(',')[1]} r="3" /></svg>;
}

export function PopupApp({ bridge }: { bridge: UiBridge }) {
  const [state, setState] = useState<LoadState>('loading');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<UiSettings | null>(null);
  const [query, setQuery] = useState('');

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

  return <main className="popup-shell">
    <header className="popup-header"><div className="popup-brand"><span className="brand-mark">O</span><span>Ondrift</span></div><button className="icon-button" aria-label="Open settings" onClick={() => bridge.openOptions()}><Icon name="settings" /></button></header>
    {!settings?.apiKeyConfigured && state !== 'loading' && <button className="setup-banner" onClick={() => bridge.openOptions()}><Icon name="key" /><span><strong>Finish setup</strong>Add a Gemini API key to start rewriting.</span><Icon name="chevron" /></button>}
    {state === 'loading' && <div className="popup-state" role="status"><span className="loader" />Loading your local history…</div>}
    {state === 'error' && <div className="popup-state"><p><strong>History is unavailable.</strong><br />Your data is still local and unchanged.</p><button className="ui-button ui-button--secondary" onClick={load}>Try again</button></div>}
    {state === 'ready' && <>
      <section className="usage-strip" aria-label="Usage over the last 7 days">
        <div className="usage-main"><span>Last 7 days</span><strong>{usage.rewritesThisWeek}</strong><small>rewrites</small></div>
        <div className="usage-stat"><span>Avg. score</span><strong>{usage.averageScore ?? '—'}</strong><small>{usage.scoreDelta === null ? 'No baseline yet' : `${usage.scoreDelta >= 0 ? '+' : ''}${usage.scoreDelta} point lift`}</small></div>
        <div className="usage-stat"><span>Applied</span><strong>{usage.adoptionRate === null ? '—' : `${usage.adoptionRate}%`}</strong><small>{usage.totalTokens.toLocaleString()} tokens</small></div>
      </section>
      <ScoreTrend scores={usage.dailyScores} />
      <section className="history-section">
        <div className="section-heading"><div><p className="ui-eyebrow">Local history</p><h1>Recent prompts</h1></div><span>{history.length}</span></div>
        <label className="search-field"><Icon name="search" /><span className="sr-only">Search prompts</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prompt text" /></label>
        {history.length === 0 && <div className="empty-state"><Icon name="history" /><strong>Your first rewrite will appear here.</strong><p>History stays in this browser, ready to search and revisit.</p></div>}
        {history.length > 0 && visible.length === 0 && <div className="empty-state empty-state--compact"><strong>No matching prompts</strong><p>Try a different word or service name.</p></div>}
        <div className="history-list">
          {visible.slice(0, 12).map((item) => <article className="history-item" key={item.id}>
            <div className="history-meta"><span className={`service-dot service-dot--${item.service}`} />{SERVICE_NAMES[item.service]}<span>·</span><time dateTime={new Date(item.createdAt).toISOString()}>{formatRelativeTime(item.createdAt)}</time><span className="score-badge">{item.score}</span></div>
            <p>{item.improvedText || item.originalText}</p>
            <div className="history-actions">{item.applied && <span className="applied-label"><Icon name="check" />Applied</span>}<span className="history-spacer" />{item.sourceUrl && <button aria-label="Open conversation" onClick={() => bridge.openExternal(item.sourceUrl!)}><Icon name="external" /></button>}<button aria-label="Delete from local history" onClick={async () => { await bridge.deleteHistory(item.id); setHistory((current) => current.filter(({ id }) => id !== item.id)); }}><Icon name="trash" /></button></div>
          </article>)}
        </div>
      </section>
    </>}
    <footer><span><i className="privacy-dot" />Stored on this device</span><button onClick={() => bridge.openOptions()}>Privacy & settings</button></footer>
  </main>;
}
