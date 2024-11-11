import React, { useEffect, useState } from "react";
import { getNoteTree } from "../../Helpers/Helpers";
import NotesComment from "./NotesComment";
import { getParsedNote } from "../../Helpers/Encryptions";
import { useSelector } from "react-redux";
import { getSubData } from "../../Helpers/Controlers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { saveUsers } from "../../Helpers/DB";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import Comments from "../Reactions/Comments";
import LoadingDots from "../LoadingDots";
import LoadingLogo from "../LoadingLogo";
import { Link } from "react-router-dom";

const filterComments = (all, id, isRoot) => {
  if (isRoot) return filterRootComments(all);
  return filterRepliesComments(all, id);
};
const filterRepliesComments = async (all, id) => {
  let temp = [];
  for (let comment of all) {
    if (
      comment.tags.find(
        (item) =>
          item[0] === "e" &&
          item[1] === id &&
          ["reply", "root"].includes(item[3])
      )
    ) {
      let [note_tree, replies] = await Promise.all([
        getParsedNote(comment),
        countReplies(comment.id, all),
      ]);
      temp.push({
        ...note_tree,
        replies,
      });
    }
  }
  return temp;
};

const filterRootComments = async (all) => {
  let temp = [];

  for (let comment of all) {
    if (!comment.tags.find((item) => item[0] === "e" && item[3] === "reply")) {
      let [note_tree, replies] = await Promise.all([
        getParsedNote(comment),
        countReplies(comment.id, all),
      ]);
      temp.push({
        ...note_tree,
        replies,
      });
    }
  }
  return temp;
};

const countReplies = async (id, all) => {
  let replies = [];

  for (let comment of all) {
    let ev = comment.tags.find(
      (item) => item[3] === "reply" && item[0] === "e" && item[1] === id
    );
    if (ev) {
      let nestedReplies = await countReplies(comment.id, all);
      let _ = await getParsedNote(comment);
      // let note_tree = await getNoteTree(
      //   comment.content.split(" — This is a comment on:")[0]
      // );
      replies.push({
        ..._,
        // note_tree,
        replies: nestedReplies,
      });
    }
  }

  replies.sort((a, b) => b.created_at - a.created_at);

  return replies;
};

