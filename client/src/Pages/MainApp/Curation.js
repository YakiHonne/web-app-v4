import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { nip19 } from "nostr-tools";
import Helmet from "react-helmet";
import {
  checkForLUDS,
  convertDate,
  getBech32,
  getEmptyuserMetadata,
  getParsedRepEvent,
  minimizeKey,
  removeDuplicants,
} from "../../Helpers/Encryptions";
import { copyText, getAuthPubkeyFromNip05 } from "../../Helpers/Helpers";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import Date_ from "../../Components/Date_";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import LoadingScreen from "../../Components/LoadingScreen";
import LoadingDots from "../../Components/LoadingDots";
import ZapTip from "../../Components/Main/ZapTip";
import ShowUsersList from "../../Components/Main/ShowUsersList";
import RepEventPreviewCard from "../../Components/Main/RepEventPreviewCard";
import CheckNOSTRClient from "../../Components/Main/CheckNOSTRClient";
import { useDispatch, useSelector } from "react-redux";
import { setToast } from "../../Store/Slides/Publishers";
import { getUser } from "../../Helpers/Controlers";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import useRepEventStats from "../../Hooks/useRepEventStats";
import Follow from "../../Components/Main/Follow";
import ShareLink from "../../Components/ShareLink";
import BookmarkEvent from "../../Components/Main/BookmarkEvent";
import NumberShrink from "../../Components/NumberShrink";
import Zap from "../../Components/Reactions/Zap";
import Quote from "../../Components/Reactions/Quote";
import Like from "../../Components/Reactions/Like";
import OptionsDropdown from "../../Components/Main/OptionsDropdown";
import RepEventCommentsSection from "../../Components/Main/RepEventCommentsSection";
import { customHistory } from "../../Helpers/History";
import Backbar from "../../Components/Main/Backbar";
import DynamicIndicator from "../../Components/DynamicIndicator";
import { useTranslation } from "react-i18next";

