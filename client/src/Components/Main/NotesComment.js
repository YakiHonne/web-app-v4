import React, { useEffect, useMemo, useState } from "react";
import { nip19 } from "nostr-tools";
import {
  enableTranslation,
  getEmptyuserMetadata,
} from "../../Helpers/Encryptions";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import Date_ from "../../Components/Date_";
import BookmarkEvent from "./BookmarkEvent";
import ShareLink from "../ShareLink";
import NumberShrink from "../NumberShrink";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { getUser, translate } from "../../Helpers/Controlers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import useNoteStats from "../../Hooks/useNoteStats";
import Comments from "../Reactions/Comments";
import Like from "../Reactions/Like";
import Repost from "../Reactions/Repost";
import Quote from "../Reactions/Quote";
import Zap from "../Reactions/Zap";
import OptionsDropdown from "./OptionsDropdown";
import { customHistory } from "../../Helpers/History";
import { NDKUser } from "@nostr-dev-kit/ndk";
import { useTranslation } from "react-i18next";
import { getNoteTree } from "../../Helpers/Helpers";
import LoadingDots from "../LoadingDots";

export default function NotesComment({
  event,
  rootNotePubkey = "",
  noReactions = false,
  hasReplies = false,
  isReply = false,
  isReplyBorder = false,
  isHistory = false,
}) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const userMutedList = useSelector((state) => state.userMutedList);

  const [user, setUser] = useState(getEmptyuserMetadata(event.pubkey));
  const [toggleComment, setToggleComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usersList, setUsersList] = useState(false);
  const [isNip05Verified, setIsNip05Verified] = useState(false);
  const { postActions } = useNoteStats(event.id, event.pubkey);
  const [isNoteTranslating, setIsNoteTranslating] = useState("");
  const [translatedNote, setTranslatedNote] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTransEnabled, setIsTransEnabled] = useState(true);
  const isLikedByAuthor = useMemo(() => {
    return postActions.likes.likes.find(
      (item) => item.pubkey === rootNotePubkey
    );
  }, [postActions]);
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
      let index = userMutedList.findIndex((item) => item === user?.pubkey);
      if (index === -1) {
        return false;
      }
      return { index };
    };
    return checkProfile();
  }, [userMutedList, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let tempPubkey = event.pubkey;
        let auth = getUser(tempPubkey);

        if (auth) {
          setUser(auth);
          let ndkUser = new NDKUser({ pubkey: event.pubkey });
          ndkUser.ndk = ndkInstance;
          let checknip05 = auth.nip05
            ? await ndkUser.validateNip05(auth.nip05)
            : false;

          if (checknip05) setIsNip05Verified(true);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [nostrAuthors]);
  // useEffect(() => {
  //   const detectLang = async () => {
  //     let isEnabled = await enableTranslation(event.content);

  //     setIsTransEnabled(isEnabled);
  //   };
  //   detectLang();
  // }, []);

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
    let nEvent = nip19.neventEncode({
      id: event.id,
      author: event.pubkey,
    });
    navigator.clipboard.writeText(nEvent);
    dispatch(
      setToast({
        type: 1,
        desc: `${t("ARJICtS")} 👏`,
      })
    );
  };

  const onClick = (e) => {
    e.stopPropagation();
    let isSelected = window.getSelection().toString();
    if (!noReactions) {
      redirect(e);
      return;
    }
    if (isSelected) return null;
    customHistory.push(`/notes/${event.nEvent}`);
  };
  const redirect = (e) => {
    e.stopPropagation();
    if (window.location.pathname.includes("/notes/"))
      customHistory.push(`/notes/${event.nEvent}`);
    else window.location = `/notes/${event.nEvent}`;
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
        let noteTree = await getNoteTree(res.res);
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
    <div
      className={`fit-container box-pad-h-s ${isHistory ? "" : "box-pad-v-s"}`}
      style={{
        transition: ".2s ease-in-out",
        overflow: "visible",
        paddingBottom: 0,
        position: "relative",
      }}
    >
      {isReply && (
        <div
          className="reply-tail"
          // style={{ right: isReplyBorder ? "-.0625rem" : 0 }}
        ></div>
      )}
      {usersList && (
        <ShowUsersList
          exit={() => setUsersList(false)}
          title={usersList.title}
          list={usersList.list}
          extras={usersList.extras}
        />
      )}
      <div
        className={`box-pad-h-m ${
          isHistory ? "" : "box-pad-v-m"
        } fit-container`}
        style={{
          transition: ".2s ease-in-out",
          overflow: "visible",
          paddingBottom: 0,
        }}
      >
        <div className="fit-container fx-scattered">
          <div className="fx-centered fx-start-h ">
            <UserProfilePic
              size={isHistory ? 40 : 30}
              mainAccountUser={false}
              user_id={user.pubkey}
              img={user.picture}
              metadata={user}
            />
            <div>
              <div className="fx-centered fit-container fx-start-h">
                <p className={isHistory ? "" : "p-medium"}>
                  {user.display_name || user.name}
                </p>
                {isNip05Verified && <div className="checkmark-c1"></div>}
              </div>
              <p className="p-medium gray-c">
                @{user.name || user.display_name}
              </p>
            </div>
            {isLikedByAuthor && (
              <div className="sticker sticker-small sticker-normal sticker-gray-black">
                {t("AAECdsg")}
              </div>
            )}
          </div>
          <p className="gray-c p-medium">
            <Date_ toConvert={new Date(event.created_at * 1000)} time={true} />
          </p>
        </div>
        <div
          className={`fx-centered fx-col fit-container note-indent-2 ${
            hasReplies ? "reply-side-border-2" : ""
          }`}
          style={{
            // marginLeft: "1rem",
            // marginLeft: ".39rem",
            // paddingLeft: "1.5rem",
            paddingTop: "1rem",
            paddingBottom: isHistory ? "1rem" : "unset",
            // borderLeft: hasReplies ? "1px solid var(--dim-gray)" : "",
          }}
        >
          <div className="fit-container pointer" onClick={onClick}>
            {showTranslation ? translatedNote : event.note_tree}
          </div>
          {event.isCollapsedNote && (
            <div
              className="fit-container fx-centered fx-start-h pointer"
              style={{ paddingTop: ".5rem" }}
              onClick={onClick}
            >
              <p className="c1-c">... {t("AnWFKlu")}</p>
            </div>
          )}
          {isTransEnabled && (
            <div className="fit-container" style={{ paddingTop: ".5rem" }}>
              {!isNoteTranslating && !showTranslation && (
                <p className="btn-text-gray pointer" onClick={translateNote}>
                  {t("AdHV2qJ")}
                </p>
              )}
              {!isNoteTranslating && showTranslation && (
                <p
                  className="btn-text-gray pointer"
                  onClick={() => setShowTranslation(false)}
                >
                  {t("AE08Wte")}
                </p>
              )}
              {isNoteTranslating && <LoadingDots />}
            </div>
          )}
          {!noReactions && (
            <div className="fx-scattered fit-container">
              <div className="fx-centered" style={{ columnGap: "16px" }}>
                <div className="fx-centered">
                  <div className="icon-tooltip" data-tooltip={t("ADHdLfJ")}>
                    <div
                      className="comment-24"
                      onClick={() => setToggleComment(!toggleComment)}
                    ></div>
                  </div>
                  <div>
                    <p>{postActions.replies.replies.length}</p>
                  </div>
                </div>
                <div className="fx-centered">
                  <Like isLiked={isLiked} event={event} actions={postActions} />
                  <div
                    className={`pointer icon-tooltip ${
                      isLiked ? "orange-c" : ""
                    } `}
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
                    <NumberShrink value={postActions.likes.likes.length} />
                  </div>
                </div>
                <div
                  className={`fx-centered pointer ${isLoading ? "flash" : ""}`}
                  style={{ columnGap: "8px" }}
                >
                  <Repost
                    isReposted={isReposted}
                    event={event}
                    actions={postActions}
                  />
                  <div
                    className={`icon-tooltip ${isReposted ? "orange-c" : ""} `}
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
                    <NumberShrink value={postActions.reposts.reposts.length} />
                  </div>
                </div>
                <div className="fx-centered">
                  <Quote
                    isQuoted={isQuoted}
                    event={event}
                    actions={postActions}
                  />
                  <div
                    className={`pointer icon-tooltip ${
                      isQuoted ? "orange-c" : ""
                    }`}
                    data-tooltip={t("AWmDftG")}
                    onClick={(e) => {
                      e.stopPropagation();
                      postActions.quotes.quotes.length > 0 &&
                        setUsersList({
                          title: t("AO0OqWT"),
                          list: postActions.quotes.quotes.map(
                            (item) => item.pubkey
                          ),
                          extras: [],
                        });
                    }}
                  >
                    <NumberShrink value={postActions.quotes.quotes.length} />
                  </div>
                </div>
                <div className="fx-centered">
                  <div className="icon-tooltip" data-tooltip={t("AtGAGPY")}>
                    <Zap
                      user={user}
                      event={event}
                      actions={postActions}
                      isZapped={isZapped}
                    />
                  </div>
                  <div
                    className={`pointer icon-tooltip ${
                      isZapped ? "orange-c" : ""
                    }`}
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
              <OptionsDropdown
                options={[
                  <div onClick={copyID} className="pointer">
                    <p>{t("AYFAFKs")}</p>
                  </div>,
                  userKeys && userKeys.pub !== event.pubkey && (
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
                      title={user.display_name || user.name}
                      description={event.content}
                      kind={1}
                      shareImgData={{
                        post: event,
                        author: user,
                        label: t("Az5ftet"),
                      }}
                    />
                  </div>,
                  event.pubkey !== userKeys.pub && (
                    <div onClick={muteUnmute} className="pointer">
                      {isMuted ? (
                        <p className="red-c">{t("AKELUbQ")}</p>
                      ) : (
                        <p className="red-c">{t("AGMxuQ0")}</p>
                      )}
                    </div>
                  ),
                ]}
              />
            </div>
          )}
          {toggleComment && (
            <Comments
              exit={() => setToggleComment(false)}
              noteTags={event.tags}
              replyId={event.id}
              replyPubkey={event.pubkey}
              actions={postActions}
            />
          )}
        </div>
      </div>
    </div>
  );
}
