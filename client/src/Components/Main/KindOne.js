import React, { useEffect, useMemo, useState } from "react";
import {
  checkForLUDS,
  decodeBolt11,
  getBolt11,
  getEmptyEventStats,
  getEmptyuserMetadata,
  getParsedNote,
  getZapper,
  removeObjDuplicants,
} from "../../Helpers/Encryptions";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import Date_ from "../../Components/Date_";
import { useNavigate } from "react-router-dom";
import LoadingDots from "../LoadingDots";
import QuoteNote from "./QuoteNote";
import BookmarkEvent from "./BookmarkEvent";
import ShareLink from "../ShareLink";
import ZapTip from "./ZapTip";
import NumberShrink from "../NumberShrink";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { getUser } from "../../Helpers/Controlers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { NDKUser } from "@nostr-dev-kit/ndk";
import { useLiveQuery } from "dexie-react-hooks";
import { getEventStats, saveEventStats } from "../../Helpers/DB";
import OptionsDropdown from "./OptionsDropdown";
import useNoteStats from "../../Hooks/useNoteStats";
import Like from "../Reactions/Like";
import Repost from "../Reactions/Repost";
import Quote from "../Reactions/Quote";
import Zap from "../Reactions/Zap";
import Comments from "../Reactions/Comments";