export default function CommentsSection({
  id,
  eventPubkey,
  postActions,
  author,
  isRoot,
  tagKind = "e",
  kind = "note",
  leaveComment = false,
}) {
  const userKeys = useSelector((state) => state.userKeys);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWriteNote, setShowWriteNote] = useState(leaveComment);
  const [netComments, setNetComments] = useState([]);

  useEffect(() => {
    let parsedCom = async () => {
      let res = await filterComments(comments, id, isRoot);

      setNetComments(res);
      if (res.length !== 0) setIsLoading(false);
    };
    parsedCom();
  }, [comments]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const events = await getSubData(
        [
          {
            kinds: [1],
            [`#${tagKind}`]: [id],
          },
        ],
        500
      );

      let tempEvents = events.data
        .map((event) => {
          let is_un = event.tags.find((tag) => tag[0] === "l");
          let is_comment = event.tags.find(
            (tag) => tag.length > 3 && ["root", "reply"].includes(tag[3])
          );
          let is_quote = event.tags.find((tag) => tag[0] === "q");
          let is_mention = event.tags.filter(
            (tag) => tag.length > 3 && tag[3] === "mention" && tag[1] === id
          );
          if (
            !(
              (is_un && is_un[1] === "UNCENSORED NOTE") ||
              (is_quote && !is_comment) ||
              (is_mention.length > 0 && !is_comment)
            )
          ) {
            return event;
          }
        })
        .filter((_) => _);

      if (tempEvents.length === 0) setIsLoading(false);
      setComments(tempEvents);
      saveUsers(events.pubkeys);
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (isLoading) return;
    const sub = ndkInstance.subscribe(
      [
        {
          kinds: [1],
          [`#${tagKind}`]: [id],
          since: Math.floor(Date.now() / 1000),
        },
      ],
      { cacheUsage: "CACHE_FIRST", groupable: false }
    );

    sub.on("event", (event) => {
      let is_un = event.tags.find((tag) => tag[0] === "l");
      let is_quote = event.tags.find((tag) => tag[0] === "q");
      if (!((is_un && is_un[1] === "UNCENSORED NOTE") || is_quote)) {
        setComments((prev) => {
          let newCom = [...prev, event.rawEvent()];
          return newCom.sort(
            (item_1, item_2) => item_2.created_at - item_1.created_at
          );
        });
        saveUsers([event.pubkey]);
      }
    });
    return () => {
      if (sub) sub.stop();
    };
  }, [isLoading]);

  return (
    <div className="fit-container fx-centered fx-col box-marg-s">
      {userKeys && (
        <>
          <hr />
          {!showWriteNote && (
            <div
              className="fit-container fx-centered fx-start-h  box-pad-h-m box-pad-v-m pointer"
              style={{
                overflow: "visible",
                // border: "1px solid var(--very-dim-gray)",
              }}
              onClick={() => setShowWriteNote(true)}
            >
              <UserProfilePicNOSTR
                size={40}
                mainAccountUser={true}
                ring={false}
              />
              <div className="sc-s-18 box-pad-h-m box-pad-v-s fit-container">
                <p className="gray-c">
                  Comment on {author.display_name || author.name}'s {kind}
                </p>
              </div>
            </div>
          )}
          {showWriteNote && (
            <div className="box-pad-v-m box-pad-h-m fit-container">
              <Comments
                exit={() => setShowWriteNote(false)}
                replyId={id}
                replyPubkey={eventPubkey}
                actions={postActions}
                kind={kind}
                tagKind={tagKind}
              />
            </div>
          )}
        </>
      )}
      {!userKeys && (
        <>
          <hr />
          <div className="fit-container fx-centered box-pad-v fx-col slide-up">
            <h4>Do you have thoughts?</h4>
            <p className="gray-c">Login to leave a comment</p>
            <Link to={"/login"}>
              <button className="btn btn-normal btn-small">Login</button>
            </Link>
          </div>
        </>
      )}
      <hr />
      <div
        className="fit-container fx-centered fx-col fx-start-h fx-start-v"
        style={{ gap: 0 }}
      >
        {netComments.length == 0 && !isLoading && (
          <div
            className="fit-container fx-centered fx-col"
            style={{ height: "20vh" }}
          >
            <h4>No comments</h4>
            <p className="p-centered gray-c">Nobody commented on this {kind}</p>
            <div className="comment-24"></div>
          </div>
        )}
        {isLoading && (
          <div
            style={{ height: "40vh" }}
            className="fit-container box-pad-h-m fit-height fx-centered"
          >
            <LoadingLogo size={64} />
            {/* <LoadingDots /> */}
          </div>
        )}
        {netComments.length > 0 && (
          <div
            className="fit-container fx-centered fx-start-h box-pad-h-m"
            style={{ paddingTop: "1rem" }}
          >
            <h4>Replies</h4>
          </div>
        )}
        {netComments.map((comment, index) => {
          return (
            <Comment
              comment={comment}
              key={comment.id}
              noteID={id}
              eventPubkey={author.pubkey}
              kind={"article"}
            />
          );
        })}
      </div>
    </div>
  );
}

const Comment = ({
  comment,
  eventPubkey,
  isReply = false,
  isReplyBorder = false,
}) => {
  return (
    <div
      className="fit-container"
      style={{ borderLeft: isReplyBorder ? "1px solid var(--dim-gray)" : "" }}
    >
      <NotesComment
        event={comment}
        rootNotePubkey={eventPubkey}
        hasReplies={comment.replies.length > 0}
        isReply={isReply}
        isReplyBorder={isReplyBorder}
      />
      {comment.replies.length > 0 && (
        <div className="fit-container fx-centered fx-end-h">
          <div
            className="fx-col fit-container fx-centered"
            style={{
              width: `calc(100% - 2.5rem)`,
              // width: `calc(100% - 1.875rem)`,
              gap: 0,
            }}
          >
            {comment.replies.map((comment_, index) => {
              return (
                <Comment
                  comment={comment_}
                  key={comment_.id}
                  eventPubkey={eventPubkey}
                  isReply={true}
                  isReplyBorder={index < comment.replies.length - 1}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
