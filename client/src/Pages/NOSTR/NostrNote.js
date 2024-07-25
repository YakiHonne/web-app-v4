import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingScreen from "../../Components/LoadingScreen";
import { nip19, finalizeEvent, SimplePool } from "nostr-tools";
import relaysOnPlatform from "../../Content/Relays";
import {
  checkForLUDS,
  decodeBolt11,
  decryptEventData,
  filterRelays,
  getBolt11,
  getEmptyNostrUser,
  getZapper,
} from "../../Helpers/Encryptions";
import { Context } from "../../Context/Context";
import { Helmet } from "react-helmet";
import ArrowUp from "../../Components/ArrowUp";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import NavbarNOSTR from "../../Components/NOSTR/NavbarNOSTR";
import UserProfilePicNOSTR from "../../Components/NOSTR/UserProfilePicNOSTR";
import NumberShrink from "../../Components/NumberShrink";
import ShowUsersList from "../../Components/NOSTR/ShowUsersList";
import { Link } from "react-router-dom";
import Date_ from "../../Components/Date_";
import ZapTip from "../../Components/NOSTR/ZapTip";
import LoadingDots from "../../Components/LoadingDots";
import axios from "axios";
import UN from "../../Components/NOSTR/UN";
import SaveArticleAsBookmark from "../../Components/NOSTR/SaveArticleAsBookmark";
import { getNoteTree } from "../../Helpers/Helpers";
import LoginNOSTR from "../../Components/NOSTR/LoginNOSTR";
import Footer from "../../Components/Footer";
import ShareLink from "../../Components/ShareLink";
import SearchbarNOSTR from "../../Components/NOSTR/SearchbarNOSTR";
import HomeFN from "../../Components/NOSTR/HomeFN";
import KindOne from "../../Components/NOSTR/KindOne";
import QuoteNote from "../../Components/NOSTR/QuoteNote";
import NotesComment from "../../Components/NOSTR/NotesComment";
const pool = new SimplePool();
const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

const checkForSavedCommentOptions = () => {
  try {
    let options = localStorage.getItem("comment-with-suffix");
    if (options) {
      let res = JSON.parse(options);
      return res.keep_suffix;
    }
    return -1;
  } catch {
    return -1;
  }
};

const filterRootComments = async (all) => {
  let temp = [];
  for (let comment of all) {
    if (!comment.tags.find((item) => item[0] === "e" && item[3] === "reply")) {
      let [note_tree, count] = await Promise.all([
        getNoteTree(comment.content.split(" — This is a comment on:")[0]),
        countReplies(comment.id, all),
      ]);
      temp.push({
        ...comment,
        note_tree,
        count,
      });
    }
  }
  return temp;
};

const countReplies = async (id, all) => {
  let count = [];

  for (let comment of all) {
    let ev = comment.tags.find(
      (item) => item[3] === "reply" && item[0] === "e" && item[1] === id
      //   (item) => item[3] === "reply" && item[0] === "e" && item[1] === id
    );
    if (ev) {
      let cr = await countReplies(comment.id, all);
      count.push(comment, ...cr);
    }
  }
  let res = await Promise.all(
    count
      .sort((a, b) => b.created_at - a.created_at)
      .map(async (com) => {
        let note_tree = await getNoteTree(
          com.content.split(" — This is a comment on:")[0]
        );
        return {
          ...com,
          note_tree,
        };
      })
  );
  return res;
};

const getOnReply = (comments, comment_id) => {
  let tempCom = comments.find((item) => item.id === comment_id);
  return tempCom;
};

