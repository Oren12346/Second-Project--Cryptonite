import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchCoinDetailsApi } from "../../../services/coinDetailsApi";
import type { CoinDetails } from "../../../services/coinDetailsApi";

type Entry = {
  details: CoinDetails;
  fetchedAt: number;
};

type Status = "idle" | "loading" | "succeeded" | "failed";

type State = {
  byId: Record<string, Entry>;
  statusById: Record<string, Status>;
  errorById: Record<string, string | null>;
};

const initialState: State = {
  byId: {},
  statusById: {},
  errorById: {},
};

export const loadCoinDetails = createAsyncThunk(
  "coinDetails/loadCoinDetails",
  async (coinId: string, { getState }) => {
    const state = getState() as { coinDetails: State };
    const cached = state.coinDetails.byId[coinId];
    const now = Date.now();

    // Use cache for 2 minutes
    if (cached && now - cached.fetchedAt < 120_000) {
      return { coinId, details: cached.details, fromCache: true };
    }

    const details = await fetchCoinDetailsApi(coinId);
    return { coinId, details, fromCache: false };
  },
  {
    // ✅ Prevent duplicate requests for SAME coin while it's loading
    condition: (coinId: string, { getState }) => {
      const state = getState() as { coinDetails: State };
      return state.coinDetails.statusById[coinId] !== "loading";
    },
  }
);

const slice = createSlice({
  name: "coinDetails",
  initialState,
  reducers: {
    clearCoinDetails(state, action: { payload: string }) {
      const id = action.payload;
      delete state.byId[id];
      delete state.statusById[id];
      delete state.errorById[id];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCoinDetails.pending, (state, action) => {
        const id = action.meta.arg;
        state.statusById[id] = "loading";
        state.errorById[id] = null;
      })
      .addCase(loadCoinDetails.fulfilled, (state, action) => {
        const { coinId, details } = action.payload as {
          coinId: string;
          details: CoinDetails;
          fromCache: boolean;
        };

        state.byId[coinId] = {
          details,
          fetchedAt: Date.now(),
        };

        state.statusById[coinId] = "succeeded";
        state.errorById[coinId] = null;
      })
      .addCase(loadCoinDetails.rejected, (state, action) => {
        const id = action.meta.arg;
        state.statusById[id] = "failed";

        const msg = action.error.message ?? "Error loading coin details";

        // ✅ Friendly messages for common issues you saw:
        if (msg.includes("429")) {
          state.errorById[id] = "Too many requests. Please try again in a minute.";
          return;
        }

        if (msg.toLowerCase().includes("failed to fetch")) {
          // Usually CORS / network blocked / offline
          state.errorById[id] =
            "Failed to load coin data please try again later.";
          return;
        }

        state.errorById[id] = msg;
      });
  },
});

export const { clearCoinDetails } = slice.actions;
export const coinDetailsReducer = slice.reducer;