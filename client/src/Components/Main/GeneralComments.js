import React, { useState, useEffect, useMemo } from "react";
import { nip19 } from "nostr-tools";
import relaysOnPlatform from "../../Content/Relays";
import Date_ from "../Date_";
import LoadingDots from "../LoadingDots";
import LoginWithNostr from "./LoginWithNostr";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import {
  extractNip19,
  getNoteTree,
  redirectToLogin,
} from "../../Helpers/Helpers";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { saveUsers } from "../../Helpers/DB";
import { getUser } from "../../Helpers/Controlers";

const filterRootComments = async (all) => {
  let temp = [];
  for (let comment of all) {
    if (!comment.tags.find((item) => item[0] === "e")) {
      let [content_tree, count] = await Promise.all([
        getNoteTree(comment.content.split(" — This is a comment on:")[0]),
        countReplies(comment.id, all),
      ]);
      temp.push({
        ...comment,
        content_tree,
        count,
      });
    }
  }
  return temp;
};

const countReplies = async (id, all) => {
  let count = [];

  for (let comment of all) {
    let ev = comment.tags.find(
      (item) => item[3] === "reply" && item[0] === "e" && item[1] === id
    );
    if (ev) {
      let cr = await countReplies(comment.id, all);
      count.push(comment, ...cr);
    }
  }
  let res = await Promise.all(
    count
      .sort((a, b) => a.created_at - b.created_at)
      .map(async (com) => {
        let content_tree = await getNoteTree(
          com.content.split(" — This is a comment on:")[0]
        );
        return {
          ...com,
          content_tree,
        };
      })
  );
  return res;
};

const getOnReply = (comments, comment_id) => {
  let tempCom = comments.find((item) => item.id === comment_id);
  return tempCom;
};