export default function Curation() {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const { t } = useTranslation();
  const { id, CurationKind, AuthNip05, ArtIdentifier } = useParams();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isArtsLoaded, setIsArtsLoaded] = useState(false);
  const [curation, setCuration] = useState(false);
  const [articlesOnCuration, setArticlesOnCuration] = useState([]);
  const [curationAuthor, setCurationAuthor] = useState({});
  const [usersList, setUsersList] = useState(false);
  const [showCommentsSection, setShowCommentsSections] = useState(false);
  const [morePosts, setMorePosts] = useState([]);

  const { postActions } = useRepEventStats(curation?.aTag, curation?.pubkey);

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
    const fetchData = async () => {
      try {
        let naddrData = await checkURL();

        let _curation = { created_at: 0 };
        saveUsers([naddrData.pubkey]);
        let sub = ndkInstance.subscribe(
          [
            {
              kinds: [naddrData.kind],
              "#d": [naddrData.identifier],
            },
          ],
          { cacheUsage: "CACHE_FIRST", groupable: false }
        );

        sub.on("event", (event) => {
          if (event.created_at > _curation.created_at) {
            let parsedCuration = getParsedRepEvent(event);

            _curation = { ...parsedCuration };
            setCuration(parsedCuration);
            setIsLoaded(true);
          }
        });
        sub.on("eose", () => {
          if (!_curation) {
            dispatch(
              setToast({
                type: 2,
                desc: t("ADuKAP4"),
              })
            );
          } else {
            let authPubkeys = removeDuplicants(
              getAuthPubkeys(_curation?.tags || [])
            );
            saveUsers(authPubkeys);
            let dRefs = getDRef(_curation?.tags || []);
            if (dRefs.length === 0) setIsArtsLoaded(true);
            let articles = [];
            let sub_2 = ndkInstance.subscribe(
              [
                {
                  kinds: naddrData.kind === 30004 ? [30023] : [34235],
                  "#d": dRefs,
                },
              ],
              { cacheUsage: "CACHE_FIRST", groupable: false }
            );

            sub_2.on("event", (article) => {
              articles.push(article);
              setArticlesOnCuration((_articles) => {
                let post = getParsedRepEvent(article);
                let newArts = [post, ..._articles];

                return sortPostsOnCuration(dRefs, newArts);
              });
            });
            sub_2.on("eose", () => {
              sub.stop();
              sub_2.stop();
              setIsArtsLoaded(true);
            });
          }
        });
      } catch (err) {
        console.log(err);
        dispatch(
          setToast({
            type: 2,
            desc: t("AAZJZMU"),
          })
        );
        setTimeout(() => {
          customHistory.push("/explore");
        }, 2000);
        return;
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      let naddrData = await checkURL();
      let auth = getUser(naddrData.pubkey);
      if (auth) setCurationAuthor(auth);
      else {
        setCurationAuthor(getEmptyuserMetadata(naddrData.pubkey));
      }
    };
    initAuth();
  }, [nostrAuthors]);

  useEffect(() => {
    try {
      let count = 0;
      let moreCurationsAuthorsPubkeys = [];
      let sub = ndkInstance.subscribe(
        [
          {
            kinds: [30004, 30005],
            limit: 5,
          },
        ],
        { cacheUsage: "CACHE_FIRST", groupable: false }
      );
      sub.on("event", (event) => {
        count += 1;
        if (count < 7) {
          moreCurationsAuthorsPubkeys.push(event.pubkey);
          setMorePosts((prev) => {
            if (!prev.find((prev_) => prev_.id === event.id))
              return [...prev, getParsedRepEvent(event)];
            else return prev;
          });
        }
      });
      sub.on("eose", () => {
        saveUsers(moreCurationsAuthorsPubkeys);
      });
    } catch (err) {
      console.log(err);
      setIsLoaded(true);
    }
  }, []);

  const checkURL = async () => {
    try {
      if (AuthNip05 && ArtIdentifier) {
        let temPubkey = await getAuthPubkeyFromNip05(AuthNip05);
        return {
          pubkey: temPubkey,
          identifier: ArtIdentifier,
          kind: CurationKind === "a" ? 30004 : 30005,
        };
      }
      if (id) {
        let tempNaddrData = nip19.decode(id);
        return tempNaddrData.data;
      }
    } catch (err) {
      customHistory.push("/explore");
    }
  };

  const getDRef = (tags) => {
    let tempArray = [];
    for (let tag of tags) {
      if (tag[0] === "a") {
        tempArray.push(tag[1].split(":").splice(2, 100).join(":"));
      }
    }
    return tempArray;
  };
  const getAuthPubkeys = (tags) => {
    let tempArray = [];
    for (let tag of tags) {
      if (tag[0] === "a") {
        tempArray.push(tag[1].split(":")[1]);
      }
    }
    return tempArray;
  };

  const sortPostsOnCuration = (original, toSort) => {
    let tempArray = [];
    for (let post of original) {
      tempArray.push(toSort.find((item) => item.d === post));
    }
    return tempArray.filter((item) => item);
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
        />
      )}

      <div>
        <Helmet>
          <title>Yakihonne | {curation?.title || ""}</title>
          <meta name="description" content={curation?.description || ""} />
          <meta
            property="og:description"
            content={curation?.description || ""}
          />
          <meta property="og:image" content={curation?.image || ""} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="700" />
          <meta
            property="og:url"
            content={`https://yakihonne.com/curations/${id}`}
          />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content={curation?.title || ""} />
          <meta property="twitter:title" content={curation?.title || ""} />
          <meta
            property="twitter:description"
            content={curation?.description || ""}
          />
          <meta property="twitter:image" content={curation?.image || ""} />
        </Helmet>
        <div className="fit-container fx-centered">
          <div className="main-container">
            <SidebarNOSTR />
            <main className="main-page-nostr-container">
              <div
                className="fit-container fx-centered fx-start-v"
                style={{ minHeight: "100vh" }}
              >
                <div className="fit-container fx-centered fx-start-v fx-col box-pad-h-m main-middle">
                  {showCommentsSection && (
                    <RepEventCommentsSection
                      id={curation.aTag}
                      author={curationAuthor}
                      eventPubkey={curation.pubkey}
                      leaveComment={showCommentsSection.comment}
                      exit={() => setShowCommentsSections(false)}
                      kind={curation.kind}
                      event={curation}
                    />
                  )}
                  {!showCommentsSection && (
                    <>
                      <Backbar />
                      <div
                        className="fx-scattered fit-container box-pad-v"
                        style={{
                          paddingTop: 0,
                          borderBottom: "1px solid var(--very-dim-gray)",
                        }}
                      >
                        <div className="fx-centered">
                          <UserProfilePicNOSTR
                            size={48}
                            img={curationAuthor.picture}
                            mainAccountUser={false}
                            user_id={curationAuthor.pubkey}
                            allowClick={true}
                          />
                          <div className="fx-centered fx-col fx-start-v">
                            <div>
                              <p className="gray-c">{t("AVG3Uga")}</p>
                              <p className="p-big p-caps">
                                {curationAuthor.display_name ||
                                  curationAuthor.name ||
                                  minimizeKey(curation.pubkey)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="fx-centered">
                          <Follow
                            toFollowKey={curationAuthor.pubkey}
                            toFollowName={curationAuthor.name}
                            bulk={false}
                            bulkList={[]}
                          />
                          <ZapTip
                            recipientLNURL={checkForLUDS(
                              curationAuthor.lud06,
                              curationAuthor.lud16
                            )}
                            recipientPubkey={curationAuthor.pubkey}
                            senderPubkey={userKeys.pub}
                            recipientInfo={{
                              name: curationAuthor.name,
                              img: curationAuthor.picture,
                            }}
                            aTag={curation.aTag}
                            forContent={curation.title}
                          />
                        </div>
                      </div>
                      <div
                        className="fit-container fx-scattered fx-start-v fx-col box-pad-v-m"
                        style={{ columnGap: "10px" }}
                        dir="auto"
                      >
                        <h3 dir="auto">{curation.title}</h3>
                        <div
                          className="fx-centered fit-container fx-start-h"
                          style={{ minWidth: "max-content" }}
                        >
                          <p className="gray-c">{t("AHhPGax")}</p>
                          <span
                            className="orange-c p-one-line"
                            style={{ maxWidth: "200px" }}
                          >
                            <CheckNOSTRClient client={curation.client} />
                          </span>
                          <p className="gray-c p-medium">&#8226;</p>
                          <div className="fx-start-h fx-centered">
                            <p
                              className="gray-c pointer round-icon-tooltip"
                              data-tooltip={t("AOsxQxu", {
                                cdate: convertDate(
                                  curation.published_at * 1000
                                ),
                                edate: convertDate(curation.created_at * 1000),
                              })}
                            >
                              <Date_
                                toConvert={new Date(curation.created_at * 1000)}
                              />
                            </p>
                          </div>
                        </div>
                        {curation.description && (
                          <div className="fit-container ">
                            {curation.description}
                          </div>
                        )}
                      </div>
                      {curation.image && (
                        <div className="box-marg-s fit-container">
                          <div
                            className="sc-s-18 bg-img cover-bg fit-container"
                            style={{
                              backgroundImage: `url(${curation.image})`,
                              backgroundColor: "var(--very-dim-gray)",
                              height: "auto",
                              aspectRatio: "20/9",
                            }}
                          ></div>
                        </div>
                      )}
                      <div className="fx-centered fx-start-v fx-col fit-container ">
                        {!articlesOnCuration.length && !isArtsLoaded && (
                          <div
                            className="fx-centered fit-container"
                            style={{ height: "20vh" }}
                          >
                            <p className="gray-c p-medium">{t("AKvHyxG")}</p>
                            <LoadingDots />
                          </div>
                        )}
                        {articlesOnCuration.length > 0 && isArtsLoaded && (
                          <div className="fit-container box-marg-s fx-start-h fx-centered">
                            <h4>
                              {t("A04okTg", {
                                count: articlesOnCuration.length,
                              })}
                            </h4>
                          </div>
                        )}
                        <div
                          className="fit-container fx-scattered"
                          style={{
                            borderTop:
                              articlesOnCuration.length > 0
                                ? "1px solid var(--very-dim-gray)"
                                : "",
                          }}
                        >
                          {articlesOnCuration.length > 0 && (
                            <div
                              className="fx-centered fit-container fx-start-h fx-wrap"
                              style={{ gap: 0 }}
                            >
                              {articlesOnCuration.map((item, index) => {
                                return (
                                  <RepEventPreviewCard
                                    item={item}
                                    key={item.id}
                                  />
                                );
                              })}
                            </div>
                          )}

                          {articlesOnCuration.length === 0 && isArtsLoaded && (
                            <div className="fx-centered fx-col">
                              <p className="gray-c box-pad-v-s">
                                {t("AghKyAt")}
                              </p>
                            </div>
                          )}
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
                            {morePosts.map((curation_) => {
                              if (
                                curation_.id !== curation.id &&
                                curation_.items.length > 0
                              )
                                return (
                                  <Link
                                    key={curation_.id}
                                    className="fit-container fx-centered fx-start-h"
                                    to={`/curations/${curation_.naddr}`}
                                    target="_blank"
                                  >
                                    <div
                                      style={{
                                        minWidth: "48px",
                                        aspectRatio: "1/1",
                                        borderRadius: "var(--border-r-6)",
                                        backgroundImage: `url(${curation_.image})`,
                                        backgroundColor: "black",
                                        position: "relative",
                                      }}
                                      className="bg-img cover-bg fx-centered fx-end-v fx-end-h box-pad-h-s box-pad-v-s"
                                    ></div>
                                    <div>
                                      <p className=" p-two-lines">
                                        {curation_.title || t("AMvUjqZ")}
                                      </p>
                                      <p className="p-small gray-c">
                                        <DynamicIndicator item={curation_} />
                                      </p>
                                    </div>
                                  </Link>
                                );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!showCommentsSection && (
                <div
                  className="fit-container sticky-to-fixed fx-centered"
                  style={{
                    bottom: 0,
                    borderTop: "1px solid var(--very-dim-gray)",
                  }}
                >
                  <div className="main-middle fx-even">
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
                        event={curation}
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
                              extras: [],
                            });
                        }}
                      >
                        <NumberShrink value={postActions.likes.likes.length} />
                      </div>
                    </div>
                    <div className="fx-centered  pointer">
                      <Quote
                        isQuoted={isQuoted}
                        event={curation}
                        actions={postActions}
                      />
                      <div
                        className={`icon-tooltip ${isQuoted ? "orange-c" : ""}`}
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
                        user={curationAuthor}
                        event={curation}
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
                          onClick={(e) => copyText(curation.naddr, "Naddr", e)}
                          className="pointer"
                        >
                          <p>{t("ApPw14o", {item: "naddr"})}</p>
                        </div>,
                        <BookmarkEvent
                          label={t("A8YL3m4")}
                          pubkey={curation.author_pubkey}
                          d={curation.d}
                        />,
                        <ShareLink
                          label={t("AVUI6uC")}
                          title={curation.title}
                          description={curation.description}
                          path={`/${curation.naddr}`}
                          kind={30023}
                          shareImgData={{
                            post: curation,
                            author: curationAuthor,
                            likes: postActions.likes.likes.length,
                          }}
                        />,
                      ]}
                      displayAbove={true}
                    />
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

// import React, { useState, useEffect, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { nip19 } from "nostr-tools";
// import Helmet from "react-helmet";
// import axios from "axios";
// import {
//   checkForLUDS,
//   convertDate,
//   decodeBolt11,
//   filterRelays,
//   getBech32,
//   getBolt11,
//   getEmptyuserMetadata,
//   getParsedRepEvent,
//   getZapper,
//   removeDuplicants,
// } from "../../Helpers/Encryptions";
// import {
//   getAuthPubkeyFromNip05,
//   getCAEATooltip,
//   getVideoContent,
//   redirectToLogin,
// } from "../../Helpers/Helpers";
// import relaysOnPlatform from "../../Content/Relays";
// import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
// import Date_ from "../../Components/Date_";
// import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
// import LoadingScreen from "../../Components/LoadingScreen";
// import LoadingDots from "../../Components/LoadingDots";
// import ZapTip from "../../Components/Main/ZapTip";
// import NumberShrink from "../../Components/NumberShrink";
// import LoginWithNostr from "../../Components/Main/LoginWithNostr";
// import GeneralComments from "../../Components/Main/GeneralComments";
// import ShowUsersList from "../../Components/Main/ShowUsersList";
// import BookmarkEvent from "../../Components/Main/BookmarkEvent";
// import { getImagePlaceholder } from "../../Content/NostrPPPlaceholder";
// import ShareLink from "../../Components/ShareLink";
// import Footer from "../../Components/Footer";
// import VideosPreviewCards from "../../Components/Main/VideosPreviewCards";
// import CheckNOSTRClient from "../../Components/Main/CheckNOSTRClient";
// import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
// import HomeFN from "../../Components/Main/HomeFN";
// import { useDispatch, useSelector } from "react-redux";
// import { setToast, setToPublish } from "../../Store/Slides/Publishers";
// import { getUser } from "../../Helpers/Controlers";
// import { saveUsers } from "../../Helpers/DB";
// import { ndkInstance } from "../../Helpers/NDKInstance";

// const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

// const filterRootComments = (all) => {
//   let temp = [];
//   for (let comment of all) {
//     if (!comment.tags.find((item) => item[0] === "e")) {
//       temp.push({ ...comment, count: countReplies(comment.id, all) });
//     }
//   }
//   return temp;
// };

// const countReplies = (id, all) => {
//   let count = [];

//   for (let comment of all) {
//     let ev = comment.tags.find(
//       (item) => item[3] === "reply" && item[0] === "e" && item[1] === id
//     );
//     if (ev) {
//       count.push(comment, ...countReplies(comment.id, all));
//     }
//   }
//   return count.sort((a, b) => a.created_at - b.created_at);
// };

// export default function Curation() {
//   const dispatch = useDispatch();
//   const userKeys = useSelector((state) => state.userKeys);
//   const userMetadata = useSelector((state) => state.userMetadata);
//   const userRelays = useSelector((state) => state.userRelays);
//   const isPublishing = useSelector((state) => state.isPublishing);
//   const nostrAuthors = useSelector((state) => state.nostrAuthors);

//   const { id, CurationKind, AuthNip05, ArtIdentifier } = useParams();
//   const navigateTo = useNavigate();
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isArtsLoaded, setIsArtsLoaded] = useState(false);
//   const [curation, setCuration] = useState(false);
//   const [curation, setCurationDet] = useState({});
//   const [articlesOnCuration, setArticlesOnCuration] = useState([]);
//   const [curationAuthor, setCurationAuthor] = useState({});
//   const [zapsCount, setZapsCount] = useState(0);
//   const [upvoteReaction, setUpvoteReaction] = useState([]);
//   const [downvoteReaction, setDownvoteReaction] = useState([]);
//   const [comments, setComments] = useState([]);
//   const [netComments, setNetComments] = useState([]);
//   const [zappers, setZappers] = useState([]);
//   const [showComments, setShowComments] = useState(false);
//   const [usersList, setUsersList] = useState(false);
//   const [importantFN, setImportantFN] = useState(false);
//   const isLiked = useMemo(() => {
//     return userKeys
//       ? upvoteReaction
//           .concat(downvoteReaction)
//           .find((item) => item.pubkey === userKeys.pub)
//       : false;
//   }, [upvoteReaction, downvoteReaction, userKeys]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         let naddrData = await checkURL();

