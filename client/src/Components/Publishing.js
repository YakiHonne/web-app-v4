import React, { useEffect, useMemo, useState } from "react";
import LoadingDots from "./LoadingDots";
import LoadingBar from "./LoadingBar";
import axiosInstance from "../Helpers/HTTP_Client";
import { useDispatch, useSelector } from "react-redux";
import { updateYakiChestStats } from "../Helpers/Controlers";
import {
  setIsPublishing,
  setToast,
  setToPublish,
} from "../Store/Slides/Publishers";
import { setUpdatedActionFromYakiChest } from "../Store/Slides/YakiChest";
import {
  NDKEvent,
  NDKNip07Signer,
  NDKPrivateKeySigner,
  NDKRelay,
} from "@nostr-dev-kit/ndk";
import { ndkInstance } from "../Helpers/NDKInstance";
import {
  getOutboxRelays,
  removeEventStats,
  removeRecordFromNDKStore,
} from "../Helpers/DB";
import relaysOnPlatform from "../Content/Relays";
import {
  removeDuplicatedRelays,
  removeRelayLastSlash,
} from "../Helpers/Encryptions";
import Date_ from "./Date_";
import ProgressCirc from "./ProgressCirc";

const PUBLISHING_TIMEOUT = 4000;

const action_key_from_kind = {
  3: "follow_yaki",
  10002: "relays_setup",
  30078: "topics_setup",
  1: "comment_post",
  11: "flashnews_post",
  111: "un_write",
  7: "reaction",
  77: "reaction",
  777: "un_rate",
  30003: "bookmark",
  30004: "curation_post",
  30005: "curation_post",
  30023: "article_post",
  30024: "article_draft",
  34235: "video_post",
  4: "dms-5",
  44: "dms-10",
  1059: "dms-5",
  10599: "dms-10",
  username: "username",
  bio: "bio",
  profile_picture: "profile_picture",
  cover: "cover",
  nip05: "nip05",
  luds: "luds",
};

const getOutboxPubkey = (kind, tags) => {
  if (![1, 6, 7].includes(kind)) return false;
  let pTag = tags.find((tag) => tag[0] === "p");
  if (!pTag) return false;
  return pTag[1];
};

const getPublishedEvents = () => {
  try {
    let publishedEvents = localStorage.getItem("publishedEvents");
    if (publishedEvents) return JSON.parse(publishedEvents);
    return [];
  } catch (err) {
    console.log(err);
    return [];
  }
};