export default function GeneralComments({
  comments = [],
  aTag = "",
  refresh,
  setNetComments,
}) {
  const dispatch = useDispatch();
  const userMetadata = useSelector((state) => state.userMetadata);
  const userRelays = useSelector((state) => state.userRelays);
  const userKeys = useSelector((state) => state.userKeys);
  const isPublishing = useSelector((state) => state.isPublishing);

  const [mainComments, setMainComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [selectedComment, setSelectedComment] = useState(false);
  const [selectedCommentIndex, setSelectedCommentIndex] = useState(false);
  const [netComments, setNetComments_] = useState([]);
  const [showCommentBox, setShowCommentBox] = useState(
    netComments.length > 0 ? true : false
  );

  let aTagSplit = {
    kind: parseInt(aTag.split(":")[0]),
    pubkey: aTag.split(":")[1],
    identifier: aTag.split(":").splice(2, 100).join(":"),
    relays: relaysOnPlatform,
  };
  useEffect(() => {
    if (selectedComment) {
      let sC = netComments.find((item) => item.id === selectedComment.id);
      setSelectedComment(sC);
    }
    setNetComments(netComments);
    setShowCommentBox(netComments.length > 0 ? true : false);
  }, [netComments]);

  useEffect(() => {
    const parsedCom = async () => {
      let res = await filterRootComments(mainComments);
      setNetComments_(res);
    };
    parsedCom();
  }, [mainComments]);
  useEffect(() => {
    setMainComments(comments);
    saveUsers(comments.map((item) => item.pubkey));
  }, [comments]);

  const postNewComment = async () => {
    try {
      if (!userKeys || !newComment) {
        return;
      }
      if (isPublishing) {
        dispatch(
          setToast({
            type: 3,
            desc: "An event publishing is in process!",
          })
        );
        return;
      }
      setIsLoading(true);
      let extracted = extractNip19(newComment);
      let content = extracted.content;
      let tags = [
        ["a", aTag, "", "root"],
        ["p", aTagSplit.pubkey],
        ...extracted.tags,
      ];
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 1,
          content: content,
          tags,
          allRelays: userRelays,
        })
      );
      setIsLoading(false);
      setNewComment("");
    } catch (err) {
      console.log(err);
    }
  };

  const refreshRepleis = (index) => {
    let tempArray_1 = Array.from(mainComments);
    let tempArray_2 = Array.from(netComments[selectedCommentIndex].count);
    let idToDelete = tempArray_2[index].id;
    let indexToDelete = tempArray_1.findIndex((item) => item.id === idToDelete);
    // let tempArray_2 = Array.from(netComments[selectedCommentIndex].count);
    // tempArray_2.splice(index, 1);
    tempArray_1.splice(indexToDelete, 1);
    setMainComments(tempArray_1);
  };

  return (
    <>
      {showReplies && (
        <CommentsReplies
          refresh={refreshRepleis}
          comment={selectedComment}
          all={selectedComment.count}
          exit={() => {
            setShowReplies(false);
            setSelectedComment(false);
          }}
          aTag={aTag}
        />
      )}
      <div className="fit-container">
        {userKeys && showCommentBox && (
          <div className="fit-container fx-end-v fx-centered fx-col">
            <textarea
              className="txt-area ifs-full"
              placeholder="Comment on..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              className="btn btn-normal btn-full fx-centered"
              onClick={() => newComment && postNewComment()}
            >
              {isLoading && <LoadingDots />}
              {!isLoading && (
                <>
                  {" "}
                  Comment as{" "}
                  <UserProfilePicNOSTR mainAccountUser={true} size={28} />{" "}
                  {userMetadata.name}{" "}
                </>
              )}
            </button>
          </div>
        )}
        {!userKeys && showCommentBox && netComments.length > 0 && (
          <div className="fit-container fx-centered">
            <button
              className="btn btn-normal fx-centered"
              onClick={() => redirectToLogin()}
            >
              Login to comment
            </button>
          </div>
        )}
        {netComments.length == 0 && (
          <div
            className="fit-container fx-centered fx-col"
            style={{ height: "20vh" }}
          >
            <h4>No comments</h4>
            <p className="p-centered gray-c">
              Be first to comment on this article
            </p>
            <div className="comment-24"></div>
            {!showCommentBox && (
              <button
                className="btn btn-normal"
                onClick={() => setShowCommentBox(true)}
              >
                Post a comment
              </button>
            )}
            {!userKeys && showCommentBox && (
              <div className="fit-container fx-centered">
                <button
                  className="btn btn-normal fx-centered"
                  onClick={() => redirectToLogin()}
                >
                  Login to comment
                </button>
              </div>
            )}
          </div>
        )}

        {netComments.length > 0 && (
          <div className="fit-container fx-centered fx-start-h box-pad-v-m">
            <h4>
              {netComments.map((item) => item.count).flat().length +
                netComments.length}{" "}
              Comment(s)
            </h4>
          </div>
        )}
        <div
          className="fit-container fx-col fx-centered  fx-start-h"
          style={{ maxHeight: "60vh", overflow: "scroll", overflowX: "hidden" }}
        >
          {netComments.map((comment, index) => {
            return (
              <Comment
                comment={comment}
                key={comment.id}
                refresh={refresh}
                index={index}
                onClick={() => {
                  setShowReplies(true);
                  setSelectedComment(comment);
                  setSelectedCommentIndex(index);
                }}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

const Comment = ({ comment, refresh, index, onClick, action = true }) => {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const isPublishing = useSelector((state) => state.isPublishing);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationPrompt, setConfirmationPrompt] = useState(false);

  const handleCommentDeletion = async () => {
    try {
      if (isPublishing) {
        dispatch(
          setToast({
            type: 3,
            desc: "An event publishing is in process!",
          })
        );
        return;
      }
      setIsLoading(true);
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 5,
          content: "This comment will be deleted!",
          tags: [["e", comment.id]],
          allRelays: userRelays,
        })
      );
      refresh(index);
      setIsLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      {confirmationPrompt && (
        <ToDeleteComment
          comment={comment}
          exit={(e) => {
            e.stopPropagation();
            setConfirmationPrompt(false);
          }}
          handleCommentDeletion={(e) => {
            e.stopPropagation();
            setConfirmationPrompt(false);
            handleCommentDeletion();
          }}
        />
      )}

      <div
        className={`fit-container box-pad-h box-pad-v sc-s-18 fx-centered fx-col fx-shrink  ${
          isLoading ? "flash" : ""
        }`}
        style={{
          backgroundColor: "var(--very-dim-gray)",
          border: "none",
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        <div className="fit-container fx-scattered fx-start-v">
          <div className="fx-centered" style={{ columnGap: "16px" }}>
            <AuthorPreview
              author={{
                author_img: "",
                author_name: comment.pubkey.substring(0, 20),
                author_pubkey: comment.pubkey,
                on: new Date(comment.created_at * 1000),
              }}
            />
          </div>
          {comment.pubkey === userKeys.pub && action && (
            <div
              className="fx-centered pointer"
              style={{ columnGap: "3px" }}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmationPrompt(true);
              }}
            >
              <div className="trash-24"></div>
            </div>
          )}
        </div>
        <div
          className="fx-centered fx-start-h fit-container"
          style={{ columnGap: "16px" }}
        >
          <div style={{ minWidth: "24px" }}></div>
          <div>{comment.content_tree}</div>
        </div>

        {action && (
          <div
            className="fx-centered fx-start-h fit-container pointer"
            style={{ columnGap: "16px" }}
            onClick={onClick}
          >
            <div style={{ minWidth: "24px" }}></div>
            <div className="fx-centered">
              <div className="comment-icon"></div>
              <p className="p-medium ">
                {comment.count.length}{" "}
                <span className="gray-c">Reply(ies)</span>{" "}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const Reply = ({ comment, refresh, index, all, setSelectReplyTo }) => {
  const dispatch = useDispatch();
  const userRelays = useSelector((state) => state.userRelays);
  const userKeys = useSelector((state) => state.userKeys);
  const isPublishing = useSelector((state) => state.isPublishing);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationPrompt, setConfirmationPrompt] = useState(false);
  const [seeReply, setSeeReply] = useState(false);

  const repliedOn = useMemo(() => {
    return getOnReply(
      all,
      comment.tags.find((item) => item[0] === "e" && item.length === 4)[1] || ""
    );
  }, [all]);

  const handleCommentDeletion = async () => {
    try {
      if (isPublishing) {
        dispatch(
          setToast({
            type: 3,
            desc: "An event publishing is in process!",
          })
        );
        return;
      }
      setIsLoading(true);
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 5,
          content: "This comment will be deleted!",
          tags: [["e", comment.id]],
          allRelays: userRelays,
        })
      );
      refresh(index);
      setIsLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      {confirmationPrompt && (
        <ToDeleteComment
          comment={comment}
          exit={(e) => setConfirmationPrompt(false)}
          handleCommentDeletion={() => {
            setConfirmationPrompt(false);
            handleCommentDeletion();
          }}
        />
      )}

      <div
        className={`fit-container box-pad-h box-pad-v sc-s-18 fx-centered fx-col fx-shrink  ${
          isLoading ? "flash" : ""
        }`}
        style={{
          backgroundColor: "var(--dim-gray)",
          border: "none",
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        <div className="fit-container fx-scattered fx-start-v">
          <div className="fx-centered" style={{ columnGap: "16px" }}>
            <AuthorPreview
              author={{
                author_img: "",
                author_name: comment.pubkey.substring(0, 20),
                author_pubkey: comment.pubkey,
                on: new Date(comment.created_at * 1000),
              }}
            />
          </div>
          {comment.pubkey === userKeys.pub && (
            <div
              className="fx-centered pointer"
              style={{ columnGap: "3px" }}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmationPrompt(true);
              }}
            >
              <div className="trash-24"></div>
            </div>
          )}
        </div>
        {repliedOn && (
          <div
            className="fx-start-h fx-centerd fit-container"
            // style={{ width: seeReply ? "100%" : "max-content" }}
          >
            <div
              className="fx-centered fit-container fx-start-h pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSeeReply(!seeReply);
              }}
            >
              <p className="c1-c p-medium">
                Replied to : {repliedOn.content.substring(0, 10)}... (See more)
              </p>
              <div
                className="arrow"
                style={{ transform: seeReply ? "rotate(180deg)" : "" }}
              ></div>
            </div>
            <div
              className="fit-container box-pad-v-s"
              style={{ display: seeReply ? "flex" : "none" }}
            >
              {" "}
              <Comment
                comment={{ ...repliedOn, count: [] }}
                action={false}
              />{" "}
            </div>
            <hr />
          </div>
        )}
        <div
          className="fx-centered fx-start-h fit-container"
          style={{ columnGap: "16px" }}
        >
          <div>{comment.content_tree}</div>
        </div>

        <div
          className="fx-centered fx-start-h fit-container"
          style={{ columnGap: "16px" }}
          onClick={() =>
            userKeys
              ? setSelectReplyTo({
                  id: comment.id,
                  pubkey: comment.pubkey,
                  content: comment.content,
                })
              : redirectToLogin()
          }
        >
          <p className="gray-c p-medium pointer btn-text">Reply</p>
        </div>
      </div>
    </>
  );
};

const AuthorPreview = ({ author }) => {
  const [authorData, setAuthorData] = useState("");
  const nostrAuthors = useSelector((state) => state.nostrAuthors);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let auth = getUser(author.author_pubkey);

        if (auth)
          setAuthorData({
            author_img: auth.picture,
            author_name: auth.name,
            author_pubkey: auth.pubkey,
          });
        return;
      } catch (err) {
        console.log(err);
      }
    };
    if (!authorData) fetchData();
  }, [nostrAuthors]);

  if (!authorData)
    return (
      <div className="fx-centered" style={{ opacity: ".5" }}>
        <UserProfilePicNOSTR
          size={24}
          ring={false}
          img={author.author_img}
          mainAccountUser={false}
          user_id={author.author_pubkey}
        />
        <div>
          <p className="gray-c p-medium">
            On <Date_ time={true} toConvert={author.on} />
          </p>
          <p className="p-one-line p-medium">
            By: <span className="c1-c">{author.author_name}</span>
          </p>
        </div>
      </div>
    );
  return (
    <>
      <UserProfilePicNOSTR
        size={24}
        ring={false}
        img={authorData.author_img}
        mainAccountUser={false}
        user_id={authorData.author_pubkey}
      />
      <div>
        <p className="gray-c p-medium">
          On <Date_ time={true} toConvert={author.on} />
        </p>
        <p className="p-one-line p-medium">
          By: <span className="c1-c">{authorData.author_name}</span>
        </p>
      </div>
    </>
  );
};

