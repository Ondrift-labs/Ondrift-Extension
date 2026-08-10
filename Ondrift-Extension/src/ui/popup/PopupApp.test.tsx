import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type HistoryItem, type UiBridge } from '../shared/contracts';
import { PopupApp } from './PopupApp';

const now = Date.now();
const history: HistoryItem[] = [
  { id: '1', service: 'chatgpt', originalText: 'First', improvedText: 'First improved', score: 72, applied: true, createdAt: now - 86_400_000 },
  { id: '2', service: 'claude', originalText: 'Second', improvedText: 'Second improved', score: 84, applied: false, createdAt: now },
];

function createBridge(): UiBridge {
  return {
    getSettings: async () => ({ ...DEFAULT_SETTINGS, apiKeyConfigured: true }),
    saveSettings: async () => DEFAULT_SETTINGS,
    validateApiKey: async () => ({ ok: true }),
    openExternal: vi.fn(),
    getHistory: async () => history,
    deleteHistory: async () => undefined,
    clearHistory: async () => undefined,
    openOptions: vi.fn(),
  };
}

describe('PopupApp', () => {
  it('labels rolling usage accurately and exposes chart values to assistive technology', async () => {
    render(<PopupApp bridge={createBridge()} />);

    expect(await screen.findByRole('region', { name: 'Usage over the last 7 days' })).toBeInTheDocument();
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Average prompt score over the last 7 days.*72.*84/ })).toBeInTheDocument();
  });
});
