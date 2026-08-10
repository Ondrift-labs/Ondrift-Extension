import type { HistoryAggregates, HistoryEntry, HistoryQuery, SiteId } from "../shared/types";

const DB_NAME = "ondrift";
const DB_VERSION = 1;
const STORE_NAME = "history";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export class HistoryStore {
  private database?: Promise<IDBDatabase>;

  constructor(
    private readonly factory?: IDBFactory,
    private readonly dbName = DB_NAME,
  ) {}

  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    this.database = new Promise((resolve, reject) => {
      const request = (this.factory ?? indexedDB).open(this.dbName, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("createdAt", "createdAt");
        store.createIndex("service", "service");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open local history"));
      request.onblocked = () => reject(new Error("Local history upgrade is blocked"));
    });
    return this.database;
  }

  async add(entry: HistoryEntry): Promise<number> {
    const database = await this.open();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const result = await requestResult(transaction.objectStore(STORE_NAME).add(entry));
    await transactionDone(transaction);
    return Number(result);
  }

  async list(query: HistoryQuery = {}): Promise<HistoryEntry[]> {
    const entries = await this.allEntries();
    const needle = query.search?.trim().toLocaleLowerCase();
    const filtered = entries
      .filter((entry) => !query.service || entry.service === query.service)
      .filter((entry) => !needle || [entry.originalText, entry.improvedText, entry.rationale]
        .some((value) => value?.toLocaleLowerCase().includes(needle)))
      .sort((a, b) => b.createdAt - a.createdAt);
    const offset = Math.max(0, query.offset ?? 0);
    const limit = Math.min(500, Math.max(1, query.limit ?? 50));
    return filtered.slice(offset, offset + limit);
  }

  private async allEntries(): Promise<HistoryEntry[]> {
    const database = await this.open();
    const transaction = database.transaction(STORE_NAME, "readonly");
    const entries = await requestResult(transaction.objectStore(STORE_NAME).getAll()) as HistoryEntry[];
    await transactionDone(transaction);
    return entries;
  }

  async delete(id: number): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    await transactionDone(transaction);
  }

  async clear(): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    await transactionDone(transaction);
  }

  async aggregates(): Promise<HistoryAggregates> {
    const entries = await this.allEntries();
    const scores = entries.flatMap((entry) => typeof entry.score === "number" ? [entry.score] : []);
    const rewritesApplied = entries.filter((entry) => entry.applied).length;
    const byService: Record<SiteId, number> = { chatgpt: 0, claude: 0, gemini: 0, perplexity: 0 };
    for (const entry of entries) byService[entry.service] += 1;
    return {
      totalPrompts: entries.length,
      rewritesApplied,
      adoptionRate: entries.length ? rewritesApplied / entries.length : 0,
      averageScore: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
      totalTokens: entries.reduce((sum, entry) => sum + (entry.usageMetadata?.totalTokenCount ?? 0), 0),
      byService,
    };
  }
}

export const historyStore = new HistoryStore();
