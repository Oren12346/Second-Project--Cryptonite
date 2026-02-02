import type { Coin } from "../models/Coin";

/**
 * Fetches the top 100 cryptocurrencies by market cap (USD)
 * from the CoinGecko API.
 */
export async function fetchTopCoins(): Promise<Coin[]> {
  const url =
  "/cg/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";;

  const res = await fetch(url);

  // If the response is not OK, throw an error
  if (!res.ok) {
    throw new Error("Failed to fetch coins");
  }

  const data = await res.json();

  // Map only the required fields for the project
  return data.map((c: any) => ({
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    image: c.image,
  })) as Coin[];
}