export default function KindOne({ event, reactions = true, border = false }) {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const isPublishing = useSelector((state) => state.isPublishing);
  const userMutedList = useSelector((state) => state.userMutedList);
  const navigate = useNavigate();
  const [user, setUser] = useState(getEmptyuserMetadata(event.pubkey));
  const [isNip05Verified, setIsNip05Verified] = useState(false);
  const [toggleComment, setToggleComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usersList, setUsersList] = useState(false);
  const { postActions } = useNoteStats(event?.id, event?.pubkey);

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

  useEffect(() => {
    if (!isPublishing) {
      setIsLoading(false);
      setToggleComment(false);
    }
  }, [isPublishing]);

  const onClick = (e) => {
    e.stopPropagation();
    let isSelected = window.getSelection().toString();
    if (!reactions) {
      redirect(e);
      return;
    }
    if (isSelected) return null;
    navigate(`/notes/${event.nEvent}`);
  };

  const redirect = (e) => {
    e.stopPropagation();
    if (window.location.pathname.includes("/notes/"))
      navigate(`/notes/${event.nEvent}`);
    else window.location = `/notes/${event.nEvent}`;
  };

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
    navigator.clipboard.writeText(event.nEvent);
    dispatch(
      setToast({
        type: 1,
        desc: `Note ID was copied! 👏`,
      })
    );
  };

  return (
    <div
      className={`fit-container box-pad-h-m box-pad-v-m ${
        !reactions ? "sc-s-18" : ""
      }`}
      style={{
        backgroundColor: !toggleComment ? "" : "var(--c1-side)",
        transition: ".2s ease-in-out",
        overflow: "visible",
        borderBottom: border ? "1px solid var(--very-dim-gray)" : "",
      }}
    >
      {/* {showQuoteBox && (
        <QuoteNote note={event} exit={() => setShowQuoteBox(false)} />
      )} */}
      {usersList && (
        <ShowUsersList
          exit={() => setUsersList(false)}
          title={usersList.title}
          list={usersList.list}
          extras={usersList.extras}
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
        <div
          className="fit-container fx-scattered box-marg-s"
          onClick={onClick}
        >
          <div className="fx-centered fx-start-h ">
            <UserProfilePicNOSTR
              size={40}
              mainAccountUser={false}
              ring={false}
              user_id={user.pubkey}
              img={user.picture}
              metadata={user}
            />
            <div>
              <div className="fx-centered">
                <p className="p-bold">{user.display_name || user.name}</p>
                <p className="gray-c p-medium">&#8226;</p>
                <p className="gray-c p-medium">
                  <Date_
                    toConvert={new Date(event.created_at * 1000)}
                    time={true}
                  />
                </p>
              </div>
              <p
                className={`p-medium ${
                  isNip05Verified ? "orange-c round-icon-tooltip" : "gray-c"
                }`}
                data-tooltip="Verified nip05"
              >
                @{user.name || user.display_name}
              </p>
            </div>
          </div>
          {event.isFlashNews && (
            <div className="sticker sticker-gray-black">Paid</div>
          )}
        </div>
        <div
          className="fx-centered fx-col fit-container"
          style={{ paddingLeft: "32px" }}
        >
          <div className="fit-container" onClick={onClick}>
            {event.note_tree}
          </div>
        </div>
        {reactions && (
          <div
            className="fx-scattered fit-container"
            style={{ paddingTop: "1rem", paddingLeft: "32px" }}
          >
            <div className="fx-centered" style={{ columnGap: "32px" }}>
              <div className="fx-centered">
                <div className="icon-tooltip" data-tooltip="Leave a comment">
                  <div
                    className="comment-24"
                    onClick={() => setToggleComment(!toggleComment)}
                  ></div>
                </div>
                <div
                  className="icon-tooltip"
                  data-tooltip="See comments"
                  onClick={redirect}
                >
                  <p>{postActions.replies.replies.length}</p>
                  {/* <p>{comments.length}</p> */}
                </div>
              </div>
              <div className="fx-centered">
                {/* <div
                  className={"icon-tooltip"}
                  data-tooltip="React"
                  onClick={reactToNote}
                >
                  <div className={isLiked ? "heart-bold-24" : "heart-24"}></div>
                </div> */}
                <Like isLiked={isLiked} event={event} actions={postActions} />
                <div
                  className={`icon-tooltip ${isLiked ? "orange-c" : ""}`}
                  data-tooltip="Reactions from"
                  onClick={(e) => {
                    e.stopPropagation();
                    postActions.likes.likes.length > 0 &&
                      setUsersList({
                        title: "Reactions from",
                        list: postActions.likes.likes.map(
                          (item) => item.pubkey
                        ),
                        extras: [],
                      });
                  }}
                >
                  <NumberShrink value={postActions.likes.likes.length} />
                  {/* <NumberShrink value={reactions_.length} /> */}
                </div>
              </div>
              <div
                className={`fx-centered pointer ${isLoading ? "flash" : ""}`}
                style={{ columnGap: "8px" }}
              >
                {/* <div
                  className={"icon-tooltip"}
                  data-tooltip="Repost note"
                  onClick={repostNote}
                >
                  <div
                    className={
                      isReposted ? "switch-arrows-bold-24" : "switch-arrows-24"
                    }
                  ></div>
                </div> */}
                <Repost
                  isReposted={isReposted}
                  event={event}
                  actions={postActions}
                />
                <div
                  className={`icon-tooltip ${isReposted ? "orange-c" : ""}`}
                  data-tooltip="Reposts from"
                  onClick={(e) => {
                    e.stopPropagation();
                    postActions.reposts.reposts.length > 0 &&
                      setUsersList({
                        title: "Reposts from",
                        list: postActions.reposts.reposts.map(
                          (item) => item.pubkey
                        ),
                        extras: [],
                      });
                  }}
                >
                  <NumberShrink value={postActions.reposts.reposts.length} />
                  {/* <NumberShrink value={reposts.length} /> */}
                </div>
              </div>
              <div className="fx-centered">
                {/* <div className="icon-tooltip" data-tooltip="Quote note">
                  <div
                    className={
                      isQuoted ? "quote-bold-24 pointer" : "quote-24 pointer"
                    }
                    onClick={() => setShowQuoteBox(!showQuoteBox)}
                  ></div>
                </div> */}
                <Quote
                  isQuoted={isQuoted}
                  event={event}
                  actions={postActions}
                />
                <div
                  className={`icon-tooltip ${isQuoted ? "orange-c" : ""}`}
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
                  {/* <NumberShrink value={quotes.length} /> */}
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
                  {/* <ZapTip
                    recipientLNURL={checkForLUDS(user.lud06, user.lud16)}
                    recipientPubkey={event.pubkey}
                    senderPubkey={userMetadata.pubkey}
                    recipientInfo={{
                      name: user.name,
                      picture: user.picture,
                    }}
                    eTag={event.id}
                    forContent={event.content.substring(0, 40)}
                    onlyIcon={true}
                  /> */}
                </div>
                <div
                  className={`icon-tooltip ${isZapped ? "orange-c" : ""}`}
                  data-tooltip="Zappers"
                  onClick={(e) => {
                    e.stopPropagation();
                    postActions.zaps.total > 0 &&
                      setUsersList({
                        title: "Zappers",
                        list: postActions.zaps.zaps.map((item) => item.pubkey),
                        extras: [],
                      });
                  }}
                >
                  <NumberShrink value={postActions.zaps.total} />
                  {/* <NumberShrink value={zapsCount} /> */}
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
                  <div
                    onClick={muteUnmute}
                    className="fit-container fx-scattered pointer"
                  >
                    {isMuted ? (
                      <p className="red-c">Unmute user</p>
                    ) : (
                      <p className="red-c">Mute user</p>
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
        )}
      </div>
      {toggleComment && (
        // <div
        //   className="fit-container fx-centered fx-start-v slide-up"
        //   style={{ paddingTop: ".5rem" }}
        // >
        //   <UserProfilePicNOSTR
        //     size={48}
        //     mainAccountUser={true}
        //     allowClick={false}
        //     ring={false}
        //   />
        //   <div className="fit-container fx-centered fx-wrap">
        //     <div className="fit-container">
        //       <textarea
        //         // type="text"
        //         className="txt-area ifs-full if "
        //         placeholder="Comment on this note"
        //         value={comment}
        //         onChange={(e) => setComment(e.target.value)}
        //         disabled={isLoading}
        //       />
        //     </div>
        //     <div className="fx-centered fit-container fx-end-h">
        //       <button
        //         className="btn btn-gst-red btn-small"
        //         onClick={() => setToggleComment(!toggleComment)}
        //         disabled={isLoading}
        //       >
        //         {isLoading ? <LoadingDots /> : "Cancel"}
        //       </button>
        //       <button
        //         className="btn btn-normal btn-small"
        //         onClick={commentNote}
        //         disabled={isLoading}
        //       >
        //         {isLoading ? <LoadingDots /> : "Post"}
        //       </button>
        //     </div>
        //   </div>
        // </div>
        <Comments
          exit={() => setToggleComment(false)}
          replyId={event.id}
          replyPubkey={event.pubkey}
          actions={postActions}
        />
      )}
    </div>
  );
}

// export default function KindOne({ event, reactions = true }) {
//   return null
// }