//         let _curation = { created_at: 0 };
//         saveUsers([naddrData.pubkey]);
//         let sub = ndkInstance.subscribe(
//           [
//             {
//               kinds: [naddrData.kind],
//               "#d": [naddrData.identifier],
//             },
//           ],
//           { cacheUsage: "CACHE_FIRST" }
//         );

//         sub.on("event", (event) => {
//           if (event.created_at > _curation.created_at) {
//             let parsedCuration = getParsedRepEvent(event);

//             _curation = { ...parsedCuration };
//             setCuration({ ...parsedCuration, naddr: id });
//             setCurationDet(parsedCuration);
//             setIsLoaded(true);
//           }
//         });
//         sub.on("eose", () => {
//           if (!_curation) {
//             dispatch(
//               setToast({
//                 type: 2,
//                 desc: "This curation does not exist",
//               })
//             );
//             setTimeout(() => {
//               customHistory.push("/curations");
//             }, 2000);
//           } else {
//             let authPubkeys = removeDuplicants(getAuthPubkeys(_curation.tags));
//             saveUsers(authPubkeys);
//             let dRefs = getDRef(_curation.tags);
//             if (dRefs.length === 0) setIsArtsLoaded(true);
//             let articles = [];
//             let sub_2 = ndkInstance.subscribe(
//               [
//                 {
//                   kinds: naddrData.kind === 30004 ? [30023] : [34235],
//                   "#d": dRefs,
//                 },
//               ],
//               { closeOnEose: true, cacheUsage: "CACHE_FIRST" }
//             );

