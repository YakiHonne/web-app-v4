import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLiveQuery } from "dexie-react-hooks";
import {
  setUserAllRelays,
  setUserAppSettings,
  setUserBlossomServers,
  setUserBookmarks,
  setUserChatrooms,
  setUserFavRelays,
  setUserFollowings,
  setUserFollowingsRelays,
  setUserInterestList,
  setUserKeys,
  setUserMetadata,
  setUserMutedList,
  setUserRelays,
  setUserSavedTools,
  setUserWotList,
} from "../Store/Slides/UserData";
import {
  getBookmarks,
  getChatrooms,
  getClients,
  getFollowings,
  getFollowingsRelays,
  getInterestsList,
  getMutedlist,
  getRelays,
  getUsers,
  saveBookmarks,
  saveChatrooms,
  saveFollowings,
  saveMutedlist,
  saveNostrClients,
  saveRelays,
  saveInterests,
  getAppSettings,
  saveAppSettings,
  getFavRelays,
  saveFavRelays,
  saveWotlist,
  getWotlist,
  getBlossomServers,
  saveBlossomServers,
} from "../Helpers/DB";
import {
  addConnectedAccounts,
  getNostrClients,
  getSubData,
  saveRelaysListsForUsers,
  updateYakiChestStats,
  userLogout,
} from "../Helpers/Controlers";
import { setInitDMS, setTrendingUsers } from "../Store/Slides/Extras";
import { addExplicitRelays, ndkInstance } from "../Helpers/NDKInstance";
import {
  getConnectedAccounts,
  getKeys,
  toggleColorScheme,
} from "../Helpers/Helpers";
import { setNostrAuthors, setNostrClients } from "../Store/Slides/Profiles";
import {
  decrypt04,
  getEmptyuserMetadata,
  getParsedAuthor,
  getParsedRepEvent,
  getWOTScoreForPubkey,
  precomputeTrustingCounts,
  unwrapGiftWrap,
} from "../Helpers/Encryptions";
import axiosInstance from "../Helpers/HTTP_Client";
import { setIsYakiChestLoaded } from "../Store/Slides/YakiChest";
import relaysOnPlatform from "../Content/Relays";
import {
  NDKNip07Signer,
  NDKPrivateKeySigner,
  NDKRelayAuthPolicies,
} from "@nostr-dev-kit/ndk";
import { getTrendingUsers24h } from "../Helpers/WSInstance";
import { savedToolsIdentifier } from "../Content/Extras";

