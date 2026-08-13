import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type UiBridge } from '../shared/contracts';
import { OnboardingApp } from './OnboardingApp';

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

describe('OnboardingApp localization', () => {
  it('renders English copy and an immediately accessible language selector on the very first screen', async () => {
    render(<OnboardingApp bridge={createBridge()} />);

    expect(await screen.findByRole('heading', { name: 'Bring better instructions to every conversation.' })).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Choose interface language' })).toBeInTheDocument();
  });

  it('switches every visible string to Korean immediately and persists the choice', async () => {
    const saveSettings = vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    const bridge = createBridge({ saveSettings });
    render(<OnboardingApp bridge={bridge} />);
    await screen.findByRole('combobox', { name: 'Choose interface language' });

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Choose interface language' }), '한국어');

    expect(await screen.findByRole('heading', { name: '모든 대화에 더 나은 지시를 더하세요.' })).toBeInTheDocument();
    expect(screen.getByText('3단계 중 1단계')).toBeInTheDocument();
    expect(saveSettings).toHaveBeenCalledWith({ language: 'ko' });
  });

  it('switches to Japanese and back to English, updating the heading each time', async () => {
    render(<OnboardingApp bridge={createBridge()} />);
    const select = await screen.findByRole('combobox', { name: 'Choose interface language' });

    await userEvent.selectOptions(select, '日本語');
    expect(await screen.findByRole('heading', { name: 'すべての会話に、より良い指示を。' })).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole('combobox'), 'English');
    expect(await screen.findByRole('heading', { name: 'Bring better instructions to every conversation.' })).toBeInTheDocument();
  });

  it('switches to Simplified Chinese and persists the choice', async () => {
    const saveSettings = vi.fn(async (patch) => ({ ...DEFAULT_SETTINGS, ...patch }));
    render(<OnboardingApp bridge={createBridge({ saveSettings })} />);
    const select = await screen.findByRole('combobox', { name: 'Choose interface language' });

    await userEvent.selectOptions(select, '简体中文');

    expect(await screen.findByRole('heading', { name: '为每一次对话带来更好的指令。' })).toBeInTheDocument();
    expect(saveSettings).toHaveBeenCalledWith({ language: 'zh' });
  });

  it('hydrates the selector from a previously persisted language on mount', async () => {
    const bridge = createBridge({ getSettings: async () => ({ ...DEFAULT_SETTINGS, language: 'ja' }) });
    render(<OnboardingApp bridge={bridge} />);

    expect(await screen.findByRole('heading', { name: 'すべての会話に、より良い指示を。' })).toBeInTheDocument();
  });

  it('localizes API key validation errors', async () => {
    const bridge = createBridge({ validateApiKey: async () => ({ ok: false, reason: 'invalid_key' }) });
    render(<OnboardingApp bridge={bridge} />);
    await userEvent.click(screen.getByRole('button', { name: /Set up Gemini/ }));
    await userEvent.type(screen.getByLabelText('Paste and verify it here'), 'bad-key');
    await userEvent.click(screen.getByRole('button', { name: 'Verify key' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That key was not accepted. Copy the full key from Google AI Studio and try again.');
  });

  it('shows the AI Studio screenshots by default, but lets a developer hide them and bring them back', async () => {
    render(<OnboardingApp bridge={createBridge()} />);
    await userEvent.click(screen.getByRole('button', { name: /Set up Gemini/ }));

    expect(screen.getByAltText('Google AI Studio’s API Keys screen, with the “Create API key” button in the top right.')).toBeInTheDocument();
    expect(screen.getByAltText('The “Create a new key” dialog for choosing a project.')).toBeInTheDocument();
    expect(screen.getByAltText('The generated API key listed on the API Keys screen.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Developer? Hide the screenshots' }));
    expect(screen.queryByAltText('Google AI Studio’s API Keys screen, with the “Create API key” button in the top right.')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show the screenshots again' }));
    expect(screen.getByAltText('Google AI Studio’s API Keys screen, with the “Create API key” button in the top right.')).toBeInTheDocument();
  });
});
