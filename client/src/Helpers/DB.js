import Dexie from "dexie";
import {
  aggregateUsers,
  getNostrClients,
  getRelayList,
  getSubData,
  getUserRelaysFromNOSTR,
} from "./Controlers";
import axios from "axios";
import {
  getEmptyEventStats,
  getEmptyuserMetadata,
  getParsedAuthor,
  sortEvents,
} from "./Encryptions";
import { store } from "../Store/Store";
import { getRelayListForUser } from "@nostr-dev-kit/ndk";
import { ndkInstance } from "./NDKInstance";

const db = new Dexie("yaki-nostr-2");
const ndkdb = new Dexie("ndk-store");

ndkdb.version(1).stores({
  events: "",
});

db.version(2).stores({
  chatrooms: "",
  muted: "",
  interests: "",
  followings: "",
  followingsRelays: "",
  relays: "",
  bookmarks: "",
  users: "",
  clients: "",
  eventStats: "",
  notificationLastEventTS: "",
});

export { db, ndkdb };

export const getChatrooms = async (pubkey) => {
  if (db) {
    try {
      let chatroomsKeys = await db
        .table("chatrooms")
        .filter((item) => item)
        .primaryKeys();
      chatroomsKeys = chatroomsKeys.filter((item) =>
        item.includes(`,${pubkey}`)
      );
      let chatrooms = await db.table("chatrooms").bulkGet(chatroomsKeys);

      return chatrooms
        ? chatrooms.sort(
            (convo_1, convo_2) => convo_2.last_message - convo_1.last_message
          )
        : [];
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};

export const getFollowings = async (pubkey) => {
  if (db) {
    try {
      let followings = await db.table("followings").get(pubkey);
      return followings || [];
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};
export const getInterestsList = async (pubkey) => {
  if (db) {
    try {
      let interests = await db.table("interests").get(pubkey);
      return interests || [];
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};

export const getMutedlist = async (pubkey) => {
  if (db) {
    try {
      let mutedlist = await db.table("muted").get(pubkey);
      return mutedlist || [];
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};

export const getNotificationLastEventTS = async (pubkey) => {
  if (db) {
    try {
      let mutedlist = await db.table("notificationLastEventTS").get(pubkey);
      return mutedlist || undefined;
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};

export const getRelays = async (pubkey) => {
  if (db) {
    try {
      let relays = await db.table("relays").get(pubkey);
      return relays || [];
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};

export const getBookmarks = async (pubkey) => {
  if (db) {
    try {
      let bookmarks = await db.table("bookmarks").get(pubkey);

      return bookmarks || [];
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};

export const getUserDDB = async (pubkey) => {
  if (db) {
    try {
      let user = await db.table("users").get(pubkey);

      return user || getEmptyuserMetadata(pubkey);
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};

export const getUsers = async () => {
  if (db) {
    try {
      // if (!db.isOpen()) {
      //   await db.open();
      // }

      let users = await db.table("users").toArray();

      return users;
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};
export const getClients = async () => {
  if (db) {
    try {
      let clients = await db.table("clients").toArray();
      return clients;
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};

export const getFollowingsRelays = async () => {
  if (db) {
    try {
      let followingsRelays = await db.table("followingsRelays").toArray();
      return followingsRelays;
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};
export const getEventStats = async (event_id) => {
  if (db) {
    try {
      let user = await db.table("eventStats").get(event_id);

      return user || getEmptyEventStats(event_id);
    } catch (err) {
      console.log(err);
      return [];
    }
  } else return [];
};
export const saveChatrooms = async (inbox, authors, pubkey) => {
  let usersPubkeys = inbox.map((inbox) => inbox.pubkey);
  saveUsers(usersPubkeys);
  let oldAggregatedchatrooms = await getChatrooms(pubkey);
  let sortedInbox = aggregateUsers(inbox, oldAggregatedchatrooms, pubkey);
  const chatroomData = sortedInbox.map((ibx) => ({
    ...ibx,
  }));
  const chatroomKeys = sortedInbox.map((ibx) => `${ibx.pubkey},${pubkey}`);
  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.chatrooms, async () => {
        await db.chatrooms.bulkPut(chatroomData, chatroomKeys);
      });
    });
  } catch (err) {
    console.log(err);
  }
};
export const checkCurrentConvo = async (convo, pubkey) => {
  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.chatrooms, async () => {
        await db.chatrooms.put(convo, `${convo.pubkey},${pubkey}`);
      });
    });
  } catch (err) {
    console.log(err);
  }
};
export const checkAllConvo = async (convos, pubkey) => {
  try {
    const chatroomKeys = convos.map((ibx) => `${ibx.pubkey},${pubkey}`);
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.chatrooms, async () => {
        await db.chatrooms.bulkPut(convos, chatroomKeys);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const saveFollowings = async (event, pubkey, lastTimestamp) => {
  if (!event && lastTimestamp) return;
  let eventToStore = { last_timestamp: undefined, followings: [] };

  if (event) {
    let followings = event.tags
      .filter((tag) => tag[0] === "p")
      .map((tag) => tag[1]);
    eventToStore = { last_timestamp: event.created_at, followings };
  }

  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.followings, async () => {
        await db.followings.put(eventToStore, pubkey);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const saveInterests = async (event, pubkey, lastTimestamp) => {
  if (!event && lastTimestamp) return;
  let eventToStore = { last_timestamp: undefined, interestsList: [] };

  if (event) {
    let interestsList = event.tags
      .filter((tag) => tag[0] === "t")
      .map((tag) => tag[1]);
    eventToStore = { last_timestamp: event.created_at, interestsList };
  }

  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.interests, async () => {
        await db.interests.put(eventToStore, pubkey);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const savefollowingsRelays = async (followingsRelays) => {
  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.followingsRelays, async () => {
        for (let relaysSet of followingsRelays)
          await db.followingsRelays.put(relaysSet, relaysSet.pubkey);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const saveMutedlist = async (event, pubkey, lastTimestamp) => {
  if (!event && lastTimestamp) return;
  let eventToStore = { last_timestamp: undefined, mutedlist: [] };
  if (event) {
    let mutedlist = event.tags
      .filter((tag) => tag[0] === "p")
      .map((tag) => tag[1]);
    eventToStore = { last_timestamp: event.created_at, mutedlist };
  }

  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.muted, async () => {
        await db.muted.put(eventToStore, pubkey);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const saveRelays = async (event, pubkey, lastTimestamp) => {
  if (!event && lastTimestamp) return;
  let eventToStore = { last_timestamp: undefined, relays: [] };
  if (event) {
    let relays = getRelayList(event.tags);
    eventToStore = { last_timestamp: event.created_at, relays };
  }

  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.relays, async () => {
        await db.relays.put(eventToStore, pubkey);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const saveBookmarks = async (bookmarks, pubkey) => {
  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.bookmarks, async () => {
        await db.bookmarks.put(bookmarks, pubkey);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const saveUsers = async (pubkeys) => {
  try {
    let BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;
    const users_pubkeys = [...new Set(pubkeys)];
    const data = await getSubData(
      [{ kinds: [0], authors: users_pubkeys }],
      400
    );
    let users = data.data;
    if (users.length === 0) return;

    let res = sortEvents(users);
    res = res
      .filter((item, index, res) => {
        if (res.findIndex((_) => _.pubkey === item.pubkey) === index)
          return item;
      })
      .map((user) => {
        try {
          let _ = getParsedAuthor(user);
          if (_) return _;
          else return false;
        } catch (err) {
          return false;
        }
      })
      .filter((_) => _);

    // let data = await axios.post(BASE_URL + "/api/v1/users", {
    //   users_pubkeys,
    // });
    // let res = data.data;

    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.users, async () => {
        for (let metadata of res) await db.users.put(metadata, metadata.pubkey);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const clearDB = () => {
  try {
    if (db) {
      db.tables.forEach((table) => {
        if (!["users"].includes(table.name))
          table.clear().then(() => {
            console.log(`${table.name} cleared`);
          });
      });
    }
  } catch (err) {
    console.log(err);
  }
};

export const removeRecordFromNDKStore = async (id) => {
  try {
    if (ndkdb) {
      await ndkdb.open();
      await ndkdb.events.delete(id);
      console.log("deleted", id);
    }
  } catch (err) {
    console.log(err);
  }
};
export const removeEventStats = async (main_event_id, event_id, kind) => {
  try {
    let event = await getEventStats(main_event_id);
    let tempEventStats = { ...event };
    tempEventStats[kind][kind] = tempEventStats[kind][kind].filter(
      (_) => _.id !== event_id
    );
    saveEventStats(main_event_id, tempEventStats);
  } catch (err) {
    console.log(err);
  }
};

export const getOutboxRelays = async (pubkey) => {
  try {
    const store_ = store.getState();
    const userFollowingsRelays = store_.userFollowingsRelays;
    let relays = userFollowingsRelays.find((item) => item.pubkey === pubkey);
    if (relays) {
      return relays.relays
        .filter((relay) => relay.read)
        .map((relay) => relay.url)
        .splice(0, 2);
    }

    let userRelaysFromNOSTR = await getRelayListForUser(pubkey, ndkInstance);

    if (userRelaysFromNOSTR) {
      let relaysList = getRelayList(userRelaysFromNOSTR.tags);
      savefollowingsRelays([{ pubkey, relays: relaysList }]);
      return relaysList
        .filter((relay) => relay.read)
        .map((relay) => relay.url)
        .splice(0, 2);
    }
    return [];
  } catch (err) {
    console.log(err);
  }
};

export const saveFetchedUsers = async (profiles) => {
  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.users, async () => {
        for (let metadata of profiles)
          await db.users.put(metadata, metadata.pubkey);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const saveNostrClients = async () => {
  try {
    let cachedClients = await getClients();
    let sortedClients = cachedClients.sort(
      (client_1, client_2) => client_1.created_at - client_2.created_at
    );
    let until = undefined;
    if (sortedClients.length > 0) until = sortedClients[0];

    let clients = await getNostrClients(until);

    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.clients, async () => {
        for (let client of clients) await db.clients.put(client, client.pubkey);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const saveEventStats = async (event_id, stats) => {
  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.eventStats, async () => {
        await db.eventStats.put(stats, event_id);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const saveNotificationLastEventTS = async (pubkey, timstamp) => {
  try {
    await Dexie.ignoreTransaction(async () => {
      await db.transaction("rw", db.notificationLastEventTS, async () => {
        await db.notificationLastEventTS.put(timstamp, pubkey);
      });
    });
  } catch (err) {
    console.log(err);
  }
};

// db.open().then(() => {
//     // Access all tables in the database
//     db.tables.forEach(table => {
//         console.log("Table name:", table.name);
//         table.toArray().then(records => {
//             console.log(records.keys())
//             console.log(`Records from ${table.name}:`, records);
//         });
//     });
// }).catch(error => {
//     console.error("Failed to open the database:", error);
// });
// db.version(3).stores({ chatrooms: "" });
