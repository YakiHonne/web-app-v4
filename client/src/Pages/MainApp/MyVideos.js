import React from "react";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import { useState } from "react";
import { useEffect } from "react";
import { nip19 } from "nostr-tools";
import relaysOnPlatform from "../../Content/Relays";
import Date_ from "../../Components/Date_";
import ToDeletePostNOSTR from "../../Components/Main/ToDeletePostNOSTR";
import { Link, useLocation } from "react-router-dom";
import LoadingDots from "../../Components/LoadingDots";
import { Helmet } from "react-helmet";
import { filterRelays } from "../../Helpers/Encryptions";
import { getVideoContent, getVideoFromURL } from "../../Helpers/Helpers";
import UploadFile from "../../Components/UploadFile";
import { nanoid } from "nanoid";
import ToPublishVideo from "../../Components/Main/ToPublishVideo";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import axios from "axios";
import ImportantFlashNews from "../../Components/Main/ImportantFlashNews";
import Footer from "../../Components/Footer";
import { useDispatch, useSelector } from "react-redux";
import { setToast } from "../../Store/Slides/Publishers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import AddVideo from "../../Components/Main/AddVideo";

export default function MyVideos() {
  const { state } = useLocation();
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const isPublishing = useSelector((state) => state.isPublishing);

  const [activeRelay, setActiveRelay] = useState("");
  const [videos, setVideos] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [postToDelete, setPostToDelete] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(
    state ? state?.addVideo : false
  );

  useEffect(() => {
    setShowAddVideo(state ? state?.addVideo : false);
  }, [state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setVideos([]);
        var sub = ndkInstance.subscribe(
          [{ kinds: [34235], authors: [userKeys.pub] }],
          { closeOnEose: true, cacheUsage: "CACHE_FIRST" }
        );

        sub.on("event", (event) => {
          let parsedEvent = getVideoContent(event);

          setVideos((prev) => {
            return prev.find((video) => video.id === event.id)
              ? prev
              : [parsedEvent, ...prev].sort(
                  (video_1, video_2) => video_2.created_at - video_1.created_at
                );
          });

          setIsLoading(false);
        });
        sub.on("eose", () => {
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
  }, [userKeys, activeRelay]);

  const initDeletedPost = (state) => {
    if (!state) {
      setPostToDelete(false);
      return;
    }
    removeCurrentPost();
    setPostToDelete(false);
  };

  const removeCurrentPost = () => {
    let index = videos.findIndex((item) => item.id === postToDelete.id);
    let tempArray = Array.from(videos);

    if (index !== -1) {
      tempArray.splice(index, 1);
      setVideos(tempArray);
    }
  };

  return (
    <>
      {showAddVideo && (
        <AddVideo
          exit={() => {
            setShowAddVideo(false);
          }}
        />
      )}
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
          <title>Yakihonne | My videos</title>
          <meta name="description" content={"Browse your posted videos"} />
          <meta
            property="og:description"
            content={"Browse your posted videos"}
          />
          <meta property="og:url" content={`https://yakihonne.com/my-videos`} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content="Yakihonne | My videos" />
          <meta property="twitter:title" content="Yakihonne | My videos" />
          <meta
            property="twitter:description"
            content={"Browse your posted videos"}
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
                <div style={{ flex: 1.8 }} className="box-pad-h-m">
                  <div
                    className="box-pad-v-m fit-container fx-scattered"
                    style={{
                      position: "relative",
                      zIndex: "100",
                    }}
                  >
                    <h4>{videos.length} Videos</h4>
                  </div>
                  {isLoading && videos.length === 0 && (
                    <div
                      className="fit-container fx-centered fx-col"
                      style={{ height: "50vh" }}
                    >
                      <p>Loading videos</p>
                      <LoadingDots />
                    </div>
                  )}
                  {/* )} */}
                  <div className="fit-container fx-scattered fx-wrap fx-stretch">
                    {videos.map((video) => {
                      return (
                        <div
                          key={video.id}
                          className=" fx-start-h fx-start-v fx-centered fx-col"
                          style={{ flexBasis: "48%" }}
                        >
                          <Link
                            className="sc-s-18 bg-img cover-bg fit-container fx-centered fx-end-h fx-end-v box-pad-h-s box-pad-v-s"
                            style={{
                              aspectRatio: "16/9",
                              backgroundImage: `url(${video.image})`,
                              backgroundColor: "black",
                              border: "none",
                            }}
                            to={`/videos/${video.naddr}`}
                            target="_blank"
                          >
                            <div
                              className="sticker sticker-small"
                              style={{
                                backgroundColor: "black",
                                color: "white",
                              }}
                            >
                              {video.duration}
                            </div>
                          </Link>
                          <div className="fit-container fx-scattered">
                            <div>
                              <p className="p-two-lines">{video.title}</p>
                              <div className="fit-container fx-centered fx-start-h">
                                <p className="gray-c p-medium">
                                  <Date_
                                    toConvert={
                                      new Date(video.published_at * 1000)
                                    }
                                  />
                                </p>
                              </div>
                            </div>
                            <div
                              style={{
                                minWidth: "48px",
                                minHeight: "48px",
                                backgroundColor: "var(--dim-gray)",
                                borderRadius: "var(--border-r-50)",
                              }}
                              className="fx-centered pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                !isPublishing
                                  ? setPostToDelete({
                                      id: video.id,
                                      title: video.title,
                                      thumbnail: video.thumbnail,
                                      aTag: `${video.kind}:${video.pubkey}:${video.d}`,
                                    })
                                  : dispatch(
                                      setToast({
                                        type: 3,
                                        desc: "An event publishing is in process!",
                                      })
                                    );
                              }}
                            >
                              <div className="trash-24"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {videos.length === 0 && !isLoading && (
                      <div
                        className="fit-container fx-centered fx-col"
                        style={{ height: "40vh" }}
                      >
                        <h4>No videos were found!</h4>
                        <p className="gray-c p-centered">
                          No videos were found in this relay
                        </p>
                      </div>
                    )}
                  </div>
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


