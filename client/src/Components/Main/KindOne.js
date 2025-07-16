import React, { useEffect, useMemo, useState } from "react";
import {
  enableTranslation,
  getBech32,
  getEmptyuserMetadata,
  getParsedNote,
  getParsedRepEvent,
} from "../../Helpers/Encryptions";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import Date_ from "../../Components/Date_";
import BookmarkEvent from "./BookmarkEvent";
import ShareLink from "../ShareLink";
import NumberShrink from "../NumberShrink";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { getSubData, getUser, translate } from "../../Helpers/Controlers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { NDKUser } from "@nostr-dev-kit/ndk";
import OptionsDropdown from "./OptionsDropdown";
import useNoteStats from "../../Hooks/useNoteStats";
import Like from "../Reactions/Like";
import Repost from "../Reactions/Repost";
import Quote from "../Reactions/Quote";
import Zap from "../Reactions/Zap";
import Comments from "../Reactions/Comments";
import { customHistory } from "../../Helpers/History";
import { saveUsers } from "../../Helpers/DB";
import CommentsSection from "./CommentsSection";
import {
  compactContent,
  getNoteTree,
  getRepliesViewSettings,
} from "../../Helpers/Helpers";
import { useTranslation } from "react-i18next";
import LoadingDots from "../LoadingDots";
import ZapAd from "./ZapAd";
import useUserProfile from "../../Hooks/useUsersProfile";
import RepEventPreviewCard from "./RepEventPreviewCard";
import NotesComment from "./NotesComment";
import { nip19 } from "nostr-tools";

