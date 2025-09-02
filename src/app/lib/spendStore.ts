// Simple in-memory per-user spend store with TTL.
// Not for production use (shared across requests only within a single server process).

export type SpendTotals = {
  // token counts
  inputTextTokens: number;
  outputTextTokens: number;
  inputAudioTokens: number;
  outputAudioTokens: number;
  // server bookkeeping
  updatedAt: number; // ms epoch
};

export type SpendDelta = Partial<Pick<SpendTotals, 'inputTextTokens' | 'outputTextTokens' | 'inputAudioTokens' | 'outputAudioTokens'>>;

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

const store = new Map<string, SpendTotals>();

function isExpired(rec: SpendTotals, ttlMs: number) {
  return Date.now() - rec.updatedAt > ttlMs;
}

export function getSpend(userId: string, ttlMs: number = DEFAULT_TTL_MS): SpendTotals {
  const existing = store.get(userId);
  if (existing && !isExpired(existing, ttlMs)) return existing;
  const fresh: SpendTotals = { inputTextTokens: 0, outputTextTokens: 0, inputAudioTokens: 0, outputAudioTokens: 0, updatedAt: Date.now() };
  store.set(userId, fresh);
  return fresh;
}

export function addSpend(userId: string, delta: SpendDelta, ttlMs: number = DEFAULT_TTL_MS): SpendTotals {
  const rec = getSpend(userId, ttlMs);
  rec.inputTextTokens += delta.inputTextTokens ?? 0;
  rec.outputTextTokens += delta.outputTextTokens ?? 0;
  rec.inputAudioTokens += delta.inputAudioTokens ?? 0;
  rec.outputAudioTokens += delta.outputAudioTokens ?? 0;
  rec.updatedAt = Date.now();
  store.set(userId, rec);
  return rec;
}

export function resetSpend(userId: string) {
  const fresh: SpendTotals = { inputTextTokens: 0, outputTextTokens: 0, inputAudioTokens: 0, outputAudioTokens: 0, updatedAt: Date.now() };
  store.set(userId, fresh);
  return fresh;
}
