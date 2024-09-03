import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

const NDKSlice = createSlice({
  name: "ndk",
  initialState,
  reducers: {
    initNDK(state, action) {
      return action.payload;
    },
  },
});

export const { initNDK } = NDKSlice.actions;

export default NDKSlice.reducer;