export default function NostrNote() {
  const {
    nostrUser,
    nostrKeys,
    isPublishing,
    setToPublish,
    setToast,
    mutedList,
  } = useContext(Context);
  const { nevent } = useParams();
  const navigateTo = useNavigate();
  const [note, setNote] = useState(false);
  const [importantFN, setImportantFN] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toLogin, setToLogin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [author, setAuthor] = useState("");
  const [usersList, setUsersList] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [reposts, setReposts] = useState([]);
  const [netCommentsCount, setNetCommentsCount] = useState(0);
  const [isRelatedEventLoaded, setIsRelatedEventLoaded] = useState(false);
  const [zapsCount, setZapsCount] = useState(0);
  const [zappers, setZappers] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [relatedEvent, setRelatedEvent] = useState(false);
  const [showQuoteBox, setShowQuoteBox] = useState(false);
  const optionsRef = useRef(null);

  const isVoted = useMemo(() => {
    return nostrKeys
      ? reactions.find((item) => item.pubkey === nostrKeys.pub)
      : false;
  }, [reactions, nostrKeys]);
  const isReposted = useMemo(() => {
    return nostrKeys
      ? reposts.find((item) => item.pubkey === nostrKeys.pub)
      : false;
  }, [reposts, nostrKeys]);
  const isQuoted = useMemo(() => {
    return nostrKeys
      ? quotes.find((item) => item.pubkey === nostrKeys.pub)
      : false;
  }, [quotes, nostrKeys]);

  const isMuted = useMemo(() => {
    let checkProfile = () => {
      if (!Array.isArray(mutedList)) return false;
      let index = mutedList.findIndex((item) => item === author?.pubkey);
      if (index === -1) {
        return false;
      }
      return { index };
    };
    return checkProfile();
  }, [mutedList, author]);

  useEffect(() => {
    try {
      const id = nip19.decode(nevent)?.data.id;
      const auth_pubkey = nip19.decode(nevent)?.data.author;

      setAuthor(getEmptyNostrUser(auth_pubkey));
      let sub = pool.subscribeMany(
        nostrUser
          ? filterRelays(nostrUser?.relays || [], relaysOnPlatform)
          : relaysOnPlatform,
        [
          { kinds: [0], authors: [auth_pubkey] },
          { kinds: [1], ids: [id] },

          {
            kinds: [6, 7],
            "#e": [id],
          },
          {
            kinds: [1],
            "#q": [id],
          },
          {
            kinds: [9735],
            "#p": [auth_pubkey],
            "#e": [id],
          },
        ],
        {
          async onevent(event) {
            if (event.kind === 9735) {
              let sats = decodeBolt11(getBolt11(event));
              let zapper = getZapper(event);
              setZappers((prev) => {
                return [...prev, zapper];
              });
              setZapsCount((prev) => prev + sats);
            }
            if (event.kind === 7) {
              setReactions((reactions) => [...reactions, event]);
            }
            if (event.kind === 6) {
              setReposts((reposts) => [...reposts, event]);
            }
            if (event.kind === 1) {
              let tempNote = await onEvent(event);
              if (event.id !== id) {
                setQuotes((quotes) => [...quotes, event]);
              } else {
                setNote(tempNote);
                if (tempNote.checkForQuote) {
                  getRelatedEvent(tempNote.checkForQuote);
                }
                setIsLoaded(true);
              }
            }
            if (event.kind === 0) {
              setAuthor(JSON.parse(event.content));
            }
          },
        }
      );
    } catch (err) {
      console.log(err);
      setIsLoaded(true);
    }
  }, [nevent]);

  useEffect(() => {
    const handleOffClick = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target))
        setShowOptions(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [optionsRef]);

  // useEffect(() => {
  //   if (note) {
  //     let auth = getNostrAuthor(note.pubkey);

  //     if (auth) setAuthor(auth);
  //   }
  // }, [note, nostrAuthors]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoaded(false);
        const [important] = await Promise.all([
          axios.get(API_BASE_URL + "/api/v1/mb/flashnews/important"),
        ]);

        setImportantFN(important.data);

        // setIsLoaded(true);
      } catch (err) {
        // setIsLoaded(true)
        console.log(err);
      }
    };
    fetchData();
  }, [nevent]);

  const getRelatedEvent = (id) => {
    let pool_ = new SimplePool();
    let sub = pool_.subscribeMany(
      nostrUser
        ? filterRelays(nostrUser?.relays || [], relaysOnPlatform)
        : relaysOnPlatform,
      [{ kinds: [1], ids: [id] }],
      {
        async onevent(event) {
          let tempNote = await onEvent(event);
          setRelatedEvent(tempNote);
          setIsRelatedEventLoaded(true);
        },
        oneose() {
          setIsRelatedEventLoaded(true);
        },
      }
    );
  };

  const reactToNote = async (e) => {
    e.stopPropagation();
    if (isLoading) return;
    if (isPublishing) {
      setToast({
        type: 3,
        desc: "An event publishing is in process!",
      });
      return;
    }
    try {
      if (!nostrKeys) {
        setToLogin(true);
        return false;
      }
      if (isVoted) {
        setIsLoading(true);
        setToPublish({
          nostrKeys: nostrKeys,
          kind: 5,
          content: "This reaction will be deleted!",
          tags: [["e", isVoted.id]],
          allRelays: nostrUser
            ? [
                ...filterRelays(relaysOnPlatform, nostrUser?.relays || []),
                "wss://nostr.wine",
              ]
            : [...relaysOnPlatform, "wss://nostr.wine"],
        });

        setIsLoading(false);

        let tempArray = Array.from(reactions);
        let index = tempArray.findIndex((item) => item.id === isVoted.id);
        tempArray.splice(index, 1);
        setReactions(tempArray);
        return false;
      }

      setIsLoading(true);
      setToPublish({
        nostrKeys: nostrKeys,
        kind: 7,
        content: "+",
        tags: [
          ["e", note.id],
          ["p", note.pubkey],
        ],
        allRelays: nostrUser
          ? [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])]
          : relaysOnPlatform,
      });

      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };
  const repostNote = async (e) => {
    e.stopPropagation();
    if (isLoading) return;
    if (isPublishing) {
      setToast({
        type: 3,
        desc: "An event publishing is in process!",
      });
      return;
    }
    try {
      if (!nostrKeys) {
        setToLogin(true);
        return false;
      }
      if (isReposted) {
        setIsLoading(true);
        setToPublish({
          nostrKeys: nostrKeys,
          kind: 5,
          content: "This repost will be deleted!",
          tags: [["e", isReposted.id]],
          allRelays: nostrUser
            ? [
                ...filterRelays(relaysOnPlatform, nostrUser?.relays || []),
                "wss://nostr.wine",
              ]
            : [...relaysOnPlatform, "wss://nostr.wine"],
        });

        setIsLoading(false);

        let tempArray = Array.from(reposts);
        let index = tempArray.findIndex((item) => item.id === isVoted.id);
        tempArray.splice(index, 1);
        setReposts(tempArray);
        return false;
      }

      setIsLoading(true);
      setToPublish({
        nostrKeys: nostrKeys,
        kind: 6,
        content: note.stringifiedEvent,
        tags: [
          ["e", note.id],
          ["p", note.pubkey],
        ],
        allRelays: nostrUser
          ? [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])]
          : relaysOnPlatform,
      });

      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  const onEvent = async (event) => {
    try {
      //   let checkForComment = event.tags.find((tag) => tag[0] === "e");
      let checkForQuote = event.tags.find((tag) => tag[0] === "q");
      let checkForLabel = event.tags.find((tag) => tag[0] === "l");
      if (
        checkForLabel &&
        ["UNCENSORED NOTE", "FLASH NEWS"].includes(checkForLabel[1])
      )
        return false;

      //   if (checkForComment && event.kind === 1) return false;
      let nEvent = nip19.neventEncode({
        id: event.id,
        author: event.pubkey,
      });
      let stringifiedEvent = JSON.stringify(event);
      if (event.kind === 1) {
        let note_tree = await getNoteTree(event.content);
        return {
          ...event,
          note_tree,
          stringifiedEvent,
          checkForQuote:
            checkForQuote && !event.content.includes("nostr:nevent")
              ? checkForQuote[1]
              : "",
          nEvent,
        };
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const muteUnmute = async () => {
    try {
      if (!Array.isArray(mutedList)) return;
      if (isPublishing) {
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        });
        return;
      }

      let tempTags = Array.from(mutedList.map((pubkey) => ["p", pubkey]));
      if (isMuted) {
        tempTags.splice(isMuted.index, 1);
      } else {
        tempTags.push(["p", author.pubkey]);
      }

      setToPublish({
        nostrKeys: nostrKeys,
        kind: 10000,
        content: "",
        tags: tempTags,
        allRelays: [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
      });
    } catch (err) {
      console.log(err);
    }
  };

  const copyID = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(nevent);
    setToast({
      type: 1,
      desc: `Note ID was copied! 👏`,
    });
  };

  if (!isLoaded) return <LoadingScreen />;
  if (!note) return navigateTo("/notes");
  return (
    <>
      {toLogin && <LoginNOSTR exit={() => setToLogin(false)} />}{" "}
      {usersList && (
        <ShowUsersList
          exit={() => setUsersList(false)}
          title={usersList.title}
          list={usersList.list}
          extras={usersList.extras}
        />
      )}
      {showQuoteBox && (
        <QuoteNote note={note} exit={() => setShowQuoteBox(false)} />
      )}
      <div>
        <Helmet>
          <title>Yakihonne | {author.display_name || author.name}</title>
          <meta name="description" content={note.content} />
          <meta property="og:description" content={note.content} />
          <meta
            property="og:image"
            content={API_BASE_URL + "/event/" + note.nEvent + ".png"}
          />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="700" />
          <meta
            property="og:url"
            content={`https://yakihonne.com/notes/${note.nEvent}`}
          />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta
            property="og:title"
            content={author.display_name || author.name}
          />
          <meta
            property="twitter:title"
            content={author.display_name || author.name}
          />
          <meta property="twitter:description" content={note.content} />
          <meta
            property="twitter:image"
            content={API_BASE_URL + "/event/" + note.nEvent + ".png"}
          />
        </Helmet>
        <div className="fit-container fx-centered">
          <div className="main-container">
            <SidebarNOSTR />
            <main className="main-page-nostr-container">
              <ArrowUp />
              {/* <NavbarNOSTR /> */}
              <div className="fx-centered fit-container fx-start-h fx-start-v">
                <div style={{ flex: 1.5 }} className="box-pad-h-m">
                  <div
                    className="fit-container fx-centered fx-col fx-start-v box-pad-v"
                    style={{ paddingBottom: "3rem" }}
                    // onClick={(e) => {
                    //   e.stopPropagation();
                    //   navigateTo(`/notes/${note.nEvent}`);
                    // }}
                  >
                    <div className="fx-centered fit-container fx-start-h">
                      <UserProfilePicNOSTR
                        img={author.picture}
                        size={64}
                        mainAccountUser={false}
                        user_id={note.pubkey}
                        ring={false}
                      />
                      <div className="box-pad-h-m fx-centered fx-col fx-start-v">
                        <h4>By {author.name}</h4>
                        <p className="gray-c">
                          <Date_
                            toConvert={new Date(
                              note.created_at * 1000
                            ).toString()}
                            time={true}
                          />
                        </p>
                      </div>
                    </div>

                    <div className="fit-container">{note.note_tree}</div>
                    {relatedEvent && (
                      <KindOne reactions={false} event={relatedEvent} />
                    )}
                    {note.checkForQuote &&
                      !isRelatedEventLoaded &&
                      !relatedEvent && (
                        <div
                          style={{ backgroundColor: "var(--c1-side)" }}
                          className="fit-container box-pad-h box-pad-v sc-s-18 fx-centered"
                        >
                          <p className="p-medium gray-c">Loading quoted note</p>
                          <LoadingDots />
                        </div>
                      )}

                    {note.checkForQuote &&
                      isRelatedEventLoaded &&
                      !relatedEvent && (
                        <div
                          style={{ backgroundColor: "var(--c1-side)" }}
                          className="fit-container box-pad-h-m box-pad-v-m sc-s-18 fx-centered"
                        >
                          <p className="p-medium orange-c p-italic">
                            The quoted note does not seem to be found
                          </p>
                        </div>
                      )}
                    <div className="fit-container fx-scattered box-pad-v-s">
                      <div
                        className="fx-centered"
                        style={{ columnGap: "20px" }}
                      >
                        <div
                          className={`fx-centered pointer ${
                            isLoading ? "flash" : ""
                          }`}
                          style={{ columnGap: "8px" }}
                        >
                          <div
                            className="comment-24"
                            // data-tooltip="Comments"
                          ></div>
                          <div>
                            <NumberShrink value={netCommentsCount} />
                          </div>
                        </div>
                        <div
                          className={`fx-centered pointer ${
                            isLoading ? "flash" : ""
                          }`}
                          style={{ columnGap: "8px" }}
                        >
                          <div
                            className={"icon-tooltip"}
                            data-tooltip="React"
                            onClick={reactToNote}
                          >
                            <div
                              className={isVoted ? "heart-bold-24" : "heart-24"}
                            ></div>
                          </div>
                          <div
                            className={`icon-tooltip ${
                              isVoted ? "orange-c" : ""
                            }`}
                            data-tooltip="Reactions from"
                            onClick={(e) => {
                              e.stopPropagation();
                              reactions.length > 0 &&
                                setUsersList({
                                  title: "Reactions from",
                                  list: reactions.map((item) => item.pubkey),
                                  extras: [],
                                });
                            }}
                          >
                            <NumberShrink value={reactions.length} />
                          </div>
                        </div>
                        <div
                          className={`fx-centered pointer ${
                            isLoading ? "flash" : ""
                          }`}
                          style={{ columnGap: "8px" }}
                        >
                          <div
                            className={"icon-tooltip"}
                            data-tooltip="Repost note"
                            onClick={repostNote}
                          >
                            <div
                              className={
                                isReposted
                                  ? "switch-arrows-bold-24"
                                  : "switch-arrows-24"
                              }
                            ></div>
                          </div>
                          <div
                            className={`icon-tooltip ${
                              isReposted ? "orange-c" : ""
                            }`}
                            data-tooltip="Reposts from"
                            onClick={(e) => {
                              e.stopPropagation();
                              reposts.length > 0 &&
                                setUsersList({
                                  title: "Reposts from",
                                  list: reposts.map((item) => item.pubkey),
                                  extras: [],
                                });
                            }}
                          >
                            <NumberShrink value={reposts.length} />
                          </div>
                        </div>
                        <div
                          className={`fx-centered pointer ${
                            isLoading ? "flash" : ""
                          }`}
                          style={{ columnGap: "8px" }}
                        >
                          <div
                            className={"icon-tooltip"}
                            data-tooltip="Quote note"
                            onClick={() => setShowQuoteBox(!showQuoteBox)}
                          >
                            <div
                              className={
                                isQuoted ? "quote-bold-24" : "quote-24"
                              }
                            ></div>
                          </div>
                          <div
                            className={`icon-tooltip ${
                              isQuoted ? "orange-c" : ""
                            }`}
                            data-tooltip="Quoters"
                            onClick={(e) => {
                              e.stopPropagation();
                              quotes.length > 0 &&
                                setUsersList({
                                  title: "Quoters",
                                  list: quotes.map((item) => item.pubkey),
                                  extras: [],
                                });
                            }}
                          >
                            <NumberShrink value={quotes.length} />
                          </div>
                        </div>
                        <div
                          className="fx-centered"
                          style={{ columnGap: "8px" }}
                        >
                          <div className="icon-tooltip" data-tooltip="Tip note">
                            <ZapTip
                              recipientLNURL={checkForLUDS(
                                author.lud06,
                                author.lud16
                              )}
                              recipientPubkey={note.pubkey}
                              senderPubkey={nostrUser.pubkey}
                              recipientInfo={{
                                name: author.name,
                                picture: author.picture,
                              }}
                              eTag={note.id}
                              forContent={note.content.substring(0, 40)}
                              onlyIcon={true}
                            />
                          </div>
                          <div
                            data-tooltip="See zappers"
                            className="icon-tooltip pointer"
                            onClick={() =>
                              zapsCount &&
                              setUsersList({
                                title: "Zappers",
                                list: zappers.map((item) => item.pubkey),
                                extras: zappers,
                              })
                            }
                          >
                            <NumberShrink value={zapsCount} />
                          </div>
                        </div>
                        {/* <div
                        className={`fx-centered pointer ${
                          isLoading ? "flash" : ""
                        }`}
                        style={{ columnGap: "8px" }}
                      >
                        <div
                          className="icon-tooltip"
                          data-tooltip="Downvote"
                          onClick={downvoteNews}
                        >
                          <div
                            className={
                              isVoted?.content === "-"
                                ? "arrow-up-bold"
                                : "arrow-up"
                            }
                            style={{
                              transform: "rotate(180deg)",
                              opacity: isVoted ? ".2" : 1,
                            }}
                          ></div>
                        </div>
                        <div
                          className="icon-tooltip"
                          data-tooltip="Downvoters"
                          onClick={(e) => {
                            e.stopPropagation();
                            downvoteReaction.length > 0 &&
                              setUsersList({
                                title: "Downvoters",
                                list: downvoteReaction.map(
                                  (item) => item.pubkey
                                ),
                                extras: [],
                              });
                          }}
                        >
                          <NumberShrink value={downvoteReaction.length} />
                        </div>
                      </div> */}
                        {/* <p>|</p>
                      <ShareLink
                        path={`/notes/${note.nEvent}`}
                        title={author.display_name || author.name}
                        description={note.content}
                        kind={1}
                        shareImgData={{
                          post: note,
                          author,
                          label: "Note",
                        }}
                      /> */}
                      </div>
                      {/* <div className="fx-centered">
                      <div
                        className="round-icon round-icon-tooltip"
                        data-tooltip="Bookmark note"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SaveArticleAsBookmark
                          pubkey={note.id}
                          itemType="e"
                          kind="1"
                        />
                      </div>
                    </div> */}
                      <div style={{ position: "relative" }} ref={optionsRef}>
                        <div
                          className="round-icon-small round-icon-tooltip"
                          style={{ border: "none" }}
                          data-tooltip="Options"
                          onClick={() => {
                            setShowOptions(!showOptions);
                          }}
                        >
                          <div
                            className="fx-centered fx-col"
                            style={{ rowGap: 0 }}
                          >
                            <p
                              className="gray-c fx-centered"
                              style={{ height: "6px" }}
                            >
                              &#x2022;
                            </p>
                            <p
                              className="gray-c fx-centered"
                              style={{ height: "6px" }}
                            >
                              &#x2022;
                            </p>
                            <p
                              className="gray-c fx-centered"
                              style={{ height: "6px" }}
                            >
                              &#x2022;
                            </p>
                          </div>
                        </div>
                        {showOptions && (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "110%",
                              backgroundColor: "var(--dim-gray)",
                              border: "none",
                              // transform: "translateY(100%)",
                              minWidth: "200px",
                              width: "max-content",
                              zIndex: 1000,
                              rowGap: "12px",
                            }}
                            className="box-pad-h box-pad-v-m sc-s-18 fx-centered fx-col fx-start-v"
                          >
                            <div onClick={copyID} className="pointer">
                              <p>Copy note ID</p>
                            </div>
                            {nostrKeys && nostrKeys.pub !== note.pubkey && (
                              <>
                                <SaveArticleAsBookmark
                                  label="Bookmark note"
                                  pubkey={note.id}
                                  kind={"1"}
                                  itemType="e"
                                />
                              </>
                            )}
                            <div className="fit-container fx-centered fx-start-h pointer">
                              <ShareLink
                                label="Share note"
                                path={`/notes/${note.nEvent}`}
                                title={author.display_name || author.name}
                                description={note.content}
                                kind={1}
                                shareImgData={{
                                  post: note,
                                  author,
                                  label: "Note",
                                }}
                              />
                            </div>
                            <div onClick={muteUnmute} className="pointer">
                              {isMuted ? (
                                <p className="red-c">Unmute user</p>
                              ) : (
                                <p className="red-c">Mute user</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <CommentsSection
                      id={note.id}
                      nEvent={nevent}
                      setNetCommentsCount={setNetCommentsCount}
                    />
                  </div>
                </div>
                <div
                  className=" fx-centered fx-col fx-start-v extras-homepage"
                  style={{
                    position: "sticky",
                    top: 0,
                    // backgroundColor: "var(--white)",
                    zIndex: "100",
                    flex: 1,
                  }}
                >
                  <div className="sticky fit-container">
                    <SearchbarNOSTR />
                  </div>
                  <div
                    className=" fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v box-marg-s"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      rowGap: "24px",
                      border: "none",
                    }}
                  >
                    <h4>Important Flash News</h4>
                    <HomeFN flashnews={importantFN} />
                  </div>
                  <Footer />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

const CommentsSection = ({ id, nEvent, setNetCommentsCount }) => {
  const [comments, setComments] = useState([]);

  const {
    nostrUser,
    nostrKeys,
    addNostrAuthors,
    setToPublish,
    isPublishing,
    setToast,
  } = useContext(Context);
  //   const [mainComments, setMainComments] = useState([]);
  const [toLogin, setToLogin] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [selectedComment, setSelectedComment] = useState(false);
  const [selectedCommentIndex, setSelectedCommentIndex] = useState(false);
  const [showCommentsSuffixOption, setShowCommentsSuffixOption] =
    useState(false);
  const [netComments, setNetComments] = useState([]);
  // const netComments = useMemo(() => {
  //   return filterRootComments(comments);
  // }, [comments]);
  useEffect(() => {
    if (selectedComment) {
      let sC = netComments.find((item) => item.id === selectedComment.id);
      setSelectedComment(sC);
    }
    setNetCommentsCount(
      netComments.map((cm) => cm.count).flat().length + netComments.length
    );
  }, [netComments]);

  useEffect(() => {
    let parsedCom = async () => {
      let res = await filterRootComments(comments);
      setNetComments(res);
    };
    parsedCom();
  }, [comments]);

  //   useEffect(() => {
  //     // setMainComments(comments);
  //     addNostrAuthors(comments.map((item) => item.pubkey));
  //   }, [comments]);

  const postNewComment = async (suffix) => {
    try {
      if (!nostrKeys || !newComment) {
        return;
      }
      if (isPublishing) {
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        });
        return;
      }
      setIsLoading(true);
      let tempComment = newComment;
      // let tempComment = suffix
      //   ? `${newComment} — This is a comment on: https://yakihonne.com/notes/${nEvent}`
      //   : newComment;
      setToPublish({
        nostrKeys: nostrKeys,
        kind: 1,
        content: tempComment,
        tags: [["e", id, "", "root"]],
        allRelays: nostrUser
          ? [...filterRelays(relaysOnPlatform, nostrUser.relays)]
          : relaysOnPlatform,
      });
      // let temPublishingState = await publishPost(
      //   nostrKeys,
      //   1,
      //   tempComment,
      //   [["a", aTag, "", "root"]],
      //   nostrUser
      //     ? [...filterRelays(relaysOnPlatform, nostrUser.relays)]
      //     : relaysOnPlatform
      // );
      setIsLoading(false);
      setNewComment("");
    } catch (err) {
      console.log(err);
    }
  };

  const refreshRepleis = (index) => {
    let tempArray_1 = Array.from(comments);
    let tempArray_2 = Array.from(netComments[selectedCommentIndex].count);
    let idToDelete = tempArray_2[index].id;
    let indexToDelete = tempArray_1.findIndex((item) => item.id === idToDelete);
    tempArray_1.splice(indexToDelete, 1);
    setComments(tempArray_1);
  };

  useEffect(() => {
    let tempComment = [];
    const sub = pool.subscribeMany(
      nostrUser
        ? filterRelays(nostrUser?.relays || [], relaysOnPlatform)
        : relaysOnPlatform,
      [
        {
          kinds: [1],
          "#e": [id],
        },
      ],
      {
        onevent(event) {
          let is_un = event.tags.find((tag) => tag[0] === "l");
          if (!(is_un && is_un[1] === "UNCENSORED NOTE")) {
            tempComment.push(event);
            setComments((prev) => {
              let newCom = [...prev, event];
              return newCom.sort(
                (item_1, item_2) => item_2.created_at - item_1.created_at
              );
            });
          }
        },
        oneose() {
          addNostrAuthors(tempComment.map((item) => item.pubkey));
        },
      }
    );
  }, []);

  const refreshComments = (index) => {
    let tempArray = Array.from(comments);
    tempArray.splice(index, 1);
    setComments(tempArray);
  };
  return (
    <div className="fit-container fx-centered fx-col box-pad-v-m">
      {showCommentsSuffixOption && (
        <AddSuffixToComment
          post={postNewComment}
          comment={newComment}
          exit={() => setShowCommentsSuffixOption(false)}
          nEvent={nEvent}
        />
      )}
      {/* {netComments.length > 0 && (
        <div className="fit-container">
          <h4>
            {
              <NumberShrink
                value={
                  netComments.map((item) => item.count).flat().length +
                  netComments.length
                }
              />
            }{" "}
            Comment(s)
          </h4>
        </div>
      )} */}
      {toLogin && <LoginNOSTR exit={() => setToLogin(false)} />}{" "}
      <div className="fit-container fx-centered fx-col fx-start-h fx-start-v">
        {nostrKeys && (
          <div className="fit-container fx-end-v fx-centered">
            <UserProfilePicNOSTR
              ring={false}
              mainAccountUser={true}
              size={54}
            />
            <input
              className="if ifs-full"
              placeholder="Post a comment.."
              value={newComment}
              type="text"
              onChange={(e) => setNewComment(e.target.value)}
            />
            {/* <textarea
              className="txt-area ifs-full"
              placeholder="Comment on..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            /> */}
            <button
              className="btn btn-normal fx-centered"
              onClick={() => newComment && setShowCommentsSuffixOption(true)}
            >
              {isLoading && <LoadingDots />}
              {!isLoading && (
                <>
                  {/* {" "}
                  Comment as{" "}
                  <UserProfilePicNOSTR img={nostrUser.picture} size={28} />{" "}
                  {nostrUser.name}{" "} */}
                  Post
                </>
              )}
            </button>
          </div>
        )}
        {netComments.length == 0 && (
          <div
            className="fit-container fx-centered fx-col"
            style={{ height: "20vh" }}
          >
            <h4>No comments</h4>
            <p className="p-centered gray-c">Nobody commented on this note</p>
            <div className="comment-24"></div>
          </div>
        )}
        {!nostrKeys && (
          <div className="fit-container fx-centered">
            <button
              className="btn btn-normal fx-centered"
              onClick={() => setToLogin(true)}
            >
              Login to comment
            </button>
          </div>
        )}
        {netComments.length > 0 && (
          <div className="fit-container fx-centered fx-start-h box-pad-v-m">
            <h4>
              {netComments.map((item) => item.count).flat().length +
                netComments.length}{" "}
              Comment(s)
            </h4>
          </div>
        )}

        {netComments.map((comment, index) => {
          return (
            <Comment
              comment={comment}
              key={comment.id}
              refresh={refreshComments}
              refreshRepleis={refreshRepleis}
              index={index}
              onClick={() => {
                setShowReplies(true);
                setSelectedComment(comment);
                setSelectedCommentIndex(index);
              }}
              nEvent={nEvent}
              noteID={id}
            />
          );
        })}
      </div>
    </div>
  );
};

