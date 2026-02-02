// server/index.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function toNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Very simple heuristic to generate a mock recommendation
 * based on market data (NOT financial advice).
 */
function getMockRecommendation(coinData) {
    const price = toNumber(coinData.current_price_usd);
    const cap = toNumber(coinData.market_cap_usd);
    const vol = toNumber(coinData.volume_24h_usd);
    const ch30 = toNumber(coinData.price_change_percentage_30d_in_currency);
    const ch60 = toNumber(coinData.price_change_percentage_60d_in_currency);
    const ch200 = toNumber(coinData.price_change_percentage_200d_in_currency);

    // Simple rules (you can keep them as-is)
    const positiveTrend = ch30 > 0 && ch60 > 0;
    const strongCap = cap > 1_000_000_000; // 1B+
    const goodLiquidity = vol > 50_000_000; // 50M+
    const longTermDown = ch200 < 0;

    let verdict = "DON'T BUY";
    let reason =
       "Current market indicators do not provide a clear or strong signal in favor of buying. Given the uncertainty and volatility in the crypto market, a cautious approach is recommended at this time.";
    if (positiveTrend && (strongCap || goodLiquidity) && !longTermDown) {
        verdict = "BUY";
        reason =
            "Based on recent 30 and 60 day market trends, the asset demonstrates positive momentum along with healthy trading activity. These indicators may suggest a potential buying opportunity, although overall market volatility should still be taken into account.";
    } else if (longTermDown) {
        verdict = "DON'T BUY";
        reason =
            "Although there has been some recent price movement, the long-term 200 day trend remains negative. This may indicate sustained weakness and increased long-term risk, making the asset less attractive at this time.";
    } else if (!goodLiquidity) {
        verdict = "DON'T BUY";
        reason =
           "The current trading volume is relatively low, which may reduce liquidity and increase the risk of sharp price fluctuations. Lower liquidity can make the asset more difficult to trade efficiently.";
        verdict = "DON'T BUY";
        reason =
             "The asset has a relatively small market capitalization compared to more established cryptocurrencies. Smaller market caps are generally associated with higher volatility and elevated investment risk.";
    }

    const rawText = JSON.stringify(
        {
            verdict,
            reason,
            data_used: { price, cap, vol, ch30, ch60, ch200 },
            note: "Mock response for project submission (no OpenAI key required).",
        },
        null,
        2
    );

    return { verdict, reason, rawText };
}

app.post("/api/ai/recommendation", (req, res) => {
    const coinData = req.body ?? {};
    const coinName = String(coinData.name ?? "").trim();

    if (!coinName) {
        return res.status(400).json({ error: "Invalid request: missing coin name." });
    }

    const result = getMockRecommendation(coinData);
    return res.status(200).json(result);
});

app.listen(PORT, () => {
    console.log(`✅ Mock AI server running on http://127.0.0.1:${PORT}`);
});
