import React, { useMemo, useRef, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";
import MarkdownPreview from "@uiw/react-markdown-preview";
import katex from "katex";
import "katex/dist/katex.css";
import { Helmet } from "react-helmet";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import relaysOnPlatform from "../../Content/Relays";
import {
  checkForLUDS,
  convertDate,
  decodeBolt11,
  filterRelays,
  getBolt11,
  getEmptyuserMetadata,
  getParsedRepEvent,
  getZapper,
  minimizeKey,
  getParsedAuthor,
} from "../../Helpers/Encryptions";
import {
  getAuthPubkeyFromNip05,
  getComponent,
  redirectToLogin,
  shuffleArray,
} from "../../Helpers/Helpers";
import LoadingScreen from "../../Components/LoadingScreen";
import ShortenKey from "../../Components/Main/ShortenKey";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import Date_ from "../../Components/Date_";
import Follow from "../../Components/Main/Follow";
import ZapTip from "../../Components/Main/ZapTip";
import LoginWithNostr from "../../Components/Main/LoginWithNostr";
import GeneralComments from "../../Components/Main/GeneralComments";
import NumberShrink from "../../Components/NumberShrink";
import LoadingDots from "../../Components/LoadingDots";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import ArrowUp from "../../Components/ArrowUp";
import BookmarkEvent from "../../Components/Main/BookmarkEvent";
import AddArticleToCuration from "../../Components/Main/AddArticleToCuration";
import { getImagePlaceholder } from "../../Content/NostrPPPlaceholder";
import CheckNOSTRClient from "../../Components/Main/CheckNOSTRClient";
import placeholder from "../../media/images/nostr-thumbnail-ph.svg";
import ShareLink from "../../Components/ShareLink";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import TopicsTags from "../../Content/TopicsTags";
import { ndkInstance } from "../../Helpers/NDKInstance";

export default function Article() {
  const navigateTo = useNavigate();
  const { id, AuthNip05, ArtIdentifier } = useParams();
  const reportRef = useRef(null);

  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userMetadata = useSelector((state) => state.userMetadata);
  const userRelays = useSelector((state) => state.userRelays);
  const isDarkMode = useSelector((state) => state.isDarkMode);
  const isPublishing = useSelector((state) => state.isPublishing);

  const [isLoaded, setIsLoaded] = useState(false);
  const [author, setAuthor] = useState(false);
  const [post, setPost] = useState({});
  const [curationsOf, setCurationsOf] = useState([]);
  const [readMore, setReadMore] = useState([]);
  const [naddrData, setNaddrData] = useState("");
  const [upvoteReaction, setUpvoteReaction] = useState([]);
  const [downvoteReaction, setDownvoteReaction] = useState([]);
  const [zapsCount, setZapsCount] = useState(0);
  const [showReportWindow, setShowReportWindow] = useState(false);
  const [showReportPrompt, setShowReportPrompt] = useState(false);
  const [comments, setComments] = useState([]);
  const [netComments, setNetComments] = useState([]);
  const [zappers, setZappers] = useState([]);
  const [reporters, setReporters] = useState([]);
  const [usersList, setUsersList] = useState(false);
  const [showAddArticleToCuration, setShowArticleToCuration] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sideContentRef = useRef(null);
  const isVoted = useMemo(() => {
    return userKeys
      ? upvoteReaction
          .concat(downvoteReaction)
          .find((item) => item.pubkey === userKeys.pub)
      : false;
  }, [upvoteReaction, downvoteReaction, userKeys]);
  const isReported = useMemo(() => {
    return userKeys
      ? reporters.find((item) => item.pubkey === userKeys.pub)
      : false;
  }, [reporters]);

  useEffect(() => {
    const checkURL = async () => {
      try {
        if (AuthNip05 && ArtIdentifier) {
          let temPubkey = await getAuthPubkeyFromNip05(AuthNip05);
          setNaddrData({ pubkey: temPubkey, identifier: ArtIdentifier });
        }
        if (id) {
          let tempNaddrData = nip19.decode(id);
          setNaddrData(tempNaddrData.data);
        }
      } catch (err) {
        navigateTo("/");
      }
    };
    checkURL();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let tempAuth = false;
        let tempArt = false;
        let lastCreatedAtInUser = 0;
        let lastCreatedAtInArticle = 0;
        console.log(naddrData)
        let sub = ndkInstance.subscribe(
          [
            {
              kinds: [30023],
              "#d": [naddrData.identifier],
            },
            {
              kinds: [30004],
              "#a": [`30023:${naddrData.pubkey}:${naddrData.identifier}`],
            },
            {
              kinds: [0, 10002],
              authors: [naddrData.pubkey],
            },
          ],
          { cacheUsage: "CACHE_FIRST" }
        );

        sub.on("event", (event) => {
          if (event.kind === 30004) {
            setCurationsOf((prev) => {
              let parsedEvent = getParsedRepEvent(event);
              let check_cur = prev.find(
                (cur) => cur.title === parsedEvent.title
              );
              if (!check_cur) return [...prev, parsedEvent];
              else return prev;
            });
          }
          if (event.kind === 0) {
            tempAuth = { ...event };
            if (lastCreatedAtInUser < event.created_at) {
              lastCreatedAtInUser = event.created_at;
              setAuthor(getParsedAuthor(event));
            }
          }
          if (event.kind === 30023) {
        
            tempArt = { ...event };
            if (lastCreatedAtInArticle < event.created_at) {
              lastCreatedAtInArticle = event.created_at;
              setPost(getParsedPostBody(event));
            }
          }
          if (tempArt && tempAuth) {
            setIsLoaded(true);
          }
        });
        sub.on("close", () => {
          if (!tempAuth) {
            setAuthor(getEmptyuserMetadata(tempArt.pubkey));
          }
          setIsLoaded(true);
        });
        let timeout = setTimeout(() => {
          sub.stop();
          clearTimeout(timeout);
        }, 4000);
      } catch (err) {
        navigateTo("/");
      }
    };
    if (naddrData) fetchData();
  }, [naddrData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let count = 0;
        let tempArray = shuffleArray(TopicsTags);
        let tempArray_2 = tempArray.splice(0, 5);
        let tags = shuffleArray(
          tempArray_2.map((item) => [item.main_tag, ...item.sub_tags]).flat()
        );
        let sub = ndkInstance.subscribe(
          [
            {
              kinds: [30023],
              "#t": tags,
              limit: 5,
            },
          ],
          { closeOnEose: true, cacheUsage: "CACHE_FIRST" }
        );

        sub.on("event", (event) => {
          if (count < 5) {
            count = count + 1;
            setReadMore((prev) => [...prev, getParsedPostBody(event)]);
          }
        });
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!naddrData) return;
    const sub = ndkInstance.subscribe(
      [
        {
          kinds: [7, 1, 1984],
          "#a": [`30023:${naddrData.pubkey}:${naddrData.identifier}`],
        },
        {
          kinds: [9735],
          "#p": [naddrData.pubkey],
          "#a": [`30023:${naddrData.pubkey}:${naddrData.identifier}`],
        },
      ],
      { cacheUsage: "CACHE_FIRST" }
    );

    sub.on("event", (event) => {
      if (event.kind === 1984) {
        setReporters((prev) => {
          return [...prev, event];
        });
      }
      if (event.kind === 9735) {
        let sats = decodeBolt11(getBolt11(event));
        let zapper = getZapper(event);
        setZappers((prev) => {
          return [...prev, zapper];
        });
        setZapsCount((prev) => prev + sats);
      }
      if (event.kind === 1) {
        setComments((prev) => {
          let newCom = [...prev, event];
          return newCom.sort(
            (item_1, item_2) => item_2.created_at - item_1.created_at
          );
        });
      }
      if (event.content === "+")
        setUpvoteReaction((upvoteArticle) => [...upvoteArticle, event]);
      if (event.content === "-")
        setDownvoteReaction((downvoteArticle) => [...downvoteArticle, event]);
    });
    return () => {
      sub.stop();
    };
  }, [naddrData]);

  const getParsedPostBody = (data) => {
    let tempPost = {
      content: data.content,
      modified_date: new Date(data.created_at * 1000),
      added_date: new Date(data.created_at * 1000),
      published_at: data.created_at,
    };
    let tags = [];
    let d = "";

    for (let tag of data.tags) {
      if (tag[0] === "published_at") {
        tempPost.published_at = tag[1];
        tempPost.added_date =
          tag[1].length > 10
            ? new Date(parseInt(tag[1])).toISOString()
            : new Date(parseInt(tag[1]) * 1000).toISOString();
      }
      if (tag[0] === "image") tempPost.image = tag[1];
      if (tag[0] === "title") tempPost.title = tag[1];
      if (tag[0] === "summary") tempPost.description = tag[1];
      if (tag[0] === "client") {
        if (tag.length >= 3 && tag[2].includes("31990")) {
          tempPost.client = tag[2];
        }
        if ((tag.length >= 3 && !tag[2].includes("31990")) || tag.length < 3)
          tempPost.client = tag[1];
      }
      if (tag[0] === "t") tags.push(tag[1]);
      if (tag[0] === "d") d = tag[1];
    }

    tempPost.tags = Array.from(tags);
    tempPost.d = d;
    tempPost.author_pubkey = data.pubkey;
    if (!tempPost.image) tempPost.image = getImagePlaceholder();
    tempPost.naddr = nip19.naddrEncode({
      pubkey: data.pubkey,
      identifier: d,
    });
    return tempPost;
  };

  const upvoteArticle = async () => {
    if (isLoading) return;
    if (isPublishing) {
      dispatch(
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        })
      );
      return;
    }
    try {
      if (!userKeys) {
        redirectToLogin();
        return false;
      }
      if (isVoted) {
        setIsLoading(true);
        dispatch(
          setToPublish({
            userKeys: userKeys,
            kind: 5,
            content: "This vote will be deleted!",
            tags: [["e", isVoted.id]],
            allRelays: userRelays,
          })
        );
        setIsLoading(false);

        if (isVoted.content === "+") {
          let tempArray = Array.from(upvoteReaction);
          let index = tempArray.findIndex((item) => item.id === isVoted.id);
          tempArray.splice(index, 1);
          setUpvoteReaction(tempArray);
          return false;
        }
        let tempArray = Array.from(downvoteReaction);
        let index = tempArray.findIndex((item) => item.id === isVoted.id);
        tempArray.splice(index, 1);
        setDownvoteReaction(tempArray);
      }

      setIsLoading(true);
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 7,
          content: "+",
          tags: [
            ["a", `30023:${naddrData.pubkey}:${naddrData.identifier}`],
            ["p", naddrData.pubkey],
          ],
          allRelays: userRelays,
        })
      );

      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };
  const downvoteArticle = async () => {
    if (isLoading) return;
    if (isPublishing) {
      dispatch(
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        })
      );
      return;
    }
    try {
      if (!userKeys) {
        redirectToLogin(true);
        return false;
      }
      if (isVoted) {
        setIsLoading(true);
        dispatch(
          setToPublish({
            userKeys: userKeys,
            kind: 5,
            content: "This vote will be deleted!",
            tags: [["e", isVoted.id]],
            allRelays: userRelays,
          })
        );
        setIsLoading(false);
        if (isVoted.content === "-") {
          let tempArray = Array.from(downvoteReaction);
          let index = tempArray.findIndex((item) => item.id === isVoted.id);
          tempArray.splice(index, 1);
          setDownvoteReaction(tempArray);
          return false;
        }
        let tempArray = Array.from(upvoteReaction);
        let index = tempArray.findIndex((item) => item.id === isVoted.id);
        tempArray.splice(index, 1);
        setUpvoteReaction(tempArray);
      }
      setIsLoading(true);
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 7,
          content: "-",
          tags: [
            ["a", `30023:${naddrData.pubkey}:${naddrData.identifier}`],
            ["p", naddrData.pubkey],
          ],
          allRelays: userRelays,
        })
      );

      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  const refreshComments = (index) => {
    let tempArray = Array.from(comments);
    tempArray.splice(index, 1);
    setComments(tempArray);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reportRef.current && !reportRef.current.contains(e.target))
        setShowReportWindow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [reportRef]);

  const getURLToShare = () => {
    if (AuthNip05 && ArtIdentifier) {
      return `/article/${AuthNip05}/${ArtIdentifier}`;
    }
    if (author?.nip05) {
      return `/article/${author.nip05}/${naddrData.identifier}`;
    }
    if (id) {
      return `/article/${id}`;
    }
  };

  if (!isLoaded) return <LoadingScreen />;
  return (
    <div>
      <Helmet>
        <title>Yakihonne | {post.title}</title>
        <meta name="description" content={post.description} />
        <meta property="og:description" content={post.description} />
        <meta property="og:image" content={post.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="700" />
        <meta
          property="og:url"
          content={
            id
              ? `https://yakihonne.com/article/${id}`
              : `https://yakihonne.com/article/${AuthNip05}/${ArtIdentifier}`
          }
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content={post.title} />
        <meta property="twitter:title" content={post.title} />
        <meta property="twitter:description" content={post.description} />
        <meta property="twitter:image" content={post.image} />
      </Helmet>
      
      {usersList && (
        <ShowUsersList
          exit={() => setUsersList(false)}
          title={usersList.title}
          list={usersList.list}
          extras={usersList.extras}
        />
      )}
      <div className="fit-container fx-centered">
        <div className="main-container">
          <SidebarNOSTR />
          <main className="main-page-nostr-container">
            <ArrowUp />

            {showAddArticleToCuration && (
              <AddArticleToCuration
                d={`30023:${naddrData.pubkey}:${naddrData.identifier}`}
                exit={() => setShowArticleToCuration(false)}
                kind={30004}
              />
            )}
            <div className="fit-container fx-centered fx-start-h">
              <div
                // style={{ width: "min(100%,1400px)" }}
                style={{ gap: 0 }}
                className="fx-centered fx-start-v fx-start-h fx-wrap "
              >
                <div
                  className={`fit-container fx-centered fx-wrap box-pad-h-m box-pad-v-m article-mw main-middle`}
                >
                  <div className="fit-container nostr-article" dir="auto">
                    <div
                      className="fit-container fx-scattered fx-start-v fx-wrap"
                      style={{ position: "relative", transform: "none" }}
                    >
                      <div
                        className="fit-container fx-centered fx-start-h fx-start-v fx-col"
                        // style={{
                        //   flex: "1 1 700px",

                        // }}
                        dir="auto"
                      >
                        <div
                          className="sc-s-18 bg-img cover-bg fit-container box-marg-s"
                          style={{
                            backgroundImage: post.image
                              ? `url(${post.image})`
                              : `url(${placeholder})`,
                            backgroundColor: "var(--very-dim-gray)",
                            height: "auto",
                            aspectRatio: "20/9",
                          }}
                        ></div>
                        <div
                          className="fit-container fx-scattered fx-start-v box-pad-h-m"
                          style={{ columnGap: "10px" }}
                          dir="auto"
                        >
                          <h3 dir="auto">{post.title}</h3>
                        </div>
                        <div className="fx-centered fit-container fx-start-h box-pad-h-m">
                          <div className="fx-start-h fx-centered">
                            {/* <p className=" gray-c">
                            <Date_ toConvert={post.added_date} />
                          </p>
                          <div
                            className="edit icon-tooltip"
                            data-tooltip={`created at ${convertDate(
                              post.added_date
                            )}, edited on ${convertDate(post.modified_date)}`}
                          ></div> */}
                            <p
                              className="gray-c pointer round-icon-tooltip"
                              data-tooltip={`created at ${convertDate(
                                post.added_date
                              )}, edited on ${convertDate(post.modified_date)}`}
                            >
                              Last modified{" "}
                              <Date_ toConvert={post.modified_date} />
                            </p>
                          </div>
                          {/* <p className="gray-c">
                      Published on <Date_ toConvert={post.added_date} />
                    </p> */}
                          <p className="gray-c p-medium">|</p>
                          <p className="gray-c">
                            Posted from{" "}
                            <span className="orange-c">
                              {" "}
                              <CheckNOSTRClient client={post.client} />{" "}
                            </span>
                          </p>
                        </div>
                        <div className="fx-scattered fit-container box-pad-v-m box-pad-h-m">
                          <div className="fx-centered">
                            <UserProfilePicNOSTR
                              size={68}
                              img={author.picture}
                              mainAccountUser={false}
                              user_id={author.pubkey}
                              ring={false}
                              allowClick={true}
                            />
                            <div className="fx-centered fx-col fx-start-v">
                              <p>
                                {author.name || minimizeKey(post.author_pubkey)}
                              </p>
                              <ShortenKey id={author.pubkeyhashed} />
                            </div>
                          </div>
                          <div className="fx-centered">
                            <Follow
                              toFollowKey={author.pubkey}
                              toFollowName={author.name}
                              bulk={false}
                              bulkList={[]}
                            />
                            <ZapTip
                              recipientLNURL={checkForLUDS(
                                author.lud06,
                                author.lud16
                              )}
                              // recipientLNURL={author.lud06 || author.lud16}
                              recipientPubkey={author.pubkey}
                              senderPubkey={userKeys.pub}
                              recipientInfo={{
                                name: author.name,
                                img: author.picture,
                              }}
                              aTag={`30023:${naddrData.pubkey}:${naddrData.identifier}`}
                              forContent={post.title}
                            />
                          </div>
                        </div>
                        {post.description && (
                          <div className="box-pad-v-m fit-container box-pad-h-m">
                            <p className="quote-txt">{post.description}</p>
                          </div>
                        )}
                        <div
                          className="fx-centered fx-start-h fx-wrap box-marg-s box-pad-h-m"
                          style={{ marginLeft: 0 }}
                        >
                          {post.items?.map((tag, index) => {
                            return (
                              <Link
                                key={`${tag}-${index}`}
                                style={{
                                  textDecoration: "none",
                                  color: "white",
                                }}
                                className="sticker sticker-c1 sticker-small"
                                to={`/tags/${tag.replace("#", "%23")}`}
                                target={"_blank"}
                              >
                                {tag}
                              </Link>
                            );
                          })}
                        </div>
                        <div className="fit-container fx-scattered box-pad-h-m box-marg-s">
                          <div
                            className="fx-centered fit-container fx-start-h"
                            style={{ columnGap: "12px" }}
                          >
                            <div
                              className="fx-centered"
                              style={{ columnGap: "8px" }}
                            >
                              <div
                                className="icon-tooltip"
                                data-tooltip="Tip article"
                              >
                                <ZapTip
                                  recipientLNURL={checkForLUDS(
                                    author.lud06,
                                    author.lud16
                                  )}
                                  // recipientLNURL={author.lud06 || author.lud16}
                                  recipientPubkey={author.pubkey}
                                  senderPubkey={userKeys.pub}
                                  recipientInfo={{
                                    name: author.name,
                                    img: author.picture,
                                  }}
                                  aTag={`30023:${naddrData.pubkey}:${naddrData.identifier}`}
                                  forContent={post.title}
                                  onlyIcon={true}
                                />
                              </div>
                              <div
                                data-tooltip="See zappers"
                                className="icon-tooltip pointer"
                                onClick={() =>
                                  zapsCount &&
                                  setUsersList({
                                    title: "Zappers",
                                    list: zappers.map((item) => item.pubkey),
                                    extras: zappers,
                                  })
                                }
                              >
                                <NumberShrink value={zapsCount} />
                              </div>
                            </div>
                            <div
                              className="fx-centered pointer"
                              style={{ columnGap: "8px" }}
                              onClick={() => {
                                !userKeys && redirectToLogin();
                              }}
                            >
                              <div className="comment-24"></div>
                              <NumberShrink
                                value={
                                  netComments.map((item) => item.count).flat()
                                    .length + netComments.length
                                }
                              />
                            </div>
                            <div
                              className={`fx-centered pointer ${
                                isLoading ? "flash" : ""
                              }`}
                              style={{ columnGap: "8px" }}
                            >
                              <div
                                className={"icon-tooltip"}
                                data-tooltip="Upvote"
                                onClick={upvoteArticle}
                              >
                                <div
                                  className={
                                    isVoted?.content === "+"
                                      ? "arrow-up-bold icon-tooltip"
                                      : "arrow-up icon-tooltip"
                                  }
                                  style={{
                                    opacity:
                                      isVoted?.content === "-" ? ".2" : 1,
                                  }}
                                ></div>
                              </div>
                              <div
                                className="icon-tooltip"
                                data-tooltip="Upvoters"
                                onClick={() =>
                                  upvoteReaction.length > 0 &&
                                  setUsersList({
                                    title: "Upvoters",
                                    list: upvoteReaction.map(
                                      (item) => item.pubkey
                                    ),
                                    extras: [],
                                  })
                                }
                              >
                                <NumberShrink value={upvoteReaction.length} />
                              </div>
                            </div>
                            <div
                              className={`fx-centered pointer ${
                                isLoading ? "flash" : ""
                              }`}
                              style={{ columnGap: "8px" }}
                            >
                              <div
                                className="icon-tooltip"
                                data-tooltip="Downvote"
                                onClick={downvoteArticle}
                              >
                                <div
                                  className={
                                    isVoted?.content === "-"
                                      ? "arrow-up-bold"
                                      : "arrow-up"
                                  }
                                  style={{
                                    transform: "rotate(180deg)",
                                    opacity:
                                      isVoted?.content === "+" ? ".2" : 1,
                                  }}
                                ></div>
                              </div>
                              <div
                                className="icon-tooltip"
                                data-tooltip="Downvoters"
                                onClick={() =>
                                  downvoteReaction.length > 0 &&
                                  setUsersList({
                                    title: "Downvoters",
                                    list: downvoteReaction.map(
                                      (item) => item.pubkey
                                    ),
                                    extras: [],
                                  })
                                }
                              >
                                <NumberShrink value={downvoteReaction.length} />
                              </div>
                            </div>
                            <p className="gray-c">|</p>

                            <ShareLink
                              title={post.title}
                              description={post.description}
                              path={getURLToShare()}
                              kind={30023}
                              shareImgData={{
                                post,
                                author,
                                likes: upvoteReaction.length,
                                dislikes: downvoteReaction.length,
                              }}
                            />
                          </div>
                          <div
                            style={{ position: "relative" }}
                            className="fx-centered fx-stretch "
                            dir="auto"
                          >
                            <div
                              className="round-icon round-icon-tooltip"
                              data-tooltip={"Bookmark article"}
                            >
                              <BookmarkEvent
                                pubkey={post.author_pubkey}
                                d={post.d}
                              />
                            </div>
                            <div
                              className="round-icon round-icon-tooltip"
                              data-tooltip={"Add to curation"}
                              onClick={() => setShowArticleToCuration(true)}
                            >
                              <div className="add-curation-24"></div>
                            </div>
                            <div
                              className="round-icon round-icon-tooltip"
                              data-tooltip={"Report"}
                              onClick={() =>
                                setShowReportWindow(!showReportWindow)
                              }
                            >
                              <div
                                className="flag-24"
                                // style={{ filter: "brightness(0)" }}
                              ></div>
                            </div>
                            {showReportWindow && (
                              <div
                                className=" sc-s-18 fx-col fx-centered "
                                style={{
                                  position: "absolute",
                                  width: "max-content",
                                  right: "0",
                                  top: "calc(100% + 5px)",
                                }}
                                ref={reportRef}
                              >
                                <div
                                  className="fx-centered box-pad-h-m "
                                  style={{
                                    columnGap: "4px",
                                    marginTop: "10px",
                                  }}
                                >
                                  <p className=" p-medium">
                                    {reporters.length >= 10 ||
                                    reporters.length == 0
                                      ? reporters.length
                                      : `0${reporters.length}`}{" "}
                                  </p>
                                  <p className="p-medium">Report(s) </p>
                                </div>
                                <hr />
                                <div
                                  className="fx-centered pointer box-pad-h-m "
                                  onClick={() => setShowReportPrompt(true)}
                                  style={{ marginBottom: "10px" }}
                                >
                                  <div className="flag"></div>
                                  <p className="gray-c p-medium">Report</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="article fit-container box-pad-h-m">
                          <MarkdownPreview
                            wrapperElement={{
                              "data-color-mode":
                                isDarkMode === "0" ? "dark" : "light",
                            }}
                            source={post.content}
                            rehypeRewrite={(node, index, parent) => {
                              if (
                                node.tagName === "a" &&
                                parent &&
                                /^h(1|2|3|4|5|6)/.test(parent.tagName)
                              ) {
                                parent.children = parent.children.slice(1);
                              }
                            }}
                            components={{
                              p: ({ children }) => {
                                return <>{getComponent(children)}</>;
                              },
                              h1: ({ children }) => {
                                return <h1 dir="auto">{children}</h1>;
                              },
                              h2: ({ children }) => {
                                return <h2 dir="auto">{children}</h2>;
                              },
                              h3: ({ children }) => {
                                return <h3 dir="auto">{children}</h3>;
                              },
                              h4: ({ children }) => {
                                return <h4 dir="auto">{children}</h4>;
                              },
                              h5: ({ children }) => {
                                return <h5 dir="auto">{children}</h5>;
                              },
                              h6: ({ children }) => {
                                return <h6 dir="auto">{children}</h6>;
                              },
                              li: ({ children }) => {
                                return <li dir="auto">{children}</li>;
                              },
                              code: ({
                                inline,
                                children,
                                className,
                                ...props
                              }) => {
                                if (!children) return;
                                const txt = children[0] || "";

                                if (inline) {
                                  if (
                                    typeof txt === "string" &&
                                    /^\$\$(.*)\$\$/.test(txt)
                                  ) {
                                    const html = katex.renderToString(
                                      txt.replace(/^\$\$(.*)\$\$/, "$1"),
                                      {
                                        throwOnError: false,
                                      }
                                    );
                                    return (
                                      <code
                                        dangerouslySetInnerHTML={{
                                          __html: html,
                                        }}
                                      />
                                    );
                                  }
                                  return (
                                    <code
                                      dangerouslySetInnerHTML={{ __html: txt }}
                                    />
                                  );
                                }
                                if (
                                  typeof txt === "string" &&
                                  typeof className === "string" &&
                                  /^language-katex/.test(
                                    className.toLocaleLowerCase()
                                  )
                                ) {
                                  const html = katex.renderToString(txt, {
                                    throwOnError: false,
                                  });
                                  return (
                                    <code
                                      dangerouslySetInnerHTML={{ __html: html }}
                                    />
                                  );
                                }

                                return (
                                  <code className={String(className)}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    flex: "1 1 300px",

                    position: "sticky",
                    top: `min(calc(100dvh - ${
                      sideContentRef.current?.getBoundingClientRect().height ||
                      0
                    }px),0px)`,
                  }}
                  className="fx-centered fx-col fx-start-v fx-start-h article-extras-mw box-pad-v-m"
                  ref={sideContentRef}
                >
                  <SearchbarNOSTR />

                  <div
                    className="extras-homepage fx-centered fx-col fx-start-h fx-start-v fit-container box-pad-h-m box-pad-v-m sc-s-18"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      border: "none",
                      rowGap: "16px",
                      minHeight: "20vh",
                    }}
                  >
                    <p className="gray-c">Read also</p>
                    <div className="fx-centered fx-wrap fit-container">
                      {readMore.map((post) => {
                        return (
                          <Link
                            className="fit-container fx-scattered"
                            key={post.id}
                            to={`/article/${post.naddr}`}
                            target="_blank"
                          >
                            <div className="fx-centered">
                              {post.image && (
                                <div
                                  className=" bg-img cover-bg sc-s-18 "
                                  style={{
                                    backgroundImage: `url(${post.image})`,
                                    minWidth: "40px",
                                    aspectRatio: "1/1",
                                    borderRadius: "var(--border-r-50)",
                                    border: "none",
                                  }}
                                ></div>
                              )}
                              <div>
                                <p className="p-one-line">{post.title}</p>
                                <p className="gray-c p-medium">
                                  <Date_
                                    toConvert={
                                      new Date(post.published_at * 1000)
                                    }
                                  />
                                </p>
                              </div>
                            </div>
                            <div className="share-icon"></div>
                          </Link>
                        );
                      })}
                    </div>
                    {readMore.length === 0 && (
                      <div
                        style={{ height: "40vh" }}
                        className="fit-container fx-centered"
                      >
                        <LoadingDots />
                      </div>
                    )}
                  </div>

                  <GeneralComments
                    comments={comments}
                    aTag={`30023:${naddrData.pubkey}:${naddrData.identifier}`}
                    refresh={refreshComments}
                    setNetComments={setNetComments}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
