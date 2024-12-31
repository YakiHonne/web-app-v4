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
                          <p className="gray-c">
                            {t("AHhPGax", {
                              date: convertDate(
                                new Date(curation.published_at * 1000)
                              ),
                            })}
                          </p>
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
                          onClick={(e) =>
                            copyText(
                              curation.naddr,
                              t("ApPw14o", { item: "naddr" }),
                              e
                            )
                          }
                          className="pointer"
                        >
                          <p>{t("ApPw14o", { item: "naddr" })}</p>
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
