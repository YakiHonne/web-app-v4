import React, { useEffect, useMemo, useState } from "react";
import relaysOnPlatform from "../../Content/Relays";
import { filterRelays } from "../../Helpers/Encryptions";
import LoadingDots from "../LoadingDots";
import LoginWithNostr from "./LoginWithNostr";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { redirectToLogin } from "../../Helpers/Helpers";

const FOLLOWING = <div className="user-followed-w-24"></div>;
const FOLLOW = <div className="user-to-follow-24"></div>;
const UNFOLLOW = <div className="user-to-unfollow-24"></div>;

const FOLLOWING_ = "Unfollow";
const FOLLOW_ = "Follow";
const TOFOLLOW = "To follow";
const TOUNFOLLOW = "To unfollow";
const UNFOLLOW_ = "Unfollow";

const checkFollowing = (list, toFollowKey) => {
  if (!list) return false;
  return list.find((people) => people === toFollowKey) ? true : false;
};

export default function Follow({
  toFollowKey,
  toFollowName,
  bulk = false,
  bulkList = [],
  setBulkList = null,
  size = "normal",
  icon = true,
  full = false,
}) {
  if (icon)
    return (
      <FollowIcon
        toFollowKey={toFollowKey}
        toFollowName={toFollowName}
        bulk={bulk}
        bulkList={bulkList}
        setBulkList={setBulkList}
        size={size}
      />
    );
  if (!icon)
    return (
      <FollowText
        toFollowKey={toFollowKey}
        toFollowName={toFollowName}
        bulk={bulk}
        bulkList={bulkList}
        setBulkList={setBulkList}
        size={size}
        full={full}
      />
    );
}

const FollowText = ({
  toFollowKey,
  toFollowName,
  bulk,
  bulkList,
  setBulkList,
  size,
  full,
}) => {
  const dispatch = useDispatch();
  const userMetadata = useSelector((state) => state.userMetadata);
  const userFollowings = useSelector((state) => state.userFollowings);
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const isPublishing = useSelector((state) => state.isPublishing);
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    setTags(
      userFollowings
        ? [...userFollowings, ...bulkList.map((item) => item.pubkey)]
        : [...bulkList.map((item) => item.pubkey)]
    );
  }, [userFollowings, toFollowKey, bulkList]);

  const isFollowing = useMemo(() => {
    let memo = checkFollowing(tags, toFollowKey);
    if (memo) {
      let memo_2 = bulkList.find((item) => item.pubkey === toFollowKey);
      if (memo_2) {
        return { status: memo_2.to_follow, bulk: true };
      }
      return { status: true, bulk: false };
    }
    return { status: false, bulk: false };
  }, [tags, toFollowKey]);

  const followUnfollow = async () => {
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
      let tempTags = Array.from(userFollowings || []);
      if (isFollowing.status) {
        let index = tempTags.findIndex((item) => item === toFollowKey);
        console.log(tempTags)
        tempTags.splice(index, 1);
      } else {
        tempTags.push(toFollowKey);
      }
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 3,
          content: "",
          tags: tempTags.map((p) => ["p", p]),
          allRelays: [...filterRelays(relaysOnPlatform, userRelays)],
        })
      );
      // setTags(tempTags);å
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  const handleBulkList = () => {
    let item = bulkList.find((item) => item.pubkey === toFollowKey);
    if (item) {
      setBulkList(bulkList.filter((item) => item.pubkey !== toFollowKey));
      return;
    }
    setBulkList([
      ...bulkList,
      {
        pubkey: toFollowKey,
        name: toFollowName || "yakihonne-user",
        to_follow: !isFollowing.status,
      },
    ]);
  };

  if (!userMetadata)
    return (
      <>
        <button
          className={`btn btn-normal  ${size === "small" ? "btn-small" : ""} ${full ? "btn-full" : ""}`}
          disabled={isLoading}
          onClick={() => redirectToLogin()}
        >
          {FOLLOW_}
        </button>
      </>
    );
  if (!toFollowKey || toFollowKey === userKeys.pub)
    return (
      <button
        className={`btn btn-disabled  ${size === "small" ? "btn-small" : ""} ${full ? "btn-full" : ""}`}
        disabled={isLoading}
      >
        {FOLLOW_}
      </button>
    );
  if (bulk)
    return (
      <button
        className={`btn ${size === "small" ? "btn-small" : ""} ${
          isFollowing.bulk
            ? `btn-green`
            // ? `${isFollowing.status ? "btn-gray" : "btn-normal"}`
            : `${isFollowing.status ? "btn-gray" : "btn-normal"}`
        } ${full ? "btn-full" : ""}`}
        style={{
          borderColor: isFollowing.bulk && !isFollowing.status ? "initial" : "",
          minWidth: "max-content"
        }}
        disabled={isLoading}
        onClick={handleBulkList}
      >
        {isLoading ? (
          <LoadingDots />
        ) : isFollowing.bulk ? (
          isFollowing.status ? (
            TOFOLLOW
          ) : (
            TOUNFOLLOW
          )
        ) : isFollowing.status ? (
          FOLLOWING_
        ) : (
          FOLLOW_
        )}
      </button>
    );

  return (
    <button
      className={`btn ${
        isFollowing.status ? "btn-gray" : "btn-normal"
      } ${size === "small" ? "btn-small" : ""} ${full ? "btn-full" : ""}`}
      disabled={isLoading}
      onClick={followUnfollow}
      data-tooltip={isFollowing.status ? "Unfollow" : "Follow"}
    >
      {isLoading ? <LoadingDots /> : isFollowing.status ? FOLLOWING_ : FOLLOW_}
    </button>
  );
};

