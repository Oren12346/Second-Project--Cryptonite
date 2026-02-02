import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const STORAGE_KEY = "selectedCoins";

function loadFromStorage(): string[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    const arr = json ? (JSON.parse(json) as unknown) : [];
    if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) return arr;
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

type State = {
  ids: string[]; // coin ids (max 5)
};

const initialState: State = {
  ids: loadFromStorage(),
};

const slice = createSlice({
  name: "selectedCoins",
  initialState,
  reducers: {
    addSelected(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.ids.includes(id)) return;
      if (state.ids.length >= 5) return; // handled by dialog in UI
      state.ids.push(id);
      saveToStorage(state.ids);
    },
    removeSelected(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.ids = state.ids.filter((x) => x !== id);
      saveToStorage(state.ids);
    },
    replaceSelected(state, action: PayloadAction<{ removeId: string; addId: string }>) {
      const { removeId, addId } = action.payload;
      state.ids = state.ids.filter((x) => x !== removeId);
      if (!state.ids.includes(addId)) state.ids.push(addId);
      state.ids = state.ids.slice(0, 5);
      saveToStorage(state.ids);
    },
  },
});

export const { addSelected, removeSelected, replaceSelected } = slice.actions;
export const selectedCoinsReducer = slice.reducer;
