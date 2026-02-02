// server/server.ts
import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

// 1️⃣ Load env FIRST
dotenv.config({ path: ".env.local" });

// 2️⃣ Create app BEFORE using it
const app = express();

app.use(cors());
app.use(express.json());

// 3️⃣ Single AI recommendation endpoint (NO DUPLICATES)
app.post("/api/ai/recommendation", async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Missing OPENAI_API_KEY in .env.local" });
    }

    const data = req.body;
    if (!data?.name) {
      return res
        .status(400)
        .json({ error: "Invalid body: missing name" });
    }

    const systemPrompt = [
      "You are a crypto market analyst assistant.",
      "Return ONLY valid JSON. No markdown, no extra text.",
      'JSON format: {"verdict":"BUY"|"DON\'T BUY","reason":"2-5 sentences"}',
      "Mention risk briefly. Not financial advice.",
    ].join(" ");

    const userPrompt = {
      task: "Decide whether the user should buy this coin now.",
      coin_data: data,
    };

    const openAiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(userPrompt) },
          ],
        }),
      }
    );

    if (!openAiRes.ok) {
      const errText = await openAiRes.text().catch(() => "");
      return res.status(502).json({
        error: `OpenAI error: HTTP ${openAiRes.status}`,
        details: errText.slice(0, 800),
      });
    }

    const json: any = await openAiRes.json();
    const rawText: string =
      json?.choices?.[0]?.message?.content ?? "";

    try {
      const parsed = JSON.parse(rawText) as {
        verdict: string;
        reason: string;
      };

      const verdict =
        String(parsed.verdict).toUpperCase() === "BUY"
          ? "BUY"
          : "DON'T BUY";

      const reason = String(parsed.reason).trim();

      return res.json({ verdict, reason, rawText });
    } catch {
      // Fallback if model returns invalid JSON
      return res.json({
        verdict: rawText.toUpperCase().includes("BUY")
          ? "BUY"
          : "DON'T BUY",
        reason:
          "AI response was not valid JSON. Showing fallback interpretation.",
        rawText,
      });
    }
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: err?.message ?? "Server error" });
  }
});

// 4️⃣ Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`AI server running on http://localhost:${PORT}`);
});
