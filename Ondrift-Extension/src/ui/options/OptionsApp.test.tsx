import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type UiBridge, type UiSettings } from '../shared/contracts';
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

  it('re-renders every visible string in Japanese the instant the language select changes', async () => {
    render(<OptionsApp bridge={createBridge()} />);
    await screen.findByRole('heading', { name: 'Settings' });

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Language' }), '日本語');

    expect(await screen.findByRole('heading', { name: '設定' })).toBeInTheDocument();
    expect(screen.getByText('バランス型')).toBeInTheDocument();
    expect(screen.getByText('技術的な前提、エッジケース、受け入れ基準を追加します。')).toBeInTheDocument();
  });

  it('automatically persists a language change and shows a localized toast', async () => {
    const saveSettings = vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    render(<OptionsApp bridge={createBridge({ saveSettings })} />);
    await screen.findByRole('heading', { name: 'Settings' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Language' }), '한국어');

    await waitFor(() => expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({ language: 'ko' })));
    expect(await screen.findByRole('status')).toHaveTextContent('자동 저장 완료');
  });

  it('warns before leaving only while editable settings have unsaved changes', async () => {
    // Model this with a save that hasn't resolved yet, not a delay: since a discrete pick now
    // saves with no artificial debounce, the in-flight request -- not a timer -- is what makes
    // the settings briefly "dirty" here.
    let resolveSave: (value: UiSettings) => void = () => undefined;
    const saveSettings = vi.fn(() => new Promise<UiSettings>((resolve) => { resolveSave = resolve; }));
    render(<OptionsApp bridge={createBridge({ saveSettings })} />);
    const languageSelect = await screen.findByRole('combobox', { name: 'Language' });

    const unchangedEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unchangedEvent);
    expect(unchangedEvent.defaultPrevented).toBe(false);

    await userEvent.selectOptions(languageSelect, '한국어');
    const dirtyEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);

    resolveSave({ ...DEFAULT_SETTINGS, language: 'ko' });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('자동 저장 완료'));
    const savedEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(savedEvent);
    expect(savedEvent.defaultPrevented).toBe(false);
  });

  it('warns when an API key has been entered but not verified', async () => {
    render(<OptionsApp bridge={createBridge()} />);
    await userEvent.type(await screen.findByLabelText('API key'), 'unverified-key');

    const dirtyEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyEvent);

    expect(dirtyEvent.defaultPrevented).toBe(true);
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

  it('automatically persists a model change without requiring Verify & save', async () => {
    const saveSettings = vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    const bridge = createBridge({ saveSettings });
    render(<OptionsApp bridge={bridge} />);

    await userEvent.selectOptions(await screen.findByLabelText('Model'), 'gemini-3.6-flash-lite');

    await waitFor(() => expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-3.6-flash-lite' })));
  });

  it('saves a model pick immediately, with no debounce delay, unlike typing a custom model', async () => {
    const saveSettings = vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    const bridge = createBridge({ saveSettings });
    render(<OptionsApp bridge={bridge} />);

    await userEvent.selectOptions(await screen.findByLabelText('Model'), 'gemini-3.6-flash-lite');

    // No `waitFor`/timer advance: a select is a one-shot decision, so it must already have
    // been saved by the time this microtask runs -- unlike free-text typing, which debounces.
    expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-3.6-flash-lite' }));
  });

  it('switches back to a preset model without reverting to "Other" on the next load, even if the tab is refreshed right away', async () => {
    let stored: UiSettings = { ...DEFAULT_SETTINGS };
    const bridge: UiBridge = {
      ...createBridge(),
      getSettings: async () => ({ ...stored }),
      saveSettings: async (patch) => { stored = { ...stored, ...patch }; return { ...stored }; },
    };

    const r1 = render(<OptionsApp bridge={bridge} />);
    await userEvent.selectOptions(await screen.findByLabelText('Model'), 'Other (enter manually)');
    await userEvent.type(screen.getByLabelText('Other (enter manually)'), 'gemini-experimental');
    await waitFor(() => expect(stored.model).toBe('gemini-experimental'));
    r1.unmount();

    const r2 = render(<OptionsApp bridge={bridge} />);
    const modelSelect = await screen.findByLabelText('Model');
    expect(modelSelect).toHaveValue('__custom__');

    await userEvent.selectOptions(modelSelect, 'gemini-3.6-flash');
    // Simulate refreshing right away, before any debounce window would have elapsed.
    r2.unmount();

    expect(stored.model).toBe('gemini-3.6-flash');
    render(<OptionsApp bridge={bridge} />);
    expect(await screen.findByLabelText('Model')).toHaveValue('gemini-3.6-flash');
  });

  it('switches back to Default without reverting to the old preset on the next load, even if the tab is refreshed right away', async () => {
    let stored: UiSettings = { ...DEFAULT_SETTINGS };
    const bridge: UiBridge = {
      ...createBridge(),
      getSettings: async () => ({ ...stored }),
      saveSettings: async (patch) => { stored = { ...stored, ...patch }; return { ...stored }; },
    };

    const r1 = render(<OptionsApp bridge={bridge} />);
    await userEvent.selectOptions(await screen.findByLabelText('Model'), 'gemini-3.6-flash');
    await waitFor(() => expect(stored.model).toBe('gemini-3.6-flash'));
    r1.unmount();

    const r2 = render(<OptionsApp bridge={bridge} />);
    const modelSelect = await screen.findByLabelText('Model');
    expect(modelSelect).toHaveValue('gemini-3.6-flash');

    await userEvent.selectOptions(modelSelect, 'Default (automatic fallback)');
    // Simulate refreshing right away, before any debounce window would have elapsed.
    r2.unmount();

    expect(stored.model).toBeUndefined();
    render(<OptionsApp bridge={bridge} />);
    expect(await screen.findByLabelText('Model')).toHaveValue('');
  });

  it('persists two quick consecutive model picks in the order they were made, even if the saves resolve out of order', async () => {
    let stored: UiSettings = { ...DEFAULT_SETTINGS };
    let callIndex = 0;
    const bridge: UiBridge = {
      ...createBridge(),
      getSettings: async () => ({ ...stored }),
      // The first save (picking the preset) resolves slower than the second (picking
      // Default back), simulating two overlapping round trips completing out of order.
      saveSettings: async (patch) => {
        const isFirstCall = ++callIndex === 1;
        await new Promise((resolve) => setTimeout(resolve, isFirstCall ? 40 : 0));
        stored = { ...stored, ...patch };
        return { ...stored };
      },
    };

    render(<OptionsApp bridge={bridge} />);
    const modelSelect = await screen.findByLabelText('Model');

    await userEvent.selectOptions(modelSelect, 'gemini-3.6-flash');
    await userEvent.selectOptions(modelSelect, 'Default (automatic fallback)');

    await waitFor(() => expect(stored.model).toBeUndefined());
  });

  it('does not auto-save an unverified API key', async () => {
    const saveSettings = vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    render(<OptionsApp bridge={createBridge({ saveSettings })} />);

    await userEvent.type(await screen.findByLabelText('API key'), 'unverified-key');
    await new Promise((resolve) => window.setTimeout(resolve, 800));

    expect(saveSettings).not.toHaveBeenCalled();
  });

  it('flushes a pending settings change as soon as the tab becomes hidden', async () => {
    const saveSettings = vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    render(<OptionsApp bridge={createBridge({ saveSettings })} />);
    await userEvent.selectOptions(await screen.findByLabelText('Model'), 'gemini-3.6-flash');
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });

    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-3.6-flash' })));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });

  it('keeps an accessible error toast visible and retries a failed auto-save', async () => {
    const saveSettings = vi.fn()
      .mockRejectedValueOnce(new Error('storage unavailable'))
      .mockImplementation(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    render(<OptionsApp bridge={createBridge({ saveSettings })} />);

    await userEvent.selectOptions(await screen.findByLabelText('Language'), '日本語');
    expect(await screen.findByRole('alert')).toHaveTextContent('自動保存に失敗しました');
    await userEvent.click(screen.getByRole('button', { name: '再試行' }));

    await waitFor(() => expect(saveSettings).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('status')).toHaveTextContent('自動保存しました');
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

  it('opens the GitHub repo when the "Star on GitHub" button is clicked', async () => {
    const openExternal = vi.fn();
    render(<OptionsApp bridge={createBridge({ openExternal })} />);
    await userEvent.click(await screen.findByRole('button', { name: /Star on GitHub/ }));

    expect(openExternal).toHaveBeenCalledWith('https://github.com/Ondrift-labs/Ondrift-Extension');
  });

  it('localizes API key validation errors distinctly from the onboarding wording', async () => {
    const bridge = createBridge({ validateApiKey: async () => ({ ok: false, reason: 'invalid_key' }) });
    render(<OptionsApp bridge={bridge} />);
    await userEvent.type(screen.getByLabelText('API key'), 'bad-key');
    await userEvent.click(screen.getByRole('button', { name: 'Verify & save' }));

    expect(await screen.findByText('Gemini rejected this key. Check that it was copied completely and has API access.')).toBeInTheDocument();
  });
});
