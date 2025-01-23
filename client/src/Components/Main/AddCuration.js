import React, { useState } from "react";
import LoadingDots from "../LoadingDots";
import { nanoid } from "nanoid";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import UploadFile from "../UploadFile";
import { useTranslation } from "react-i18next";

export default function AddCuration({
  curation,
  exit,
  relaysToPublish,
  mandatoryKind = false,
  tags = [],
}) {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);

  const { t } = useTranslation();
  const [title, setTitle] = useState(curation?.title || "");
  const [excerpt, setExcerpt] = useState(curation?.description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(curation?.image || "");
  const [isLoading, setIsLoading] = useState(false);
  const [kind, setKind] = useState(curation?.kind || mandatoryKind || 30004);

  const handleFileUplaod = (url) => {
    setThumbnailUrl(url);
  };
  const handleDataUpload = async () => {
    try {
      setIsLoading(true);
      let cover = thumbnailUrl;
      let tempTags = getTags(title, excerpt, cover);
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: curation?.kind || kind,
          content: "",
          tags: tempTags,
          allRelays: [],
        })
      );
      setIsLoading(false);
      exit();
    } catch (err) {
      console.log(err);
      dispatch(
        setToast({
          type: 2,
          desc: t("Acr4Slu"),
        })
      );
    }
  };

  const getTags = (title, description, image) => {
    let tempTags = Array.from(tags);
    let checkStatus = false;
    for (let tag of tempTags) {
      if (tag[0] === "d") {
        checkStatus = true;
      }
    }
    if (!checkStatus) {
      tempTags.push([
        "client",
        "Yakihonne",
        "31990:20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3:1700732875747",
      ]);
      tempTags.push(["published_at", `${Math.floor(Date.now() / 1000)}`]);
      tempTags.push(["d", nanoid()]);
      tempTags.push(["title", title]);
      tempTags.push(["description", description]);
      tempTags.push(["image", image]);
      return tempTags;
    }
    for (let i = 0; i < tempTags.length; i++) {
      if (tempTags[i][0] === "title") {
        tempTags[i][1] = title;
      }
      if (tempTags[i][0] === "description") {
        tempTags[i][1] = description;
      }
      if (tempTags[i][0] === "image") {
        tempTags[i][1] = image;
      }
    }
    return tempTags;
  };
  const initThumbnail = async () => {
    setThumbnailUrl("");
  };

  const handleThumbnailValue = (e) => {
    let value = e.target.value;
    setThumbnailUrl(value);
  };
  const confirmPublishing = () => {
    handleDataUpload();
  };

  return (
    <section
      className="fixed-container fx-centered box-pad-h"
      style={{ zIndex: "10001" }}
    >
      <section
        className="fx-centered fx-col sc-s bg-sp"
        style={{ width: "600px", rowGap: 0 }}
      >
        <div className="fit-container fx-centered fx-col">
          <div
            className="fit-container fx-centered  bg-img cover-bg"
            style={{
              position: "relative",

              height: "200px",
              borderRadius: "0",
              backgroundImage: `url(${thumbnailUrl})`,
              backgroundColor: "var(--dim-gray)",
            }}
          >
            {!thumbnailUrl && (
              <div className="fx-col fx-centered">
                <p className="p-medium gray-c">({t("At5dj7a")})</p>
              </div>
            )}{" "}
            {thumbnailUrl && (
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  position: "absolute",
                  right: "16px",
                  top: "16px",
                  backgroundColor: "var(--dim-gray)",
                  borderRadius: "var(--border-r-50)",
                  zIndex: 10,
                }}
                className="fx-centered pointer"
                onClick={initThumbnail}
              >
                <div className="trash"></div>
              </div>
            )}
          </div>
          <div className="fx-centered fx-wrap fit-container box-pad-v box-pad-h">
            <div className="fit-container fx-centered">
              <input
                type="text"
                className="if ifs-full"
                placeholder={t("AA8XLSe")}
                value={thumbnailUrl}
                onChange={handleThumbnailValue}
              />
              <UploadFile round={true} setImageURL={handleFileUplaod} />
            </div>
            <input
              type="text"
              className="if ifs-full"
              placeholder={t("AqTI7Iu")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              type="text"
              className="if ifs-full"
              placeholder={t("AM6TPts")}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              style={{ height: "100px", paddingTop: "1rem" }}
            />
            <div
              className={`fx-scattered  if ifs-full ${
                mandatoryKind ? "if-disabled" : ""
              }`}
            >
              {kind === 30004 && (
                <p className="p-medium green-c slide-left">{t("AVsaDSa")}</p>
              )}
              {kind === 30005 && (
                <p className="p-medium orange-c slide-right">{t("AuJml4T")}</p>
              )}
              <div
                className={`toggle ${kind === 30005 ? "toggle-orange" : ""} ${
                  kind === 30004 ? "toggle-green" : ""
                }`}
                onClick={() => {
                  if (!mandatoryKind) {
                    kind === 30004 ? setKind(30005) : setKind(30004);
                  }
                }}
              ></div>
            </div>
          </div>
        </div>
        <hr />
        {!curation && (
          <div className="box-pad-v-m fx-centered">
            <button className="btn btn-gst-red" onClick={exit}>
              {t("AB4BSCe")}
            </button>
            <button className="btn btn-normal" onClick={confirmPublishing}>
              {isLoading ? <LoadingDots /> : <>{t("As7IjvV")}</>}
            </button>
          </div>
        )}
        {curation && (
          <div className="box-pad-v-m fx-centered">
            <button className="btn btn-gst-red" onClick={exit}>
              {t("AB4BSCe")}
            </button>
            <button
              className="btn btn-normal"
              onClick={() => handleDataUpload(relaysToPublish)}
            >
              {isLoading ? <LoadingDots /> : <>{t("ACjCNlv")}</>}
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
