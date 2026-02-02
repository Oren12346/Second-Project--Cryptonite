export type CoinDetails = {
  id: string;
  name: string;
  symbol: string;
  image?: { small?: string; large?: string };
  market_data?: {
    current_price?: { usd?: number; eur?: number; ils?: number };
    market_cap?: { usd?: number; eur?: number; ils?: number };
    price_change_percentage_24h?: number;
  };
  description?: { en?: string };
};

const CACHE_PREFIX = "cg_coin_details_cache_v1:";
const TTL = 60_000; // 60 seconds

const inFlight: Record<string, Promise<CoinDetails> | undefined> = {};

async function fetchWithBackoff(
  url: string,
  init?: RequestInit,
  retries = 3
): Promise<Response> {
  let delay = 1000;

  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, init);

    if (res.status !== 429) return res;

    await new Promise((r) => setTimeout(r, delay));
    delay *= 2;
  }

  return fetch(url, init);
}

export async function fetchCoinDetailsApi(coinId: string): Promise<CoinDetails> {
  const id = encodeURIComponent(coinId);
  const cacheKey = `${CACHE_PREFIX}${id}`;

  // 1) Cache
  const cachedRaw = localStorage.getItem(cacheKey);
  if (cachedRaw) {
    const cached = JSON.parse(cachedRaw) as { time: number; data: CoinDetails };
    if (Date.now() - cached.time < TTL) return cached.data;
  }

  // 2) In-flight guard
  const existing = inFlight[id];
  if (existing) return existing;

  // 3) Use Vite proxy (/cg) to avoid CORS and unify requests
  const url =
    `/cg/api/v3/coins/${id}` +
    `?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

  const headers: HeadersInit = {};
  const demoKey = import.meta.env.VITE_CG_DEMO_KEY;
  if (demoKey) {
    headers["x-cg-demo-api-key"] = demoKey;
  }

  const request = (async () => {
    try {
      const res = await fetchWithBackoff(url, { headers });

      if (res.status === 429) {
        throw new Error(
          "Rate limit (429) from CoinGecko. Please wait ~60 seconds and try again."
        );
      }

      if (!res.ok) {
        // Keeps the real status visible (404 / 500 / etc.)
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as CoinDetails;

      // Save cache
      localStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data }));

      return data;
    } finally {
      delete inFlight[id];
    }
  })();

  inFlight[id] = request;
  return request;
}
