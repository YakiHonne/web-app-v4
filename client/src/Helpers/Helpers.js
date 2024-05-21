import { nip19, nip44 } from "nostr-tools";
import { Link } from "react-router-dom";
import { decryptEventData, getHex } from "./Encryptions";
import NEventPreviewer from "../Components/NOSTR/NEventPreviewer";
import NProfilePreviewer from "../Components/NOSTR/NProfilePreviewer";
import NAddrPreviewer from "../Components/NOSTR/NAddrPreviewer";
import IMGElement from "../Components/NOSTR/IMGElement";
import axios from "axios";
import relaysOnPlatform from "../Content/Relays";
import { getImagePlaceholder } from "../Content/NostrPPPlaceholder";

const LoginToAPI = async (publicKey, secretKey) => {
  try {
    let { pubkey, password } = await getLoginsParams(publicKey, secretKey);
    if (!(pubkey && password)) return;
    const data = await axios.post("/api/v1/login", { password, pubkey });
    return true;
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
      ? nip44.default.v2.encrypt(
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
      if (/(https?:\/\/[^ ]*\.(?:mp4))/i.test(url)) resolve({ type: "video" });
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
    return false; // Or reject(error) if you want to propagate errors
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

const getNoteTree = async (note, is_important = false) => {
  let tree = note.split(/(\s|\n)+/).filter(Boolean);
  // let tree = note.split(/\s/);

  let finalTree = [];

  for (let i = 0; i < tree.length; i++) {
    const el = tree[i];
    const key = `${el}-${i}`;
    if (el === "\n") {
      finalTree.push(<br key={key} />);
    } else if (/(https?:\/\/)/i.test(el)) {
      const isURLVid = isVid(el);
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
              title="justin timberlake feat. timbaland - cry me a river [ slowed + reverb ]"
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
              title="justin timberlake feat. timbaland - cry me a river [ slowed + reverb ]"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          );
      }
      if (!isURLVid) {
        const checkURL = await isImageUrl(el);
        if (checkURL) {
          if (checkURL.type === "image") {
            finalTree.push(
              // <img
              //   className="sc-s-18"
              //   style={{ margin: "1rem auto" }}
              //   width={"100%"}
              //   src={el}
              //   alt="el"
              //   key={key}
              //   loading="lazy"
              // />
              <IMGElement src={el} key={key} />
            );
          } else if (checkURL.type === "video") {
            finalTree.push(
              <video
                key={key}
                controls={true}
                autoPlay={false}
                name="media"
                width={"100%"}
                className="sc-s-18"
                style={{ margin: "1rem auto" }}
              >
                <source src={el} type="video/mp4" />
              </video>
            );
          }
        } else {
          finalTree.push(
            <a
              style={{ wordBreak: "break-word" }}
              href={el}
              className="btn-text-gray"
              key={key}
              onClick={(e) => e.stopPropagation()}
            >
              {el}
            </a>
          );
        }
        // isMedia.then((checkURL) => {
        //   if (checkURL) {
        //     if (checkURL.type === "image") {
        //       finalTree.push(
        //         <img
        //           className="sc-s-18"
        //           style={{ margin: "1rem auto" }}
        //           width={"100%"}
        //           src={el}
        //           alt="el"
        //           key={key}
        //           loading="lazy"
        //         />
        //       );
        //     } else if (checkURL.type === "video") {
        //       finalTree.push(
        //         <video
        //           key={key}
        //           controls={true}
        //           autoPlay={false}
        //           name="media"
        //           width={"100%"}
        //           className="sc-s-18"
        //           style={{ margin: "1rem auto" }}
        //         >
        //           <source src={el} type="video/mp4" />
        //         </video>
        //       );
        //     }
        //   } else {
        //     finalTree.push(
        //       <a
        //         style={{ wordBreak: "break-word" }}
        //         href={el}
        //         className="btn-text-gray"
        //         key={key}
        //         onClick={(e) => e.stopPropagation()}
        //       >
        //         {el}
        //       </a>
        //     );
        //   }
        // });
      }
    } else if (el.includes("nostr:")) {
      const nip19add = el.split("nostr:")[1];
      const url = getLinkFromAddr(nip19add);
      finalTree.push(
        <Link
          to={url}
          className="btn-text-gray"
          target={"_blank"}
          key={key}
          onClick={(e) => e.stopPropagation()}
        >
          @{nip19add.substring(0, 10)}
        </Link>
      );
    } else {
      finalTree.push(
        <span
          style={{
            wordBreak: "break-word",
            color: "var(--dark-gray)",
            // color: is_important ? "var(--c1)" : "var(--dark-gray)",
          }}
          key={key}
        >
          {el}
        </span>
      );
    }
  }
  // console.log(finalTree);
  // let tt = mergeConsecutivePElements(finalTree);
  // console.log(tt);
  return mergeConsecutivePElements(finalTree);
};

const getLinkFromAddr = (addr) => {
  try {
    if (addr.startsWith("naddr")) {
      let data = nip19.decode(addr);
      return data.data.kind === 30023
        ? `/article/${addr}`
        : `/curations/${addr}`;
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
      return `/flash-news/${nip19.neventEncode({
        author: data.data.author,
        id: data.data.id,
      })}`;
    }

    return addr;
  } catch (err) {
    return addr;
  }
};

const getNIP21FromURL = (url) => {
  const regex = /n(event|profile|pub|addr)([^\s\W]*)/;
  const match = url.match(regex);

  if (match) {
    const extracted = match[0]; // Access the first matched group
    return `nostr:${extracted}`; // Output: "nostr:*"
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
          let addr = child_.split("nostr:")[1];
          try {
            if (addr.includes("naddr")) {
              let data = nip19.decode(addr);
              res.push(
                <NAddrPreviewer
                  pubkey={data.data.pubkey}
                  d={data.data.identifier}
                  kind={data.data.kind}
                  relays={data.data.relays}
                  key={key}
                />
              );
            }
            if (addr.includes("nprofile")) {
              let data = nip19.decode(addr);
              res.push(
                <NProfilePreviewer pubkey={data.data.pubkey} key={key} />
              );
            }
            if (addr.includes("npub")) {
              let hex = getHex(addr);

              res.push(<NProfilePreviewer pubkey={hex} key={key} />);
            }
            if (addr.includes("nevent")) {
              let data = nip19.decode(addr);
              res.push(
                <NEventPreviewer
                  id={data.data.id}
                  pubkey={data.data.author}
                  key={key}
                  extraRelays={data.data.relays}
                />
              );
            }
          } catch (err) {
            res.push(
              <p dir="auto" key={key}>
                {addr}
              </p>
            );
          }
        }
        if (!child_.startsWith("nostr:")) {
          res.push(
            <p dir="auto" key={key}>
              {child_}
            </p>
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
          />
        );
      }
      // if (children[i].type === "a") {
      //   let child_ = getNIP21FromURL(children[i].props.href);
      //   if (child_.startsWith("nostr:")) {
      //     let addr = child_.split("nostr:")[1];
      //     try {
      //       if (addr.includes("naddr")) {
      //         let data = nip19.decode(addr);
      //         res.push(
      //           <NAddrPreviewer
      //             pubkey={data.data.pubkey}
      //             d={data.data.identifier}
      //             kind={data.data.kind}
      //             key={key}
      //           />
      //         );
      //       }
      //       if (addr.includes("nprofile")) {
      //         let data = nip19.decode(addr);
      //         res.push(
      //           <NProfilePreviewer pubkey={data.data.pubkey} key={key} />
      //         );
      //       }
      //       if (addr.includes("npub")) {
      //         let hex = getHex(addr);
      //         console.log("first");
      //         res.push(<NProfilePreviewer pubkey={hex} key={key} />);
      //       }
      //       if (addr.includes("nevent")) {
      //         let data = nip19.decode(addr);

      //         res.push(
      //           <NEventPreviewer
      //             id={data.data.id}
      //             pubkey={data.data.author}
      //             key={key}
      //             extraRelays={data.data.relays}
      //           />
      //         );
      //       }
      //     } catch (err) {
      //       res.push(
      //         <p dir="auto" key={key}>
      //           {children[i]}
      //         </p>
      //       );
      //     }
      //   }
      //   if (!child_.startsWith("nostr:")) {
      //     res.push(
      //       <p dir="auto" key={key}>
      //         {children[i]}
      //       </p>
      //     );
      //   }
      // }
      // if (children[i].type !== "a") {
      //   res.push(
      //     <p dir="auto" key={key} style={{ margin: 0 }}>
      //       {children[i]}
      //     </p>
      //   );
      // }
      else
        res.push(
          <p dir="auto" key={key}>
            {children[i]}
          </p>
        );
    }
  }
  // let res_2 = []
  // let start = 0
  // let end = 0
  // for(let i= 0; i < res.length; i++) {
  //   if(res[i].type === "p") {
  //     start = i
  //   }
  // }
  return (
    <div
      className="fx-centered fx-start-h fx-wrap fit-container"
      style={{ columnGap: "3px", rowGap: "8px" }}
    >
      {mergeConsecutivePElements(res)}
    </div>
  );
};

