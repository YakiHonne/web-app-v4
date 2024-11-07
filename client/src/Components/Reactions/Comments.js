import React, { useEffect, useRef, useState } from "react";
import UserProfilePicNOSTR from "../Main/UserProfilePicNOSTR";
import { useDispatch, useSelector } from "react-redux";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { getEventStatAfterEOSE, InitEvent } from "../../Helpers/Controlers";
import { saveEventStats } from "../../Helpers/DB";
import {
  extractNip19,
  getNoteDraft,
  updateNoteDraft,
} from "../../Helpers/Helpers";
import { setToPublish } from "../../Store/Slides/Publishers";
import LoadingDots from "../LoadingDots";
import { Link } from "react-router-dom";

export default function Comments({
  noteTags = false,
  replyId,
  replyPubkey,
  exit,
  actions,
  tagKind = "e",
  kind = "note",
}) {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const [comment, setComment] = useState("");
  const [showWarningBox, setShowWarningBox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eventID, setEventID] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (userKeys) {
      let draft_ = getNoteDraft(replyId);
      setComment(draft_);
    }
  }, [userKeys]);

  useEffect(() => {
    const updateDb = async () => {
      let subscription = ndkInstance.subscribe([{ ids: [eventID] }], {
        groupable: false,
        skipVerification: true,
        skipValidation: true,
      });
      subscription.on("event", (event_) => {
        let stats = getEventStatAfterEOSE(
          event_,
          "replies",
          actions,
          undefined
        );
        saveEventStats(replyId, stats);
        subscription.stop();
        setEventID(false);
      });
    };
    if (eventID) updateDb();
  }, [eventID]);

  const commentNote = async (e) => {
    e.stopPropagation();
    if (isLoading || !comment) return;

    try {
      setIsLoading(true);
      let extracted = extractNip19(comment);
      let content = extracted.content;
      let tags = [];
      if (noteTags) {
        tags = [
          ...tags,
          ...noteTags.filter(
            (tag) => tag[0] === "p" || (tag.length > 3 && tag[3] === "root")
          ),
        ];
        tags.push(["e", replyId, "", "reply"]);
        if (!tags.find((tag) => tag[0] === "p" && tag[1] === replyPubkey))
          tags.push(["p", replyPubkey]);
      }
      if (!noteTags) {
        tags.push([tagKind, replyId, "", "root"]);
        tags.push(["p", replyPubkey]);
      }

      tags = [...tags, ...extracted.tags];
      let eventInitEx = await InitEvent(1, content, tags);
      if (!eventInitEx) {
        setIsLoading(false);
        return;
      }
      dispatch(
        setToPublish({
          eventInitEx,
          allRelays: [],
        })
      );

      setIsLoading(false);
      setEventID(eventInitEx.id);
      exit();
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  const handleWriteComment = (e) => {
    let value = e.target.value;
    setComment(value);
    updateNoteDraft(replyId, value);
  };

  useEffect(() => {
    const handleOffClick = (e) => {
      e.stopPropagation();
      if (ref.current && !ref.current.contains(e.target) && !showWarningBox) {
        if (!comment) {
          exit();
        } else {
          setShowWarningBox(true)
        }
      }
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [ref, showWarningBox, comment]);

  const handleDiscard = (isSave) => {
    if(isSave) {
      exit()
    } else {
      updateNoteDraft(replyId, "");
      exit()
    }
  }

  if (!userKeys)
    return (
      <div className="fit-container fx-centered box-pad-v fx-col slide-up">
        <h4>Do you have thoughts?</h4>
        <p className="gray-c">Login to leave a comment</p>
        <Link to={"/login"}>
          <button className="btn btn-normal btn-small">Login</button>
        </Link>
      </div>
    );
  return (
    <>
      {showWarningBox && (
        <div className="fixed-container fx-centered box-pad-h">
          <div
            className="sc-s-18 bg-sp box-pad-h box-pad-v fx-centered"
            style={{ width: "min(100%, 450px)" }}
          >
            <div className="fx-centered fx-col">
              <h4>Save draft?</h4>
              <p className="gray-c p-centered box-pad-v-m">
                You're about to quit your editing, do you wish to save it as a draft?
              </p>
              <div className="fit-container fx-centered">
                <div className="fx-centered">
                  <button className="btn btn-gst-red" onClick={() => handleDiscard(false)}>Discard</button>
                  <button className="btn btn-gst" onClick={() => handleDiscard(true)}>Save & quit</button>
                </div>
                <div>
                  <button className="btn btn-normal" onClick={() => setShowWarningBox(false)}>Continue editing</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="fit-container fx-centered fx-start-v slide-up"
        style={{ paddingTop: ".5rem" }}
        ref={ref}
      >
        <UserProfilePicNOSTR
          size={48}
          mainAccountUser={true}
          allowClick={false}
          ring={false}
        />
        <div className="fit-container fx-centered fx-wrap">
          <div className="fit-container">
            <textarea
              // type="text"
              className="txt-area ifs-full if "
              placeholder={`Comment on this ${kind}`}
              value={comment}
              onChange={handleWriteComment}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="fx-centered fit-container fx-end-h">
            <button
              className="btn btn-gst-red btn-small"
              onClick={() => comment ? setShowWarningBox(true) : exit()} 
              // onClick={exit}
              disabled={isLoading}
            >
              {isLoading ? <LoadingDots /> : "Cancel"}
            </button>
            <button
              className="btn btn-normal btn-small"
              onClick={commentNote}
              disabled={isLoading}
            >
              {isLoading ? <LoadingDots /> : "Post"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