//             sub_2.on("event", (article) => {
//               articles.push(article);
//               setArticlesOnCuration((_articles) => {
//                 let post =
//                   article.kind === 30023
//                     ? getPostsInCuration(article)
//                     : getVideoContent(article);
//                 let newArts = [post, ..._articles];

//                 return sortPostsOnCuration(dRefs, newArts);
//               });
//             });
//             sub_2.on("eose", () => {
//               setIsArtsLoaded(true);
//             });
//           }
//         });
//       } catch (err) {
//         console.log(err);
//         dispatch(
//           setToast({
//             type: 2,
//             desc: "Problem in connecting with the relay",
//           })
//         );
//         setTimeout(() => {
//           customHistory.push("/curations");
//         }, 2000);
//         return;
//       }
//     };
//     fetchData();
//   }, []);

//   useEffect(() => {
//     const initSubscription = async () => {
//       let naddrData = await checkURL();
//       const sub = ndkInstance.subscribe(
//         [
//           {
//             kinds: [7, 1],
//             "#a": [
//               `${naddrData.kind}:${naddrData.pubkey}:${naddrData.identifier}`,
//             ],
//           },
//           {
//             kinds: [9735],
//             "#p": [naddrData.pubkey],
//             "#a": [
//               `${naddrData.kind}:${naddrData.pubkey}:${naddrData.identifier}`,
//             ],
//           },
//         ],
//         { cacheUsage: "CACHE_FIRST" }
//       );

