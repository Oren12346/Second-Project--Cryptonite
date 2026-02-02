// src/services/cryptoCompareHistoryApi.ts

export type HistoItem = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

type HistoResponse = {
  Data?: { Data?: HistoItem[] };
};

export async function fetchMinuteOHLC(symbol: string, limit = 40): Promise<HistoItem[]> {
  const url =
    `https://min-api.cryptocompare.com/data/v2/histominute` +
    `?fsym=${encodeURIComponent(symbol)}` +
    `&tsym=USD&limit=${limit}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`History request failed: ${res.status}`);
  }

  const json = (await res.json()) as HistoResponse;
  const rows = json?.Data?.Data;

  if (!Array.isArray(rows)) return [];

  return rows.filter(
    (r) =>
      typeof r.time === "number" &&
      typeof r.open === "number" &&
      typeof r.high === "number" &&
      typeof r.low === "number" &&
      typeof r.close === "number"
  );
}