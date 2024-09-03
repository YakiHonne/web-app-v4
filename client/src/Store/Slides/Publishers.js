import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    setToast(state, action) {
      return action.payload;
    },
  },
});

const toPublishSlice = createSlice({
  name: "toPublish",
  initialState,
  reducers: {
    setToPublish(state, action) {
      return action.payload;
    },
  },
});
const publishingSlice = createSlice({
  name: "publishing",
  initialState,
  reducers: {
    setPublishing(state, action) {
      return action.payload;
    },
  },
});

export const { setToast } = toastSlice.actions;
export const { setToPublish } = toPublishSlice.actions;
export const { setPublishing } = publishingSlice.actions;

export const { ToastReducer } = toastSlice.reducer;
export const { ToPublishReducer } = toPublishSlice.reducer;
export const { PublishingReducer } = publishingSlice.reducer;
