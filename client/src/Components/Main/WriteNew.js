import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginWithNostr from "./LoginWithNostr";
import { useSelector } from "react-redux";
import { redirectToLogin } from "../../Helpers/Helpers";
import { customHistory } from "../../Helpers/History";

export default function WriteNew({ exit }) {
  const userKeys = useSelector((state) => state.userKeys);
  const [redirectLinks, setRedirectLinks] = useState(false);

  return (
    <>
      {redirectLinks && (
        <RedictingLinks
          exit={() => {
            setRedirectLinks(false);
            exit();
          }}
          internalExit={() => setRedirectLinks(false)}
        />
      )}

      <button
        className="btn btn-full btn-orange fx-centered "
        style={{ padding: 0 }}
        onClick={() =>
          !(userKeys.ext || userKeys.sec)
            ? redirectToLogin()
            : setRedirectLinks(true)
        }
      >
        <div className="plus-sign-w"></div>
        <div className="link-label">Post new</div>
      </button>
    </>
  );
}

const RedictingLinks = ({ exit, internalExit }) => {
  const navigateTo = useNavigate();
  return (
    <div
      className="fixed-container fx-centered box-pad-h"
      style={{ zIndex: "1000" }}
      onClick={(e) => {
        e.stopPropagation();
        internalExit();
      }}
    >
      <div
        className="sc-s-18 box-pad-h-m box-pad-v fx-centered fx-col bg-sp"
        style={{ width: "min(100%,400px)", position: "relative" }}
      >
        <div
          className="close"
          onClick={(e) => {
            e.stopPropagation();
            internalExit();
          }}
        >
          <div></div>
        </div>
        <h4 className="box-marg-s">New publication</h4>
        <div className="fx-centered fx-wrap" onClick={exit}>
          <Link
            to="/dashboard"
            state={{ tabNumber: 1, filter: "notes", init: true }}
            className={`pointer fit-container fx-centered fx-col box-pad-h-s box-pad-v-s option sc-s-18`}
            style={{
              width: "48%",
              padding: "2rem",
              backgroundColor: "transparent",
            }}
          >
            <div
              className="note-plus-24"
              style={{ width: "32px", height: "32px" }}
            ></div>
            <div>Note</div>
          </Link>
          <div
            onClick={() => customHistory.push("/write-article")}
            className={`pointer fit-container fx-centered fx-col box-pad-h-s box-pad-v-s option sc-s-18`}
            style={{
              width: "48%",
              padding: "2rem",
              backgroundColor: "transparent",
            }}
          >
            <div
              className="posts-plus-24"
              style={{ width: "32px", height: "32px" }}
            ></div>
            <div>Article</div>
          </div>

          <Link
            to="/dashboard"
            state={{ tabNumber: 1, filter: "curations", init: true }}
            className={`pointer fit-container fx-centered fx-col box-pad-h-s box-pad-v-s option sc-s-18`}
            style={{
              width: "48%",
              padding: "2rem",
              backgroundColor: "transparent",
            }}
          >
            <div
              className="curation-plus-24"
              style={{ width: "32px", height: "32px" }}
            ></div>
            <div>Curation</div>
          </Link>

          <Link
            to={"/smart-widget-builder"}
            className={`pointer fit-container fx-centered fx-col box-pad-h-s box-pad-v-s option sc-s-18`}
            style={{
              width: "48%",
              padding: "2rem",
              backgroundColor: "transparent",
            }}
          >
            <div
              className="smart-widget-add-24"
              style={{ width: "32px", height: "32px" }}
            ></div>
            <div style={{ width: "max-content" }}>Smart widget</div>
          </Link>
          <Link
            to="/dashboard"
            state={{ tabNumber: 1, filter: "videos", init: true }}
            className={`pointer fit-container fx-centered fx-col box-pad-h-s box-pad-v-s option sc-s-18`}
            style={{
              padding: "2rem",
              backgroundColor: "transparent",
            }}
          >
            <div
              className="play-plus-24"
              style={{ width: "32px", height: "32px" }}
            ></div>
            <div>Video</div>
          </Link>
        </div>
      </div>
    </div>
  );
};
