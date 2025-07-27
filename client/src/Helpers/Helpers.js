import { finalizeEvent, generateSecretKey, nip19, nip44 } from "nostr-tools";
import {
  bytesTohex,
  decryptEventData,
  encodeBase64URL,
  encrypt44,
  getBech32,
  getHex,
  removeObjDuplicants,
} from "./Encryptions";
import IMGElement from "../Components/Main/IMGElement";
import axios from "axios";
import relaysOnPlatform from "../Content/Relays";
import { getImagePlaceholder } from "../Content/NostrPPPlaceholder";
import React, { Fragment } from "react";
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
import axiosInstance from "./HTTP_Client";
import LinkPreview from "../Components/Main/LinkPreview";
import Gallery from "../Components/Main/Gallery";
import MACIPollPreview from "../Components/Main/MACIPollPreview";
import { InitEvent } from "./Controlers";
import LinkInspector from "../Components/LinkInspector";
import VideoLoader from "../Components/Main/VideoLoader";

const LoginToAPI = async (publicKey, userKeys) => {
  try {
    let { pubkey, password } = await getLoginsParams(publicKey, userKeys);
    if (!(pubkey && password)) return;
    const data = await axios.post("/api/v1/login", { password, pubkey });
    return data.data;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const getLoginsParams = async (publicKey, userKeys) => {
  try {
    let content = JSON.stringify({
      pubkey: publicKey,
      sent_at: Math.floor(new Date().getTime() / 1000),
    });

    let password = await encrypt44(
      userKeys,
      process.env.REACT_APP_CHECKER_PUBKEY,
      content
    );

    return { password, pubkey: publicKey };
  } catch (err) {
    console.log(err);
    return { password: false, pubkey: false };
  }
};

const getAnswerFromAIRemoteAPI = async (pubkey_, input) => {
  try {
    let { password } = await getLoginsParams(pubkey_, {
      sec: process.env.REACT_APP_CHECKER_SEC,
    });
    const res = await axios.post(
      // "http://localhost:4700/api/v1/ai",
      "https://yakiai.yakihonne.com/api/v1/ai",
      {
        input,
      },
      {
        headers: {
          Authorization: password,
        },
      }
    );
    const data = res.data;
    return data;
  } catch (err) {
    throw Error(err);
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

const isImageUrl = (url) => {
  // try {
  //   return new Promise((resolve, reject) => {
  //     if (
  //       url.startsWith("data:image") ||
  //       /(https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg|webp))/i.test(url)
  //     )
  //       resolve({ type: "image" });
  //     if (/(https?:\/\/[^ ]*\.(?:mp4|mov))/i.test(url))
  //       resolve({ type: "video" });
  //     const img = new Image();

  //     img.onload = () => {
  //       resolve({ type: "image" });
  //     };

  //     img.onerror = () => {
  //       resolve(false);
  //     };

  //     img.src = url;
  //   });
  // } catch (error) {
  //   console.error(`Error checking URL ${url}:`, error);
  //   return false;
  // }

  try {
    // Data URLs
    if (/^data:image/.test(url)) return { type: "image" };
    if (/^data:video/.test(url)) return { type: "video" };

    // By extension
    if (/(https?:\/\/[^ ]*\.(gif|png|jpg|jpeg|webp))/i.test(url))
      return { type: "image" };
    if (/(https?:\/\/[^ ]*\.(mp4|mov|webm|ogg|avi))/i.test(url))
      return { type: "video" };

    // Heuristic: common image CDN/paths and known image hosts
    if (
      /(\/images\/|cdn\.|img\.|\/media\/|\/uploads\/|encrypted-tbn0\.gstatic\.com\/images|i\.insider\.com\/)/i.test(
        url
      ) &&
      !/\.(mp4|mov|webm|ogg|avi)$/i.test(url)
    ) {
      return { type: "image" };
    }

    // Heuristic: query param with image keyword
    if (
      /([?&]format=image|[?&]type=image)/i.test(url) &&
      !/\.(mp4|mov|webm|ogg|avi)$/i.test(url)
    ) {
      return { type: "image" };
    }

    return false;
  } catch (error) {
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

const getNoteTree = (
  note,
  minimal = false,
  isCollapsedNote = false,
  wordsCount = 150,
  pubkey
) => {
  if (!note) return "";

  let tree = note
    .trim()
    .split(/(\n)/)
    .flatMap((segment) => (segment === "\n" ? "\n" : segment.split(/\s+/)))
    .filter(Boolean);

  let finalTree = [];
  let maxChar = isCollapsedNote ? wordsCount : tree.length;
  for (let i = 0; i < maxChar; i++) {
    const el = tree[i];
    const key = `${el}-${i}`;
    if (el === "\n") {
      finalTree.push(<br key={key} />);
    } else if (
      (/(https?:\/\/)/i.test(el) || el.startsWith("data:image")) &&
      !el.includes("https://yakihonne.com/smart-widget-checker?naddr=") &&
      !el.includes("https://vota.dorafactory.org/round/") &&
      !el.includes("https://vota-test.dorafactory.org/round/")
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
          // finalTree.push(
          //   // <Fragment key={key}>
          //   <LinkInspector el={el} key={key} />
          //   // </Fragment>
          // );
          const checkURL = isImageUrl(el);
          if (checkURL) {
            if (checkURL.type === "image") {
              finalTree.push(<IMGElement src={el} key={key} />);
            } else if (checkURL.type === "video") {
              finalTree.push(
                // <video
                //   key={key}
                //   controls={true}
                //   autoPlay={false}
                //   poster="https://images.ctfassets.net/hrltx12pl8hq/28ECAQiPJZ78hxatLTa7Ts/2f695d869736ae3b0de3e56ceaca3958/free-nature-images.jpg?fit=fill&w=1200&h=630"
                //   preload="none"
                //   name="media"
                //   width={"100%"}
                //   className="sc-s-18"
                //   style={{ margin: ".5rem auto", aspectRatio: "16/9" }}
                // >
                //   <source src={el} type="video/mp4" />
                // </video>
                <VideoLoader
                  key={key}
                  src={el}
                  poster="https://images.ctfassets.net/hrltx12pl8hq/28ECAQiPJZ78hxatLTa7Ts/2f695d869736ae3b0de3e56ceaca3958/free-nature-images.jpg?fit=fill&w=1200&h=630"
                />
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
                <LinkPreview url={el} />{" "}
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
      el?.includes("https://vota.dorafactory.org/round/") ||
      el?.includes("https://vota-test.dorafactory.org/round/")
    ) {
      finalTree.push(<MACIPollPreview url={el} key={key} />);
    } else if (
      (el?.includes("nostr:") ||
        el?.includes("naddr") ||
        el?.includes("https://yakihonne.com/smart-widget-checker?naddr=") ||
        el?.includes("nprofile") ||
        el?.includes("npub") ||
        el?.includes("note1") ||
        el?.includes("nevent")) &&
      el?.length > 30
    ) {
      const nip19add = el
        .replace("https://yakihonne.com/smart-widget-checker?naddr=", "")
        .replace("nostr:", "");

      const parts = nip19add.split(/([@.,?!\s:()’"'])/);

      const finalOutput = parts.map((part, index) => {
        if (
          part?.startsWith("npub1") ||
          part?.startsWith("nprofile1") ||
          part?.startsWith("nevent") ||
          part?.startsWith("naddr") ||
          part?.startsWith("note1")
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
    } else if (el?.startsWith("lnbc") && el.length > 30) {
      finalTree.push(<LNBCInvoice lnbc={el} key={key} />);
    } else if (el?.startsWith("#")) {
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

  return mergeConsecutivePElements(finalTree, pubkey);
};
// const getNoteTree = async (
//   note,
//   minimal = false,
//   isCollapsedNote = false,
//   wordsCount = 150,
//   pubkey
// ) => {
//   if (!note) return "";

//   let tree = note
//     .trim()
//     .split(/(\n)/)
//     .flatMap((segment) => (segment === "\n" ? "\n" : segment.split(/\s+/)))
//     .filter(Boolean);

//   let finalTree = [];
//   let maxChar = isCollapsedNote ? wordsCount : tree.length;
//   for (let i = 0; i < maxChar; i++) {
//     const el = tree[i];
//     const key = `${el}-${i}`;
//     if (el === "\n") {
//       finalTree.push(<br key={key} />);
//     } else if (
//       (/(https?:\/\/)/i.test(el) || el.startsWith("data:image")) &&
//       !el.includes("https://yakihonne.com/smart-widget-checker?naddr=") &&
//       !el.includes("https://vota.dorafactory.org/round/") &&
//       !el.includes("https://vota-test.dorafactory.org/round/")
//     ) {
//       const isURLVid = isVid(el);
//       if (!minimal) {
//         if (isURLVid) {
//           if (isURLVid.isYT) {
//             finalTree.push(
//               <iframe
//                 key={key}
//                 style={{
//                   width: "100%",
//                   aspectRatio: "16/9",
//                   borderRadius: "var(--border-r-18)",
//                 }}
//                 src={`https://www.youtube.com/embed/${isURLVid.videoId}`}
//                 frameBorder="0"
//                 allowFullScreen
//               ></iframe>
//             );
//           }
//           if (!isURLVid.isYT)
//             finalTree.push(
//               <iframe
//                 key={key}
//                 style={{
//                   width: "100%",
//                   aspectRatio: "16/9",
//                   borderRadius: "var(--border-r-18)",
//                 }}
//                 src={`https://player.vimeo.com/video/${isURLVid.videoId}`}
//                 frameBorder="0"
//                 allowFullScreen
//               ></iframe>
//             );
//         }
//         if (!isURLVid) {
//           const checkURL = await isImageUrl(el);
//           if (checkURL) {
//             if (checkURL.type === "image") {
//               finalTree.push(<IMGElement src={el} key={key} />);
//             } else if (checkURL.type === "video") {
//               finalTree.push(
//                 <video
//                   key={key}
//                   controls={true}
//                   autoPlay={false}
//                   name="media"
//                   width={"100%"}
//                   className="sc-s-18"
//                   style={{ margin: ".5rem auto", aspectRatio: "16/9" }}
//                 >
//                   <source src={el} type="video/mp4" />
//                 </video>
//               );
//             }
//           } else if (
//             el.includes(".mp3") ||
//             el.includes(".ogg") ||
//             el.includes(".wav")
//           ) {
//             finalTree.push(
//               <audio
//                 controls
//                 key={key}
//                 className="fit-container"
//                 style={{ margin: ".5rem auto", minWidth: "300px" }}
//               >
//                 <source src={el} type="audio/ogg" />
//                 <source src={el} type="audio/mpeg" />
//                 <source src={el} type="audio/wav" />
//                 Your browser does not support the audio element.
//               </audio>
//             );
//           } else {
//             finalTree.push(
//               <Fragment key={key}>
//                 <LinkPreview url={el} />{" "}
//               </Fragment>
//             );
//           }
//         }
//       } else
//         finalTree.push(
//           <Fragment key={key}>
//             <a
//               style={{ wordBreak: "break-word", color: "var(--orange-main)" }}
//               href={el}
//               className="btn-text-gray"
//               onClick={(e) => e.stopPropagation()}
//             >
//               {el}
//             </a>{" "}
//           </Fragment>
//         );
//     } else if (
//       el?.includes("https://vota.dorafactory.org/round/") ||
//       el?.includes("https://vota-test.dorafactory.org/round/")
//     ) {
//       finalTree.push(<MACIPollPreview url={el} key={key} />);
//     } else if (
//       (el?.includes("nostr:") ||
//         el?.includes("naddr") ||
//         el?.includes("https://yakihonne.com/smart-widget-checker?naddr=") ||
//         el?.includes("nprofile") ||
//         el?.includes("npub") ||
//         el?.includes("note1") ||
//         el?.includes("nevent")) &&
//       el?.length > 30
//     ) {
//       const nip19add = el
//         .replace("https://yakihonne.com/smart-widget-checker?naddr=", "")
//         .replace("nostr:", "");

//       const parts = nip19add.split(/([@.,?!\s:()’"'])/);

//       const finalOutput = parts.map((part, index) => {
//         if (
//           part?.startsWith("npub1") ||
//           part?.startsWith("nprofile1") ||
//           part?.startsWith("nevent") ||
//           part?.startsWith("naddr") ||
//           part?.startsWith("note1")
//         ) {
//           const cleanedPart = part.replace(/[@.,?!]/g, "");

//           return (
//             <Fragment key={index}>
//               <Nip19Parsing addr={cleanedPart} minimal={minimal} />
//             </Fragment>
//           );
//         }

//         return part;
//       });
//       finalTree.push(<Fragment key={key}>{finalOutput} </Fragment>);
//     } else if (el?.startsWith("lnbc") && el.length > 30) {
//       finalTree.push(<LNBCInvoice lnbc={el} key={key} />);
//     } else if (el?.startsWith("#")) {
//       const match = el.match(/(#+)([\w-+]+)/);

//       if (match) {
//         const hashes = match[1];
//         const text = match[2];

//         finalTree.push(
//           <React.Fragment key={key}>
//             {hashes.slice(1)}
//             <Link
//               style={{ wordBreak: "break-word", color: "var(--orange-main)" }}
//               to={`/search?keyword=${text}`}
//               state={{ tab: "notes" }}
//               className="btn-text-gray"
//               onClick={(e) => e.stopPropagation()}
//             >
//               {`${hashes.slice(-1)}${text}`}
//             </Link>{" "}
//           </React.Fragment>
//         );
//       }
//     } else {
//       finalTree.push(
//         <span
//           style={{
//             wordBreak: "break-word",
//             color: "var(--dark-gray)",
//           }}
//           key={key}
//         >
//           {el}{" "}
//         </span>
//       );
//     }
//   }

//   return mergeConsecutivePElements(finalTree, pubkey);
// };

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
      if (data.data.kind === 30033) return `/smart-widget/${addr}`;
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
      return `/notes/${nEventEncode(data.data.id)}`;
      // return `/notes/${nip19.neventEncode({
      //   author: data.data.author,
      //   id: data.data.id,
      // })}`;
    }
    if (addr.startsWith("note")) {
      let data = nip19.decode(addr);
      return `/notes/${nEventEncode(data.data)}`;
    }

    return addr;
  } catch (err) {
    return addr_;
  }
};

const getLinkPreview = async (url) => {
  try {
    const metadata = await Promise.race([
      axiosInstance.get("/api/v1/link-preview?url=" + encodeURIComponent(url)),
      sleepTimer(2000),
    ]);
    if (metadata)
      return {
        ...metadata.data,
        imagePP: getImagePlaceholder(),
        domain: url.split("/")[2],
      };
    return false;
  } catch (err) {
    console.log(err);
    return false;
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

function mergeConsecutivePElements(arr, pubkey) {
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
    } else if (
      typeof element.type !== "string" &&
      element.props?.src &&
      element.props?.poster === undefined
    ) {
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
        result.push(createImageGrid(currentImages, pubkey));
        currentImages = [];
      }
      result.push(element);
    }
  }

  if (currentTextElement) {
    result.push(currentTextElement);
  }
  if (currentImages.length > 0) {
    result.push(createImageGrid(currentImages, pubkey));
  }

  return result;
}

function createImageGrid(images, pubkey) {
  // if (images.length === 1)
  //   return (
  //     <div className="image-grid" key={Math.random()}>
  //       {images.map((image, index) =>
  //         React.cloneElement(image, { key: index })
  //       )}
  //     </div>
  //   );
  let images_ = images.map((image) => image.props.src);
  return <Gallery imgs={images_} pubkey={pubkey} />;
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
    return data.data?.names ? data.data.names[addressParts[0]] : false;
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

const getFlashnewsContent = (news) => {
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

  let content = getNoteTree(
    news.content,
    undefined,
    undefined,
    undefined,
    news.pubkey
  );
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
const replaceMediaUploader = (data, selected) => {
  let userKeys = getKeys();
  let servers = localStorage.getItem("media-uploader");
  if (!userKeys) return;
  try {
    servers = servers ? JSON.parse(servers) : [];
    let pubkey = userKeys?.pub;
    let servers_index = servers.findIndex((_) => _?.pubkey === pubkey);
    if (servers_index !== -1) {
      if (data) servers[servers_index].servers = data;
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
const getAllWallets = () => {
  let wallets = localStorage.getItem("yaki-wallets");
  if (!wallets) return [];
  try {
    wallets = JSON.parse(wallets);
    return wallets;
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

const getWotConfigDefault = () => {
  return {
    score: 2,
    all: false,
    notifications: false,
    reactions: false,
    dms: false,
  };
};

const getWotConfig = () => {
  let userKeys = getKeys();
  if (!userKeys) return getWotConfigDefault("");
  let config = localStorage.getItem(`${userKeys.pub}-wot-config`);
  if (!config) return getWotConfigDefault();
  try {
    config = JSON.parse(config);
    let checkConfig = Object.entries(config).filter(([key, value]) => {
      if (["all", "notifications", "reactions", "dms", "score"].includes(key))
        return true;
    });
    if (checkConfig.length === 5) return config;
    else return getWotConfigDefault();
  } catch (err) {
    return getWotConfigDefault();
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

const getCustomServices = () => {
  let userKeys = getKeys();
  if (!userKeys) return {};
  let customServices = localStorage.getItem(`custom-lang-services-${userKeys.pub}`);
  if (!customServices) return {};
  try {
    customServices = JSON.parse(customServices);
    return customServices;
  } catch (err) {
    return {};
  }
}

const getDefaultSettings = (pubkey) => {
  return {
    pubkey,
    userHoverPreview: true,
    collapsedNote: true,
    contentList: [
      { tab: "recent", isHidden: false },
      { tab: "recent_with_replies", isHidden: false },
      { tab: "trending", isHidden: false },
      { tab: "highlights", isHidden: false },
      { tab: "paid", isHidden: false },
      { tab: "widgets", isHidden: false },
    ],
    notification: [
      { tab: "mentions", isHidden: false },
      { tab: "reactions", isHidden: false },
      { tab: "reposts", isHidden: false },
      { tab: "zaps", isHidden: false },
      { tab: "following", isHidden: false },
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

const FileUpload = async (file, userKeys, cb) => {
  let service = ["1", "2"].includes(
    localStorage.getItem(`${userKeys.pub}_media_service`)
  )
    ? localStorage.getItem(`${userKeys.pub}_media_service`)
    : "1";

  let result = "";
  if (service === "1")
    result = await regularServerFileUpload(file, userKeys, cb);

  if (service === "2")
    result = await blossomServerFileUpload(file, userKeys, cb);
  return result;
};

const blossomServerFileUpload = async (file, userKeys, cb) => {
  let mirror = localStorage.getItem(`${userKeys.pub}_mirror_blossom_servers`);
  let servers = store.getState().userBlossomServers;
  let endpoint =
    servers.length > 0
      ? `${servers[0]}/upload`
      : "https://blossom.yakihonne.com/upload";

  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], {
    type: file.type || "application/octet-stream",
  });
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const localSha256 = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  let x = localSha256;
  let expiration = `${Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7}`;
  let event = {
    kind: 24242,
    content: "Image upload",
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["t", "upload"],
      ["x", x],
      ["expiration", expiration],
    ],
  };
  event = await InitEvent(
    event.kind,
    event.content,
    event.tags,
    event.created_at
  );
  if (!event) return;
  let encodeB64 = encodeBase64URL(JSON.stringify(event));

  try {
    let imageURL = await axios.put(endpoint, blob, {
      headers: {
        "Content-Type": blob.type,
        "Content-Length": blob.size.toString(),
        Authorization: `Nostr ${encodeB64}`,
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (cb) cb(percentCompleted);
      },
    });
    mirrorBlossomServerFileUpload(
      mirror,
      servers,
      encodeB64,
      imageURL.data.url
    );
    return imageURL.data.url;
  } catch (err) {
    console.log(err);
    store.dispatch(
      setToast({
        type: 2,
        desc: t("AOKDMRt"),
      })
    );
    return false;
  }
};

const mirrorBlossomServerFileUpload = async (
  isMirror,
  serversList,
  eventHash,
  fileUrl
) => {
  try {
    // let hash = await downloadBlobAsArrayBuffer(fileUrl);
    // if (!hash) return;
    // let expiration = `${Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7}`;
    // let event = {
    //   kind: 24242,
    //   content: "Image mirror",
    //   created_at: Math.floor(Date.now() / 1000),
    //   tags: [
    //     ["t", "upload"],
    //     ["x", hash],
    //     ["expiration", expiration],
    //   ],
    // };
    // event = await InitEvent(
    //   event.kind,
    //   event.content,
    //   event.tags,
    //   event.created_at
    // );
    // let encodeB64 = encodeBase64URL(JSON.stringify(event));
    if (isMirror && serversList.length > 1) {
      serversList = serversList.filter((_, index) => index !== 0);
      let promises = await Promise.allSettled(
        serversList.map(async (server, index) => {
          let endpoint = `${server}/mirror`;
          let data = {
            url: fileUrl,
          };
          try {
            await axios.put(endpoint, data, {
              headers: {
                Authorization: `Nostr ${eventHash}`,
              },
            });
          } catch (err) {
            console.log(err);
          }
        })
      );
    }
  } catch (err) {
    console.log(err);
  }
};

async function downloadBlobAsArrayBuffer(fileUrl) {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error("Failed to download the file.");
    }
    const arrayBuffer = await response.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const remoteSha256 = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return remoteSha256;
  } catch (error) {
    console.error("Error downloading file:", error);
    return null;
  }
}
const regularServerFileUpload = async (file, userKeys, cb) => {
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
  event = await InitEvent(
    event.kind,
    event.content,
    event.tags,
    event.created_at
  );
  if (!event) return;
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

    if (word_.startsWith("npub") && word_.length > 30) {
      let decoded = nip19.decode(word_);
      return {
        tag: ["p", decoded.data, "", "mention"],
        id: decoded.data,
        scheme: `nostr:${word_}`,
      };
    }
    if (word_.startsWith("nprofile") && word_.length > 30) {
      let decoded = nip19.decode(word_);
      return {
        tag: ["p", decoded.data.pubkey, "", "mention"],
        id: decoded.data.pubkey,
        scheme: `nostr:${word_}`,
      };
    }
    if (word_.startsWith("nevent") && word_.length > 30) {
      let decoded = nip19.decode(word_);
      return {
        tag: ["e", decoded.data.id, "", "mention"],
        id: decoded.data.id,
        scheme: `nostr:${word_}`,
      };
    }
    if (word_.startsWith("note") && word_.length > 30) {
      let decoded = nip19.decode(word_);
      return {
        tag: ["e", decoded.data, "", "mention"],
        id: decoded.data,
        scheme: `nostr:${word_}`,
      };
    }
    if (word_.startsWith("naddr") && word_.length > 30) {
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

const compactContent = (note, pubkey) => {
  if (!note) return "";
  let content = note
    .trim()
    .split(/(\n)/)
    .flatMap((segment) => (segment === "\n" ? "\n" : segment.split(/\s+/)))
    .filter(Boolean);
  let compactedContent = [];
  let index = 0;
  for (let word of content) {
    let replacedNostrPrefix = word
      .trim()
      .replaceAll("nostr:", "")
      .replaceAll("@", "");
    // if (
    //   replacedNostrPrefix.startsWith("npub") ||
    //   replacedNostrPrefix.startsWith("nprofile") ||
    //   replacedNostrPrefix.startsWith("naddr") ||
    //   replacedNostrPrefix.startsWith("note") ||
    //   replacedNostrPrefix.startsWith("nevent")
    // ) {
    //   compactedContent.push(
    //     <a
    //       className="c1-c"
    //       target="_blank"
    //       onClick={(e) => e.stopPropagation()}
    //       href={`/${replacedNostrPrefix}`}
    //     >{`@${replacedNostrPrefix.substring(0, 20)}`}</a>
    //   );
    if (
      word.startsWith("data:image") ||
      /(https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg|webp))/i.test(word)
    )
      compactedContent.push(<IMGElement src={word} key={index} />);
    else if (word === "\n") {
      compactedContent.push(<br key={index} />);
    } else {
      const parts = replacedNostrPrefix.split(/([@.,?!\s:()’"'])/);

      const finalOutput = parts.map((part, index) => {
        if (
          part?.startsWith("npub1") ||
          part?.startsWith("nprofile1") ||
          part?.startsWith("nevent") ||
          part?.startsWith("naddr") ||
          part?.startsWith("note1")
        ) {
          const cleanedPart = part.replace(/[@.,?!]/g, "");

          return (
            <Fragment key={index}>
              <Nip19Parsing addr={cleanedPart} minimal={true} />
            </Fragment>
          );
        }

        return part;
      });
      compactedContent.push(<Fragment key={index}>{finalOutput} </Fragment>);
    }
    index++;
    // } else compactedContent.push(word);
  }
  return mergeConsecutivePElements(compactedContent, pubkey);
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

function getLevenshteinDistance(a, b) {
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  const matrix = Array.from({ length: lenA + 1 }, (_, i) =>
    Array(lenB + 1).fill(0)
  );

  for (let i = 0; i <= lenA; i++) matrix[i][0] = i;
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[lenA][lenB];
}

function sortByKeyword(array, keyword) {
  return array
    .filter((_) => _.display_name || _.name)
    .sort((a, b) => {
      const aHasNip05 = a.nip05 ? 1 : 0;
      const bHasNip05 = b.nip05 ? 1 : 0;

      const nameA = a.display_name?.toLowerCase() || a.name?.toLowerCase();
      const nameB = b.display_name?.toLowerCase() || b.name?.toLowerCase();

      const aKeywordPriority = nameA
        .toLowerCase()
        .startsWith(keyword.toLowerCase())
        ? 2
        : nameA.toLowerCase().includes(keyword.toLowerCase())
        ? 1
        : 0;
      const bKeywordPriority = nameB
        .toLowerCase()
        .startsWith(keyword.toLowerCase())
        ? 2
        : nameB.toLowerCase().includes(keyword.toLowerCase())
        ? 1
        : 0;

      const scoreA = getLevenshteinDistance(nameA, keyword.toLowerCase());
      const scoreB = getLevenshteinDistance(nameB, keyword.toLowerCase());

      const aScore = 0 + aKeywordPriority + aHasNip05;
      const bScore = 0 + bKeywordPriority + bHasNip05;

      if (aScore !== bScore) return bScore - aScore;
      if (aHasNip05 !== bHasNip05) return bHasNip05 - aHasNip05;
      return scoreB - scoreA;
    });

  // return array.sort((a, b) => {
  //   // if (!a.nip05 && b.nip05) return 1;
  //   // if (a.nip05 && !b.nip05) return -1;

  //   const distanceA = getLevenshteinDistance(
  //     a.display_name.toLowerCase() || a.name.toLowerCase(),
  //     keyword.toLowerCase()
  //   );
  //   const distanceB = getLevenshteinDistance(
  //     b.display_name.toLowerCase() || b.name.toLowerCase(),
  //     keyword.toLowerCase()
  //   );

  //   return distanceA - distanceB;
  // });
  // return array.sort((a, b) => {
  //   const distanceA = getLevenshteinDistance(a.display_name || b.name, keyword);
  //   const distanceB = getLevenshteinDistance(b.display_name || b.name, keyword);
  //   return distanceA - distanceB; // Sort by ascending distance
  // });
}

const verifyEvent = (event) => {
  if (!event) {
    console.error("No event to parse");
    return false;
  }
  const { pubkey, kind, tags, content, id } = event;
  if (!(kind && tags && pubkey && id)) {
    console.error("Invalid event structure");
    return false;
  }

  if (kind !== 30033) {
    return false;
  }
  let identifier = "";
  let type = "basic";
  let icon = "";
  let image = "";
  let input = "";
  let buttons = [];

  for (let tag of tags) {
    if (tag[0] === "d") identifier = tag[1];
    if (tag[0] === "l") type = tag[1];
    if (tag[0] === "icon") icon = tag[1];
    if (tag[0] === "image") image = tag[1];
    if (tag[0] === "input") input = tag[1];
    if (tag[0] === "button") {
      let button_ = {
        label: tag[1] || "",
        type: tag[2] || "",
        url: tag[3] || "",
        type_status: ["redirect", "post", "app", "zap", "nostr"].includes(
          tag[2] || ""
        ),
        url_status: isURLValid(tag[3] || "", tag[2] || ""),
      };
      buttons.push(button_);
    }
  }
  let aTag = `${kind}:${pubkey}:${identifier}`;

  return {
    id,
    type,
    icon,
    content: content || "N/A",
    pubkey,
    kind,
    image,
    image_status: isURLValid(image, "redirect"),
    input,
    buttons,
    identifier,
    aTag,
  };
};

export const isURLValid = (url, type) => {
  let emailAddrRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!(url && type)) return false;
  if (
    (!type || ["redirect", "post", "app"].includes(type)) &&
    !(
      url.startsWith("https://") ||
      url.startsWith("http://") ||
      url.startsWith("data:image/")
    )
  )
    return false;
  if (
    type === "nostr" &&
    !(
      url.startsWith("nostr:") ||
      url.startsWith("npub") ||
      url.startsWith("nprofile") ||
      url.startsWith("note1") ||
      url.startsWith("nevent") ||
      url.startsWith("naddr")
    )
  )
    return false;
  if (
    type === "zap" &&
    !(
      emailAddrRegex.test(url) ||
      (url.startsWith("lnurl") && url.length > 32) ||
      (url.startsWith("lnbc") && url.length > 32)
    )
  )
    return false;

  return {
    status: true,
  };
};

const base64ToFile = (base64String, fileName = "image.jpg") => {
  const [prefix, data] = base64String.split(",");
  const mimeType = prefix.match(/:(.*?);/)[1] || "image/jpeg";

  const byteString = atob(data);
  const byteNumbers = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    byteNumbers[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([byteNumbers], { type: mimeType });

  const file = new File([blob], `${Date.now()}.png`, { type: mimeType });

  return file;
};

const getStorageEstimate = async () => {
  try {
    if (!navigator.storage || !navigator.storage.estimate) {
      throw new Error("Storage Quota API not supported");
    }

    const estimate = await navigator.storage.estimate();
    const usedStorage = estimate.usage;

    return Math.floor(usedStorage / 1000000);
  } catch (error) {
    console.error("Error getting storage estimate:", error);
    return null;
  }
};

const makeReadableNumber = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const assignClientTag = (tags) => {
  return [
    [
      "client",
      "Yakihonne",
      "31990:20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3:1700732875747",
    ],
    ...tags,
  ];
};

const extractRootDomain = (url) => {
  try {
    let hostname = new URL(url).hostname;
    let parts = hostname.split(".");

    if (parts.length > 2) {
      return parts[parts.length - 2];
    }
    return parts[0];
  } catch (error) {
    return url;
  }
};
const addWidgetPathToUrl = (url) => {
  try {
    const parsedUrl = new URL(url);

    const widgetPath = "/.well-known/widget.json";
    if (
      parsedUrl.pathname === widgetPath ||
      parsedUrl.pathname.endsWith(widgetPath)
    ) {
      return url;
    }

    const rootDomain = `${parsedUrl.protocol}//${parsedUrl.hostname}`;

    const newUrl = `${rootDomain}${widgetPath}`;

    return newUrl;
  } catch (err) {
    return false;
  }
};

const nEventEncode = (id) => {
  return nip19.neventEncode({
    id,
  });
};

const getRepliesViewSettings = () => {
  try {
    let userKeys = getKeys();
    if (userKeys?.pub) {
      let isThread = localStorage.getItem(`replies-view-${userKeys.pub}`);
      if (isThread === "thread") return true;
      return false;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
};
const setRepliesViewSettings = (settings = "box") => {
  try {
    let userKeys = getKeys();
    if (userKeys?.pub) {
      localStorage.setItem(`replies-view-${userKeys.pub}`, settings);
    }
  } catch (err) {
    console.log(err);
  }
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
  sortByKeyword,
  getLinkPreview,
  getAllWallets,
  verifyEvent,
  base64ToFile,
  replaceMediaUploader,
  getStorageEstimate,
  makeReadableNumber,
  assignClientTag,
  extractRootDomain,
  addWidgetPathToUrl,
  nEventEncode,
  getRepliesViewSettings,
  setRepliesViewSettings,
  getWotConfig,
  getAnswerFromAIRemoteAPI,
  isImageUrl,
  getCustomServices
};
