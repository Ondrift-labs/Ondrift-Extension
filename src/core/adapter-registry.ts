import type { SiteAdapter } from "../adapters/site-adapter";
import { ChatGptAdapter } from "../adapters/chatgpt.adapter";
import { ClaudeAdapter } from "../adapters/claude.adapter";
import { GeminiAdapter } from "../adapters/gemini.adapter";
import { GrokAdapter } from "../adapters/grok.adapter";
import { PerplexityAdapter } from "../adapters/perplexity.adapter";

export class AdapterRegistry {
  private readonly adapters: SiteAdapter[] = [];

  constructor(adapters: SiteAdapter[] = [
    new ChatGptAdapter(),
    new ClaudeAdapter(),
    new GeminiAdapter(),
    new PerplexityAdapter(),
    new GrokAdapter(),
  ]) {
    adapters.forEach((adapter) => this.register(adapter));
  }

  register(adapter: SiteAdapter): void {
    const existing = this.adapters.findIndex(({ id }) => id === adapter.id);
    if (existing >= 0) this.adapters.splice(existing, 1, adapter);
    else this.adapters.push(adapter);
  }

  resolve(url = location.href): SiteAdapter | null {
    return this.adapters.find((adapter) => adapter.matches(url)) ?? null;
  }

  list(): readonly SiteAdapter[] { return this.adapters; }
}

export const adapterRegistry = new AdapterRegistry();
