import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type HistoryItem, type UiBridge } from '../shared/contracts';
import { PopupApp } from './PopupApp';

afterEach(cleanup);

const now = Date.now();
const history: HistoryItem[] = [
  { id: '1', service: 'chatgpt', originalText: 'First', improvedText: 'First improved', previousScore: 40, score: 72, applied: true, createdAt: now - 86_400_000 },
  { id: '2', service: 'claude', originalText: 'Second', improvedText: 'Second improved', previousScore: 60, score: 84, applied: false, createdAt: now },
];

function createBridge(overrides: Partial<UiBridge> = {}): UiBridge {
  return {
    getSettings: async () => ({ ...DEFAULT_SETTINGS, apiKeyConfigured: true }),
    saveSettings: async () => DEFAULT_SETTINGS,
    validateApiKey: async () => ({ ok: true }),
    openExternal: vi.fn(),
    getHistory: async () => history,
    deleteHistory: async () => undefined,
    clearHistory: async () => undefined,
    openOptions: vi.fn(),
    ...overrides,
  };
}

describe('PopupApp', () => {
  it('renders the Ondrift image logo in the popup header', () => {
    const { container } = render(<PopupApp bridge={createBridge()} />);

    expect(container.querySelector<HTMLImageElement>('.popup-brand-logo')?.getAttribute('src')).toBe('/icons/ondrift-32.png');
  });

  it('labels rolling usage accurately and exposes chart values to assistive technology', async () => {
    render(<PopupApp bridge={createBridge()} />);

    expect(await screen.findByRole('region', { name: 'Usage over the last 7 days' })).toBeInTheDocument();
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Average improved prompt score over the last 7 days.*72.*84/ })).toBeInTheDocument();
  });

  it('renders usage, history, and footer copy in Korean when that is the saved language', async () => {
    render(<PopupApp bridge={createBridge({ getSettings: async () => ({ ...DEFAULT_SETTINGS, apiKeyConfigured: true, language: 'ko' }) })} />);

    expect(await screen.findByRole('region', { name: '최근 7일간 사용량' })).toBeInTheDocument();
    expect(screen.getByText('최근 7일')).toBeInTheDocument();
    expect(screen.getAllByText('적용됨').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('프롬프트 텍스트 검색')).toBeInTheDocument();
    expect(screen.getByText('개인정보 및 설정')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /최근 7일간 개선 후 평균 프롬프트 점수.*72.*84/ })).toBeInTheDocument();
  });

  it('shows a localized empty state and search placeholder in Japanese with no history', async () => {
    render(<PopupApp bridge={createBridge({ getHistory: async () => [], getSettings: async () => ({ ...DEFAULT_SETTINGS, apiKeyConfigured: true, language: 'ja' }) })} />);

    expect(await screen.findByText('最初のリライトがここに表示されます。')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('プロンプトのテキストを検索')).toBeInTheDocument();
  });

  it('copies only the prompt improved by Ondrift', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const plainHistory: HistoryItem = { id: '3', service: 'chatgpt', originalText: 'Not rewritten', applied: false, createdAt: now + 1 };
    render(<PopupApp bridge={createBridge({ getHistory: async () => [...history, plainHistory] })} />);

    const copyButtons = await screen.findAllByRole('button', { name: 'Copy improved prompt' });
    expect(copyButtons).toHaveLength(2);
    await userEvent.click(copyButtons[0]);

    expect(writeText).toHaveBeenCalledWith('Second improved');
    expect(screen.getByRole('status')).toHaveTextContent('Improved prompt copied');
  });

  it('shows original to improved score and omits a badge for unscored prompts', async () => {
    const plainHistory: HistoryItem = { id: '3', service: 'chatgpt', originalText: 'Not rewritten', applied: false, createdAt: now + 1 };
    render(<PopupApp bridge={createBridge({ getHistory: async () => [...history, plainHistory] })} />);

    expect(await screen.findByLabelText('Original score 60, improved score 84, 24 points higher')).toHaveTextContent('60→84+24');
    expect(document.querySelectorAll('.score-badge')).toHaveLength(2);
  });
});
