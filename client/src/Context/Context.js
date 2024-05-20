import React, { useEffect, useState } from "react";
import { relayInit, SimplePool, nip44 } from "nostr-tools";
import relaysOnPlatform from "../Content/Relays";
import {
  decrypt04,
  filterRelays,
  getEmptyNostrUser,
  getParsed3000xContent,
  unwrapGiftWrap,
} from "../Helpers/Encryptions";
import { getBech32 } from "../Helpers/Encryptions";
import axios from "axios";
import { getNoteTree } from "../Helpers/Helpers";
import axiosInstance from "../Helpers/HTTP_Client";
const Context = React.createContext();

const pool = new SimplePool();
const DMs_pool = new SimplePool();
const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

const toggleColorScheme = (theme) => {
  const stylesheets = document.styleSheets;
  for (const sheet of stylesheets) {
    const rules = sheet.cssRules || sheet.rules;

    for (const rule of rules) {
      if (rule.media && rule.media.mediaText.includes("prefers-color-scheme")) {
        // Toggle between light and dark
        const newMediaText = !theme
          ? "(prefers-color-scheme: dark)"
          : "(prefers-color-scheme: light)";
        rule.media.mediaText = newMediaText;
      }
    }
  }
};

const aggregateUsers = (convo, oldAggregated = []) => {
  const arr2 = [];
  const map = oldAggregated.length
    ? new Map(oldAggregated.map((item) => [item.pubkey, item]))
    : new Map();
  convo.forEach((item) => {
    let pubkey = item.peer || item.pubkey;
    if (map.has(pubkey)) {
      let checkConvo = map
        .get(pubkey)
        .convo.find((item_) => item_.id === item.id);

      if (!checkConvo) {
        let sortedConvo = [...map.get(pubkey).convo, item].sort(
          (convo_1, convo_2) => convo_1.created_at - convo_2.created_at
        );
        map.get(pubkey).convo = sortedConvo;
        map.get(pubkey).checked =
          (map.get(pubkey).checked &&
            sortedConvo[sortedConvo.length - 1].created_at ===
              map.get(pubkey).last_message) ||
          (item.peer ? true : false);
        map.get(pubkey).last_message =
          sortedConvo[sortedConvo.length - 1].created_at;
      }
    } else {
      map.set(pubkey, {
        pubkey,
        last_message: item.created_at,
        checked: item.peer ? true : false,
        convo: [item],
        id: `${pubkey}-${item.created_at}`,
      });
    }
  });

  arr2.push(...map.values());
  arr2.sort((convo_1, convo_2) => convo_2.last_message - convo_1.last_message);
  return arr2;
};