const AddSuffixToComment = ({ exit, post, comment = "", nEvent }) => {
  const isSaved = checkForSavedCommentOptions();
  const [isSave, setIsSave] = useState(true);

  const saveOption = () => {
    localStorage.setItem(
      "comment-with-suffix",
      JSON.stringify({ keep_suffix: isSave })
    );
  };

  if (isSaved !== -1) {
    post(isSaved);
    exit();
    return;
  }
  if (isSaved === -1)
    return (
      <div
        className="fixed-container fx-centered box-pad-h"
        style={{ zIndex: "10000" }}
      >
        <section
          className="sc-s box-pad-h box-pad-v"
          style={{ width: "min(100%, 500px)" }}
        >
          <h4 className="p-centered">Be meaningful 🥳</h4>
          <p className="p-centered box-pad-v-m">
            Let your comments be recognized on NOSTR notes clients by adding
            where did you comment. <br />
            Choose what suits you best!
          </p>

          <div className="fit-container fx-centered fx-col">
            <label
              className="sc-s-18 fit-container fx-centered box-pad-h-m box-pad-v-m fx-start-h fx-start-v"
              htmlFor="suffix"
              style={{
                opacity: !isSave ? ".6" : 1,
                filter: !isSave ? "grayscale(100%)" : "none",
              }}
            >
              <input
                type="radio"
                id="suffix"
                name="suffix"
                checked={isSave}
                value={isSave}
                onChange={() => setIsSave(true)}
              />
              <div>
                <p className="gray-c p-small">Your comment with suffix</p>
                <p className="p-two-lines p-medium">{comment}</p>
                <p className="p-medium orange-c">
                  — This is a comment on: https://yakihonne.com/notes/
                  {nEvent}
                </p>
              </div>
            </label>
            <label
              className="sc-s-18 fit-container fx-centered box-pad-h-m box-pad-v-m fx-start-v fx-start-h"
              htmlFor="no-suffix"
              style={{
                opacity: isSave ? ".6" : 1,
                filter: isSave ? "grayscale(100%)" : "none",
              }}
            >
              <input
                type="radio"
                id="no-suffix"
                name="suffix"
                checked={!isSave}
                value={isSave}
                onChange={() => setIsSave(false)}
              />
              <div>
                <p className="gray-c p-small">Your comment without suffix</p>
                <p className="p-two-lines p-medium">{comment}</p>
              </div>
            </label>
            <div>
              <p className="p-medium gray-c box-pad-v-s">
                {" "}
                This can always be changed in your account settings
              </p>
            </div>
            <div className="fit-container fx-centered fx-col">
              <button
                className="btn btn-normal btn-full"
                onClick={() => {
                  saveOption();
                  post(isSave);
                  exit();
                }}
              >
                Post &amp; remember my choice
              </button>
              <button
                className="btn btn-text"
                onClick={exit}
                style={{ height: "max-content" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      </div>
    );
};

const Comment = ({ comment, action = true, noteID }) => {
  return (
    <>
      <NotesComment event={comment} rootNoteID={noteID} />
      {action && (
        <div className="fit-container fx-centered fx-end-h">
          <CommentsReplies all={comment.count} noteID={noteID} />
        </div>
      )}
    </>
  );
};
// const Comment = ({
//   comment,
//   refresh,
//   refreshRepleis,
//   index,
//   onClick,
//   action = true,
//   nEvent,
//   noteID,
// }) => {
//   const { nostrUser, nostrKeys, setToPublish, isPublishing, setToast } =
//     useContext(Context);
//   const [isLoading, setIsLoading] = useState(false);
//   const [confirmationPrompt, setConfirmationPrompt] = useState(false);
//   const [toggleReply, setToggleReply] = useState(false);

//   const handleCommentDeletion = async () => {
//     try {
//       if (isPublishing) {
//         setToast({
//           type: 3,
//           desc: "An event publishing is in process!",
//         });
//         return;
//       }
//       setIsLoading(true);
//       let relaysToPublish = filterRelays(
//         nostrUser?.relays || [],
//         relaysOnPlatform
//       );
//       let created_at = Math.floor(Date.now() / 1000);
//       let tags = [["e", comment.id]];

//       let event = {
//         kind: 5,
//         content: "This comment will be deleted!",
//         created_at,
//         tags,
//       };
//       if (nostrKeys.ext) {
//         try {
//           event = await window.nostr.signEvent(event);
//           refresh(index);
//           setIsLoading(false);
//         } catch (err) {
//           setIsLoading(false);
//           console.log(err);
//           return false;
//         }
//       } else {
//         event = finalizeEvent(event, nostrKeys.sec);
//       }
//       setToPublish({
//         eventInitEx: event,
//         allRelays: relaysToPublish,
//       });
//       // setToPublish({
//       //   nostrKeys: nostrKeys,
//       //   kind: 5,
//       //   content: "This comment will be deleted!",
//       //   tags: [["e", comment.id]],
//       //   allRelays: nostrUser
//       //     ? [...filterRelays(relaysOnPlatform, nostrUser.relays)]
//       //     : relaysOnPlatform,
//       // });
//       refresh(index);
//       setIsLoading(false);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   return (
//     <>
//       {confirmationPrompt && (
//         <ToDeleteComment
//           comment={comment}
//           exit={(e) => {
//             e.stopPropagation();
//             setConfirmationPrompt(false);
//           }}
//           handleCommentDeletion={(e) => {
//             e.stopPropagation();
//             setConfirmationPrompt(false);
//             handleCommentDeletion();
//           }}
//         />
//       )}

//       <div
//         className={`fit-container box-pad-h box-pad-v sc-s-18 fx-centered fx-col fx-shrink  ${
//           isLoading ? "flash" : ""
//         }`}
//         style={{
//           backgroundColor: "var(--very-dim-gray)",
//           border: "none",
//           pointerEvents: isLoading ? "none" : "auto",
//         }}
//       >
//         <div className="fit-container fx-scattered fx-start-v">
//           <div className="fx-centered" style={{ columnGap: "16px" }}>
//             <AuthorPreview
//               author={{
//                 author_img: "",
//                 author_name: comment.pubkey.substring(0, 20),
//                 author_pubkey: comment.pubkey,
//                 on: new Date(comment.created_at * 1000).toISOString(),
//               }}
//             />
//           </div>
//           {comment.pubkey === nostrKeys.pub && action && (
//             <div
//               className="fx-centered pointer"
//               style={{ columnGap: "3px" }}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setConfirmationPrompt(true);
//               }}
//             >
//               <div className="trash-24"></div>
//             </div>
//           )}
//         </div>
//         <div
//           className="fx-centered fx-start-h fit-container"
//           style={{ columnGap: "16px" }}
//         >
//           <div style={{ minWidth: "24px" }}></div>
//           {/* <div
//             className="fx-centered fx-start-h fx-wrap fit-container"
//             style={{ rowGap: 0, columnGap: "4px" }}
//           > */}
//           <div>{comment.note_tree}</div>
//           {/* <div
//             className="fx-centered fx-start-h fx-wrap"
//             style={{ rowGap: 0, columnGap: "4px" }}
//           >
//             {getNoteTree(comment.content.split(" — This is a comment on:")[0])}
//           </div> */}
//           {/* <p>{comment.content.split(" — This is a comment on:")[0]}</p> */}
//         </div>

//         {action && (
//           <div
//             className="fx-centered fx-start-h fit-container"
//             style={{ columnGap: "16px" }}
//           >
//             <div className="fx-centered">
//               <div style={{ minWidth: "24px" }}></div>
//               <div className="fx-centered">
//                 <div className="comment-icon"></div>
//                 <p className="p-medium ">
//                   {comment.count.length}{" "}
//                   <span className="gray-c">Reply(ies)</span>{" "}
//                 </p>
//               </div>
//             </div>
//             <div onClick={() => setToggleReply(true)}>
//               <p className="gray-c p-medium pointer btn-text">Reply</p>
//             </div>
//           </div>
//         )}
//       </div>
//       {action && (
//         <div className="fit-container fx-centered fx-end-h">
//           <CommentsReplies
//             refresh={refreshRepleis}
//             comment={comment}
//             all={comment.count}
//             nEvent={nEvent}
//             noteID={noteID}
//             toggleReply={toggleReply}
//             setToggleReply={setToggleReply}
//           />
//         </div>
//       )}
//     </>
//   );
// };

const CommentsReplies = ({ all, noteID }) => {
  return (
    <>
      <div
        className="fx-col fit-container fx-centered"
        style={{
          width: "calc(100% - 64px)",
        }}
      >
        {all.map((comment, index) => {
          return (
            <Reply
              comment={{ ...comment, count: [] }}
              index={index}
              all={all || []}
              noteID={noteID}
            />
          );
        })}
      </div>
    </>
  );
};
// const CommentsReplies = ({
//   comment,
//   exit,
//   all,
//   nEvent,
//   refresh,
//   noteID,
//   toggleReply,
//   setToggleReply,
// }) => {
//   const { nostrUser, nostrKeys, setToPublish, isPublishing, setToast } =
//     useContext(Context);
//   const [login, setLogin] = useState(false);
//   const [newComment, setNewComment] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [selectReplyTo, setSelectReplyTo] = useState(false);
//   const [showCommentsSuffixOption, setShowCommentsSuffixOption] =
//     useState(false);
//   const ref = useRef(null);

//   useEffect(() => {
//     if (toggleReply) {
//       // ref.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [toggleReply]);
//   const postNewComment = async (suffix) => {
//     try {
//       if (!nostrKeys || !newComment) {
//         return;
//       }
//       if (isPublishing) {
//         setToast({
//           type: 3,
//           desc: "An event publishing is in process!",
//         });
//         return;
//       }
//       setIsLoading(true);

//       let tempComment = suffix
//         ? `${newComment} — This is a comment on: https://yakihonne.com/notes/${nEvent}`
//         : newComment;
//       let tags = [["e", noteID, "", "root"]];
//       if (selectReplyTo) tags.push(["e", selectReplyTo.id, "", "reply"]);
//       if (!selectReplyTo) tags.push(["e", comment.id, "", "reply"]);

//       setToPublish({
//         nostrKeys: nostrKeys,
//         kind: 1,
//         content: tempComment,
//         tags,
//         allRelays: nostrUser
//           ? [...filterRelays(relaysOnPlatform, nostrUser.relays)]
//           : relaysOnPlatform,
//       });
//       setIsLoading(false);
//       setNewComment("");
//       //   setSelectReplyTo(false);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   return (
//     <>
//       {toggleReply && nostrKeys && (
//         <div className="fixed-container fx-centered box-pad-h" ref={ref}>
//           <div
//             className="fx-centered fx-wrap"
//             style={{ width: "min(100%, 600px)" }}
//           >
//             {/* {selectReplyTo && (
//               <div
//                 className="fx-scattered fit-container sc-s-18 box-pad-h-m box-pad-v-s"
//                 style={{
//                   backgroundColor: "var(--black)",
//                   border: "none",
//                   borderBottomRightRadius: 0,
//                   borderBottomLeftRadius: 0,
//                 }}
//               >
//                 <p className="white-c p-medium">
//                   Reply to: {selectReplyTo.content.split(" — This is a comment on:")[0].substring(0, 100)}...
//                 </p>
//               </div>
//             )} */}
//             {!selectReplyTo && (
//               <div
//                 className="fit-container box-pad-h box-pad-v sc-s-18 fx-centered fx-col fx-shrink"
//                 style={{
//                   backgroundColor: "var(--very-dim-gray)",
//                   border: "none",
//                   pointerEvents: isLoading ? "none" : "auto",
//                 }}
//               >
//                 <div className="fit-container fx-scattered fx-start-v">
//                   <div className="fx-centered" style={{ columnGap: "16px" }}>
//                     <AuthorPreview
//                       author={{
//                         author_img: "",
//                         author_name: comment.pubkey.substring(0, 20),
//                         author_pubkey: comment.pubkey,
//                         on: new Date(comment.created_at * 1000).toISOString(),
//                       }}
//                     />
//                   </div>
//                 </div>
//                 <div
//                   className="fx-centered fx-start-h fit-container"
//                   style={{ columnGap: "16px" }}
//                 >
//                   <div style={{ minWidth: "24px" }}></div>
//                   {/* <div
//                     className="fx-centered fx-start-h fx-wrap fit-container"
//                     style={{ rowGap: 0, columnGap: "4px" }}
//                   > */}
//                   <div className="fit-container">
//                     {comment.note_tree}
//                     {/* {getNoteTree(
//                       comment.content.split(" — This is a comment on:")[0]
//                     )} */}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {selectReplyTo && (
//               <div
//                 className="fit-container box-pad-h box-pad-v sc-s-18 fx-centered fx-col fx-shrink"
//                 style={{
//                   backgroundColor: "var(--c1-side)",
//                   border: "none",
//                 }}
//               >
//                 <div className="fit-container fx-scattered fx-start-v">
//                   <div className="fx-centered" style={{ columnGap: "16px" }}>
//                     <AuthorPreview
//                       author={{
//                         author_img: "",
//                         author_name: selectReplyTo.pubkey.substring(0, 20),
//                         author_pubkey: selectReplyTo.pubkey,
//                         on: new Date(
//                           selectReplyTo.created_at * 1000
//                         ).toISOString(),
//                       }}
//                     />
//                   </div>
//                 </div>
//                 <div
//                   className="fx-centered fx-start-h fit-container"
//                   style={{ columnGap: "16px" }}
//                 >
//                   <div style={{ minWidth: "24px" }}></div>
//                   {/* <div
//                     className="fx-centered fx-start-h fx-wrap fit-container"
//                     style={{ rowGap: 0, columnGap: "4px" }}
//                   > */}
//                   <div className="fit-container">
//                     {comment.note_tree}
//                     {/* {getNoteTree(
//                       selectReplyTo.content.split(" — This is a comment on:")[0]
//                     )} */}
//                   </div>
//                 </div>
//               </div>
//             )}
//             <textarea
//               className="txt-area ifs-full"
//               placeholder={
//                 selectReplyTo ? "Reply to reply..." : "Reply to comment.."
//               }
//               value={newComment}
//               onChange={(e) => setNewComment(e.target.value)}
//             />
//             <div className="fx-centered fit-container fx-end-h">
//               <button
//                 className="btn btn-normal  fx-centered"
//                 onClick={() => newComment && setShowCommentsSuffixOption(true)}
//               >
//                 {isLoading && <LoadingDots />}
//                 {!isLoading && <>Post a comment</>}
//               </button>
//               <button
//                 className="btn btn-gst-red"
//                 onClick={() => {
//                   setSelectReplyTo(false);
//                   setToggleReply(false);
//                 }}
//               >
//                 {" "}
//                 &#10005;
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {showCommentsSuffixOption && (
//         <AddSuffixToComment
//           post={postNewComment}
//           comment={newComment}
//           exit={() => setShowCommentsSuffixOption(false)}
//           nEvent={nEvent}
//         />
//       )}
//       <div
//         className="fx-col fit-container fx-centered"
//         style={{
//           width: "calc(100% - 64px)",
//         }}
//       >
//         {/* <h5 className="box-pad-v-m">{comment.count.length} Reply(ies)</h5> */}
//         {/* <div
//           className="fit-container fx-centered fx-col fx-start-h"
//           style={{ maxHeight: "40vh", overflow: "scroll" }}
//         > */}
//         {all.map((comment, index) => {
//           return (
//             <Reply
//               comment={{ ...comment, count: [] }}
//               index={index}
//               all={all || []}
//               setSelectReplyTo={setSelectReplyTo}
//               key={comment.id}
//               refresh={refresh}
//               setToggleReply={setToggleReply}
//             />
//           );
//         })}

//         {/* {nostrUser && (
//           <div className="fit-container" ref={ref}>
//             {selectReplyTo && (
//               <div
//                 className="fx-scattered fit-container sc-s-18 box-pad-h-m box-pad-v-s"
//                 style={{
//                   backgroundColor: "var(--very-dim-gray)",
//                   border: "none",
//                   borderBottomRightRadius: 0,
//                   borderBottomLeftRadius: 0,
//                 }}
//               >
//                 <p className="c1-c p-medium">
//                   Reply to: {selectReplyTo.content.substring(0, 20)}...
//                 </p>
//               </div>
//             )}
//             {toggleReply && (
//               <>
//                 <textarea
//                   className="txt-area ifs-full"
//                   placeholder="Reply to comment.."
//                   value={newComment}
//                   onChange={(e) => setNewComment(e.target.value)}
//                   style={{
//                     borderTopRightRadius: selectReplyTo ? 0 : "",
//                     borderTopLeftRadius: selectReplyTo ? 0 : "",
//                   }}
//                 />
//                 <div className="fx-centered fit-container fx-end-h">
//                   <button
//                     className="btn btn-normal  fx-centered"
//                     onClick={() =>
//                       newComment && setShowCommentsSuffixOption(true)
//                     }
//                   >
//                     {isLoading && <LoadingDots />}
//                     {!isLoading && <>Post a comment</>}
//                   </button>
//                   <button
//                     className="btn btn-gst-red"
//                     onClick={() => {
//                       setSelectReplyTo(false);
//                       setToggleReply(false);
//                     }}
//                   >
//                     {" "}
//                     &#10005;
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
//         )} */}
//       </div>
//     </>
//   );
// };

const Reply = ({ comment, all, noteID }) => {
  const [seeReply, setSeeReply] = useState(false);

  const repliedOn = useMemo(() => {
    let replyTo_ = comment.tags.find(
      (item) => item[0] === "e" && item.length === 4 && item[3] === "reply"
    );
    return getOnReply(all, replyTo_ ? replyTo_[1] : "");
  }, [all]);

  return (
    <>
      <div
        className={`fit-container  sc-s-18 fx-centered fx-col fx-shrink  ${
          repliedOn ? "box-pad-h-s box-pad-v-s" : ""
        }`}
        style={{
          backgroundColor: repliedOn ? "var(--c1-side)" : "",
          border: "none",
          overflow: "visible",
        }}
      >
        {repliedOn && (
          <div className="fx-start-h fx-centerd fit-container">
            <div
              className="fx-centered fit-container fx-start-h pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSeeReply(!seeReply);
              }}
            >
              <p className="c1-c p-medium">
                This is a reply to : {repliedOn.content.substring(0, 10)}...
                (See more)
              </p>
              <div
                className="arrow"
                style={{ transform: seeReply ? "rotate(180deg)" : "" }}
              ></div>
            </div>
            <div
              className="fit-container box-pad-v-s"
              style={{ display: seeReply ? "flex" : "none" }}
            >
              <NotesComment event={repliedOn} noReactions={true} />
            </div>
            <hr />
          </div>
        )}
        <div
          className="fx-centered fx-start-h fit-container"
          style={{ columnGap: "16px" }}
        >
          <NotesComment event={comment} rootNoteID={noteID} />
        </div>
      </div>
    </>
  );
};
// const Reply = ({
//   comment,
//   refresh,
//   index,
//   all,
//   setSelectReplyTo,
//   setToggleReply,
// }) => {
//   const { nostrUser, nostrKeys, setToPublish, isPublishing, setToast } =
//     useContext(Context);
//   const [isLoading, setIsLoading] = useState(false);
//   const [confirmationPrompt, setConfirmationPrompt] = useState(false);
//   const [seeReply, setSeeReply] = useState(false);
//   const [showLogin, setShowLogin] = useState(false);

//   const repliedOn = useMemo(() => {
//     return getOnReply(
//       all,
//       comment.tags.find(
//         (item) => item[0] === "e" && item.length === 4 && item[3] === "reply"
//       )[1] || ""
//     );
//   }, [all]);

//   const handleCommentDeletion = async () => {
//     try {
//       if (isPublishing) {
//         setToast({
//           type: 3,
//           desc: "An event publishing is in process!",
//         });
//         return;
//       }
//       setIsLoading(true);
//       let relaysToPublish = filterRelays(
//         nostrUser?.relays || [],
//         relaysOnPlatform
//       );
//       let created_at = Math.floor(Date.now() / 1000);
//       let tags = [["e", comment.id]];

//       let event = {
//         kind: 5,
//         content: "This comment will be deleted!",
//         created_at,
//         tags,
//       };
//       if (nostrKeys.ext) {
//         try {
//           event = await window.nostr.signEvent(event);
//         } catch (err) {
//           console.log(err);
//           refresh(index);
//           setIsLoading(false);
//           return false;
//         }
//       } else {
//         event = finalizeEvent(event, nostrKeys.sec);
//       }
//       setToPublish({
//         eventInitEx: event,
//         allRelays: relaysToPublish,
//       });
//       // setToPublish({
//       //   nostrKeys: nostrKeys,
//       //   kind: 5,
//       //   content: "This comment will be deleted!",
//       //   tags: [["e", comment.id]],
//       //   allRelays: nostrUser
//       //     ? [...filterRelays(relaysOnPlatform, nostrUser.relays)]
//       //     : relaysOnPlatform,
//       // });
//       // let data = await deletePost(
//       //   nostrKeys,
//       //   comment.id,
//       //   nostrUser
//       //     ? [...filterRelays(relaysOnPlatform, nostrUser.relays)]
//       //     : relaysOnPlatform
//       // );

//       refresh(index);
//       setIsLoading(false);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   return (
//     <>
//       {confirmationPrompt && (
//         <ToDeleteComment
//           comment={comment}
//           exit={(e) => setConfirmationPrompt(false)}
//           handleCommentDeletion={() => {
//             setConfirmationPrompt(false);
//             handleCommentDeletion();
//           }}
//         />
//       )}
//       {/* {showLogin && <LoginNOSTR exit={() => setShowLogin(false)} />} */}
//       <div
//         className={`fit-container box-pad-h box-pad-v sc-s-18 fx-centered fx-col fx-shrink  ${
//           isLoading ? "flash" : ""
//         }`}
//         style={{
//           backgroundColor: "var(--c1-side)",
//           border: "none",
//         }}
//       >
//         <div className="fit-container fx-scattered fx-start-v">
//           <div className="fx-centered" style={{ columnGap: "16px" }}>
//             <AuthorPreview
//               author={{
//                 author_img: "",
//                 author_name: comment.pubkey.substring(0, 20),
//                 author_pubkey: comment.pubkey,
//                 on: new Date(comment.created_at * 1000).toISOString(),
//               }}
//             />
//           </div>
//           {comment.pubkey === nostrKeys.pub && (
//             <div
//               className="fx-centered pointer"
//               style={{ columnGap: "3px" }}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setConfirmationPrompt(true);
//               }}
//             >
//               <div className="trash-24"></div>
//             </div>
//           )}
//         </div>
//         {repliedOn && (
//           <div
//             className="fx-start-h fx-centerd fit-container"
//             // style={{ width: seeReply ? "100%" : "max-content" }}
//           >
//             <div
//               className="fx-centered fit-container fx-start-h pointer"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setSeeReply(!seeReply);
//               }}
//             >
//               <p className="c1-c p-medium">
//                 Replied to : {repliedOn.content.substring(0, 10)}... (See more)
//               </p>
//               <div
//                 className="arrow"
//                 style={{ transform: seeReply ? "rotate(180deg)" : "" }}
//               ></div>
//             </div>
//             <div
//               className="fit-container box-pad-v-s"
//               style={{ display: seeReply ? "flex" : "none" }}
//             >
//               {" "}
//               <Comment
//                 comment={{ ...repliedOn, count: [] }}
//                 action={false}
//               />{" "}
//             </div>
//             <hr />
//           </div>
//         )}
//         <div
//           className="fx-centered fx-start-h fit-container"
//           style={{ columnGap: "16px" }}
//         >
//           {/* <div
//             className="fx-centered fx-start-h fx-wrap fit-container"
//             style={{ rowGap: 0, columnGap: "4px" }}
//           > */}
//           <div className="fit-container">
//             {comment.note_tree}
//             {/* {getNoteTree(comment.content.split(" — This is a comment on:")[0])} */}
//           </div>
//           {/* <p>{comment.content.split(" — This is a comment on:")[0]}</p> */}
//         </div>

//         {/* {repliedOn && (
//             <div
//               className="fx-start-h fx-centerd fit-container"
//               // style={{ width: seeReply ? "100%" : "max-content" }}
//             >
//               <div
//                 className="fx-centered fit-container fx-start-h box-pad-h pointer"
//                 onClick={() => setSeeReply(!seeReply)}
//               >
//                 <p className="c1-c p-medium">Replied to : {repliedOn.content.substring(0,10)}... (See more)</p>
//                 <div
//                   className="arrow"
//                   style={{ transform: seeReply ? "rotate(180deg)" : "" }}
//                 ></div>
//               </div>

//               <div
//                 className="fit-container"
//                 style={{ display: seeReply ? "flex" : "none" }}
//               >
//                 {" "}
//                 <Comment comment={{ ...repliedOn, count: [] }} />{" "}
//               </div>
//             </div>
//           )} */}
//         <div
//           className="fx-centered fx-start-h fit-container"
//           style={{ columnGap: "16px" }}
//           onClick={() => {
//             nostrKeys
//               ? setSelectReplyTo({
//                   id: comment.id,
//                   content: comment.content,
//                   created_at: comment.created_at,
//                   pubkey: comment.pubkey,
//                 })
//               : setShowLogin(true);
//             setToggleReply(true);
//           }}
//         >
//           <p className="gray-c p-medium pointer btn-text">Reply</p>
//         </div>
//       </div>
//     </>
//   );
// };

const AuthorPreview = ({ author }) => {
  const [authorData, setAuthorData] = useState("");
  const { relayConnect, addNostrAuthors, getNostrAuthor, nostrAuthors } =
    useContext(Context);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let auth = getNostrAuthor(author.author_pubkey);

        if (auth)
          setAuthorData({
            author_img: auth.picture,
            author_name: auth.name,
            author_pubkey: auth.pubkey,
          });
        return;
      } catch (err) {
        console.log(err);
      }
    };
    if (!authorData) fetchData();
  }, [nostrAuthors]);

  if (!authorData)
    return (
      <div className="fx-centered" style={{ opacity: ".5" }}>
        <UserProfilePicNOSTR
          size={24}
          ring={false}
          img={author.author_img}
          mainAccountUser={false}
          user_id={author.author_pubkey}
        />
        <div>
          <p className="gray-c p-medium">
            On <Date_ time={true} toConvert={author.on} />
          </p>
          <p className="p-one-line p-medium">
            By: <span className="c1-c">{author.author_name}</span>
          </p>
        </div>
      </div>
    );
  return (
    <>
      <UserProfilePicNOSTR
        size={24}
        ring={false}
        img={authorData.author_img}
        mainAccountUser={false}
        user_id={authorData.author_pubkey}
      />
      <div>
        <p className="gray-c p-medium">
          On <Date_ time={true} toConvert={author.on} />
        </p>
        <p className="p-one-line p-medium">
          By: <span className="c1-c">{authorData.author_name}</span>
        </p>
      </div>
    </>
  );
};

const ToDeleteComment = ({ comment, exit, handleCommentDeletion }) => {
  return (
    <div className="fixed-container fx-centered box-pad-h">
      <section
        className="box-pad-h box-pad-v sc-s fx-centered fx-col"
        style={{ position: "relative", width: "min(100%, 350px)" }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <h4 className="p-centered">
          Delete{" "}
          <span className="orange-c" style={{ wordBreak: "break-word" }}>
            "
            {comment.content
              .split(" — This is a comment on:")[0]
              .substring(0, 100)}
            "?
          </span>
        </h4>
        <p className="p-centered gray-c box-pad-v-m">
          Do you wish to delete this comment?
        </p>
        <div className="fit-container fx-centered">
          <button className="btn btn-normal fx" onClick={handleCommentDeletion}>
            Delete
          </button>
          <button className="btn btn-gst fx" onClick={exit}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
};
