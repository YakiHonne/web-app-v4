import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import LoadingScreen from "../../Components/LoadingScreen";
import { nip19 } from "nostr-tools";
import {
  getEmptyuserMetadata,
  getParsedRepEvent,
} from "../../Helpers/Encryptions";
import { Helmet } from "react-helmet";
import ArrowUp from "../../Components/ArrowUp";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import NumberShrink from "../../Components/NumberShrink";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import { Link } from "react-router-dom";
import Date_ from "../../Components/Date_";
import {
  getAuthPubkeyFromNip05,
  getVideoContent,
  getVideoFromURL,
} from "../../Helpers/Helpers";
import Follow from "../../Components/Main/Follow";
import AddArticleToCuration from "../../Components/Main/AddArticleToCuration";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "../../Helpers/Controlers";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { customHistory } from "../../Helpers/History";
import useRepEventStats from "../../Hooks/useRepEventStats";
import Like from "../../Components/Reactions/Like";
import Quote from "../../Components/Reactions/Quote";
import Zap from "../../Components/Reactions/Zap";
import RepEventCommentsSection from "../../Components/Main/RepEventCommentsSection";
import { setToPublish } from "../../Store/Slides/Publishers";
import Backbar from "../../Components/Main/Backbar";
import { useTranslation } from "react-i18next";
import PagePlaceholder from "../../Components/PagePlaceholder";
import bannedList from "../../Content/BannedList";
import ZapAd from "../../Components/Main/ZapAd";
import EventOptions from "../../Components/ElementOptions/EventOptions";
import useIsMute from "../../Hooks/useIsMute";

