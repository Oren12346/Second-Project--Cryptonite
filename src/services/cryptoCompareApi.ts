// src/services/cryptoCompareApi.ts

/**
 * CryptoCompare "pricemulti" endpoint base URL.
 * We query multiple symbols at once and receive USD prices.
 */
const BASE_URL = "https://min-api.cryptocompare.com/data/pricemulti";

export type CryptoComparePriceResponse = Record<
  string,
  {
    USD?: number;
  }
>;

/**
 * Fetch live USD prices for a list of coin symbols (e.g., ["BTC","ETH"]).
 * Throws an error on network issues / non-OK responses.
 */
export async function fetchUsdPricesForSymbols(
  symbols: string[]
): Promise<CryptoComparePriceResponse> {
  if (symbols.length === 0) return {};

  const fsyms = symbols.join(",");
  const url = `${BASE_URL}?fsyms=${encodeURIComponent(fsyms)}&tsyms=USD`;

  const res = await fetch(url);

  if (!res.ok) {
    // Keep message readable for UI display/logging
    throw new Error(`CryptoCompare error: HTTP ${res.status}`);
  }

  const data = (await res.json()) as CryptoComparePriceResponse;
  return data;
}