export default function AppInit() {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const isDarkMode = useSelector((state) => state.isDarkMode);
  const isConnectedToYaki = useSelector((state) => state.isConnectedToYaki);

  const chatrooms =
    useLiveQuery(
      async () => (userKeys ? await getChatrooms(userKeys.pub) : []),
      [userKeys]
    ) || [];
  const relays =
    useLiveQuery(
      async () => (userKeys ? await getRelays(userKeys.pub) : []),
      [userKeys]
    ) || [];
  const appSettings =
    useLiveQuery(
      async () => (userKeys ? await getAppSettings(userKeys.pub) : []),
      [userKeys]
    ) || false;
  const followings =
    useLiveQuery(
      async () => (userKeys ? await getFollowings(userKeys.pub) : []),
      [userKeys]
    ) || [];
  const interestsList =
    useLiveQuery(
      async () => (userKeys ? await getInterestsList(userKeys.pub) : []),
      [userKeys]
    ) || [];
  const bookmarks =
    useLiveQuery(
      async () => (userKeys ? await getBookmarks(userKeys.pub) : []),
      [userKeys]
    ) || [];
  const mutedlist =
    useLiveQuery(
      async () => (userKeys ? await getMutedlist(userKeys.pub) : []),
      [userKeys]
    ) || [];
  const favRelays =
    useLiveQuery(
      async () =>
        userKeys ? await getFavRelays(userKeys.pub) : { relays: [] },
      [userKeys]
    ) || [];
  const wotList =
    useLiveQuery(
      async () => (userKeys ? await getWotlist(userKeys.pub) : []),
      [userKeys]
    ) || [];
  const blossomServers =
    useLiveQuery(
      async () => (userKeys ? await getBlossomServers(userKeys.pub) : []),
      [userKeys]
    ) || [];
  const users = useLiveQuery(async () => await getUsers(), []);
  const followingsRelays = useLiveQuery(
    async () => await getFollowingsRelays(),
    []
  );
  const nostrClients = useLiveQuery(async () => await getClients(), []);

  const previousChatrooms = useRef([]);
  const previousRelays = useRef([]);
  const previousAppSettings = useRef(false);
  const previousInterests = useRef([]);
  const previousFollowings = useRef([]);
  const previousMutedList = useRef([]);
  const previousBookmarks = useRef([]);
  const previousUsers = useRef([]);
  const previousFollowingsRelays = useRef([]);
  const previousNostrClients = useRef([]);
  const previousWotList = useRef([]);
  const previousBlossomServers = useRef([]);
  const previousFavRelays = useRef({ relays: [] });

  useEffect(() => {
    if (
      JSON.stringify(previousChatrooms.current) !== JSON.stringify(chatrooms)
    ) {
      previousChatrooms.current = chatrooms;
      dispatch(setUserChatrooms(chatrooms));
    }
    if (JSON.stringify(previousRelays.current) !== JSON.stringify(relays)) {
      previousRelays.current = relays;
      let relaysURLsToRead =
        relays.relays
          ?.filter((relay) => relay.read)
          .map((relay) => relay.url) || relaysOnPlatform;
      let relaysURLsToWrite =
        relays.relays
          ?.filter((relay) => relay.write)
          .map((relay) => relay.url) || relaysOnPlatform;
      relaysURLsToRead =
        relaysURLsToRead.length > 0 ? relaysURLsToRead : relaysOnPlatform;
      relaysURLsToWrite =
        relaysURLsToWrite.length > 0 ? relaysURLsToWrite : relaysOnPlatform;
      dispatch(setUserRelays(relaysURLsToWrite));
      dispatch(setUserAllRelays(relays.relays));
      addExplicitRelays(relaysURLsToRead);
    }
    if (
      JSON.stringify(previousFavRelays.current) !== JSON.stringify(favRelays)
    ) {
      previousFavRelays.current = favRelays;
      dispatch(setUserFavRelays(favRelays));
      addExplicitRelays(favRelays.relays || []);
    }
    if (JSON.stringify(previousWotList.current) !== JSON.stringify(wotList)) {
      previousWotList.current = wotList;
      dispatch(setUserWotList(wotList));
    }
    if (
      JSON.stringify(previousFollowings.current) !== JSON.stringify(followings)
    ) {
      previousFollowings.current = followings;
      dispatch(setUserFollowings(followings?.followings || []));
    }

    if (
      JSON.stringify(previousBlossomServers.current) !==
      JSON.stringify(blossomServers)
    ) {
      previousBlossomServers.current = blossomServers;

      dispatch(setUserBlossomServers(blossomServers?.servers || []));
    }
    if (
      JSON.stringify(previousAppSettings.current) !==
      JSON.stringify(appSettings)
    ) {
      previousAppSettings.current = appSettings;
      let relaysFeedMiedxContent =
        appSettings?.settings?.content_sources?.mixed_content?.relays?.list?.map(
          (_) => _[0]
        ) || [];
      let relaysFeedNotes =
        appSettings?.settings?.content_sources?.notes?.relays?.list?.map(
          (_) => _[0]
        ) || [];
      let relaysFeed = [
        ...new Set([...relaysFeedMiedxContent, ...relaysFeedNotes]),
      ];
      if (relaysFeed.length > 0) {
        addExplicitRelays(relaysFeed);
      }
      dispatch(setUserAppSettings(appSettings || false));
    }
    if (
      JSON.stringify(previousInterests.current) !==
      JSON.stringify(interestsList)
    ) {
      previousInterests.current = interestsList;
      dispatch(setUserInterestList(interestsList?.interestsList || []));
    }
    if (
      JSON.stringify(previousMutedList.current) !== JSON.stringify(mutedlist)
    ) {
      previousMutedList.current = mutedlist;
      dispatch(setUserMutedList(mutedlist.mutedlist));
      if (mutedlist.mutedlist) {
        for (let p of mutedlist.mutedlist) ndkInstance.mutedIds.set([p], ["p"]);
      }
    }
    if (
      JSON.stringify(previousBookmarks.current) !== JSON.stringify(bookmarks)
    ) {
      previousBookmarks.current = bookmarks;
      let onlyRegular = bookmarks.filter((_) => _.d !== savedToolsIdentifier);
      let onlySWST = bookmarks.find((_) => _.d === savedToolsIdentifier);
      onlySWST = onlySWST ? onlySWST.items : [];
      dispatch(setUserBookmarks(onlyRegular));
      dispatch(setUserSavedTools(onlySWST));
    }
    if (JSON.stringify(previousUsers.current) !== JSON.stringify(users)) {
      previousUsers.current = users;
      dispatch(setNostrAuthors(users));
    }
    if (
      JSON.stringify(previousFollowingsRelays.current) !==
      JSON.stringify(followingsRelays)
    ) {
      previousFollowingsRelays.current = followingsRelays;
      dispatch(setUserFollowingsRelays(followingsRelays));
    }
    if (
      JSON.stringify(previousNostrClients.current) !==
      JSON.stringify(nostrClients)
    ) {
      previousNostrClients.current = nostrClients;
      dispatch(setNostrClients(nostrClients));
    }
  }, [
    chatrooms,
    relays,
    followings,
    mutedlist,
    followingsRelays,
    users,
    bookmarks,
    interestsList,
    appSettings,
    blossomServers,
  ]);

  useEffect(() => {
    if (isDarkMode === "0") {
      toggleColorScheme(false);
    }
    if (isDarkMode === "1") {
      toggleColorScheme(true);
    }
    saveNostrClients();
    // getFlashNews();
    getTrendingProfiles();
    // getRecentTags();
    let keys = getKeys();
    if (keys) {
      dispatch(setUserMetadata(getMetadataFromCachedAccounts(keys.pub)));
      dispatch(setUserKeys(keys));
    }
  }, []);

  useEffect(() => {
    let handleUseRKeys = async () => {
      let signer = ndkInstance.signer;
      if (signer) {
        signer = await ndkInstance.signer.user();
        signer = signer._pubkey;
      }
      if (signer !== userKeys.pub) {
        if (userKeys.ext) {
          const signer = new NDKNip07Signer(undefined, ndkInstance);
          ndkInstance.signer = signer;
        }
        if (userKeys.sec) {
          const signer = new NDKPrivateKeySigner(userKeys.sec);
          ndkInstance.signer = signer;
        }
      }
      // ndkInstance.relayAuthDefaultPolicy = async (relay) => {
      //   console.log(relay);
      //   const signIn = NDKRelayAuthPolicies.signIn({ ndk: ndkInstance });
      //   let ev = await signIn(relay);
      // };
      ndkInstance.relayAuthDefaultPolicy = NDKRelayAuthPolicies.signIn({
        ndk: ndkInstance,
      });
    };
    if (userKeys) {
      handleUseRKeys();
      dispatch(setUserMetadata(getMetadataFromCachedAccounts(userKeys.pub)));
      localStorage.setItem("_nostruserkeys", JSON.stringify(userKeys));
    }
  }, [userKeys]);

  useEffect(() => {
    let subscription = null;
    const fetchData = async () => {
      let [
        INBOX,
        RELAYS,
        FOLLOWINGS,
        MUTEDLIST,
        INTERESTSLIST,
        APPSETTINGS,
        FAVRELAYS,
        BLOSSOMSERVERS,
      ] = await Promise.all([
        getChatrooms(userKeys.pub),
        getRelays(userKeys.pub),
        getFollowings(userKeys.pub),
        getMutedlist(userKeys.pub),
        getInterestsList(userKeys.pub),
        getAppSettings(userKeys.pub),
        getFavRelays(userKeys.pub),
        getBlossomServers(userKeys.pub),
      ]);
      let lastMessageTimestamp =
        INBOX.length > 0
          ? INBOX.sort(
              (conv_1, conv_2) => conv_2.last_message - conv_1.last_message
            )[0].last_message
          : undefined;
      let lastRelaysTimestamp = RELAYS?.last_timestamp || undefined;
      let lastFollowingsTimestamp = FOLLOWINGS?.last_timestamp || undefined;
      let lastInterestsTimestamp = INTERESTSLIST?.last_timestamp || undefined;
      let lastMutedTimestamp = MUTEDLIST?.last_timestamp || undefined;
      let lastAppSettingsTimestamp = APPSETTINGS?.last_timestamp || undefined;
      let lastFavRelaysTimestamp = FAVRELAYS?.last_timestamp || undefined;
      let lastBlossomServersTimestamp =
        BLOSSOMSERVERS?.last_timestamp || undefined;
      let lastUserMetadataTimestamp =
        getMetadataFromCachedAccounts(userKeys.pub).created_at || undefined;
      dispatch(setInitDMS(true));
      let tempInbox = [];
      let tempAuthors = [];
      let tempUserFollowings;
      let tempUserInterests;
      let tempBlossomServers;
      let tempMutedList;
      let tempRelays;
      let tempFavRelays;
      let tempAppSettings;
      let tempBookmarks = [];
      let tempAuthMetadata = false;
      let eose = false;
      subscription = ndkInstance.subscribe(
        [
          {
            kinds: [4],
            authors: [userKeys.pub],
            since: lastMessageTimestamp
              ? lastMessageTimestamp + 1
              : lastMessageTimestamp,
          },
          {
            kinds: [4],
            "#p": [userKeys.pub],
            since: lastMessageTimestamp
              ? lastMessageTimestamp + 1
              : lastMessageTimestamp,
          },
          {
            kinds: [1059],
            "#p": [userKeys.pub],
            since: lastMessageTimestamp
              ? lastMessageTimestamp - 604800
              : lastMessageTimestamp,
          },
          {
            kinds: [3],
            authors: [userKeys.pub],
            since: lastFollowingsTimestamp
              ? lastFollowingsTimestamp + 1
              : lastFollowingsTimestamp,
          },
          {
            kinds: [10015],
            authors: [userKeys.pub],
            since: lastInterestsTimestamp
              ? lastInterestsTimestamp + 1
              : lastInterestsTimestamp,
          },
          {
            kinds: [10000],
            authors: [userKeys.pub],
            since: lastMutedTimestamp
              ? lastMutedTimestamp + 1
              : lastMutedTimestamp,
          },
          {
            kinds: [10002],
            authors: [userKeys.pub],
            since: lastRelaysTimestamp
              ? lastRelaysTimestamp + 1
              : lastRelaysTimestamp,
          },
          {
            kinds: [10063],
            authors: [userKeys.pub],
            since: lastBlossomServersTimestamp
              ? lastBlossomServersTimestamp + 1
              : lastBlossomServersTimestamp,
          },
          {
            kinds: [10012],
            authors: [userKeys.pub],
            since: lastFavRelaysTimestamp
              ? lastFavRelaysTimestamp + 1
              : lastFavRelaysTimestamp,
          },
          {
            kinds: [30078],
            authors: [userKeys.pub],
            "#d": ["YakihonneAppSettings"],
            since: lastAppSettingsTimestamp
              ? lastAppSettingsTimestamp + 1
              : lastAppSettingsTimestamp,
          },
          {
            kinds: [30003],
            authors: [userKeys.pub],
          },
          {
            kinds: [0],
            authors: [userKeys.pub],
            since: lastUserMetadataTimestamp
              ? lastUserMetadataTimestamp + 1
              : lastUserMetadataTimestamp,
          },
        ],
        {
          cacheUsage: "CACHE_FIRST",
          groupable: false,
          skipVerification: false,
          skipValidation: false,
          subId: "user-essentials",
        }
      );
      subscription.on("event", async (event) => {
        if (event.kind === 4) {
          let decryptedMessage = "";
          tempAuthors = [...new Set([...tempAuthors, event.pubkey])];
          let peer =
            event.pubkey === userKeys.pub
              ? event.tags.find(
                  (tag) => tag[0] === "p" && tag[1] !== userKeys.pub
                )[1]
              : "";
          let reply = event.tags.find((tag) => tag[0] === "e");
          let replyID = reply ? reply[1] : "";

          decryptedMessage = await decrypt04(event, userKeys);
          let tempEvent = {
            id: event.id,
            created_at: event.created_at,
            content: decryptedMessage,
            pubkey: event.pubkey,
            kind: event.kind,
            peer,
            replyID,
          };
          tempInbox.push(tempEvent);
          if (eose) saveChatrooms(tempInbox, [event.pubkey], userKeys.pub);
        }
        if (event.kind === 1059 && (userKeys.sec || window?.nostr?.nip44)) {
          try {
            let unwrappedEvent = await unwrapGiftWrap(event, userKeys.sec);
            if (unwrappedEvent && unwrappedEvent.kind === 14) {
              tempAuthors = [
                ...new Set([...tempAuthors, unwrappedEvent.pubkey]),
              ];
              let peer =
                unwrappedEvent.pubkey === userKeys.pub
                  ? unwrappedEvent.tags.find(
                      (tag) => tag[0] === "p" && tag[1] !== userKeys.pub
                    )[1]
                  : "";
              let reply = unwrappedEvent.tags.find((tag) => tag[0] === "e");
              let replyID = reply ? reply[1] : "";
              let tempEvent = {
                id: unwrappedEvent.id,
                created_at: unwrappedEvent.created_at,
                content: unwrappedEvent.content,
                pubkey: unwrappedEvent.pubkey,
                kind: unwrappedEvent.kind,
                peer,
                replyID,
              };
              tempInbox.push(tempEvent);
              if (eose)
                saveChatrooms(tempInbox, [unwrappedEvent.pubkey], userKeys.pub);
            }
          } catch (err) {
            console.log(err);
          }
        }
        if (event.kind === 3) {
          tempUserFollowings = { ...event };
          if (eose) saveFollowings(event, userKeys.pub);
        }
        if (event.kind === 10063) {
          tempBlossomServers = { ...event };
          if (eose) saveBlossomServers(event, userKeys.pub);
        }
        if (event.kind === 10015) {
          tempUserInterests = { ...event };
          if (eose) saveInterests(event, userKeys.pub);
        }
        if (event.kind === 10000) {
          tempMutedList = { ...event };
          if (eose) saveMutedlist(event, userKeys.pub);
        }
        if (event.kind === 10002) {
          tempRelays = { ...event };
          if (eose) saveRelays(event, userKeys.pub);
        }
        if (event.kind === 10012) {
          console.log(event.rawEvent());
          tempFavRelays = { ...event.rawEvent() };
          if (eose) saveFavRelays(event.rawEvent(), userKeys.pub);
        }
        if (event.kind === 30078) {
          tempAppSettings = { ...event };
          if (eose) saveAppSettings(tempAppSettings, userKeys.pub);
        }
        if (event.kind === 30003) {
          let parsedEvent = getParsedRepEvent(event);
          let index = tempBookmarks.findIndex(
            (bookmark) => bookmark.d === parsedEvent.d
          );
          if (index === -1) tempBookmarks.push(parsedEvent);
          else tempBookmarks.splice(index, 1, parsedEvent);
          if (eose) saveBookmarks(tempBookmarks, userKeys.pub);
        }
        if (event.kind === 0) {
          if (
            (lastUserMetadataTimestamp &&
              event.created_at > lastUserMetadataTimestamp) ||
            !lastUserMetadataTimestamp
          ) {
            lastUserMetadataTimestamp = event.created_at;
            let parsedEvent = getParsedAuthor(event);
            tempAuthMetadata = true;
            dispatch(setUserMetadata(parsedEvent));
            addConnectedAccounts(parsedEvent, userKeys);
          }
        }
      });
      subscription.on("eose", () => {
        saveChatrooms(tempInbox, tempAuthors, userKeys.pub);
        saveFollowings(
          tempUserFollowings,
          userKeys.pub,
          lastFollowingsTimestamp
        );
        saveInterests(tempUserInterests, userKeys.pub, lastInterestsTimestamp);
        saveMutedlist(tempMutedList, userKeys.pub, lastMutedTimestamp);
        saveRelays(tempRelays, userKeys.pub, lastRelaysTimestamp);
        saveFavRelays(tempFavRelays, userKeys.pub, lastFavRelaysTimestamp);
        saveBlossomServers(
          tempBlossomServers,
          userKeys.pub,
          lastBlossomServersTimestamp
        );
        saveAppSettings(
          tempAppSettings,
          userKeys.pub,
          lastAppSettingsTimestamp
        );
        saveAppSettings(
          tempAppSettings,
          userKeys.pub,
          lastAppSettingsTimestamp
        );
        saveBookmarks(tempBookmarks, userKeys.pub);
        if (!(tempAuthMetadata && lastUserMetadataTimestamp)) {
          let emptyMetadata = getEmptyuserMetadata(userKeys.pub);
          dispatch(setUserMetadata(emptyMetadata));
          addConnectedAccounts(emptyMetadata, userKeys);
        }
        eose = true;
        dispatch(setInitDMS(false));
      });
    };

    if (userKeys && (userKeys.ext || userKeys.sec)) {
      fetchData();
    }
    return () => {
      subscription && subscription.stop();
    };
  }, [userKeys]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(setIsYakiChestLoaded(false));
        const data = await axiosInstance.get("/api/v1/yaki-chest/stats");
        if (data.data.user_stats.pubkey !== userKeys.pub) {
          userLogout();
          dispatch(setIsYakiChestLoaded(false));
          return;
        }
        let { user_stats } = data.data;
        updateYakiChestStats(user_stats);
        dispatch(setIsYakiChestLoaded(true));
      } catch (err) {
        console.log(err);
        localStorage.removeItem("connect_yc");
        dispatch(setIsYakiChestLoaded(true));
      }
    };
    if (userKeys && isConnectedToYaki) fetchData();
    if (userKeys && !isConnectedToYaki) dispatch(setIsYakiChestLoaded(true));
  }, [userKeys, isConnectedToYaki]);

  useEffect(() => {
    const buildWOTList = async () => {
      let prevData = localStorage.getItem(`network_${userKeys.pub}`);
      prevData = prevData
        ? JSON.parse(prevData)
        : {
            last_updated: undefined,
          };
      if (
        prevData.last_updated &&
        followings?.followings?.last_timestamp == prevData.last_updated
      )
        return;
      let followinglist = followings?.followings.slice(0, 500);
      let batches = [];

      for (let i = 0; i < followinglist.length; i += 120) {
        batches.push({ bundled: followinglist.slice(i, i + 120) });
      }
      let networkData = [];
      for (let b of batches) {
        let d = await getSubData(
          [
            {
              kinds: [3, 10000],
              authors: b.bundled,
            },
          ],
          200
        );
        networkData.push(d);
      }
      networkData = networkData.map((_) => _.data).flat();
      // const networkData = await getSubData(
      //   [
      //     {
      //       kinds: [3],
      //       authors: followinglist,
      //     },
      //   ],
      //   800
      // );yeh

      if (networkData.length === 0) return;
      let network = structuredClone(networkData);
      network = followings?.followings.map((_) => {
        return {
          pubkey: _,
          followings:
            [
              ...new Set(
                network
                  .find((__) => __.kind === 3 && __.pubkey === _)
                  ?.tags.filter((tag) => tag[0] === "p")
                  .map((tag) => tag[1])
              ),
            ] || [],
          muted:
            [
              ...new Set(
                network
                  .find((__) => __.kind === 10000 && __.pubkey === _)
                  ?.tags.filter((tag) => tag[0] === "p")
                  .map((tag) => tag[1])
              ),
            ] || [],
        };
      });
      saveWotlist(network, userKeys.pub);
      const trustingCounts = precomputeTrustingCounts(network);
      let allPubkeys = [...new Set(network.map((_) => _.followings).flat())];
      let wotPubkeys = allPubkeys.filter(
        (_) => getWOTScoreForPubkey(network, _, 5, trustingCounts).status
      );
      localStorage.setItem(
        `network_${userKeys.pub}`,
        JSON.stringify({
          last_updated: followings?.followings.last_timestamp,
          // network,
          wotPubkeys,
        })
      );
    };
    const buildBackupWOTList = async () => {
      let prevData = localStorage.getItem(`backup_wot`);
      prevData = prevData
        ? JSON.parse(prevData)
        : {
            last_updated: undefined,
          };
      const backupFollowings = await getSubData(
        [
          {
            kinds: [3],
            authors: [process.env.REACT_APP_YAKI_PUBKEY],
            until: prevData.last_updated,
          },
        ],
        800
      );
      if (backupFollowings.data.length === 0) return;
      let followinglist = backupFollowings.data[0].tags
        .filter((_) => _[0] === "p")
        .map((_) => _[1]);
      followinglist = followinglist.slice(0, 500);
      let batches = [];

      for (let i = 0; i < followinglist.length; i += 120) {
        batches.push({ bundled: followinglist.slice(i, i + 120) });
      }

      let networkData = [];
      for (let b of batches) {
        let d = await getSubData(
          [
            {
              kinds: [3],
              authors: b.bundled,
            },
          ],
          200
        );
        networkData.push(d);
      }
      networkData = networkData.map((_) => _.data).flat();
      // const networkData = await getSubData(
      //   [
      //     {
      //       kinds: [3],
      //       authors: followinglist,
      //     },
      //   ],
      //   800
      // );

      if (networkData.length === 0) return;
      let network = structuredClone(networkData);
      network = followinglist.map((_) => {
        return {
          pubkey: _,
          followings:
            [
              ...new Set(
                network
                  .find((__) => __.kind === 3 && __.pubkey === _)
                  ?.tags.filter((tag) => tag[0] === "p")
                  .map((tag) => tag[1])
              ),
            ] || [],
          muted: [],
        };
      });

      const trustingCounts = precomputeTrustingCounts(network);

      let allPubkeys = [...new Set(network.map((_) => _.followings).flat())];

      let wotPubkeys = allPubkeys.filter(
        (_) => getWOTScoreForPubkey(network, _, 5, trustingCounts).status
      );

      localStorage.setItem(
        `backup_wot`,
        JSON.stringify({
          last_updated: backupFollowings.data[0].created_at + 1,
          wotPubkeys,
        })
      );
    };
    if (followings && followings?.followings?.length > 0) {
      saveRelaysListsForUsers(followings?.followings);
    }
    if (followings && followings?.followings?.length >= 5) {
      buildWOTList();
    } else if (followings && followings?.followings?.length < 5) {
      buildBackupWOTList();
    }
  }, [followings]);

  const getTrendingProfiles = async () => {
    try {
      let users = await getTrendingUsers24h();
      dispatch(setTrendingUsers(users));
    } catch (err) {
      console.log(err);
    }
  };

  const getMetadataFromCachedAccounts = (pubkey) => {
    let accounts = getConnectedAccounts();
    let account = accounts.find((account) => account.pubkey === pubkey);
    if (account) {
      let metadata = { ...account };
      delete metadata.userKeys;
      return metadata;
    }
    return false;
  };

  return null;
}
