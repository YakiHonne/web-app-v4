import { finalizeEvent, nip19, nip44 } from "nostr-tools";
import {
  decryptEventData,
  encodeBase64URL,
  getHex,
  removeObjDuplicants,
} from "./Encryptions";
import IMGElement from "../Components/Main/IMGElement";
import axios from "axios";
import relaysOnPlatform from "../Content/Relays";
import { getImagePlaceholder } from "../Content/NostrPPPlaceholder";
import React, { Fragment } from "react";
import Carousel from "../Components/Main/Carousel";
import Nip19Parsing from "../Components/Main/Nip19Parsing";
import { store } from "../Store/Store";
import { setToast } from "../Store/Slides/Publishers";
import { uploadToS3 } from "./NostrPublisher";
import { customHistory } from "./History";
import { Link } from "react-router-dom";
import MediaUploaderServer from "../Content/MediaUploaderServer";
import { t } from "i18next";
import { supportedLanguageKeys } from "../Context/I18N";
import LNBCInvoice from "../Components/Main/LNBCInvoice";
const LoginToAPI = async (publicKey, secretKey) => {
  try {
    let { pubkey, password } = await getLoginsParams(publicKey, secretKey);
    if (!(pubkey && password)) return;
    const data = await axios.post("/api/v1/login", { password, pubkey });
    return data.data;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const getLoginsParams = async (publicKey, secretKey) => {
  try {
    let content = JSON.stringify({
      pubkey: publicKey,
      sent_at: Math.floor(new Date().getTime() / 1000),
    });

    let password = secretKey
      ? nip44.v2.encrypt(
          content,
          nip44.v2.utils.getConversationKey(
            secretKey,
            process.env.REACT_APP_CHECKER_PUBKEY
          )
        )
      : await window.nostr.nip44.encrypt(
          process.env.REACT_APP_CHECKER_PUBKEY,
          content
        );

    return { password, pubkey: publicKey };
  } catch (err) {
    console.log(err);
    return { password: false, pubkey: false };
  }
};

const isVid = (url) => {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtu(?:\.be|be\.com)\/(?:watch\?v=|embed\/)?|vimeo\.com\/)([^\?&]+)/;

  const match = url.match(regex);

  if (match) {
    const videoId = match[1];
    let platform = "";
    if (match[0].startsWith("https://vimeo.com")) platform = "Vimeo";
    if (match[0].includes("youtu")) platform = "YouTube";

    if (platform === "YouTube") {
      return {
        isYT: true,
        videoId,
      };
    }
    if (platform === "Vimeo") {
      return {
        isYT: false,
        videoId,
      };
    }
    return false;
  }
  return false;
};

const isImageUrl = async (url) => {
  try {
    return new Promise((resolve, reject) => {
      if (/(https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg|webp))/i.test(url))
        resolve({ type: "image" });
      if (/(https?:\/\/[^ ]*\.(?:mp4|mov))/i.test(url))
        resolve({ type: "video" });
      const img = new Image();

      img.onload = () => {
        resolve({ type: "image" });
      };

      img.onerror = () => {
        resolve(false);
      };

      img.src = url;
    });
  } catch (error) {
    console.error(`Error checking URL ${url}:`, error);
    return false;
  }
};
const isImageUrlSync = (url) => {
  try {
    if (/(https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg|webp))/i.test(url)) return true;
    return false;
  } catch (error) {
    return false;
  }
};

