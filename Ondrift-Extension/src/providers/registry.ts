import type { ProviderId } from "../shared/types";
import type { LLMProvider } from "./provider";
import { GeminiProvider } from "./gemini.provider";
import { ProviderError } from "./errors";

const providers = new Map<ProviderId, LLMProvider>([["gemini", new GeminiProvider()]]);

export function getProvider(id: ProviderId): LLMProvider {
  const provider = providers.get(id);
  if (!provider) throw new ProviderError("not_configured", `${id} support is not configured yet.`);
  return provider;
}

export function registerProvider(provider: LLMProvider): void {
  providers.set(provider.id, provider);
}
