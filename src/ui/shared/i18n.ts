import type { LanguageId, PersonaId, SiteId } from './contracts';
import type { GeminiModelId } from '../../shared/models';

/** BCP-47 locale tags used for Intl formatting (dates, numbers, relative time). */
export const LOCALE_TAGS: Record<LanguageId, string> = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP' };

/** Each language's own name for itself, shown identically regardless of the active UI language. */
export const LANGUAGE_NAMES: Record<LanguageId, string> = { ko: '한국어', en: 'English', ja: '日本語' };

export const SUPPORTED_LANGUAGES: readonly LanguageId[] = ['ko', 'en', 'ja'];

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function normalizeLanguage(value: string | undefined): LanguageId {
  const base = value?.toLowerCase().split('-')[0];
  return isLanguageId(base) ? base : 'en';
}

export interface ApiKeyValidationCopy {
  invalid_key: string;
  quota: string;
  network: string;
  request: string;
  unavailable: string;
  unknown: string;
}

export interface CommonCopy {
  brandHomeAria: string;
  back: string;
  checking: string;
  saving: string;
  languageLabel: string;
  settingsLoading: string;
  settingsLoadErrorTitle: string;
  settingsLoadErrorBody: string;
}

export interface OnboardingCopy {
  stepCount(step: number, total: number): string;
  languageSelectorAria: string;
  intro: {
    eyebrow: string;
    title: string;
    lead: string;
    promises: Array<{ title: string; body: string }>;
    cta: string;
  };
  key: {
    eyebrow: string;
    title: string;
    step1Title: string;
    step1Body: string;
    step1Cta: string;
    step2Title: string;
    step2Body: string;
    step3Label: string;
    step3Placeholder: string;
    verifyCta: string;
    step3Help: string;
    keySuccess: string;
    validation: ApiKeyValidationCopy;
    continueCta: string;
  };
  privacy: {
    eyebrow: string;
    title: string;
    routeAria: string;
    routePrompt: { title: string; detail: string };
    routeApi: { title: string; detail: string };
    routeHistory: { title: string; detail: string };
    notes: Array<{ lead: string; rest: string }>;
    consentLabel: string;
    enableCta: string;
  };
  complete: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
  };
  footer: string;
}

export interface OptionsCopy {
  sidebar: {
    nav: { provider: string; persona: string; sites: string; privacy: string };
    version: string;
  };
  header: { eyebrow: string; title: string; lead: string };
  provider: {
    sectionTitle: string;
    sectionLead: string;
    providerLabel: string;
    providerGemini: string;
    providerOpenAi: string;
    providerClaude: string;
    apiKeyLabel: string;
    apiKeyPlaceholderSaved: string;
    apiKeyPlaceholderEmpty: string;
    verifyCta: string;
    apiKeyHelp: string;
    getKeyCta: string;
    keySuccess: string;
    modelLabel: string;
    modelHelp: string;
    modelAutoLabel: string;
    modelOptionLabels: Record<GeminiModelId, string>;
    validation: ApiKeyValidationCopy;
  };
  persona: {
    sectionTitle: string;
    sectionLead: string;
    languageLabel: string;
    languageHelp: string;
    personas: Record<PersonaId, { name: string; description: string }>;
  };
  sites: {
    sectionTitle: string;
    sectionLead: string;
    sites: Record<SiteId, { title: string; detail: string }>;
  };
  privacy: {
    sectionTitle: string;
    sectionLead: string;
    historyToggleTitle: string;
    historyToggleDetail: string;
    responsesTitle: string;
    responsesDetail: string;
    alwaysOn: string;
    deleteTitle: string;
    deleteDetail: string;
    cancelCta: string;
    deleteAllCta: string;
    clearHistoryCta: string;
  };
  saveBar: { saved: string; error: string; idle: string; saveCta: string };
}

export interface PopupCopy {
  headerAria: { openSettings: string };
  setupBanner: { title: string; body: string };
  loading: string;
  error: { title: string; body: string; retryCta: string };
  usage: {
    ariaLabel: string;
    last7Days: string;
    rewrites: string;
    avgScore: string;
    noBaseline: string;
    pointLift(delta: number): string;
    applied: string;
    tokensLabel(count: string): string;
  };
  trend: {
    emptyMessage: string;
    ariaLabel(summary: string): string;
  };
  history: {
    eyebrow: string;
    title: string;
    searchSrLabel: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptyBody: string;
    noMatchTitle: string;
    noMatchBody: string;
    appliedLabel: string;
    openConversationAria: string;
    deleteAria: string;
  };
  footer: { storedLabel: string; settingsCta: string };
}

export interface UiCopy {
  common: CommonCopy;
  onboarding: OnboardingCopy;
  options: OptionsCopy;
  popup: PopupCopy;
}

