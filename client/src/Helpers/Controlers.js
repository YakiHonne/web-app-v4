import NDK, { getRelayListForUsers } from "@nostr-dev-kit/ndk";
import { ndkInstance } from "./NDKInstance";
import {
  getEmptyuserMetadata,
  getuserMetadata,
  removeEventsDuplicants,
  removeObjDuplicants,
  sortEvents,
} from "./Encryptions";
import { store } from "../Store/Store";
import {
  setIsConnectedToYaki,
  setUserFirstLoginYakiChest,
  setYakiChestStats,
} from "../Store/Slides/YakiChest";
import axiosInstance from "./HTTP_Client";
import {
  setUserBalance,
  setUserKeys,
  setUserMetadata,
} from "../Store/Slides/UserData";
import { clearDB, savefollowingsRelays } from "./DB";
import {
  getAppLang,
  getContentTranslationConfig,
  getCurrentLevel,
  getKeys,
  levelCount,
} from "./Helpers";
import { finalizeEvent } from "nostr-tools";
import { translationServicesEndpoints } from "../Content/TranslationServices";
import axios from "axios";

const ConnectNDK = async (relays) => {
  try {
    const ndk = new NDK({
      explicitRelayUrls: relays,
    });
    await ndk.connect();
    return ndk;
  } catch (err) {
    console.log(err);
  }
};

const aggregateUsers = (convo, oldAggregated = [], userPubkey) => {
  const arr2 = [];
  const map =
    oldAggregated.length > 0
      ? new Map(oldAggregated.map((item) => [item.pubkey, item]))
      : new Map();

  convo.forEach((item) => {
    let pubkey = item.peer || item.pubkey;
    if (map.has(`${pubkey}`)) {
      let checkConvo = map
        .get(`${pubkey}`)
        .convo.find((item_) => item_.id === item.id);

      if (!checkConvo) {
        let sortedConvo = [...map.get(`${pubkey}`).convo, item].sort(
          (convo_1, convo_2) => convo_1.created_at - convo_2.created_at
        );
        map.get(`${pubkey}`).convo = sortedConvo;
        map.get(`${pubkey}`).checked =
          (map.get(`${pubkey}`).checked &&
            sortedConvo[0].created_at === map.get(`${pubkey}`).last_message) ||
          (item.peer ? true : false);
        map.get(`${pubkey}`).last_message =
          sortedConvo[sortedConvo.length - 1].created_at;
      }
    } else {
      map.set(`${pubkey}`, {
        pubkey,
        last_message: item.created_at,
        checked: item.peer ? true : false,
        convo: [item],
        id: pubkey,
      });
    }
  });

  arr2.push(...map.values());
  arr2.sort((convo_1, convo_2) => convo_2.last_message - convo_1.last_message);
  return arr2;
};

