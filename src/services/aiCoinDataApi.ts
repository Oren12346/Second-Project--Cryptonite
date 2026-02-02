// src/services/aiCoinDataApi.ts

export type AiCoinPromptData = {
  name: string;
  current_price_usd: number;
  market_cap_usd: number;
  volume_24h_usd: number;
  price_change_percentage_30d_in_currency: number;
  price_change_percentage_60d_in_currency: number;
  price_change_percentage_200d_in_currency: number;
};

const CACHE_PREFIX = "cg_ai_coin_cache_v1:";
const TTL = 60_000; // 60 seconds

// Prevent duplicate parallel requests for the same coin
const inFlight: Record<string, Promise<AiCoinPromptData> | undefined> = {};

// Small helper
const safeNumber = (v: unknown) => (typeof v === "number" ? v : 0);

// Exponential backoff for 429
async function fetchWithBackoff(
  url: string,
  init?: RequestInit,
  retries = 3
): Promise<Response> {
  let delay = 1000;

  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, init);

    if (res.status !== 429) return res;

    // Wait and retry
    await new Promise((r) => setTimeout(r, delay));
    delay *= 2;
  }

  // Last attempt (let it fail if still 429)
  return fetch(url, init);
}

export async function fetchAiCoinPromptData(
  coinId: string
): Promise<AiCoinPromptData> {
  const key = `${CACHE_PREFIX}${coinId}`;

  // 1️⃣ Cache (localStorage)
  const cachedRaw = localStorage.getItem(key);
  if (cachedRaw) {
    const cached = JSON.parse(cachedRaw) as {
      time: number;
      data: AiCoinPromptData;
    };
    if (Date.now() - cached.time < TTL) return cached.data;
  }

  // 2️⃣ In-flight guard (avoid duplicate requests)
  const existing = inFlight[coinId];
  if (existing) {
    return existing;
  }

  const url =
    `/cg/api/v3/coins/${encodeURIComponent(coinId)}` +
    `?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

  const headers: HeadersInit = {};

  // Optional CoinGecko demo API key (recommended)
  const demoKey = import.meta.env.VITE_CG_DEMO_KEY;
  if (demoKey) {
    headers["x-cg-demo-api-key"] = demoKey;
  }

  const request = (async () => {
    try {
      const res = await fetchWithBackoff(url, { headers });

      if (res.status === 429) {
        throw new Error(
          "CoinGecko rate limit reached (429). Please wait ~60 seconds."
        );
      }
      if (!res.ok) {
        throw new Error(`CoinGecko error: HTTP ${res.status}`);
      }

      const json = (await res.json()) as any;
      const md = json?.market_data;

      const data: AiCoinPromptData = {
        name: String(json?.name ?? coinId),
        current_price_usd: safeNumber(md?.current_price?.usd),
        market_cap_usd: safeNumber(md?.market_cap?.usd),
        volume_24h_usd: safeNumber(md?.total_volume?.usd),
        price_change_percentage_30d_in_currency: safeNumber(
          md?.price_change_percentage_30d_in_currency?.usd
        ),
        price_change_percentage_60d_in_currency: safeNumber(
          md?.price_change_percentage_60d_in_currency?.usd
        ),
        price_change_percentage_200d_in_currency: safeNumber(
          md?.price_change_percentage_200d_in_currency?.usd
        ),
      };

      // Save to cache
      localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));

      return data;
    } finally {
      // Always clear in-flight slot
      delete inFlight[coinId];
    }
  })();

  inFlight[coinId] = request;
  return request;
}
