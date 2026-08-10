import type { SiteAdapter } from "../adapters/site-adapter";
import type { RewriteResult } from "../shared/types";
import { adapterRegistry, type AdapterRegistry } from "./adapter-registry";
import { observeInput } from "./input-observer";
import { RewriteSession } from "./rewrite-flow";

export interface ContentState {
  adapter: SiteAdapter;
  input: HTMLElement | null;
  result?: RewriteResult;
  status: "idle" | "rewriting" | "ready" | "error";
  error?: Error;
}

type StateListener = (state: ContentState) => void;

export class ContentController {
  private state?: ContentState;
  private session?: RewriteSession;
  private stopObserving?: () => void;
  private stopHistory?: () => void;
  private readonly listeners = new Set<StateListener>();

  constructor(private readonly registry: AdapterRegistry = adapterRegistry) {}

  start(url = location.href): boolean {
    this.stop();
    const adapter = this.registry.resolve(url);
    if (!adapter) return false;
    this.session = new RewriteSession(adapter);
    this.stopHistory = this.session.startHistoryCapture();
    this.state = { adapter, input: adapter.getInputElement(), status: "idle" };
    this.stopObserving = observeInput(() => adapter.getInputElement(), (input) => {
      this.setState({ input });
    });
    this.emit();
    return true;
  }

  stop(): void {
    this.stopObserving?.();
    this.stopHistory?.();
    this.stopObserving = undefined;
    this.stopHistory = undefined;
    this.session = undefined;
    this.state = undefined;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    if (this.state) listener(this.state);
    return () => this.listeners.delete(listener);
  }

  async rewrite(persona?: string): Promise<RewriteResult> {
    if (!this.session) throw new Error("Ondrift does not support this page.");
    this.setState({ status: "rewriting", result: undefined, error: undefined });
    try {
      const result = await this.session.rewrite(persona);
      this.setState({ status: "ready", result });
      return result;
    } catch (error) {
      this.setState({ status: "error", error: error instanceof Error ? error : new Error("Rewrite failed") });
      throw error;
    }
  }

  async apply(): Promise<void> {
    if (!this.session) throw new Error("Ondrift does not support this page.");
    await this.session.apply();
    this.setState({ status: "idle" });
  }

  private setState(patch: Partial<ContentState>): void {
    if (!this.state) return;
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  private emit(): void {
    if (!this.state) return;
    for (const listener of this.listeners) listener(this.state);
  }
}

export const contentController = new ContentController();