const getNoteTree = async (note, minimal = false) => {
  if (!note) return "";
  let tree = note
    .split(/(\n)/)
    .flatMap((segment) => (segment === "\n" ? "\n" : segment.split(/\s+/)))
    .filter(Boolean);
  let finalTree = [];

  for (let i = 0; i < tree.length; i++) {
    const el = tree[i];
    const key = `${el}-${i}`;
    if (el === "\n") {
      finalTree.push(<br key={key} />);
    } else if (
      /(https?:\/\/)/i.test(el) &&
      !el.includes("https://yakihonne.com/smart-widget-checker?naddr=")
    ) {
      const isURLVid = isVid(el);
      if (!minimal) {
        if (isURLVid) {
          if (isURLVid.isYT) {
            finalTree.push(
              <iframe
                key={key}
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  borderRadius: "var(--border-r-18)",
                }}
                src={`https://www.youtube.com/embed/${isURLVid.videoId}`}
                frameBorder="0"
                allowFullScreen
              ></iframe>
            );
          }
          if (!isURLVid.isYT)
            finalTree.push(
              <iframe
                key={key}
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  borderRadius: "var(--border-r-18)",
                }}
                src={`https://player.vimeo.com/video/${isURLVid.videoId}`}
                frameBorder="0"
                allowFullScreen
              ></iframe>
            );
        }
        if (!isURLVid) {
          const checkURL = await isImageUrl(el);
          if (checkURL) {
            if (checkURL.type === "image") {
              finalTree.push(<IMGElement src={el} key={key} />);
            } else if (checkURL.type === "video") {
              finalTree.push(
                <video
                  key={key}
                  controls={true}
                  autoPlay={false}
                  name="media"
                  width={"100%"}
                  className="sc-s-18"
                  style={{ margin: ".5rem auto", aspectRatio: "16/9" }}
                >
                  <source src={el} type="video/mp4" />
                </video>
              );
            }
          } else if (
            el.includes(".mp3") ||
            el.includes(".ogg") ||
            el.includes(".wav")
          ) {
            finalTree.push(
              <audio
                controls
                key={key}
                className="fit-container"
                style={{ margin: ".5rem auto", minWidth: "300px" }}
              >
                <source src={el} type="audio/ogg" />
                <source src={el} type="audio/mpeg" />
                <source src={el} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            );
          } else {
            finalTree.push(
              <Fragment key={key}>
                <a
                  style={{
                    wordBreak: "break-word",
                    color: "var(--orange-main)",
                  }}
                  href={el}
                  className="btn-text-gray"
                  onClick={(e) => e.stopPropagation()}
                >
                  {el}
                </a>{" "}
              </Fragment>
            );
          }
        }
      } else
        finalTree.push(
          <Fragment key={key}>
            <a
              style={{ wordBreak: "break-word", color: "var(--orange-main)" }}
              href={el}
              className="btn-text-gray"
              onClick={(e) => e.stopPropagation()}
            >
              {el}
            </a>{" "}
          </Fragment>
        );
    } else if (
      (el.includes("nostr:") ||
        el.includes("naddr") ||
        el.includes("https://yakihonne.com/smart-widget-checker?naddr=") ||
        el.includes("nprofile") ||
        el.includes("npub") ||
        el.includes("nevent")) &&
      el.length > 30
    ) {
      const nip19add = el
        .replace("https://yakihonne.com/smart-widget-checker?naddr=", "")
        .replace("nostr:", "");

      const parts = nip19add.split(/([@.,?!\s:])/);

      const finalOutput = parts.map((part, index) => {
        if (
          part.startsWith("npub1") ||
          part.startsWith("nprofile1") ||
          part.startsWith("nevent") ||
          part.startsWith("naddr") ||
          part.startsWith("note1")
        ) {
          const cleanedPart = part.replace(/[@.,?!]/g, "");

          return (
            <Fragment key={index}>
              <Nip19Parsing addr={cleanedPart} minimal={minimal} />
            </Fragment>
          );
        }

        return part;
      });
      finalTree.push(<Fragment key={key}>{finalOutput} </Fragment>);
    } else if (el.startsWith("lnbc") && el.length > 30) {
      finalTree.push(<LNBCInvoice lnbc={el} key={key}/>);
    } else if (el.startsWith("#")) {
      const match = el.match(/(#+)([\w-+]+)/);

      if (match) {
        const hashes = match[1];
        const text = match[2];

        finalTree.push(
          <React.Fragment key={key}>
            {hashes.slice(1)}
            <Link
              style={{ wordBreak: "break-word", color: "var(--orange-main)" }}
              to={`/search?keyword=${text}`}
              state={{ tab: "notes" }}
              className="btn-text-gray"
              onClick={(e) => e.stopPropagation()}
            >
              {`${hashes.slice(-1)}${text}`}
            </Link>{" "}
          </React.Fragment>
        );
      }
    } else {
      finalTree.push(
        <span
          style={{
            wordBreak: "break-word",
            color: "var(--dark-gray)",
          }}
          key={key}
        >
          {el}{" "}
        </span>
      );
    }
  }

  return mergeConsecutivePElements(finalTree);
};

const getLinkFromAddr = (addr_) => {
  try {
    let addr = addr_
      .replaceAll(",", "")
      .replaceAll(":", "")
      .replaceAll(";", "")
      .replaceAll(".", "");
    if (addr.startsWith("naddr")) {
      let data = nip19.decode(addr);

      if (data.data.kind === 30023) return `/article/${addr}`;
      if ([30004, 30005].includes(data.data.kind)) return `/curations/${addr}`;
      if (data.data.kind === 34235 || data.data.kind === 34236)
        return `/videos/${addr}`;
      if (data.data.kind === 30031)
        return `/smart-widget-checker?naddr=${addr}`;
    }
    if (addr.startsWith("nprofile")) {
      return `/users/${addr}`;
    }
    if (addr.startsWith("npub")) {
      let hex = getHex(addr.replace(",", "").replace(".", ""));
      return `/users/${nip19.nprofileEncode({ pubkey: hex })}`;
    }
    if (addr.startsWith("nevent")) {
      let data = nip19.decode(addr);
      return `/notes/${nip19.neventEncode({
        author: data.data.author,
        id: data.data.id,
      })}`;
    }
    if (addr.startsWith("note")) {
      let data = nip19.decode(addr);
      return `/notes/${nip19.noteEncode(data.data)}`;
    }

    return addr;
  } catch (err) {
    return addr_;
  }
};

const getNIP21FromURL = (url) => {
  const regex = /n(event|profile|pub|addr)([^\s\W]*)/;
  const match = url.match(regex);

  if (match) {
    const extracted = match[0];
    return `nostr:${extracted}`;
  } else {
    return url;
  }
};

