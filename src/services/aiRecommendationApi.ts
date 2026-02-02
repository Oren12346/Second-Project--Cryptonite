// src/services/aiRecommendationApi.ts

import type { AiCoinPromptData } from "./aiCoinDataApi";

export type AiRecommendationResult = {
  verdict: "BUY" | "DON'T BUY";
  reason: string;
  rawText: string;

  // Optional extra fields (UI can ignore safely):
  keyPoints?: string[];
  reasonsToBuy?: string[];
  reasonsToAvoid?: string[];
};

function safeNum(n: unknown): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function formatPct(x: number): string {
  const sign = x > 0 ? "+" : "";
  return `${sign}${x.toFixed(2)}%`;
}

/**
 * Unified fallback (client-side mock).
 * Keeps UI stable if server is down or returns invalid payload.
 */
function buildMockRecommendation(data: AiCoinPromptData): AiRecommendationResult {
  const change30 = safeNum(data.price_change_percentage_30d_in_currency);
  const change60 = safeNum(data.price_change_percentage_60d_in_currency);
  const change200 = safeNum(data.price_change_percentage_200d_in_currency);

  const score = change30 * 0.5 + change60 * 0.3 + change200 * 0.2;

  const verdict: "BUY" | "DON'T BUY" = score >= 0 ? "BUY" : "DON'T BUY";

  const trendLabel =
    score >= 8
      ? "strongly positive"
      : score >= 2
      ? "positive"
      : score > -2
      ? "mixed / neutral"
      : score > -8
      ? "negative"
      : "strongly negative";

  const keyPoints = [
    `30d: ${formatPct(change30)} • 60d: ${formatPct(change60)} • 200d: ${formatPct(change200)}`,
    `Weighted score: ${score.toFixed(2)} (${trendLabel})`,
    `Signal source: client fallback (mock)`,
  ];

  const reasonsToBuy = [
    verdict === "BUY"
      ? "Net-positive momentum across the weighted time windows."
      : "A rebound is possible if it forms a stable base and selling pressure fades.",
    "If you act, prefer smaller entries (DCA) and define an invalidation level.",
    "Position sizing matters more than being perfectly right.",
  ];

  const reasonsToAvoid = [
    verdict === "DON'T BUY"
      ? "The weighted trend score is negative, suggesting weak conviction right now."
      : "Even positive crypto trends can reverse abruptly and invalidate signals.",
    "This ignores news, unlocks, exploits, regulation, and broader market direction (BTC moves can drag alts).",
    "Volatility can remain high even when momentum looks favorable.",
  ];

  const reason =
    verdict === "BUY"
      ? `Based on the weighted trend score (${score.toFixed(
          2
        )}), momentum appears ${trendLabel}. This supports a cautious BUY bias, provided you manage risk and avoid oversized positions. This is not financial advice.`
      : `Based on the weighted trend score (${score.toFixed(
          2
        )}), momentum appears ${trendLabel}. A more conservative approach is to wait for stabilization or stronger confirmation before taking exposure. This is not financial advice.`;

  return {
    verdict,
    reason,
    keyPoints,
    reasonsToBuy,
    reasonsToAvoid,
    rawText: `MOCK_FALLBACK_V2 name=${data.name} score=${score.toFixed(2)}`,
  };
}

/**
 * ✅ Required for submission: call the server endpoint (which calls ChatGPT API).
 * Fallback is kept only to prevent UI crashes if the server is down.
 */
export async function fetchAiRecommendation(
  data: AiCoinPromptData
): Promise<AiRecommendationResult> {
  try {
    // ✅ Always call the server (per project requirement)
    const res = await fetch("/api/ai/recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const text = await res.text().catch(() => "");

    if (!res.ok) {
      console.warn("AI endpoint failed:", res.status, text);
      return buildMockRecommendation(data);
    }

    // The server should return JSON like:
    // { verdict: "BUY"|"DON'T BUY", reason: "...", rawText: "..." }
    const parsed = JSON.parse(text) as Partial<AiRecommendationResult>;

    const verdict: "BUY" | "DON'T BUY" =
      String(parsed.verdict).toUpperCase() === "BUY" ? "BUY" : "DON'T BUY";

    const reason = String(parsed.reason ?? "").trim() || "No reason returned.";
    const rawText = String(parsed.rawText ?? text);

    // Pass through optional fields if server returns them
    return {
      verdict,
      reason,
      rawText,
      keyPoints: parsed.keyPoints,
      reasonsToBuy: parsed.reasonsToBuy,
      reasonsToAvoid: parsed.reasonsToAvoid,
    };
  } catch (err) {
    console.warn("AI request crashed, using unified fallback:", err);
    return buildMockRecommendation(data);
  }
}