//       sub.on("event", (event) => {
//         if (event.kind === 1) {
//           setComments((prev) => {
//             let newCom = [...prev, event];
//             return newCom.sort(
//               (item_1, item_2) => item_2.created_at - item_1.created_at
//             );
//           });
//         }
//         if (event.kind === 9735) {
//           let sats = decodeBolt11(getBolt11(event));
//           let zapper = getZapper(event);
//           setZappers((prev) => {
//             return [...prev, zapper];
//           });
//           setZapsCount((prev) => prev + sats);
//         }

//         if (event.content === "+")
//           setUpvoteReaction((upvoteArticle) => [...upvoteArticle, event]);
//         if (event.content === "-")
//           setDownvoteReaction((downvoteArticle) => [...downvoteArticle, event]);
//       });
//     };
//     if (curation) initSubscription();
//   }, [curation]);

//   useEffect(() => {
//     const initAuth = async () => {
//       let naddrData = await checkURL();
//       let auth = getUser(naddrData.pubkey);
//       if (auth) setCurationAuthor(auth);
//       else {
//         setCurationAuthor(getEmptyuserMetadata(naddrData.pubkey));
//       }
//     };
//     initAuth();
//   }, [nostrAuthors]);

//   useEffect(() => {
//     setNetComments(filterRootComments(comments));
//   }, [comments]);

//   useEffect(() => {
//     const fetchAuth = async () => {
//       try {
//         let tempArts = await Promise.all(
//           articlesOnCuration.map(async (article) => {
//             let auth = getUser(article.author_pubkey);
//             let tempArticle = { ...article };

//             if (auth) {
//               tempArticle.author_img = auth.picture;
//               tempArticle.author_name =
//                 auth.display_name || auth.name || tempArticle.author_name;
//               return tempArticle;
//             } else {
//               return tempArticle;
//             }
//           })
//         );

//         setArticlesOnCuration(tempArts);
//       } catch (err) {
//         console.log(err);
//       }
//     };
//     if (isArtsLoaded) {
//       fetchAuth();
//     }
//   }, [isArtsLoaded]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setIsLoaded(false);
//         const [important] = await Promise.all([
//           axios.get(API_BASE_URL + "/api/v1/mb/flashnews/important"),
//         ]);

//         setImportantFN(important.data);
//       } catch (err) {
//         console.log(err);
//       }
//     };
//     fetchData();
//   }, []);

//   const checkURL = async () => {
//     try {
//       if (AuthNip05 && ArtIdentifier) {
//         let temPubkey = await getAuthPubkeyFromNip05(AuthNip05);
//         return {
//           pubkey: temPubkey,
//           identifier: ArtIdentifier,
//           kind: CurationKind === "a" ? 30004 : 30005,
//         };
//       }
//       if (id) {
//         let tempNaddrData = nip19.decode(id);
//         return tempNaddrData.data;
//       }
//     } catch (err) {
//       customHistory.push("/curations");
//     }
//   };

//   const getDRef = (tags) => {
//     let tempArray = [];
//     for (let tag of tags) {
//       if (tag[0] === "a") {
//         tempArray.push(tag[1].split(":").splice(2, 100).join(":"));
//       }
//     }
//     return tempArray;
//   };
//   const getAuthPubkeys = (tags) => {
//     let tempArray = [];
//     for (let tag of tags) {
//       if (tag[0] === "a") {
//         tempArray.push(tag[1].split(":")[1]);
//       }
//     }
//     return tempArray;
//   };

//   const getPostsInCuration = (article) => {
//     if (!article?.pubkey || article.kind !== 30023) return {};

//     let author_img = "";
//     let author_name = getBech32("npub", article.pubkey).substring(0, 10);
//     let author_pubkey = article.pubkey;
//     let thumbnail = "";
//     let title = "";
//     let d = "";
//     let added_date = new Date(article.created_at * 1000).toDateString();
//     for (let tag of article.tags) {
//       if (tag[0] === "image") thumbnail = tag[1];
//       if (tag[0] === "title") title = tag[1];
//       if (tag[0] === "d") d = tag[1];
//     }
//     let naddr = nip19.naddrEncode({
//       identifier: d,
//       pubkey: author_pubkey,
//       kind: article.kind,
//     });
//     return {
//       id: article.id,
//       thumbnail: thumbnail || getImagePlaceholder(),
//       author_img,
//       author_name,
//       author_pubkey,
//       title,
//       added_date,
//       d,
//       naddr,
//       artURL: naddr,
//       kind: 30023,
//     };
//   };

//   const sortPostsOnCuration = (original, toSort) => {
//     let tempArray = [];
//     for (let post of original) {
//       tempArray.push(toSort.find((item) => item.d === post));
//     }
//     return tempArray.filter((item) => item);
//   };

//   const upvoteCuration = async () => {
//     if (isLoading) return;
//     if (isPublishing) {
//       dispatch(
//         setToast({
//           type: 3,
//           desc: "An event publishing is in process!",
//         })
//       );
//       return;
//     }
//     try {
//       if (!userKeys) {
//         redirectToLogin();
//         return false;
//       }
//       if (isLiked) {
//         setIsLoading(true);
//         dispatch(
//           setToPublish({
//             userKeys: userKeys,
//             kind: 5,
//             content: "This vote will be deleted!",
//             tags: [["e", isLiked.id]],
//             allRelays: userRelays,
//           })
//         );

//         setIsLoading(false);
//         if (isLiked.content === "+") {
//           let tempArray = Array.from(upvoteReaction);
//           let index = tempArray.findIndex((item) => item.id === isLiked.id);
//           tempArray.splice(index, 1);
//           setUpvoteReaction(tempArray);
//           return false;
//         }
//         let tempArray = Array.from(downvoteReaction);
//         let index = tempArray.findIndex((item) => item.id === isLiked.id);
//         tempArray.splice(index, 1);
//         setDownvoteReaction(tempArray);
//       }
//       setIsLoading(true);
//       dispatch(
//         setToPublish({
//           userKeys: userKeys,
//           kind: 7,
//           content: "+",
//           tags: [
//             [
//               "a",
//               `${curation.naddrData.kind}:${curation.pubkey}:${curation.d}`,
//             ],
//             ["p", curation.pubkey],
//           ],
//           allRelays: userRelays,
//         })
//       );

