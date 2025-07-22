import { bech32 } from "bech32";
import { Buffer } from "buffer";
import { nip04, nip19, nip44 } from "nostr-tools";
import * as secp from "@noble/secp256k1";
import { decode } from "light-bolt11-decoder";
import { getImagePlaceholder } from "../Content/NostrPPPlaceholder";
import CryptoJS from "crypto-js";
import {
  compactContent,
  getAppLang,
  getCustomSettings,
  getKeys,
  getNoteTree,
  nEventEncode,
} from "./Helpers";
import { t } from "i18next";
import axiosInstance from "./HTTP_Client";
import { SigningStargateClient } from "@cosmjs/stargate";
import { DORA_CONFIG } from "../Content/MACI";
import { MaciClient } from "@dorafactory/maci-sdk";
import { store } from "../Store/Store";
import { setToast } from "../Store/Slides/Publishers";
import { BunkerSigner, parseBunkerInput } from "nostr-tools/nip46";

const LNURL_REGEX =
  /^(?:http.*[&?]lightning=|lightning:)?(lnurl[0-9]{1,}[02-9ac-hj-np-z]+)/;
const LN_ADDRESS_REGEX =
  /^((?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*)|(?:".+"))@((?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(?:(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const LNURLP_REGEX =
  /^lnurlp:\/\/([\w-]+\.)+[\w-]+(:\d{1,5})?(\/[\w-.\/?%&=]*)?$/;

const getBech32 = (prefix, key) => {
  let buff = secp.utils.hexToBytes(key);
  return bech32.encode(prefix, bech32.toWords(buff));
};
const getHex = (key) => {
  return secp.utils.bytesToHex(
    Uint8Array.from(bech32.fromWords(bech32.decode(key).words))
  );
};
const bytesTohex = (arrayBuffer) => {
  const byteToHex = [];

  for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
  }
  const buff = new Uint8Array(arrayBuffer);
  const hexOctets = [];

  for (let i = 0; i < buff.length; ++i) hexOctets.push(byteToHex[buff[i]]);

  return hexOctets.join("");
};
const shortenKey = (key, length = 10) => {
  let firstHalf = key.substring(0, length);
  let secondHalf = key.substring(key.length - length, key.length);
  return `${firstHalf}....${secondHalf}`;
};
const minimizeKey = (key) => {
  if (!key) return key;
  return key.substring(key.length - 10, key.length);
};

const getEmptyEventStats = (eventID) => {
  return {
    event_id: eventID,
    likes: {
      likes: [],
      since: undefined,
    },
    reposts: {
      reposts: [],
      since: undefined,
    },
    replies: {
      replies: [],
      since: undefined,
    },
    quotes: {
      quotes: [],
      since: undefined,
    },
    zaps: {
      total: 0,
      zaps: [],
      since: undefined,
    },
  };
};
const getEmptyuserMetadata = (pubkey) => {
  return {
    name: pubkey ? getBech32("npub", pubkey).substring(0, 10) : "",
    display_name: pubkey ? getBech32("npub", pubkey).substring(0, 10) : "",
    picture: "",
    banner: "",
    about: "",
    lud06: "",
    lud16: "",
    nip05: "",
    website: "",
    pubkey,
    created_at: 0,
  };
};
const getuserMetadata = (data) => {
  try {
    let userAbout = JSON.parse(data.content) || {};
    let userData = {
      pubkey: data.pubkey,
      picture: userAbout?.picture || "",
      banner: userAbout?.banner || "",
      display_name:
        userAbout?.display_name ||
        userAbout?.name ||
        getBech32("npub", data.pubkey),
      name:
        userAbout?.name ||
        userAbout?.display_name ||
        getBech32("npub", data.pubkey),
      about: userAbout?.about || "",
      nip05: userAbout?.nip05 || "",
      lud06: userAbout?.lud06 || "",
      lud16: userAbout?.lud16 || "",
      website: userAbout?.website || "",
      created_at: data.created_at || Math.floor(Date.now() / 1000),
    };
    return userData;
  } catch (err) {
    console.log(err);
    return getEmptyuserMetadata(data.pubkey);
  }
};

const decodeUrlOrAddress = (lnUrlOrAddress) => {
  const bech32Url = parseLnUrl(lnUrlOrAddress);
  if (bech32Url) {
    const decoded = bech32.decode(bech32Url, 20000);
    return Buffer.from(bech32.fromWords(decoded.words)).toString();
  }

  const address = parseLightningAddress(lnUrlOrAddress);
  if (address) {
    const { username, domain } = address;
    const protocol = domain.match(/\.onion$/) ? "http" : "https";
    return `${protocol}://${domain}/.well-known/lnurlp/${username}`;
  }

  return parseLnurlp(lnUrlOrAddress);
};

const parseLnUrl = (url) => {
  if (!url) return null;
  const result = LNURL_REGEX.exec(url.toLowerCase());
  return result ? result[1] : null;
};

const parseLightningAddress = (address) => {
  if (!address) return null;
  const result = LN_ADDRESS_REGEX.exec(address);
  return result ? { username: result[1], domain: result[2] } : null;
};

const parseLnurlp = (url) => {
  if (!url) return null;

  const parsedUrl = url.toLowerCase();
  if (!LNURLP_REGEX.test(parsedUrl)) return null;

  const protocol = parsedUrl.includes(".onion") ? "http://" : "https://";
  return parsedUrl.replace("lnurlp://", protocol);
};

const encodeLud06 = (url) => {
  try {
    let words = bech32.toWords(Buffer.from(url, "utf8"));
    let newConvertedAddress = bech32.encode("lnurl", words, 2000);
    return newConvertedAddress;
  } catch {
    return "";
  }
};

const getParsedAuthor = (data) => {
  let content = data.content ? JSON.parse(data.content) : {};
  let tempAuthor = {
    display_name:
      content?.display_name || content?.name || data.pubkey.substring(0, 10),
    name:
      content?.name || content?.display_name || data.pubkey.substring(0, 10),
    picture: content?.picture || "",
    pubkey: data.pubkey,
    banner: content?.banner || getImagePlaceholder(),
    about: content?.about || "",
    lud06: content?.lud06 || "",
    lud16: content?.lud16 || "",
    website: content?.website || "",
    nip05: content?.nip05 || "",
  };
  return tempAuthor;
};

const getParsedSW = (event) => {
  let id = event.id;
  let title = event.content;
  let pubkey = event.pubkey;
  let image = "";
  let input = "";
  let d = "";
  let type = "basic";
  let icon = "";
  let buttons = [];

  for (let tag of event.tags) {
    if (tag[0] === "d") d = tag[1];
    if (tag[0] === "l") type = tag[1];
    if (tag[0] === "icon") icon = tag[1];
    if (tag[0] === "image") image = tag[1];
    if (tag[0] === "input") input = tag[1];
    if (tag[0] === "button")
      buttons = [...buttons, { label: tag[1], type: tag[2], url: tag[3] }];
  }

  return {
    id,
    created_at: event.created_at,
    sig: event.sig,
    pubkey,
    aTag: `30033:${event.pubkey}:${d}`,
    type,
    icon,
    tags: event.tags,
    d,
    naddr: nip19.naddrEncode({ pubkey, identifier: d, kind: event.kind }),
    kind: event.kind,
    title,
    image,
    input,
    buttons,
    components: input
      ? [
          { value: image, type: "image" },
          { value: input, type: "input" },
          { value: buttons, type: "button" },
        ]
      : [
          { value: image, type: "image" },
          { value: buttons, type: "button" },
        ],
  };
};

const getParsedRepEvent = (event) => {
  try {
    let imeta_url = "";
    let content = {
      id: event.id,
      pubkey: event.pubkey,
      kind: event.kind,
      content: event.content,
      created_at: event.created_at,
      tags: event.tags,
      author: getEmptyuserMetadata(event.pubkey),
      title: [34235, 34236, 30033].includes(event.kind) ? event.content : "",
      description: "",
      image: "",
      imagePP: getImagePlaceholder(),
      published_at: event.created_at,
      contentSensitive: false,
      d: "",
      client: "",
      items: [],
      tTags: [],
      seenOn: event.onRelays
        ? [...new Set(event.onRelays.map((relay) => relay.url))]
        : [],
      dir: detectDirection(event.content),
      vUrl: "",
    };
    for (let tag of event.tags) {
      if (tag[0] === "title") {
        content.title = tag[1];
      }
      if (["image", "thumbnail", "thumb"].includes(tag[0])) {
        content.image = tag[1];
      }
      if (["description", "excerpt", "summary"].includes(tag[0])) {
        content.description = tag[1];
      }
      if (tag[0] === "d") {
        content.d = encodeURIComponent(tag[1]);
      }
      if (tag[0] === "published_at") {
        content.published_at =
          parseInt(tag[1]) !== NaN ? parseInt(tag[1]) : event.created_at;
      }
      if (tag[0] === "client") {
        if (tag.length >= 3 && tag[2].includes("31990")) {
          content.client = tag[2];
        }
        if ((tag.length >= 3 && !tag[2].includes("31990")) || tag.length < 3)
          content.client = tag[1];
      }
      if (tag[0] === "L" && tag[1] === "content-warning")
        content.contentSensitive = true;
      if (
        tag[0] === "a" ||
        tag[0] === "e" ||
        tag[0] === "r" ||
        tag[0] === "t"
      ) {
        content.items.push(tag[1]);
      }
      if (tag[0] === "t") {
        content.tTags.push(tag[1]);
      }
      if (tag[0] === "url") content.vUrl = tag[1];
      if (tag[0] === "imeta") imeta_url = tag.find((_) => _.includes("url"));
    }
    if (imeta_url) content.vUrl = imeta_url.split(" ")[1];

    content.naddr = content.d
      ? nip19.naddrEncode({
          pubkey: event.pubkey,
          identifier: content.d,
          kind: event.kind,
        })
      : "";
    content.naddrData = {
      pubkey: event.pubkey,
      identifier: content.d,
      kind: event.kind,
    };
    content.aTag = `${event.kind}:${event.pubkey}:${content.d}`;

    return content;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const parsedMaciPoll = (poll) => {
  try {
    if (!poll)
      return { ...poll, voteOptionMap: [], results: [], resultsList: [] };
    const client = new MaciClient({
      network: process.env.REACT_APP_NETWORK,
    });
    let voteOptionMap = JSON.parse(poll.voteOptionMap);
    let results = JSON.parse(poll.results);

    let votingEnd = Math.floor(parseInt(poll.votingEnd) / 1000000);
    let votingStart = Math.floor(parseInt(poll.votingStart) / 1000000);
    let totalBond =
      poll.totalBond === "0"
        ? 0
        : parseInt(poll.totalBond.slice(0, -14)) / 10000;

    const votes = results.map((r) => ({
      v: Number(r.slice(0, -24)),
      v2: Number(r.slice(-24)),
    }));
    const totalVotes = votes.reduce(
      (s, c) => ({ v: s.v + c.v, v2: s.v2 + c.v2 }),
      { v: 0, v2: 0 }
    );
    const resultsList = votes.map((v) => ({
      v: parseFloat(((v.v / (totalVotes.v || 1)) * 100).toFixed(1)),
      v2: parseFloat(((v.v2 / (totalVotes.v2 || 1)) * 100).toFixed(1)),
    }));

    const status = client.maci.parseRoundStatus(
      Number(poll.votingStart),
      Number(poll.votingEnd),
      poll.status,
      new Date()
    );

    return {
      ...poll,
      status,
      voteOptionMap,
      results,
      resultsList,
      votingEnd,
      votingStart,
      totalBond,
    };
  } catch (err) {
    console.log(err);
    return { ...poll, voteOptionMap: [], results: [], resultsList: [] };
  }
};

const detectDirection = (text) => {
  const rtlCharRegExp =
    /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const ltrCharRegExp = /[a-zA-Z]/;

  let rtlCount = 0;
  let ltrCount = 0;

  for (const char of text) {
    if (rtlCharRegExp.test(char)) {
      rtlCount++;
    } else if (ltrCharRegExp.test(char)) {
      ltrCount++;
    }
  }

  if (rtlCount > ltrCount) {
    return "RTL";
  } else if (ltrCount > rtlCount) {
    return "LTR";
  }
  return "LTR";
};

const enableTranslation = async (text) => {
  try {
    const userLang = getAppLang();
    const userKeys = getKeys();
    let lang = await axiosInstance.post("/api/v1/translate/detect", { text });
    lang = lang.data;
    if (!userKeys) return false;
    if (lang === userLang) return false;
    return true;
  } catch (err) {
    console.log(err);
    return true;
  }
};

const getParsedNote =  (event, isCollapsedNote = false) => {
  try {
    let isNoteLong = event.content.split(" ").length > 150;
    let isCollapsedNoteEnabled = getCustomSettings().collapsedNote;
    isCollapsedNoteEnabled =
      isCollapsedNoteEnabled === undefined ? true : isCollapsedNoteEnabled;
    let isCollapsedNote_ =
      isCollapsedNoteEnabled && isCollapsedNote && isNoteLong;

    let isQuote = event.tags.find((tag) => tag[0] === "q");
    let checkForLabel = event.tags.find((tag) => tag[0] === "l");
    let isComment = event.tags.find(
      (tag) => tag.length > 0 && tag[3] === "root"
    );
    let isReply = event.tags.find(
      (tag) => tag.length > 0 && tag[3] === "reply"
    );
    let isFlashNews = false;
    if (checkForLabel && ["UNCENSORED NOTE"].includes(checkForLabel[1]))
      return false;
    if (checkForLabel && ["FLASH NEWS"].includes(checkForLabel[1])) {
      isFlashNews = true;
    }

    let nEvent = nEventEncode(event.id);
    // let nEvent = nip19.neventEncode({
    //   id: event.id,
    //   author: event.pubkey,
    // });

    let rawEvent =
      typeof event.rawEvent === "function" ? event.rawEvent() : event;
    let stringifiedEvent = JSON.stringify(rawEvent);
    let seenOn = event.onRelays
      ? [...new Set(event.onRelays.map((relay) => relay.url))]
      : [];

    if (event.kind === 1) {
      // let note_tree = compactContent(event.content, event.pubkey);
      let note_tree =  getNoteTree(
        event.content,
        undefined,
        isCollapsedNote_,
        undefined,
        event.pubkey
      );

      return {
        ...rawEvent,
        note_tree,
        stringifiedEvent,
        isQuote: isQuote ? isQuote[1] : "",
        // isQuote && !event.content.includes("nostr:nevent") ? isQuote[1] : "",
        isComment: isReply ? isReply[1] : isComment ? isComment[1] : false,
        isFlashNews,
        isCollapsedNote: isCollapsedNote_,
        nEvent,
        seenOn,
      };
    }

    if (event.kind === 6) {
      if (!event.content) return;
      // let relatedEvent = compactContent(
      //   JSON.parse(event.content).content,
      //   JSON.parse(event.content).pubkey
      // );
      let relatedEvent =  getParsedNote(JSON.parse(event.content), true);
      if (!relatedEvent) return false;
      return {
        ...rawEvent,
        seenOn,
        relatedEvent,
      };
    }
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const decodeBolt11 = (address) => {
  let decoded = decode(address);
  let amount = decoded.sections.find((item) => item.name === "amount");
  return (amount?.value || 0) / 1000;
};

const getBolt11 = (event) => {
  if (!event) return "";
  for (let tag of event.tags) {
    if (tag[0] === "bolt11") return tag[1];
  }
  return "";
};
const getZapper = (event) => {
  if (!event) return "";
  try {
    let sats = decodeBolt11(getBolt11(event));
    for (let tag of event.tags) {
      if (tag[0] === "description") {
        let tempEvent = JSON.parse(tag[1]);
        return {
          ...tempEvent,
          amount: sats,
          message: event.content || tempEvent.content,
        };
      }
    }
    return "";
  } catch (err) {
    console.log(err);
    return "";
  }
};

const checkForLUDS = (lud06, lud16) => {
  return lud16?.includes("@")
    ? encodeLud06(decodeUrlOrAddress(lud16))
    : lud06?.includes("@")
    ? encodeLud06(decodeUrlOrAddress(lud06))
    : lud06;
};

const convertDate = (toConvert, time = false) => {
  let timeConfig = time ? { hour: "numeric", minute: "numeric" } : {};
  return t("A3fEQj5", {
    val: toConvert,
    formatParams: {
      val: { year: "numeric", month: "short", day: "numeric", ...timeConfig },
    },
  });
};

const timeAgo = (date) => {
  const now = new Date();
  const diff = now - date;
  const diffInSeconds = Math.floor(diff / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = now.getFullYear() - date.getFullYear();

  if (diffInSeconds < 60) {
    return t("ArG9ME2");
  } else if (diffInMinutes < 60) {
    return t("AOPBXtv", {
      val: -diffInMinutes,
      style: "narrow",
      range: "minute",
    });
  } else if (diffInHours < 24) {
    return t("AOPBXtv", { val: -diffInHours, style: "narrow", range: "hour" });
  } else if (diffInDays < 7) {
    return t("AOPBXtv", { val: -diffInDays, style: "narrow", range: "day" });
  } else if (diffInWeeks < 5) {
    return t("AOPBXtv", { val: -diffInWeeks, style: "narrow", range: "weeks" });
  } else if (diffInMonths < 11 && diffInYears === 0) {
    return t("AOPBXtv", {
      val: -diffInMonths,
      style: "narrow",
      range: "month",
    });
  } else {
    return convertDate(date);
  }
};

const removeRelayLastSlash = (relay) => {
  let charToRemove = "/";
  const escapedChar = charToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^[${escapedChar}]+|[${escapedChar}]+$`, "g");
  return relay.replace(regex, "");
};

const filterRelays = (list_1, list_2) => {
  let tempArray = [...list_1, ...list_2];
  return tempArray.filter((item, index, tempArray) => {
    if (tempArray.findIndex((item_1) => item_1 === item) === index) return item;
  });
};

const removeDuplicants = (list_1, list_2 = []) => {
  let tempArray = [...list_1, ...list_2];
  return tempArray.filter((item, index, tempArray) => {
    if (tempArray.findIndex((item_1) => item_1 === item) === index) return item;
  });
};
const removeDuplicatedRelays = (list_1, list_2 = []) => {
  let tempArray = removeObjDuplicants([...list_1, ...list_2]);
  return tempArray.map((_) => {
    return {
      ..._,
      url: removeRelayLastSlash(_.url),
    };
  });
};
const removeObjDuplicants = (list_1, list_2 = []) => {
  const seen = new Set();
  const result = [];
  for (const item of [...list_1, ...list_2]) {
    const str = JSON.stringify(item);
    if (!seen.has(str)) {
      seen.add(str);
      result.push(item);
    }
  }
  return result;
};
const removeEventsDuplicants = (list_1, list_2 = []) => {
  const seen = new Set();
  const result = [];
  for (const item of [...list_1, ...list_2]) {
    if (item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
};
const sortEvents = (events) => {
  return events.sort((ev_1, ev_2) => ev_2.created_at - ev_1.created_at);
};

const encryptEventData = (data) => {
  let enc = CryptoJS.AES.encrypt(
    data,
    process.env.REACT_APP_ENC_SECRET
  ).toString();
  return enc;
};
const decryptEventData = (enc, data) => {
  let dec = CryptoJS.AES.decrypt(enc, process.env.REACT_APP_ENC_SECRET);
  return {
    dec: dec.toString(CryptoJS.enc.Utf8),
    status: dec.toString(CryptoJS.enc.Utf8) == data,
  };
};

const getClaimingData = async (pubkey, event_id, kind) => {
  try {
    let message = {
      pubkey,
      event_id,
      kind,
    };
    if (!window.nostr)
      return {
        status: false,
        message: t("AI6im93"),
      };
    let walletPubkey = await window.nostr.getPublicKey();
    if (walletPubkey !== pubkey)
      return {
        status: false,
        message: t("AZsINLj"),
      };
    const encrypted = await window.nostr.nip04.encrypt(
      process.env.REACT_APP_YAKI_PUBKEY,
      JSON.stringify(message)
    );
    return { status: true, message: encrypted };
  } catch (err) {
    console.log(err);
    return { status: false, message: t("AXd65kJ") };
  }
};

const decrypt04UsingBunker = async (userKeys, otherPartyPubkey, content) => {
  try {
    const bunkerPointer = await parseBunkerInput(userKeys.bunker);
    const bunker = new BunkerSigner(userKeys.localKeys.sec, bunkerPointer, {
      onauth: (url) => {
        window.open(
          url,
          "_blank",
          "width=600,height=650,scrollbars=yes,resizable=yes"
        );
      },
    });
    await bunker.connect();

    let data = await bunker.nip04Decrypt(otherPartyPubkey, content);
    return data;
  } catch (err) {
    console.log(err);
    return "";
  }
};

const encrypt04UsingBunker = async (userKeys, otherPartyPubkey, content) => {
  try {
    const bunkerPointer = await parseBunkerInput(userKeys.bunker);
    const bunker = new BunkerSigner(userKeys.localKeys.sec, bunkerPointer, {
      onauth: (url) => {
        window.open(
          url,
          "_blank",
          "width=600,height=650,scrollbars=yes,resizable=yes"
        );
      },
    });
    await bunker.connect();

    let data = await bunker.nip04Encrypt(otherPartyPubkey, content);
    return data;
  } catch (err) {
    console.log(err);
    return "";
  }
};

const encrypt44UsingBunker = async (userKeys, otherPartyPubkey, content) => {
  try {
    const bunkerPointer = await parseBunkerInput(userKeys.bunker);
    const bunker = new BunkerSigner(userKeys.localKeys.sec, bunkerPointer, {
      onauth: (url) => {
        window.open(
          url,
          "_blank",
          "width=600,height=650,scrollbars=yes,resizable=yes"
        );
      },
    });
    await bunker.connect();

    let data = await bunker.nip44Encrypt(otherPartyPubkey, content);
    return data;
  } catch (err) {
    console.log(err);
    return "";
  }
};

const decrypt44UsingBunker = async (userKeys, otherPartyPubkey, content) => {
  try {
    const bunkerPointer = await parseBunkerInput(userKeys.bunker);
    const bunker = new BunkerSigner(userKeys.localKeys.sec, bunkerPointer, {
      onauth: (url) => {
        window.open(
          url,
          "_blank",
          "width=600,height=650,scrollbars=yes,resizable=yes"
        );
      },
    });
    await bunker.connect();

    let data = await bunker.nip44Decrypt(otherPartyPubkey, content);
    return data;
  } catch (err) {
    console.log(err);
    return "";
  }
};

const encrypt44 = async (userKeys, otherPartyPubkey, content) => {
  let encryptedMessage = "";
  if (userKeys.ext) {
    encryptedMessage = await window.nostr.nip44.encrypt(
      otherPartyPubkey,
      content
    );
  } else if (userKeys.sec) {
    encryptedMessage = nip44.v2.encrypt(
      content,
      nip44.v2.utils.getConversationKey(userKeys.sec, otherPartyPubkey)
    );
  } else {
    encryptedMessage = await encrypt44UsingBunker(
      userKeys,
      otherPartyPubkey,
      content
    );
  }
  return encryptedMessage;
};

const decrypt44 = async (userKeys, otherPartyPubkey, content) => {
  let decryptedMessage = "";
  if (userKeys.ext) {
    decryptedMessage = await window.nostr.nip44.decrypt(
      otherPartyPubkey,
      content
    );
  } else if (userKeys.sec) {
    decryptedMessage = await nip44.v2.decrypt(
      content,
      nip44.v2.utils.getConversationKey(userKeys.sec, otherPartyPubkey)
    );
  } else {
    decryptedMessage = await decrypt44UsingBunker(
      userKeys,
      otherPartyPubkey,
      content
    );
  }
  return decryptedMessage;
};

const decrypt04 = async (event, userKeys) => {
  let pubkey =
    event.pubkey === userKeys.pub
      ? event.tags.find((tag) => tag[0] === "p")[1]
      : event.pubkey;

  let decryptedMessage = "";
  if (userKeys.ext) {
    decryptedMessage = await window.nostr.nip04.decrypt(pubkey, event.content);
  } else if (userKeys.sec) {
    decryptedMessage = await nip04.decrypt(userKeys.sec, pubkey, event.content);
  } else {
    decryptedMessage = await decrypt04UsingBunker(
      userKeys,
      pubkey,
      event.content
    );
  }
  return decryptedMessage;
};

const encrypt04 = async (userKeys, otherPartyPubkey, content) => {
  let encryptedMessage = "";
  if (userKeys.ext) {
    encryptedMessage = await window.nostr.nip04.encrypt(
      otherPartyPubkey,
      content
    );
  } else if (userKeys.sec) {
    encryptedMessage = await nip04.encrypt(
      userKeys.sec,
      otherPartyPubkey,
      content
    );
  } else {
    encryptedMessage = await encrypt04UsingBunker(
      userKeys,
      otherPartyPubkey,
      content
    );
  }
  return encryptedMessage;
};

const unwrapGiftWrap = async (event, userKeys) => {
  try {
    let decryptedEvent13 = await decrypt44(
      userKeys,
      event.pubkey,
      event.content
    );

    let { pubkey, content } = JSON.parse(decryptedEvent13);

    let decryptedEvent14 = await decrypt44(userKeys, pubkey, content);
    return JSON.parse(decryptedEvent14);
  } catch (err) {
    return false;
  }
};

const encodeBase64URL = (string) => {
  return btoa(string)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const downloadAsFile = (
  text,
  type = "application/json",
  name,
  message = false,
  allowMobile = true
) => {
  let isTouchScreen = window.matchMedia("(pointer: coarse)").matches;
  if (isTouchScreen && !allowMobile) return;

  const jsonString =
    type === "application/json" ? JSON.stringify(text, null, 2) : text;

  const blob = new Blob([jsonString], { type });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download = name;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  if (message)
    store.dispatch(
      setToast({
        type: 1,
        desc: message,
      })
    );
};

const getKeplrSigner = async () => {
  try {
    const chainId = DORA_CONFIG[process.env.REACT_APP_NETWORK].chainId;
    const rpc = DORA_CONFIG[process.env.REACT_APP_NETWORK].rpc;
    await window.keplr.experimentalSuggestChain(
      DORA_CONFIG[process.env.REACT_APP_NETWORK]
    );

    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);

    let address = await offlineSigner.getAccounts();
    return { signer: offlineSigner, address: address[0].address };
  } catch (err) {
    console.log(err);
    return false;
  }
};

const getWOTScoreForPubkeyLegacy = (pubkey, enabled, minScore = 3) => {
  try {
    if (!enabled) return { score: 10, status: true };
    const network = store.getState().userWotList;
    const followings = store.getState().userFollowings;
    const userKeys = store.getState().userKeys;

    if (userKeys.pub === pubkey) return { score: 10, status: true };
    if (followings.includes(pubkey) || network.length === 0 || !pubkey) {
      return { score: 10, status: true };
    }
    let totalTrusting = network.filter((_) =>
      _.followings.includes(pubkey)
    ).length;
    let totalMuted = network.filter((_) => _.muted.includes(pubkey)).length;
    let equalizer = totalTrusting === 0 ? 10 : 0;
    let score =
      equalizer ||
      Math.floor(
        (Math.max(0, totalTrusting - totalMuted) * 10) / network.length
      );

    return { score, status: score >= minScore };
  } catch (err) {
    console.log(err);
    return [];
  }
};

const precomputeTrustingCounts = (network) => {
  const counts = new Map();
  for (const item of network) {
    if (item.followings) {
      for (const pubkey of item.followings) {
        counts.set(pubkey, (counts.get(pubkey) || 0) + 1);
      }
    }
  }
  return counts;
};

const getWOTScoreForPubkey = (network, pubkey, minScore = 3, counts) => {
  try {
    if (!network?.length || !pubkey) return { score: 0, status: false };
    const totalTrusting = counts.get(pubkey) || 0;
    const score =
      totalTrusting === 0
        ? 5
        : Math.floor((totalTrusting * 10) / network.length);

    return { score, status: score >= minScore };
  } catch (err) {
    console.error(err);
    return { score: 0, status: false };
  }
};

const getWOTList = () => {
  try {
    let userKeys = localStorage.getItem("_nostruserkeys");
    let userPubkey = userKeys ? JSON.parse(userKeys)?.pub : false;
    let prevData = localStorage.getItem(`network_${userPubkey}`);
    prevData = prevData ? JSON.parse(prevData) : { network: [] };

    if (!(prevData && userPubkey)) {
      return [];
    }
    let network = prevData.wotPubkeys;
    if (network.length === 0) {
      return [];
    }

    return network;
  } catch (err) {
    console.log(err);
    return [];
  }
};
const getBackupWOTList = () => {
  try {
    let prevData = localStorage.getItem(`backup_wot`);
    prevData = prevData ? JSON.parse(prevData) : { network: [] };

    let network = prevData.wotPubkeys;
    if (network.length === 0) {
      return [];
    }

    return network;
  } catch (err) {
    console.log(err);
    return [];
  }
};

// const getWOTScoreForPubkey = (pubkey, minScore = 3) => {
//   try {
//     let userKeys = localStorage.getItem("_nostruserkeys");
//     let userPubkey = userKeys ? JSON.parse(userKeys)?.pub : false;
//     let prevData = localStorage.getItem(`network_${userPubkey}`);
//     prevData = prevData ? JSON.parse(prevData) : { network: [] };

//     if (!(prevData && userPubkey)) {
//       return {
//         score: 10,
//         status: true,
//       };
//     }
//     let network = prevData.network;
//     if (network.length === 0) {
//       return {
//         score: 10,
//         status: true,
//       };
//     }

//     let totalTrusting = network.filter((_) =>
//       _.followings.includes(pubkey)
//     ).length;
//     let totalMuted = network.filter((_) => _.muted.includes(pubkey)).length;
//     let equalizer = totalTrusting === 0 && totalMuted === 0 ? 5 : 0;
//     let score = equalizer || Math.floor(
//       (Math.max(0, totalTrusting - totalMuted) * 10) /
//         network.length
//     );

//     return { score, status: score >= minScore };
//   } catch (err) {
//     console.log(err);
//     return {
//       score: 10,
//       status: true,
//     };
//   }
// };

const filterContent = (selectedFilter, list) => {
  const matchWords = (longString, wordArray) => {
    const stringWords = Array.isArray(longString)
      ? longString.map((_) => _.toLowerCase())
      : longString.toLowerCase().match(/\b\w+\b/g) || [];

    const lowerCaseWordArray = wordArray.map((word) => word.toLowerCase());

    let status = stringWords.some((word) => lowerCaseWordArray.includes(word));
    return status;
  };
  const hasImageLinks = (string) => {
    const imageExtensions =
      /\.(jpg|jpeg|png|gif|bmp|webp|mp4|mp3|mov|mpeg)(?:\?[^'"]*)?(?=['"]|\s|$)/i;
    const urlRegex = /(https?:\/\/[^\s]+)\b/i;
    const urls = string.match(urlRegex) || [];
    return urls.some((url) => imageExtensions.test(url));
  };
  const hasCurType = (kind, curType) => {
    if (curType === "videos" && kind === 30005) return true;
    if (curType === "articles" && kind === 30004) return true;
    return true;
  };
  const sameOrigin = (type, url) => {
    const youtubeRegex =
      /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
    const vimeoRegex = /(https?:\/\/)?(www\.)?(vimeo\.com\/)([0-9]+)/i;
    if (type === "all") return true;
    if (type === "youtube" && youtubeRegex.test(url)) return true;
    if (type === "vimeo" && vimeoRegex.test(url)) return true;
    return true;
  };

  const testForMixedContent = (_) => {
    let thumbnail = selectedFilter.thumbnail ? _.image : true;
    let excluded_words = selectedFilter.excluded_words.length
      ? !(
          matchWords(_.title, selectedFilter.excluded_words) ||
          matchWords(_.description, selectedFilter.excluded_words) ||
          matchWords(_.content, selectedFilter.excluded_words) ||
          matchWords(_.items, selectedFilter.excluded_words)
        )
      : true;
    let included_words = selectedFilter.included_words.length
      ? matchWords(_.title, selectedFilter.included_words) ||
        matchWords(_.description, selectedFilter.included_words) ||
        matchWords(_.content, selectedFilter.included_words) ||
        matchWords(_.items, selectedFilter.included_words)
      : true;
    let hide_sensitive = selectedFilter.hide_sensitive
      ? !_.contentSensitive
      : true;
    let posted_by = selectedFilter.posted_by.length
      ? selectedFilter.posted_by.includes(_.pubkey)
      : true;
    let a_min_words =
      _.kind === 30023
        ? _.content.split(" ").length > selectedFilter.for_articles.min_words
        : true;
    let n_media_only =
      _.kind === 1
        ? !selectedFilter.media_only
          ? true
          : hasImageLinks(_.content)
          ? true
          : false
        : true;
    let a_media_only =
      _.kind === 30023
        ? !selectedFilter.for_articles.media_only
          ? true
          : hasImageLinks(_.content)
          ? true
          : false
        : true;
    let c_type = [30004, 30005].includes(_.kind)
      ? hasCurType(_.kind, selectedFilter.for_curations.type)
      : true;
    let c_min_items = [30004, 30005].includes(_.kind)
      ? _.items.length > selectedFilter.for_curations.min_items
      : true;
    let v_source = [34235, 34236].includes(_.kind)
      ? sameOrigin(selectedFilter.for_videos.source, _.vUrl)
      : true;

    if (
      thumbnail &&
      excluded_words &&
      included_words &&
      hide_sensitive &&
      posted_by &&
      n_media_only &&
      a_min_words &&
      a_media_only &&
      c_type &&
      c_min_items &&
      v_source
    )
      return true;
    return false;
  };

  const testForNotes = (_) => {
    try {
      let tags = _.tags.filter((tag) => tag[0] === "t").map((tag) => tag[1]);
      let excluded_words = selectedFilter.excluded_words.length
        ? !(
            matchWords(_.content, selectedFilter.excluded_words) ||
            matchWords(tags, selectedFilter.excluded_words)
          )
        : true;
      let included_words = selectedFilter.included_words.length
        ? matchWords(_.content, selectedFilter.included_words) ||
          matchWords(tags, selectedFilter.included_words)
        : true;

      let posted_by = selectedFilter.posted_by.length
        ? selectedFilter.posted_by.includes(_.pubkey)
        : true;

      let n_media_only =
        _.kind === 1
          ? !selectedFilter.media_only
            ? true
            : hasImageLinks(_.content)
            ? true
            : false
          : true;

      if (excluded_words && included_words && posted_by && n_media_only)
        return true;
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  return list.filter((_) => {
    let status = [1, 6].includes(_.kind)
      ? testForNotes(_.kind === 1 ? _ : _.relatedEvent)
      : testForMixedContent(_);
    if (status) return _;
  });
};

export {
  getBech32,
  shortenKey,
  getParsedAuthor,
  getHex,
  getEmptyuserMetadata,
  getEmptyEventStats,
  minimizeKey,
  decodeUrlOrAddress,
  encodeLud06,
  getBolt11,
  decodeBolt11,
  getZapper,
  checkForLUDS,
  convertDate,
  filterRelays,
  removeRelayLastSlash,
  removeDuplicants,
  removeObjDuplicants,
  removeDuplicatedRelays,
  removeEventsDuplicants,
  getParsedRepEvent,
  encryptEventData,
  decryptEventData,
  getClaimingData,
  bytesTohex,
  decrypt04,
  encrypt04,
  encrypt44,
  decrypt44,
  unwrapGiftWrap,
  encodeBase64URL,
  getuserMetadata,
  getParsedNote,
  getParsedSW,
  sortEvents,
  timeAgo,
  detectDirection,
  enableTranslation,
  parsedMaciPoll,
  downloadAsFile,
  getKeplrSigner,
  getWOTScoreForPubkey,
  getWOTList,
  filterContent,
  precomputeTrustingCounts,
  getBackupWOTList,
  getWOTScoreForPubkeyLegacy,
};