export default function Publishing() {
  const dispatch = useDispatch();
  const toPublish = useSelector((state) => state.toPublish);
  const userFollowings = useSelector((state) => state.userFollowings);
  const userMetadata = useSelector((state) => state.userMetadata);
  const userRelays = useSelector((state) => state.userRelays);

  const [showDetails, setShowDetails] = useState(false);
  const [showEventStats, setShowEventStats] = useState(false);
  const [publishedEvents, setPublishedEvents] = useState(getPublishedEvents());
  const [showToast, setShowToast] = useState(false);

  const succeededEvents = useMemo(() => {
    return publishedEvents.filter((event) =>
      event.relaysToPublish.find((relay) => relay.status === 1)
    ).length;
  }, [publishedEvents]);
  const failedEvents = useMemo(() => {
    return publishedEvents.filter((event) => {
      if (
        event.relaysToPublish.filter((relay) => relay.status === 2).length ===
        event.relaysToPublish.length
      )
        return event;
    }).length;
  }, [publishedEvents]);
  const lastEventStats = useMemo(() => {
    if (publishedEvents.length === 0)
      return {
        percentage: 0,
        succeeded: 0,
        failed: 0,
        total: 0,
      };
    let lastEvent = { ...publishedEvents[publishedEvents.length - 1] };
    let succeeded = lastEvent.relaysToPublish.filter(
      (relay) => relay.status === 1
    ).length;
    let total = lastEvent.relaysToPublish.length;
    return {
      percentage: Math.ceil((succeeded * 100) / total),
      succeeded,
      failed: total - succeeded,
      total,
    };
  }, [publishedEvents]);

  useEffect(() => {
    // if (!toPublish) return;
    let tempArray = Array.from(publishedEvents);

    tempArray = tempArray.map((event) => {
      if (!event.isFinished) return event;
      else {
        let checkIsFinished =
          event.relaysToPublish.filter((relay) => relay.status === 1).length ===
          event.relaysToPublish.length;
        if (checkIsFinished) {
          event.isFinished = true;
          updateYakiChest(event.action_key);
        }
        return event;
      }
    });
    if (JSON.stringify(tempArray) !== JSON.stringify(publishedEvents)) {
      setPublishedEvents(tempArray);
    }
    localStorage.setItem("publishedEvents", JSON.stringify(tempArray));
  }, [publishedEvents]);

  useEffect(() => {
    const publishPost = async () => {
      let { kind, content, tags, eventInitEx } = toPublish;
      let relaysToPublish =
        userRelays.map((relay) => {
          return {
            url: relay,
            status: 0,
          };
        }) || [];
      if (relaysToPublish.length === 0)
        relaysToPublish = relaysOnPlatform.map((relay) => {
          return {
            url: relay,
            status: 0,
          };
        });
      let ak = getActionKey();
      let pTag = getOutboxPubkey(kind, tags);
      let index = publishedEvents.length;

      setShowDetails(false);

      if (eventInitEx) {
        let ndkEvent = new NDKEvent(ndkInstance, eventInitEx);
        let outboxRelays = pTag ? await getOutboxRelays(pTag) : [];
        outboxRelays = outboxRelays.map((relay) => {
          return {
            url: removeRelayLastSlash(relay),
            status: 0,
          };
        });
        relaysToPublish = removeDuplicatedRelays(outboxRelays, relaysToPublish);
        setPublishedEvents((prev) => [
          ...prev,
          {
            ndkEvent: ndkEvent.rawEvent(),
            relaysToPublish,
            isFinished: false,
            action_key: ak,
          },
        ]);
        initPublishing(relaysToPublish, ndkEvent, index, ak);
        setShowToast(true);
        let timer = setTimeout(() => {
          setShowToast(false);
          clearTimeout(timer);
        }, [1500]);
        dispatch(setToPublish(false));
        return;
      }
      // let signer = ndkInstance.signer;
      // if (signer) {
      //   signer = await ndkInstance.signer.user();
      //   signer = signer._pubkey;
      // }
      // if (signer !== userKeys.pub) {
      //   if (userKeys.ext) {
      //     const signer = new NDKNip07Signer();
      //     ndkInstance.signer = signer;
      //   }
      //   if (userKeys.sec) {
      //     const signer = new NDKPrivateKeySigner(userKeys.sec);
      //     ndkInstance.signer = signer;
      //   }
      // }

      const ndkEvent = new NDKEvent(ndkInstance);
      ndkEvent.kind = kind;
      ndkEvent.content = content;
      ndkEvent.tags = Array.from(tags);

      let outboxRelays = pTag ? await getOutboxRelays(pTag) : [];
      outboxRelays = outboxRelays.map((relay) => {
        return {
          url: relay,
          status: 0,
        };
      });
      relaysToPublish = removeDuplicatedRelays(outboxRelays, relaysToPublish);

      try {
        await ndkEvent.sign();
      } catch (err) {
        console.log(err);
        dispatch(
          setToast({
            type: 2,
            desc: "Event signing was denied",
          })
        );
        dispatch(setToPublish(false));
        return;
      }

      setPublishedEvents((prev) => [
        ...prev,
        {
          ndkEvent: ndkEvent.rawEvent(),
          relaysToPublish,
          isFinished: false,
          action_key: ak,
        },
      ]);
      initPublishing(relaysToPublish, ndkEvent, index, ak);
      setShowToast(true);
      let timer = setTimeout(() => {
        setShowToast(false);
        clearTimeout(timer);
      }, [2500]);
      dispatch(setToPublish(false));
    };
    if (toPublish) {
      publishPost();
    }
  }, [toPublish]);

  const handlePublishEvent = async (relay, event, index) => {
    let publish = () => {
      relay
        .publish(event, PUBLISHING_TIMEOUT)
        .then((res) => {
          if (res) {
            setPublishedEvents((prev) => {
              let tempArray = Array.from(prev);
              let index_ = tempArray[index].relaysToPublish.findIndex(
                (_) => _.url === removeRelayLastSlash(relay.url)
              );
              tempArray[index].relaysToPublish[index_].status = 1;
              return tempArray;
            });
          }
        })
        .catch((err) => {
          setPublishedEvents((prev) => {
            let tempArray = Array.from(prev);

            let index_ = tempArray[index].relaysToPublish.findIndex(
              (_) => _.url === removeRelayLastSlash(relay.url)
            );

            if (index_ !== -1) {
              tempArray[index].relaysToPublish[index_].status = 2;
              tempArray[index].relaysToPublish[index_].msg = err.message;
            }
            return tempArray;
          });
        });
    };
    if (relay.connected) {
      publish();
    } else {
      relay.connect().then((res) => {
        publish();
      });
    }
  };
  const initPublishing = async (relays, event, index, action_key) => {
    try {
      if (event.kind === 5) {
        let { aTag, toRemoveFromCache } = toPublish;
        let id = aTag || event.tags[0][1];
        if (id) removeRecordFromNDKStore(id);
        if (toRemoveFromCache) {
          removeEventStats(
            toRemoveFromCache.eventId,
            id,
            toRemoveFromCache.kind
          );
        }
      }

      for (let i = 0; i < relays.length; i++) {
        let relay = ndkInstance.pool.getRelay(relays[i].url);
        handlePublishEvent(relay, event, index);
      }
    } catch (err) {
      console.log(err);
      dispatch(setToPublish(false));
    }

    let timeout = setTimeout(() => {
      setPublishedEvents((prev) => {
        let tempArray = Array.from(prev);
        tempArray[index].relaysToPublish = tempArray[index].relaysToPublish.map(
          (relay) => {
            if (relay.status === 0) return { url: relay.url, status: 2 };
            return relay;
          }
        );
        tempArray[index].isFinished = true;
        return tempArray;
      });
      updateYakiChest(action_key);
      clearTimeout(timeout);
    }, PUBLISHING_TIMEOUT);
  };
  const retry = (event, relays, index) => {
    let ndkEvent = new NDKEvent(ndkInstance, event);
    setPublishedEvents((prev) => {
      let tempArray = Array.from(prev);
      tempArray[index].relaysToPublish = tempArray[index].relaysToPublish.map(
        (relay) => {
          if (relay.status === 2) return { url: relay.url, status: 0 };
          return relay;
        }
      );
      tempArray[index].isFinished = false;
      return tempArray;
    });
    initPublishing(relays, ndkEvent, index);
  };
  const updateYakiChest = async (action_key) => {
    try {
      if (!action_key) return;
      if (Array.isArray(action_key)) {
        for (let action_key_ of action_key) {
          let data = await axiosInstance.post("/api/v1/yaki-chest", {
            action_key: action_key_,
          });
          let { user_stats, is_updated } = data.data;

          if (is_updated) {
            setUpdatedActionFromYakiChest(is_updated);
            updateYakiChestStats(user_stats);
          }
        }
        return;
      }
      if (typeof action_key === "string") {
        let data = await axiosInstance.post("/api/v1/yaki-chest", {
          action_key,
        });
        let { user_stats, is_updated } = data.data;

        if (is_updated) {
          setUpdatedActionFromYakiChest(is_updated);
          updateYakiChestStats(user_stats);
        }
      }
    } catch (err) {
      // console.log(err);
    }
  };
  const getActionKey = () => {
    let { kind, content, tags, eventInitEx } = toPublish;
    if (eventInitEx) {
      let kind_ = eventInitEx.kind;
      if (kind_ === 1) {
        return action_key_from_kind[getKind1FromTags(eventInitEx.tags)];
      }
      if (kind_ === 7) {
        return action_key_from_kind[
          getKind7FromTags(eventInitEx.content, eventInitEx.tags)
        ];
      }
      if (kind === 4) {
        return action_key_from_kind[getKind4FromEvent(eventInitEx.tags)];
      }
      return action_key_from_kind[kind_];
    }

    if (kind === 1) {
      return action_key_from_kind[getKind1FromTags(tags)];
    }
    if (kind === 7) {
      return action_key_from_kind[getKind7FromTags(content, tags)];
    }
    if (kind === 4) {
      return action_key_from_kind[getKind4FromEvent(tags)];
    }
    if (kind === 3) {
      let checkYakiInFollowings = userFollowings.find(
        (item) =>
          item ===
          "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3"
      );
      if (checkYakiInFollowings) return action_key_from_kind[3];
      if (!checkYakiInFollowings) return false;
    }
    if (kind === 0) {
      let updatedUserMeta = getUpdatedMetaProperty(content);
      if (!Array.isArray(updatedUserMeta)) return false;

      let keys = updatedUserMeta.map((key) => action_key_from_kind[key]);

      return keys;
      // return action_key_from_kind[updatedUserMeta];
    }

    return action_key_from_kind[kind];
  };
  const getKind4FromEvent = (tags) => {
    let receiver = tags.find(
      (tag) =>
        tag[0] === "p" &&
        tag[1] ===
          "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3"
    );
    if (receiver) return 44;
    return 4;
  };
  const getKind1FromTags = (tags) => {
    let l = tags.find((tag) => tag[0] === "l");
    if (!l) return 1;
    if (l[1] === "FLASH NEWS") return 11;
    if (l[1] === "UNCENSORED NOTE") return 111;
  };
  const getKind7FromTags = (content, tags) => {
    let l = tags.find((tag) => tag[0] === "l");
    if (!l) {
      if (content === "+") return 7;
      if (content === "-") return 77;
    }

    if (l[1] === "UNCENSORED NOTE RATING") return 777;
  };
  const getUpdatedMetaProperty = (content) => {
    let tempUser = userMetadata;
    let updatedUser = JSON.parse(content);
    let metadataKeys = [];
    if (tempUser.about !== updatedUser.about) metadataKeys.push("bio");
    if (tempUser.banner !== updatedUser.banner) metadataKeys.push("cover");
    if (
      tempUser.display_name !== updatedUser.display_name ||
      tempUser.name !== updatedUser.name
    )
      metadataKeys.push("username");
    if (
      tempUser.lud06 !== updatedUser.lud06 ||
      tempUser.lud16 !== updatedUser.lud16
    )
      metadataKeys.push("luds");
    if (tempUser.nip05 !== updatedUser.nip05) metadataKeys.push("nip05");
    if (tempUser.picture !== updatedUser.picture)
      metadataKeys.push("profile_picture");

    if (metadataKeys.length > 0) return metadataKeys;
    return false;
  };
  const handleShowEventStats = (id) => {
    if (showEventStats === id) {
      setShowEventStats(false);
      return;
    }
    setShowEventStats(id);
  };

  // if (window.location.pathname === "/messages") return;
  if (!userMetadata) return;
  return (
    <>
      {showDetails && (
        <div
          className="fixed-container fx-centered"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(false);
          }}
          style={{ zIndex: 200000 }}
        >
          <div
            className="fx-centered fx-start-h box-pad-v fx-col slide-up box-pad-h sc-s-18"
            style={{
              width: "700px",
              minHeight: "50vh",
              maxHeight: "80vh",
              overflow: "scroll",
              position: "relative",
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div
              className="close"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(false);
              }}
            >
              <div></div>
            </div>
            <div className="fit-container fx-start-h fx-centered">
              <p className="gray-c">Preview</p>
            </div>
            <div className="fit-container fx-scattered">
              <div className="fx-centered fx sc-s-18 box-pad-h box-pad-v fx-col">
                <div className="fx-centered">
                  <div className="total-events-24"></div>
                  <h4>{publishedEvents.length}</h4>
                </div>
                <p className="gray-c">Events</p>
              </div>
              <div className="fx-centered fx sc-s-18 box-pad-h box-pad-v fx-col">
                <div className="fx-centered">
                  <div className="succeeded-events-24"></div>
                  <h4>{succeededEvents}</h4>
                </div>
                <p className="gray-c">Succeeded</p>
              </div>
              <div className="fx-centered fx sc-s-18 box-pad-h box-pad-v fx-col">
                <div className="fx-centered">
                  <div className="failed-events-24"></div>
                  <h4>{failedEvents}</h4>
                </div>
                <p className="gray-c">Failed</p>
              </div>
            </div>
            {publishedEvents.length > 0 && (
              <div className="fit-container fx-centered fx-col f-start-h fx-start-v">
                <div className="fit-container fx-scattered">
                  <p className="gray-c">Events</p>
                  <div
                    className="round-icon-small round-icon-tooltip"
                    data-tooltip="Clear"
                    onClick={() => setPublishedEvents([])}
                  >
                    <div className="trash"></div>
                  </div>
                </div>
                {publishedEvents.map((event, index) => ({ ...event, originalIndex: index })).slice().reverse().map((event, index) => {
                  let succeeded = event.relaysToPublish.filter(
                    (relay) => relay.status === 1
                  ).length;
                  let failed = event.relaysToPublish.filter(
                    (relay) => relay.status === 2
                  );
                  return (
                    <div
                      key={event.id}
                      className="fit-container sc-s-18 box-pad-h-m box-pad-v-m"
                    >
                      <div
                        className="fit-container fx-scattered pointer"
                        onClick={() => handleShowEventStats(event.ndkEvent.id)}
                      >
                        <div className="fit-container fx-centered fx-start-h">
                          <p>
                            <span className="orange-c">
                              Kind {event.ndkEvent.kind}{" "}
                            </span>
                            published on
                          </p>
                          <Date_
                            toConvert={
                              new Date(event.ndkEvent.created_at * 1000)
                            }
                            time={true}
                          />
                        </div>
                        <div
                          className="fx-centered"
                          style={{ minWidth: "max-content" }}
                        >
                          <p className="btn-text">Details</p>
                        </div>
                      </div>
                      {showEventStats === event.ndkEvent.id && (
                        <div className="box-pad-v-m fit-container fx-col fx-centered">
                          {event.relaysToPublish.map((relay, index) => {
                            return (
                              <div
                                className="fx-scattered if ifs-full"
                                key={`${relay.url}-${index}`}
                              >
                                {relay.status === 0 && (
                                  <p className="gray-c">{relay.url}</p>
                                )}
                                {relay.status === 2 && (
                                  <p className="red-c">{relay.url}</p>
                                )}
                                {relay.status === 1 && <p>{relay.url}</p>}
                                {relay.status === 0 && <LoadingDots />}
                                {relay.status === 2 && (
                                  <div
                                    className="crossmark-tt-24"
                                    data-tooltip={relay.msg || ""}
                                  ></div>
                                )}
                                {relay.status === 1 && (
                                  <div className="checkmark-tt-24"></div>
                                )}
                              </div>
                            );
                          })}
                          {event.isFinished &&
                            failed.length > 0 &&
                            userMetadata.pubkey === event.ndkEvent.pubkey && (
                              <button
                                className="btn btn-normal"
                                onClick={() =>
                                  retry(event.ndkEvent, failed, event.originalIndex)
                                }
                              >
                                Retry
                              </button>
                            )}
                        </div>
                      )}
                      <div className="fit-container fx-centered fx-start-h">
                        <p>
                          {succeeded}
                          <span className="gray-c"> succeeded</span>
                        </p>
                        {failed.length > 0 && (
                          <p className="red-c">{failed.length} failed</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {publishedEvents.length === 0 && (
              <div
                className="fit-container fx-centered fx-col"
                style={{ height: "400px" }}
              >
                <h4>No events</h4>
                <p className="gray-c p-centered">
                  Published events stats will appear here!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {showToast && (
        <div className="fit-container box-pad-v-m box-pad-h-m box-marg-s sc-s-18 slide-up-down fx-scattered link-label">
          <div className="fx-centered ">
            <p>Event publishing</p>
            <LoadingDots />
          </div>
          <ProgressCirc percentage={lastEventStats.percentage} size={32} />
        </div>
      )}
      {showToast && (
        <div className="fx-centered desk-hide mb-show slide-up-down mb-show box-marg-s ">
          <div className="round-icon">
            <ProgressCirc percentage={lastEventStats.percentage} size={32} />
          </div>
        </div>
      )}
      <div
        className="fx-centered desk-hide mb-show"
        onClick={() => setShowDetails(true)}
      >
        <div className="round-icon">
          <div className="succeeded-events"></div>
        </div>
      </div>
      <div
        className="sc-s-18 fit-container fx-centered box-marg-s pointer option link-label"
        style={{ backgroundColor: "transparent" }}
        onClick={() => setShowDetails(true)}
      >
        <div
          className="fx-centered fx-col fx-start-h fx-start-v box-pad-h-m box-pad-v-m"
          style={{
            width: "min(100%, 400px)",
            position: "relative",
          }}
        >
          {/* <p className="gray-c p-medium">Publishing status</p> */}
          <div className="fit-container fx-scattered">
            <div className="fx-centered">
              <div className="total-events-24"></div>
              <p className="gray-c">{publishedEvents.length}</p>
            </div>
            <div className="fx-centered">
              <div className="succeeded-events-24"></div>
              <p className="gray-c">{succeededEvents}</p>
            </div>
            <div className="fx-centered">
              <div className="failed-events-24"></div>
              <p className="gray-c">{failedEvents}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
// import React, { useEffect, useState } from "react";
// import LoadingDots from "./LoadingDots";
// import LoadingBar from "./LoadingBar";
// import axiosInstance from "../Helpers/HTTP_Client";
// import { useDispatch, useSelector } from "react-redux";
// import { updateYakiChestStats } from "../Helpers/Controlers";
// import {
//   setIsPublishing,
//   setToast,
//   setToPublish,
// } from "../Store/Slides/Publishers";
// import { setUpdatedActionFromYakiChest } from "../Store/Slides/YakiChest";
// import {
//   NDKEvent,
//   NDKNip07Signer,
//   NDKPrivateKeySigner,
//   NDKRelay,
// } from "@nostr-dev-kit/ndk";
// import { ndkInstance } from "../Helpers/NDKInstance";
// import { getOutboxRelays, removeRecordFromNDKStore } from "../Helpers/DB";
// import relaysOnPlatform from "../Content/Relays";
// import { removeDuplicatedRelays } from "../Helpers/Encryptions";

// const PUBLISHING_TIMEOUT = 5000;

// const action_key_from_kind = {
//   3: "follow_yaki",
//   10002: "relays_setup",
//   30078: "topics_setup",
//   1: "comment_post",
//   11: "flashnews_post",
//   111: "un_write",
//   7: "reaction",
//   77: "reaction",
//   777: "un_rate",
//   30003: "bookmark",
//   30004: "curation_post",
//   30005: "curation_post",
//   30023: "article_post",
//   30024: "article_draft",
//   34235: "video_post",
//   4: "dms-5",
//   44: "dms-10",
//   1059: "dms-5",
//   10599: "dms-10",
//   username: "username",
//   bio: "bio",
//   profile_picture: "profile_picture",
//   cover: "cover",
//   nip05: "nip05",
//   luds: "luds",
// };

// const getOutboxPubkey = (kind, tags) => {
//   if (![1, 6, 7].includes(kind)) return false;
//   let pTag = tags.find((tag) => tag[0] === "p");
//   if (!pTag) return false;
//   return pTag[1];
// };

// export default function Publishing() {
//   const dispatch = useDispatch();
//   const isPublishing = useSelector((state) => state.isPublishing);
//   const toPublish = useSelector((state) => state.toPublish);
//   const userFollowings = useSelector((state) => state.userFollowings);
//   const userMetadata = useSelector((state) => state.userMetadata);
//   const userRelays = useSelector((state) => state.userRelays);

//   const [showDetails, setShowDetails] = useState(false);
//   const [startPublishing, setStartPublishing] = useState(false);
//   const [isFinished, setIsFinished] = useState(false);
//   const [timeoutP, setTimeoutP] = useState(false);
//   const [okRelays, setOkRelays] = useState([]);
//   const [failedRelays, setFailedRelays] = useState([]);
//   const [signedEvent, setSignedEvent] = useState(false);
//   const [action_key, setActionKey] = useState(false);

//   useEffect(() => {
//     const publishPost = async () => {
//       let { userKeys, kind, content, tags, allRelays, eventInitEx } = toPublish;
//       let relaysToPublish =
//         userRelays.map((relay) => {
//           return {
//             url: relay,
//             status: 0,
//           };
//         }) || [];
//       if (relaysToPublish.length === 0)
//         relaysToPublish = relaysOnPlatform.map((relay) => {
//           return {
//             url: relay,
//             status: 0,
//           };
//         });
//       let ak = getActionKey();
//       let pTag = getOutboxPubkey(kind, tags);

//       setActionKey(ak);
//       setFailedRelays([]);
//       setOkRelays([]);
//       setStartPublishing(false);
//       setShowDetails(false);
//       setIsFinished(false);
//       setTimeoutP(false);

//       if (eventInitEx) {
//         let ndkEvent = new NDKEvent(ndkInstance, eventInitEx);
//         let outboxRelays = pTag ? await getOutboxRelays(pTag) : [];
//         outboxRelays = outboxRelays.map((relay) => {
//           return {
//             url: relay,
//             status: 0,
//           };
//         });
//         relaysToPublish = removeDuplicatedRelays(outboxRelays, relaysToPublish);
//         setStartPublishing(true);
//         dispatch(setIsPublishing(true));
//         setSignedEvent(ndkEvent);
//         setFailedRelays(relaysToPublish);
//         initPublishing(relaysToPublish, ndkEvent);
//         return;
//       }

//       let signer = ndkInstance.signer;
//       if (signer) {
//         signer = await ndkInstance.signer.user();
//         signer = signer._pubkey;
//       }
//       if (signer !== userKeys.pub) {
//         if (userKeys.ext) {
//           const signer = new NDKNip07Signer();
//           ndkInstance.signer = signer;
//         }
//         if (userKeys.sec) {
//           const signer = new NDKPrivateKeySigner(userKeys.sec);
//           ndkInstance.signer = signer;
//         }
//       }
//       const ndkEvent = new NDKEvent(ndkInstance);
//       ndkEvent.kind = kind;
//       ndkEvent.content = content;
//       ndkEvent.tags = Array.from(tags);

//       let outboxRelays = pTag ? await getOutboxRelays(pTag) : [];
//       outboxRelays = outboxRelays.map((relay) => {
//         return {
//           url: relay,
//           status: 0,
//         };
//       });
//       relaysToPublish = removeDuplicatedRelays(outboxRelays, relaysToPublish);

//       setFailedRelays(relaysToPublish);
//       try {
//         await ndkEvent.sign();
//       } catch (err) {
//         console.log(err);
//         dispatch(
//           setToast({
//             type: 2,
//             desc: "Event signing was denied",
//           })
//         );
//         dispatch(setToPublish(false));
//         dispatch(setIsPublishing(false));
//         return;
//       }
//       setStartPublishing(true);
//       dispatch(setIsPublishing(true));
//       setSignedEvent(ndkEvent);
//       initPublishing(relaysToPublish, ndkEvent);
//     };
//     if (isPublishing) {
//       dispatch(
//         setToast({
//           type: 3,
//           desc: "An event publishing is in process!",
//         })
//       );
//       return;
//     }
//     if (toPublish) publishPost();
//     return () => {
//       clearTimeout(timeoutP);
//     };
//   }, [toPublish]);

//   useEffect(() => {
//     if (failedRelays.length === 0) {
//       setIsFinished(true);
//       dispatch(setIsPublishing(false));
//     }
//     if (isFinished && okRelays.length > 0) {
//       updateYakiChest();
//       if (window.location.pathname === "/messages")
//         dispatch(setToPublish(false));
//     }
//   }, [isFinished, okRelays]);

//   const handlePublishEvent = async (relay, event) => {
//     relay.connect().then((res) => {
//       relay
//         .publish(event, PUBLISHING_TIMEOUT)
//         .then((res) => {
//           if (res) {
//             setFailedRelays((prev) => {
//               let tempArray = Array.from(prev);
//               let index = tempArray.findIndex(
//                 (_) => _.url === relay.url.slice(0, -1)
//               );
//               if (index !== -1) tempArray.splice(index, 1);
//               return tempArray;
//             });
//             setOkRelays((re) => [
//               ...re,
//               { url: relay.url.slice(0, -1), status: 1 },
//             ]);
//           }
//         })
//         .catch((err) => {
//           setFailedRelays((prev) => {
//             let tempArray = Array.from(prev);
//             let index = tempArray.findIndex(
//               (_) => _.url === relay.url.slice(0, -1)
//             );
//             if (index !== -1) {
//               tempArray[index].status = 2;
//               tempArray[index].msg = err;
//             }
//             return tempArray;
//           });
//         });
//     });
//   };

//   const initPublishing = async (relays, event) => {
//     try {
//       if (event.kind === 5) {
//         let { aTag } = toPublish;
//         let id = aTag || event.tags[0][1];
//         if (id) removeRecordFromNDKStore(id);
//       }
//       for (let i = 0; i < relays.length; i++) {
//         let relay = new NDKRelay(relays[i].url, null, ndkInstance);
//         handlePublishEvent(relay, event);
//       }
//     } catch (err) {
//       console.log(err);
//       dispatch(setToPublish(false));
//       dispatch(setIsPublishing(false));
//     }

//     let timeout = setTimeout(() => {
//       setIsFinished(true);
//       dispatch(setIsPublishing(false));
//       setFailedRelays((prev) => {
//         let tempArray = Array.from(prev);
//         tempArray = tempArray.map((relay) => {
//           if (relay.status === 0) return { url: relay.url, status: 2 };
//           return relay;
//         });
//         return tempArray;
//       });
//     }, PUBLISHING_TIMEOUT);
//     setTimeoutP(timeout);
//   };

//   const exit = (e) => {
//     e.stopPropagation();
//     dispatch(setToPublish(false));
//     setFailedRelays([]);
//     setOkRelays([]);
//     setStartPublishing(false);
//     setShowDetails(false);
//     setIsFinished(false);
//     setTimeoutP(false);
//   };

//   const retry = () => {
//     setOkRelays([]);
//     setStartPublishing(true);
//     setShowDetails(false);
//     setIsFinished(false);
//     setTimeoutP(false);
//     initPublishing(failedRelays, signedEvent);
//   };

//   const updateYakiChest = async () => {
//     try {
//       if (Array.isArray(action_key)) {
//         for (let action_key_ of action_key) {
//           let data = await axiosInstance.post("/api/v1/yaki-chest", {
//             action_key: action_key_,
//           });
//           let { user_stats, is_updated } = data.data;

//           if (is_updated) {
//             setUpdatedActionFromYakiChest(is_updated);
//             updateYakiChestStats(user_stats);
//           }
//         }
//         return;
//       }
//       if (typeof action_key === "string") {
//         let data = await axiosInstance.post("/api/v1/yaki-chest", {
//           action_key,
//         });
//         let { user_stats, is_updated } = data.data;

//         if (is_updated) {
//           setUpdatedActionFromYakiChest(is_updated);
//           updateYakiChestStats(user_stats);
//         }
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const getActionKey = () => {
//     let { kind, content, tags, eventInitEx } = toPublish;
//     if (eventInitEx) {
//       let kind_ = eventInitEx.kind;
//       if (kind_ === 1) {
//         return action_key_from_kind[getKind1FromTags(eventInitEx.tags)];
//       }
//       if (kind_ === 7) {
//         return action_key_from_kind[
//           getKind7FromTags(eventInitEx.content, eventInitEx.tags)
//         ];
//       }
//       if (kind === 4) {
//         return action_key_from_kind[getKind4FromEvent(eventInitEx.tags)];
//       }
//       return action_key_from_kind[kind_];
//     }

//     if (kind === 1) {
//       return action_key_from_kind[getKind1FromTags(tags)];
//     }
//     if (kind === 7) {
//       return action_key_from_kind[getKind7FromTags(content, tags)];
//     }
//     if (kind === 4) {
//       return action_key_from_kind[getKind4FromEvent(tags)];
//     }
//     if (kind === 3) {
//       let checkYakiInFollowings = userFollowings.find(
//         (item) =>
//           item ===
//           "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3"
//       );
//       if (checkYakiInFollowings) return action_key_from_kind[3];
//       if (!checkYakiInFollowings) return false;
//     }
//     if (kind === 0) {
//       let updatedUserMeta = getUpdatedMetaProperty(content);
//       if (!Array.isArray(updatedUserMeta)) return false;

//       let keys = updatedUserMeta.map((key) => action_key_from_kind[key]);

//       return keys;
//       // return action_key_from_kind[updatedUserMeta];
//     }

//     return action_key_from_kind[kind];
//   };

//   const getKind4FromEvent = (tags) => {
//     let receiver = tags.find(
//       (tag) =>
//         tag[0] === "p" &&
//         tag[1] ===
//           "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3"
//     );
//     if (receiver) return 44;
//     return 4;
//   };
//   const getKind1FromTags = (tags) => {
//     let l = tags.find((tag) => tag[0] === "l");
//     if (!l) return 1;
//     if (l[1] === "FLASH NEWS") return 11;
//     if (l[1] === "UNCENSORED NOTE") return 111;
//   };
//   const getKind7FromTags = (content, tags) => {
//     let l = tags.find((tag) => tag[0] === "l");
//     if (!l) {
//       if (content === "+") return 7;
//       if (content === "-") return 77;
//     }

//     if (l[1] === "UNCENSORED NOTE RATING") return 777;
//   };
//   const getUpdatedMetaProperty = (content) => {
//     let tempUser = userMetadata;
//     let updatedUser = JSON.parse(content);
//     let metadataKeys = [];
//     if (tempUser.about !== updatedUser.about) metadataKeys.push("bio");
//     if (tempUser.banner !== updatedUser.banner) metadataKeys.push("cover");
//     if (
//       tempUser.display_name !== updatedUser.display_name ||
//       tempUser.name !== updatedUser.name
//     )
//       metadataKeys.push("username");
//     if (
//       tempUser.lud06 !== updatedUser.lud06 ||
//       tempUser.lud16 !== updatedUser.lud16
//     )
//       metadataKeys.push("luds");
//     if (tempUser.nip05 !== updatedUser.nip05) metadataKeys.push("nip05");
//     if (tempUser.picture !== updatedUser.picture)
//       metadataKeys.push("profile_picture");

//     if (metadataKeys.length > 0) return metadataKeys;
//     return false;
//   };

//   if (!toPublish) return;
//   if (window.location.pathname === "/messages") return;
//   if (showDetails)
//     return (
//       <div
//         className="fixed-container fx-centered"
//         onClick={(e) => {
//           e.stopPropagation();
//           setShowDetails(false);
//         }}
//         style={{ zIndex: 200000 }}
//       >
//         <div
//           className="fx-centered fx-start-h fx-col slide-up box-pad-h"
//           style={{
//             width: "500px",
//             maxHeight: "80vh",
//             overflow: "scroll",
//           }}
//           onClick={(e) => {
//             e.stopPropagation();
//           }}
//         >
//           <div className="fit-container fx-scattered fx-stretch fx-wrap">
//             <div
//               className="fx-centered fx-start-v fx-col"
//               style={{ flex: "1 1 300px" }}
//             >
//               {/* {okRelays.length > 0 && (
//                 <p className="p-medium gray-c">Successful relays</p>
//               )} */}
//               {okRelays.map((relay, index) => {
//                 return (
//                   <div
//                     className="fx-scattered if ifs-full"
//                     key={`${relay.url}-${index}`}
//                   >
//                     <p>{relay.url}</p>
//                     <div className="checkmark-tt-24"></div>
//                     {/* <div className="">👌🏻</div> */}
//                   </div>
//                 );
//               })}
//               {failedRelays.map((relay, index) => {
//                 return (
//                   <div
//                     className="fx-scattered if ifs-full"
//                     key={`${relay.url}-${index}`}
//                   >
//                     {relay.status === 0 && (
//                       <p className="gray-c">{relay.url}</p>
//                     )}
//                     {relay.status === 2 && <p className="red-c">{relay.url}</p>}
//                     {relay.status === 0 && <LoadingDots />}
//                     {relay.status === 2 && (
//                       <div className="crossmark-tt-24"></div>
//                     )}
//                     {/* <div className="p-medium">❌</div> */}
//                   </div>
//                 );
//               })}
//             </div>
//             {/* <div
//               className="fx-centered fx-start-v fx-col"
//               style={{ flex: "1 1 300px" }}
//             >
//               {failedRelays.length > 0 && (
//                 <p className="p-medium gray-c">Failed relays</p>
//               )}
//               {failedRelays.map((relay, index) => {
//                 return (
//                   <div
//                     className="fx-scattered if ifs-full"
//                     key={`${relay}-${index}`}
//                   >
//                     <p className="red-c">{relay}</p>
//                     <div className="p-medium">❌</div>
//                   </div>
//                 );
//               })}
//             </div> */}
//           </div>
//           <div className="box-pad-v-s fx-centered">
//             <button
//               className="btn btn-normal"
//               onClick={() => setShowDetails(false)}
//             >
//               Done!
//             </button>
//             {failedRelays.length > 0 && isFinished && (
//               <button className="btn btn-gst" onClick={retry}>
//                 Retry!
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   return (
//     <div
//       style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         width: "100vw",
//         height: "max-content",
//         zIndex: 200000,
//       }}
//       className="fx-centered box-pad-v box-pad-h"
//       onClick={(e) => e.stopPropagation()}
//     >
//       <div
//         className="slide-down fit-container fx-centered"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div
//           className="fx-centered sc-s-18 box-pad-h-m box-pad-v-m"
//           style={{ width: "min(100%, 400px)", position: "relative" }}
//         >
//           {startPublishing && (
//             <div className="fx-scattered fit-container">
//               {/* <div>
//                 {okRelays.length} / {toPublish.allRelays.length} relays
//                 succeeded
//               </div> */}
//               <div
//                 className="fx-start-v fx-centered fx-col "
//                 style={{ width: "80%", height: "max-content" }}
//               >
//                 <div className="fx-centered">
//                   <p className="p-medium ">
//                     {okRelays.length} /{" "}
//                     <span className="gray-c">
//                       {failedRelays.length + okRelays.length} relays succeeded
//                     </span>
//                   </p>
//                   {!isFinished && (
//                     <div>
//                       <LoadingDots />
//                     </div>
//                   )}
//                   {isFinished && failedRelays.length > 0 && (
//                     <span className="orange-c p-medium">
//                       ({failedRelays.length} relay(s) timedout)
//                     </span>
//                   )}
//                 </div>
//                 <LoadingBar
//                   current={okRelays.length}
//                   total={failedRelays.length + okRelays.length}
//                   full={true}
//                 />
//                 {/* {isFinished && ( */}
//                 <p
//                   className="pointer btn-text-gray p-medium"
//                   style={{ height: "max-content" }}
//                   onClick={() => setShowDetails(true)}
//                 >
//                   Details
//                 </p>
//                 {/* )} */}
//               </div>
//               <div className="fx-centered">
//                 {/* <button
//                   className="btn btn-text-gray"
//                   style={{ height: "max-content" }}
//                   onClick={() => setShowDetails(true)}
//                 >
//                   Details
//                 </button> */}
//                 <div className="box-pad-h-m"></div>
//               </div>
//               {!isPublishing && (
//                 <div className="close" onClick={exit}>
//                   <div></div>
//                 </div>
//               )}
//             </div>
//           )}
//           {!startPublishing && (
//             <div className="fx-centered">
//               <p className="gray-c"> Waiting for siging event</p>{" "}
//               <LoadingDots />
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
