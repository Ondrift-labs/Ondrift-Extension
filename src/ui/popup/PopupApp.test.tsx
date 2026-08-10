import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type HistoryItem, type UiBridge } from '../shared/contracts';
import { PopupApp } from './PopupApp';

afterEach(cleanup);

const now = Date.now();
const history: HistoryItem[] = [
  { id: '1', service: 'chatgpt', originalText: 'First', improvedText: 'First improved', score: 72, applied: true, createdAt: now - 86_400_000 },
  { id: '2', service: 'claude', originalText: 'Second', improvedText: 'Second improved', score: 84, applied: false, createdAt: now },
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
  it('labels rolling usage accurately and exposes chart values to assistive technology', async () => {
    render(<PopupApp bridge={createBridge()} />);

    expect(await screen.findByRole('region', { name: 'Usage over the last 7 days' })).toBeInTheDocument();
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Average prompt score over the last 7 days.*72.*84/ })).toBeInTheDocument();
  });

  it('renders usage, history, and footer copy in Korean when that is the saved language', async () => {
    render(<PopupApp bridge={createBridge({ getSettings: async () => ({ ...DEFAULT_SETTINGS, apiKeyConfigured: true, language: 'ko' }) })} />);

    expect(await screen.findByRole('region', { name: '최근 7일간 사용량' })).toBeInTheDocument();
    expect(screen.getByText('최근 7일')).toBeInTheDocument();
    expect(screen.getAllByText('적용됨').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('프롬프트 텍스트 검색')).toBeInTheDocument();
    expect(screen.getByText('개인정보 및 설정')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /최근 7일간 평균 프롬프트 점수.*72.*84/ })).toBeInTheDocument();
  });

  it('shows a localized empty state and search placeholder in Japanese with no history', async () => {
    render(<PopupApp bridge={createBridge({ getHistory: async () => [], getSettings: async () => ({ ...DEFAULT_SETTINGS, apiKeyConfigured: true, language: 'ja' }) })} />);

    expect(await screen.findByText('最初のリライトがここに表示されます。')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('プロンプトのテキストを検索')).toBeInTheDocument();
  });
});
