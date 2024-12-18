import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";
import { getEmptyuserMetadata, getParsedNote } from "../../Helpers/Encryptions";
import { Helmet } from "react-helmet";
import ArrowUp from "../../Components/ArrowUp";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import NumberShrink from "../../Components/NumberShrink";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import Date_ from "../../Components/Date_";
import LoadingDots from "../../Components/LoadingDots";
import BookmarkEvent from "../../Components/Main/BookmarkEvent";
import ShareLink from "../../Components/ShareLink";
import QuoteNote from "../../Components/Main/QuoteNote";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { getUser } from "../../Helpers/Controlers";
import useNoteStats from "../../Hooks/useNoteStats";
import Like from "../../Components/Reactions/Like";
import Repost from "../../Components/Reactions/Repost";
import Quote from "../../Components/Reactions/Quote";
import Zap from "../../Components/Reactions/Zap";
import OptionsDropdown from "../../Components/Main/OptionsDropdown";
import { Link } from "react-router-dom";
import CommentsSection from "../../Components/Main/CommentsSection";
import { customHistory } from "../../Helpers/History";
import { NDKUser } from "@nostr-dev-kit/ndk";
import HistorySection from "../../Components/Main/HistorySection";
import { useTranslation } from "react-i18next";
const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

export default function Note() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const userKeys = useSelector((state) => state.userKeys);
  const userMutedList = useSelector((state) => state.userMutedList);
  const userRelays = useSelector((state) => state.userRelays);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);

  const { nevent } = useParams();

  const [note, setNote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [usersList, setUsersList] = useState(false);
  const [isNip05Verified, setIsNip05Verified] = useState(false);
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
        desc: `${t("ARJICtS")} 👏`,
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
                              {showHistory && t("ApSnq9V")}
                              {!showHistory && t("AUScjxu")}
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
                      <div className="fit-container fx-scattered fx-start-v">
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

                        {note.isFlashNews && (
                          <div
                            className="sticker sticker-c1"
                            style={{ minWidth: "max-content" }}
                          >
                            {t("AAg9D6c")}
                          </div>
                        )}
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
                              data-tooltip={t("Alz0E9Y")}
                              onClick={(e) => {
                                e.stopPropagation();
                                postActions.likes.likes.length > 0 &&
                                  setUsersList({
                                    title: t("Alz0E9Y"),
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
                              data-tooltip={t("Aai65RJ")}
                              onClick={(e) => {
                                e.stopPropagation();
                                postActions.reposts.reposts.length > 0 &&
                                  setUsersList({
                                    title: t("Aai65RJ"),
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
                              data-tooltip={t("AWmDftG")}
                              onClick={(e) => {
                                e.stopPropagation();
                                postActions.quotes.quotes.length > 0 &&
                                  setUsersList({
                                    title: t("AWmDftG"),
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
                              data-tooltip={t("AO0OqWT")}
                              className={`pointer icon-tooltip ${
                                isZapped ? "orange-c" : ""
                              }`}
                              onClick={() =>
                                postActions.zaps.total > 0 &&
                                setUsersList({
                                  title: t("AVDZ5cJ"),
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
                              <p>{t("AYFAFKs")}</p>
                            </div>,
                            userKeys && userKeys.pub !== note.pubkey && (
                              <>
                                <BookmarkEvent
                                  label={t("Ar5VgpT")}
                                  pubkey={note.id}
                                  kind={"1"}
                                  itemType="e"
                                />
                              </>
                            ),
                            <div className="fit-container fx-centered fx-start-h pointer">
                              <ShareLink
                                label={t("A1IsKJ0")}
                                path={`/notes/${note.nEvent}`}
                                title={author.display_name || author.name}
                                description={note.content}
                                kind={1}
                                shareImgData={{
                                  post: note,
                                  author,
                                  label: t("Az5ftet"),
                                }}
                              />
                            </div>,
                            <div onClick={muteUnmute} className="pointer">
                              {isMuted ? (
                                <p className="red-c">{t("AKELUbQ")}</p>
                              ) : (
                                <p className="red-c">{t("AGMxuQ0")}</p>
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
                    <h4>{t("AAbA1Xn")}</h4>
                    <p className="gray-c p-centered">{t("Agge1Vg")}</p>
                    <Link to="/">
                      <button className="btn btn-normal btn-small">
                        {t("AWroZQj")}
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
