import React, { useMemo, useRef, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";
import MarkdownPreview from "@uiw/react-markdown-preview";
import katex from "katex";
import "katex/dist/katex.css";
import { Helmet } from "react-helmet";
import Sidebar from "../../Components/Main/Sidebar";
import {
  checkForLUDS,
  convertDate,
  getEmptyuserMetadata,
  getParsedRepEvent,
  minimizeKey,
  getParsedAuthor,
  detectDirection,
} from "../../Helpers/Encryptions";
import {
  copyText,
  getAuthPubkeyFromNip05,
  getComponent,
  shuffleArray,
  straightUp,
} from "../../Helpers/Helpers";
import LoadingScreen from "../../Components/LoadingScreen";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import Date_ from "../../Components/Date_";
import Follow from "../../Components/Main/Follow";
import ZapTip from "../../Components/Main/ZapTip";
import NumberShrink from "../../Components/NumberShrink";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import ArrowUp from "../../Components/ArrowUp";
import BookmarkEvent from "../../Components/Main/BookmarkEvent";
import AddArticleToCuration from "../../Components/Main/AddArticleToCuration";
import CheckNOSTRClient from "../../Components/Main/CheckNOSTRClient";
import ShareLink from "../../Components/ShareLink";
import { useDispatch, useSelector } from "react-redux";
import TopicsTags from "../../Content/TopicsTags";
import { ndkInstance } from "../../Helpers/NDKInstance";
import OptionsDropdown from "../../Components/Main/OptionsDropdown";
import DynamicIndicator from "../../Components/DynamicIndicator";
import useRepEventStats from "../../Hooks/useRepEventStats";
import Like from "../../Components/Reactions/Like";
import Zap from "../../Components/Reactions/Zap";
import Quote from "../../Components/Reactions/Quote";
import RepEventCommentsSection from "../../Components/Main/RepEventCommentsSection";
import { customHistory } from "../../Helpers/History";
import Backbar from "../../Components/Main/Backbar";
import { useTranslation } from "react-i18next";
import { translate } from "../../Helpers/Controlers";
import LoadingDots from "../../Components/LoadingDots";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import PagePlaceholder from "../../Components/PagePlaceholder";
import bannedList from "../../Content/BannedList";
import ZapAd from "../../Components/Main/ZapAd";
import useUserProfile from "../../Hooks/useUsersProfile";
import { saveUsers } from "../../Helpers/DB";

export default function Article() {
  const { t } = useTranslation();
  const { id, AuthNip05, ArtIdentifier } = useParams();
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const isDarkMode = useSelector((state) => state.isDarkMode);
  const userMutedList = useSelector((state) => state.userMutedList);

  const [isLoaded, setIsLoaded] = useState(false);
  // const [author, setAuthor] = useState(false);
  const [post, setPost] = useState({});
  const { isNip05Verified, userProfile } = useUserProfile(post?.pubkey || "");
  const [readMore, setReadMore] = useState([]);
  const [naddrData, setNaddrData] = useState("");
  const [usersList, setUsersList] = useState(false);
  const [showAddArticleToCuration, setShowArticleToCuration] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCommentsSection, setShowCommentsSections] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState("");
  const [translatedDir, setTranslatedDir] = useState(false);
  const [translatedContent, setTranslatedContent] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [isContentTranslating, setIsContentTranslating] = useState(false);
  const { postActions } = useRepEventStats(post.aTag, post.pubkey);
  const [isTransEnabled, setIsTransEnabled] = useState(true);
  const containerRef = useRef(null);

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

  const isMuted = useMemo(() => {
    let checkProfile = () => {
      if (!Array.isArray(userMutedList)) return false;
      let index = userMutedList.findIndex(
        (item) => item === userProfile?.pubkey
      );
      if (index === -1) {
        return false;
      }
      return { index };
    };
    return checkProfile();
  }, [userMutedList, userProfile]);

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
        customHistory.push("/");
      }
    };
    checkURL();
  }, [id, AuthNip05, ArtIdentifier]);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setShowPreview(containerRef.current.scrollTop >= 200);
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.type === "childList") {
          const container = document.querySelector(
            ".main-page-nostr-container"
          );
          if (container) {
            containerRef.current = container;
            container.addEventListener("scroll", handleScroll);
            observer.disconnect();
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", handleScroll);
      }
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (bannedList.includes(naddrData.pubkey)) customHistory.push("/");
        straightUp();
        let tempAuth = false;
        let tempArt = false;
        let lastCreatedAtInUser = 0;
        let lastCreatedAtInArticle = 0;

        let sub = ndkInstance.subscribe(
          [
            {
              kinds: [30023],
              "#d": [decodeURIComponent(naddrData.identifier)],
            },

            // {
            //   kinds: [0, 10002],
            //   authors: [naddrData.pubkey],
            // },
          ],
          { cacheUsage: "CACHE_FIRST" }
        );

        sub.on("event", (event) => {
          // if (event.kind === 0) {
          //     console.log(event)
          //   tempAuth = { ...event };
          //   if (lastCreatedAtInUser < event.created_at) {
          //     lastCreatedAtInUser = event.created_at;
          //     setAuthor(getParsedAuthor(event));
          //   }
          // }
          if (event.kind === 30023) {
            saveUsers([event.pubkey]);
            tempArt = { ...event };
            if (lastCreatedAtInArticle < event.created_at) {
              lastCreatedAtInArticle = event.created_at;
              setPost(getParsedRepEvent(event));
            }
            setIsLoaded(true);
          }
          // if (tempArt && tempAuth) {
          //   setIsLoaded(true);
          // }
        });
        sub.on("close", () => {
          // if (!tempAuth) {
          //   setAuthor(getEmptyuserMetadata(tempArt.pubkey));
          // }
          setIsLoaded(true);
        });
        let timeout = setTimeout(() => {
          sub.stop();
          clearTimeout(timeout);
        }, 3000);
      } catch (err) {
        customHistory.push("/");
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
            setReadMore((prev) => [...prev, getParsedRepEvent(event)]);
          } else {
            sub.stop()
          }
        });
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, []);

  const translateArticle = async () => {
    setIsContentTranslating(true);
    if (translatedContent) {
      setShowTranslation(true);
      setIsContentTranslating(false);
      return;
    }
    try {
      let res = await translate(
        [post.title, post.description || " ", post.content].join(" ABCAF ")
      );
      if (res.status === 500) {
        dispatch(
          setToast({
            type: 2,
            desc: t("AZ5VQXL"),
          })
        );
      }
      if (res.status === 400) {
        dispatch(
          setToast({
            type: 2,
            desc: t("AJeHuH1"),
          })
        );
      }
      if (res.status === 200) {
        setTranslatedTitle(res.res.split("ABCAF")[0]);
        setTranslatedDescription(res.res.split("ABCAF")[1]);
        setTranslatedContent(res.res.split("ABCAF")[2]);
        setTranslatedDir(detectDirection(res.res.split("ABCAF")[2]));
        setShowTranslation(true);
      }
      setIsContentTranslating(false);
    } catch (err) {
      setShowTranslation(false);
      setIsContentTranslating(false);
      dispatch(
        setToast({
          type: 2,
          desc: t("AZ5VQXL"),
        })
      );
    }
  };

  const muteUnmute = async () => {
    try {
      if (!Array.isArray(userMutedList)) return;
      let tempTags = Array.from(userMutedList.map((pubkey) => ["p", pubkey]));
      if (isMuted) {
        tempTags.splice(isMuted.index, 1);
      } else {
        tempTags.push(["p", userProfile?.pubkey]);
      }

      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 10000,
          content: "",
          tags: tempTags,
          allRelays: [],
        })
      );
    } catch (err) {
      console.log(err);
    }
  };

  if (!isLoaded) return <LoadingScreen />;
  return (
    <div>
      <Helmet>
        <title>Yakihonne | {post?.title || "N/A"}</title>
        <meta name="description" content={post?.description || "N/A"} />
        <meta property="og:description" content={post?.description || "N/A"} />
        <meta property="og:image" content={post?.image || "N/A"} />
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
        <meta property="og:title" content={post?.title || "N/A"} />
        <meta property="twitter:title" content={post?.title || "N/A"} />
        <meta
          property="twitter:description"
          content={post?.description || "N/A"}
        />
        <meta property="twitter:image" content={post?.image || "N/A"} />
      </Helmet>

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
          d={`30023:${naddrData.pubkey}:${naddrData.identifier}`}
          exit={() => setShowArticleToCuration(false)}
          kind={30004}
        />
      )}
      {}
      <div className="fit-container fx-centered">
        <div className="main-container">
          <Sidebar />
          <main className="main-page-nostr-container">
            <ArrowUp />
            {post.title && (
              <>
                <div
                  className="fit-container fx-centered fx-start-v box-pad-h-m"
                  style={{ minHeight: "100vh" }}
                >
                  {isMuted && (
                    <PagePlaceholder page={"muted-user"} onClick={muteUnmute} />
                  )}
                  {!isMuted && (
                    <div
                      className={`fit-container fx-centered fx-wrap article-mw main-middle`}
                    >
                      {showCommentsSection && (
                        <RepEventCommentsSection
                          id={post.aTag}
                          author={userProfile}
                          eventPubkey={post.pubkey}
                          leaveComment={showCommentsSection.comment}
                          exit={() => setShowCommentsSections(false)}
                          kind={post.kind}
                          event={post}
                        />
                      )}
                      {!showCommentsSection && (
                        <div
                          className="fit-container fx-centered fx-start-h fx-start-v fx-col nostr-article"
                          style={{ gap: 0 }}
                        >
                          <Backbar />
                          {showPreview && (
                            <>
                              <div
                                className="fx-centered fx-col fx-start-h fx-start-v fit-container box-pad-v sticky slide-down"
                                style={{
                                  paddingBottom: 0,
                                }}
                              >
                                <div className="fx-centered">
                                  <UserProfilePic
                                    size={20}
                                    img={userProfile.picture}
                                    mainAccountUser={false}
                                    user_id={userProfile.pubkey}
                                    allowClick={true}
                                  />
                                  <div className="fx-centered fx-start-h">
                                    <div>
                                      <p className="p-caps">
                                        {t("AsXpL4b", {
                                          name:
                                            userProfile.display_name ||
                                            userProfile.name ||
                                            minimizeKey(post.pubkey),
                                        })}
                                      </p>
                                    </div>
                                    <p className="gray-c p-medium">&#8226;</p>
                                    <p className="gray-c">
                                      <Date_
                                        toConvert={
                                          new Date(post.created_at * 1000)
                                        }
                                      />
                                    </p>
                                  </div>
                                </div>
                                <h4>
                                  {showTranslation
                                    ? translatedTitle
                                    : post.title}
                                </h4>
                                <div style={{ height: ".125rem" }}></div>
                                <ReaderIndicator />
                              </div>
                            </>
                          )}
                          {!showPreview && (
                            <div
                              className="fx-scattered fit-container box-pad-v"
                              style={{
                                paddingTop: 0,
                                borderBottom: "1px solid var(--very-dim-gray)",
                              }}
                            >
                              {/* <div className="fx-centered">
                                <UserProfilePic
                                  size={48}
                                  img={userProfile.picture}
                                  mainAccountUser={false}
                                  user_id={userProfile.pubkey}
                                  allowClick={true}
                                />
                                <div className="fx-centered fx-col fx-start-v">
                                  <div>
                                    <p className="gray-c">{t("AVG3Uga")}</p>
                                    <p className="p-big p-caps">
                                      {userProfile.display_name ||
                                        userProfile.name ||
                                        minimizeKey(post.pubkey)}
                                    </p>
                                  </div>
                                </div>
                              </div> */}

                              <AuthPreview pubkey={post.pubkey} />

                              {userKeys.pub !== post.pubkey && (
                                <div className="fx-centered">
                                  <Follow
                                    toFollowKey={userProfile.pubkey}
                                    toFollowName={userProfile.name}
                                    bulk={false}
                                    bulkList={[]}
                                  />
                                  <ZapTip
                                    recipientLNURL={checkForLUDS(
                                      userProfile.lud06,
                                      userProfile.lud16
                                    )}
                                    recipientPubkey={userProfile.pubkey}
                                    senderPubkey={userKeys.pub}
                                    recipientInfo={{
                                      name: userProfile.name,
                                      img: userProfile.picture,
                                    }}
                                    aTag={`30023:${naddrData.pubkey}:${naddrData.identifier}`}
                                    forContent={post.title}
                                  />
                                </div>
                              )}
                              {userKeys.pub === post.pubkey && (
                                <Link
                                  to={"/write-article"}
                                  state={{
                                    post_pubkey: post.pubkey,
                                    post_id: post.id,
                                    post_kind: post.kind,
                                    post_title: post.title,
                                    post_desc: post.description,
                                    post_thumbnail: post.image,
                                    post_tags: post.items,
                                    post_d: post.d,
                                    post_content: post.content,
                                    post_published_at: post.published_at,
                                  }}
                                >
                                  <button className="btn btn-gray">
                                    {t("Aig65l1")}
                                  </button>
                                </Link>
                              )}
                            </div>
                          )}
                          <div
                            className="fit-container fx-scattered fx-start-v fx-col box-pad-v"
                            style={{ columnGap: "10px" }}
                          >
                            <h3
                              dir={showTranslation ? translatedDir : post.dir}
                            >
                              {showTranslation ? translatedTitle : post.title}
                            </h3>
                            <div
                              className="fx-centered fit-container fx-start-h"
                              style={{ minWidth: "max-content" }}
                            >
                              <p className="gray-c">
                                {t("AHhPGax", { date: "" })}
                              </p>
                              <span
                                className="orange-c p-one-line"
                                style={{ maxWidth: "200px" }}
                              >
                                <CheckNOSTRClient client={post.client} />
                              </span>
                              <p className="gray-c p-medium">&#8226;</p>
                              <div className="fx-start-h fx-centered">
                                <p
                                  className="gray-c pointer round-icon-tooltip"
                                  data-tooltip={t("AOsxQxu", {
                                    cdate: convertDate(
                                      post.published_at * 1000
                                    ),
                                    edate: convertDate(post.created_at * 1000),
                                  })}
                                >
                                  <Date_
                                    toConvert={new Date(post.created_at * 1000)}
                                  />
                                </p>
                              </div>
                            </div>
                            {post.description && (
                              <div
                                className="fit-container "
                                dir={showTranslation ? translatedDir : post.dir}
                              >
                                {showTranslation
                                  ? translatedDescription
                                  : post.description}
                              </div>
                            )}
                            {post.tTags?.length > 0 && (
                              <div
                                className="fx-centered fx-start-h fx-wrap"
                                style={{ marginLeft: 0 }}
                              >
                                {post.tTags?.map((tag, index) => {
                                  return (
                                    <Link
                                      key={`${tag}-${index}`}
                                      style={{
                                        textDecoration: "none",
                                        color: "white",
                                      }}
                                      className="sticker sticker-c1 sticker-small"
                                      to={`/search?keyword=${tag.replace(
                                        "#",
                                        "%23"
                                      )}`}
                                      state={{ tab: "articles" }}
                                      // target={"_blank"}
                                    >
                                      {tag}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {post.image && (
                            <div className="box-marg-s fit-container">
                              <div
                                className="sc-s-18 bg-img cover-bg fit-container"
                                style={{
                                  backgroundImage: `url(${post.image})`,
                                  backgroundColor: "var(--very-dim-gray)",
                                  height: "auto",
                                  aspectRatio: "20/9",
                                }}
                              ></div>
                            </div>
                          )}
                          <div
                            className="article fit-container"
                            dir={showTranslation ? translatedDir : post.dir}
                          >
                            <MarkdownPreview
                              wrapperElement={{
                                "data-color-mode":
                                  isDarkMode === "0" ? "dark" : "light",
                              }}
                              source={
                                showTranslation
                                  ? translatedContent
                                  : post.content
                              }
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
                                  return <p>{getComponent(children)}</p>;
                                },
                                h1: ({ children }) => {
                                  return <h1>{children}</h1>;
                                },
                                h2: ({ children }) => {
                                  return <h2>{children}</h2>;
                                },
                                h3: ({ children }) => {
                                  return <h3>{children}</h3>;
                                },
                                h4: ({ children }) => {
                                  return <h4>{children}</h4>;
                                },
                                h5: ({ children }) => {
                                  return <h5>{children}</h5>;
                                },
                                h6: ({ children }) => {
                                  return <h6>{children}</h6>;
                                },
                                li: ({ children }) => {
                                  return <li>{children}</li>;
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
                                        dangerouslySetInnerHTML={{
                                          __html: txt,
                                        }}
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
                                        dangerouslySetInnerHTML={{
                                          __html: html,
                                        }}
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
                          {readMore.length > 0 && (
                            <div className="fx-centered fx-start-h fx-wrap fit-container box-marg-s box-pad-v">
                              <hr />
                              <p className="p-big">{t("AArGqN7")}</p>
                              {readMore.map((post) => {
                                if (post.image)
                                  return (
                                    <Link
                                      className="fit-container fx-scattered"
                                      key={post.id}
                                      style={{
                                        textDecoration: "none",
                                        color: "var(--black)",
                                      }}
                                      to={`/article/${post.naddr}`}
                                      target="_blank"
                                    >
                                      <div className="fx-centered">
                                        {post.image && (
                                          <div
                                            className=" bg-img cover-bg sc-s-18 "
                                            style={{
                                              backgroundImage: `url(${post.image})`,
                                              minWidth: "48px",
                                              aspectRatio: "1/1",
                                              borderRadius:
                                                "var(--border-r-18)",
                                              border: "none",
                                            }}
                                          ></div>
                                        )}
                                        <div>
                                          <p className="p-one-line">
                                            {post.title}
                                          </p>
                                          {/* <p className="gray-c p-medium"> */}
                                          <DynamicIndicator item={post} />
                                          {/* </p> */}
                                        </div>
                                      </div>
                                    </Link>
                                  );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!showCommentsSection && !isMuted && (
                  <div
                    className="fit-container fx-centered fx-col sticky-to-fixed"
                    style={{
                      bottom: 0,
                      borderTop: "1px solid var(--very-dim-gray)",
                    }}
                  >
                    {isTransEnabled && (
                      <div
                        style={{ position: "relative" }}
                        className="slide-up fx-centered fit-container"
                      >
                        {!isContentTranslating && !showTranslation && (
                          <button
                            className="btn btn-normal slide-up"
                            style={{
                              position: "absolute",
                              top: "-50px",
                              borderRadius: "45px",
                              minWidth: "max-content",
                            }}
                            onClick={translateArticle}
                          >
                            {t("AdHV2qJ")}
                          </button>
                        )}
                        {!isContentTranslating && showTranslation && (
                          <button
                            className="btn btn-red slide-up"
                            style={{
                              position: "absolute",
                              top: "-50px",
                              borderRadius: "45px",
                              minWidth: "max-content",
                            }}
                            onClick={() => setShowTranslation(false)}
                          >
                            {t("AE08Wte")}
                          </button>
                        )}
                        {isContentTranslating && (
                          <button
                            className="btn btn-normal slide-up"
                            style={{
                              position: "absolute",
                              top: "-50px",
                              borderRadius: "45px",
                              minWidth: "max-content",
                            }}
                          >
                            <LoadingDots />
                          </button>
                        )}
                      </div>
                    )}
                    {postActions?.zaps?.zaps?.length > 0 && (
                      <div className="main-middle">
                        <ZapAd
                          zappers={postActions.zaps.zaps}
                          onClick={() =>
                            setUsersList({
                              title: t("AVDZ5cJ"),
                              list: postActions.zaps.zaps.map(
                                (item) => item.pubkey
                              ),
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
                          className={`pointer icon-tooltip ${
                            isZapped ? "orange-c" : ""
                          }`}
                          onClick={() =>
                            setShowCommentsSections({ comment: true })
                          }
                        >
                          <div className="comment-24"></div>
                        </div>
                        <div
                          data-tooltip={t("AMBxvKP")}
                          className={`pointer icon-tooltip `}
                          onClick={() =>
                            setShowCommentsSections({ comment: false })
                          }
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
                          className={`pointer icon-tooltip ${
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
                          <NumberShrink
                            value={postActions.likes.likes.length}
                          />
                        </div>
                      </div>
                      <div className="fx-centered  pointer">
                        <Quote
                          isQuoted={isQuoted}
                          event={post}
                          actions={postActions}
                        />
                        <div
                          className={`icon-tooltip ${
                            isQuoted ? "orange-c" : ""
                          }`}
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
                          <NumberShrink
                            value={postActions.quotes.quotes.length}
                          />
                        </div>
                      </div>
                      <div className="fx-centered">
                        <Zap
                          user={userProfile}
                          event={post}
                          actions={postActions}
                          isZapped={isZapped}
                        />
                        <div
                          data-tooltip={t("AO0OqWT")}
                          className={`pointer icon-tooltip ${
                            isZapped ? "orange-c" : ""
                          }`}
                          onClick={() =>
                            postActions.zaps.total > 0 &&
                            setUsersList({
                              title: t("AVDZ5cJ"),
                              list: postActions.zaps.zaps.map(
                                (item) => item.pubkey
                              ),
                              extras: postActions.zaps.zaps,
                            })
                          }
                        >
                          <NumberShrink value={postActions.zaps.total} />
                        </div>
                      </div>
                      <OptionsDropdown
                        options={[
                          <div
                            onClick={(e) =>
                              copyText(
                                post.naddr,
                                t("ApPw14o", { item: "naddr" }),
                                e
                              )
                            }
                            className="pointer"
                          >
                            <p>{t("ApPw14o", { item: "naddr" })}</p>
                          </div>,
                          <div onClick={() => setShowArticleToCuration(true)}>
                            {t("A89Qqmt")}
                          </div>,
                          <BookmarkEvent
                            label={t("A4ZQj8F")}
                            pubkey={post.author_pubkey}
                            d={post.d}
                          />,
                          <ShareLink
                            label={t("A6enIP3")}
                            title={post.title}
                            description={post.description}
                            path={`/${post.naddr}`}
                            kind={30023}
                            shareImgData={{
                              post,
                              author: userProfile,
                              likes: postActions.likes.likes.length,
                            }}
                          />,
                          <div onClick={muteUnmute} className="pointer">
                            {isMuted ? (
                              <p className="red-c">{t("AKELUbQ")}</p>
                            ) : (
                              <p className="red-c">{t("AGMxuQ0")}</p>
                            )}
                          </div>,
                        ]}
                        displayAbove={true}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            {!post.title && (
              <div
                className="fit-container fx-centered fx-col"
                style={{ height: "100vh" }}
              >
                <h4>{t("AawvPaR")}</h4>
                <p className="gray-c p-centered">{t("AwARx3K")}</p>
                <Link to="/discover">
                  <button className="btn btn-normal btn-small">
                    {t("AJGu0M0")}
                  </button>
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const ReaderIndicator = () => {
  const [scrollPercent, setScrollPercent] = useState(0);
  useEffect(() => {
    const handleScroll = (container) => {
      if (container) {
        const scrollHeight = container.scrollHeight;
        const clientHeight = window.innerHeight;
        const scrollTop = container.scrollTop;

        const remaining =
          100 - (1 - scrollTop / (scrollHeight - clientHeight)) * 100;

        setScrollPercent(remaining);
      }
    };

    const container = document.querySelector(".main-page-nostr-container");

    if (container) {
      container.addEventListener("scroll", () => handleScroll(container));
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", () => handleScroll(container));
      }
    };
  }, []);

  return (
    <div className="fit-container">
      <div
        style={{
          width: `${scrollPercent}%`,
          height: "4px",
          backgroundColor: "var(--c1)",
          transition: ".05s linear",
        }}
      ></div>
    </div>
  );
};

const AuthPreview = ({ pubkey }) => {
  const { t } = useTranslation();
  const { userProfile } = useUserProfile(pubkey);
  return (
    <div className="fx-centered">
      <UserProfilePic
        size={48}
        img={userProfile.picture}
        mainAccountUser={false}
        user_id={userProfile.pubkey}
        allowClick={true}
      />
      <div className="fx-centered fx-col fx-start-v">
        <div>
          <p className="gray-c">{t("AVG3Uga")}</p>
          <p className="p-big p-caps">
            {userProfile.display_name || userProfile.name}
          </p>
        </div>
      </div>
    </div>
  );
};
