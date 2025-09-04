"use client";

import React, { createContext, useContext, useMemo, useState, FC, PropsWithChildren } from "react";
import { countTokens } from "@/app/lib/tokenService";

export type TokenTotals = {
  // Aggregated (for UI)
  inputTokens: number;
  inputCostUSD: number;
  outputTokens: number;
  outputCostUSD: number;
  totalCostUSD: number;
  // Detailed (kept for compatibility and potential debugging)
  inputTextTokens: number;
  inputTextCostUSD: number;
  outputTextTokens: number;
  outputTextCostUSD: number;
  inputAudioTokens: number;
  inputAudioCostUSD: number;
  outputAudioTokens: number;
  outputAudioCostUSD: number;
};

// Default model used by the Realtime session in this project
const DEFAULT_REALTIME_MODEL = "gpt-4o-realtime-preview-2025-06-03";

// Normalize model to pricing family keys from the provided table
function normalizeModel(model: string): string {
  const m = model.toLowerCase();
  if (m.startsWith("gpt-4o-realtime-preview")) return "gpt-4o-realtime-preview";
  if (m.startsWith("gpt-4o-mini-realtime-preview")) return "gpt-4o-mini-realtime-preview";
  if (m.startsWith("gpt-realtime")) return "gpt-realtime";
  if (m.startsWith("gpt-4.1")) return "gpt-4.1";
  // fallback to family used in this demo
  return "gpt-4o-realtime-preview";
}

// Pricing per 1M tokens in USD, from issue description
const TEXT_PRICING_PER_1M: Record<string, { input: number; output: number }> = {
  "gpt-realtime": { input: 4.0, output: 16.0 },
  "gpt-4o-realtime-preview": { input: 5.0, output: 20.0 },
  "gpt-4o-mini-realtime-preview": { input: 0.6, output: 2.4 },
  // Add gpt-4.1 family (approximate text-only rates; adjust if your account has different pricing)
  "gpt-4.1": { input: 5.0, output: 15.0 },
};

const AUDIO_PRICING_PER_1M: Record<string, { input: number; output: number }> = {
  "gpt-realtime": { input: 32.0, output: 64.0 },
  "gpt-4o-realtime-preview": { input: 40.0, output: 80.0 },
  "gpt-4o-mini-realtime-preview": { input: 10.0, output: 20.0 },
};

const TokenContext = createContext<{
  model: string;
  totals: TokenTotals;
  addInputText: (text: string, modelOverride?: string) => Promise<void>;
  addOutputText: (text: string, modelOverride?: string) => Promise<void>;
  addOutputTextTokensDelta: (delta: number, modelOverride?: string) => void;
  addInputAudioTranscript: (text: string, modelOverride?: string) => Promise<void>;
  addOutputAudioTranscript: (text: string, modelOverride?: string) => Promise<void>;
  addUsageFromResponse: (usage: any, meta?: { model?: string; modalities?: string[] }) => void;
  reset: () => void;
} | undefined>(undefined);

