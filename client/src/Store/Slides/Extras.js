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
  initialState: localStorage?.getItem("yaki-theme") || "0",
  reducers: {
    setIsDarkMode(state, action) {
      return action.payload;
    },
  },
});
const followersCountSLSlice = createSlice({
  name: "followersCountSL",
  initialState: [],
  reducers: {
    setFollowersCountSL(state, action) {
      return action.payload;
    },
  },
});

const importantFlashNewsSlice = createSlice({
  name: "importantFlashNews",
  initialState: [],
  reducers: {
    setImportantFlashNews(state, action) {
      return action.payload;
    },
  },
});

const trendingUsersSlice = createSlice({
  name: "trendingUsersNews",
  initialState: [],
  reducers: {
    setTrendingUsers(state, action) {
      return action.payload;
    },
  },
});

const recentTagsSlice = createSlice({
  name: "recentTagsNews",
  initialState: [],
  reducers: {
    setRecentTags(state, action) {
      return action.payload;
    },
  },
});

export const { setInitDMS } = initDMSSlice.actions;
export const { setIsDarkMode } = isDarkModeSlice.actions;
export const { setFollowersCountSL } = followersCountSLSlice.actions;
export const { setImportantFlashNews } = importantFlashNewsSlice.actions;
export const { setTrendingUsers } = trendingUsersSlice.actions;
export const { setRecentTags } = recentTagsSlice.actions;

export const InitDMSReducer = initDMSSlice.reducer;
export const IsDarkModeReducer = isDarkModeSlice.reducer;
export const FollowersCountSLReducer = followersCountSLSlice.reducer;
export const ImportantFlashNewsReducer = importantFlashNewsSlice.reducer;
export const TrendingUsersReducer = trendingUsersSlice.reducer;
export const RecentTagsReducer = recentTagsSlice.reducer;
