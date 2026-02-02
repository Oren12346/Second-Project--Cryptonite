// api/ai/recommendation.ts
// Minimal placeholder endpoint.
// IMPORTANT:
// To avoid duplication, all AI recommendation logic + wording lives in:
//   src/services/aiRecommendationApi.ts
// This endpoint is intentionally disabled in mock mode and kept only for
// optional future server-side AI integration (e.g., real AI / Express).

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST() {
  // 501 = Not Implemented (clear signal that this endpoint is intentionally disabled)
  return jsonResponse(
    {
      error:
        "Server-side AI endpoint is disabled to avoid duplication. " +
        "Use the client-side mock in src/services/aiRecommendationApi.ts.",
    },
    501
  );
}

export async function GET() {
  return jsonResponse({ error: "Use POST." }, 405);
}
