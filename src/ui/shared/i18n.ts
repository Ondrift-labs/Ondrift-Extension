import type { LanguageId, PersonaId, SiteId } from './contracts';
import type { GeminiModelId } from '../../shared/models';

/** BCP-47 locale tags used for Intl formatting (dates, numbers, relative time). */
export const LOCALE_TAGS: Record<LanguageId, string> = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' };

/** Each language's own name for itself, shown identically regardless of the active UI language. */
export const LANGUAGE_NAMES: Record<LanguageId, string> = { ko: '한국어', en: 'English', ja: '日本語', zh: '简体中文' };

export const SUPPORTED_LANGUAGES: readonly LanguageId[] = ['ko', 'en', 'ja', 'zh'];

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
    guideToggleCta(showing: boolean): string;
    subStepCount(step: number, total: number): string;
    step1Title: string;
    step1Body: string;
    step1Cta: string;
    step1ImageAlt: string;
    nextCta: string;
    step2Title: string;
    step2Body: string;
    step2ImageAlt: string;
    step3Label: string;
    step3Placeholder: string;
    verifyCta: string;
    step3Help: string;
    step3ImageAlt: string;
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
    nav: { provider: string; persona: string; sites: string; privacy: string; support: string };
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
    modelCustomLabel: string;
    modelCustomPlaceholder: string;
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
  support: {
    sectionTitle: string;
    sectionLead: string;
    starCta: string;
  };
  saveBar: { saving: string; savingDetail: string; savedTitle: string; saved: string; errorTitle: string; error: string; idle: string; retryCta: string };
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
    copyImprovedAria: string;
    copiedImprovedAria: string;
    copyFailedMessage: string;
    scoreChangeAria(original: number, improved: number, delta: number): string;
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
        guideToggleCta: (showing) => (showing ? '개발자인가요? 화면 캡처 숨기기' : '화면 캡처 다시 보기'),
        subStepCount: (step, total) => `${total}단계 중 ${step}단계`,
        step1Title: 'Google AI Studio 열기',
        step1Body: 'Google 계정으로 로그인하세요. Gemini 사용량 한도는 Google이 관리합니다.',
        step1Cta: 'AI Studio 열기',
        step1ImageAlt: 'Google AI Studio의 API 키 화면. 오른쪽 위에 "Create API key" 버튼이 보인다.',
        nextCta: '다음',
        step2Title: 'API 키 만들기',
        step2Body: '“API 키 만들기”를 선택하고 프로젝트를 고른 다음 생성된 값을 복사하세요.',
        step2ImageAlt: '프로젝트를 선택하는 "Create a new key" 대화상자.',
        step3Label: '여기에 붙여넣고 확인하세요',
        step3Placeholder: 'AIza…',
        verifyCta: '키 확인',
        step3Help: '확인 과정에서 작은 테스트 요청 한 건이 전송됩니다. 키는 Ondrift로 전송되지 않습니다.',
        step3ImageAlt: '생성된 API 키가 목록에 표시된 화면.',
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
        nav: { provider: '제공자', persona: '다시 쓰기 스타일', sites: '사이트', privacy: '개인정보', support: '응원하기' },
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
        modelCustomLabel: '기타 (직접 입력)',
        modelCustomPlaceholder: 'Gemini 모델 이름 입력, 예: gemini-3.6-flash',
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
      support: {
        sectionTitle: '응원하기',
        sectionLead: 'Ondrift는 개인이 무료로 만들고 있는 확장 프로그램입니다. GitHub에 스타를 눌러 응원해 주세요.',
        starCta: 'GitHub에서 스타 누르기',
      },
      saveBar: {
        saving: '자동 저장 중',
        savingDetail: '변경 사항을 이 브라우저에 저장하고 있습니다.',
        savedTitle: '자동 저장 완료',
        saved: '변경 사항이 로컬에 저장되었습니다.',
        errorTitle: '자동 저장 실패',
        error: '변경 사항을 저장하지 못했습니다.',
        idle: '변경 사항은 이 기기에 자동으로 저장됩니다.',
        retryCta: '다시 시도',
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
        avgScore: '개선 후 평균',
        noBaseline: '아직 기준값 없음',
        pointLift: (delta) => `${delta >= 0 ? '+' : ''}${delta}점 변화`,
        applied: '적용됨',
        tokensLabel: (count) => `${count} 토큰`,
      },
      trend: {
        emptyMessage: '다시 쓰기가 이틀 이상 쌓이면 점수 추이가 표시됩니다.',
        ariaLabel: (summary) => `최근 7일간 개선 후 평균 프롬프트 점수. ${summary}`,
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
        copyImprovedAria: '개선된 프롬프트 복사',
        copiedImprovedAria: '개선된 프롬프트가 복사됨',
        copyFailedMessage: '프롬프트를 복사하지 못했습니다.',
        scoreChangeAria: (original, improved, delta) => `원본 ${original}점에서 개선 후 ${improved}점, ${delta >= 0 ? `${delta}점 상승` : `${Math.abs(delta)}점 하락`}`,
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
        guideToggleCta: (showing) => (showing ? 'Developer? Hide the screenshots' : 'Show the screenshots again'),
        subStepCount: (step, total) => `Step ${step} of ${total}`,
        step1Title: 'Open Google AI Studio',
        step1Body: 'Sign in with your Google account. Gemini’s usage limits are managed by Google.',
        step1Cta: 'Open AI Studio',
        step1ImageAlt: 'Google AI Studio’s API Keys screen, with the “Create API key” button in the top right.',
        nextCta: 'Next',
        step2Title: 'Create an API key',
        step2Body: 'Select “Create API key,” choose a project, then copy the generated value.',
        step2ImageAlt: 'The “Create a new key” dialog for choosing a project.',
        step3Label: 'Paste and verify it here',
        step3Placeholder: 'AIza…',
        verifyCta: 'Verify key',
        step3Help: 'Verification makes one small test request. Your key is never sent to Ondrift.',
        step3ImageAlt: 'The generated API key listed on the API Keys screen.',
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
        nav: { provider: 'Provider', persona: 'Rewrite style', sites: 'Sites', privacy: 'Privacy', support: 'Support' },
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
        modelCustomLabel: 'Other (enter manually)',
        modelCustomPlaceholder: 'Enter a Gemini model name, e.g. gemini-3.6-flash',
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
      support: {
        sectionTitle: 'Support Ondrift',
        sectionLead: 'Ondrift is built and maintained by one person, for free. Starring it on GitHub helps others find it.',
        starCta: 'Star on GitHub',
      },
      saveBar: {
        saving: 'Saving automatically',
        savingDetail: 'Saving your changes in this browser.',
        savedTitle: 'Changes saved',
        saved: 'Changes saved locally.',
        errorTitle: 'Auto-save failed',
        error: 'Could not save changes.',
        idle: 'Changes are saved automatically on this device.',
        retryCta: 'Try again',
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
        avgScore: 'Avg. improved',
        noBaseline: 'No baseline yet',
        pointLift: (delta) => `${delta >= 0 ? '+' : ''}${delta} point lift`,
        applied: 'Applied',
        tokensLabel: (count) => `${count} tokens`,
      },
      trend: {
        emptyMessage: 'A score trend appears after two days of rewrites.',
        ariaLabel: (summary) => `Average improved prompt score over the last 7 days. ${summary}`,
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
        copyImprovedAria: 'Copy improved prompt',
        copiedImprovedAria: 'Improved prompt copied',
        copyFailedMessage: 'Could not copy the prompt.',
        scoreChangeAria: (original, improved, delta) => `Original score ${original}, improved score ${improved}, ${Math.abs(delta)} points ${delta >= 0 ? 'higher' : 'lower'}`,
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
        guideToggleCta: (showing) => (showing ? '開発者の方はこちら: 画面キャプチャを非表示' : '画面キャプチャを再表示'),
        subStepCount: (step, total) => `${total}ステップ中${step}ステップ目`,
        step1Title: 'Google AI Studio を開く',
        step1Body: 'Google アカウントでサインインしてください。Gemini の利用制限は Google が管理します。',
        step1Cta: 'AI Studio を開く',
        step1ImageAlt: 'Google AI Studio の API キー画面。右上に「Create API key」ボタンが表示されている。',
        nextCta: '次へ',
        step2Title: 'API キーを作成する',
        step2Body: '「Create API key」を選択し、プロジェクトを選んで生成された値をコピーしてください。',
        step2ImageAlt: 'プロジェクトを選択する「Create a new key」ダイアログ。',
        step3Label: 'ここに貼り付けて確認',
        step3Placeholder: 'AIza…',
        verifyCta: 'キーを確認',
        step3Help: '確認のために小さなテストリクエストが1件送信されます。キーが Ondrift に送信されることはありません。',
        step3ImageAlt: '生成された API キーが一覧に表示された画面。',
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
        nav: { provider: 'プロバイダー', persona: 'リライトスタイル', sites: 'サイト', privacy: 'プライバシー', support: '応援する' },
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
        modelCustomLabel: 'その他(直接入力)',
        modelCustomPlaceholder: 'Gemini モデル名を入力、例: gemini-3.6-flash',
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
      support: {
        sectionTitle: '応援する',
        sectionLead: 'Ondrift は個人が無料で開発している拡張機能です。GitHub でスターを付けて応援してください。',
        starCta: 'GitHub でスターを付ける',
      },
      saveBar: {
        saving: '自動保存中',
        savingDetail: '変更内容をこのブラウザに保存しています。',
        savedTitle: '自動保存しました',
        saved: '変更内容はローカルに保存されました。',
        errorTitle: '自動保存に失敗しました',
        error: '変更内容を保存できませんでした。',
        idle: '変更内容はこの端末に自動保存されます。',
        retryCta: '再試行',
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
        avgScore: '改善後平均',
        noBaseline: '基準値なし',
        pointLift: (delta) => `${delta >= 0 ? '+' : ''}${delta}ポイント上昇`,
        applied: '適用済み',
        tokensLabel: (count) => `${count}トークン`,
      },
      trend: {
        emptyMessage: 'リライトが2日分蓄積するとスコアの推移が表示されます。',
        ariaLabel: (summary) => `過去7日間の改善後平均プロンプトスコア。${summary}`,
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
        copyImprovedAria: '改善後のプロンプトをコピー',
        copiedImprovedAria: '改善後のプロンプトをコピーしました',
        copyFailedMessage: 'プロンプトをコピーできませんでした。',
        scoreChangeAria: (original, improved, delta) => `元のスコア${original}から改善後${improved}、${Math.abs(delta)}ポイント${delta >= 0 ? '上昇' : '低下'}`,
        openConversationAria: '会話を開く',
        deleteAria: 'ローカル履歴から削除',
      },
      footer: { storedLabel: 'この端末に保存', settingsCta: 'プライバシーと設定' },
    },
  },
  zh: {
    common: {
      brandHomeAria: 'Ondrift 主页',
      back: '返回',
      checking: '正在检查…',
      saving: '正在保存…',
      languageLabel: '语言',
      settingsLoading: '正在加载 Ondrift 设置…',
      settingsLoadErrorTitle: '无法加载 Ondrift 设置',
      settingsLoadErrorBody: '请重新加载此页面。你的本地设置和历史记录没有被更改。',
    },
    onboarding: {
      stepCount: (step, total) => `第 ${step} 步，共 ${total} 步`,
      languageSelectorAria: '选择界面语言',
      intro: {
        eyebrow: '发送前，让提示词更清晰',
        title: '为每一次对话带来更好的指令。',
        lead: 'Ondrift 会出现在 ChatGPT、Claude、Gemini 和 Perplexity 的输入框旁。它会为草稿评分，说明缺少什么，并提供可一键应用的改写版本。',
        promises: [
          { title: '就在你常用的地方使用', body: '在支持的 AI 网站中使用同一套专注的工作流。' },
          { title: '你的密钥，只留在浏览器里', body: '你的 Gemini API 密钥只保存在扩展的本地存储中。' },
          { title: '没有开发者服务器', body: '提示词会直接发送到 Gemini，历史记录只保留在这台设备上。' },
        ],
        cta: '设置 Gemini',
      },
      key: {
        eyebrow: '连接 Gemini',
        title: '用三个简单步骤获取密钥。',
        guideToggleCta: (showing) => (showing ? '是开发者?隐藏截图' : '重新显示截图'),
        subStepCount: (step, total) => `第 ${step} 步，共 ${total} 步`,
        step1Title: '打开 Google AI Studio',
        step1Body: '使用你的 Google 账号登录。Gemini 的用量限制由 Google 管理。',
        step1Cta: '打开 AI Studio',
        step1ImageAlt: 'Google AI Studio 的 API 密钥页面,右上角显示"Create API key"按钮。',
        nextCta: '下一步',
        step2Title: '创建 API 密钥',
        step2Body: '选择“Create API key”，选择一个项目，然后复制生成的值。',
        step2ImageAlt: '用于选择项目的"Create a new key"对话框。',
        step3Label: '粘贴到这里并验证',
        step3Placeholder: 'AIza…',
        verifyCta: '验证密钥',
        step3Help: '验证会发送一次很小的测试请求。你的密钥不会发送给 Ondrift。',
        step3ImageAlt: '生成的 API 密钥显示在列表中的画面。',
        keySuccess: '密钥已验证。接下来可以设置隐私选项。',
        validation: {
          invalid_key: '此密钥未被接受。请从 Google AI Studio 复制完整密钥后重试。',
          quota: '密钥有效，但当前配额已用完。请检查项目配额，或明天再试。',
          network: 'Chrome 无法连接到 Gemini。请检查浏览器、VPN 或防火墙访问权限后重试。',
          request: 'Gemini 拒绝了验证请求。请重新加载 Ondrift 后重试。',
          unavailable: '此项目暂时无法使用 Gemini。Ondrift 也尝试了兼容的备用模型。',
          unknown: '无法验证此密钥。没有保存任何内容，请重试。',
        },
        continueCta: '继续',
      },
      privacy: {
        eyebrow: '隐私选择',
        title: '默认本地保存，选择清晰明确。',
        routeAria: '你的数据如何流动',
        routePrompt: { title: '你的提示词', detail: '支持的 AI 网站' },
        routeApi: { title: 'Gemini API', detail: '使用你的密钥' },
        routeHistory: { title: '本地历史记录', detail: '仅限此浏览器' },
        notes: [
          { lead: 'Ondrift 会读取:', rest: ' 你要求改写的文本、支持的网站、评分，以及你是否应用了建议。' },
          { lead: 'Ondrift 不会收集:', rest: ' AI 回复内容、浏览历史，或不支持网站上的数据。' },
          { lead: '控制权始终在你手中。', rest: ' 你可以随时在设置中关闭网站、停止保存历史记录，或删除本地记录。' },
        ],
        consentLabel: '我了解提示词文本的处理方式，并同意在支持的网站上启用 Ondrift。',
        enableCta: '启用 Ondrift',
      },
      complete: {
        eyebrow: '设置完成',
        title: '你可以开始写了。',
        body: '打开 ChatGPT、Claude、Gemini 或 Perplexity 并开始输入提示词。当有可改进的内容时，Ondrift 会出现在输入框旁。',
        cta: '打开 ChatGPT',
      },
      footer: '私密、本地保存、可随时撤回。无需 Ondrift 账号。',
    },
    options: {
      sidebar: {
        nav: { provider: '服务提供方', persona: '改写风格', sites: '网站', privacy: '隐私', support: '支持' },
        version: '版本 0.1 · 免费 MVP',
      },
      header: { eyebrow: '扩展偏好设置', title: '设置', lead: '选择 Ondrift 如何改写，以及哪些内容保留在你的浏览器中。' },
      provider: {
        sectionTitle: '服务提供方与 API 密钥',
        sectionLead: '改写请求会从扩展直接发送到你选择的服务提供方。',
        providerLabel: '服务提供方',
        providerGemini: 'Google Gemini · 推荐',
        providerOpenAi: 'OpenAI · 即将支持',
        providerClaude: 'Anthropic Claude · 即将支持',
        apiKeyLabel: 'API 密钥',
        apiKeyPlaceholderSaved: '密钥已保存 · 输入新密钥以替换',
        apiKeyPlaceholderEmpty: '粘贴你的 Gemini API 密钥',
        verifyCta: '验证并保存',
        apiKeyHelp: '仅保存在 chrome.storage.local 中，不使用同步存储。',
        getKeyCta: '获取密钥',
        keySuccess: '密钥已验证，可以使用。',
        modelLabel: '模型',
        modelHelp: '如果配额不足，请选择更便宜或限制更宽松的模型。如果所选模型不可用，Ondrift 会回退到默认模型。',
        modelAutoLabel: '默认值（自动回退）',
        modelOptionLabels: {
          'gemini-3.6-pro': 'Gemini 3.6 Pro · 能力最强，价格最高',
          'gemini-3.6-flash': 'Gemini 3.6 Flash · 默认，均衡',
          'gemini-3.6-flash-lite': 'Gemini 3.6 Flash-Lite · 更便宜',
          'gemini-3.5-flash-lite': 'Gemini 3.5 Flash-Lite · 最便宜，配额最高',
        },
        modelCustomLabel: '其他（手动输入）',
        modelCustomPlaceholder: '输入 Gemini 模型名称，例如 gemini-3.6-flash',
        validation: {
          invalid_key: 'Gemini 拒绝了此密钥。请确认已完整复制密钥，并且具有 API 访问权限。',
          quota: '此密钥有效，但当前配额已用完。',
          network: 'Chrome 无法连接到 Gemini。请检查浏览器、VPN 或防火墙访问权限。',
          request: 'Gemini 拒绝了验证请求。请重新加载 Ondrift 后重试。',
          unavailable: '此项目暂时无法使用 Gemini，包括备用模型。',
          unknown: '无法验证此密钥。',
        },
      },
      persona: {
        sectionTitle: '改写风格',
        sectionLead: '所选预设会引导 Ondrift 重点优化的方向。每个结果你都可以继续编辑。',
        languageLabel: '语言',
        languageHelp: '控制 Ondrift 行内界面以及改写后提示词的语言。',
        personas: {
          general: { name: '均衡', description: '明确意图、背景、限制条件和输出格式。' },
          developer: { name: '开发者', description: '补充技术假设、边界情况和验收标准。' },
          writer: { name: '写作者', description: '打磨受众、语气、结构和编辑目标。' },
          student: { name: '学生', description: '要求循序渐进的解释，并检查理解程度。' },
          translator: { name: '译者', description: '在保留含义的同时指定地区、语气和正式程度。' },
        },
      },
      sites: {
        sectionTitle: '支持的网站',
        sectionLead: 'Ondrift 只会在你明确启用的网站上读取提示词文本。',
        sites: {
          chatgpt: { title: 'ChatGPT', detail: '在 chatgpt.com 上显示改写小组件。' },
          claude: { title: 'Claude', detail: '在 claude.ai 上显示改写小组件。' },
          gemini: { title: 'Gemini', detail: '在 gemini.google.com 上显示改写小组件。' },
          perplexity: { title: 'Perplexity', detail: '在 perplexity.ai 上显示改写小组件。' },
        },
      },
      privacy: {
        sectionTitle: '隐私与本地数据',
        sectionLead: '此版本不使用云账号、同步功能或开发者运营的服务器。',
        historyToggleTitle: '保存本地提示词历史',
        historyToggleDetail: '在此浏览器中保存原始提示词、改写后提示词、评分、网站和时间戳。',
        responsesTitle: '不会保存 AI 回复',
        responsesDetail: 'Ondrift 只处理你选择改写的提示词和本地改写元数据。',
        alwaysOn: '始终开启',
        deleteTitle: '删除本地历史记录',
        deleteDetail: '删除此浏览器中保存的所有提示词和使用统计。',
        cancelCta: '取消',
        deleteAllCta: '全部删除',
        clearHistoryCta: '清除历史记录',
      },
      support: {
        sectionTitle: '支持 Ondrift',
        sectionLead: 'Ondrift 由个人免费构建和维护。在 GitHub 上加星可以帮助更多人发现它。',
        starCta: '在 GitHub 上加星',
      },
      saveBar: {
        saving: '正在自动保存',
        savingDetail: '正在将更改保存到此浏览器。',
        savedTitle: '已自动保存',
        saved: '更改已保存在本地。',
        errorTitle: '自动保存失败',
        error: '无法保存更改。',
        idle: '更改会自动保存在此设备上。',
        retryCta: '重试',
      },
    },
    popup: {
      headerAria: { openSettings: '打开设置' },
      setupBanner: { title: '完成设置', body: '添加 Gemini API 密钥即可开始改写。' },
      loading: '正在加载你的本地历史记录…',
      error: { title: '历史记录不可用。', body: '你的数据仍保存在本地，且没有被更改。', retryCta: '重试' },
      usage: {
        ariaLabel: '最近 7 天使用情况',
        last7Days: '最近 7 天',
        rewrites: '次改写',
        avgScore: '改进后平均',
        noBaseline: '暂无基准',
        pointLift: (delta) => `${delta >= 0 ? '+' : ''}${delta} 分提升`,
        applied: '已应用',
        tokensLabel: (count) => `${count} 个 token`,
      },
      trend: {
        emptyMessage: '累计两天以上的改写后，会显示评分趋势。',
        ariaLabel: (summary) => `最近 7 天改进后提示词平均分。${summary}`,
      },
      history: {
        eyebrow: '本地历史记录',
        title: '最近的提示词',
        searchSrLabel: '搜索提示词',
        searchPlaceholder: '搜索提示词文本',
        emptyTitle: '你的第一次改写会显示在这里。',
        emptyBody: '历史记录保存在此浏览器中，方便随时搜索和回看。',
        noMatchTitle: '没有匹配的提示词',
        noMatchBody: '试试其他词或服务名称。',
        appliedLabel: '已应用',
        copyImprovedAria: '复制改进后的提示词',
        copiedImprovedAria: '已复制改进后的提示词',
        copyFailedMessage: '无法复制提示词。',
        scoreChangeAria: (original, improved, delta) => `原始分数 ${original}，改进后 ${improved}，${Math.abs(delta)} 分${delta >= 0 ? '提高' : '降低'}`,
        openConversationAria: '打开对话',
        deleteAria: '从本地历史记录中删除',
      },
      footer: { storedLabel: '保存在这台设备上', settingsCta: '隐私与设置' },
    },
  },
};

export function getUiCopy(language: LanguageId | undefined): UiCopy {
  return uiCopy[language ?? 'en'] ?? uiCopy.en;
}
