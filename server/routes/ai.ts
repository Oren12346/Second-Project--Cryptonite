import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// 🔹 Minimal OpenAI response type (only what we access)
type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

router.post("/recommendation", async (req, res) => {
  try {
    const d = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const prompt = `
You are a cautious crypto analyst.

Return:
1) Verdict: BUY or DON'T BUY
2) Reason: one clear paragraph

Data:
name: ${d.name}
current_price_usd: ${d.current_price_usd}
market_cap_usd: ${d.market_cap_usd}
volume_24h_usd: ${d.volume_24h_usd}
price_change_percentage_30d_in_currency: ${d.price_change_percentage_30d_in_currency}
price_change_percentage_60d_in_currency: ${d.price_change_percentage_60d_in_currency}
price_change_percentage_200d_in_currency: ${d.price_change_percentage_200d_in_currency}
`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    if (!r.ok) {
      return res.status(r.status).json({ error: "OpenAI failed" });
    }

    // 🔹 FIX: cast json() from unknown to typed response
    const json = (await r.json()) as OpenAiChatResponse;

    const text =
      json.choices?.[0]?.message?.content ?? "";

    const verdict = text.includes("DON'T BUY")
      ? "DON'T BUY"
      : "BUY";

    res.json({
      verdict,
      reason: text,
      rawText: text,
    });
  } catch {
    res.status(500).json({ error: "AI error" });
  }
});

export default router;
