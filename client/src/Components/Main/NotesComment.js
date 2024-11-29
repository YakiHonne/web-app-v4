import React, { useEffect, useMemo, useRef, useState } from "react";
import { nip19 } from "nostr-tools";
import { getEmptyuserMetadata } from "../../Helpers/Encryptions";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import Date_ from "../../Components/Date_";
import QuoteNote from "./QuoteNote";
import BookmarkEvent from "./BookmarkEvent";
import ShareLink from "../ShareLink";
import NumberShrink from "../NumberShrink";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { getUser } from "../../Helpers/Controlers";
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
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const isPublishing = useSelector((state) => state.isPublishing);
  const userMutedList = useSelector((state) => state.userMutedList);

  const [user, setUser] = useState(getEmptyuserMetadata(event.pubkey));
  const [toggleComment, setToggleComment] = useState(false);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuoteBox, setShowQuoteBox] = useState(false);
  const [usersList, setUsersList] = useState(false);
  const [isNip05Verified, setIsNip05Verified] = useState(false);
  const { postActions } = useNoteStats(event.id, event.pubkey);

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

  // useEffect(() => {
  //   let tempPubkey = event.pubkey;
  //   let auth = getUser(tempPubkey);

  //   if (auth) {
  //     setUser(auth);
  //   }
  // }, [nostrAuthors]);
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
  useEffect(() => {
    if (!isPublishing) {
      setIsLoading(false);
      setToggleComment(false);
      setComment("");
    }
  }, [isPublishing]);

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
        desc: `Note ID was copied! 👏`,
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

  return (
    <div
      className={`fit-container box-pad-h-s ${isHistory ? "" : "box-pad-v-s"}`}
      style={{
        transition: ".2s ease-in-out",
        overflow: "visible",
        paddingBottom: 0,
        position: "relative",
        // borderLeft: isReplyBorder ? "1px solid var(--dim-gray)" : "",
      }}
    >
      {isReply && (
        <div
          className="reply-tail"
          // style={{ left: isReplyBorder ? ".5rem" : 0 }}
          style={{ left: isReplyBorder ? "-.0625rem" : 0 }}
        ></div>
      )}
      {showQuoteBox && (
        <QuoteNote note={event} exit={() => setShowQuoteBox(false)} />
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
            <UserProfilePicNOSTR
              size={isHistory ? 40 : 30}
              mainAccountUser={false}
              
              user_id={user.pubkey}
              img={user.picture}
              metadata={user}
            />
            <div>
              <div className="fx-centered">
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
                ♥︎ by author
              </div>
            )}
          </div>
          <p className="gray-c p-medium">
            <Date_ toConvert={new Date(event.created_at * 1000)} time={true} />
          </p>
        </div>
        <div
          className="fx-centered fx-col fit-container"
          style={{
            marginLeft: "1rem",
            // marginLeft: ".39rem",
            paddingLeft: "1.5rem",
            paddingTop: "1rem",
            paddingBottom: isHistory ? "1rem" : "unset",
            borderLeft: hasReplies ? "1px solid var(--dim-gray)" : "",
          }}
        >
          <div className="fit-container pointer" onClick={onClick}>
            {event.note_tree}
          </div>

          {!noReactions && (
            <div className="fx-scattered fit-container">
              <div className="fx-centered" style={{ columnGap: "16px" }}>
                <div className="fx-centered">
                  <div className="icon-tooltip" data-tooltip="Leave a comment">
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
                    <NumberShrink value={postActions.quotes.quotes.length} />
                  </div>
                </div>
                <div className="fx-centered">
                  <div className="icon-tooltip" data-tooltip="Tip note">
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
                    data-tooltip="Zappers"
                    onClick={(e) => {
                      e.stopPropagation();
                      postActions.zaps.total > 0 &&
                        setUsersList({
                          title: "Zappers",
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
                    <p>Copy note ID</p>
                  </div>,
                  userKeys && userKeys.pub !== event.pubkey && (
                    <>
                      <BookmarkEvent
                        label="Bookmark note"
                        pubkey={event.id}
                        kind={"1"}
                        itemType="e"
                      />
                    </>
                  ),
                  <div className="fit-container fx-centered fx-start-h pointer">
                    <ShareLink
                      label="Share note"
                      path={`/notes/${event.nEvent}`}
                      title={user.display_name || user.name}
                      description={event.content}
                      kind={1}
                      shareImgData={{
                        post: event,
                        author: user,
                        label: "Note",
                      }}
                    />
                  </div>,
                  event.pubkey !== userKeys.pub && (
                    <div onClick={muteUnmute} className="pointer">
                      {isMuted ? (
                        <p className="red-c">Unmute user</p>
                      ) : (
                        <p className="red-c">Mute user</p>
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
