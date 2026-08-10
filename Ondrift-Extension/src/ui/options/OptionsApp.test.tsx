import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type UiBridge } from '../shared/contracts';
import { OptionsApp } from './OptionsApp';

afterEach(cleanup);

function createBridge(overrides: Partial<UiBridge> = {}): UiBridge {
  return {
    getSettings: async () => DEFAULT_SETTINGS,
    saveSettings: vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch })),
    validateApiKey: async () => ({ ok: true }),
    openExternal: vi.fn(),
    getHistory: async () => [],
    deleteHistory: async () => undefined,
    clearHistory: async () => undefined,
    openOptions: vi.fn(),
    ...overrides,
  };
}

describe('OptionsApp localization', () => {
  it('renders persona names, descriptions, and section copy in English by default', async () => {
    render(<OptionsApp bridge={createBridge()} />);

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('Adds technical assumptions, edge cases, and acceptance criteria.')).toBeInTheDocument();
    expect(screen.getByText('Show the rewrite widget on chatgpt.com.')).toBeInTheDocument();
  });

  it('re-renders every visible string in Japanese the instant the language select changes, before saving', async () => {
    const saveSettings = vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    render(<OptionsApp bridge={createBridge({ saveSettings })} />);
    await screen.findByRole('heading', { name: 'Settings' });

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Language' }), '日本語');

    expect(await screen.findByRole('heading', { name: '設定' })).toBeInTheDocument();
    expect(screen.getByText('バランス型')).toBeInTheDocument();
    expect(screen.getByText('技術的な前提、エッジケース、受け入れ基準を追加します。')).toBeInTheDocument();
    expect(saveSettings).not.toHaveBeenCalled();
  });

  it('persists the language only once "Save changes" is clicked', async () => {
    const saveSettings = vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    render(<OptionsApp bridge={createBridge({ saveSettings })} />);
    await screen.findByRole('heading', { name: 'Settings' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Language' }), '한국어');
    await userEvent.click(await screen.findByRole('button', { name: '변경 사항 저장' }));

    expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({ language: 'ko' }));
  });

  it('localizes API key validation errors distinctly from the onboarding wording', async () => {
    const bridge = createBridge({ validateApiKey: async () => ({ ok: false, reason: 'invalid_key' }) });
    render(<OptionsApp bridge={bridge} />);
    await userEvent.type(screen.getByLabelText('API key'), 'bad-key');
    await userEvent.click(screen.getByRole('button', { name: 'Verify & save' }));

    expect(await screen.findByText('Gemini rejected this key. Check that it was copied completely and has API access.')).toBeInTheDocument();
  });
});
