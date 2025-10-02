import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import UserProfilePic from "./UserProfilePic";
import Date_ from "../Date_";
import BookmarkEvent from "./BookmarkEvent";
import { getEmptyuserMetadata } from "../../Helpers/Encryptions";
import ShareLink from "../ShareLink";

import { useSelector } from "react-redux";
import { getUser } from "../../Helpers/Controlers";
import OptionsDropdown from "./OptionsDropdown";
import DynamicIndicator from "../DynamicIndicator";
import { customHistory } from "../../Helpers/History";
import { copyText } from "../../Helpers/Helpers";
import { useTranslation } from "react-i18next";
import { NDKUser } from "@nostr-dev-kit/ndk";
import { ndkInstance } from "../../Helpers/NDKInstance";
import useRepEventStats from "../../Hooks/useRepEventStats";
import Like from "../Reactions/Like";
import NumberShrink from "../NumberShrink";
import Quote from "../Reactions/Quote";
import Zap from "../Reactions/Zap";
import ShowUsersList from "./ShowUsersList";
import ZapAd from "./ZapAd";
import RepEventCommentsSection from "./RepEventCommentsSection";
import EventOptions from "../ElementOptions/EventOptions";

const checkFollowing = (list, toFollowKey) => {
  if (!list) return false;
  return list.find((people) => people[1] === toFollowKey) ? true : false;
};

const getURL = (item, isNip05Verified) => {
  if (!isNip05Verified) {
    if (item.kind === 30023) return `/article/${item.naddr}`;
    if ([30004, 30005].includes(item.kind)) return `/curations/${item.naddr}`;
    if ([34235, 34236].includes(item.kind)) return `/videos/${item.naddr}`;
  }
  if (item.kind === 30023) return `/article/${isNip05Verified}/${item.d}`;
  if (item.kind === 30004) return `/curations/a/${isNip05Verified}/${item.d}`;
  if (item.kind === 30005) return `/curations/v/${isNip05Verified}/${item.d}`;
  if ([34235, 34236].includes(item.kind))
    return `/videos/${isNip05Verified}/${item.d}`;
};

