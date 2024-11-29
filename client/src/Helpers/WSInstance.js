import { getParsedAuthor } from "./Encryptions";

export const PCACHE_KINDS = {
  EVENT_STATS: 10000100,
  NET_STATS: 10000101,
  USER_PROFILE: 10000105,
  REFERENCED_EVENT: 10000107,
  RANGE: 10000113,
  EVENT_ACTIONS_COUNT: 10000115,
  DIRECTMSG_COUNT: 10000117,
  DIRECTMSG_COUNTS: 10000118,
  EVENT_IDS: 10000122,
  PARTIAL_RESPONSE: 10000123,
  IS_USER_FOLLOWING: 10000125,
  EVENT_IMPORT_STATUS: 10000127,
  ZAP_EVENT: 10000129,
  FILTERING_REASON: 10000131,
  USER_FOLLOWER_COUNTS: 10000133,
  DIRECTMSG_COUNT_2: 10000134,
  NOSTR_STATS: 10000136,
  IS_HIDDEN_BY_CONTENT_MODERATION: 10000137,
  USER_PUBKEY: 10000138,
  USER_RELAYS: 10000139,
  EVENT_RELAYS: 10000141,
  LONG_FORM_METADATA: 10000144,
  RECOMMENDED_READS: 10000145,
  READS_TOPICS: 10000146,
  CREATOR_PAID_TIERS: 10000147,
  FEATURED_AUTHORS: 10000148,
  HIGHLIGHT_GROUPS: 10000151,
  READS_FEEDS: 10000152,
  HOME_FEEDS: 10000153,
  FEATURED_DVM_FEEDS: 10000154,
  DVM_FEED_FOLLOWS_ACTIONS: 10000156,
  USER_FOLLOWER_COUNT_INCREASES: 10000157,
  USER_PRIMAL_NAMES: 10000158,
  DVM_FEED_METADATA: 10000159,
};

const pendingRequests = new Map();
let socket = null;
const connectWebSocket = (url) => {
  return new Promise((resolve, reject) => {
    const socket_ = new WebSocket(url);

    socket_.onopen = () => {
      console.log("WebSocket is connected");
      resolve(socket_);
    };

    socket_.onerror = (error) => {
      reject(error);
    };

    socket_.onclose = async () => {
      console.log("WebSocket connection closed");
      socket = await connectWebSocket(url);
    };

    socket_.onmessage = (event) => {
      const ev = JSON.parse(event.data);
      const messageType = ev[0];
      const requestId = ev[1];
      if (messageType === "EOSE" && pendingRequests.has(requestId)) {
        const { resolve, responses } = pendingRequests.get(requestId);
        resolve(responses);
        pendingRequests.delete(requestId);
      } else {
        const response = ev[2];
        if (pendingRequests.has(requestId)) {
          const { responses } = pendingRequests.get(requestId);
          if (response) responses.push(response);
        }
      }
    };
  });
};

socket = await connectWebSocket("wss://cache2.primal.net/v1");

export const getThreadView = async (id, pubkey) => {
  try {
    const requestId = `thread_view_${id}`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        {
          cache: [
            "thread_view",
            { event_id: id, user_pubkey: pubkey, limit: 100 },
          ],
        },
      ]),
      requestId
    );
    return data;
  } catch (err) {
    console.log(err);
    return [];
  }
};
export const getEventQuote = async (id) => {
  try {
    const requestId = `note_mentions_${id}`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        { cache: ["note_mentions", { event_id: id }] },
      ]),
      requestId
    );
    return data;
  } catch (err) {
    console.log(err);
    return [];
  }
};
export const getMutualFollows = async (pubkey, user_pubkey) => {
  try {
    const requestId = `mutual_follows_${pubkey}_${user_pubkey}`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        { cache: ["mutual_follows", { pubkey, user_pubkey }] },
      ]),
      requestId
    );
    return data;
  } catch (err) {
    console.log(err);
    return [];
  }
};
export const getUserFollowers = async (pubkey) => {
  try {
    const requestId = `user_followers_${pubkey}`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        { cache: ["user_followers", { pubkey, limit: 1000 }] },
      ]),
      requestId
    );
    return data;
  } catch (err) {
    console.log(err);
    return [];
  }
};
export const getUserStats = async (pubkey) => {
  try {
    const requestId = `user_profile_${pubkey}`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        { cache: ["user_profile", { pubkey }] },
      ]),
      requestId
    );
    return data;
  } catch (err) {
    console.log(err);
    return [];
  }
};
export const getPopularNotes = async (pubkey) => {
  try {
    const requestId = `user_profile_scored_content_${pubkey}`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        { cache: ["user_profile_scored_content", { pubkey, limit: 5 }] },
      ]),
      requestId
    );
    return data;
  } catch (err) {
    console.log(err);
    return [];
  }
};
export const getHighlights = async (limit = 30, until = undefined) => {
  try {
    const requestId = `feed_9a500dccc084a138330a1d1b2be0d5e86394624325d25084d3eca164e7ea698a`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        {
          cache: [
            "feed",
            {
              pubkey:
                "9a500dccc084a138330a1d1b2be0d5e86394624325d25084d3eca164e7ea698a",
              limit,
              until,
            },
          ],
        },
      ]),
      requestId
    );
    return data.filter((event) => event.kind === 1);
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getTrendingUsers24h = async () => {
  try {
    const requestId = `scored_users_24h`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        {
          cache: ["scored_users_24h", {}],
        },
      ]),
      requestId
    );

    return data
      .filter((event) => event.kind === 0)
      .map((user) => getParsedAuthor(user));
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getTrendingNotes1h = async () => {
  try {
    const requestId = `scored_1h`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        {
          cache: ["scored", { selector: "trending_1h"}],
        },
      ]),
      requestId
    );
    return data.filter((event) => event.kind === 1);
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getNotesByTag = async (tag) => {
  try {
    const requestId = `notes_by_tag`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        {
          cache: ["search", { query: tag, limit: 10 }],
        },
      ]),
      requestId
    );
    return data.filter((event) => event.kind === 1);
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getTrending = async (limit = 30, until = undefined) => {
  try {
    const requestId = `explore`;
    let requestOptions = until
      ? {
          timeframe: "trending",
          scope: "global",
          limit,
          until,
          created_after: Math.floor(Date.now() / 1000) - 86400,
        }
      : {
          timeframe: "trending",
          scope: "global",
          limit,
          created_after: Math.floor(Date.now() / 1000) - 86400,
        };
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        {
          cache: [
            "explore",
            {
              ...requestOptions,
            },
          ],
        },
      ]),
      requestId
    );

    let score =
      JSON.parse(data.find((event) => event.kind === 10000113).content)?.since -
      1;

    return { data: data.filter((event) => event.kind === 1), score };
  } catch (err) {
    console.log(err);
    return [];
  }
};
export const getEventActions = async (id, kindName) => {
  try {
    let kind = 7;
    if (kindName === "reposts") kind = 6;
    if (kindName === "comments") kind = 1;
    if (kindName === "reactions") kind = 7;

    const requestId = `${kindName}_${id}`;
    const data = await requestData(
      JSON.stringify([
        "REQ",
        requestId,
        { cache: ["event_actions", { event_id: id, kind }] },
      ]),
      requestId
    );
    return data;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const requestData = (message, requestId) => {
  return new Promise((resolve, reject) => {
    const responses = [];

    pendingRequests.set(requestId, { resolve, responses });

    socket.send(message);

    socket.onerror = (error) => {
      console.log(error);
      reject(error);
    };
  });
};
