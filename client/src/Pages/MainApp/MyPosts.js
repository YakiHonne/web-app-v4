import React, { useMemo } from "react";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import { useState } from "react";
import PagePlaceholder from "../../Components/PagePlaceholder";
import LoadingScreen from "../../Components/LoadingScreen";
import { useEffect } from "react";
import Date_ from "../../Components/Date_";
import ToDeletePostNOSTR from "../../Components/Main/ToDeletePostNOSTR";
import placeholder from "../../media/images/nostr-thumbnail-ph.svg";
import { Link, useNavigate } from "react-router-dom";
import LoadingDots from "../../Components/LoadingDots";
import { Helmet } from "react-helmet";
import { getParsedRepEvent } from "../../Helpers/Encryptions";
import Footer from "../../Components/Footer";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import ImportantFlashNews from "../../Components/Main/ImportantFlashNews";
import { useDispatch, useSelector } from "react-redux";
import { setToast } from "../../Store/Slides/Publishers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { getCAEATooltip } from "../../Helpers/Helpers";

const randomColors = Array(100)
  .fill(0, 0, 100)
  .map((item) => {
    let randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    while (randomColor.toLowerCase() === "#ffffff" || randomColor.length < 7)
      randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    return randomColor;
  });

export default function MyPosts() {
  const navigateTo = useNavigate();
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userMetadata = useSelector((state) => state.userMetadata);
  const userRelays = useSelector((state) => state.userRelays);
  const isPublishing = useSelector((state) => state.isPublishing);

  const [posts, setPosts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [postToDelete, setPostToDelete] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [postKind, setPostKind] = useState(0);
  const articlesNumber = useMemo(() => {
    if (postKind === 0)
      return posts.length >= 10 || posts.length === 0
        ? posts.length
        : `0${posts.length}`;
    let num = posts.filter((item) => item.kind === postKind).length;
    return num >= 10 || num === 0 ? num : `0${num}`;
  }, [postKind, posts]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setPosts([]);

        let tPosts = [];
        var sub = ndkInstance.subscribe(
          [{ kinds: [30023, 30024], authors: [userKeys.pub] }],
          { cacheUsage: "CACHE_FIRST" }
        );
        sub.on("event", (event) => {
          let d = event.tags.find((tag) => tag[0] === "d")[1];
          tPosts.push({ id: event.id, kind: event.kind, d });
          setPosts((prev) => {
            let index = prev.findIndex(
              (item) => item.d === d && item.kind === event.kind
            );
            let newP = Array.from(prev);
            if (index === -1) newP = [...newP, getParsedRepEvent(event)];
            if (index !== -1) {
              if (prev[index].created_at < event.created_at) {
                newP.splice(index, 1);
                newP.push(getParsedRepEvent(event));
              }
            }
            newP = newP.sort(
              (item_1, item_2) => item_2.created_at - item_1.created_at
            );

            return newP;
          });
          setIsLoaded(true);
        });
        sub.on("event:dup", (id, relay) => {
          // console.log(id, relay)
        });
        sub.on("eose", () => {
          setIsLoaded(true);
          setIsLoading(false);
        });
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };
    if (userKeys) {
      fetchData();
      return;
    }
    if (!userKeys) {
      setIsLoaded(true);
    }
  }, [userKeys]);

  const initDeletedPost = (state) => {
    if (!state) {
      setPostToDelete(false);
      return;
    }
    removeCurrentPost();
    setPostToDelete(false);
  };

  const removeCurrentPost = () => {
    let index = posts.findIndex((item) => item.id === postToDelete.id);
    let tempArray = Array.from(posts);

    if (index !== -1) {
      tempArray.splice(index, 1);
      setPosts(tempArray);
    }
  };

  // if (!isLoaded) return <LoadingScreen />;
  return (
    <>
      {postToDelete && (
        <ToDeletePostNOSTR
          exit={() => initDeletedPost(false)}
          exitAndRefresh={() => initDeletedPost(true)}
          post_id={postToDelete.id}
          title={postToDelete.title}
          thumbnail={postToDelete.thumbnail}
          relayToDeleteFrom={userRelays}
          aTag={postToDelete.aTag}
        />
      )}

      <div>
        <Helmet>
          <title>Yakihonne | My articles</title>
          <meta
            name="description"
            content={
              "Browse your published articles and edit them across relays"
            }
          />
          <meta
            property="og:description"
            content={
              "Browse your published articles and edit them across relays"
            }
          />

          <meta
            property="og:url"
            content={`https://yakihonne.com/my-articles`}
          />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content="Yakihonne | My articles" />
          <meta property="twitter:title" content="Yakihonne | My articles" />
          <meta
            property="twitter:description"
            content={
              "Browse your published articles and edit them across relays"
            }
          />
        </Helmet>
        <div className="fit-container fx-centered">
          <div className="main-container">
            <SidebarNOSTR />
            <main
              className={`main-page-nostr-container`}
              onClick={(e) => {
                e.stopPropagation();

                setShowFilter(false);
              }}
            >
              <div className="fx-centered fit-container fx-start-h fx-start-v">
                <div style={{ flex: 1.75 }} className="box-pad-h-m">
                  {userMetadata && (
                    <>
                      <div
                        className="box-pad-v-m fit-container fx-scattered"
                        style={{
                          position: "relative",
                          zIndex: "100",
                        }}
                      >
                        <div className="fx-centered fx-col fx-start-v">
                          <h4>{articlesNumber} Articles</h4>
                        </div>
                        <div className="fx-centered">
                          <div style={{ position: "relative" }}>
                            <div
                              style={{ position: "relative" }}
                              className="round-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFilter(!showFilter);
                              }}
                            >
                              <div className="filter"></div>
                            </div>
                            {showFilter && (
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  bottom: "-5px",
                                  backgroundColor: "var(--dim-gray)",
                                  border: "none",
                                  transform: "translateY(100%)",
                                  maxWidth: "550px",
                                  rowGap: "12px",
                                }}
                                className="box-pad-h box-pad-v-m sc-s-18 fx-centered fx-col fx-start-v"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <h5>Filter</h5>
                                <label
                                  htmlFor="radio-all"
                                  className="fit-container fx-centered fx-start-h"
                                >
                                  <input
                                    type="radio"
                                    name="filter"
                                    id="radio-all"
                                    checked={postKind === 0}
                                    onClick={() => setPostKind(0)}
                                  />{" "}
                                  <span style={{ width: "max-content" }}>
                                    All content
                                  </span>
                                </label>
                                <label
                                  htmlFor="radio-published"
                                  className="fit-container fx-centered fx-start-h"
                                >
                                  <input
                                    type="radio"
                                    name="filter"
                                    id="radio-published"
                                    checked={postKind === 30023}
                                    onClick={() => setPostKind(30023)}
                                  />{" "}
                                  <span style={{ width: "max-content" }}>
                                    Published
                                  </span>
                                </label>
                                <label
                                  htmlFor="radio-drafts"
                                  className="fit-container fx-centered fx-start-h"
                                >
                                  <input
                                    type="radio"
                                    name="filter"
                                    id="radio-drafts"
                                    checked={postKind === 30024}
                                    onClick={() => setPostKind(30024)}
                                  />{" "}
                                  <span style={{ width: "max-content" }}>
                                    Drafts
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {isLoading && posts.length === 0 && (
                        <div
                          className="fit-container fx-centered fx-col"
                          style={{ height: "50vh" }}
                        >
                          <p>Loading articles</p>
                          <LoadingDots />
                        </div>
                      )}
                      {/* )} */}
                      <div className="fit-container fx-scattered fx-start-h fx-wrap fx-stretch">
                        {posts.length > 0 && (
                          <>
                            {posts.map((post) => {
                              // let seenOn = checkSeenOn(post.d, post.kind);
                              if (!postKind)
                                return (
                                  <div
                                    className="sc-s-18 fx-scattered fx-col"
                                    style={{
                                      width: "min(100%, 275px)",
                                      position: "relative",
                                      overflow: "visible",
                                    }}
                                    key={post.id}
                                  >
                                    {post.kind === 30024 && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          left: "16px",
                                          top: "16px",
                                        }}
                                      >
                                        <div className="sticker sticker-normal sticker-orange">
                                          Draft
                                        </div>
                                      </div>
                                    )}
                                    {(userKeys.sec ||
                                      (!userKeys.sec && userKeys.ext)) && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          right: "16px",
                                          top: "16px",
                                        }}
                                        className="fx-centered"
                                      >
                                        <div
                                          style={{
                                            width: "48px",
                                            height: "48px",
                                            backgroundColor: "var(--dim-gray)",
                                            borderRadius: "var(--border-r-50)",
                                          }}
                                          className="fx-centered pointer"
                                          onClick={() =>
                                            navigateTo("/write-article", {
                                              state: {
                                                post_pubkey: post.pubkey,
                                                post_id: post.id,
                                                post_kind: post.kind,
                                                post_title: post.title,
                                                post_desc: post.summary,
                                                post_thumbnail: post.image,
                                                post_tags: post.items,
                                                post_d: post.d,
                                                post_content: post.content,
                                                post_published_at:
                                                  post.published_at,
                                              },
                                            })
                                          }
                                        >
                                          <div className="write-24"></div>
                                        </div>

                                        <div
                                          style={{
                                            width: "48px",
                                            height: "48px",
                                            backgroundColor: "var(--dim-gray)",
                                            borderRadius: "var(--border-r-50)",
                                          }}
                                          className="fx-centered pointer"
                                          onClick={() =>
                                            !isPublishing
                                              ? setPostToDelete({
                                                  id: post.id,
                                                  title: post.title,
                                                  thumbnail: post.image,
                                                  aTag: `${post.kind}:${post.pubkey}:${post.d}`,
                                                })
                                              : dispatch(
                                                  setToast({
                                                    type: 3,
                                                    desc: "An event publishing is in process!",
                                                  })
                                                )
                                          }
                                        >
                                          <div className="trash-24"></div>
                                        </div>
                                      </div>
                                    )}
                                    {post.kind === 30023 && (
                                      <Link
                                        to={`/article/${post.naddr}`}
                                        target={"_blank"}
                                        className="fit-container a-no-hover"
                                      >
                                        <div
                                          className="bg-img cover-bg fit-container fx-centered"
                                          style={{
                                            height: "150px",
                                            backgroundColor: "var(--dim-gray)",
                                            backgroundImage: post.image
                                              ? `url(${post.image})`
                                              : `url(${placeholder})`,
                                            borderTopLeftRadius: "18px",
                                            borderTopRightRadius: "18px",
                                          }}
                                        ></div>
                                        <div className="box-pad-h-m box-pad-v-m fit-container">
                                          <div className="fx-start-h fx-centered">
                                            <p
                                              className="p-medium gray-c pointer round-icon-tooltip"
                                              data-tooltip={getCAEATooltip(
                                                post.published_at,
                                                post.created_at
                                              )}
                                            >
                                              Last modified{" "}
                                              <Date_
                                                toConvert={
                                                  new Date(
                                                    post.created_at * 1000
                                                  )
                                                }
                                              />
                                            </p>
                                          </div>
                                          <p>{post.title}</p>
                                        </div>
                                      </Link>
                                    )}
                                    {post.kind === 30024 && (
                                      <div
                                        onClick={() =>
                                          navigateTo("/write-article", {
                                            state: {
                                              post_pubkey: post.pubkey,
                                              post_id: post.id,
                                              post_kind: post.kind,
                                              post_title: post.title,
                                              post_desc: post.summary,
                                              post_thumbnail: post.image,
                                              post_tags: post.items,
                                              post_d: post.d,
                                              post_content: post.content,
                                            },
                                          })
                                        }
                                        className="fit-container pointer"
                                      >
                                        <div
                                          className="bg-img cover-bg fit-container fx-centered"
                                          style={{
                                            height: "150px",
                                            backgroundColor: "var(--dim-gray)",
                                            backgroundImage: post.image
                                              ? `url(${post.image})`
                                              : `url(${placeholder})`,
                                            borderTopLeftRadius: "18px",
                                            borderTopRightRadius: "18px",
                                          }}
                                        ></div>
                                        <div className="box-pad-h-m box-pad-v-m fit-container">
                                          <p
                                            className="p-medium gray-c pointer round-icon-tooltip"
                                            data-tooltip={getCAEATooltip(
                                              post.published_at,
                                              post.created_at
                                            )}
                                          >
                                            Last modified{" "}
                                            <Date_
                                              toConvert={
                                                new Date(post.created_at * 1000)
                                              }
                                            />
                                          </p>
                                          <p>{post.title}</p>
                                        </div>
                                      </div>
                                    )}

                                    <div className="fit-container">
                                      <hr />
                                      <div className="fit-container fx-centered fx-start-h box-pad-h-m box-pad-v-m pointer">
                                        <p className="gray-c p-medium">
                                          Posted on
                                        </p>
                                        <div className="fx-centered">
                                          {post.seenOn.map((relay, index) => {
                                            return (
                                              <div
                                                style={{
                                                  backgroundColor:
                                                    randomColors[index],
                                                  minWidth: "10px",
                                                  aspectRatio: "1/1",
                                                  borderRadius:
                                                    "var(--border-r-50)",
                                                }}
                                                className="pointer round-icon-tooltip"
                                                data-tooltip={relay}
                                                key={relay}
                                              ></div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              if (post.kind === postKind)
                                return (
                                  <div
                                    className="sc-s fx-scattered fx-col"
                                    style={{
                                      width: "min(100%, 330px)",
                                      position: "relative",
                                    }}
                                    key={post.id}
                                  >
                                    {post.kind === 30024 && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          left: "16px",
                                          top: "16px",
                                        }}
                                      >
                                        <div className="sticker sticker-normal sticker-orange">
                                          Draft
                                        </div>
                                      </div>
                                    )}
                                    {(userKeys.sec ||
                                      (!userKeys.sec && userKeys.ext)) && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          right: "16px",
                                          top: "16px",
                                        }}
                                        className="fx-centered"
                                      >
                                        <div
                                          style={{
                                            width: "48px",
                                            height: "48px",
                                            backgroundColor: "var(--dim-gray)",
                                            borderRadius: "var(--border-r-50)",
                                          }}
                                          className="fx-centered pointer"
                                          onClick={() =>
                                            navigateTo("/write-article", {
                                              state: {
                                                post_pubkey: post.pubkey,
                                                post_id: post.id,
                                                post_kind: post.kind,
                                                post_title: post.title,
                                                post_desc: post.summary,
                                                post_thumbnail: post.image,
                                                post_tags: post.items,
                                                post_d: post.d,
                                                post_content: post.content,
                                                post_published_at:
                                                  post.published_at,
                                              },
                                            })
                                          }
                                        >
                                          <div className="write-24"></div>
                                        </div>

                                        <div
                                          style={{
                                            width: "48px",
                                            height: "48px",
                                            backgroundColor: "var(--dim-gray)",
                                            borderRadius: "var(--border-r-50)",
                                          }}
                                          className="fx-centered pointer"
                                          onClick={() =>
                                            !isPublishing
                                              ? setPostToDelete({
                                                  id: post.id,
                                                  title: post.title,
                                                  thumbnail: post.image,
                                                  aTag: `${post.kind}:${post.pubkey}:${post.d}`,
                                                })
                                              : dispatch(
                                                  setToast({
                                                    type: 3,
                                                    desc: "An event publishing is in process!",
                                                  })
                                                )
                                          }
                                        >
                                          <div className="trash-24"></div>
                                        </div>
                                      </div>
                                    )}
                                    {post.kind === 30023 && (
                                      <Link
                                        to={`/article/${post.naddr}`}
                                        target={"_blank"}
                                        className="fit-container"
                                      >
                                        <div
                                          className="bg-img cover-bg fit-container fx-centered"
                                          style={{
                                            height: "150px",
                                            backgroundColor: "var(--dim-gray)",
                                            backgroundImage: post.image
                                              ? `url(${post.image})`
                                              : `url(${placeholder})`,
                                            borderTopLeftRadius: "18px",
                                            borderTopRightRadius: "18px",
                                          }}
                                        ></div>
                                        <div className="box-pad-h-m box-pad-v-m fit-container">
                                          <div className="fx-start-h fx-centered">
                                            <p
                                              className="p-medium gray-c pointer round-icon-tooltip"
                                              data-tooltip={getCAEATooltip(
                                                post.published_at,
                                                post.created_at
                                              )}
                                            >
                                              Last modified{" "}
                                              <Date_
                                                toConvert={
                                                  new Date(
                                                    post.created_at * 1000
                                                  )
                                                }
                                              />
                                            </p>
                                          </div>
                                          <p>{post.title}</p>
                                        </div>
                                      </Link>
                                    )}
                                    {post.kind === 30024 && (
                                      <div
                                        onClick={() =>
                                          navigateTo("/write-article", {
                                            state: {
                                              post_pubkey: post.pubkey,
                                              post_id: post.id,
                                              post_kind: post.kind,
                                              post_title: post.title,
                                              post_desc: post.summary,
                                              post_thumbnail: post.image,
                                              post_tags: post.items,
                                              post_d: post.d,
                                              post_content: post.content,
                                            },
                                          })
                                        }
                                        className="fit-container pointer"
                                      >
                                        <div
                                          className="bg-img cover-bg fit-container fx-centered"
                                          style={{
                                            height: "150px",
                                            backgroundColor: "var(--dim-gray)",
                                            backgroundImage: post.image
                                              ? `url(${post.image})`
                                              : `url(${placeholder})`,
                                            borderTopLeftRadius: "18px",
                                            borderTopRightRadius: "18px",
                                          }}
                                        ></div>
                                        <div className="box-pad-h-m box-pad-v-m fit-container">
                                          <p
                                            className="p-medium gray-c pointer round-icon-tooltip"
                                            data-tooltip={getCAEATooltip(
                                              post.published_at,
                                              post.created_at
                                            )}
                                          >
                                            Last modified{" "}
                                            <Date_
                                              toConvert={
                                                new Date(post.created_at * 1000)
                                              }
                                            />
                                          </p>
                                          <p>{post.title}</p>
                                        </div>
                                      </div>
                                    )}
                                    <div className="fit-container">
                                      <hr />
                                      <div className="fit-container fx-centered fx-start-h box-pad-h-m box-pad-v-m pointer">
                                        <p className="gray-c p-medium">
                                          Posted on
                                        </p>
                                        <div className="fx-centered">
                                          {post.seenOn.map((relay, index) => {
                                            return (
                                              <div
                                                style={{
                                                  backgroundColor:
                                                    randomColors[index],
                                                  minWidth: "10px",
                                                  aspectRatio: "1/1",
                                                  borderRadius:
                                                    "var(--border-r-50)",
                                                }}
                                                className="pointer round-icon-tooltip"
                                                data-tooltip={relay}
                                                key={relay}
                                              ></div>
                                            );
                                          })}
                                          {isLoading && <LoadingDots />}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                            })}
                            <div style={{ flex: "1 1 400px" }}></div>
                            <div style={{ flex: "1 1 400px" }}></div>
                            <div style={{ flex: "1 1 400px" }}></div>
                          </>
                        )}
                        {posts.length === 0 && !isLoading && (
                          <div
                            className="fit-container fx-centered fx-col"
                            style={{ height: "40vh" }}
                          >
                            <h4>No articles were found!</h4>
                            <p className="gray-c p-centered">
                              No articles were found in this relay
                            </p>
                          </div>
                        )}
                        {posts.length > 0 &&
                          postKind !== 0 &&
                          !posts.find((item) => item.kind === postKind) && (
                            <div
                              className="fit-container fx-centered fx-col"
                              style={{ height: "40vh" }}
                            >
                              <h4>No articles were found!</h4>
                              <p className="gray-c p-centered">
                                No articles were found in this relay
                              </p>
                            </div>
                          )}
                      </div>
                    </>
                  )}
                  {!userMetadata && (
                    <PagePlaceholder page={"nostr-not-connected"} />
                  )}
                </div>
                <div
                  className=" fx-centered fx-col fx-start-v extras-homepage"
                  style={{
                    position: "sticky",
                    top: 0,
                    // backgroundColor: "var(--white)",
                    zIndex: "100",
                    flex: 1,
                  }}
                >
                  <div className="sticky fit-container">
                    <SearchbarNOSTR />
                  </div>
                  <ImportantFlashNews />
                  <Footer />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
