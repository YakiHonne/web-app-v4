import { createSlice } from "@reduxjs/toolkit";

const userMetadataSlice = createSlice({
  name: "userMetadata",
  initialState: false,
  reducers: {
    setUserMetadata(state, action) {
      return action.payload;
    },
  },
});
const userKeysSlice = createSlice({
  name: "userData",
  initialState: false,
  reducers: {
    setUserKeys(state, action) {
      return action.payload;
    },
  },
});
const userBookmarksSlice = createSlice({
  name: "userBookmarks",
  initialState: [],
  reducers: {
    setUserBookmarks(state, action) {
      return action.payload;
    },
  },
});
const userRelaysSlice = createSlice({
  name: "userRelays",
  initialState: [],
  reducers: {
    setUserRelays(state, action) {
      return action.payload;
    },
  },
});
const userChatroomsSlice = createSlice({
  name: "userChatrooms",
  initialState: [],
  reducers: {
    setUserChatrooms(state, action) {
      return action.payload;
    },
  },
});
const userChatContactsSlice = createSlice({
  name: "userChatContacts",
  initialState: [],
  reducers: {
    setUserChatContacts(state, action) {
      return action.payload;
    },
  },
});
const userFollowingsSlice = createSlice({
  name: "userFollowings",
  initialState: [],
  reducers: {
    setUserFollowings(state, action) {
      return action.payload;
    },
  },
});
const userMutedListSlice = createSlice({
  name: "userMutedList",
  initialState: [],
  reducers: {
    setUserMutedList(state, action) {
      return action.payload;
    },
  },
});
const userBalanceSlice = createSlice({
  name: "userBalance",
  initialState: "N/A",
  reducers: {
    setUserBalance(state, action) {
      return action.payload;
    },
  },
});
const lastMessageTimestampSlice = createSlice({
  name: "lastMessageTimestamp",
  initialState: undefined,
  reducers: {
    setLastMessageTimestamp(state, action) {
      return action.payload;
    },
  },
});

export const { setUserMetadata } = userMetadataSlice.actions;
export const { setUserKeys } = userKeysSlice.actions;
export const { setUserBookmarks } = userBookmarksSlice.actions;
export const { setUserRelays } = userRelaysSlice.actions;
export const { setUserChatrooms } = userChatroomsSlice.actions;
export const { setUserChatContacts } = userChatContactsSlice.actions;
export const { setUserFollowings } = userFollowingsSlice.actions;
export const { setUserMutedList } = userMutedListSlice.actions;
export const { setLastMessageTimestamp } = lastMessageTimestampSlice.actions;
export const { setUserBalance } = userBalanceSlice.actions;

export const UserMetadataReducer = userMetadataSlice.reducer;
export const UserKeysReducer = userKeysSlice.reducer;
export const UserBookmarksReducer = userBookmarksSlice.reducer;
export const UserRelaysReducer = userRelaysSlice.reducer;
export const UserChatroomsReducer = userChatroomsSlice.reducer;
export const UserChatContactsReducer = userChatContactsSlice.reducer;
export const UserFollowingsReducer = userFollowingsSlice.reducer;
export const UserMutedListReducer = userMutedListSlice.reducer;
export const LastMessageTimestampReducer = lastMessageTimestampSlice.reducer;
export const UserBalanceSliceReducer = userBalanceSlice.reducer;