const getConnectedAccounts = () => {
  try {
    let accounts = localStorage.getItem("yaki-accounts") || [];
    accounts = Array.isArray(accounts) ? [] : JSON.parse(accounts);
    return accounts;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const addConnectedAccounts = (account, userKeys) => {
  try {
    let accounts = getConnectedAccounts() || [];
    let isAccount = accounts.findIndex(
      (account_) => account_.pubkey === userKeys.pub
    );
    if (isAccount === -1) {
      accounts.push({ ...account, userKeys });
      localStorage.setItem("yaki-accounts", JSON.stringify(accounts));
    } else {
      accounts.splice(isAccount, 1, { ...account, userKeys });
      localStorage.setItem("yaki-accounts", JSON.stringify(accounts));
    }
  } catch (err) {
    console.log(err);
  }
};

const getUserFromNOSTR = (pubkey) => {
  return new Promise((resolve, reject) => {
    try {
      let auth = getEmptyuserMetadata(pubkey);
      const subscription = ndkInstance.subscribe(
        [
          {
            kinds: [0],
            authors: [pubkey],
          },
        ],
        { closeOnEose: true, groupable: false, cacheUsage: "CACHE_FIRST" }
      );

      subscription.on("event", (event) => {
        auth = getuserMetadata(event);
        // resolve(getuserMetadata(event));
      });
      subscription.on("eose", () => {
        resolve(auth);
      });
    } catch (err) {
      resolve(getEmptyuserMetadata(pubkey));
    }
  });
};

const getUserRelaysFromNOSTR = (pubkey) => {
  return new Promise((resolve, reject) => {
    try {
      const subscription = ndkInstance.subscribe(
        [
          {
            kinds: [10002],
            authors: [pubkey],
          },
        ],
        { closeOnEose: true, cacheUsage: "CACHE_FIRST" }
      );

      subscription.on("event", (event) => {
        resolve(event.rawEvent());
      });
      subscription.on("eose", () => {
        resolve(false);
      });
    } catch (err) {
      resolve([]);
    }
  });
};

const getNostrClients = async (until = undefined) => {
  try {
    let clients = await ndkInstance.fetchEvents({
      kinds: [31990],
      until,
    });

    clients = [...clients].map((client) => {
      return {
        id: client.id,
        pubkey: client.pubkey,
        created_at: client.created_at,
        content: client.content,
        sig: client.sig,
        tags: client.tags,
      };
    });

    return clients;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const yakiChestDisconnect = async () => {
  try {
    store.dispatch(setIsConnectedToYaki(false));
    store.dispatch(setYakiChestStats(false));
    const data = await axiosInstance.post("/api/v1/logout");
  } catch (err) {
    console.log(err);
  }
};

const logoutAllAccounts = async () => {
  localStorage.clear();
  store.dispatch(setUserBalance("N/A"));
  store.dispatch(setUserKeys(false));
  store.dispatch(setUserMetadata(false));
  clearDB();
  yakiChestDisconnect();
};

const handleSwitchAccount = (account) => {
  let keys = account.userKeys;
  let about = { ...account };
  delete about.userKeys;
  store.dispatch(setUserKeys(keys));
  yakiChestDisconnect();
};

const userLogout = async (pubkey) => {
  let accounts = getConnectedAccounts();
  if (accounts.length < 2) {
    logoutAllAccounts();
    return;
  }

  let accountIndex = accounts.findIndex(
    (account) => account.userKeys.pub === pubkey
  );
  if (accountIndex !== -1) {
    accounts.splice(accountIndex, 1);
    localStorage.setItem("yaki-accounts", JSON.stringify(accounts));
    if (accounts.length > 0) handleSwitchAccount(accounts[0]);
  }
};

const updateYakiChestStats = (user_stats) => {
  let xp = user_stats.xp;
  let currentLevel = getCurrentLevel(xp);
  let nextLevel = currentLevel + 1;
  let toCurrentLevelPoints = levelCount(currentLevel);
  let toNextLevelPoints = levelCount(nextLevel);
  let totalPointInLevel = toNextLevelPoints - toCurrentLevelPoints;
  let inBetweenLevelPoints = xp - toCurrentLevelPoints;
  let remainingPointsToNextLevel = totalPointInLevel - inBetweenLevelPoints;

  store.dispatch(
    setYakiChestStats({
      xp,
      currentLevel,
      nextLevel,
      toCurrentLevelPoints,
      toNextLevelPoints,
      totalPointInLevel,
      inBetweenLevelPoints,
      remainingPointsToNextLevel,
    })
  );
};

const initiFirstLoginStats = (user_stats) => {
  let xp = user_stats.xp;
  let lvl = getCurrentLevel(xp);
  let nextLevel = lvl + 1;
  let toCurrentLevelPoints = levelCount(lvl);
  let toNextLevelPoints = levelCount(nextLevel);
  let totalPointInLevel = toNextLevelPoints - toCurrentLevelPoints;
  let inBetweenLevelPoints = xp - toCurrentLevelPoints;
  let actions = user_stats.actions.map((item) => {
    return {
      ...item,
      display_name: user_stats.platform_standards[item.action].display_name,
    };
  });

  store.dispatch(
    setUserFirstLoginYakiChest({
      xp,
      lvl,
      percentage: (inBetweenLevelPoints * 100) / totalPointInLevel,
      actions,
    })
  );
};

const getUser = (pubkey) => {
  const store_ = store.getState();
  const nostrAuthors = store_.nostrAuthors;
  return nostrAuthors.find((item) => item.pubkey === pubkey);
};

const saveRelaysListsForUsers = async (pubkeyList) => {
  try {
    let list = await getRelayListForUsers(pubkeyList, ndkInstance);
    let followingsRelayList = [...list].map((relays) => {
      return {
        pubkey: relays[0],
        relays: getRelayList(relays[1].tags),
      };
    });
    savefollowingsRelays(followingsRelayList);
  } catch (err) {
    console.log(err);
  }
};

const getRelayList = (list) => {
  let relays = list.filter((relay) => relay[0] === "r" && relay.length > 1);
  let parsedRelays = [];

  for (let relay of relays) {
    if (relay.length > 2)
      parsedRelays.push({
        url: relay[1],
        write:
          relay[2].toLowerCase() === "write" || relay[2] === "" ? true : false,
        read:
          relay[2].toLowerCase() === "read" || relay[2] === "" ? true : false,
      });
    if (relay.length <= 2)
      parsedRelays.push({
        url: relay[1],
        write: true,
        read: true,
      });
  }
  return parsedRelays;
};

const handleReceivedEvents = (set, event) => {
  let index = set.findIndex((_) => _.id === event.id);
  if (index === -1)
    return [...set, event].sort((ev1, ev2) => ev2.created_at - ev1.created_at);

  if (set[index].created_at < event.created_at) {
    let tempSet = Array.from(set);
    tempSet.slice(index, 0, event);
    return tempSet;
  }
  return set;
};

const getSubData = async (filter, timeout = 1000) => {
  if (!filter || filter.length === 0) return { data: [], pubkeys: [] };

  return new Promise((resolve, reject) => {
    let events = [];
    let pubkeys = [];

    let filter_ = filter.map((_) => {
      let temp = { ..._ };
      if (!_["#t"]) {
        delete temp["#t"];
        return temp;
      }
      return temp;
    });

    let sub = ndkInstance.subscribe(filter_, {
      cacheUsage: "CACHE_FIRST",
      groupable: false,
      skipVerification: true,
      skipValidation: true,
    });
    let timer;

    const startTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        sub.stop();
        resolve({
          data: sortEvents(removeEventsDuplicants(events)),
          pubkeys: [...new Set(pubkeys)],
        });
      }, timeout);
    };

    sub.on("event", (event) => {
      pubkeys.push(event.pubkey);
      events.push(event.rawEvent());
      startTimer();
    });

    startTimer();
  });
};

const InitEvent = async (kind, content, tags, created_at) => {
  try {
    let userKeys = getKeys();
    let temCreatedAt = created_at || Math.floor(Date.now() / 1000);
    let tempEvent = {
      created_at: temCreatedAt,
      kind,
      content,
      tags,
    };
    if (userKeys.ext) {
      try {
        tempEvent = await window.nostr.signEvent(tempEvent);
      } catch (err) {
        console.log(err);
        return false;
      }
    } else {
      tempEvent = finalizeEvent(tempEvent, userKeys.sec);
    }
    return tempEvent;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const getEventStatAfterEOSE = (
  reaction,
  kind,
  oldStats,
  extra,
  zapsCreatedAt
) => {
  let stats = { ...oldStats };
  if (reaction.kind === 9734) {
    stats[kind][kind] = removeObjDuplicants(stats[kind][kind], [
      { id: reaction.id, pubkey: reaction.pubkey, amount: extra },
    ]);
    stats[kind].total = stats[kind].total + extra;
  } else
    stats[kind][kind] = removeObjDuplicants(stats[kind][kind], [
      { id: reaction.id, pubkey: reaction.pubkey },
    ]);
  stats[kind].since = zapsCreatedAt
    ? zapsCreatedAt + 1
    : reaction.created_at + 1;
  return stats;
};

const translate = async (text) => {
  let service = getContentTranslationConfig();
  let lang = getAppLang();
  let { raw, specialContent } = extractRawContent(text);

  let res = await axiosInstance.post("/api/v1/translate", {
    service,
    lang,
    text,
  });
  return res.data;
  // if (service.service === "dl") {
  //   let translatedContent = await dlTranslate(
  //     raw,
  //     service,
  //     lang,
  //     specialContent
  //   );
  //   return translatedContent;
  // }
  // if (service.service === "lt") {
  //   let translatedContent = await ltTranslate(
  //     raw,
  //     service,
  //     lang,
  //     specialContent
  //   );
  //   return translatedContent;
  // }
  // if (service.service === "nw") {
  //   let translatedContent = await nwTranslate(
  //     raw,
  //     service,
  //     lang,
  //     specialContent
  //   );
  //   return translatedContent;
  // }
};

const dlTranslate = async (text, service, lang, specialContent) => {
  try {
    let path = service.plan
      ? translationServicesEndpoints.dl.pro
      : translationServicesEndpoints.dl.free;
    let apikey = service.plan ? service.proApikey : service.freeApikey;
    if (!apikey) {
      return {
        status: 400,
        res: "",
      };
    }
    let data = await axios.post(
      path,
      {
        text: [text],
        target_lang: lang,
      },
      {
        headers: {
          Authorization: `DeepL-Auth-key ${apikey}`,
        },
      }
    );
    return {
      status: 200,
      res: revertContent(data.data.translations[0].text, specialContent),
    };
  } catch (err) {
    console.log(err);
    return {
      status:
        err?.response?.status >= 500 || !err?.response?.status ? 500 : 400,
      res: "",
    };
  }
};
const ltTranslate = async (text, service, lang, specialContent) => {
  try {
    let path = service.plan
      ? translationServicesEndpoints.lt.pro
      : translationServicesEndpoints.lt.free;
    let apikey = service.plan ? service.proApikey : service.freeApikey;
    if (service.plan && !apikey) {
      return {
        status: 400,
        res: "",
      };
    }
    let data = await axios.post(
      path,
      {
        q: text,
        source: "auto",
        target: lang,
        format: "text",
        api_key: apikey || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    return {
      status: 200,
      res: revertContent(data.data.translatedText, specialContent),
    };
  } catch (err) {
    console.log(err);
    return {
      status:
        err?.response?.status >= 500 || !err?.response?.status ? 500 : 400,
      res: "",
    };
  }
};
const nwTranslate = async (text, service, lang, specialContent) => {
  try {
    let path = translationServicesEndpoints.nw.pro;

    let apikey = service.proApikey;
    if (!apikey) {
      return {
        status: 400,
        res: "",
      };
    }
    let data = await axios.post(
      path,
      {
        q: text,
        source: "auto",
        target: lang,
        format: "text",
        api_key: apikey || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return {
      status: 200,
      res: revertContent(data.data.translatedText, specialContent),
    };
  } catch (err) {
    console.log(err);
    return {
      status:
        err?.response?.status >= 500 || !err?.response?.status ? 500 : 400,
      res: "",
    };
  }
};

const extractRawContent = (text) => {
  let raw = text
    .split(/(\n)/)
    .flatMap((segment) => (segment === "\n" ? "\n" : segment.split(/\s+/)))
    .filter(Boolean);

  let specialContent = [];
  let scIndex = 0;
  for (let i = 0; i < raw.length; i++) {
    if (
      /(https?:\/\/)/i.test(raw[i]) ||
      raw[i].startsWith("npub1") ||
      raw[i].startsWith("nprofile1") ||
      raw[i].startsWith("nevent") ||
      raw[i].startsWith("naddr") ||
      raw[i].startsWith("note1") ||
      raw[i].startsWith("nostr:") ||
      raw[i].startsWith("#")
    ) {
      specialContent.push(raw[i]);
      raw[i] = `{${scIndex}}`;
      scIndex = scIndex + 1;
    }
  }
  return {
    raw: raw.join(" "),
    specialContent,
  };
};
const revertContent = (rawContent, specialContent) => {
  let raw = rawContent;
  for (let i = 0; i < specialContent.length; i++) {
    raw = raw.replace(`{${i}}`, specialContent[i]);
  }
  return raw;
};

export {
  ConnectNDK,
  aggregateUsers,
  getNostrClients,
  getUserFromNOSTR,
  addConnectedAccounts,
  logoutAllAccounts,
  handleSwitchAccount,
  userLogout,
  updateYakiChestStats,
  initiFirstLoginStats,
  getUser,
  saveRelaysListsForUsers,
  getRelayList,
  handleReceivedEvents,
  getUserRelaysFromNOSTR,
  getSubData,
  InitEvent,
  getEventStatAfterEOSE,
  translate,
};
