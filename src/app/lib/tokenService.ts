export async function countTokens(text: string, model?: string): Promise<number> {
  try {
    const res = await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model }),
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Token API error: ${res.status}`);
    }
    const data = await res.json();
    const tokens = typeof data?.tokens === 'number' ? data.tokens : 0;
    return tokens;
  } catch (err) {
    console.error('[countTokens] falling back to heuristic', err);
    // Fallback heuristic: ~4 chars per token
    const approx = Math.ceil(text.length / 4);
    return approx;
  }
}
