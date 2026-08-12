import type { LanguageId } from "../../shared/types";

export interface InlineMessages {
  ariaLabel: string;
  settings: string;
  dismiss: string;
  shortPrompt: string;
  ready: string;
  rewrite: string;
  loading: string;
  score: string;
  scoreChangeAria(original: number, improved: number, delta: number): string;
  strong: string;
  foundation: string;
  needsDirection: string;
  points: string;
  suggested: string;
  retry: string;
  apply: string;
  applied: string;
  connectKey: string;
  quotaTitle: string;
  networkTitle: string;
  invalidKeyTitle: string;
  requestTitle: string;
  unavailableTitle: string;
  rewriteUnavailable: string;
  missingKeyDetail: string;
  quotaDetail: string;
  networkDetail: string;
  invalidKeyDetail: string;
  requestDetail: string;
  unavailableDetail: string;
  unknownDetail: string;
  openSettings: string;
  reconnectTitle: string;
  reconnectDetail: string;
  reloadPage: string;
}

export const inlineMessages: Record<LanguageId, InlineMessages> = {
  ko: {
    ariaLabel: "Ondrift 프롬프트 개선", settings: "Ondrift 설정 열기", dismiss: "Ondrift 닫기",
    shortPrompt: "유용하게 개선하려면 내용을 조금 더 입력해 주세요.", ready: "명확성, 맥락, 제약 조건을 분석할 준비가 됐습니다.", rewrite: "개선 및 점수 확인", loading: "의도, 맥락, 제약 조건을 분석하고 있습니다…",
    score: "점수", scoreChangeAria: (original, improved, delta) => `원본 ${original}점, 개선 후 ${improved}점, ${delta >= 0 ? `${delta}점 상승` : `${Math.abs(delta)}점 하락`}`, strong: "명확하고 구체적이에요", foundation: "기본 방향이 명확해요", needsDirection: "조금 더 구체화가 필요해요", points: "점", suggested: "개선된 프롬프트", retry: "다시 시도", apply: "프롬프트에 적용", applied: "적용되었습니다. 전송 전에 계속 수정할 수 있어요.",
    connectKey: "먼저 API 키를 연결해 주세요", quotaTitle: "Gemini 할당량을 모두 사용했습니다", networkTitle: "연결이 끊어졌습니다", invalidKeyTitle: "API 키를 확인해 주세요", requestTitle: "요청이 거부되었습니다", unavailableTitle: "Gemini를 사용할 수 없습니다", rewriteUnavailable: "프롬프트를 개선할 수 없습니다",
    missingKeyDetail: "설정은 약 1분이면 끝나며 키는 이 브라우저에만 저장됩니다.", quotaDetail: "현재 제공자 한도를 모두 사용했습니다. 초기화된 후 다시 시도해 주세요.", networkDetail: "Chrome에서 Gemini에 연결하지 못했습니다. 브라우저, VPN 또는 방화벽을 확인해 주세요.", invalidKeyDetail: "Ondrift 설정에서 키를 확인하거나 교체해 주세요.", requestDetail: "Gemini가 요청을 거부했습니다. Ondrift를 새로고침하고 다시 시도해 주세요.", unavailableDetail: "Gemini와 호환 대체 모델을 현재 사용할 수 없습니다.", unknownDetail: "프롬프트는 변경되지 않았습니다. 다시 시도해 주세요.", openSettings: "설정 열기",
    reconnectTitle: "Ondrift를 다시 연결해 주세요", reconnectDetail: "확장 프로그램이 업데이트되었거나 연결이 끊겼습니다. 작성 중인 내용을 확인한 뒤 페이지를 새로고침해 주세요.", reloadPage: "페이지 새로고침",
  },
  en: {
    ariaLabel: "Ondrift prompt rewrite", settings: "Open Ondrift settings", dismiss: "Dismiss Ondrift",
    shortPrompt: "Add a little more detail to make the rewrite useful.", ready: "Ready to score clarity, context, and constraints.", rewrite: "Rewrite & score", loading: "Reading for intent, context, and useful constraints…",
    score: "Score", scoreChangeAria: (original, improved, delta) => `Original score ${original}, improved score ${improved}, ${Math.abs(delta)} points ${delta >= 0 ? "higher" : "lower"}`, strong: "Strong and specific", foundation: "Clear foundation", needsDirection: "Needs more direction", points: "points", suggested: "Suggested rewrite", retry: "Try again", apply: "Apply to prompt", applied: "Applied. You can keep editing before you send.",
    connectKey: "Connect an API key first", quotaTitle: "Gemini quota reached", networkTitle: "Connection interrupted", invalidKeyTitle: "API key needs attention", requestTitle: "Request rejected", unavailableTitle: "Gemini unavailable", rewriteUnavailable: "Rewrite unavailable",
    missingKeyDetail: "Setup takes about a minute and your key stays in this browser.", quotaDetail: "Your provider limit is exhausted for now. Try again after it resets.", networkDetail: "Chrome could not reach Gemini. Check browser, VPN, or firewall access.", invalidKeyDetail: "Verify or replace the key in Ondrift settings.", requestDetail: "Gemini rejected the request. Reload Ondrift and retry.", unavailableDetail: "Gemini and the compatible fallback model are currently unavailable.", unknownDetail: "Your prompt was not changed. Please try again.", openSettings: "Open settings",
    reconnectTitle: "Reconnect Ondrift", reconnectDetail: "The extension was updated or disconnected. Check your draft, then reload this page to reconnect.", reloadPage: "Reload page",
  },
  ja: {
    ariaLabel: "Ondrift プロンプト改善", settings: "Ondrift 設定を開く", dismiss: "Ondrift を閉じる",
    shortPrompt: "より有用に改善するため、もう少し詳しく入力してください。", ready: "明確さ、文脈、制約を確認する準備ができました。", rewrite: "改善して採点", loading: "意図、文脈、制約を分析しています…",
    score: "スコア", scoreChangeAria: (original, improved, delta) => `元のスコア${original}、改善後のスコア${improved}、${Math.abs(delta)}ポイント${delta >= 0 ? "上昇" : "低下"}`, strong: "明確で具体的です", foundation: "基本方針が明確です", needsDirection: "もう少し具体化が必要です", points: "ポイント", suggested: "改善されたプロンプト", retry: "再試行", apply: "プロンプトに適用", applied: "適用しました。送信前に引き続き編集できます。",
    connectKey: "先に API キーを接続してください", quotaTitle: "Gemini の割り当て上限に達しました", networkTitle: "接続が中断されました", invalidKeyTitle: "API キーを確認してください", requestTitle: "リクエストが拒否されました", unavailableTitle: "Gemini を利用できません", rewriteUnavailable: "プロンプトを改善できません",
    missingKeyDetail: "設定は約1分で完了し、キーはこのブラウザにのみ保存されます。", quotaDetail: "現在の利用上限に達しています。リセット後に再試行してください。", networkDetail: "Chrome から Gemini に接続できません。ブラウザ、VPN、ファイアウォールを確認してください。", invalidKeyDetail: "Ondrift 設定でキーを確認または交換してください。", requestDetail: "Gemini がリクエストを拒否しました。Ondrift を再読み込みして再試行してください。", unavailableDetail: "Gemini と互換フォールバックモデルは現在利用できません。", unknownDetail: "プロンプトは変更されていません。もう一度お試しください。", openSettings: "設定を開く",
    reconnectTitle: "Ondrift を再接続してください", reconnectDetail: "拡張機能が更新されたか、接続が切れました。入力内容を確認してから、このページを再読み込みしてください。", reloadPage: "ページを再読み込み",
  },
};
