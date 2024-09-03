import { configureStore } from "@reduxjs/toolkit";
import NDKInstanceReducer from "./Slides/NDKInstance";
import {
  UserMetadataReducer,
  UserKeysReducer,
  UserBookmarksReducer,
  UserRelaysReducer,
  UserChatroomsReducer,
  UserChatContactsReducer,
  UserFollowingsReducer,
  UserMutedListReducer,
} from "./Slides/UserData";
import {
  UserFirstLoginYakiChestReducer,
  IsConnectedToYakiReducer,
  YakiChestStatsReducer,
  IsYakiChestLoadedReducer,
} from "./Slides/YakiChest";
import { NostrAuthorsReducer, NostrClientsReducer } from "./Slides/Profiles";
import {
  ToastReducer,
  ToPublishReducer,
  PublishingReducer,
} from "./Slides/Publishers";
import { IsDarkModeReducer, InitDMSReducer } from "./Slides/Extras";

export const store = configureStore({
  reducer: {
    ndkInstance: NDKInstanceReducer,
    userMetadata: UserMetadataReducer,
    userKeys: UserKeysReducer,
    userBookmarks: UserBookmarksReducer,
    userRelays: UserRelaysReducer,
    userChatrooms: UserChatroomsReducer,
    userChatContacts: UserChatContactsReducer,
    userFollowings: UserFollowingsReducer,
    userMutedList: UserMutedListReducer,
    userFirstLoginYakiChest: UserFirstLoginYakiChestReducer,
    isConnectedToYaki: IsConnectedToYakiReducer,
    yakiChestStats: YakiChestStatsReducer,
    isYakiChestLoaded: IsYakiChestLoadedReducer,
    nostrAuthors: NostrAuthorsReducer,
    nostrClients: NostrClientsReducer,
    toast: ToastReducer,
    toPublish: ToPublishReducer,
    publishing: PublishingReducer,
    isDarkMode: IsDarkModeReducer,
    initDMS: InitDMSReducer,
  },
});