const FollowIcon = ({
  toFollowKey,
  toFollowName,
  bulk,
  bulkList,
  setBulkList,
  size,
}) => {
  const dispatch = useDispatch();
  const userMetadata = useSelector((state) => state.userMetadata);
  const userFollowings = useSelector((state) => state.userFollowings);
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const isPublishing = useSelector((state) => state.isPublishing);
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    setTags(
      userFollowings
        ? [...userFollowings, ...bulkList.map((item) => item.pubkey)]
        : [...bulkList.map((item) => item.pubkey)]
    );
  }, [userFollowings, toFollowKey, bulkList]);

  const isFollowing = useMemo(() => {
    let memo = checkFollowing(tags, toFollowKey);
    if (memo) {
      let memo_2 = bulkList.find((item) => item.pubkey === toFollowKey);
      if (memo_2) {
        return { status: memo_2.to_follow, bulk: true };
      }
      return { status: true, bulk: false };
    }
    return { status: false, bulk: false };
  }, [tags, toFollowKey]);

  const followUnfollow = async () => {
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
      let tempTags = Array.from(userFollowings || []);
      if (isFollowing.status) {
        let index = tempTags.findIndex((item) => item === toFollowKey);
        tempTags.splice(index, 1);
      } else {
        tempTags.push(toFollowKey);
      }
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 3,
          content: "",
          tags: tempTags.map((p) => ["p", p]),
          allRelays: [...filterRelays(relaysOnPlatform, userRelays)],
        })
      );
      // setTags(tempTags);å
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  const handleBulkList = () => {
    let item = bulkList.find((item) => item.pubkey === toFollowKey);
    if (item) {
      setBulkList(bulkList.filter((item) => item.pubkey !== toFollowKey));
      return;
    }
    setBulkList([
      ...bulkList,
      {
        pubkey: toFollowKey,
        name: toFollowName || "yakihonne-user",
        to_follow: !isFollowing.status,
      },
    ]);
  };

  if (!userMetadata)
    return (
      <>
        <div
          className={`round-icon round-icon-tooltip btn-gst  ${
            size === "small" ? "round-icon-small" : ""
          }`}
          disabled={isLoading}
          onClick={() => redirectToLogin()}
          data-tooltip={"Login to follow"}
        >
          {FOLLOW}
        </div>
      </>
    );
  if (!toFollowKey || toFollowKey === userKeys.pub)
    return (
      <div
        className={`round-icon if-disabled  ${
          size === "small" ? "round-icon-small" : ""
        }`}
        disabled={isLoading}
      >
        {FOLLOW}
      </div>
    );
  if (bulk)
    return (
      <div
        className={`round-icon round-icon-tooltip ${
          size === "small" ? "round-icon-small" : ""
        } ${
          isFollowing.bulk
            ? `${isFollowing.status ? "btn-orange" : "btn-orange-gst"}`
            : `${isFollowing.status ? "btn-normal" : "btn-gst"}`
        }`}
        style={{
          borderColor: isFollowing.bulk && !isFollowing.status ? "initial" : "",
        }}
        disabled={isLoading}
        data-tooltip={
          isFollowing.bulk
            ? `${
                isFollowing.status ? "Pending to follow" : "Pending to unfollow"
              }`
            : `${isFollowing.status ? "Unfollow" : "Follow"}`
        }
        onClick={handleBulkList}
      >
        {isLoading ? (
          <LoadingDots />
        ) : isFollowing.bulk ? (
          isFollowing.status ? (
            FOLLOW
          ) : (
            UNFOLLOW
          )
        ) : isFollowing.status ? (
          FOLLOWING
        ) : (
          FOLLOW
        )}
      </div>
    );

  return (
    <div
      className={`round-icon round-icon-tooltip ${
        isFollowing.status ? "btn-normal" : "btn-gst"
      } ${size === "small" ? "round-icon-small" : ""}`}
      disabled={isLoading}
      onClick={followUnfollow}
      data-tooltip={isFollowing.status ? "Unfollow" : "Follow"}
    >
      {isLoading ? <LoadingDots /> : isFollowing.status ? FOLLOWING : FOLLOW}
    </div>
  );
};
