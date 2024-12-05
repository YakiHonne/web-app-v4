import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";
import relaysOnPlatform from "../../Content/Relays";
import {
  checkForLUDS,
  decodeBolt11,
  filterRelays,
  getBolt11,
  getEmptyEventStats,
  getEmptyuserMetadata,
  getParsedNote,
  getZapper,
  removeObjDuplicants,
} from "../../Helpers/Encryptions";
import { Helmet } from "react-helmet";
import ArrowUp from "../../Components/ArrowUp";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import NumberShrink from "../../Components/NumberShrink";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import Date_ from "../../Components/Date_";
import ZapTip from "../../Components/Main/ZapTip";
import LoadingDots from "../../Components/LoadingDots";
import BookmarkEvent from "../../Components/Main/BookmarkEvent";
import { getNoteTree, redirectToLogin } from "../../Helpers/Helpers";
import LoginWithNostr from "../../Components/Main/LoginWithNostr";
import Footer from "../../Components/Footer";
import ShareLink from "../../Components/ShareLink";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import QuoteNote from "../../Components/Main/QuoteNote";
import NotesComment from "../../Components/Main/NotesComment";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { getSubData, getUser } from "../../Helpers/Controlers";
import ImportantFlashNews from "../../Components/Main/ImportantFlashNews";
import useNoteStats from "../../Hooks/useNoteStats";
import Like from "../../Components/Reactions/Like";
import Repost from "../../Components/Reactions/Repost";
import Quote from "../../Components/Reactions/Quote";
import Zap from "../../Components/Reactions/Zap";
import OptionsDropdown from "../../Components/Main/OptionsDropdown";
import Comments from "../../Components/Reactions/Comments";
import { Link } from "react-router-dom";
import CommentsSection from "../../Components/Main/CommentsSection";
import { customHistory } from "../../Helpers/History";
import { NDKUser } from "@nostr-dev-kit/ndk";
import HistorySection from "../../Components/Main/HistorySection";
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

// const filterComments = (all, id, isRoot) => {
//   if (isRoot) return filterRootComments(all);
//   return filterRepliesComments(all, id);
// };

// const filterRootComments = async (all) => {
//   let temp = [];

//   for (let comment of all) {
//     if (!comment.tags.find((item) => item[0] === "e" && item[3] === "reply")) {
//       let [note_tree, count] = await Promise.all([
//         getParsedNote(comment),
//         // getNoteTree(comment.content.split(" — This is a comment on:")[0]),
//         countReplies(comment.id, all),
//       ]);
//       temp.push({
//         // ...comment,
//         ...note_tree,
//         count,
//       });
//     }
//   }
//   return temp;
// };

// const countReplies = async (id, all) => {
//   let count = [];

//   for (let comment of all) {
//     let ev = comment.tags.find(
//       (item) => item[3] === "reply" && item[0] === "e" && item[1] === id
//     );
//     if (ev) {
//       let cr = await countReplies(comment.id, all);
//       count.push(comment, ...cr);
//     }
//   }
//   let res = await Promise.all(
//     count
//       .sort((a, b) => b.created_at - a.created_at)
//       .map(async (com) => {
//         let note_tree = await getNoteTree(
//           com.content.split(" — This is a comment on:")[0]
//         );
//         return {
//           ...com,
//           note_tree,
//         };
//       })
//   );
//   return res;
// };

// const filterRepliesComments = async (all, id) => {
//   let temp = [];
//   for (let comment of all) {
//     if (
//       comment.tags.find(
//         (item) =>
//           item[0] === "e" &&
//           item[1] === id &&
//           ["reply", "root"].includes(item[3])
//       )
//     ) {
//       let [note_tree, count] = await Promise.all([
//         getParsedNote(comment),
//         // getNoteTree(comment.content.split(" — This is a comment on:")[0]),
//         countReplies(comment.id, all),
//       ]);
//       temp.push({
//         // ...comment,
//         ...note_tree,
//         count,
//       });
//     }
//   }
//   return temp;
// };
// const filterRepliesComments = async (all, id) => {
//   let temp = [];
//   for (let comment of all) {
//     if (
//       comment.tags.find(
//         (item) =>
//           item[0] === "e" &&
//           item[1] === id &&
//           ["reply", "root"].includes(item[3])
//       )
//     ) {
//       let [note_tree, replies] = await Promise.all([
//         getParsedNote(comment),
//         countReplies(comment.id, all),
//       ]);
//       temp.push({
//         ...note_tree,
//         replies,
//       });
//     }
//   }
//   return temp;
// };

// const filterRootComments = async (all) => {
//   let temp = [];

