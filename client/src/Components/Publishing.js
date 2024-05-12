import { finalizeEvent } from "nostr-tools";
import React, { useContext, useEffect, useState } from "react";
import { Context } from "../Context/Context";
import LoadingDots from "./LoadingDots";
import { SimplePool } from "nostr-tools";
import LoadingBar from "./LoadingBar";
const pool = new SimplePool();

export default function Publishing() {
  const { toPublish, setToPublish, setToast, isPublishing, setPublishing } =
    useContext(Context);
  const [showDetails, setShowDetails] = useState(false);
  const [startPublishing, setStartPublishing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeoutP, setTimeoutP] = useState(false);
  const [okRelays, setOkRelays] = useState([]);
  const [failedRelays, setFailedRelays] = useState([]);
  const [signedEvent, setSignedEvent] = useState(false);

  useEffect(() => {
    const publishPost = async () => {
      setFailedRelays([]);
      setOkRelays([]);
      setStartPublishing(false);
      setShowDetails(false);
      setIsFinished(false);
      setTimeoutP(false);

      let {
        nostrKeys,
        kind,
        content,
        tags,
        allRelays,
        created_at,
        eventInitEx,
      } = toPublish;
      if (eventInitEx) {
        setFailedRelays(allRelays);
        setStartPublishing(true);
        setPublishing(true);
        setSignedEvent(eventInitEx);
        initPublishing(allRelays, eventInitEx);
        return;
      }
      setFailedRelays(allRelays);
      let event = {
        kind,
        content,
        created_at: created_at || Math.floor(Date.now() / 1000),
        tags,
      };

      if (nostrKeys.ext) {
        try {
          event = await window.nostr.signEvent(event);
          setStartPublishing(true);
        } catch (err) {
          setToPublish(false);
          console.log(err);
          return false;
        }
      } else {
        event = finalizeEvent(event, nostrKeys.sec);
        setStartPublishing(true);
      }

      setPublishing(true);
      setSignedEvent(event);
      initPublishing(allRelays, event);
    };
    if (isPublishing) {
      setToast({
        type: 3,
        desc: "An event publishing is in process!",
      });
      return;
    }
    if (toPublish) publishPost();
    return () => {
      clearTimeout(timeoutP);
    };
  }, [toPublish]);

  const initPublishing = async (relays, event) => {
    try {
      // let pubs = await Promise.all(pool.publish(relays, event));
      // console.log(pubs)

      Promise.allSettled(pool.publish(relays, event))
        .then((results) =>
          results.forEach((result, index) => {
            if (result.status === "fulfilled" && result.value === "") {
              setFailedRelays((prev) => {
                let tempArray = Array.from(prev);
                let _index = tempArray.findIndex(
                  (item) => relays[index] === item
                );
                if (_index !== -1) {
                  tempArray.splice(_index, 1);
                  return tempArray;
                }
                return prev;
              });
              setOkRelays((re) => [...re, relays[index]]);
            }
          })
        )
        .catch((err) => console.log(err));
    } catch (err) {
      console.log(err);
    }

    // pubs.on("ok", (e) => {
    //   setFailedRelays((prev) => {
    //     let tempArray = Array.from(prev);
    //     let index = tempArray.findIndex((item) => e === item);
    //     if (index !== -1) {
    //       tempArray.splice(index, 1);
    //       return tempArray;
    //     }
    //     return prev;
    //   });
    //   setOkRelays((re) => [...re, e]);
    //   if (timeoutP !== false) {
    //     return;
    //   }
    // });

    let timeout = setTimeout(() => {
      // pool.close(relays);
      setIsFinished(true);
      setPublishing(false);
    }, 4000);
    setTimeoutP(timeout);
  };

  const exit = () => {
    setToPublish(false);
    setFailedRelays([]);
    setOkRelays([]);
    setStartPublishing(false);
    setShowDetails(false);
    setIsFinished(false);
    setTimeoutP(false);
  };

  const retry = () => {
    setOkRelays([]);
    setStartPublishing(true);
    setShowDetails(false);
    setIsFinished(false);
    setTimeoutP(false);
    initPublishing(failedRelays, signedEvent);
  };

  if (!toPublish) return;
  if (window.location.pathname === "/messages") return;
  if (showDetails)
    return (
      <div
        className="fixed-container fx-centered"
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(false);
        }}
        style={{ zIndex: 200000 }}
      >
        <div
          className="fx-centered fx-start-h fx-col slide-up box-pad-h"
          style={{
            width: "500px",
            maxHeight: "80vh",
            overflow: "scroll",
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="fit-container fx-scattered fx-stretch fx-wrap">
            <div
              className="fx-centered fx-start-v fx-col"
              style={{ flex: "1 1 300px" }}
            >
              {okRelays.length > 0 && (
                <p className="p-medium gray-c">Successful relays</p>
              )}
              {okRelays.map((relay, index) => {
                return (
                  <div
                    className="fx-scattered if ifs-full"
                    key={`${relay}-${index}`}
                  >
                    <p>{relay}</p>
                    <div className="">👌🏻</div>
                  </div>
                );
              })}
            </div>

            <div
              className="fx-centered fx-start-v fx-col"
              style={{ flex: "1 1 300px" }}
            >
              {failedRelays.length > 0 && (
                <p className="p-medium gray-c">Failed relays</p>
              )}
              {failedRelays.map((relay, index) => {
                return (
                  <div
                    className="fx-scattered if ifs-full"
                    key={`${relay}-${index}`}
                  >
                    <p className="red-c">{relay}</p>
                    <div className="p-medium">❌</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="box-pad-v-s fx-centered">
            <button
              className="btn btn-normal"
              onClick={() => setShowDetails(false)}
            >
              Done!
            </button>
            {failedRelays.length > 0 && (
              <button className="btn btn-gst" onClick={retry}>
                Retry!
              </button>
            )}
          </div>
        </div>
      </div>
    );
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "max-content",
        zIndex: 200000,
      }}
      className="fx-centered box-pad-v box-pad-h"
    >
      <div className="slide-down fit-container fx-centered">
        <div
          className="fx-centered sc-s-18 box-pad-h-m box-pad-v-m"
          style={{ width: "min(100%, 400px)", position: "relative" }}
        >
          {startPublishing && (
            <div className="fx-scattered fit-container">
              {/* <div>
                {okRelays.length} / {toPublish.allRelays.length} relays
                succeeded
              </div> */}
              <div
                className="fx-start-v fx-centered fx-col "
                style={{ width: "80%", height: "max-content" }}
              >
                <div className="fx-centered">
                  <p className="p-medium ">
                    {okRelays.length} /{" "}
                    <span className="gray-c">
                      {failedRelays.length + okRelays.length} relays succeeded
                    </span>
                  </p>
                  {!isFinished && (
                    <div>
                      <LoadingDots />
                    </div>
                  )}
                  {isFinished && failedRelays.length > 0 && (
                    <span className="orange-c p-medium">
                      ({failedRelays.length} relay(s) timedout)
                    </span>
                  )}
                </div>
                <LoadingBar
                  current={okRelays.length}
                  total={failedRelays.length + okRelays.length}
                  full={true}
                />
                {isFinished && (
                  <p
                    className="pointer btn-text-gray p-medium"
                    style={{ height: "max-content" }}
                    onClick={() => setShowDetails(true)}
                  >
                    Details
                  </p>
                )}
              </div>
              <div className="fx-centered">
                {/* <button
                  className="btn btn-text-gray"
                  style={{ height: "max-content" }}
                  onClick={() => setShowDetails(true)}
                >
                  Details
                </button> */}
                <div className="box-pad-h-m"></div>
              </div>
              {!isPublishing && (
                <div className="close" onClick={exit}>
                  <div></div>
                </div>
              )}
            </div>
          )}
          {!startPublishing && (
            <div className="fx-centered">
              <p className="gray-c"> Waiting for siging event</p>{" "}
              <LoadingDots />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