function mergeConsecutivePElements(arr) {
  const result = [];
  let currentElement = null;

  for (const element of arr) {
    if (["p", "span"].includes(element.type)) {
      if (!currentElement) {
        currentElement = { ...element };
        currentElement.props = {
          ...element.props,
          children: [element.props.children],
        };
      } else {
        let tempPrevChildren = currentElement.props.children;
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
        currentElement = {
          ...currentElement,
          props: {
            ...currentElement.props,
            children: tempPrevChildren,
          },
        };
      }
    } else {
      if (currentElement) {
        result.push(currentElement);
        currentElement = null;
      }

      result.push(element);
    }
  }
  if (currentElement) {
    result.push(currentElement);
  }
  return result;
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
  // console.log(video)
  let tags = video.tags;
  let keywords = [];
  let published_at = video.created_at;
  let title = "";
  let url = "";
  let d = "";
  let image = "";
  let duration = 0;

  for (let tag of tags) {
    if (tag[0] === "t") keywords.push(tag[1]);
    if (tag[0] === "published_at" && tag[1]) published_at = parseInt(tag[1]);
    if (tag[0] === "duration" && tag[1]) duration = parseInt(tag[1]);
    if (tag[0] === "d") d = tag[1];
    if (tag[0] === "url") url = tag[1];
    if (tag[0] === "title") title = tag[1];
    if ((tag[0] === "thumb" || tag[0] === "image") && tag[1]) image = tag[1];
  }

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
          title="justin timberlake feat. timbaland - cry me a river [ slowed + reverb ]"
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
          title="justin timberlake feat. timbaland - cry me a river [ slowed + reverb ]"
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
        style={{ margin: "1rem auto", border: "none", aspectRatio: "16/9" }}
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
};