export default function RepEventPreviewCard({
  item,
  border = true,
  minimal = false,
}) {
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const userFollowings = useSelector((state) => state.userFollowings);
  const { t } = useTranslation();
  const [authorData, setAuthorData] = useState(
    getEmptyuserMetadata(item.pubkey)
  );
  const [showContent, setShowContent] = useState(!item.contentSensitive);
  const [isNip05Verified, setIsNip05Verified] = useState(false);

  const isFollowing = useMemo(() => {
    return checkFollowing(userFollowings, item.pubkey);
  }, [userFollowings]);
  const url = useMemo(() => {
    return getURL(item, isNip05Verified);
  }, [isNip05Verified]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let auth = getUser(item.pubkey);
        if (auth) {
          setAuthorData(auth);
          let ndkUser = new NDKUser({ pubkey: item.pubkey });
          ndkUser.ndk = ndkInstance;
          let checknip05 = auth.nip05
            ? await ndkUser.validateNip05(auth.nip05)
            : false;

          if (checknip05) setIsNip05Verified(auth.nip05);
        }
        return;
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [nostrAuthors]);

  if (minimal)
    return (
      <>
        <div
          className={
            "fit-container fx-scattered  fx-col sc-s-18 bg-img cover-bg pointer"
          }
          onClick={(e) => {
            e.stopPropagation();
            customHistory.push(url);
          }}
          style={{
            position: "relative",
            gap: "0",
            width: "200px",
            aspectRatio: "1/1.2",
          }}
        >
          <div
            className="fx-centered fit-container bg-img cover-bg"
            style={{
              height: "45%",
              backgroundImage: `url(${item.image || item.imagePP})`,
            }}
          >
            {item.kind === 34235 && <div className="play-vid-58"></div>}
          </div>
          <div
            className="fx-scattered fx-start-v fit-container fx-col  box-pad-v-s"
            style={{
              height: "55%",
              backgroundColor: "var(--white)",
            }}
          >
            <div className="fit-container fx-centered fx-col fx-start-h fx-start-v">
              <div className="fx-scattered fit-container">
                <div className="fx-centered box-pad-h-m">
                  <AuthorPreviewMinimal
                    author={authorData}
                    item={item}
                    isNip05Verified={isNip05Verified}
                  />
                </div>
              </div>
              <p className="p-two-lines box-pad-h-m">{item.title}</p>
            </div>
            <div className="box-pad-h-m">
              <DynamicIndicator item={item} />
            </div>
          </div>
        </div>
      </>
    );
  return (
    <>
      <div
        className={"fit-container fx-scattered box-pad-h-m mediacard"}
        onClick={(e) => e.stopPropagation()}
        style={{
          border: "none",
          position: "relative",
          overflow: "visible",
          columnGap: "16px",
          paddingBottom: "1rem",
          borderBottom: border ? "1px solid var(--very-dim-gray)" : "",
        }}
      >
        {!showContent && (
          <div className="rvl-btn sc-s-18">
            <p className="box-pad-v-m gray-c">{t("AhqN9mg")}</p>
            <button
              className="btn-small btn-normal"
              onClick={() => setShowContent(true)}
            >
              {t("A9VKdry")}
            </button>
          </div>
        )}
        <div
          className="fx-scattered fit-container fx-col"
          style={{ columnGap: "32px" }}
        >
          <div className="fit-container">
            <div className="fx-scattered box-pad-v-m">
              <div className="fx-centered">
                <AuthorPreview
                  author={authorData}
                  item={item}
                  isNip05Verified={isNip05Verified}
                />
                {isFollowing && (
                  <div
                    className="round-icon-small round-icon-tooltip"
                    data-tooltip={t("A9TqNxQ")}
                  >
                    <div className="user-followed"></div>
                  </div>
                )}
              </div>
            </div>
            <Link
              to={url}
              style={{ columnGap: "16px" }}
              className="fit-container fx-scattered"
            >
              <div style={{ width: "max(70%, 800px)" }} dir={item.dir}>
                <div className="fx-scattered">
                  <h4
                    className="p-three-lines"
                    style={{ fontSize: "24px", lineHeight: "130%" }}
                  >
                    {item.title}
                  </h4>
                </div>
                <div className="box-pad-v-s ">
                  <p className="p-three-lines gray-c fit-container">
                    {item.description || (
                      <span className="p-italic ">{t("AtZrjns")}</span>
                    )}
                  </p>
                </div>
              </div>
              <div
                className="bg-img cover-bg sc-s"
                style={{
                  backgroundColor:
                    "linear-gradient(93deg, #880185 -6.44%, #FA4EFF 138.71%)",
                  backgroundImage: `url(${
                    item.image || authorData.picture || item.imagePP
                  })`,
                  width: "max(30%,200px)",
                  aspectRatio: "1/1",
                  border: "none",
                  position: "relative",
                }}
              >
                {item.kind === 34235 && (
                  <div
                    className="fx-centered"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <div className="play-vid-58"></div>
                  </div>
                )}
              </div>
            </Link>
          </div>
          <Reactions post={item} author={authorData} url={url} />
        </div>
      </div>
    </>
  );
}

const AuthorPreview = ({ author, item, isNip05Verified }) => {
  return (
    <div className="fx-centered fx-start-h ">
      <UserProfilePic
        size={40}
        mainAccountUser={false}
        user_id={author.pubkey}
        img={author.picture}
      />
      <div>
        <div className="fx-centered fx-start-h" style={{ gap: "3px" }}>
          <p className="p-bold">{author.display_name || author.name}</p>
          {isNip05Verified && <div className="checkmark-c1"></div>}
        </div>
        <DynamicIndicator item={item} />
      </div>
    </div>
  );
};
const AuthorPreviewMinimal = ({ author, isNip05Verified }) => {
  return (
    <div className="fx-centered fx-start-h ">
      <UserProfilePic
        size={16}
        mainAccountUser={false}
        user_id={author.pubkey}
        img={author.picture}
      />

      <div className="fx-centered  fx-start-h" style={{ gap: "3px" }}>
        <p className="p-bold p-medium p-one-line">
          {author.display_name || author.name}
        </p>
        {isNip05Verified && <div className="checkmark-c1"></div>}
      </div>
    </div>
  );
};

