import { configureStore } from "@reduxjs/toolkit";
import { coinsReducer } from "./coins/coinsSlice";
import { coinDetailsReducer } from "./coins/CoinDetail/coinDetailsSlice";
import { selectedCoinsReducer } from "./selectedCoins/selectedCoinsSlice";

export const store = configureStore({
  reducer: {
    coins: coinsReducer,
    coinDetails: coinDetailsReducer,
    selectedCoins: selectedCoinsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;