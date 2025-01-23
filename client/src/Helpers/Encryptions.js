import { bech32 } from "bech32";
import { Buffer } from "buffer";
import { nip04, nip19, nip44 } from "nostr-tools";
import * as secp from "@noble/secp256k1";
import { decode } from "light-bolt11-decoder";
import { getImagePlaceholder } from "../Content/NostrPPPlaceholder";
import CryptoJS from "crypto-js";
import { getAppLang, getCustomSettings, getKeys, getNoteTree } from "./Helpers";
import { t } from "i18next";
import axiosInstance from "./HTTP_Client";

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
    name: getBech32("npub", pubkey).substring(0, 10),
    display_name: getBech32("npub", pubkey).substring(0, 10),
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
  let content = JSON.parse(data.content) || {};
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

const getParsedRepEvent = (event) => {
  try {
    let content = {
      id: event.id,
      pubkey: event.pubkey,
      kind: event.kind,
      content: event.content,
      created_at: event.created_at,
      tags: event.tags,
      author: getEmptyuserMetadata(event.pubkey),
      title: [34235, 34236].includes(event.kind) ? event.content : "",
      description: "",
      image: "",
      imagePP: getImagePlaceholder(),
      published_at: event.created_at,
      contentSensitive: false,
      d: "",
      client: "",
      items: [],
      seenOn: event.onRelays
        ? [...new Set(event.onRelays.map((relay) => relay.url))]
        : [],
      dir: detectDirection(event.content),
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
        content.d = tag[1];
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
    }
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

const getParsedNote = async (event, isCollapsedNote = false) => {
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

    let nEvent = nip19.neventEncode({
      id: event.id,
      author: event.pubkey,
    });

    let rawEvent =
      typeof event.rawEvent === "function" ? event.rawEvent() : event;
    let stringifiedEvent = JSON.stringify(rawEvent);
    let seenOn = event.onRelays
      ? [...new Set(event.onRelays.map((relay) => relay.url))]
      : [];

    if (event.kind === 1) {
      let note_tree = await getNoteTree(
        event.content,
        undefined,
        isCollapsedNote_
      );

      return {
        ...rawEvent,
        note_tree,
        stringifiedEvent,
        isQuote:
          isQuote && !event.content.includes("nostr:nevent") ? isQuote[1] : "",
        isComment: isReply ? isReply[1] : isComment ? isComment[1] : false,
        isFlashNews,
        isCollapsedNote: isCollapsedNote_,
        nEvent,
        seenOn,
      };
    }

    if (event.kind === 6) {
      if (!event.content) return;
      let relatedEvent = await getParsedNote(JSON.parse(event.content), true);
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
        return { ...JSON.parse(tag[1]), amount: sats, message: event.content };
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

const convertDate = (toConvert) => {
  return t("A3fEQj5", {
    val: toConvert,
    formatParams: {
      val: { year: "numeric", month: "short", day: "numeric" },
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
  let tempArray = [...list_1, ...list_2];
  return tempArray.filter((item, index, tempArray) => {
    if (
      tempArray.findIndex(
        (item_1) => JSON.stringify(item_1) === JSON.stringify(item)
      ) === index
    )
      return item;
  });
};
const removeEventsDuplicants = (list_1, list_2 = []) => {
  let tempArray = [...list_1, ...list_2];
  return tempArray.filter((item, index, tempArray) => {
    if (tempArray.findIndex((item_1) => item_1.id === item.id) === index)
      return item;
  });
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
  }
  return decryptedMessage;
};

const unwrapGiftWrap = async (event, secret) => {
  try {
    let decryptedEvent13 = secret
      ? nip44.v2.decrypt(
          event.content,
          nip44.v2.utils.getConversationKey(secret, event.pubkey)
        )
      : await window.nostr.nip44.decrypt(event.pubkey, event.content);

    let { pubkey, content } = JSON.parse(decryptedEvent13);

    let decryptedEvent14 = secret
      ? nip44.v2.decrypt(
          content,
          nip44.v2.utils.getConversationKey(secret, pubkey)
        )
      : await window.nostr.nip44.decrypt(pubkey, content);
    return JSON.parse(decryptedEvent14);
  } catch (err) {
    // console.log(err);
    return false;
  }
};

const encodeBase64URL = (string) => {
  return btoa(string)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
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
  unwrapGiftWrap,
  encodeBase64URL,
  getuserMetadata,
  getParsedNote,
  sortEvents,
  timeAgo,
  detectDirection,
  enableTranslation,
};