//       setIsLoading(false);
//     } catch (err) {
//       console.log(err);
//       setIsLoading(false);
//     }
//   };
//   const downvoteCuration = async () => {
//     if (isLoading) return;
//     if (isPublishing) {
//       dispatch(
//         setToast({
//           type: 3,
//           desc: "An event publishing is in process!",
//         })
//       );
//       return;
//     }
//     try {
//       if (!userKeys) {
//         redirectToLogin();
//         return false;
//       }
//       if (isLiked) {
//         setIsLoading(true);
//         dispatch(
//           setToPublish({
//             userKeys: userKeys,
//             kind: 5,
//             content: "This vote will be deleted!",
//             tags: [["e", isLiked.id]],
//             allRelays: userRelays,
//           })
//         );
//         setIsLoading(false);
//         if (isLiked.content === "-") {
//           let tempArray = Array.from(downvoteReaction);
//           let index = tempArray.findIndex((item) => item.id === isLiked.id);
//           tempArray.splice(index, 1);
//           setDownvoteReaction(tempArray);
//           return false;
//         }
//         let tempArray = Array.from(upvoteReaction);
//         let index = tempArray.findIndex((item) => item.id === isLiked.id);
//         tempArray.splice(index, 1);
//         setUpvoteReaction(tempArray);
//       }
//       setIsLoading(true);
//       dispatch(
//         setToPublish({
//           userKeys: userKeys,
//           kind: 7,
//           content: "-",
//           tags: [
//             [
//               "a",
//               `${curation.naddrData.kind}:${curation.pubkey}:${curation.d}`,
//             ],
//             ["p", curation.pubkey],
//           ],
//           allRelays: userRelays,
//         })
//       );

//       setIsLoading(false);
//     } catch (err) {
//       console.log(err);
//       setIsLoading(false);
//     }
//   };

//   const refreshComments = (index) => {
//     let tempArray = Array.from(comments);
//     tempArray.splice(index, 1);
//     setComments(tempArray);
//   };

//   const getURLToShare = () => {
//     if (AuthNip05 && ArtIdentifier) {
//       return `/curations/${AuthNip05}/${ArtIdentifier}`;
//     }
//     if (curationAuthor?.nip05) {
//       return `/curations/${curationAuthor.nip05}/${curation.naddrData.identifier}`;
//     }
//     if (id) {
//       return `/curations/${id}`;
//     }
//   };

//   if (!isLoaded) return <LoadingScreen />;
//   return (
//     <>
//       {usersList && (
//         <ShowUsersList
//           exit={() => setUsersList(false)}
//           title={usersList.title}
//           list={usersList.list}
//           extras={usersList.extras}
//         />
//       )}
//       {showComments && (
//         <div className="fixed-container fx-centered">
//           <div
//             className="sc-s-18 box-pad-h box-pad-v"
//             style={{ position: "relative", width: "min(100%,500px)" }}
//           >
//             <div className="close" onClick={() => setShowComments(false)}>
//               <div></div>
//             </div>
//             <GeneralComments
//               comments={comments}
//               aTag={`${curation.naddrData.kind}:${curation.pubkey}:${curation.d}`}
//               refresh={refreshComments}
//               setNetComments={setNetComments}
//             />
//           </div>
//         </div>
//       )}
//       <div>
//         <Helmet>
//           <title>Yakihonne | {curation?.title || ""}</title>
//           <meta name="description" content={curation?.description || ""} />
//           <meta
//             property="og:description"
//             content={curation?.description || ""}
//           />
//           <meta property="og:image" content={curation?.image || ""} />
//           <meta property="og:image:width" content="1200" />
//           <meta property="og:image:height" content="700" />
//           <meta
//             property="og:url"
//             content={`https://yakihonne.com/curations/${id}`}
//           />
//           <meta property="og:type" content="website" />
//           <meta property="og:site_name" content="Yakihonne" />
//           <meta property="og:title" content={curation?.title || ""} />
//           <meta property="twitter:title" content={curation?.title || ""} />
//           <meta
//             property="twitter:description"
//             content={curation?.description || ""}
//           />
//           <meta property="twitter:image" content={curation?.image || ""} />
//         </Helmet>
//         <div className="fit-container fx-centered">
//           <div className="main-container">
//             <SidebarNOSTR />
//             <main className="main-page-nostr-container">
//               {/* <NavbarNOSTR /> */}
//               <div className="fit-container fx-centered fx-start-v">
//                 <div
//                   className="fit-container fx-centered fx-start-v fx-col box-pad-h-m main-middle"
//                   // style={{ columnGap: "32px", flex: 2 }}
//                 >
//                   <div
//                     className="fit-container sc-s bg-img cover-bg fx-centered fx-end-v box-marg-s"
//                     style={{
//                       backgroundImage: `url(${curation?.image || ""})`,
//                       aspectRatio: "10 / 3",
//                       border: "none",
//                       borderTopLeftRadius: "0",
//                       borderTopRightRadius: "0",
//                     }}
//                   ></div>
//                   <div
//                     // style={{ width: "min(100%,700px)" }}
//                     className="fx-centered fx-start-v fx-col fit-container box-pad-h-m"
//                   >
//                     <div className="fx-scattered fit-container fx-start-v">
//                       <div className="fx-centered fx-col fx-start-v">
//                         <div className="fx-start-h fx-centered">
//                           {/* <p className=" gray-c">
//                         <Date_ toConvert={curation.added_date} />
//                       </p>
//                       <div
//                         className="edit round-icon-tooltip"
//                         data-tooltip={`created at ${convertDate(
//                           curation.added_date
//                         )}, edited on ${convertDate(
//                           curation.modified_date
//                         )}`}
//                       ></div> */}
//                           <p
//                             className="pointer gray-c round-icon-tooltip"
//                             data-tooltip={getCAEATooltip(
//                               curation.published_at,
//                               curation.created_at
//                             )}
//                           >
//                             Last modified{" "}
//                             <Date_
//                               toConvert={
//                                 new Date(curation.created_at * 1000)
//                               }
//                             />
//                           </p>
//                           <p className="gray-c p-medium">|</p>
//                           <p className="gray-c">
//                             Posted from{" "}
//                             <span className="orange-c">
//                               {" "}
//                               <CheckNOSTRClient
//                                 client={curation.client}
//                               />{" "}
//                             </span>
//                           </p>
//                         </div>
//                         <h3>{curation.title}</h3>
//                         <p
//                           className="p-three-lines box-marg-s gray-c"
//                           style={{ marginLeft: 0 }}
//                         >
//                           {curation.description}
//                         </p>
//                       </div>