//   for (let comment of all) {
//     // Check if this is a root comment
//     if (!comment.tags.find((item) => item[0] === "e" && item[3] === "reply")) {
//       let [note_tree, replies] = await Promise.all([
//         getParsedNote(comment),
//         countReplies(comment.id, all),
//       ]);
//       temp.push({
//         ...note_tree,
//         replies,
//       });
//     }
//   }
//   return temp;
// };

// const countReplies = async (id, all) => {
//   let replies = [];

//   for (let comment of all) {
//     // Check if this comment is a reply to the given id
//     let ev = comment.tags.find(
//       (item) => item[3] === "reply" && item[0] === "e" && item[1] === id
//     );
//     if (ev) {
//       // Recursive call to count replies of this reply
//       let nestedReplies = await countReplies(comment.id, all);
//       let note_tree = await getNoteTree(
//         comment.content.split(" — This is a comment on:")[0]
//       );

//       replies.push({
//         ...comment,
//         note_tree,
//         replies: nestedReplies, // Include nested replies here
//       });
//     }
//   }

//   // Sort replies by created_at in descending order
//   replies.sort((a, b) => b.created_at - a.created_at);

//   return replies;
// };

// const getOnReply = (comments, comment_id) => {
//   let tempCom = comments.find((item) => item.id === comment_id);
//   return tempCom;
// };

