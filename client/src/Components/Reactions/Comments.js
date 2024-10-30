import React, { useEffect, useState } from "react";
import UserProfilePicNOSTR from "../Main/UserProfilePicNOSTR";
import { useDispatch, useSelector } from "react-redux";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { getEventStatAfterEOSE, InitEvent } from "../../Helpers/Controlers";
import { saveEventStats } from "../../Helpers/DB";
import { extractNip19 } from "../../Helpers/Helpers";
import { setToPublish } from "../../Store/Slides/Publishers";
import LoadingDots from "../LoadingDots";

export default function Comments({
  noteTags = false,
  rootNoteID,
  rootNotePubkey,
  replyId,
  replyPubkey,
  exit,
  actions,
}) {
  const [comment, setComment] = useState("");
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const [isLoading, setIsLoading] = useState(false);
  const [eventID, setEventID] = useState(false);

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
      // if (rootNoteID) {
      //   tags.push(["e", rootNoteID, "", "root"]);
      //   tags.push(["e", replyId, "", "reply"]);
      //   tags.push(["p", rootNotePubkey]);
      //   tags.push(["p", replyPubkey]);
      // }
      // if (!rootNoteID) {
      //   tags.push(["e", replyId, "", "root"]);
      //   tags.push(["p", replyPubkey]);
      // }
      if (!noteTags) {
        tags.push(["e", replyId, "", "root"]);
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

  return (
    <div
      className="fit-container fx-centered fx-start-v slide-up"
      style={{ paddingTop: ".5rem" }}
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
            placeholder="Comment on this note"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="fx-centered fit-container fx-end-h">
          <button
            className="btn btn-gst-red btn-small"
            onClick={exit}
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
  );
}