const getComponent = (children) => {
  if (!children) return <></>;
  let res = [];
  for (let i = 0; i < children.length; i++) {
    if (typeof children[i] === "string") {
      let all = children[i].toString().split(" ");
      for (let child of all) {
        let key = `${i}-${child}-${
          Date.now() / Math.floor(Math.random() * 100000)
        }`;
        let child_ = getNIP21FromURL(child.toString());
        if (child_.startsWith("nostr:")) {
          try {
            if (
              (child_.includes("nostr:") ||
                child_.includes("naddr") ||
                child_.includes("nprofile") ||
                child_.includes("npub") ||
                child_.includes("nevent")) &&
              child_.length > 30
            ) {
              const nip19add = child_
                .replace("nostr:", "")
                .replace("@", "")
                .replace(".", "")
                .replace(",", "");

              res.push(
                <>
                  <Nip19Parsing addr={nip19add} key={key} />{" "}
                </>
              );
            }
          } catch (err) {
            res.push(
              <span
                dir="auto"
                key={key}
                style={{
                  wordBreak: "break-word",
                }}
              >
                {child_.split("nostr:")[1]}{" "}
              </span>
            );
          }
        }
        if (!child_.startsWith("nostr:")) {
          const lines = child_.split("\n");
          res.push(
            <span>
              {lines.map((line, index) => (
                <React.Fragment key={index}>
                  <span
                    dir="auto"
                    key={key}
                    style={{
                      wordBreak: "break-word",
                    }}
                  >
                    {line}{" "}
                  </span>
                  {index < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </span>
          );
        }
      }
    }
    if (typeof children[i] !== "string") {
      let key = `${i}-${Date.now()}`;
      if (children[i].type === "a" && isImageUrlSync(children[i].props?.href)) {
        res.push(
          <img
            className="sc-s-18"
            style={{ margin: "1rem auto" }}
            width={"100%"}
            src={children[i].props?.href}
            alt="el"
            loading="lazy"
            key={key}
          />
        );
      } else
        res.push(
          <span
            dir="auto"
            key={key}
            style={{
              wordBreak: "break-word",
            }}
          >
            {children[i]}{" "}
          </span>
        );
    }
  }
  return <div className="fit-container">{mergeConsecutivePElements(res)}</div>;
};

function mergeConsecutivePElements(arr) {
  const result = [];
  let currentTextElement = null;
  let currentImages = [];
  let tempArray = [];

  for (let i = 0; i < arr.length; i++) {
    if (
      !(
        i - 1 > 0 &&
        i + 1 < arr.length &&
        arr[i].type === "br" &&
        typeof arr[i - 1].type !== "string" &&
        arr[i - 1].props?.src &&
        typeof arr[i + 1].type !== "string" &&
        arr[i + 1].props?.src
      )
    ) {
      tempArray.push(arr[i]);
    }
  }
  tempArray = tempArray.filter((element, index, arr) => {
    if (element.type === "br") {
      const prev = arr
        .slice(0, index)
        .reverse()
        .find((el) => el.type !== "br");
      const next = arr.slice(index + 1).find((el) => el.type !== "br");

      if (
        prev?.type !== "string" &&
        prev?.props?.src &&
        next?.type !== "string" &&
        next?.props?.src
      ) {
        return false;
      }
    }

    return true;
  });

  for (const element of tempArray) {
    if (["p", "span"].includes(element.type)) {
      if (!currentTextElement) {
        currentTextElement = { ...element };
        currentTextElement.props = {
          ...element.props,
          children: [element.props.children],
        };
      } else {
        let tempPrevChildren = currentTextElement.props.children;
        if (typeof element.props.children !== "string") {
          tempPrevChildren.push(element.props.children);
        }
        if (
          typeof tempPrevChildren[tempPrevChildren.length - 1] === "string" &&
          typeof element.props.children === "string"
        ) {
          tempPrevChildren[tempPrevChildren.length - 1] = `${
            tempPrevChildren[tempPrevChildren.length - 1]
          } ${element.props.children}`;
        }
        if (
          typeof tempPrevChildren[tempPrevChildren.length - 1] !== "string" &&
          typeof element.props.children === "string"
        ) {
          tempPrevChildren.push(` ${element.props.children}`);
        }
        currentTextElement = {
          ...currentTextElement,
          props: {
            ...currentTextElement.props,
            children: tempPrevChildren,
          },
        };
      }
    } else if (typeof element.type !== "string" && element.props?.src) {
      if (currentTextElement) {
        result.push(currentTextElement);
        currentTextElement = null;
      }
      currentImages.push(element);
    } else {
      if (currentTextElement) {
        result.push(currentTextElement);
        currentTextElement = null;
      }
      if (currentImages.length > 0) {
        result.push(createImageGrid(currentImages));
        currentImages = [];
      }
      result.push(element);
    }
  }

  if (currentTextElement) {
    result.push(currentTextElement);
  }
  if (currentImages.length > 0) {
    result.push(createImageGrid(currentImages));
  }

  return result;
}

function createImageGrid(images) {
  if (images.length === 1)
    return (
      <div className="image-grid" key={Math.random()}>
        {images.map((image, index) =>
          React.cloneElement(image, { key: index })
        )}
      </div>
    );
  let images_ = images.map((image) => image.props.src);
  return <Carousel imgs={images_} />;
}

const getAuthPubkeyFromNip05 = async (nip05Addr) => {
  try {
    let addressParts = nip05Addr.split("@");
    if (addressParts.length === 1) {
      addressParts.unshift("_");
    }
    const data = await axios.get(
      `https://${addressParts[1]}/.well-known/nostr.json?name=${addressParts[0]}`
    );
    return data.data.names[addressParts[0]];
  } catch (err) {
    console.error(err);
    return false;
  }
};

const getAIFeedContent = (news) => {
  let tags = news.tags;
  let is_authentic = false;
  let key_to_dec = "";
  let l = "";
  let L = "";
  let published_at = "";
  let description = "";
  let image = "";
  let source_url = "";
  let source_domain = "";
  let source_name = "";
  let source_icon = "";

  for (let tag of tags) {
    if (tag[0] === "yaki_ai_feed") key_to_dec = tag[1];
    if (tag[0] === "l") l = tag[1];
    if (tag[0] === "L") L = tag[1];
    if (tag[0] === "published_at") published_at = tag[1];
    if (tag[0] === "description") description = tag[1];
    if (tag[0] === "image") image = tag[1];
    if (tag[0] === "source_url") source_url = tag[1];
    if (tag[0] === "source_domain") source_domain = tag[1];
    if (tag[0] === "source_name") source_name = tag[1];
    if (tag[0] === "source_icon") source_icon = tag[1];
  }
  try {
    is_authentic = key_to_dec
      ? decryptEventData(key_to_dec, `${news.created_at}`).status
      : false;
  } catch (err) {
    console.log(err);
  }

  return {
    id: news.id,
    pubkey: news.pubkey,
    title: news.content,
    created_at: published_at ? news.created_at : parseInt(published_at),
    kind: L,
    l,
    published_at,
    description,
    image: image || getImagePlaceholder(),
    source_url,
    source_domain,
    source_name,
    source_icon,
    is_authentic,
    nEvent: nip19.neventEncode({
      id: news.id,
      relays: relaysOnPlatform,
      author: news.pubkey,
    }),
  };
};

const getFlashnewsContent = async (news) => {
  let tags = news.tags;
  let keywords = [];
  let is_important = false;
  let is_authentic = false;
  let source = "";
  let key_to_dec = "";
  let l = "";

  for (let tag of tags) {
    if (tag[0] === "t") keywords.push(tag[1]);
    if (tag[0] === "l") l = tag[1];
    if (tag[0] === "important") is_important = true;
    if (tag[0] === "source") source = tag[1];
    if (tag[0] === "yaki_flash_news") key_to_dec = tag[1];
  }
  try {
    is_authentic = key_to_dec
      ? decryptEventData(key_to_dec, `${news.created_at}`).status
      : false;
  } catch (err) {
    console.log(err);
  }

  let content = await getNoteTree(news.content);
  return {
    id: news.id,
    content: content,
    raw_content: news.content,
    created_at: news.created_at,
    pubkey: news.pubkey,
    keywords,
    source,
    is_important,
    is_authentic,
    l,
    nEvent: nip19.neventEncode({
      id: news.id,
      relays: relaysOnPlatform,
      author: news.pubkey,
    }),
  };
};

const getVideoContent = (video) => {
  let tags = video.tags;
  let keywords = [];
  let published_at = video.created_at;
  let title = video.content || "";
  let url = "";
  let d = "";
  let image = "";
  let imeta_url = "";
  let imeta_image = "";
  let duration = 0;

  for (let tag of tags) {
    if (tag[0] === "t") keywords.push(tag[1]);
    if (tag[0] === "published_at" && tag[1]) published_at = parseInt(tag[1]);
    if (tag[0] === "duration" && tag[1]) duration = parseInt(tag[1]);
    if (tag[0] === "d") d = tag[1];
    if (tag[0] === "url") url = tag[1];
    if (tag[0] === "imeta") imeta_url = tag.find((_) => _.includes("url"));
    if (tag[0] === "imeta") imeta_image = tag.find((_) => _.includes("image"));
    if (tag[0] === "title") title = tag[1];
    if ((tag[0] === "thumb" || tag[0] === "image") && tag[1]) image = tag[1];
  }

  if (imeta_url) url = imeta_url.split(" ")[1];
  if (imeta_image) image = imeta_image.split(" ")[1];

  return {
    id: video.id,
    kind: video.kind,
    d,
    content: video.content,
    created_at: video.created_at,
    published_at,
    pubkey: video.pubkey,
    keywords,
    duration: formatMinutesToMMSS(duration),
    minutes: duration,
    url,
    title,
    image,
    naddr: nip19.naddrEncode({
      pubkey: video.pubkey,
      kind: video.kind,
      identifier: d,
    }),
    aTag: `${video.kind}:${video.pubkey}:${d}`,
  };
};

const getVideoFromURL = (url) => {
  const isURLVid = isVid(url);

  if (isURLVid) {
    if (isURLVid.isYT) {
      return (
        <iframe
          style={{
            width: "100%",
            aspectRatio: "16/9",
            borderRadius: "var(--border-r-18)",
          }}
          src={`https://www.youtube.com/embed/${isURLVid.videoId}`}
          frameBorder="0"
          allowFullScreen
        ></iframe>
      );
    }
    if (!isURLVid.isYT)
      return (
        <iframe
          style={{
            width: "100%",
            aspectRatio: "16/9",
            borderRadius: "var(--border-r-18)",
          }}
          src={`https://player.vimeo.com/video/${isURLVid.videoId}`}
          frameBorder="0"
          allowFullScreen
        ></iframe>
      );
  }
  if (!isURLVid) {
    return (
      <video
        controls={true}
        autoPlay={false}
        name="media"
        width={"100%"}
        className="sc-s-18"
        style={{ border: "none", aspectRatio: "16/9" }}
      >
        <source src={url} type="video/mp4" />
      </video>
    );
  }
};

const shuffleArray = (array) => {
  let tempArray = Array.from(array);
  for (let i = tempArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = tempArray[i];
    tempArray[i] = tempArray[j];
    tempArray[j] = temp;
  }
  return tempArray;
};

const formatMinutesToMMSS = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const remainingSecondsAfterHours = seconds % 3600;
  const minutes = Math.floor(remainingSecondsAfterHours / 60);
  const remainingSeconds = remainingSecondsAfterHours % 60;

  const paddedHours = hours.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");
  const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

  if (hours > 0) {
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  } else {
    return `${paddedMinutes}:${paddedSeconds}`;
  }
};

const levelCount = (nextLevel) => {
  if (nextLevel === 1) return 0;
  else return levelCount(nextLevel - 1) + (nextLevel - 1) * 50;
};

const getCurrentLevel = (points) => {
  return Math.floor((1 + Math.sqrt(1 + (8 * points) / 50)) / 2);
};

const validateWidgetValues = (value, kind, type) => {
  if (kind === "url" && (type === "regular" || !type)) {
    let regex =
      /((https?:www\.)|(https?:\/\/)|(www\.))[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9]{1,6}(\/[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)?/;
    return regex.test(value);
  }
  if (kind === "url" && type === "zap") {
    let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return (
      regex.test(value) ||
      (value.startsWith("lnurl") && value.length > 32) ||
      (value.startsWith("lnbc") && value.length > 32)
    );
  }
  if (kind === "url" && type === "nostr") {
    let regex = /^(npub|note|nprofile|nevent|naddr)/;
    return regex.test(value);
  }
  if (kind === "url" && type === "youtube") {
    let regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|playlist\?list=)|youtu\.be\/)([\w-]{11,})/;
    return regex.test(value);
  }
  if (kind === "url" && type === "telegram") {
    let regex = /(?:https?:\/\/)?(?:www\.)?(?:t\.me\/|telegram\.me\/)([\w-]+)/;
    return regex.test(value);
  }
  if (kind === "url" && type === "discord") {
    let regex =
      /(https?:\/\/)?(www\.)?(discord\.(gg|com)\/(invite\/)?([a-zA-Z0-9]{1,16})|discord\.com\/channels\/(@me|[0-9]{17,19})\/[0-9]{17,19})/g;
    return regex.test(value);
  }
  if (kind === "url" && type === "x") {
    let regex = /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/[a-zA-Z0-9_]+$/;
    return regex.test(value);
  }
  if (kind === "aspect_ratio") {
    return ["1:1", "16:9"].includes(value);
  }
  if (kind === "content") {
    return typeof value === "string";
  }
  if (kind.includes("color")) {
    let regex = /^#[0-9a-fA-F]{6}/;
    // let regex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
    if (value === "") return true;
    return regex.test(value);
  }
  if (kind === "weight") {
    if (value === "") return true;
    return ["regular", "bold"].includes(value);
  }
  if (kind === "size") {
    return ["h1", "h2", "regular", "small"].includes(value);
  }
  if (kind === "pubkey") {
    return true;
  }
  if (kind === "type") {
    return [
      "regular",
      "zap",
      "nostr",
      "youtube",
      "telegram",
      "discord",
      "x",
    ].includes(value);
  }
  if (kind === "layout") {
    return [1, 2, "1", "2"].includes(value);
  }
  if (kind === "division") {
    return ["1:1", "1:2", "2:1"].includes(value);
  }
  if (kind === "poll-content") {
    try {
      let parsed = JSON.parse(value);
      let checkKeys = Object.keys(parsed).find(
        (key) =>
          !["created_at", "content", "pubkey", "sig", "id", "tags"].includes(
            key
          )
      );
      if (parsed.kind === 6969 && !checkKeys) return true;
      return false;
    } catch (err) {
      return false;
    }
  }
  return false;
};

const getMediaUploader = () => {
  let nostkeys = getKeys();
  let servers = localStorage.getItem("media-uploader");
  let tempServers = MediaUploaderServer.map((s) => {
    return {
      display_name: s[0],
      value: s[1],
    };
  });
  if (!(servers && nostkeys)) return tempServers;
  try {
    servers = JSON.parse(servers);
    let servers_ = servers.find((server) => server?.pubkey === nostkeys.pub);
    servers_ = servers_ ? servers_.servers : [];
    return [
      ...tempServers,
      ...servers_.map((s) => {
        return {
          display_name: s[0],
          value: s[1],
        };
      }),
    ];
  } catch (err) {
    return tempServers;
  }
};
const getSelectedServer = () => {
  let nostkeys = getKeys();
  let servers = localStorage.getItem("media-uploader");

  if (!(servers && nostkeys)) return MediaUploaderServer[0][1];
  try {
    servers = JSON.parse(servers);
    let servers_ = servers.find((server) => server?.pubkey === nostkeys.pub);
    let selected = servers_ ? servers_.selected : MediaUploaderServer[0][1];

    return selected;
  } catch (err) {
    return MediaUploaderServer[0][1];
  }
};

const updateMediaUploader = (data, selected) => {
  let userKeys = getKeys();
  let servers = localStorage.getItem("media-uploader");
  if (!userKeys) return;
  try {
    servers = servers ? JSON.parse(servers) : [];
    let pubkey = userKeys?.pub;
    let servers_index = servers.findIndex((_) => _?.pubkey === pubkey);
    if (servers_index !== -1) {
      if (data) servers[servers_index].servers.push(data);
      servers[servers_index].selected = selected;
    }
    if (servers_index === -1) {
      servers.push({ pubkey, servers: data ? [data] : [], selected });
    }
    localStorage.setItem("media-uploader", JSON.stringify(servers));
  } catch (err) {
    console.log(err);
    localStorage.removeItem("media-uploader");
  }
};

const getWallets = () => {
  let nostkeys = getKeys();
  let wallets = localStorage.getItem("yaki-wallets");
  if (!(wallets && nostkeys)) return [];
  try {
    wallets = JSON.parse(wallets);
    let wallets_ = wallets.find((wallet) => wallet?.pubkey === nostkeys.pub);
    return wallets_ ? wallets_.wallets : [];
  } catch (err) {
    return [];
  }
};

const getNoteDraft = (eventKey) => {
  let nostkeys = getKeys();
  let drafts = localStorage.getItem("note-drafts");
  if (!(drafts && nostkeys)) return "";
  try {
    drafts = JSON.parse(drafts);
    let draft = drafts.find((draft) => draft?.pubkey === nostkeys.pub);
    return draft[eventKey] || "";
  } catch (err) {
    return "";
  }
};

const updateNoteDraft = (eventKey, data, pubkey_) => {
  let userKeys = getKeys();
  let drafts = localStorage.getItem("note-drafts");
  if (!userKeys && !pubkey_) return;
  try {
    drafts = drafts ? JSON.parse(drafts) : [];
    let pubkey = userKeys?.pub || pubkey_;
    let drafts_index = drafts.findIndex((_) => _?.pubkey === pubkey);
    if (drafts_index !== -1) {
      drafts[drafts_index][eventKey] = data;
    }
    if (drafts_index === -1) {
      drafts.push({ pubkey, [eventKey]: data });
    }
    localStorage.setItem("note-drafts", JSON.stringify(drafts));
  } catch (err) {
    console.log(err);
    localStorage.removeItem("note-drafts");
  }
};

const getArticleDraft = () => {
  let nostkeys = getKeys();
  let drafts = localStorage.getItem("art-drafts");
  if (!(drafts && nostkeys)) return getDefaultArtDraft("");
  try {
    drafts = JSON.parse(drafts);
    let draft = drafts.find((draft) => draft?.pubkey === nostkeys.pub);
    return draft || getDefaultArtDraft(nostkeys.pub);
  } catch (err) {
    return getDefaultArtDraft("");
  }
};
const removeArticleDraft = () => {
  let nostkeys = getKeys();
  let drafts = localStorage.getItem("art-drafts");
  if (!(drafts && nostkeys)) return;
  try {
    drafts = JSON.parse(drafts);
    let draft = drafts.filter((draft) => draft?.pubkey !== nostkeys.pub);
    localStorage.setItem("art-drafts", JSON.stringify(draft));
  } catch (err) {
    return;
  }
};

const updateArticleDraft = (data, pubkey_) => {
  let userKeys = getKeys();
  let drafts = localStorage.getItem("art-drafts");
  if (!userKeys && !pubkey_) return;
  try {
    drafts = drafts ? JSON.parse(drafts) : [];
    let pubkey = userKeys?.pub || pubkey_;
    let draftData = {
      pubkey,
      title: data.title,
      content: data.content,
      created_at: Math.floor(Date.now() / 1000),
    };
    let drafts_index = drafts.findIndex((_) => _?.pubkey === pubkey);
    if (drafts_index !== -1) {
      drafts[drafts_index] = draftData;
    }
    if (drafts_index === -1) {
      drafts.push(draftData);
    }
    localStorage.setItem("art-drafts", JSON.stringify(drafts));
  } catch (err) {
    console.log(err);
    localStorage.removeItem("art-drafts");
  }
};

const updateCustomSettings = (settings, pubkey_) => {
  let userKeys = getKeys();
  let customHomeSettings = localStorage.getItem("chsettings");
  if (!userKeys && !pubkey_) return;

  try {
    customHomeSettings = customHomeSettings
      ? JSON.parse(customHomeSettings)
      : [];
    let pubkey = userKeys?.pub || pubkey_;
    let customHomeSettings_index = customHomeSettings.findIndex(
      (_) => _?.pubkey === pubkey
    );
    if (customHomeSettings_index !== -1) {
      customHomeSettings[customHomeSettings_index] = settings;
    }
    if (customHomeSettings_index === -1) {
      customHomeSettings.push(settings);
    }
    localStorage.setItem("chsettings", JSON.stringify(customHomeSettings));
  } catch (err) {
    console.log(err);
    localStorage.removeItem("chsettings");
  }
};

const getCustomSettings = () => {
  let nostkeys = getKeys();
  let customHomeSettings = localStorage.getItem("chsettings");
  if (!nostkeys) return getDefaultSettings("");
  if (!customHomeSettings) return getDefaultSettings(nostkeys.pub);
  try {
    customHomeSettings = JSON.parse(customHomeSettings);
    let customHomeSettings_ = customHomeSettings.find(
      (settings) => settings?.pubkey === nostkeys.pub
    );
    return customHomeSettings_
      ? customHomeSettings_
      : getDefaultSettings(nostkeys.pub);
  } catch (err) {
    return getDefaultSettings("");
  }
};

const getAppLang = () => {
  let browserLanguage = navigator.languages
    ? navigator.languages[0]
    : navigator.language || "en";
  browserLanguage = browserLanguage.split("-")[0];

  let userLang = localStorage.getItem("app-lang");
  let lang = userLang || browserLanguage;
  if (supportedLanguageKeys.includes(lang)) return lang;
  return "en";
};
const getContentTranslationConfig = () => {
  let defaultService = {
    service: "lt",
    plan: false,
    selected: true,
    freeApikey: "",
    proApikey: "",
  };
  try {
    let config = localStorage.getItem("content-lang-config");
    if (config) {
      config = JSON.parse(config);
      let selectedService = config.find((_) => _.selected);
      return selectedService || defaultService;
    } else {
      return defaultService;
    }
  } catch (err) {
    return defaultService;
  }
};
const updateContentTranslationConfig = (
  service,
  plan,
  freeApikey,
  proApikey
) => {
  try {
    let config = localStorage.getItem("content-lang-config");
    let newService = {
      service,
      plan: service === "nw" ? true : plan || false,
      freeApikey: freeApikey || "",
      proApikey: proApikey || "",
      selected: true,
    };
    if (config) {
      config = JSON.parse(config) || [];

      let selectedService = config.findIndex((_) => _.service === service);
      config = config.map((_) => {
        return {
          ..._,
          selected: false,
        };
      });

      if (selectedService !== -1) {
        config[selectedService] = {
          service,
          plan: plan !== undefined ? plan : config[selectedService].plan,
          freeApikey: freeApikey || config[selectedService].freeApikey,
          proApikey: proApikey || config[selectedService].proApikey,
          selected: true,
        };
      } else {
        config.push(newService);
      }
    } else {
      config = [newService];
    }
    localStorage.setItem("content-lang-config", JSON.stringify(config));
  } catch (err) {
    console.log(err);
  }
};

const handleAppDirection = (toChangeLang) => {
  const rtlLanguages = ["ar", "he", "fa", "ur"];
  let langToChange = toChangeLang || getAppLang();
  let docDir = document.documentElement.dir;

  if (
    (!docDir && !rtlLanguages.includes(langToChange)) ||
    (docDir === "ltr" && !rtlLanguages.includes(langToChange))
  )
    return;
  if (rtlLanguages.includes(langToChange)) document.documentElement.dir = "rtl";
  if (!rtlLanguages.includes(langToChange))
    document.documentElement.dir = "ltr";
};

const getDefaultSettings = (pubkey) => {
  return {
    pubkey,
    userHoverPreview: true,
    contentList: [
      { tab: "recent", isHidden: false },
      { tab: "recent-with-replies", isHidden: false },
      { tab: "trending", isHidden: false },
      { tab: "highlights", isHidden: false },
      { tab: "paid", isHidden: false },
      { tab: "widgets", isHidden: false },
    ],
  };
};

const getDefaultArtDraft = (pubkey) => {
  return {
    pubkey,
    content: "",
    title: "",
    created_at: Math.floor(Date.now() / 1000),
    default: true,
  };
};

const updateWallets = (wallets_, pubkey_) => {
  let userKeys = getKeys();
  let wallets = localStorage.getItem("yaki-wallets");
  if (!userKeys && !pubkey_) return;

  try {
    wallets = wallets ? JSON.parse(wallets) : [];
    let pubkey = pubkey_ || userKeys?.pub;
    let wallets_index = wallets.findIndex(
      (wallet) => wallet?.pubkey === pubkey
    );
    if (wallets_index !== -1) {
      wallets[wallets_index].wallets = wallets_;
    }
    if (wallets_index === -1) {
      wallets.push({ pubkey, wallets: wallets_ });
    }
    localStorage.setItem("yaki-wallets", JSON.stringify(wallets));
    return wallets;
  } catch (err) {
    console.log(err);
    localStorage.removeItem("yaki-wallets");
    return [];
  }
};

let getKeys = () => {
  try {
    let keys = localStorage.getItem("_nostruserkeys");
    keys = JSON.parse(keys);
    return keys;
  } catch (err) {
    return false;
  }
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

const toggleColorScheme = (theme) => {
  const stylesheets = document.styleSheets;
  for (const sheet of stylesheets) {
    try {
      const rules = sheet?.cssRules || sheet?.rules;
      if (rules) {
        for (const rule of rules) {
          if (
            rule.media &&
            rule.media.mediaText.includes("prefers-color-scheme")
          ) {
            const newMediaText = !theme
              ? "(prefers-color-scheme: dark)"
              : "(prefers-color-scheme: light)";

            rule.media.mediaText = newMediaText;
          }
        }
      }
    } catch (err) {}
  }
};

const getCAEATooltip = (published_at, created_at) => {
  return `CA ${new Date(published_at * 1000).toISOString().split("T")[0]}, EA ${
    new Date(created_at * 1000).toISOString().split("T")[0]
  }`;
};

const FileUpload = async (file, m = "nostr.build", userKeys, cb) => {
  let servers = getMediaUploader();
  let selected = getSelectedServer();
  const nip96Endpoints = servers.find((_) => _.value === selected);
  let endpoint = nip96Endpoints ? selected : MediaUploaderServer[0][1];

  if (endpoint === "yakihonne") {
    let imageURL = await uploadToS3(file, userKeys.pub);
    if (imageURL) return imageURL;
    if (!imageURL) {
      store.dispatch(
        setToast({
          type: 2,
          desc: t("AOKDMRt"),
        })
      );
    }

    return false;
  }
  let event = {
    kind: 27235,
    content: "",
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["u", endpoint],
      ["method", "POST"],
    ],
  };
  if (userKeys.ext) {
    try {
      event = await window.nostr.signEvent(event);
    } catch (err) {
      store.dispatch(
        setToast({
          type: 2,
          desc: t("AOKDMRt"),
        })
      );
      console.log(err);
      return false;
    }
  } else {
    event = finalizeEvent(event, userKeys.sec);
  }
  let encodeB64 = encodeBase64URL(JSON.stringify(event));
  let fd = new FormData();
  fd.append("file", file);
  try {
    let imageURL = await axios.post(endpoint, fd, {
      headers: {
        "Content-Type": "multipart/formdata",
        Authorization: `Nostr ${encodeB64}`,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (cb) cb(percentCompleted);
      },
    });

    return imageURL.data.nip94_event.tags.find((tag) => tag[0] === "url")[1];
  } catch (err) {
    store.dispatch(
      setToast({
        type: 2,
        desc: t("AOKDMRt"),
      })
    );
    return false;
  }
};

const extractNip19 = (note) => {
  let note_ = note.split(/(\s|\n)/g);
  let tags = [];
  let processedNote = [];

  for (let word of note_) {
    if (word === "\n") {
      processedNote.push(word);
      continue;
    }

    let decoded = decodeNip19(word);
    if (decoded) {
      tags.push(decoded.tag);
      if (decoded.id.includes("30031")) tags.push(["l", "smart-widget"]);
      processedNote.push(decoded.scheme);
    } else if (word.startsWith("#")) {
      tags.push(["t", word.replaceAll("#", "")]);
      processedNote.push(word);
    } else {
      processedNote.push(word);
    }
  }

  return {
    tags: removeObjDuplicants(tags),
    content: processedNote.join(""),
  };
};

const decodeNip19 = (word) => {
  try {
    let word_ = word
      .replaceAll("@", "")
      .replaceAll("nostr:", "")
      .replaceAll(",", "")
      .replaceAll(".", "")
      .replaceAll(";", "");

    if (word_.startsWith("npub")) {
      let decoded = nip19.decode(word_);
      return {
        tag: ["p", decoded.data, "", "mention"],
        id: decoded.data,
        scheme: `nostr:${word_}`,
      };
    }
    if (word_.startsWith("nprofile")) {
      let decoded = nip19.decode(word_);
      return {
        tag: ["p", decoded.data.pubkey, "", "mention"],
        id: decoded.data.pubkey,
        scheme: `nostr:${word_}`,
      };
    }
    if (word_.startsWith("nevent")) {
      let decoded = nip19.decode(word_);
      return {
        tag: ["e", decoded.data.id, "", "mention"],
        id: decoded.data.id,
        scheme: `nostr:${word_}`,
      };
    }
    if (word_.startsWith("note")) {
      let decoded = nip19.decode(word_);
      return {
        tag: ["e", decoded.data, "", "mention"],
        id: decoded.data,
        scheme: `nostr:${word_}`,
      };
    }
    if (word_.startsWith("naddr")) {
      let decoded = nip19.decode(word_);
      return {
        tag: [
          "a",
          `${decoded.data.kind}:${decoded.data.pubkey}:${decoded.data.identifier}`,
          "",
          "mention",
        ],
        id: `${decoded.data.kind}:${decoded.data.pubkey}:${decoded.data.identifier}`,
        scheme: `nostr:${word_}`,
      };
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

const straightUp = () => {
  let el = document.querySelector(".main-page-nostr-container");
  if (!el) return;
  el.scrollTop = 0;
};

const compactContent = (note) => {
  if (!note) return "";
  let content = note.split(" ");
  let compactedContent = [];
  for (let word of content) {
    let replacedNostrPrefix = word.replace("nostr:", "").replace("@", "");
    if (
      replacedNostrPrefix.startsWith("npub") ||
      replacedNostrPrefix.startsWith("nprofile") ||
      replacedNostrPrefix.startsWith("naddr") ||
      replacedNostrPrefix.startsWith("note") ||
      replacedNostrPrefix.startsWith("nevent")
    )
      compactedContent.push(`@${replacedNostrPrefix.substring(0, 10)}`);
    else compactedContent.push(word);
  }
  return compactedContent.join(" ");
};

const redirectToLogin = () => {
  customHistory.push("/login");
};

const isHex = (str) => {
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(str) && str.length % 2 === 0;
};

const sleepTimer = async (duration = 2000) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(false);
    }, duration);
  });
};

