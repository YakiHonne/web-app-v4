import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingDots from "../LoadingDots";
import relaysOnPlatform from "../../Content/Relays";
import { nanoid } from "nanoid";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { InitEvent } from "../../Helpers/Controlers";

export default function ToPublishDraftsNOSTR({
  postContent = "",
  postTitle = "",
  edit = false,
  exit,
  warning = false,
}) {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const navigateTo = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [screen, setScreen] = useState(1);
  const [relaysToPublish, setRelaysToPublish] = useState([...relaysOnPlatform]);
  const [publishingState, setIsPublishingState] = useState([]);
  const [allRelays, setAllRelays] = useState([...relaysOnPlatform]);

  const Submit = async (kind = 30023) => {
    try {
      if (relaysToPublish.length === 0) return;
      setIsLoading(true);
      let tags = [
        [
          "client",
          "Yakihonne",
          "31990:20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3:1700732875747",
        ],
        ["published_at", `${Date.now()}`],
        ["d", edit || nanoid()],
        ["image", ""],
        ["title", postTitle],
        ["summary", ""],
      ];

      let eventInitEx = await InitEvent(kind, postContent, tags);
      if (!eventInitEx) return;
      dispatch(
        setToPublish({
          eventInitEx,
          allRelays: relaysToPublish,
        })
      );
      navigateTo("/dashboard", { state: { tabNumber: 1, filter: "drafts" } });
      exit();
      return;
    } catch (err) {
      dispatch(
        setToast({
          type: 2,
          desc: "An error has occurred!",
        })
      );
    }
  };

  const handleRelaysToPublish = (relay) => {
    let index = relaysToPublish.findIndex((item) => item === relay);
    let tempArray = Array.from(relaysToPublish);
    if (index === -1) {
      setRelaysToPublish([...relaysToPublish, relay]);
      return;
    }
    tempArray.splice(index, 1);
    setRelaysToPublish(tempArray);
  };
  const checkIfChecked = (relay) => {
    let index = relaysToPublish.findIndex((item) => item === relay);
    if (index === -1) return false;
    return true;
  };

  return (
    <section className="fixed-container fx-centered">
      {screen === 1 && (
        <div
          className="fx-centered fx-col slide-up box-pad-h sc-s-18 box-pad-v bg-sp"
          style={{
            width: "500px",
          }}
        >
          <div className="fx-centered fx-col">
            <h4 className="p-centered">Save your draft</h4>
            <p className="gray-c box-pad-v-s">Do you wish to publish your draft?</p>
          </div>
          {warning && (
            <div className="sc-s-18 box-pad-v-s box-pad-h-s box-marg-s">
              <p className="orange-c p-medium p-centered">Warning</p>
              <p className="gray-c p-medium p-centered">
                Your article contains HTML elements which most likely will not
                be rendered on some clients or platforms.
              </p>
            </div>
          )}
          {/* <div
            className="fit-container fx-centered fx-wrap"
            style={{ maxHeight: "40vh", overflow: "scroll" }}
          >
            {userRelays.length == 0 &&
              allRelays.map((url, index) => {
                if (index === 0)
                  return (
                    <label
                      className="fx-centered fx-start-h fit-container if"
                      htmlFor={`${url}-${index}`}
                      key={`${url}-${index}`}
                    >
                      <input
                        type="checkbox"
                        id={`${url}-${index}`}
                        checked
                        readOnly
                      />
                      <p>{url.split("wss://")[1]}</p>
                    </label>
                  );
                return (
                  <label
                    className="fx-centered fx-start-h fit-container if"
                    htmlFor={`${url}-${index}`}
                    key={`${url}-${index}`}
                  >
                    <input
                      type="checkbox"
                      id={`${url}-${index}`}
                      checked={checkIfChecked(url)}
                      onChange={() => handleRelaysToPublish(url)}
                    />
                    <p>{url.split("wss://")[1]}</p>
                  </label>
                );
              })}
            {userRelays.length > 0 &&
              userRelays.map((url, index) => {
                return (
                  <label
                    className="fx-centered fx-start-h fit-container if"
                    htmlFor={`${url}-${index}`}
                    key={`${url}-${index}`}
                  >
                    <input
                      type="checkbox"
                      id={`${url}-${index}`}
                      checked={checkIfChecked(url)}
                      onChange={() => handleRelaysToPublish(url)}
                    />
                    <p>{url.split("wss://")[1]}</p>
                  </label>
                );
              })}
          </div> */}
          <div className="fx-centered fit-container">
            <button
              className={`btn btn-full  ${
                relaysToPublish.length === 0 ? "btn-disabled" : "btn-normal"
              }`}
              onClick={() => Submit(30024)}
              disabled={isLoading}
            >
              {isLoading ? <LoadingDots /> : "Save draft"}
            </button>
            <button className="btn btn-gst-red btn-full" onClick={exit}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {screen === 3 && (
        <div
          className="fx-centered fx-col slide-up box-pad-h sc-s-d box-pad-v"
          style={{
            width: "500px",
            borderColor: "var(--orange-main)",
          }}
        >
          <div className="fit-container fx-scattered fx-stretch fx-wrap">
            <div className="fx-centered fx-col" style={{ flex: "1 1 300px" }}>
              <h4 className="box-marg-s">Successful relays</h4>
              {publishingState.map((relay, index) => {
                if (relay.status)
                  return (
                    <div
                      className="fx-centered fx-start-h"
                      key={`${relay.url}-${index}`}
                    >
                      <div className="">👌🏻</div>
                      <p>{relay.url}</p>
                    </div>
                  );
              })}
            </div>
            <div
              style={{
                height: "100px",
                width: "1px",
                borderRight: "1px solid var(--dim-gray)",
                flex: "1 1 300px",
              }}
            ></div>
            {publishingState.filter((relay) => !relay.status).length > 0 && (
              <div className="fx-centered fx-col" style={{ flex: "1 1 300px" }}>
                <h4 className="box-marg-s">Failed relays</h4>
                {publishingState.map((relay, index) => {
                  if (!relay.status)
                    return (
                      <div
                        className="fx-centered fx-start-h"
                        key={`${relay.url}-${index}`}
                      >
                        <div className="p-medium">❌</div>
                        <p className="red-c">{relay.url}</p>
                      </div>
                    );
                })}
              </div>
            )}
          </div>
          <div className="fx-centered">
            <button
              className="btn btn-normal"
              onClick={() => navigateTo("/my-articles")}
            >
              Done!
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
