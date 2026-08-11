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

  it('shows a quota warning from real usage on load, without a manual re-verify', async () => {
    const bridge = createBridge({ getSettings: async () => ({ ...DEFAULT_SETTINGS, apiKeyConfigured: true, apiKeyStatus: 'quota' }) });
    render(<OptionsApp bridge={bridge} />);

    expect(await screen.findByText('This key is valid, but its quota is currently exhausted.')).toBeInTheDocument();
  });

  it('prefills the saved model and lets it be re-verified without re-entering the API key', async () => {
    const validateApiKey = vi.fn(async () => ({ ok: true }));
    const bridge = createBridge({
      getSettings: async () => ({ ...DEFAULT_SETTINGS, apiKeyConfigured: true, model: 'gemini-3.5-flash-lite' }),
      validateApiKey,
    });
    render(<OptionsApp bridge={bridge} />);

    const modelSelect = await screen.findByLabelText('Model');
    expect(modelSelect).toHaveValue('gemini-3.5-flash-lite');

    await userEvent.selectOptions(modelSelect, 'gemini-3.6-flash');
    await userEvent.click(screen.getByRole('button', { name: 'Verify & save' }));

    expect(validateApiKey).toHaveBeenCalledWith('gemini', '', 'gemini-3.6-flash');
  });

  it('persists a model change through the main "Save changes" button, without requiring Verify & save', async () => {
    const saveSettings = vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    const bridge = createBridge({ saveSettings });
    render(<OptionsApp bridge={bridge} />);

    await userEvent.selectOptions(await screen.findByLabelText('Model'), 'gemini-3.6-flash-lite');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-3.6-flash-lite' }));
  });

  it('lets a custom model be typed in through the "Other" option', async () => {
    const validateApiKey = vi.fn(async () => ({ ok: true }));
    const bridge = createBridge({ validateApiKey });
    render(<OptionsApp bridge={bridge} />);
    await userEvent.type(screen.getByLabelText('API key'), 'a-key');

    await userEvent.selectOptions(await screen.findByLabelText('Model'), 'Other (enter manually)');
    await userEvent.type(screen.getByLabelText('Other (enter manually)'), 'gemini-experimental');
    await userEvent.click(screen.getByRole('button', { name: 'Verify & save' }));

    expect(validateApiKey).toHaveBeenCalledWith('gemini', 'a-key', 'gemini-experimental');
  });

  it('shows the custom input already filled in when a previously saved model is not in the known list', async () => {
    const bridge = createBridge({
      getSettings: async () => ({ ...DEFAULT_SETTINGS, apiKeyConfigured: true, model: 'gemini-experimental' }),
    });
    render(<OptionsApp bridge={bridge} />);

    const modelSelect = await screen.findByLabelText('Model');
    expect(modelSelect).toHaveValue('__custom__');
    expect(screen.getByLabelText('Other (enter manually)')).toHaveValue('gemini-experimental');
  });

  it('localizes API key validation errors distinctly from the onboarding wording', async () => {
    const bridge = createBridge({ validateApiKey: async () => ({ ok: false, reason: 'invalid_key' }) });
    render(<OptionsApp bridge={bridge} />);
    await userEvent.type(screen.getByLabelText('API key'), 'bad-key');
    await userEvent.click(screen.getByRole('button', { name: 'Verify & save' }));

    expect(await screen.findByText('Gemini rejected this key. Check that it was copied completely and has API access.')).toBeInTheDocument();
  });
});