const copyText = (value, message, event) => {
  event?.stopPropagation();
  navigator.clipboard.writeText(value);
  store.dispatch(
    setToast({
      type: 1,
      desc: `${message} 👏`,
    })
  );
};

export {
  getNoteTree,
  getLinkFromAddr,
  getComponent,
  getAuthPubkeyFromNip05,
  getAIFeedContent,
  getFlashnewsContent,
  getVideoContent,
  getVideoFromURL,
  shuffleArray,
  formatMinutesToMMSS,
  LoginToAPI,
  levelCount,
  getCurrentLevel,
  validateWidgetValues,
  getWallets,
  updateWallets,
  getConnectedAccounts,
  getKeys,
  toggleColorScheme,
  getCAEATooltip,
  FileUpload,
  extractNip19,
  straightUp,
  compactContent,
  redirectToLogin,
  isHex,
  getCustomSettings,
  getDefaultSettings,
  updateCustomSettings,
  getArticleDraft,
  removeArticleDraft,
  updateArticleDraft,
  getNoteDraft,
  updateNoteDraft,
  sleepTimer,
  getMediaUploader,
  updateMediaUploader,
  getSelectedServer,
  copyText,
  getAppLang,
  handleAppDirection,
  getContentTranslationConfig,
  updateContentTranslationConfig,
};
