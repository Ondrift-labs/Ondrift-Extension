import { describe, expect, it } from 'vitest';
import type { PersonaId, SiteId } from './contracts';
import { getUiCopy, isLanguageId, LANGUAGE_NAMES, SUPPORTED_LANGUAGES, uiCopy } from './i18n';

const PERSONA_IDS: readonly PersonaId[] = ['general', 'developer', 'writer', 'student', 'translator'];
const SITE_IDS: readonly SiteId[] = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok'];

function collectStrings(value: unknown, path: string, out: Array<[string, unknown]>): void {
  if (typeof value === 'function') return;
  if (typeof value === 'string' || typeof value === 'number') { out.push([path, value]); return; }
  if (Array.isArray(value)) { value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, out)); return; }
  if (value && typeof value === 'object') { for (const [key, nested] of Object.entries(value)) collectStrings(nested, `${path}.${key}`, out); }
}

describe('uiCopy', () => {
  it('provides Korean, English, Japanese, and Simplified Chinese translations with the same shape', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['ko', 'en', 'ja', 'zh']);
    const shapes = SUPPORTED_LANGUAGES.map((language) => {
      const paths: Array<[string, unknown]> = [];
      collectStrings(uiCopy[language], language, paths);
      return paths.map(([path]) => path.slice(path.indexOf('.'))).sort();
    });
    expect(shapes[1]).toEqual(shapes[0]);
    expect(shapes[2]).toEqual(shapes[0]);
    expect(shapes[3]).toEqual(shapes[0]);
  });

  it('never leaves an empty or unresolved string anywhere in a translation table', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const paths: Array<[string, unknown]> = [];
      collectStrings(uiCopy[language], language, paths);
      for (const [path, value] of paths) {
        expect(String(value).trim(), `${path} should not be empty`).not.toBe('');
      }
    }
  });

  it('covers every persona and site id used by the options surface', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const copy = uiCopy[language].options;
      for (const id of PERSONA_IDS) expect(copy.persona.personas[id].name).toBeTruthy();
      for (const id of SITE_IDS) expect(copy.sites.sites[id].title).toBeTruthy();
    }
  });

  it('falls back to English for an unknown or missing language', () => {
    expect(getUiCopy(undefined)).toBe(uiCopy.en);
    expect(getUiCopy('fr' as never)).toBe(uiCopy.en);
  });

  it('validates language ids with the isLanguageId guard', () => {
    expect(isLanguageId('ko')).toBe(true);
    expect(isLanguageId('ja')).toBe(true);
    expect(isLanguageId('zh')).toBe(true);
    expect(isLanguageId('fr')).toBe(false);
    expect(isLanguageId(undefined)).toBe(false);
  });

  it('shows each language using its own native name, regardless of active language', () => {
    expect(LANGUAGE_NAMES).toEqual({ ko: '한국어', en: 'English', ja: '日本語', zh: '简体中文' });
  });

  it('formats parameterized copy per language without leaking placeholder syntax', () => {
    expect(uiCopy.en.onboarding.stepCount(2, 3)).toBe('Step 2 of 3');
    expect(uiCopy.ko.onboarding.stepCount(2, 3)).toContain('2');
    expect(uiCopy.ja.onboarding.stepCount(2, 3)).toContain('2');
    expect(uiCopy.zh.onboarding.stepCount(2, 3)).toContain('2');
    for (const language of SUPPORTED_LANGUAGES) {
      expect(uiCopy[language].onboarding.stepCount(2, 3)).not.toMatch(/\{|\}/);
      expect(uiCopy[language].popup.usage.pointLift(5)).toContain('5');
      expect(uiCopy[language].popup.usage.tokensLabel('1,234')).toContain('1,234');
      expect(uiCopy[language].popup.trend.ariaLabel('x')).toContain('x');
    }
  });
});
