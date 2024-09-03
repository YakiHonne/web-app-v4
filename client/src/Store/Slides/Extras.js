import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

const initDMSSlice = createSlice({
  name: "initDMS",
  initialState,
  reducers: {
    setInitDMS(state, action) {
      return action.payload;
    },
  },
});
const isDarkModeSlice = createSlice({
  name: "isDarkMode",
  initialState: localStorage.getItem("yaki-theme") || "0",
  reducers: {
    setIsDarkMode(state, action) {
      return action.payload;
    },
  },
});

export const { setInitDMS } = initDMSSlice.actions;
export const { setIsDarkMode } = isDarkModeSlice.actions;

export const { InitDMSReducer } = initDMSSlice.reducer;
export const { IsDarkModeReducer } = isDarkModeSlice.reducer;
