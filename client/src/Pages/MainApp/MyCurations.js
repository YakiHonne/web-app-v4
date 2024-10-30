import React, { useEffect, useMemo, useState } from "react";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import LoadingScreen from "../../Components/LoadingScreen";
import PagePlaceholder from "../../Components/PagePlaceholder";
import AddCurationNOSTR from "../../Components/Main/AddCurationNOSTR";
import Date_ from "../../Components/Date_";
import ToDeletePostNOSTR from "../../Components/Main/ToDeletePostNOSTR";
import AddArticlesToCuration from "../../Components/Main/AddArticlesToCuration";
import { Helmet } from "react-helmet";
import { getParsedRepEvent } from "../../Helpers/Encryptions";
import LoadingDots from "../../Components/LoadingDots";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../../Components/Footer";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import ImportantFlashNews from "../../Components/Main/ImportantFlashNews";
import { useSelector } from "react-redux";
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

export default function MyCurations() {
  const { state } = useLocation();
  const navigateTo = useNavigate();

  const userKeys = useSelector((state) => state.userKeys);
  const userMetadata = useSelector((state) => state.userMetadata);
  const userRelays = useSelector((state) => state.userRelays);

  const [curations, setCurations] = useState([]);
  const [tempCurations, setTempCurations] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date().getTime());
  const [showAddCuration, setShowAddCuration] = useState(
    state?.addCuration ? true : false
  );
  const [curationToEdit, setCurationToEdit] = useState(false);
  const [postToDelete, setPostToDelete] = useState(false);
  const [showAddArticlesToCuration, setShowAddArticlesToCuration] =
    useState(false);

  const curationsNumber = useMemo(() => {
    return curations.length >= 10 ? curations.length : `0${curations.length}`;
  }, [curations]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCurations([]);
        let tempCur = [];
        var sub = ndkInstance.subscribe(
          [{ kinds: [30004, 30005], authors: [userKeys.pub] }],
          {  cacheUsage: "CACHE_FIRST" }
        );
        sub.on("event", (curation) => {
          let parsedCuration = getParsedRepEvent(curation);
          tempCur.push({ id: curation.id, d: parsedCuration.d });
          setCurations((prev) => {
            let index = prev.findIndex((item) => item.d === parsedCuration.d);
            let newP = Array.from(prev);
            if (index === -1) newP = [...newP, parsedCuration];
            if (index !== -1) {
              if (prev[index].created_at < curation.created_at) {
                newP.splice(index, 1);
                newP.push(parsedCuration);
              }
            }
            newP = newP.sort(
              (item_1, item_2) => item_2.created_at - item_1.created_at
            );
            return newP;
          });
          setIsLoaded(true);
        });
        sub.on("eose", () => {
          setIsLoading(false);
          setIsLoaded(true);
          setTempCurations(tempCur);
        });
      } catch (err) {
        console.log(err);
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
    let tempArray = Array.from(curations);
    let index = tempArray.findIndex((item) => item.id === postToDelete.id);
    tempArray.splice(index, 1);
    setCurations(tempArray);
    setPostToDelete(false);
  };

  if (!isLoaded) return <LoadingScreen />;
  return (
    <>
      {showAddCuration && (
        <AddCurationNOSTR
          exit={() => {
            setShowAddCuration(false);
            setCurationToEdit(false);
          }}
          curation={
            curationToEdit
              ? { ...curationToEdit.curation, kind: curationToEdit.kind }
              : null
          }
          tags={curationToEdit.tags}
          relaysToPublish={curationToEdit.relays || userRelays}
        />
      )}
      {postToDelete && (
        <ToDeletePostNOSTR
          exit={() => initDeletedPost(false)}
          exitAndRefresh={() => initDeletedPost(true)}
          post_id={postToDelete.id}
          title={postToDelete.title}
          thumbnail={postToDelete.thumbnail}
          curation={true}
          relayToDeleteFrom={userRelays}
          aTag={postToDelete.aTag}
        />
      )}
      {showAddArticlesToCuration && (
        <AddArticlesToCuration
          curation={curationToEdit.curation}
          tags={curationToEdit.tags}
          relaysToPublish={curationToEdit.relays}
          curationKind={curationToEdit.kind}
          postKind={curationToEdit.kind === 30004 ? 30023 : 34235}
          exit={() => {
            setShowAddArticlesToCuration(false);
            setCurationToEdit(false);
          }}
          exitAndRefresh={() => {
            setShowAddArticlesToCuration(false);
            setCurationToEdit(false);
            setTimestamp(new Date().getTime());
          }}
        />
      )}
      {/* {showMigrationPrompt && (
        <MigrationPopUp
          exit={() => {
            setShowMigrationPrompt(false);
            setSelectedCuration(false);
          }}
          confirm={migrateCuration}
        />
      )} */}
      <div>
        <Helmet>
          <title>Yakihonne | My curations</title>
          <meta
            name="description"
            content={
              "Browse your published curations and keep them updated across relays"
            }
          />
          <meta
            property="og:description"
            content={
              "Browse your published curations and keep them updated across relays"
            }
          />

          <meta
            property="og:url"
            content={`https://yakihonne.com/my-curations`}
          />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content="Yakihonne | My curations" />
          <meta property="twitter:title" content="Yakihonne | My curations" />
          <meta
            property="twitter:description"
            content={
              "Browse your published curations and keep them updated across relays"
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
              }}
            >
              <div className="fx-centered fit-container fx-start-h fx-start-v">
                <div style={{ flex: 1.75 }} className="box-pad-h-m">
                  {userMetadata && (
                    <>
                      {(userKeys.sec || (!userKeys.sec && userKeys.ext)) && (
                        <>
                          {(curations.length > 0 || curations.length === 0) && (
                            <div
                              className="fit-container fx-scattered box-pad-v-m"
                              style={{ position: "relative", zIndex: "99" }}
                            >
                              <div className="fx-centered fx-start-v fx-col">
                                <h4>{curationsNumber} curations</h4>
                              </div>
                              <div className="fx-centered">
                                <div
                                  className="round-icon round-icon-tooltip"
                                  data-tooltip={"Add curation"}
                                  onClick={() => setShowAddCuration(true)}
                                >
                                  <p className="p-big">&#xFF0B;</p>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="fit-container nostr-article">
                            {curations.length === 0 && !isLoading && (
                              <PagePlaceholder
                                page={"nostr-curations"}
                                onClick={() => setShowAddCuration(true)}
                              />
                            )}
                            {isLoading && curations.length === 0 && (
                              <div
                                className="fit-container fx-centered fx-col"
                                style={{ height: "50vh" }}
                              >
                                <p>Loading curations</p>
                                <LoadingDots />
                              </div>
                            )}
                            {curations.length > 0 && (
                              <div className="fit-container">
                                <div className="fit-container fx-centered fx-start-h fx-stretch fx-wrap box-pad-v">
                                  {curations.map((curation) => {
                                    let numberOfArticles =
                                      curation.items.length >= 10
                                        ? curation.items.length
                                        : `0${curation.items.length}`;

                                    return (
                                      <div
                                        key={curation.id}
                                        className="sc-s-18 fx-scattered fx-col pointer fit-container"
                                        style={{
                                          position: "relative",
                                          overflow: "visible",
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigateTo(
                                            `/curations/${curation.naddr}`
                                          );
                                        }}
                                      >
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
                                              backgroundColor:
                                                "var(--dim-gray)",
                                              borderRadius:
                                                "var(--border-r-50)",
                                            }}
                                            className="fx-centered pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowAddArticlesToCuration(
                                                true
                                              );
                                              setCurationToEdit({
                                                curation: curation.content,
                                                kind: curation.kind,
                                                tags: curation.tags,
                                                relays: curation.seenOn,
                                              });
                                            }}
                                          >
                                            <div className="add-curation-24"></div>
                                          </div>
                                          <div
                                            style={{
                                              width: "48px",
                                              height: "48px",
                                              backgroundColor:
                                                "var(--dim-gray)",
                                              borderRadius:
                                                "var(--border-r-50)",
                                            }}
                                            className="fx-centered pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowAddCuration(true);
                                              setCurationToEdit({
                                                curation: curation.content,
                                                tags: curation.tags,
                                                kind: curation.kind,
                                                relays: curation.seenOn,
                                              });
                                            }}
                                          >
                                            <div className="write-24"></div>
                                          </div>

                                          <div
                                            style={{
                                              width: "48px",
                                              height: "48px",
                                              backgroundColor:
                                                "var(--dim-gray)",
                                              borderRadius:
                                                "var(--border-r-50)",
                                            }}
                                            className="fx-centered pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPostToDelete({
                                                id: curation.id,
                                                title: curation.title,
                                                thumbnail: curation.image,
                                                aTag: `${curation.kind}:${curation.pubkey}:${curation.d}`,
                                              });
                                            }}
                                          >
                                            <div className="trash-24"></div>
                                          </div>
                                        </div>
                                        <div className="fit-container">
                                          <div
                                            className="bg-img cover-bg fit-container"
                                            style={{
                                              backgroundImage: `url(${curation.image})`,
                                              height: "150px",
                                              borderTopLeftRadius: "18px",
                                              borderTopRightRadius: "18px",
                                            }}
                                          ></div>
                                          <div className="fit-container box-pad-v-m box-pad-h-m">
                                            <div className="fit-container fx-centered fx-start-v fx-col">
                                              <div className="fit-container fx-scattered">
                                                <div className="fx-centered fx-start-h">
                                                  <div className="fx-start-h fx-centered">
                                                    <p
                                                      className="pointer p-medium gray-c round-icon-tooltip"
                                                      data-tooltip={getCAEATooltip(
                                                        curation.published_at,
                                                        curation.created_at
                                                      )}
                                                    >
                                                      Last modified{" "}
                                                      <Date_
                                                        toConvert={
                                                          new Date(
                                                            curation.created_at *
                                                              1000
                                                          )
                                                        }
                                                      />
                                                    </p>
                                                  </div>
                                                  <p className="gray-c p-medium">
                                                    &#9679;
                                                  </p>
                                                  <p className="gray-c p-medium">
                                                    {numberOfArticles} arts.{" "}
                                                  </p>
                                                </div>

                                                {curation.kind === 30004 && (
                                                  <div className="sticker sticker-normal sticker-green">
                                                    Article
                                                  </div>
                                                )}
                                                {curation.kind === 30005 && (
                                                  <div className="sticker sticker-normal sticker-orange">
                                                    Video
                                                  </div>
                                                )}
                                              </div>

                                              <p className="p-maj">
                                                {curation.title}
                                              </p>
                                              <p className="p-two-lines gray-c">
                                                {curation.description}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="fit-container">
                                          <hr />
                                          <div className="fit-container fx-centered fx-start-h box-pad-h-m box-pad-v-m pointer">
                                            <p className="gray-c p-medium">
                                              Posted on
                                            </p>
                                            <div className="fx-centered">
                                              {curation.seenOn.map(
                                                (relay, index) => {
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
                                                }
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <div
                                    style={{ width: "min(100%, 330px)" }}
                                  ></div>
                                  <div
                                    style={{ width: "min(100%, 330px)" }}
                                  ></div>
                                  <div
                                    style={{ width: "min(100%, 330px)" }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      {!userKeys.sec && !userKeys.ext && (
                        <PagePlaceholder page={"nostr-unauthorized"} />
                      )}
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
              {/* <Footer /> */}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