//                       <div
//                         className="round-icon round-icon-tooltip"
//                         data-tooltip={"Bookmark curation"}
//                       >
//                         <BookmarkEvent
//                           pubkey={curation.naddrData.pubkey}
//                           kind={curation.naddrData.kind}
//                           d={curation.naddrData.identifier}
//                           image={curation.image}
//                         />
//                       </div>
//                     </div>
//                     <div className="fit-container fx-centered fx-start-h">
//                       <div
//                         className="fx-centered fx-start-h"
//                         style={{ columnGap: "16px" }}
//                       >
//                         <AuthorPreview_1 author={curationAuthor} />
//                       </div>
//                       <div>
//                         <p className="gray-c">&#9679;</p>
//                       </div>
//                       <div className="fx-centered fx-start-h">
//                         <div className="fx-centered">
//                           <div className="posts"></div>
//                           <p className="gray-c">
//                             {getDRef(curation.tags).length} <span>items</span>
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                     {/* {curation.naddrData.kind === 30004 && ( */}
//                     <div
//                       className="fx-centered fit-container fx-start-h box-pad-v-m"
//                       style={{ columnGap: "12px", marginBottom: "1rem" }}
//                     >
//                       <div className="fx-centered" style={{ columnGap: "8px" }}>
//                         <div
//                           className="icon-tooltip"
//                           data-tooltip="Tip article"
//                         >
//                           <ZapTip
//                             recipientLNURL={checkForLUDS(
//                               curationAuthor.lud06,
//                               curationAuthor.lud16
//                             )}
//                             // recipientLNURL={curationAuthor.lud06 || curationAuthor.lud16}
//                             recipientPubkey={curationAuthor.pubkey}
//                             senderPubkey={userMetadata.pubkey}
//                             recipientInfo={{
//                               name: curationAuthor.name,
//                               img: curationAuthor.picture,
//                             }}
//                             aTag={`${curation.naddrData.kind}:${curation.pubkey}:${curation.d}`}
//                             forContent={curation.title}
//                             onlyIcon={true}
//                           />
//                         </div>
//                         <div
//                           data-tooltip="See zappers"
//                           className="icon-tooltip pointer"
//                           onClick={() =>
//                             zapsCount &&
//                             setUsersList({
//                               title: "Zappers",
//                               list: zappers.map((item) => item.pubkey),
//                               extras: zappers,
//                             })
//                           }
//                         >
//                           <NumberShrink value={zapsCount} />
//                         </div>
//                       </div>
//                       <div
//                         className="fx-centered pointer"
//                         style={{ columnGap: "8px" }}
//                         onClick={() => {
//                           setShowComments(true);
//                         }}
//                       >
//                         <div className="comment-24"></div>
//                         <NumberShrink
//                           value={
//                             netComments.map((item) => item.count).flat()
//                               .length + netComments.length
//                           }
//                         />
//                       </div>
//                       <div
//                         className={`fx-centered pointer ${
//                           isLoading ? "flash" : ""
//                         }`}
//                         style={{ columnGap: "8px" }}
//                       >
//                         <div
//                           className={" icon-tooltip"}
//                           data-tooltip="Upvote"
//                           onClick={upvoteCuration}
//                         >
//                           <div
//                             className={
//                               isLiked?.content === "+"
//                                 ? "arrow-up-bold"
//                                 : "arrow-up"
//                             }
//                             style={{
//                               opacity: isLiked?.content === "-" ? ".2" : 1,
//                             }}
//                           ></div>
//                         </div>
//                         <div
//                           className="icon-tooltip"
//                           data-tooltip="Upvoters"
//                           onClick={() =>
//                             upvoteReaction.length > 0 &&
//                             setUsersList({
//                               title: "Upvoters",
//                               list: upvoteReaction.map((item) => item.pubkey),
//                               extras: [],
//                             })
//                           }
//                         >
//                           <NumberShrink value={upvoteReaction.length} />
//                         </div>
//                       </div>
//                       <div
//                         className={`fx-centered pointer ${
//                           isLoading ? "flash" : ""
//                         }`}
//                         style={{ columnGap: "8px" }}
//                       >
//                         <div
//                           className="icon-tooltip"
//                           data-tooltip="Downvote"
//                           onClick={downvoteCuration}
//                         >
//                           <div
//                             className={
//                               isLiked?.content === "-"
//                                 ? "arrow-up-bold"
//                                 : "arrow-up"
//                             }
//                             style={{
//                               transform: "rotate(180deg)",
//                               opacity: isLiked?.content === "+" ? ".2" : 1,
//                             }}
//                           ></div>
//                         </div>
//                         <div
//                           className="icon-tooltip"
//                           data-tooltip="Downvoters"
//                           onClick={() =>
//                             downvoteReaction.length > 0 &&
//                             setUsersList({
//                               title: "Downvoters",
//                               list: downvoteReaction.map((item) => item.pubkey),
//                               extras: [],
//                             })
//                           }
//                         >
//                           <NumberShrink value={downvoteReaction.length} />
//                         </div>
//                       </div>
//                       <p className="gray-c">|</p>
//                       <ShareLink
//                         path={getURLToShare()}
//                         title={curation.title}
//                         description={curation.description}
//                         kind={30004}
//                         shareImgData={{
//                           post: curation,
//                           author: curationAuthor,
//                           likes: upvoteReaction.length,
//                           dislikes: downvoteReaction.length,
//                         }}
//                       />
//                     </div>
//                     {/* )} */}