export const TokenProvider: FC<PropsWithChildren> = ({ children }) => {
  // Text token counters (sum across models)
  const [inputTextTokens, setInputTextTokens] = useState(0);
  const [outputTextTokens, setOutputTextTokens] = useState(0);
  // Audio token counters (sum across models)
  const [inputAudioTokens, setInputAudioTokens] = useState(0);
  const [outputAudioTokens, setOutputAudioTokens] = useState(0);

  // Cost accumulators per bucket (sum across models, priced at the moment of ingest)
  const [inputTextCostUSD, setInputTextCostUSD] = useState(0);
  const [outputTextCostUSD, setOutputTextCostUSD] = useState(0);
  const [inputAudioCostUSD, setInputAudioCostUSD] = useState(0);
  const [outputAudioCostUSD, setOutputAudioCostUSD] = useState(0);

  const totalCostUSD = useMemo(() => inputTextCostUSD + outputTextCostUSD + inputAudioCostUSD + outputAudioCostUSD, [inputTextCostUSD, outputTextCostUSD, inputAudioCostUSD, outputAudioCostUSD]);

  const addInputText = async (text: string, modelOverride?: string) => {
    if (!text?.trim()) return;
    try {
      const model = modelOverride || DEFAULT_REALTIME_MODEL;
      const tokens = await countTokens(text, model);
      setInputTextTokens((prev) => prev + tokens);
    } catch (err) {
      console.error("[TokenContext] addInputText failed", err);
    }
  };

  const addOutputText = async (text: string, modelOverride?: string) => {
    if (!text?.trim()) return;
    try {
      const model = modelOverride || DEFAULT_REALTIME_MODEL;
      const tokens = await countTokens(text, model);
      setOutputTextTokens((prev) => prev + tokens);
    } catch (err) {
      console.error("[TokenContext] addOutputText failed", err);
    }
  };

  const addOutputTextTokensDelta = (delta: number) => {
    if (!delta || delta < 0) return;
    setOutputTextTokens((prev) => prev + delta);
  };

  const addInputAudioTranscript = async (text: string, modelOverride?: string) => {
    if (!text?.trim()) return;
    try {
      const model = modelOverride || DEFAULT_REALTIME_MODEL;
      const tokens = await countTokens(text, model);
      setInputAudioTokens((prev) => prev + tokens);
    } catch (err) {
      console.error("[TokenContext] addInputAudioTranscript failed", err);
    }
  };

  const addOutputAudioTranscript = async (text: string, modelOverride?: string) => {
    if (!text?.trim()) return;
    try {
      const model = modelOverride || DEFAULT_REALTIME_MODEL;
      const tokens = await countTokens(text, model);
      setOutputAudioTokens((prev) => prev + tokens);
    } catch (err) {
      console.error("[TokenContext] addOutputAudioTranscript failed", err);
    }
  };

  const addUsageFromResponse = (usage: any, meta?: { model?: string; modalities?: string[] }) => {
    if (!usage || typeof usage !== 'object') return;

    // Prefer detailed breakdowns when present (newer Realtime events)
    let inText = usage?.input_token_details?.text_tokens as number | undefined;
    const inAudio = usage?.input_token_details?.audio_tokens as number | undefined;
    let outText = usage?.output_token_details?.text_tokens as number | undefined;
    const outAudio = usage?.output_token_details?.audio_tokens as number | undefined;

    // Backward-compat: some events may only include input_tokens/output_tokens totals
    // In that case, attribute totals to text buckets so cost still shows up (text-only models like gpt-4.1)
    if (typeof inText !== 'number' && typeof usage.input_tokens === 'number') {
      inText = usage.input_tokens;
    }
    if (typeof outText !== 'number' && typeof usage.output_tokens === 'number') {
      outText = usage.output_tokens;
    }

    // Determine pricing family by model (fallback to realtime default)
    const modelKey = normalizeModel(meta?.model || DEFAULT_REALTIME_MODEL);

    // Update token counters
    if (inText) setInputTextTokens((p) => p + inText);
    if (typeof inAudio === 'number') setInputAudioTokens((p) => p + inAudio);
    if (outText) setOutputTextTokens((p) => p + outText);
    if (typeof outAudio === 'number') setOutputAudioTokens((p) => p + outAudio);

    // Update cost accumulators using per-model pricing
    const textPricing = TEXT_PRICING_PER_1M[modelKey] || TEXT_PRICING_PER_1M[normalizeModel(DEFAULT_REALTIME_MODEL)];
    const audioPricing = AUDIO_PRICING_PER_1M[modelKey] || AUDIO_PRICING_PER_1M[normalizeModel(DEFAULT_REALTIME_MODEL)];

    if (inText && textPricing) setInputTextCostUSD((c) => c + (inText! / 1_000_000) * textPricing.input);
    if (typeof inAudio === 'number' && audioPricing) setInputAudioCostUSD((c) => c + (inAudio! / 1_000_000) * audioPricing.input);
    if (outText && textPricing) setOutputTextCostUSD((c) => c + (outText! / 1_000_000) * textPricing.output);
    if (typeof outAudio === 'number' && audioPricing) setOutputAudioCostUSD((c) => c + (outAudio! / 1_000_000) * audioPricing.output);
  };

  const reset = () => {
    setInputTextTokens(0);
    setOutputTextTokens(0);
    setInputAudioTokens(0);
    setOutputAudioTokens(0);
    setInputTextCostUSD(0);
    setOutputTextCostUSD(0);
    setInputAudioCostUSD(0);
    setOutputAudioCostUSD(0);
  };

  // Sync totals with server-side per-user cache (best-effort).
  // We compute deltas vs a local ref and POST to /api/spend. If unauthenticated, server returns 401 and we ignore.
  React.useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    // On mount, try to fetch server totals and initialize local counters to at least that amount.
    (async () => {
      try {
        const res = await fetch('/api/spend', { cache: 'no-store', signal: controller.signal });
        if (!res.ok) return; // likely 401 when signed out
        const data = await res.json();
        if (ignore) return;
        const t = data?.totals;
        if (t && typeof t === 'object') {
          // If server already has some totals, adopt them locally if higher to avoid double-count from refresh.
          if (typeof t.inputTextTokens === 'number') setInputTextTokens((p) => Math.max(p, t.inputTextTokens));
          if (typeof t.outputTextTokens === 'number') setOutputTextTokens((p) => Math.max(p, t.outputTextTokens));
          if (typeof t.inputAudioTokens === 'number') setInputAudioTokens((p) => Math.max(p, t.inputAudioTokens));
          if (typeof t.outputAudioTokens === 'number') setOutputAudioTokens((p) => Math.max(p, t.outputAudioTokens));
        }
      } catch {}
    })();

    return () => { ignore = true; controller.abort(); };
  }, []);

  const prevRef = React.useRef({ it: 0, ot: 0, ia: 0, oa: 0 });
  React.useEffect(() => {
    const delta = {
      inputTextTokens: Math.max(0, inputTextTokens - prevRef.current.it),
      outputTextTokens: Math.max(0, outputTextTokens - prevRef.current.ot),
      inputAudioTokens: Math.max(0, inputAudioTokens - prevRef.current.ia),
      outputAudioTokens: Math.max(0, outputAudioTokens - prevRef.current.oa),
    };
    const hasDelta = Object.values(delta).some((v) => v > 0);
    if (!hasDelta) return;

    prevRef.current = { it: inputTextTokens, ot: outputTextTokens, ia: inputAudioTokens, oa: outputAudioTokens };

    // Fire and forget; ignore errors (e.g., 401)
    fetch('/api/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ingest', delta }),
      keepalive: true,
    }).catch(() => {});
  }, [inputTextTokens, outputTextTokens, inputAudioTokens, outputAudioTokens]);

  const totals: TokenTotals = {
    // Aggregated
    inputTokens: inputTextTokens + inputAudioTokens,
    inputCostUSD: inputTextCostUSD + inputAudioCostUSD,
    outputTokens: outputTextTokens + outputAudioTokens,
    outputCostUSD: outputTextCostUSD + outputAudioCostUSD,
    totalCostUSD,
    // Detailed (still available for debugging/other views)
    inputTextTokens,
    inputTextCostUSD,
    outputTextTokens,
    outputTextCostUSD,
    inputAudioTokens,
    inputAudioCostUSD,
    outputAudioTokens,
    outputAudioCostUSD,
  };

  return (
    <TokenContext.Provider
      value={{
        model: DEFAULT_REALTIME_MODEL,
        totals,
        addInputText,
        addOutputText,
        addOutputTextTokensDelta,
        addInputAudioTranscript,
        addUsageFromResponse, 
        addOutputAudioTranscript,
        reset,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export function useToken() {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error("useToken must be used within a TokenProvider");
  return ctx;
}