const Reactions = ({ post, author, url }) => {
  const { t } = useTranslation();
  const { postActions } = useRepEventStats(post.aTag, post.pubkey);
  const userKeys = useSelector((state) => state.userKeys);
  const [usersList, setUsersList] = useState(false);
  const [showCommentsSection, setShowCommentsSections] = useState(false);

  const isLiked = useMemo(() => {
    return userKeys
      ? postActions.likes.likes.find((post) => post.pubkey === userKeys.pub)
      : false;
  }, [postActions, userKeys]);
  const isQuoted = useMemo(() => {
    return userKeys
      ? postActions.quotes.quotes.find((post) => post.pubkey === userKeys.pub)
      : false;
  }, [postActions, userKeys]);
  const isZapped = useMemo(() => {
    return userKeys
      ? postActions.zaps.zaps.find((post) => post.pubkey === userKeys.pub)
      : false;
  }, [postActions, userKeys]);

  return (
    <>
      {usersList && (
        <ShowUsersList
          exit={() => setUsersList(false)}
          title={usersList.title}
          list={usersList.list}
          extras={usersList.extras}
          extrasType={usersList.extrasType}
        />
      )}
      {showCommentsSection && (
        <div
          className="fixed-container fx-centered fx-start-v"
          onClick={(e) => {
            e.stopPropagation();
            setShowCommentsSections(false);
          }}
        >
          <div
            className="main-middle vox-pad-h fx-centered fx-col fx-start-v fx-start-h sc-s-18 bg-sp"
            style={{
              overflow: "scroll",
              scrollBehavior: "smooth",
              height: "100vh",
              // width: "min(100%, 550px)",
              position: "relative",
              borderRadius: 0,
              gap: 0,
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <RepEventCommentsSection
              id={post.aTag}
              author={author}
              eventPubkey={post.pubkey}
              leaveComment={showCommentsSection.comment}
              exit={() => setShowCommentsSections(false)}
              kind={post.kind}
              event={post}
            />
          </div>
        </div>
      )}
      <div
        className="fit-container fx-centered fx-col box-pad-v-s"
        style={{ gap: "10px" }}
      >
        {postActions?.zaps?.zaps?.length > 0 && (
          <ZapAd
            zappers={postActions.zaps.zaps}
            onClick={() =>
              setUsersList({
                title: t("AVDZ5cJ"),
                list: postActions.zaps.zaps.map((item) => item.pubkey),
                extras: postActions.zaps.zaps,
              })
            }
            margin={false}
          />
        )}
        <div className="fit-container fx-scattered">
          <div className="fx-centered" style={{ gap: "18px" }}>
            <div className="fx-centered  pointer">
              <div
                data-tooltip={t("ADHdLfJ")}
                className={`pointer round-icon-tooltip ${
                  isZapped ? "orange-c" : ""
                }`}
                onClick={() => setShowCommentsSections({ comment: true })}
              >
                <div className="comment-24"></div>
              </div>
              <div
                data-tooltip={t("AMBxvKP")}
                className={`pointer round-icon-tooltip `}
                onClick={() => setShowCommentsSections({ comment: false })}
              >
                <p>{postActions.replies.replies.length}</p>
              </div>
            </div>
            <div className="fx-centered">
              <Like
                isLiked={isLiked}
                event={post}
                actions={postActions}
                tagKind={"a"}
              />
              <div
                className={`pointer round-icon-tooltip ${
                  isLiked ? "orange-c" : ""
                }`}
                data-tooltip={t("Alz0E9Y")}
                onClick={(e) => {
                  e.stopPropagation();
                  postActions.likes.likes.length > 0 &&
                    setUsersList({
                      title: t("Alz0E9Y"),
                      list: postActions.likes.likes.map((item) => item.pubkey),
                      extras: postActions.likes.likes,
                      extrasType: "reaction",
                    });
                }}
              >
                <NumberShrink value={postActions.likes.likes.length} />
              </div>
            </div>
            <div className="fx-centered  pointer">
              <Quote isQuoted={isQuoted} event={post} actions={postActions} />
              <div
                className={`round-icon-tooltip ${isQuoted ? "orange-c" : ""}`}
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
                <NumberShrink value={postActions.quotes.quotes.length} />
              </div>
            </div>
            <div className="fx-centered">
              <div className="round-icon-tooltip" data-tooltip={t("AtGAGPY")}>
                <Zap
                  user={author}
                  event={post}
                  actions={postActions}
                  isZapped={isZapped}
                />
              </div>
              <div
                data-tooltip={t("AO0OqWT")}
                className={`pointer round-icon-tooltip ${
                  isZapped ? "orange-c" : ""
                }`}
                onClick={() =>
                  postActions.zaps.total > 0 &&
                  setUsersList({
                    title: t("AVDZ5cJ"),
                    list: postActions.zaps.zaps.map((item) => item.pubkey),
                    extras: postActions.zaps.zaps,
                  })
                }
              >
                <NumberShrink value={postActions.zaps.total} />
              </div>
            </div>
          </div>
          <EventOptions
            event={post}
            eventActions={postActions}
            component="repEventsCard"
          />
        </div>
      </div>
    </>
  );
};