//                     {!articlesOnCuration.length && !isArtsLoaded && (
//                       <div
//                         className="fx-centered fit-container"
//                         style={{ height: "20vh" }}
//                       >
//                         <p className="gray-c p-medium">Loading</p>
//                         <LoadingDots />
//                       </div>
//                     )}
//                     {/* {isArtsLoaded && ( */}
//                     <div className="fit-container fx-scattered box-pad-v">
//                       {articlesOnCuration.length > 0 && (
//                         <div
//                           className="fx-centered fx-start-h fx-wrap"
//                           style={{ columnGap: "32px", rowGap: "32px" }}
//                         >
//                           {articlesOnCuration.map((item, index) => {
//                             if (item?.id && item.kind === 30023)
//                               return (
//                                 <div
//                                   className="sc-s-18 bg-img cover-bg  fx-centered fx-end-v fx-shrink pointer"
//                                   style={{
//                                     backgroundImage: `url(${item.thumbnail})`,
//                                     backgroundColor: "var(--dim-gray)",

//                                     flex: "1 1 200px",
//                                     height: "300px",
//                                   }}
//                                   key={`${item.id}-${index}`}
//                                   onClick={() =>
//                                     customHistory.push(`/article/${item.artURL}`)
//                                   }
//                                 >
//                                   <div
//                                     className="fit-container sc-s-18 fx-centered fx-wrap fx-start-h fx-start-v  carousel-card-desc box-pad-h-m box-pad-v-m"
//                                     style={{ maxHeight: "60%", border: "none" }}
//                                   >
//                                     <p
//                                       className="p-three-lines fit-container"
//                                       style={{ color: "white" }}
//                                     >
//                                       {item.title}
//                                     </p>
//                                     <div className="fx-centered fx-start-h fit-container">
//                                       <UserProfilePicNOSTR
//                                         size={16}
//                                         img={item.author_img}
//                                         mainAccountUser={false}
//                                         user_id={item.author_pubkey}
//
//                                       />
//                                       <p className="gray-c p-medium">
//                                         By{" "}
//                                         {item.author_name ||
//                                           getBech32(
//                                             "npub",
//                                             item.author_pubkey
//                                           ).substring(0, 10)}
//                                       </p>
//                                     </div>
//                                   </div>
//                                 </div>
//                               );
//                             if (item?.id && item.kind === 34235)
//                               return (
//                                 <div
//                                   className="  fx-centered fx-end-v fx-shrink pointer"
//                                   style={{
//                                     flex: "1 1 350px",
//                                   }}
//                                 >
//                                   <VideosPreviewCards
//                                     item={item}
//                                     duration={false}
//                                   />
//                                 </div>
//                               );
//                           })}
//                           {CurationKind === "v" && (
//                             <>
//                               <div style={{ flex: "1 1 350px" }}></div>
//                               {/* <div style={{ flex: "1 1 350px" }}></div> */}
//                               {/* <div style={{ flex: "1 1 350px" }}></div> */}
//                             </>
//                           )}
//                           {CurationKind === "a" && (
//                             <>
//                               <div style={{ flex: "1 1 200px" }}></div>
//                               <div style={{ flex: "1 1 200px" }}></div>
//                               <div style={{ flex: "1 1 200px" }}></div>
//                             </>
//                           )}
//                         </div>
//                       )}

//                       {articlesOnCuration.length === 0 && isArtsLoaded && (
//                         <div className="fx-centered fx-col">
//                           <p className="gray-c box-pad-v-s">
//                             more articles will join this topic, stay tuned!
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                     {/* )} */}
//                   </div>
//                 </div>
//                 {/* <div
//                   className=" fx-centered fx-col fx-start-v extras-homepage"
//                   style={{
//                     position: "sticky",
//                     top: 0,
//                     // backgroundColor: "var(--white)",
//                     zIndex: "100",
//                     flex: 1,
//                   }}
//                 >
//                   <div className="sticky fit-container">
//                     <SearchbarNOSTR />
//                   </div>
//                   <div
//                     className=" fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v box-marg-s"
//                     style={{
//                       backgroundColor: "var(--c1-side)",
//                       rowGap: "24px",
//                       border: "none",
//                     }}
//                   >
//                     <h4>Important Flash News</h4>
//                     <HomeFN flashnews={importantFN} />
//                   </div>
//                   <Footer />
//                 </div> */}
//               </div>
//             </main>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// const AuthorPreview_1 = ({ author }) => {
//   if (!author) return;
//   return (
//     <>
//       <UserProfilePicNOSTR
//         size={24}
//         img={author.picture}
//         mainAccountUser={false}
//         allowClick={true}
//         user_id={author.pubkey}
//
//       />
//       <p>
//         Posted by <span className="c1-c">{author.name}</span>
//       </p>
//     </>
//   );
// };