export const uiCopy: Record<LanguageId, UiCopy> = {
  ko: {
    common: {
      brandHomeAria: 'Ondrift 홈',
      back: '뒤로',
      checking: '확인 중…',
      saving: '저장 중…',
      languageLabel: '언어',
      settingsLoading: 'Ondrift 설정을 불러오는 중…',
      settingsLoadErrorTitle: 'Ondrift 설정을 불러오지 못했습니다',
      settingsLoadErrorBody: '이 페이지를 새로고침하세요. 로컬 설정과 기록은 변경되지 않았습니다.',
    },
    onboarding: {
      stepCount: (step, total) => `${total}단계 중 ${step}단계`,
      languageSelectorAria: '인터페이스 언어 선택',
      intro: {
        eyebrow: '보내기 전, 더 명확한 프롬프트',
        title: '모든 대화에 더 나은 지시를 더하세요.',
        lead: 'Ondrift는 ChatGPT, Claude, Gemini, Perplexity의 입력창 옆에 나타납니다. 초안을 채점하고 부족한 부분을 설명하며, 한 번의 클릭으로 적용할 수 있는 다시 쓰기를 제안합니다.',
        promises: [
          { title: '이미 사용하는 곳에서 그대로', body: '지원되는 AI 사이트 전체에서 동일한 워크플로를 사용하세요.' },
          { title: '내 키는 내 브라우저에만', body: 'Gemini API 키는 브라우저 로컬 저장소에만 보관됩니다.' },
          { title: '별도 서버 없음', body: '프롬프트는 Gemini로 직접 전송되며 기록은 이 기기에만 남습니다.' },
        ],
        cta: 'Gemini 설정하기',
      },
      key: {
        eyebrow: 'Gemini 연결',
        title: '세 단계로 키를 발급받으세요.',
        step1Title: 'Google AI Studio 열기',
        step1Body: 'Google 계정으로 로그인하세요. Gemini 사용량 한도는 Google이 관리합니다.',
        step1Cta: 'AI Studio 열기',
        step2Title: 'API 키 만들기',
        step2Body: '“API 키 만들기”를 선택하고 프로젝트를 고른 다음 생성된 값을 복사하세요.',
        step3Label: '여기에 붙여넣고 확인하세요',
        step3Placeholder: 'AIza…',
        verifyCta: '키 확인',
        step3Help: '확인 과정에서 작은 테스트 요청 한 건이 전송됩니다. 키는 Ondrift로 전송되지 않습니다.',
        keySuccess: '키가 확인되었습니다. 이제 개인정보 설정으로 이동하세요.',
        validation: {
          invalid_key: '이 키는 승인되지 않았습니다. Google AI Studio에서 전체 키를 복사해 다시 시도해 주세요.',
          quota: '키는 정상이지만 현재 할당량을 모두 사용했습니다. 프로젝트 할당량을 확인하거나 내일 다시 시도해 주세요.',
          network: 'Chrome에서 Gemini에 연결하지 못했습니다. 브라우저, VPN 또는 방화벽 설정을 확인한 뒤 다시 시도해 주세요.',
          request: 'Gemini가 확인 요청을 거부했습니다. Ondrift를 새로고침하고 다시 시도해 주세요.',
          unavailable: '이 프로젝트에서는 Gemini를 잠시 사용할 수 없습니다. Ondrift가 호환 대체 모델도 시도했습니다.',
          unknown: '이 키를 확인할 수 없습니다. 저장되지 않았으니 다시 시도해 주세요.',
        },
        continueCta: '계속',
      },
      privacy: {
        eyebrow: '개인정보 선택',
        title: '기본은 로컬 저장, 선택은 명확하게.',
        routeAria: '데이터가 이동하는 방식',
        routePrompt: { title: '내 프롬프트', detail: '지원되는 AI 사이트' },
        routeApi: { title: 'Gemini API', detail: '내 키로 요청' },
        routeHistory: { title: '로컬 기록', detail: '이 브라우저에만 저장' },
        notes: [
          { lead: 'Ondrift가 읽는 정보:', rest: ' 다시 쓰기를 요청한 텍스트, 지원 사이트, 점수, 제안 적용 여부입니다.' },
          { lead: 'Ondrift가 수집하지 않는 정보:', rest: ' AI 응답 본문, 브라우징 기록, 지원되지 않는 사이트의 데이터입니다.' },
          { lead: '모든 선택은 사용자에게 있습니다.', rest: ' 언제든 설정에서 사이트를 끄거나 기록 저장을 중지하거나 로컬 기록을 삭제할 수 있습니다.' },
        ],
        consentLabel: '프롬프트 텍스트 처리 방식을 이해했으며, 지원되는 사이트에서 Ondrift를 사용하는 데 동의합니다.',
        enableCta: 'Ondrift 사용하기',
      },
      complete: {
        eyebrow: '설정 완료',
        title: '이제 시작할 준비가 되었습니다.',
        body: 'ChatGPT, Claude, Gemini, Perplexity를 열고 프롬프트를 작성해 보세요. 개선할 부분이 있으면 Ondrift가 입력창 옆에 나타납니다.',
        cta: 'ChatGPT 열기',
      },
      footer: '비공개, 로컬 저장, 언제든 되돌릴 수 있습니다. Ondrift 계정이 필요하지 않습니다.',
    },
    options: {
      sidebar: {
        nav: { provider: '제공자', persona: '다시 쓰기 스타일', sites: '사이트', privacy: '개인정보' },
        version: '버전 0.1 · 무료 MVP',
      },
      header: { eyebrow: '확장 프로그램 환경설정', title: '설정', lead: 'Ondrift가 어떻게 다시 쓰고 브라우저에 무엇을 남길지 선택하세요.' },
      provider: {
        sectionTitle: '제공자 및 API 키',
        sectionLead: '다시 쓰기 요청은 확장 프로그램에서 선택한 제공자로 직접 전송됩니다.',
        providerLabel: '제공자',
        providerGemini: 'Google Gemini · 권장',
        providerOpenAi: 'OpenAI · 추후 지원',
        providerClaude: 'Anthropic Claude · 추후 지원',
        apiKeyLabel: 'API 키',
        apiKeyPlaceholderSaved: '키 저장됨 · 교체할 키 입력',
        apiKeyPlaceholderEmpty: 'Gemini API 키를 붙여넣으세요',
        verifyCta: '확인 및 저장',
        apiKeyHelp: 'chrome.storage.local에만 저장되며 동기화 저장소는 사용하지 않습니다.',
        getKeyCta: '키 발급받기',
        keySuccess: '키가 확인되어 사용할 준비가 되었습니다.',
        modelLabel: '모델',
        modelHelp: '할당량이 부족하면 더 저렴하거나 한도가 넉넉한 모델을 선택하세요. 선택한 모델을 사용할 수 없으면 Ondrift가 기본 모델로 다시 시도합니다.',
        modelAutoLabel: '기본값 (자동 전환)',
        modelOptionLabels: {
          'gemini-3.6-pro': 'Gemini 3.6 Pro · 가장 강력함, 가장 비쌈',
          'gemini-3.6-flash': 'Gemini 3.6 Flash · 기본, 균형잡힘',
          'gemini-3.6-flash-lite': 'Gemini 3.6 Flash-Lite · 더 저렴함',
          'gemini-3.5-flash-lite': 'Gemini 3.5 Flash-Lite · 가장 저렴하고 할당량이 넉넉함',
        },
        validation: {
          invalid_key: 'Gemini가 이 키를 거부했습니다. 전체 키가 복사되었고 API 액세스 권한이 있는지 확인하세요.',
          quota: '이 키는 유효하지만 현재 할당량을 모두 사용했습니다.',
          network: 'Chrome에서 Gemini에 연결하지 못했습니다. 브라우저, VPN 또는 방화벽 설정을 확인하세요.',
          request: 'Gemini가 확인 요청을 거부했습니다. Ondrift를 새로고침하고 다시 시도해 주세요.',
          unavailable: '이 프로젝트에서는 대체 모델을 포함해 Gemini를 잠시 사용할 수 없습니다.',
          unknown: '키를 확인할 수 없습니다.',
        },
      },
      persona: {
        sectionTitle: '다시 쓰기 스타일',
        sectionLead: '선택한 프리셋이 Ondrift가 강조할 부분을 안내합니다. 결과는 언제든 직접 수정할 수 있습니다.',
        languageLabel: '언어',
        languageHelp: 'Ondrift 인라인 인터페이스와 다시 쓴 프롬프트의 언어를 결정합니다.',
        personas: {
          general: { name: '균형', description: '의도, 맥락, 제약 조건, 출력 형식을 명확히 합니다.' },
          developer: { name: '개발자', description: '기술적 가정, 예외 상황, 완료 기준을 추가합니다.' },
          writer: { name: '작가', description: '대상, 어조, 구조, 편집 목표를 다듭니다.' },
          student: { name: '학생', description: '단계적인 설명을 요청하고 이해 여부를 확인합니다.' },
          translator: { name: '번역가', description: '의미는 유지하면서 지역, 어조, 격식을 지정합니다.' },
        },
      },
      sites: {
        sectionTitle: '지원 사이트',
        sectionLead: 'Ondrift는 명시적으로 허용한 사이트에서만 프롬프트 텍스트를 읽습니다.',
        sites: {
          chatgpt: { title: 'ChatGPT', detail: 'chatgpt.com에서 다시 쓰기 위젯을 표시합니다.' },
          claude: { title: 'Claude', detail: 'claude.ai에서 다시 쓰기 위젯을 표시합니다.' },
          gemini: { title: 'Gemini', detail: 'gemini.google.com에서 다시 쓰기 위젯을 표시합니다.' },
          perplexity: { title: 'Perplexity', detail: 'perplexity.ai에서 다시 쓰기 위젯을 표시합니다.' },
        },
      },
      privacy: {
        sectionTitle: '개인정보 및 로컬 데이터',
        sectionLead: '이 버전에서는 클라우드 계정, 동기화, 운영사 서버를 사용하지 않습니다.',
        historyToggleTitle: '로컬 프롬프트 기록 저장',
        historyToggleDetail: '원본과 개선된 프롬프트, 점수, 사이트, 타임스탬프를 이 브라우저에 저장합니다.',
        responsesTitle: 'AI 응답은 저장되지 않습니다',
        responsesDetail: 'Ondrift는 다시 쓰기를 요청한 프롬프트와 로컬 다시 쓰기 메타데이터만 처리합니다.',
        alwaysOn: '항상 켜짐',
        deleteTitle: '로컬 기록 삭제',
        deleteDetail: '이 브라우저에 저장된 모든 프롬프트와 사용량 집계를 삭제합니다.',
        cancelCta: '취소',
        deleteAllCta: '모두 삭제',
        clearHistoryCta: '기록 지우기',
      },
      saveBar: {
        saved: '변경 사항이 로컬에 저장되었습니다.',
        error: '변경 사항을 저장하지 못했습니다.',
        idle: '설정은 이 기기에만 저장됩니다.',
        saveCta: '변경 사항 저장',
      },
    },
    popup: {
      headerAria: { openSettings: '설정 열기' },
      setupBanner: { title: '설정 완료하기', body: '다시 쓰기를 시작하려면 Gemini API 키를 추가하세요.' },
      loading: '로컬 기록을 불러오는 중…',
      error: { title: '기록을 불러올 수 없습니다.', body: '데이터는 여전히 로컬에 안전하게 남아 있습니다.', retryCta: '다시 시도' },
      usage: {
        ariaLabel: '최근 7일간 사용량',
        last7Days: '최근 7일',
        rewrites: '다시 쓰기',
        avgScore: '평균 점수',
        noBaseline: '아직 기준값 없음',
        pointLift: (delta) => `${delta >= 0 ? '+' : ''}${delta}점 변화`,
        applied: '적용됨',
        tokensLabel: (count) => `${count} 토큰`,
      },
      trend: {
        emptyMessage: '다시 쓰기가 이틀 이상 쌓이면 점수 추이가 표시됩니다.',
        ariaLabel: (summary) => `최근 7일간 평균 프롬프트 점수. ${summary}`,
      },
      history: {
        eyebrow: '로컬 기록',
        title: '최근 프롬프트',
        searchSrLabel: '프롬프트 검색',
        searchPlaceholder: '프롬프트 텍스트 검색',
        emptyTitle: '첫 다시 쓰기가 여기에 표시됩니다.',
        emptyBody: '기록은 이 브라우저에 저장되어 언제든 검색하고 다시 볼 수 있습니다.',
        noMatchTitle: '일치하는 프롬프트가 없습니다',
        noMatchBody: '다른 단어나 서비스 이름으로 검색해 보세요.',
        appliedLabel: '적용됨',
        openConversationAria: '대화 열기',
        deleteAria: '로컬 기록에서 삭제',
      },
      footer: { storedLabel: '이 기기에 저장됨', settingsCta: '개인정보 및 설정' },
    },
  },
  en: {
    common: {
      brandHomeAria: 'Ondrift home',
      back: 'Back',
      checking: 'Checking…',
      saving: 'Saving…',
      languageLabel: 'Language',
      settingsLoading: 'Loading Ondrift settings…',
      settingsLoadErrorTitle: 'Ondrift settings could not load',
      settingsLoadErrorBody: 'Reload this page. Your local settings and history have not been changed.',
    },
    onboarding: {
      stepCount: (step, total) => `Step ${step} of ${total}`,
      languageSelectorAria: 'Choose interface language',
      intro: {
        eyebrow: 'A clearer prompt, before you send',
        title: 'Bring better instructions to every conversation.',
        lead: 'Ondrift sits beside the prompt box in ChatGPT, Claude, Gemini, and Perplexity. It scores your draft, explains what is missing, and offers a rewrite you can apply in one click.',
        promises: [
          { title: 'Works where you already write', body: 'Use the same focused workflow across supported AI sites.' },
          { title: 'Your key, your browser', body: 'Your Gemini API key stays in local extension storage.' },
          { title: 'No developer server', body: 'Prompts go directly to Gemini and history remains on this device.' },
        ],
        cta: 'Set up Gemini',
      },
      key: {
        eyebrow: 'Connect Gemini',
        title: 'Get a key in three short steps.',
        step1Title: 'Open Google AI Studio',
        step1Body: 'Sign in with your Google account. Gemini’s usage limits are managed by Google.',
        step1Cta: 'Open AI Studio',
        step2Title: 'Create an API key',
        step2Body: 'Select “Create API key,” choose a project, then copy the generated value.',
        step3Label: 'Paste and verify it here',
        step3Placeholder: 'AIza…',
        verifyCta: 'Verify key',
        step3Help: 'Verification makes one small test request. Your key is never sent to Ondrift.',
        keySuccess: 'Key verified. You’re ready for the privacy choices.',
        validation: {
          invalid_key: 'That key was not accepted. Copy the full key from Google AI Studio and try again.',
          quota: 'The key works, but its current quota is exhausted. Check the project quota or try again tomorrow.',
          network: 'Chrome could not reach Gemini. Check browser, VPN, or firewall access and try again.',
          request: 'Gemini rejected the verification request. Reload Ondrift and try again.',
          unavailable: 'Gemini is temporarily unavailable for this project. Ondrift also tried a compatible fallback model.',
          unknown: 'We could not verify this key. Nothing was saved; please try again.',
        },
        continueCta: 'Continue',
      },
      privacy: {
        eyebrow: 'Privacy choice',
        title: 'Local by design, explicit by default.',
        routeAria: 'How your data moves',
        routePrompt: { title: 'Your prompt', detail: 'Supported AI site' },
        routeApi: { title: 'Gemini API', detail: 'Using your key' },
        routeHistory: { title: 'Local history', detail: 'This browser only' },
        notes: [
          { lead: 'Ondrift reads', rest: ' the text you ask it to rewrite, the supported site, score, and whether you applied the suggestion.' },
          { lead: 'Ondrift does not collect', rest: ' AI response bodies, browsing history, or data from unsupported sites.' },
          { lead: 'You stay in control.', rest: ' Disable either site, turn off history, or delete local records at any time in Settings.' },
        ],
        consentLabel: 'I understand how prompt text is processed and consent to enabling Ondrift on supported sites.',
        enableCta: 'Enable Ondrift',
      },
      complete: {
        eyebrow: 'Setup complete',
        title: 'You’re ready to write.',
        body: 'Open ChatGPT, Claude, Gemini, or Perplexity and start a prompt. Ondrift will appear beside the composer when there is something useful to improve.',
        cta: 'Open ChatGPT',
      },
      footer: 'Private, local, and reversible. No Ondrift account required.',
    },
    options: {
      sidebar: {
        nav: { provider: 'Provider', persona: 'Rewrite style', sites: 'Sites', privacy: 'Privacy' },
        version: 'Version 0.1 · Free MVP',
      },
      header: { eyebrow: 'Extension preferences', title: 'Settings', lead: 'Choose how Ondrift rewrites and what stays in your browser.' },
      provider: {
        sectionTitle: 'Provider & API key',
        sectionLead: 'Rewrite requests go directly from the extension to your selected provider.',
        providerLabel: 'Provider',
        providerGemini: 'Google Gemini · recommended',
        providerOpenAi: 'OpenAI · coming later',
        providerClaude: 'Anthropic Claude · coming later',
        apiKeyLabel: 'API key',
        apiKeyPlaceholderSaved: 'Key saved · enter a replacement',
        apiKeyPlaceholderEmpty: 'Paste your Gemini API key',
        verifyCta: 'Verify & save',
        apiKeyHelp: 'Stored with chrome.storage.local, never sync storage.',
        getKeyCta: 'Get a key',
        keySuccess: 'Key verified and ready to use.',
        modelLabel: 'Model',
        modelHelp: 'If you’re running short on quota, choose a cheaper or higher-limit model. Ondrift falls back to its default model if the one you pick is unavailable.',
        modelAutoLabel: 'Default (automatic fallback)',
        modelOptionLabels: {
          'gemini-3.6-pro': 'Gemini 3.6 Pro · most capable, priciest',
          'gemini-3.6-flash': 'Gemini 3.6 Flash · default, balanced',
          'gemini-3.6-flash-lite': 'Gemini 3.6 Flash-Lite · cheaper',
          'gemini-3.5-flash-lite': 'Gemini 3.5 Flash-Lite · cheapest, highest quota',
        },
        validation: {
          invalid_key: 'Gemini rejected this key. Check that it was copied completely and has API access.',
          quota: 'This key is valid, but its quota is currently exhausted.',
          network: 'Chrome could not reach Gemini. Check browser, VPN, or firewall access.',
          request: 'Gemini rejected the verification request. Reload Ondrift and try again.',
          unavailable: 'Gemini is temporarily unavailable for this project, including the fallback model.',
          unknown: 'The key could not be verified.',
        },
      },
      persona: {
        sectionTitle: 'Rewrite style',
        sectionLead: 'A focused preset guides what Ondrift emphasizes. You can still edit every result.',
        languageLabel: 'Language',
        languageHelp: 'Controls the inline Ondrift interface and the language of rewritten prompts.',
        personas: {
          general: { name: 'Balanced', description: 'Clear intent, context, constraints, and output format.' },
          developer: { name: 'Developer', description: 'Adds technical assumptions, edge cases, and acceptance criteria.' },
          writer: { name: 'Writer', description: 'Sharpens audience, voice, structure, and editorial goals.' },
          student: { name: 'Student', description: 'Asks for progressive explanations and checks understanding.' },
          translator: { name: 'Translator', description: 'Preserves meaning while specifying locale, tone, and register.' },
        },
      },
      sites: {
        sectionTitle: 'Supported sites',
        sectionLead: 'Ondrift only reads prompt text on sites you explicitly enable.',
        sites: {
          chatgpt: { title: 'ChatGPT', detail: 'Show the rewrite widget on chatgpt.com.' },
          claude: { title: 'Claude', detail: 'Show the rewrite widget on claude.ai.' },
          gemini: { title: 'Gemini', detail: 'Show the rewrite widget on gemini.google.com.' },
          perplexity: { title: 'Perplexity', detail: 'Show the rewrite widget on perplexity.ai.' },
        },
      },
      privacy: {
        sectionTitle: 'Privacy & local data',
        sectionLead: 'No cloud account, sync, or developer-operated server is used in this version.',
        historyToggleTitle: 'Save local prompt history',
        historyToggleDetail: 'Store original and improved prompts, score, site, and timestamp in this browser.',
        responsesTitle: 'AI responses are never saved',
        responsesDetail: 'Ondrift only handles the prompt you choose to rewrite and local rewrite metadata.',
        alwaysOn: 'Always on',
        deleteTitle: 'Delete local history',
        deleteDetail: 'Remove all saved prompts and usage aggregates from this browser.',
        cancelCta: 'Cancel',
        deleteAllCta: 'Delete all',
        clearHistoryCta: 'Clear history',
      },
      saveBar: {
        saved: 'Changes saved locally.',
        error: 'Could not save changes.',
        idle: 'Settings stay on this device.',
        saveCta: 'Save changes',
      },
    },
    popup: {
      headerAria: { openSettings: 'Open settings' },
      setupBanner: { title: 'Finish setup', body: 'Add a Gemini API key to start rewriting.' },
      loading: 'Loading your local history…',
      error: { title: 'History is unavailable.', body: 'Your data is still local and unchanged.', retryCta: 'Try again' },
      usage: {
        ariaLabel: 'Usage over the last 7 days',
        last7Days: 'Last 7 days',
        rewrites: 'rewrites',
        avgScore: 'Avg. score',
        noBaseline: 'No baseline yet',
        pointLift: (delta) => `${delta >= 0 ? '+' : ''}${delta} point lift`,
        applied: 'Applied',
        tokensLabel: (count) => `${count} tokens`,
      },
      trend: {
        emptyMessage: 'A score trend appears after two days of rewrites.',
        ariaLabel: (summary) => `Average prompt score over the last 7 days. ${summary}`,
      },
      history: {
        eyebrow: 'Local history',
        title: 'Recent prompts',
        searchSrLabel: 'Search prompts',
        searchPlaceholder: 'Search prompt text',
        emptyTitle: 'Your first rewrite will appear here.',
        emptyBody: 'History stays in this browser, ready to search and revisit.',
        noMatchTitle: 'No matching prompts',
        noMatchBody: 'Try a different word or service name.',
        appliedLabel: 'Applied',
        openConversationAria: 'Open conversation',
        deleteAria: 'Delete from local history',
      },
      footer: { storedLabel: 'Stored on this device', settingsCta: 'Privacy & settings' },
    },
  },
  ja: {
    common: {
      brandHomeAria: 'Ondrift ホーム',
      back: '戻る',
      checking: '確認中…',
      saving: '保存中…',
      languageLabel: '言語',
      settingsLoading: 'Ondrift の設定を読み込み中…',
      settingsLoadErrorTitle: 'Ondrift の設定を読み込めませんでした',
      settingsLoadErrorBody: 'このページを再読み込みしてください。ローカル設定と履歴は変更されていません。',
    },
    onboarding: {
      stepCount: (step, total) => `${total}ステップ中${step}ステップ目`,
      languageSelectorAria: 'インターフェース言語を選択',
      intro: {
        eyebrow: '送信する前に、もっと明確なプロンプトへ',
        title: 'すべての会話に、より良い指示を。',
        lead: 'Ondrift は ChatGPT、Claude、Gemini、Perplexity の入力欄の横に表示されます。下書きを採点し、不足している点を説明し、ワンクリックで適用できる改善案を提案します。',
        promises: [
          { title: 'すでに使っている場所で', body: '対応する AI サイト全体で同じワークフローを使えます。' },
          { title: 'キーはこのブラウザだけに', body: 'Gemini API キーはこの拡張機能のローカルストレージに保存されます。' },
          { title: '開発者サーバーは不要', body: 'プロンプトは直接 Gemini に送信され、履歴はこの端末にのみ残ります。' },
        ],
        cta: 'Gemini を設定する',
      },
      key: {
        eyebrow: 'Gemini と接続',
        title: '3つの短い手順でキーを取得しましょう。',
        step1Title: 'Google AI Studio を開く',
        step1Body: 'Google アカウントでサインインしてください。Gemini の利用制限は Google が管理します。',
        step1Cta: 'AI Studio を開く',
        step2Title: 'API キーを作成する',
        step2Body: '「Create API key」を選択し、プロジェクトを選んで生成された値をコピーしてください。',
        step3Label: 'ここに貼り付けて確認',
        step3Placeholder: 'AIza…',
        verifyCta: 'キーを確認',
        step3Help: '確認のために小さなテストリクエストが1件送信されます。キーが Ondrift に送信されることはありません。',
        keySuccess: 'キーを確認しました。次はプライバシーの選択です。',
        validation: {
          invalid_key: 'このキーは承認されませんでした。Google AI Studio からキー全体をコピーして再度お試しください。',
          quota: 'キーは有効ですが、現在の割り当てを使い切っています。プロジェクトの割り当てを確認するか、明日再試行してください。',
          network: 'Chrome から Gemini に接続できませんでした。ブラウザ、VPN、ファイアウォールの設定を確認して再試行してください。',
          request: 'Gemini が確認リクエストを拒否しました。Ondrift を再読み込みして再試行してください。',
          unavailable: 'このプロジェクトでは Gemini を一時的に利用できません。互換フォールバックモデルも試しましたが利用できませんでした。',
          unknown: 'このキーを確認できませんでした。保存されていないので再試行してください。',
        },
        continueCta: '続ける',
      },
      privacy: {
        eyebrow: 'プライバシーの選択',
        title: '既定はローカル保存、選択は明確に。',
        routeAria: 'データがどのように移動するか',
        routePrompt: { title: 'あなたのプロンプト', detail: '対応する AI サイト' },
        routeApi: { title: 'Gemini API', detail: 'あなたのキーを使用' },
        routeHistory: { title: 'ローカル履歴', detail: 'このブラウザのみ' },
        notes: [
          { lead: 'Ondrift が読み取る情報:', rest: ' 改善を依頼したテキスト、対応サイト、スコア、提案を適用したかどうかです。' },
          { lead: 'Ondrift が収集しない情報:', rest: ' AI の応答本文、閲覧履歴、対応外サイトのデータです。' },
          { lead: 'すべての選択はあなた次第です。', rest: ' いつでも設定でサイトを無効にしたり、履歴保存を止めたり、ローカル履歴を削除したりできます。' },
        ],
        consentLabel: 'プロンプトテキストの処理方法を理解し、対応サイトで Ondrift を有効にすることに同意します。',
        enableCta: 'Ondrift を有効にする',
      },
      complete: {
        eyebrow: '設定完了',
        title: 'さあ、書き始めましょう。',
        body: 'ChatGPT、Claude、Gemini、Perplexity を開いてプロンプトを入力してください。改善できる点があれば、Ondrift が入力欄の横に表示されます。',
        cta: 'ChatGPT を開く',
      },
      footer: '非公開・ローカル保存・いつでも元に戻せます。Ondrift のアカウントは不要です。',
    },
    options: {
      sidebar: {
        nav: { provider: 'プロバイダー', persona: 'リライトスタイル', sites: 'サイト', privacy: 'プライバシー' },
        version: 'バージョン 0.1 · 無料 MVP',
      },
      header: { eyebrow: '拡張機能の環境設定', title: '設定', lead: 'Ondrift のリライト方法とブラウザに残すデータを選択してください。' },
      provider: {
        sectionTitle: 'プロバイダーと API キー',
        sectionLead: 'リライトのリクエストは拡張機能から選択したプロバイダーへ直接送信されます。',
        providerLabel: 'プロバイダー',
        providerGemini: 'Google Gemini · おすすめ',
        providerOpenAi: 'OpenAI · 近日対応',
        providerClaude: 'Anthropic Claude · 近日対応',
        apiKeyLabel: 'API キー',
        apiKeyPlaceholderSaved: 'キー保存済み · 置き換えるキーを入力',
        apiKeyPlaceholderEmpty: 'Gemini API キーを貼り付けてください',
        verifyCta: '確認して保存',
        apiKeyHelp: 'chrome.storage.local にのみ保存され、同期ストレージは使用しません。',
        getKeyCta: 'キーを取得',
        keySuccess: 'キーを確認しました。利用できます。',
        modelLabel: 'モデル',
        modelHelp: '割り当てが不足している場合は、より安価または上限の高いモデルを選択してください。選択したモデルが利用できない場合、Ondrift は既定モデルで再試行します。',
        modelAutoLabel: '既定値(自動フォールバック)',
        modelOptionLabels: {
          'gemini-3.6-pro': 'Gemini 3.6 Pro · 最も高性能、最も高価',
          'gemini-3.6-flash': 'Gemini 3.6 Flash · 既定、バランス型',
          'gemini-3.6-flash-lite': 'Gemini 3.6 Flash-Lite · より安価',
          'gemini-3.5-flash-lite': 'Gemini 3.5 Flash-Lite · 最も安価で割り当てが多い',
        },
        validation: {
          invalid_key: 'Gemini がこのキーを拒否しました。キー全体がコピーされているか、API アクセス権があるか確認してください。',
          quota: 'このキーは有効ですが、現在割り当てを使い切っています。',
          network: 'Chrome から Gemini に接続できませんでした。ブラウザ、VPN、ファイアウォールの設定を確認してください。',
          request: 'Gemini が確認リクエストを拒否しました。Ondrift を再読み込みして再試行してください。',
          unavailable: 'このプロジェクトではフォールバックモデルを含め、Gemini を一時的に利用できません。',
          unknown: 'キーを確認できませんでした。',
        },
      },
      persona: {
        sectionTitle: 'リライトスタイル',
        sectionLead: '選んだプリセットが Ondrift の重視するポイントを決めます。結果はいつでも編集できます。',
        languageLabel: '言語',
        languageHelp: 'Ondrift のインライン UI と、リライトされたプロンプトの言語を決定します。',
        personas: {
          general: { name: 'バランス型', description: '意図、文脈、制約、出力形式を明確にします。' },
          developer: { name: '開発者', description: '技術的な前提、エッジケース、受け入れ基準を追加します。' },
          writer: { name: 'ライター', description: '読者、トーン、構成、編集目標を洗練します。' },
          student: { name: '学生', description: '段階的な説明を求め、理解度を確認します。' },
          translator: { name: '翻訳者', description: '意味を保ちながら、地域、トーン、フォーマルさを指定します。' },
        },
      },
      sites: {
        sectionTitle: '対応サイト',
        sectionLead: 'Ondrift は明示的に許可したサイトでのみプロンプトテキストを読み取ります。',
        sites: {
          chatgpt: { title: 'ChatGPT', detail: 'chatgpt.com でリライトウィジェットを表示します。' },
          claude: { title: 'Claude', detail: 'claude.ai でリライトウィジェットを表示します。' },
          gemini: { title: 'Gemini', detail: 'gemini.google.com でリライトウィジェットを表示します。' },
          perplexity: { title: 'Perplexity', detail: 'perplexity.ai でリライトウィジェットを表示します。' },
        },
      },
      privacy: {
        sectionTitle: 'プライバシーとローカルデータ',
        sectionLead: 'このバージョンではクラウドアカウント、同期、開発者運用サーバーは使用しません。',
        historyToggleTitle: 'ローカルのプロンプト履歴を保存',
        historyToggleDetail: '元のプロンプトと改善後のプロンプト、スコア、サイト、タイムスタンプをこのブラウザに保存します。',
        responsesTitle: 'AI の応答は保存されません',
        responsesDetail: 'Ondrift はリライトを依頼したプロンプトとローカルのリライトメタデータのみを扱います。',
        alwaysOn: '常にオン',
        deleteTitle: 'ローカル履歴を削除',
        deleteDetail: 'このブラウザに保存されたすべてのプロンプトと利用状況の集計を削除します。',
        cancelCta: 'キャンセル',
        deleteAllCta: 'すべて削除',
        clearHistoryCta: '履歴を消去',
      },
      saveBar: {
        saved: '変更内容はローカルに保存されました。',
        error: '変更内容を保存できませんでした。',
        idle: '設定はこの端末にのみ保存されます。',
        saveCta: '変更を保存',
      },
    },
    popup: {
      headerAria: { openSettings: '設定を開く' },
      setupBanner: { title: '設定を完了する', body: 'リライトを始めるには Gemini API キーを追加してください。' },
      loading: 'ローカル履歴を読み込んでいます…',
      error: { title: '履歴を利用できません。', body: 'データはローカルに保存されたまま変更されていません。', retryCta: '再試行' },
      usage: {
        ariaLabel: '過去7日間の利用状況',
        last7Days: '過去7日間',
        rewrites: 'リライト',
        avgScore: '平均スコア',
        noBaseline: '基準値なし',
        pointLift: (delta) => `${delta >= 0 ? '+' : ''}${delta}ポイント上昇`,
        applied: '適用済み',
        tokensLabel: (count) => `${count}トークン`,
      },
      trend: {
        emptyMessage: 'リライトが2日分蓄積するとスコアの推移が表示されます。',
        ariaLabel: (summary) => `過去7日間の平均プロンプトスコア。${summary}`,
      },
      history: {
        eyebrow: 'ローカル履歴',
        title: '最近のプロンプト',
        searchSrLabel: 'プロンプトを検索',
        searchPlaceholder: 'プロンプトのテキストを検索',
        emptyTitle: '最初のリライトがここに表示されます。',
        emptyBody: '履歴はこのブラウザに保存され、いつでも検索して見返せます。',
        noMatchTitle: '一致するプロンプトがありません',
        noMatchBody: '別の単語やサービス名で試してください。',
        appliedLabel: '適用済み',
        openConversationAria: '会話を開く',
        deleteAria: 'ローカル履歴から削除',
      },
      footer: { storedLabel: 'この端末に保存', settingsCta: 'プライバシーと設定' },
    },
  },
};

export function getUiCopy(language: LanguageId | undefined): UiCopy {
  return uiCopy[language ?? 'en'] ?? uiCopy.en;
}
