// src/services/openAiApi.ts
import type { AiCoinPromptData } from "./aiCoinDataApi";

export type AiRecommendationResult = {
  verdict: "BUY" | "DON'T BUY";
  reason: string;
  rawText: string;
};

export async function fetchAiRecommendation(
  data: AiCoinPromptData
): Promise<AiRecommendationResult> {
  const res = await fetch("/api/ai/recommendation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    // Try to capture server error details for debugging
    const errorText = await res.text().catch(() => "");
    throw new Error(`AI error: HTTP ${res.status} ${errorText}`);
  }

  return (await res.json()) as AiRecommendationResult;
}
