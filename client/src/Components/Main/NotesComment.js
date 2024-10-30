import React, { useEffect, useMemo, useRef, useState } from "react";
import { nip19 } from "nostr-tools";
import {
  checkForLUDS,
  decodeBolt11,
  getBech32,
  getBolt11,
  getEmptyuserMetadata,
  getZapper,
} from "../../Helpers/Encryptions";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import { getNoteTree } from "../../Helpers/Helpers";
import Date_ from "../../Components/Date_";
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
import useNoteStats from "../../Hooks/useNoteStats";
import Comments from "../Reactions/Comments";
import Like from "../Reactions/Like";
import Repost from "../Reactions/Repost";
import Quote from "../Reactions/Quote";
import Zap from "../Reactions/Zap";
import OptionsDropdown from "./OptionsDropdown";

export default function NotesComment({
  noteTags,
  event,
  rootNoteID,
  rootNotePubkey,
  noReactions = false,
}) {
  const dispatch = useDispatch();
  const userMetadata = useSelector((state) => state.userMetadata);
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
  const [reactions_, setReactions] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [reposts, setReposts] = useState([]);
  const { postActions } = useNoteStats(event.id, event.pubkey);

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
    let tempPubkey = event.pubkey;
    let auth = getUser(tempPubkey);

    if (auth) {
      setUser(auth);
    }
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

  return (
    <div
      className={`fit-container ${
        "box-pad-h-s box-pad-v-s"
        // !toggleComment ? "" : "box-pad-h-s box-pad-v-s"
      }`}
      style={{
        // backgroundColor: !toggleComment ? "" : "var(--c1-side)",
        transition: ".2s ease-in-out",
        overflow: "visible",
        borderBottom: "1px solid var(--very-dim-gray)",
      }}
    >
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
        className="box-pad-h-m box-pad-v-m fit-container"
        style={{
          transition: ".2s ease-in-out",
          overflow: "visible",
        }}
      >
        <div className="fit-container fx-scattered box-marg-s">
          <div className="fx-centered fx-start-h ">
            <UserProfilePicNOSTR
              size={30}
              mainAccountUser={false}
              ring={false}
              user_id={user.pubkey}
              img={user.picture}
              metadata={user}
            />
            <div>
              <p className="p-medium">{user.display_name || user.name}</p>
              <p className="p-medium gray-c">
                @{user.name || user.display_name}
              </p>
            </div>
          </div>
          <p className="gray-c p-medium">
            <Date_ toConvert={new Date(event.created_at * 1000)} time={true} />
          </p>
        </div>
        <div
          className="fx-centered fx-col fit-container"
          style={{ paddingLeft: "32px" }}
        >
          <div className="fit-container">{event.note_tree}</div>
        </div>
        {!noReactions && (
          <div
            className="fx-scattered fit-container"
            style={{ paddingTop: "1rem", paddingLeft: "32px" }}
          >
            <div className="fx-centered" style={{ columnGap: "16px" }}>
              <div className="fx-centered">
                <div className="icon-tooltip" data-tooltip="Leave a comment">
                  <div
                    className="comment-icon"
                    onClick={() => setToggleComment(!toggleComment)}
                  ></div>
                </div>
                <div className="icon-tooltip" data-tooltip="Comments from">
                  <p className="p-medium">
                    {postActions.replies.replies.length}
                  </p>
                  {/* <p className="p-medium">{comments.length}</p> */}
                </div>
              </div>
              <div className="fx-centered">
                {/* <div
                  className={"icon-tooltip"}
                  data-tooltip="React"
                  onClick={reactToNote}
                >
                  <div className={isLiked ? "heart-bold" : "heart"}></div>
                </div> */}
                <Like isLiked={isLiked} event={event} actions={postActions} />
                <div
                  className={`icon-tooltip ${
                    isLiked ? "orange-c" : ""
                  } p-medium`}
                  data-tooltip="Reactions from"
                  onClick={(e) => {
                    e.stopPropagation();
                    reactions_.length > 0 &&
                      setUsersList({
                        title: "Reactions from",
                        list: reactions_.map((item) => item.pubkey),
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
                      isReposted ? "switch-arrows-bold" : "switch-arrows"
                    }
                  ></div>
                </div> */}
                <Repost
                  isReposted={isReposted}
                  event={event}
                  actions={postActions}
                />
                <div
                  className={`icon-tooltip ${
                    isReposted ? "orange-c" : ""
                  } p-medium`}
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
                  <NumberShrink value={postActions.reposts.reposts.length} />
                  {/* <NumberShrink value={reposts.length} /> */}
                </div>
              </div>
              <div className="fx-centered">
                {/* <div className="icon-tooltip" data-tooltip="Quote note">
                  <div
                    className={
                      isQuoted ? "quote-bold pointer" : "quote pointer"
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
                  className={`icon-tooltip ${
                    isQuoted ? "orange-c" : ""
                  } p-medium`}
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
                    smallIcon={true}
                  /> */}
                </div>
                <div
                  className={`icon-tooltip p-medium`}
                  data-tooltip="Zappers"
                  onClick={(e) => {
                    e.stopPropagation();
                    postActions.zaps.total > 0 &&
                      setUsersList({
                        title: "Zappers",
                        list: postActions.zaps.zaps,
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
            rootNoteID={rootNoteID}
            rootNotePubkey={rootNotePubkey}
            replyId={event.id}
            replyPubkey={event.pubkey}
            actions={postActions}
          />
        )}
      </div>
    </div>
  );
}