const ToDeleteComment = ({ comment, exit, handleCommentDeletion }) => {
  return (
    <div className="fixed-container fx-centered box-pad-h">
      <section
        className="box-pad-h box-pad-v sc-s fx-centered fx-col"
        style={{ position: "relative", width: "min(100%, 350px)" }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <h4 className="p-centered">
          Delete{" "}
          <span className="orange-c" style={{ wordBreak: "break-word" }}>
            "
            {comment.content
              .split(" — This is a comment on:")[0]
              .substring(0, 100)}
            "?
          </span>
        </h4>
        <p className="p-centered gray-c box-pad-v-m">
          Do you wish to delete this comment?
        </p>
        <div className="fit-container fx-centered">
          <button className="btn btn-normal fx" onClick={handleCommentDeletion}>
            Delete
          </button>
          <button className="btn btn-gst fx" onClick={exit}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
};

const CommentsReplies = ({ comment, exit, all, aTag, refresh }) => {
  const dispatch = useDispatch();
  const userMetadata = useSelector((state) => state.userMetadata);
  const userRelays = useSelector((state) => state.userRelays);
  const userKeys = useSelector((state) => state.userKeys);
  const isPublishing = useSelector((state) => state.isPublishing);

  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectReplyTo, setSelectReplyTo] = useState(false);
  const postNewComment = async () => {
    try {
      if (!userKeys || !newComment) {
        return;
      }
      if (isPublishing) {
        dispatch(
          setToast({
            type: 3,
            desc: "An event publishing is in process!",
          })
        );
        return;
      }
      setIsLoading(true);

      let extracted = extractNip19(newComment);
      let content = extracted.content;

      let tags = [
        ["a", aTag, "", "root"],
        ["p", aTag.split(":")[1]],
        ...extracted.tags,
      ];
      if (selectReplyTo) {
        tags.push(["p", selectReplyTo.pubkey]);
        tags.push(["e", selectReplyTo.id, "", "reply"]);
      }
      if (!selectReplyTo) {
        tags.push(["p", comment.pubkey]);
        tags.push(["e", comment.id, "", "reply"]);
      }

      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 1,
          content: content,
          tags,
          allRelays: userRelays,
        })
      );
      setIsLoading(false);
      setNewComment("");
      setSelectReplyTo(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <div className="fixed-container fx-centered">
        <div
          className="sc-s box-pad-h box-pad-v"
          style={{
            width: "min(100%, 500px)",
            maxHeight: "85vh",
            position: "relative",
            overflow: "scroll",
            overflowX: "hidden",
          }}
        >
          <div className="close" onClick={exit}>
            <div></div>
          </div>
          <Comment comment={comment} refresh={null} action={false} />
          <h5 className="box-pad-v-m">{comment.count.length} Reply(ies)</h5>
          <div
            className="fit-container fx-centered fx-col fx-start-h"
            style={{ maxHeight: "40vh", overflow: "scroll" }}
          >
            {all.map((comment, index) => {
              return (
                <Reply
                  comment={{ ...comment, count: [] }}
                  index={index}
                  all={all || []}
                  setSelectReplyTo={setSelectReplyTo}
                  key={comment.id}
                  refresh={refresh}
                />
              );
            })}
          </div>
          {userMetadata && (
            <div className="fit-container fx-end-v fx-centered fx-col">
              {selectReplyTo && (
                <div
                  className="fx-scattered fit-container sc-s-18 box-pad-h-m box-pad-v-s"
                  style={{ backgroundColor: "var(--dim-gray)", border: "none" }}
                >
                  <p className="c1-c p-medium">
                    Reply to: {selectReplyTo.content.substring(0, 20)}...
                  </p>
                  <div
                    className="pointer"
                    onClick={() => {
                      setSelectReplyTo(false);
                    }}
                  >
                    &#10005;
                  </div>
                </div>
              )}
              <textarea
                className="txt-area ifs-full"
                placeholder="Reply to comment.."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                className="btn btn-normal  fx-centered"
                onClick={() => newComment && postNewComment()}
              >
                {isLoading && <LoadingDots />}
                {!isLoading && (
                  <>
                    {" "}
                    Comment as{" "}
                    <UserProfilePicNOSTR
                      mainAccountUser={true}
                      size={28}
                    />{" "}
                    {userMetadata.name}{" "}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

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
