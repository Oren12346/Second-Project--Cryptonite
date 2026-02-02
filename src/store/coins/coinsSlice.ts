// src/store/coins/coinsSlice.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Coin } from "../../models/Coin";

// Adjust to your actual state shape if needed
type CoinsState = {
  items: Coin[];
  isLoading: boolean;
  error: string | null;
};

const initialState: CoinsState = {
  items: [],
  isLoading: false,
  error: null,
};

export const loadCoins = createAsyncThunk<Coin[]>(
  "coins/loadCoins",
  async () => {
    // Cooldown key to prevent 429 spam loops
    const COOLDOWN_KEY = "cg_markets_cooldown_until";

    const cooldownUntilRaw = localStorage.getItem(COOLDOWN_KEY);
    const cooldownUntil = cooldownUntilRaw ? Number(cooldownUntilRaw) : 0;

    if (cooldownUntil && Date.now() < cooldownUntil) {
      throw new Error("Rate limit (429). Please wait about 60 seconds and try again.");
    }

    // Cache to reduce 429 (rate limit)
    const CACHE_KEY = "cg_markets_cache_v1";
    const TTL = 60_000; // 60 seconds

    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as { time: number; data: Coin[] };
      if (Date.now() - cached.time < TTL) return cached.data;
    }

    const url =
      "/cg/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";

    const res = await fetch(url);

    if (res.status === 429) {
      // Set a 60s cooldown to prevent spamming the API
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() + 60_000));
      throw new Error("Rate limit (429) from CoinGecko. Wait 60 seconds and try again.");
    }

    if (!res.ok) {
      throw new Error(`CoinGecko error: HTTP ${res.status}`);
    }

    const data = (await res.json()) as Coin[];

    localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data }));
    return data;
  }
);

const coinsSlice = createSlice({
  name: "coins",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadCoins.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadCoins.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(loadCoins.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? "Failed to load coins";
      });
  },
});

export const coinsReducer = coinsSlice.reducer;