export default function KindOne({
  event,
  reactions = true,
  border = false,
  minimal = false,
  getReposts = () => null,
}) {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const isPublishing = useSelector((state) => state.isPublishing);
  const userMutedList = useSelector((state) => state.userMutedList);
  const { t } = useTranslation();
  // const [user, setUser] = useState(getEmptyuserMetadata(event.pubkey));
  // const [isNip05Verified, setIsNip05Verified] = useState(false);
  const { isNip05Verified, userProfile } = useUserProfile(event?.pubkey);
  const [toggleComment, setToggleComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [usersList, setUsersList] = useState(false);
  const { postActions } = useNoteStats(event?.id, event?.pubkey);
  const [isNoteTranslating, setIsNoteTranslating] = useState("");
  const [translatedNote, setTranslatedNote] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTransEnabled, setIsTransEnabled] = useState(true);
  const isThread = getRepliesViewSettings();

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

  const isMuted = useMemo(() => {
    let checkProfile = () => {
      if (!Array.isArray(userMutedList)) return false;
      let index = userMutedList.findIndex(
        (item) => item === userProfile?.pubkey
      );
      if (index === -1) {
        return false;
      }
      return { index };
    };
    return checkProfile();
  }, [userMutedList, userProfile]);

  useEffect(() => {
    if (postActions && postActions?.reposts?.reposts?.length > 0)
      getReposts(postActions?.reposts?.reposts);
  }, [postActions]);

  const onClick = (e) => {
    e.stopPropagation();
    let isSelected = window.getSelection().toString();
    if (!reactions) {
      redirect(e);
      return;
    }
    if (isSelected) return null;
    customHistory.push(`/notes/${event.nEvent}`, {
      triggerTranslation: translatedNote ? true : false,
    });
  };

  const redirect = (e) => {
    e.stopPropagation();
    if (window.location.pathname.includes("/notes/"))
      customHistory.push(`/notes/${event.nEvent}`);
    else window.location = `/notes/${event.nEvent}`;
  };

  const muteUnmute = async () => {
    try {
      if (!Array.isArray(userMutedList)) return;
      let tempTags = Array.from(userMutedList.map((pubkey) => ["p", pubkey]));
      if (isMuted) {
        tempTags.splice(isMuted.index, 1);
      } else {
        tempTags.push(["p", event.pubkey]);
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
    navigator.clipboard.writeText(event.nEvent);
    dispatch(
      setToast({
        type: 1,
        desc: `${t("ARJICtS")} 👏`,
      })
    );
  };

  const translateNote = async () => {
    setIsNoteTranslating(true);
    if (translatedNote) {
      setShowTranslation(true);
      setIsNoteTranslating(false);
      return;
    }
    try {
      if (event.isCollapsedNote) {
        customHistory.push(`/notes/${event.nEvent}`, {
          triggerTranslation: true,
        });
        return;
      }
      let res = await translate(event.content);
      if (res.status === 500) {
        dispatch(
          setToast({
            type: 2,
            desc: t("AZ5VQXL"),
          })
        );
      }
      if (res.status === 400) {
        dispatch(
          setToast({
            type: 2,
            desc: t("AJeHuH1"),
          })
        );
      }
      if (res.status === 200) {
        let noteTree = await getNoteTree(
          res.res,
          undefined,
          undefined,
          undefined,
          event.pubkey
        );
        setTranslatedNote(noteTree);
        setShowTranslation(true);
      }
      setIsNoteTranslating(false);
    } catch (err) {
      setShowTranslation(false);
      setIsNoteTranslating(false);
      dispatch(
        setToast({
          type: 2,
          desc: t("AZ5VQXL"),
        })
      );
    }
  };

  return (
    <>
      {showComments && (
        <FastAccessCS
          noteTags={event.tags}
          id={event.id}
          eventPubkey={event.pubkey}
          author={userProfile}
          exit={() => setShowComments(false)}
          isRoot={event.isComment ? false : true}
        />
      )}
      <div
        className="box-pad-v-m fit-container"
        style={{ borderBottom: border ? "1px solid var(--very-dim-gray)" : "" }}
      >
        {event.isComment && isThread && (
          <RelatedEvent event={event.isComment} />
        )}
        <div
          className={`fit-container box-pad-h-m fx-centered fx-col ${
            !reactions ? "sc-s-18 box-pad-v-m" : ""
          }`}
          style={{
            backgroundColor: !toggleComment ? "" : "var(--c1-side)",
            transition: ".2s ease-in-out",
            overflow: "visible",
          }}
        >
          {usersList && (
            <ShowUsersList
              exit={() => setUsersList(false)}
              title={usersList.title}
              list={usersList.list}
              extras={usersList.extras}
              extrasType={usersList?.extrasType}
            />
          )}
          <div
            className=" fit-container pointer"
            style={{
              transition: ".2s ease-in-out",
              overflow: "visible",
            }}
            onClick={reactions ? null : redirect}
          >
            <div className="fit-container fx-centered fx-start-h fx-start-v">
              <div>
                <UserProfilePic
                  size={40}
                  mainAccountUser={false}
                  user_id={userProfile.pubkey}
                  img={userProfile.picture}
                  metadata={userProfile}
                />
              </div>
              <div
                className={
                  "fit-container fx-centered fx-start-h fx-start-v fx-col"
                }
                style={{ gap: "6px" }}
                onClick={onClick}
              >
                <div className="fx-scattered fit-container">
                  <div className="fx-centered" style={{ gap: "3px" }}>
                    <div className="fx-centered" style={{ gap: "3px" }}>
                      <p className="p-bold p-one-line">
                        {userProfile.display_name || userProfile.name}
                      </p>
                      {isNip05Verified && <div className="checkmark-c1"></div>}
                    </div>
                    <p className="gray-c p-medium">&#8226;</p>
                    <p className="gray-c p-medium">
                      <Date_
                        toConvert={new Date(event.created_at * 1000)}
                        time={true}
                      />
                    </p>
                  </div>
                  {event.isFlashNews && (
                    <div className="sticker sticker-c1">{t("AAg9D6c")}</div>
                  )}
                </div>
                {event.isComment && !isThread && (
                  <RelatedEvent event={event.isComment} />
                )}
                <div className="fx-centered fx-col fit-container">
                  <div className="fit-container" onClick={onClick}>
                    {!minimal ? (
                      <>{showTranslation ? translatedNote : event.note_tree}</>
                    ) : (
                      <p className="p-four-lines">
                        {compactContent(event.content, event.pubkey)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {event.isCollapsedNote && (
              <div
                className="fit-container note-indent fx-centered fx-start-h pointer"
                style={{ paddingTop: ".5rem" }}
                onClick={onClick}
              >
                <p className="c1-c">... {t("AnWFKlu")}</p>
              </div>
            )}
            {reactions && (
              <>
                {postActions?.zaps?.zaps?.length > 0 && (
                  <div className="fit-container note-indent">
                    <ZapAd
                      zappers={postActions.zaps.zaps}
                      onClick={() =>
                        setUsersList({
                          title: t("AVDZ5cJ"),
                          list: postActions.zaps.zaps.map(
                            (item) => item.pubkey
                          ),
                          extras: postActions.zaps.zaps,
                        })
                      }
                    />
                  </div>
                )}

                <div
                  className="fx-scattered fit-container note-indent"
                  style={{ paddingTop: "1rem" }}
                >
                  <div className="fx-centered" style={{ columnGap: "1rem" }}>
                    <div className="fx-centered">
                      <div className="icon-tooltip" data-tooltip={t("ADHdLfJ")}>
                        <div
                          className="comment-24"
                          onClick={() => setToggleComment(!toggleComment)}
                        ></div>
                      </div>
                      <div
                        className="icon-tooltip"
                        data-tooltip={t("AMBxvKP")}
                        onClick={() =>
                          postActions.replies.replies.length > 0
                            ? setShowComments(true)
                            : null
                        }
                      >
                        <p>{postActions.replies.replies.length}</p>
                      </div>
                    </div>
                    <div className="fx-centered">
                      <Like
                        isLiked={isLiked}
                        event={event}
                        actions={postActions}
                      />
                      <div
                        className={`icon-tooltip ${isLiked ? "orange-c" : ""}`}
                        data-tooltip={t("Alz0E9Y")}
                        onClick={(e) => {
                          e.stopPropagation();
                          postActions.likes.likes.length > 0 &&
                            setUsersList({
                              title: t("Alz0E9Y"),
                              list: postActions.likes.likes.map(
                                (item) => item.pubkey
                              ),
                              extras: postActions.likes.likes,
                              extrasType: "reaction",
                            });
                        }}
                      >
                        <NumberShrink value={postActions.likes.likes.length} />
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
                        event={event}
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
                    <div className="fx-centered">
                      <Quote
                        isQuoted={isQuoted}
                        event={event}
                        actions={postActions}
                      />
                      <div
                        className={`icon-tooltip ${isQuoted ? "orange-c" : ""}`}
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
                    <div className="fx-centered">
                      <div className="icon-tooltip" data-tooltip={t("AtGAGPY")}>
                        <Zap
                          user={userProfile}
                          event={event}
                          actions={postActions}
                          isZapped={isZapped}
                        />
                      </div>
                      <div
                        className={`icon-tooltip ${isZapped ? "orange-c" : ""}`}
                        data-tooltip={t("AVDZ5cJ")}
                        onClick={(e) => {
                          e.stopPropagation();
                          postActions.zaps.total > 0 &&
                            setUsersList({
                              title: t("AVDZ5cJ"),
                              list: postActions.zaps.zaps.map(
                                (item) => item.pubkey
                              ),
                              extras: postActions.zaps.zaps,
                            });
                        }}
                      >
                        <NumberShrink value={postActions.zaps.total} />
                      </div>
                    </div>
                  </div>
                  <div className="fx-centered">
                    {isTransEnabled && (
                      <div className="fit-container">
                        {!isNoteTranslating && !showTranslation && (
                          <div
                            className="icon-tooltip"
                            data-tooltip={t("AdHV2qJ")}
                            onClick={translateNote}
                          >
                            <div className="translate-24"></div>
                          </div>
                        )}
                        {!isNoteTranslating && showTranslation && (
                          <div
                            className="icon-tooltip"
                            data-tooltip={t("AE08Wte")}
                            onClick={() => setShowTranslation(false)}
                          >
                            <div className="translate-24"></div>
                          </div>
                        )}
                        {isNoteTranslating && <LoadingDots />}
                      </div>
                    )}

                    <OptionsDropdown
                      options={[
                        <div onClick={copyID} className="pointer">
                          <p>{t("AYFAFKs")}</p>
                        </div>,
                        userKeys && (
                          <>
                            <BookmarkEvent
                              label={t("Ar5VgpT")}
                              pubkey={event.id}
                              kind={"1"}
                              itemType="e"
                            />
                          </>
                        ),
                        <div className="fit-container fx-centered fx-start-h pointer">
                          <ShareLink
                            label={t("A1IsKJ0")}
                            path={`/notes/${event.nEvent}`}
                            title={userProfile.display_name || userProfile.name}
                            description={event.content}
                            kind={1}
                            shareImgData={{
                              post: event,
                              author: userProfile,
                              label: t("Az5ftet"),
                            }}
                          />
                        </div>,
                        event.pubkey !== userKeys.pub && (
                          <div
                            onClick={muteUnmute}
                            className="fit-container fx-scattered pointer"
                          >
                            {isMuted ? (
                              <p className="red-c">{t("AKELUbQ")}</p>
                            ) : (
                              <p className="red-c">{t("AGMxuQ0")}</p>
                            )}
                            {isMuted ? (
                              <div className="unmute-24"></div>
                            ) : (
                              <div className="mute-24"></div>
                            )}
                          </div>
                        ),
                      ]}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          {toggleComment && (
            <Comments
              noteTags={event.tags}
              exit={() => setToggleComment(false)}
              replyId={event.id}
              replyPubkey={event.pubkey}
              actions={postActions}
            />
          )}
        </div>
      </div>
    </>
  );
}

const RelatedEvent = ({ event }) => {
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const { t } = useTranslation();
  const [user, setUser] = useState(false);
  const [relatedEvent, setRelatedEvent] = useState(false);
  const [isRelatedEventPubkey, setIsRelatedEventPubkey] = useState(false);
  const [isRelatedEventLoaded, setIsRelatedEventLoaded] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const isThread = getRepliesViewSettings();

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        let auth = await getUser(isRelatedEventPubkey);
        if (auth) setUser(auth);
      } catch (err) {
        console.log(err);
      }
    };
    fetchAuthor();
  }, [nostrAuthors, isRelatedEventPubkey]);

  useEffect(() => {
    const fetchData = async (kind, ids) => {
      try {
        setIsRelatedEventLoaded(false);
        let event_ =
          kind === 1
            ? await getSubData([{ kinds: [kind], ids: [ids] }], 1000)
            : await getSubData(
                [
                  {
                    kinds: [kind],
                    authors: [ids.pubkey],
                    "#d": [ids.identifier],
                  },
                ],
                1000
              );
        if (event_.data.length > 0) {
          saveUsers([event_.data[0].pubkey]);
          let parsedEvent;
          if (kind === 1) {
            parsedEvent = await getParsedNote(event_.data[0]);
            parsedEvent = { ...parsedEvent, isComment: false };
          } else {
            console.log(event_.data[0]);
            parsedEvent = getParsedRepEvent(event_.data[0]);
          }
          setRelatedEvent(parsedEvent);
          setIsRelatedEventPubkey(event_.data[0].pubkey);
          setUser(getEmptyuserMetadata(event_.data[0].pubkey));
        }
        setIsRelatedEventLoaded(true);
      } catch (err) {
        setIsRelatedEventLoaded(true);
      }
    };
    if (event) {
      let checkEventKind = event.split(":");
      if (checkEventKind.length > 2) {
        saveUsers([checkEventKind[1]]);
        fetchData(checkEventKind[0], {
          pubkey: checkEventKind[1],
          identifier: checkEventKind[2],
        });
        // setRelatedEvent(checkEventKind[1]);
        // setIsRelatedEventPubkey(checkEventKind[1]);
        // setUser(getEmptyuserMetadata(checkEventKind[1]));
        return;
      }
      fetchData(1, event);
    }
  }, [event]);

  const handleOnClick = (e) => {
    e.stopPropagation();
    if (!user) return;
    customHistory.push(
      `/users/${nip19.nprofileEncode({ pubkey: user.pubkey })}`
    );
  };

  if (isThread)
    return (
      relatedEvent && (
        <div className=" fit-container">
          {relatedEvent.kind === 1 && (
            <NotesComment
              event={relatedEvent}
              hasReplies={true}
              isHistory={true}
            />
          )}
          {relatedEvent.kind !== 1 && (
            <RepEventPreviewCard item={relatedEvent} />
          )}
        </div>
      )
    );
  return (
    <>
      <div className="fit-container fx-centered fx-start-h">
        {isRelatedEventLoaded ? (
          <div className="fx-centered">
            <p className="gray-c" onClick={handleOnClick}>
              {t("AoUrRsg")}{" "}
              <span className="c1-c">
                @{user?.display_name || user?.name || "USER"}
              </span>
            </p>
            {relatedEvent && (
              <div
                className="arrow-12"
                style={{ rotate: showNote ? "-180deg" : "0deg" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNote(!showNote);
                }}
              ></div>
            )}
          </div>
        ) : (
          <div className="fx-centered">
            <p className="gray-c">{t("AoUrRsg")}</p>
            <LoadingDots />
          </div>
        )}
      </div>
      {relatedEvent && showNote && (
        <div
          style={{ borderLeft: "1px solid var(--c1)" }}
          className="slide-down"
        >
          {relatedEvent.kind === 1 && <KindOne event={relatedEvent} />}
          {relatedEvent.kind !== 1 && (
            <RepEventPreviewCard item={relatedEvent} />
          )}
        </div>
      )}
    </>
  );
};

const FastAccessCS = ({
  id,
  noteTags,
  eventPubkey,
  author,
  exit,
  isRoot = true,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="fixed-container fx-centered fx-start-v"
      onClick={(e) => {
        e.stopPropagation();
        exit();
      }}
    >
      <div
        className="fx-centered fx-col fx-start-v fx-start-h sc-s-18 bg-sp"
        style={{
          overflow: "scroll",
          scrollBehavior: "smooth",
          height: "100vh",
          width: "min(100%, 550px)",
          position: "relative",
          borderRadius: 0,
          gap: 0,
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div
          className="fit-container fx-centered sticky"
          style={{ borderBottom: "1px solid var(--very-dim-gray)" }}
        >
          <div className="fx-scattered fit-container box-pad-h">
            <h4 className="p-caps">{t("Aog1ulK")}</h4>
            <div
              className="close"
              style={{ position: "static" }}
              onClick={exit}
            >
              <div></div>
            </div>
          </div>
        </div>
        <CommentsSection
          noteTags={noteTags}
          id={id}
          eventPubkey={eventPubkey}
          author={author}
          isRoot={isRoot}
        />
      </div>
    </div>
  );
};