const ContextProvider = ({ children }) => {
  const [nostrUser, setNostrUser] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("yaki-theme") || "0"
  );
  const [nostrUserImpact, setNostrUserImpact] = useState(false);
  const [nostrUserBookmarks, setNostrUserBookmarks] = useState([]);
  const [nostrUserAbout, setNostrUserAbout] = useState(false);
  const [nostrUserTags, setNostrUserTags] = useState(false);
  const [nostrUserLoaded, setNostrUserLoaded] = useState(false);
  const [initDMS, setInitDMS] = useState(false);
  const [nostrUserTopics, setNostrUserTopics] = useState([]);
  const [nostrKeys, setNostrKeys] = useState(false);
  const [nostrAuthors, setNostrAuthors] = useState([]);
  const [revLoaded, setRevLoaded] = useState(false);
  const [globalCuration, setGlobalCuration] = useState([]);
  const [toast, setToast] = useState(false);
  const [relayConnect, setRelayConnect] = useState(false);
  const [toPublish, setToPublish] = useState(false);
  const [isPublishing, setPublishing] = useState(false);
  const [nostrClients, setNostrClients] = useState([]);
  const [buzzFeedSources, setBuzzFeedSources] = useState([]);
  const [loadCacheDB, setLoadCacheDB] = useState(false);
  const [chatrooms, setChatrooms] = useState([]);
  const [chatContacts, setChatContacts] = useState([]);
  const [userFollowings, setUserFollowings] = useState([]);
  const [mutedList, setMutedList] = useState(false);
  const [lastMessageDate, setLastMessageDate] = useState(undefined);
  const [tempChannel, setTempChannel] = useState(false);

  useEffect(() => {
    let fetchData = async () => {
      getNostrClients();
      getBuzzFeedSources();
      let keys = localStorage.getItem("_nostruserkeys");
      if (keys) {
        let content = JSON.parse(keys);
        setNostrKeys(content);

        let user = await getUserFromNOSTR(content.pub);
        user.relays = await getRelaysOfUser(content.pub);
        if (user) {
          setNostrUserData(user);
        }
        return;
      }
      setNostrUser(false);
      setNostrUserLoaded(true);
    };

    if (isDarkMode === "0") toggleColorScheme(false);
    if (isDarkMode === "1") toggleColorScheme(true);

    fetchData();
    cacheDBInit();
    // localStorage.removeItem("update-curation");
  }, []);

  useEffect(() => {
    if (loadCacheDB && nostrKeys && (nostrKeys.ext || nostrKeys.sec)) {
      setInitDMS(true);
      let tempInbox = [];
      let tempAuthors = [];
      let tempUserFollowings;
      let tempMutedList;
      let eose = false;
      let sub = DMs_pool.subscribeMany(
        relaysOnPlatform,
        [
          {
            kinds: [4],
            authors: [nostrKeys.pub],
            since: lastMessageDate ? lastMessageDate + 1 : lastMessageDate,
          },
          {
            kinds: [4],
            "#p": [nostrKeys.pub],
            since: lastMessageDate ? lastMessageDate + 1 : lastMessageDate,
          },
          {
            kinds: [1059],
            "#p": [nostrKeys.pub],
            since: lastMessageDate ? lastMessageDate - 604800 : lastMessageDate,
          },
          {
            kinds: [3, 10000],
            authors: [nostrKeys.pub],
          },
        ],
        {
          async onevent(event) {
            if (event.kind === 4) {
              let decryptedMessage = "";
              tempAuthors = [...new Set([...tempAuthors, event.pubkey])];
              let peer =
                event.pubkey === nostrKeys.pub
                  ? event.tags.find(
                      (tag) => tag[0] === "p" && tag[1] !== nostrKeys.pub
                    )[1]
                  : "";
              let reply = event.tags.find((tag) => tag[0] === "e");
              let replyID = reply ? reply[1] : "";

              decryptedMessage = await decrypt04(event, nostrKeys);
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
              if (eose) handleDM(tempInbox, [event.pubkey], chatrooms);
            }
            if (
              event.kind === 1059 &&
              (nostrKeys.sec || window?.nostr?.nip44)
            ) {
              try {
                let unwrappedEvent = await unwrapGiftWrap(event, nostrKeys.sec);
                if (unwrappedEvent && unwrappedEvent.kind === 14) {
                  tempAuthors = [
                    ...new Set([...tempAuthors, unwrappedEvent.pubkey]),
                  ];
                  let peer =
                    unwrappedEvent.pubkey === nostrKeys.pub
                      ? unwrappedEvent.tags.find(
                          (tag) => tag[0] === "p" && tag[1] !== nostrKeys.pub
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
                    handleDM(tempInbox, [unwrappedEvent.pubkey], chatrooms);
                }
              } catch (err) {
                console.log(err);
              }
            }
            if (event.kind === 3) {
              tempUserFollowings = { ...event };
              if (eose) handleUserFollowings(event);
            }
            if (event.kind === 10000) {
              tempMutedList = { ...event };
              if (eose) handleMutedList(event);
            }
          },
          oneose() {
            handleDM(tempInbox, tempAuthors, chatrooms);
            handleUserFollowings(tempUserFollowings);
            handleMutedList(tempMutedList);
            eose = true;
            setInitDMS(false);
          },
        }
      );
    }
  }, [loadCacheDB, nostrKeys]);

  const handleDM = (inbox, authors, oldAggregated) => {
    addNostrAuthors(authors);
    let sortedInbox = aggregateUsers(inbox, oldAggregated);
    let openDB = indexedDB.open("yaki-nostr", 3);
    openDB.onsuccess = () => {
      let db = openDB.result;
      db.onversionchange = function () {
        db.close();
        alert("Database is outdated, please reload the page.");
      };
      let transaction = db.transaction(
        ["chatrooms", "chatContacts"],
        "readwrite"
      );
      let chatrooms_ = transaction.objectStore("chatrooms");

      for (let ibx of sortedInbox) chatrooms_.put(ibx, ibx.pubkey);

      setChatrooms(sortedInbox);
    };
  };
  const handleUserFollowings = (event) => {
    if (!event) return;

    let user_followings = event.tags
      .filter((tag) => tag[0] === "p")
      .map((tag) => tag[1]);
    let openDB = indexedDB.open("yaki-nostr", 3);
    openDB.onsuccess = () => {
      let db = openDB.result;
      db.onversionchange = function () {
        db.close();
        alert("Database is outdated, please reload the page.");
      };
      let transaction = db.transaction(["followings"], "readwrite");
      let followings = transaction.objectStore("followings");

      followings.put(user_followings, "USER_FOLLOWINGS");

      setUserFollowings(user_followings);
    };
  };
  const handleMutedList = (event) => {
    if (!event) return;

    let muted_list = event.tags
      .filter((tag) => tag[0] === "p")
      .map((tag) => tag[1]);
    let openDB = indexedDB.open("yaki-nostr", 3);
    openDB.onsuccess = () => {
      let db = openDB.result;
      db.onversionchange = function () {
        db.close();
        alert("Database is outdated, please reload the page.");
      };
      let transaction = db.transaction(["muted"], "readwrite");
      let muted = transaction.objectStore("muted");
      muted.put(muted_list, "MUTED_LIST");

      setMutedList(muted_list);
    };
  };

  const setNostrUserData = async (data) => {
    if (data) {
      setNostrUserLoaded(false);
      let content = data;
      let userAbout = JSON.parse(content.content) || {};

      let [userRelays, userFollowing, userTopics, userBookmarks] =
        await Promise.all([
          getRelaysOfUser(content.pubkey),
          getUserFollowing(content.pubkey),
          getUserTopics(content.pubkey),
          // getUserBookmarks(content.pubkey),
        ]);
      let userData = {
        pubkey: content.pubkey,
        added_date: new Date(content.created_at * 1000).toISOString(),
        img: userAbout?.picture || "",
        banner: userAbout?.banner || "",
        name: userAbout?.display_name || userAbout?.name || "",
        about: userAbout?.about || "",
        nip05: userAbout?.nip05 || "",
        relays: userRelays,
        following: userFollowing,
      };
      setNostrUser(userData);
      setNostrUserTags(content.tags);
      setNostrUserAbout(userAbout);
      getUserBookmarks(content.pubkey);
      // setNostrUserBookmarks(userBookmarks);
      setNostrUserTopics(userTopics);
      setNostrUserLoaded(true);
      return;
    }
    setNostrUser(false);
    setNostrUserLoaded(true);
  };

  const setNostrKeysData = (data) => {
    if (data) {
      localStorage.setItem("_nostruserkeys", JSON.stringify(data));
      setNostrKeys(data);
      return;
    }
    setNostrKeys(false);
  };

  const nostrUserLogout = async () => {
    localStorage.removeItem("_nostruser");
    localStorage.removeItem("_nostruserkeys");
    localStorage.removeItem("comment-with-prefix");
    let openDB = window.indexedDB.open("yaki-nostr", 3);
    // let req = window.indexedDB.deleteDatabase("yaki-nostr");

    // req.onupgradeneeded = function () {
    //   console.log("Deleted database successfully");
    // };
    // req.onsuccess = function () {
    //   console.log("Deleted database successfully");
    // };
    // req.onerror = function () {
    //   console.log("Couldn't delete database");
    // };
    // req.onblocked = function () {
    //   console.log("DB got blocked");
    // };
    openDB.onsuccess = () => {
      let db = openDB.result;
      db.onversionchange = function () {
        db.close();
        alert("Database is outdated, please reload the page.");
      };
      let transaction = db.transaction(
        ["chatrooms", "chatContacts", "followings", "muted"],
        "readwrite"
      );
      let chatrooms_ = transaction.objectStore("chatrooms");
      let chatContacts_ = transaction.objectStore("chatContacts");
      let followings_ = transaction.objectStore("followings");
      let muted = transaction.objectStore("muted");
      let cR = chatrooms_.clear();
      let cC = chatContacts_.clear();
      let uF = followings_.clear();
      let mL = muted.clear();

      cR.onsuccess = (event) => {
        console.log("DB cleared");
      };
      cC.onsuccess = (event) => {
        console.log("DB cleared");
      };
      uF.onsuccess = (event) => {
        console.log("DB cleared");
      };
      mL.onsuccess = (event) => {
        console.log("DB cleared");
      };
    };
    // localStorage.removeItem("topic-popup");
    setNostrUser(false);
    setNostrKeys(false);
    setNostrUserAbout(false);
    setNostrUserBookmarks([]);
    setNostrUserTopics([]);
    setNostrUserTags([]);
    setChatContacts([]);
    setChatrooms([]);
    setMutedList([]);
    setLastMessageDate(undefined);
    try {
      const data = await axiosInstance.post("/api/v1/logout");
    } catch (err) {
      console.log(err);
    }
  };

  const getUserFromNOSTR = async (pubkey) => {
    try {
      let author = await pool.get(relaysOnPlatform, {
        kinds: [0],
        authors: [pubkey],
      });
      return author || getEmptyNostrUser(pubkey);
    } catch (err) {
      console.log(err);
    }
  };
  const getNostrClients = async (pubkey) => {
    try {
      let clients = await pool.querySync(
        [...relaysOnPlatform, "wss://relay.nostr.band"],
        {
          kinds: [31990],
        }
      );
      setNostrClients(clients);
    } catch (err) {
      console.log(err);
    }
  };
  const getBuzzFeedSources = async () => {
    try {
      const data = await axios.get(API_BASE_URL + "/api/v1/af-sources");
      setBuzzFeedSources(data.data);
    } catch (err) {
      console.log(err);
    }
  };
  const getUserTopics = async (pubkey) => {
    try {
      let topics = await pool.get(relaysOnPlatform, {
        kinds: [30078],
        authors: [pubkey],
      });

      return topics
        ? topics.tags.filter((item) => item[0] === "t").map((item) => item[1])
        : [];
    } catch (err) {
      console.log(err);
    }
  };
  const getUserFollowing = async (pubkey) => {
    try {
      let author = await pool.get(relaysOnPlatform, {
        kinds: [3],
        authors: [pubkey],
      });
      return author?.tags?.filter((people) => people[0] === "p") || [];
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const getUserBookmarks = async (pubkey) => {
    try {
      let sub = pool.subscribeMany(
        relaysOnPlatform,
        [
          {
            kinds: [30003],
            authors: [pubkey],
            // "#d": ["MyYakihonneBookmarkedArticles"],
          },
        ],
        {
          onevent(event) {
            let eventD = event.tags.find((tag) => tag[0] === "d")[1];
            setNostrUserBookmarks((bookmarks) => {
              let bookmarkContent = getParsed3000xContent(event.tags);
              return [
                { ...event, bookmarkContent },
                ...bookmarks.filter(
                  (bookmark) =>
                    bookmark.tags.find((tag) => tag[0] === "d")[1] !== eventD
                ),
              ];
            });
          },
        }
      );
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  const getRelaysOfUser = async (pubkey) => {
    try {
      let res_1 = await pool.querySync(relaysOnPlatform, {
        kinds: [10002],
        authors: [pubkey],
      });
      res_1 =
        res_1.length > 0
          ? res_1
              .map((item) =>
                item.tags
                  .filter((item) => item[0] === "r")
                  .map((item_) => item_[1])
              )
              .flat()
          : [];

      let final_res = [...new Set([...relaysOnPlatform, ...res_1])];

      return final_res;
    } catch (err) {
      console.log(err);
    }
  };

  const addNostrAuthors = async (pubkeys) => {
    let BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;
    let tempNostrAuthors_1 = Array.from(nostrAuthors);
    let tempNostrAuthors_2 = [];
    let tempNostrAuthors_3 = [];
    for (let author of pubkeys) {
      if (!tempNostrAuthors_1.find((item) => item.pubkey === author))
        tempNostrAuthors_2.push(author);
    }

    if (tempNostrAuthors_2.length === 0) return;
    let data = await axios.post(BASE_URL + "/api/v1/users", {
      users_pubkeys: tempNostrAuthors_2,
    });
    let res = data.data;
    if (res.length === 0 && pubkeys.length === 1)
      setNostrAuthors([...nostrAuthors, getEmptyNostrUser(pubkeys[0])]);

    setNostrAuthors([...nostrAuthors, ...res]);
    let openDB = indexedDB.open("yaki-nostr", 3);
    openDB.onsuccess = (event) => {
      let db = openDB.result;
      db.onversionchange = function () {
        db.close();
        alert("Database is outdated, please reload the page.");
      };
      let transaction = db.transaction(["chatContacts"], "readwrite");
      let chatContacts_ = transaction.objectStore("chatContacts");

      for (let auth of [...nostrAuthors, ...res])
        chatContacts_.put(auth, auth.pubkey);

      setChatContacts((prev) => [...prev, ...nostrAuthors, ...res]);
    };
  };

  const getNostrAuthor = (pubkey) => {
    return nostrAuthors.find((item) => item.pubkey === pubkey);
  };

  const setTheme = () => {
    if (isDarkMode === "0") {
      localStorage.setItem("yaki-theme", "1");
      toggleColorScheme(true);
      setIsDarkMode("1");
    }
    if (isDarkMode === "1") {
      localStorage.setItem("yaki-theme", "0");
      toggleColorScheme(false);
      setIsDarkMode("0");
    }
  };

  const cacheDBInit = () => {
    // let openDB = indexedDB.open("yaki-nostr", 3);
    // openDB.onsuccess = () => {
    //   let db = openDB.result;
    //   let transaction = db.transaction(
    //     ["chatrooms", "chatContacts"],
    //     "readwrite"
    //   );
    //   let chatrooms_ = transaction.objectStore("chatrooms");
    //   let chatContacts_ = transaction.objectStore("chatContacts");
    //   chatrooms_.clear();
    //   chatContacts_.clear();
    // };
    let openDB = indexedDB.open("yaki-nostr", 3);

    openDB.onupgradeneeded = () => {
      let db = openDB.result;
      db.onerror = (event) => {
        console.log("error upgrading db");
      };
      if (!db.objectStoreNames.contains("chatrooms"))
        db.createObjectStore("chatrooms", { autoIncrement: true });
      if (!db.objectStoreNames.contains("chatContacts"))
        db.createObjectStore("chatContacts", { autoIncrement: true });
      if (!db.objectStoreNames.contains("followings"))
        db.createObjectStore("followings", { autoIncrement: true });
      if (!db.objectStoreNames.contains("muted"))
        db.createObjectStore("muted", { autoIncrement: true });
      setLoadCacheDB(openDB);
    };

    openDB.onsuccess = () => {
      let db = openDB.result;
      db.onversionchange = function () {
        db.close();
        alert("Database is outdated, please reload the page.");
      };
      try {
        let transaction = db.transaction(
          ["chatrooms", "chatContacts", "followings", "muted"],
          "readonly"
        );
        let chatrooms_ = transaction.objectStore("chatrooms").getAll();
        let chatContacts_ = transaction.objectStore("chatContacts").getAll();
        let userFollowings_ = transaction.objectStore("followings").getAll();
        let muted = transaction.objectStore("muted").getAll();

        chatrooms_.onsuccess = () => {
          let sortedInbox =
            chatrooms_.result.length > 0
              ? chatrooms_.result.sort(
                  (conv_1, conv_2) => conv_2.last_message - conv_1.last_message
                )
              : chatrooms_.result;
          setLastMessageDate(sortedInbox[0]?.last_message || undefined);
          setChatrooms(sortedInbox);
          setLoadCacheDB(openDB);
        };
        chatContacts_.onsuccess = () => {
          setChatContacts(chatContacts_.result);
        };
        userFollowings_.onsuccess = () => {
          if (userFollowings_.result)
            setUserFollowings(userFollowings_.result[0]);
        };
        muted.onsuccess = () => {
          console.log(muted.result);
          if (muted?.result?.length > 0) setMutedList(muted.result[0]);
          else setMutedList([]);
        };
      } catch (err) {
        console.log(err);
        db.close();
        let req = indexedDB.deleteDatabase("yaki-nostr");
        req.onsuccess = function () {
          cacheDBInit();
          console.log("Deleted database successfully");
        };
      }
      // chatrooms_.onerror = () => {
      //   console.log(1)
      //   db.close();
      //   let req = indexedDB.deleteDatabase("yaki-nostr");
      //   req.onsuccess = function () {
      //     cacheDBInit();
      //     console.log("Deleted database successfully");
      //   };
      // };
      // chatContacts_.onerror = () => {
      //   console.log(2)
      //   db.close();
      //   let req = indexedDB.deleteDatabase("yaki-nostr");
      //   req.onsuccess = function () {
      //     cacheDBInit();
      //     console.log("Deleted database successfully");
      //   };
      // };
      // userFollowings_.onerror = () => {
      //   console.log(3)
      //   db.close();
      //   let req = indexedDB.deleteDatabase("yaki-nostr");
      //   req.onsuccess = function () {
      //     cacheDBInit();
      //     console.log("Deleted database successfully");
      //   };
      // };
      // muted.onerror = () => {
      //   console.log(4)
      //   db.close();
      //   let req = indexedDB.deleteDatabase("yaki-nostr");
      //   req.onsuccess = function () {
      //     cacheDBInit();
      //     console.log("Deleted database successfully");
      //   };
      // };
      // transaction.onerror = () => {
      //   console.log(5)
      //   db.close();
      //   let req = indexedDB.deleteDatabase("yaki-nostr");
      //   req.onsuccess = function () {
      //     cacheDBInit();
      //     console.log("Deleted database successfully");
      //   };
      // };
      // db.onerror = () => {
      //   console.log(6)
      //   let req = indexedDB.deleteDatabase("yaki-nostr");
      //   req.onsuccess = function () {
      //     cacheDBInit();
      //     console.log("Deleted database successfully");
      //   };
      //   req.onblocked = function () {
      //     db.close();
      //     cacheDBInit();
      //     console.log("Deleted database successfully");
      //   };
      // };
    };

    openDB.onerror = (event) => {
      console.log(event);
      setChatContacts([]);
      setChatrooms([]);
      setMutedList([]);
    };

    openDB.onblocked = (ev) => {
      console.log(ev);
      setChatContacts([]);
      setChatrooms([]);
      setMutedList([]);
    };
  };

  return (
    <Context.Provider
      value={{
        toast,
        setToast,
        nostrUser,
        nostrUserAbout,
        setNostrUserAbout,
        nostrUserTags,
        setNostrUserData,
        setNostrUser,
        nostrUserLoaded,
        nostrUserLogout,
        setNostrKeysData,
        nostrKeys,
        globalCuration,
        setGlobalCuration,
        relayConnect,
        nostrUserBookmarks,
        setNostrUserBookmarks,
        addNostrAuthors,
        getNostrAuthor,
        nostrAuthors,
        toPublish,
        setToPublish,
        isPublishing,
        setPublishing,
        nostrUserTopics,
        setNostrUserTopics,
        setNostrUserBookmarks,
        nostrClients,
        nostrUserImpact,
        isDarkMode,
        setTheme,
        initDMS,
        chatrooms,
        setChatrooms,
        chatContacts,
        userFollowings,
        buzzFeedSources,
        mutedList,
        setMutedList,
        tempChannel,
        setTempChannel,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export { Context, ContextProvider };