export default function Video() {
  const { id, AuthNip05, VidIdentifier } = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);

  const [video, setVideo] = useState(false);
  const [parsedAddr, setParsedAddr] = useState({});
  const [expandDescription, setExpandDescription] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [author, setAuthor] = useState({
    picture: "",
    name: "Video author",
    pubkey: "",
  });
  const [videoViews, setVideoViews] = useState(0);
  const [usersList, setUsersList] = useState(false);
  const [morePosts, setMorePosts] = useState([]);
  const [showAddArticleToCuration, setShowArticleToCuration] = useState(false);
  const [showCommentsSection, setShowCommentsSections] = useState(false);
  const { postActions } = useRepEventStats(video.aTag, video.pubkey);
  const { muteUnmute, isMuted } = useIsMute(video.pubkey);

  const isLiked = useMemo(() => {
    return userKeys
      ? postActions.likes.likes.find((item) => item.pubkey === userKeys.pub)
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

  useEffect(() => {
    let sub;
    const fetchData = async () => {
      try {
        setVideoViews(0);
        let naddrData = await checkURL();
        if (bannedList.includes(naddrData.pubkey)) customHistory.push("/");
        setParsedAddr(naddrData);
        sub = ndkInstance.subscribe(
          [
            {
              kinds: [7, 34237],

              "#a": [
                `${34235}:${naddrData.pubkey}:${naddrData.identifier}`,
                `${34236}:${naddrData.pubkey}:${naddrData.identifier}`,
              ],
            },
            {
              kinds: naddrData.kinds,
              authors: [naddrData.pubkey],
              "#d": [naddrData.identifier],
            },
          ],
          { cacheUsage: "CACHE_FIRST", groupable: false }
        );

        sub.on("event", (event) => {
          if (event.kind === 34237) {
            setVideoViews((prev) => (prev += 1));
          }
          if (naddrData.kinds.includes(event.kind)) {
            saveUsers([event.pubkey]);
            let parsedEvent = getVideoContent(event);
            setVideo(parsedEvent);
            setIsLoaded(true);
          }
        });
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
    return () => {
      if (sub) sub.stop();
    };
  }, [id, AuthNip05, VidIdentifier]);

  useEffect(() => {
    let sub;
    try {
      let count = 0;
      let moreVideosAuthorsPubkeys = [];
      sub = ndkInstance.subscribe(
        [
          {
            kinds: [34235, 34236],
            limit: 5,
          },
        ],
        { closeOnEose: true, cacheUsage: "CACHE_FIRST", groupable: false }
      );
      sub.on("event", (event) => {
        count += 1;
        if (count < 7) {
          moreVideosAuthorsPubkeys.push(event.pubkey);
          setMorePosts((prev) => {
            if (!prev.find((prev_) => prev_.id === event.id))
              return [...prev, getParsedRepEvent(event)];
            else return prev;
          });
        }
      });
      sub.on("eose", () => {
        saveUsers(moreVideosAuthorsPubkeys);
      });
    } catch (err) {
      console.log(err);
      setIsLoaded(true);
    }

    return () => {
      if (sub) sub.stop();
    };
  }, []);

  useEffect(() => {
    try {
      let auth = getUser(video.pubkey);

      if (auth) {
        setAuthor(auth);
      }
    } catch (err) {
      console.log(err);
    }
  }, [nostrAuthors, video]);

  useEffect(() => {
    if (
      video &&
      userKeys &&
      (userKeys.sec || userKeys.ext || userKeys.bunker)
    ) {
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 34237,
          content: "",
          tags: [
            ["a", `${video.kind}:${video.pubkey}:${video.d}`],
            ["d", `${video.kind}:${video.pubkey}:${video.d}`],
          ],
          allRelays: [],
        })
      );
    }
  }, [video, userKeys]);

  const checkURL = async () => {
    try {
      if (AuthNip05 && VidIdentifier) {
        let temPubkey = await getAuthPubkeyFromNip05(AuthNip05);
        return {
          pubkey: temPubkey,
          identifier: VidIdentifier,
          kinds: [34235, 34236],
        };
      }
      if (id) {
        let tempNaddrData = nip19.decode(id);
        return {
          pubkey: tempNaddrData.data.pubkey,
          identifier: tempNaddrData.data.identifier,
          kinds: [34235, 34236],
        };
      }
    } catch (err) {
      customHistory.push("/discover");
    }
  };

  if (!isLoaded) return <LoadingScreen />;
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
      {showAddArticleToCuration && (
        <AddArticleToCuration
          d={`34235:${video.pubkey}:${parsedAddr.identifier}`}
          exit={() => setShowArticleToCuration(false)}
          kind={30005}
        />
      )}
      <div>
        <Helmet>
          <title>Yakihonne | {video.title || "N/A"}</title>
          <meta name="description" content={video.content || "N/A"} />
          <meta property="og:description" content={video.content || "N/A"} />
          <meta
            property="og:image"
            content={
              video.image ||
              "https://yakihonne.s3.ap-east-1.amazonaws.com/media/images/thumbnail.png"
            }
          />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="700" />
          <meta
            property="og:url"
            content={`https://yakihonne.com/videos/${
              AuthNip05 && VidIdentifier ? `${AuthNip05}/${VidIdentifier}` : id
            }`}
          />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content={video.title || "N/A"} />
          <meta property="twitter:title" content={video.title || "N/A"} />
          <meta
            property="twitter:description"
            content={video.content || "N/A"}
          />
          <meta
            property="twitter:image"
            content={
              video.image ||
              "https://yakihonne.s3.ap-east-1.amazonaws.com/media/images/thumbnail.png"
            }
          />
        </Helmet>
        <ArrowUp />
        <div
          className="fit-container fx-centered fx-start-v"
          style={{ minHeight: "100vh" }}
        >
          {isMuted && (
            <PagePlaceholder page={"muted-user"} onClick={muteUnmute} />
          )}
          {!isMuted && (
            <div className="main-middle box-pad-h-m">
              {showCommentsSection && (
                <RepEventCommentsSection
                  id={video.aTag}
                  author={author}
                  eventPubkey={video.pubkey}
                  leaveComment={showCommentsSection.comment}
                  exit={() => setShowCommentsSections(false)}
                  kind={video.kind}
                  event={video}
                />
              )}
              {!showCommentsSection && (
                <>
                  <Backbar />
                  <div>
                    {getVideoFromURL(video.url)}
                    <div
                      className="fx-centered fx-col fx-start-h fx-start-v"
                      style={{ marginTop: ".5rem" }}
                    >
                      <h4>{video.title}</h4>
                    </div>
                    <div className="fx-scattered fit-container box-pad-v-m">
                      <div className="fx-centered">
                        <UserProfilePic
                          img={author.picture}
                          size={24}
                          user_id={author.pubkey}
                          allowClick={true}
                        />
                        <p>{author.name}</p>
                      </div>
                      <div className="fx-centered">
                        <Follow
                          size="small"
                          icon={false}
                          toFollowKey={author.pubkey}
                          toFollowName={""}
                          bulkList={[]}
                        />
                      </div>
                    </div>
                    <div
                      className="fit-container sc-s-18 box-pad-h-m box-pad-v-m fx-centered fx-start-h fx-start-v fx-wrap pointer"
                      style={{
                        border: "none",
                        backgroundColor: "var(--c1-side)",
                      }}
                      onClick={() => setExpandDescription(!expandDescription)}
                    >
                      <div className="fit-container fx-centered fx-start-h">
                        <p className="gray-c p-medium">
                          {t("AginxGR", { count: videoViews })}
                        </p>
                        <p className="p-small gray-c">&#9679;</p>
                        <p className="gray-c p-medium">
                          <Date_
                            toConvert={new Date(video.published_at * 1000)}
                            time={true}
                          />
                        </p>
                      </div>
                      <p
                        className={`fit-container ${
                          !expandDescription ? "p-four-lines" : ""
                        }`}
                      >
                        {video.content}
                      </p>
                      {!video.content && (
                        <p className="gray-c p-medium p-italic">
                          {t("AtZrjns")}
                        </p>
                      )}

                      <div className="fx-centered fx-start-h fx-wrap">
                        {video.keywords.map((tag, index) => {
                          return (
                            <Link
                              key={index}
                              className="sticker sticker-small sticker-gray-gray pointer"
                              to={`/search?keyword=${tag?.replace("#", "%23")}`}
                              state={{ tab: "videos" }}
                            >
                              {tag}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                    {morePosts.length > 0 && (
                      <div
                        className="fit-container box-pad-v fx-centered fx-col fx-start-v box-marg-s"
                        style={{
                          rowGap: "24px",
                          border: "none",
                        }}
                      >
                        <h4>{t("Aag9u1h")}</h4>
                        <div className="fit-container fx-centered fx-wrap">
                          {morePosts.map((video_) => {
                            if (video_.id !== video.id)
                              return (
                                <Link
                                  key={video_.id}
                                  className="fit-container fx-centered fx-start-h"
                                  to={`/videos/${video_.naddr}`}
                                  target="_blank"
                                >
                                  <div
                                    style={{
                                      minWidth: "128px",
                                      aspectRatio: "16/9",
                                      borderRadius: "var(--border-r-6)",
                                      backgroundImage: `url(${video_.image})`,
                                      backgroundColor: "black",
                                      position: "relative",
                                    }}
                                    className="bg-img cover-bg fx-centered fx-end-v fx-end-h box-pad-h-s box-pad-v-s"
                                  >
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
                                  </div>
                                  <div>
                                    <p className="p-small gray-c">
                                      <Date_
                                        toConvert={
                                          new Date(video_.published_at * 1000)
                                        }
                                      />
                                    </p>
                                    <p className="p-medium p-two-lines">
                                      {video_.title}
                                    </p>
                                    <AuthorPreviewExtra
                                      authorPubkey={video_.pubkey}
                                    />
                                  </div>
                                </Link>
                              );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {!showCommentsSection && !isMuted && (
          <div
            className="fit-container fx-col sticky-to-fixed fx-centered"
            style={{
              bottom: 0,
              borderTop: "1px solid var(--very-dim-gray)",
            }}
          >
            {postActions?.zaps?.zaps?.length > 0 && (
              <div className="main-middle">
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
              </div>
            )}
            <div className="main-middle fx-scattered">
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
                  event={video}
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
                        list: postActions.likes.likes.map(
                          (item) => item.pubkey
                        ),
                        extras: postActions.likes.likes,
                        extrasType: "reaction",
                      });
                  }}
                >
                  <NumberShrink value={postActions.likes.likes.length} />
                </div>
              </div>
              <div className="fx-centered  pointer">
                <Quote
                  isQuoted={isQuoted}
                  event={video}
                  actions={postActions}
                />
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
                <Zap
                  user={author}
                  event={video}
                  actions={postActions}
                  isZapped={isZapped}
                />
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
              <EventOptions
                event={video}
                eventActions={postActions}
                component="repEvents"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const AuthorPreviewExtra = ({ authorPubkey }) => {
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const [authorData, setAuthorData] = useState(
    getEmptyuserMetadata(authorPubkey)
  );
  useEffect(() => {
    const fetchData = async () => {
      try {
        let auth = getUser(authorPubkey);

        if (auth) {
          setAuthorData(auth);
        }
        return;
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [nostrAuthors]);

  return (
    <div className="fx-centered fx-start-h">
      <UserProfilePic
        size={16}
        img={authorData.picture}
        mainAccountUser={false}
        user_id={authorData.pubkey}
      />

      <p className="p-one-line p-medium">
        {authorData.display_name || authorData.name}
      </p>
    </div>
  );
};