export default function Note() {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const isPublishing = useSelector((state) => state.isPublishing);
  const userMutedList = useSelector((state) => state.userMutedList);
  const userRelays = useSelector((state) => state.userRelays);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);

  const { nevent } = useParams();

  const [note, setNote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [usersList, setUsersList] = useState(false);
  const [isNip05Verified, setIsNip05Verified] = useState(false);
  const [zappers, setZappers] = useState([]);
  const [showQuoteBox, setShowQuoteBox] = useState(false);
  const { postActions } = useNoteStats(note?.id, note?.pubkey);

  const isLiked = useMemo(() => {
    return userKeys
      ? postActions.likes.likes.find((item) => item.pubkey === userKeys.pub)
      : false;
  }, [postActions, userKeys]);

  const isReposted = useMemo(() => {
    return userKeys
      ? postActions.reposts.reposts.find((item) => item.pubkey === userKeys.pub)
      : false;
  }, [postActions, userKeys]);
  const isQuoted = useMemo(() => {
    return userKeys
      ? postActions.quotes.quotes.find((item) => item.pubkey === userKeys.pub)
      : false;
  }, [postActions, userKeys]);

  const isZapped = useMemo(() => {
    return userKeys
      ? postActions.zaps.zaps.find((item) => item.pubkey === userKeys.pub)
      : false;
  }, [postActions, userKeys]);

  const author = useMemo(() => {
    if (note) {
      let auth = getUser(note.pubkey);
      return auth || getEmptyuserMetadata(note.pubkey);
    }
    return "";
  }, [note, nostrAuthors]);

  const isMuted = useMemo(() => {
    let checkProfile = () => {
      if (!Array.isArray(userMutedList)) return false;
      let index = userMutedList.findIndex((item) => item === author?.pubkey);
      if (index === -1) {
        return false;
      }
      return { index };
    };
    return checkProfile();
  }, [userMutedList, author]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (author) {
          let ndkUser = new NDKUser({ pubkey: author.pubkey });
          ndkUser.ndk = ndkInstance;
          let checknip05 = author.nip05
            ? await ndkUser.validateNip05(author.nip05)
            : false;

          if (checknip05) setIsNip05Verified(true);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [author]);

  useEffect(() => {
    setIsLoading(true);
    if (note) setNote(false);
    if (isNip05Verified) setIsNip05Verified(false);
    setShowHistory(false);
    let isEvent = false;
    const id = nip19.decode(nevent)?.data.id || nip19.decode(nevent)?.data;

    let subscription = ndkInstance.subscribe([{ kinds: [1], ids: [id] }], {
      cacheUsage: "ONLY_RELAY",
      subId: "note-req",
      groupable: false,
      skipValidation: true,
      skipVerification: true,
    });

    subscription.on("event", async (event) => {
      isEvent = true;
      let isNotRoot =
        event.tags.length === 0
          ? false
          : event.tags.find((tag) => tag.length > 3 && tag[3] === "root");
      let isReply =
        event.tags.length === 0
          ? false
          : event.tags.find((tag) => tag.length > 3 && tag[3] === "reply");

      let tempNote = await getParsedNote(event);
      if (tempNote) {
        saveUsers([event.pubkey]);
        setNote({
          ...tempNote,
          isRoot: !isNotRoot ? true : false,
          rootData: isNotRoot,
          isReply: isReply ? true : false,
        });
        setIsLoading(false);
        subscription.stop();
      } else {
        setIsLoading(false);
        subscription.stop();
      }
    });
    let timer = setTimeout(() => {
      if (!isEvent) {
        setIsLoading(false);
        subscription.stop();
      }
      clearTimeout(timer);
    }, 3000);
    return () => {
      clearTimeout(timer);
      if (subscription) subscription.stop();
    };
  }, [nevent]);

  const muteUnmute = async () => {
    try {
      if (!Array.isArray(userMutedList)) return;
      if (isPublishing) {
        dispatch(
          setToast({
            type: 3,
            desc: "An event publishing is in process!",
          })
        );
        return;
      }

      let tempTags = Array.from(userMutedList.map((pubkey) => ["p", pubkey]));
      if (isMuted) {
        tempTags.splice(isMuted.index, 1);
      } else {
        tempTags.push(["p", author.pubkey]);
      }

      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 10000,
          content: "",
          tags: tempTags,
          allRelays: userRelays,
        })
      );
    } catch (err) {
      console.log(err);
    }
  };

  const copyID = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(nevent);
    dispatch(
      setToast({
        type: 1,
        desc: `Note ID was copied! 👏`,
      })
    );
  };

  return (
    <>
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
        {note && (
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
        )}
        <div className="fit-container fx-centered">
          <div className="main-container">
            <SidebarNOSTR />
            <main className="main-page-nostr-container">
              <ArrowUp />

              <div
                className="fx-centered fit-container fx-col fx-start-h"
                style={{ gap: 0 }}
              >
                {note && (
                  <div className="main-middle">
                    <div
                      className="fx-centered fit-container fx-start-h box-pad-v-m sticky"
                      onClick={() => customHistory.back()}
                    >
                      <div className="box-pad-h-m">
                        <button
                          className="btn btn-normal btn-gray"
                          style={{ padding: "0 1rem" }}
                        >
                          <div
                            className="arrow"
                            style={{ rotate: "90deg" }}
                          ></div>
                        </button>
                      </div>
                    </div>
                    {note && !note.isRoot && (
                      <>
                        <div
                          className="fit-container box-pad-h box-pad-v-m box-marg-s fx-centered pointer sticky"
                          style={{
                            borderTop: "1px solid var(--very-dim-gray)",
                            borderBottom: "1px solid var(--very-dim-gray)",
                          }}
                          onClick={() => setShowHistory(!showHistory)}
                        >
                          <div className="fx-centered">
                            <p>
                              {showHistory ? "Hide" : "Show"} thread history
                            </p>
                            <div
                              className="arrow-12"
                              style={{
                                rotate: !showHistory ? "0deg" : "180deg",
                              }}
                            ></div>
                          </div>
                        </div>
                        <HistorySection
                          id={note.rootData[1]}
                          tagKind={note.rootData[0]}
                          isRoot={!note.isReply}
                          targetedEventID={note.id}
                          showHistory={showHistory}
                        />
                      </>
                    )}
                    <div
                      className="fit-container fx-centered fx-col fx-start-v"
                      style={{ paddingBottom: "3rem", gap: 0 }}
                    >
                      <div className="fx-centered fit-container fx-start-h box-pad-h-m box-marg-s">
                        <UserProfilePicNOSTR
                          img={author.picture}
                          size={64}
                          mainAccountUser={false}
                          user_id={note.pubkey}
                        />
                        <div className="box-pad-h-m fx-centered fx-col fx-start-v">
                          <div className="fx-centered">
                            <h4>{author.display_name || author.name}</h4>
                            {isNip05Verified && (
                              <div className="checkmark-c1-24"></div>
                            )}
                          </div>
                          <p className="gray-c">
                            <Date_
                              toConvert={new Date(note.created_at * 1000)}
                              time={true}
                            />
                          </p>
                        </div>
                      </div>

                      <div className="fit-container box-pad-h-m">
                        {note.note_tree}
                      </div>
                      <div className="fit-container fx-scattered box-pad-h-m box-pad-v-m">
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
                              <NumberShrink
                                value={postActions.replies.replies.length}
                              />
                              {/* <NumberShrink value={netCommentsCount} /> */}
                            </div>
                          </div>
                          <div
                            className={`fx-centered pointer ${
                              isLoading ? "flash" : ""
                            }`}
                            style={{ columnGap: "8px" }}
                          >
                            {/* <div
                              className={"icon-tooltip"}
                              data-tooltip="React"
                              onClick={reactToNote}
                            >
                              <div
                                className={
                                  isLiked ? "heart-bold-24" : "heart-24"
                                }
                              ></div>
                            </div> */}
                            <Like
                              isLiked={isLiked}
                              event={note}
                              actions={postActions}
                            />
                            <div
                              className={`icon-tooltip ${
                                isLiked ? "orange-c" : ""
                              }`}
                              data-tooltip="Reactions "
                              onClick={(e) => {
                                e.stopPropagation();
                                postActions.likes.likes.length > 0 &&
                                  setUsersList({
                                    title: "Reactions ",
                                    list: postActions.likes.likes.map(
                                      (item) => item.pubkey
                                    ),
                                    extras: [],
                                  });
                              }}
                            >
                              <NumberShrink
                                value={postActions.likes.likes.length}
                              />
                              {/* <NumberShrink value={reactions.length} /> */}
                            </div>
                          </div>
                          <div
                            className={`fx-centered pointer ${
                              isLoading ? "flash" : ""
                            }`}
                            style={{ columnGap: "8px" }}
                          >
                            <Repost
                              isReposted={isReposted}
                              event={note}
                              actions={postActions}
                            />
                            <div
                              className={`icon-tooltip ${
                                isReposted ? "orange-c" : ""
                              }`}
                              data-tooltip="Reposts "
                              onClick={(e) => {
                                e.stopPropagation();
                                postActions.reposts.reposts.length > 0 &&
                                  setUsersList({
                                    title: "Reposts ",
                                    list: postActions.reposts.reposts.map(
                                      (item) => item.pubkey
                                    ),
                                    extras: [],
                                  });
                              }}
                            >
                              <NumberShrink
                                value={postActions.reposts.reposts.length}
                              />
                            </div>
                          </div>
                          <div
                            className={`fx-centered pointer ${
                              isLoading ? "flash" : ""
                            }`}
                            style={{ columnGap: "8px" }}
                          >
                            <Quote
                              isQuoted={isQuoted}
                              event={note}
                              actions={postActions}
                            />
                            <div
                              className={`icon-tooltip ${
                                isQuoted ? "orange-c" : ""
                              }`}
                              data-tooltip="Quoters"
                              onClick={(e) => {
                                e.stopPropagation();
                                postActions.quotes.quotes.length > 0 &&
                                  setUsersList({
                                    title: "Quoters",
                                    list: postActions.quotes.quotes.map(
                                      (item) => item.pubkey
                                    ),
                                    extras: [],
                                  });
                              }}
                            >
                              <NumberShrink
                                value={postActions.quotes.quotes.length}
                              />
                            </div>
                          </div>
                          <div
                            className="fx-centered"
                            style={{ columnGap: "8px" }}
                          >
                            <div
                              className="icon-tooltip"
                              data-tooltip="Tip note"
                            >
                              <Zap
                                user={author}
                                event={note}
                                actions={postActions}
                                isZapped={isZapped}
                              />
                            </div>
                            <div
                              data-tooltip="See zappers"
                              className={`pointer icon-tooltip ${
                                isZapped ? "orange-c" : ""
                              }`}
                              onClick={() =>
                                postActions.zaps.total > 0 &&
                                setUsersList({
                                  title: "Zappers",
                                  list: postActions.zaps.zaps.map(
                                    (item) => item.pubkey
                                  ),
                                  extras: postActions.zaps.zaps,
                                })
                              }
                            >
                              <NumberShrink value={postActions.zaps.total} />
                            </div>
                          </div>
                        </div>
                        <OptionsDropdown
                          options={[
                            <div onClick={copyID} className="pointer">
                              <p>Copy note ID</p>
                            </div>,
                            userKeys && userKeys.pub !== note.pubkey && (
                              <>
                                <BookmarkEvent
                                  label="Bookmark note"
                                  pubkey={note.id}
                                  kind={"1"}
                                  itemType="e"
                                />
                              </>
                            ),
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
                            </div>,
                            <div onClick={muteUnmute} className="pointer">
                              {isMuted ? (
                                <p className="red-c">Unmute user</p>
                              ) : (
                                <p className="red-c">Mute user</p>
                              )}
                            </div>,
                          ]}
                        />
                      </div>
                      <CommentsSection
                        noteTags={note.tags}
                        id={note.id}
                        eventPubkey={note.pubkey}
                        nEvent={nevent}
                        postActions={postActions}
                        author={author}
                        isRoot={note.isRoot}
                        rootData={note.rootData}
                      />
                    </div>
                  </div>
                )}
                {isLoading && (
                  <div
                    style={{ height: "100vh" }}
                    className="fit-container box-pad-h-m fx-centered"
                  >
                    <LoadingDots />
                  </div>
                )}
                {!note && !isLoading && (
                  <div
                    className="fit-container fx-centered fx-col"
                    style={{ height: "100vh" }}
                  >
                    <h4>Note was not found</h4>
                    <p className="gray-c p-centered">
                      We could not find this note, it might be deleted by its
                      author
                    </p>
                    <Link to="/">
                      <button className="btn btn-normal btn-small">
                        Back to home
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
