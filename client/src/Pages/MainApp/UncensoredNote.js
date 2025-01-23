import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import Sidebar from "../../Components/Main/Sidebar";
import ArrowUp from "../../Components/ArrowUp";
import axios from "axios";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import UN from "../../Components/Main/UN";
import Date_ from "../../Components/Date_";
import { Link, useParams } from "react-router-dom";
import { encryptEventData } from "../../Helpers/Encryptions";
import { nip19, finalizeEvent } from "nostr-tools";
import LoadingScreen from "../../Components/LoadingScreen";
import LoadingDots from "../../Components/LoadingDots";
import PagePlaceholder from "../../Components/PagePlaceholder";
import {
  extractNip19,
  getNoteTree,
  redirectToLogin,
} from "../../Helpers/Helpers";
import Footer from "../../Components/Footer";
import ShareLink from "../../Components/ShareLink";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { useTranslation } from "react-i18next";

const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;
const MAX_CHAR = 500;

export default function UNEvent() {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userMetadata = useSelector((state) => state.userMetadata);
  const userRelays = useSelector((state) => state.userRelays);
  const isPublishing = useSelector((state) => state.isPublishing);
  const { t } = useTranslation();
  const { nevent } = useParams();
  const [flashNews, setFlashNews] = useState({});
  const [source, setSource] = useState();
  const [uncensoredNotes, setUncensoredNotes] = useState([]);
  const [note, setNote] = useState("");
  const [sealedNote, setSealedNote] = useState(false);
  const [noteType, setNoteType] = useState(true);
  const [content, setContent] = useState("");
  const [balance, setBalance] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const isContributed = useMemo(() => {
    let isThereInNH = flashNews
      ? flashNews?.sealed_not_helpful_notes?.find(
          (un) => JSON.parse(un.content).pubkey === userKeys?.pub
        )
      : false;
    let isThereInUN = uncensoredNotes.find((un) => un.pubkey === userKeys?.pub);
    return isThereInUN || isThereInNH ? true : false;
  }, [uncensoredNotes, userKeys, flashNews]);
  const currentWordsCount = useMemo(() => {
    let value = note.replace(/[^\S\r\n]+/g, " ");
    let wordsArray = value
      .trim()
      .split(" ")
      .filter(
        (word) => !/(https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg))/i.test(word)
      );
    let countedWords = wordsArray.join(" ").length;
    return countedWords || 0;
  }, [note]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        let parsedData = nip19.decode(nevent);

        let [FN, BALANCE] = await Promise.all([
          axios.get(API_BASE_URL + "/api/v1/flashnews/" + parsedData.data.id),
          axios.get(API_BASE_URL + "/api/v1/balance"),
        ]);

        const content = await getNoteTree(FN.data.content);
        setBalance(BALANCE.data.balance);
        setFlashNews(FN.data);
        setUncensoredNotes(
          FN.data.uncensored_notes.filter((note) => {
            let sn_id = FN.data.sealed_note
              ? JSON.parse(FN.data.sealed_note.content).id
              : false;
            let not_hn = FN.data.sealed_not_helpful_notes.find(
              (un) => note.id === JSON.parse(un.content).id
            );
            if (note.id !== sn_id && !not_hn) return note;
          })
        );
        setSealedNote(FN.data.sealed_note);
        setContent(content);
        setIsLoaded(true);
      } catch (err) {
        setIsLoaded(true);
        console.log(err);
      }
    };
    fetchData();
  }, [timestamp]);

  useEffect(() => {
    if (!isLoaded) return;
    let textArea = document.querySelector(".txt-area");
    if (!textArea) return;

    textArea.style.height = `${textArea.scrollHeight}px`;
  }, [note]);

  const handleNoteOnChange = (e) => {
    let value = e.target.value.replace(/[^\S\r\n]+/g, " ");
    setNote(value);
  };
  const handlePublishing = async () => {
    try {
      let parsedData = nip19.decode(nevent);
      if (currentWordsCount === 0) {
        dispatch(
          setToast({
            type: 3,
            desc: t("AKXuNzy"),
          })
        );
        return;
      }
      if (MAX_CHAR - currentWordsCount < 0) {
        dispatch(
          setToast({
            type: 3,
            desc: t("APjSSpQ"),
          })
        );
        return;
      }
      setIsLoading(true);
      let relaysToPublish = userRelays;
      let tags = [];
      let created_at = Math.floor(Date.now() / 1000);
      tags.push([
        "client",
        "Yakihonne",
        "31990:20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3:1700732875747",
      ]);
      tags.push(["e", parsedData.data.id]);
      tags.push(["l", "UNCENSORED NOTE"]);
      tags.push(["yaki_flash_news", encryptEventData(`${created_at}`)]);
      tags.push(["type", noteType ? "-" : "+"]);
      if (source) tags.push(["source", source]);
      let parsed = extractNip19(note);
      let content = parsed.content;
      let event = {
        kind: 1,
        content,
        created_at,
        tags: [...tags, ...parsed.tags],
      };
      if (userKeys.ext) {
        try {
          event = await window.nostr.signEvent(event);
        } catch (err) {
          console.log(err);
          setIsLoading(false);
          return false;
        }
      } else {
        event = finalizeEvent(event, userKeys.sec);
      }

      dispatch(
        setToPublish({
          eventInitEx: event,
          allRelays: relaysToPublish,
        })
      );

      setTimeout(() => {
        setIsLoading(false);
        setNote("");
        setSource("");
        setTimestamp(Date.now());
      }, 3000);
    } catch (err) {
      setIsLoading(true);
      console.log(err);
      dispatch(
        setToast({
          type: 2,
          desc: t("AOSllJU"),
        })
      );
    }
  };

  if (!isLoaded) return <LoadingScreen />;
  return (
    <div>
      <Helmet>
        <title>
          Yakihonne | {flashNews.author.display_name || flashNews.author.name}
        </title>
        <meta name="description" content={flashNews.content} />
        <meta property="og:description" content={flashNews.content} />
        <meta
          property="og:image"
          content={API_BASE_URL + "/event/" + flashNews.nEvent + ".png"}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="700" />
        <meta
          property="og:url"
          content={`https://yakihonne.com/flash-news/${flashNews.nEvent}`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta
          property="og:title"
          content={flashNews.author.display_name || flashNews.author.name}
        />
        <meta
          property="twitter:title"
          content={flashNews.author.display_name || flashNews.author.name}
        />
        <meta property="twitter:description" content={flashNews.content} />
        <meta
          property="twitter:image"
          content={API_BASE_URL + "/event/" + flashNews.nEvent + ".png"}
        />
      </Helmet>
      <div className="fit-container fx-centered">
        <div className="main-container">
          <Sidebar />
          <main className="main-page-nostr-container">
            <ArrowUp />
            <div className="fit-container fx-centered fx-start-v fx-start-h">
              <div style={{ flex: 1.5 }} className="box-pad-h-s">
                <Link className="fit-container" to="/verify-notes">
                  <div
                    className="fit-container fx-centered fx-start-h box-pad-v-m sticky"
                    style={{
                      columnGap: "16px",
                    }}
                  >
                    <div className="round-icon">
                      <div className="arrow arrow-back"></div>
                    </div>
                    <h4>{t("AuWEFcH")}</h4>
                  </div>
                </Link>
                <div className="fit-container fx-centered fx-col">
                  <div
                    className="fit-container fx-centered fx-start-h fx-start-v box-marg-s box-pad-h-m box-pad-v-m"
                    style={{ columnGap: "10px" }}
                  >
                    <div>
                      <UserProfilePic
                        img={flashNews.author.picture}
                        size={38}
                        user_id={flashNews.author.pubkey}
                      />
                    </div>
                    <div
                      className="fx-centered fx-col fx-start-h"
                      style={{ width: "calc(100% - 40px)" }}
                    >
                      <div className="fit-container fx-scattered">
                        <div className="fx-centered fx-start-h fit-container">
                          <p className="gray-c">
                            {t("AsXpL4b", { name: flashNews.author.name })}
                          </p>
                          <p className="gray-c">&#x2022;</p>
                          <p className="gray-c">
                            <Date_
                              toConvert={new Date(flashNews.created_at * 1000)}
                              time={true}
                            />
                          </p>
                        </div>
                        <ShareLink
                          path={`/verify-notes/${flashNews.nEvent}`}
                          title={
                            flashNews.author.display_name ||
                            flashNews.author.name
                          }
                          description={flashNews.content}
                          kind={1}
                          shareImgData={{
                            post: flashNews,
                            author: flashNews.author,
                            extra: {
                              ...flashNews.sealed_note,
                              is_sealed: flashNews.sealed_note ? true : false,
                            },
                            label: "Uncensored note",
                          }}
                        />
                      </div>

                      <div className="fit-container">
                        {/* <div
                      className="fx-centered fx-start-h fx-wrap box-marg-s"
                      style={{ rowGap: 0, columnGap: "4px" }}
                    > */}
                        <div className="fit-container">{content}</div>
                      </div>
                      {userKeys &&
                        userKeys.pub !== flashNews.author.pubkey &&
                        !isContributed &&
                        !sealedNote && (
                          <div
                            className="fit-container fx-centered fx-start-v fx-start-h sc-s-18"
                            style={{ columnGap: "16px", rowGap: 0 }}
                          >
                            <div className="fit-container">
                              <div className="fit-container fx-scattered box-pad-h-s box-pad-v-s">
                                <div
                                  className="fx-centered fx-start-h"
                                  style={{ columnGap: "16px" }}
                                >
                                  <UserProfilePic
                                    mainAccountUser={true}
                                    size={38}
                                  />
                                  <div>
                                    <p className="p-medium gray-c">
                                      {t("A8pP6gz")}
                                    </p>
                                    <p className="p-bold">{t("A80wepI")}</p>
                                  </div>
                                </div>
                                <button
                                  className="btn btn-normal"
                                  onClick={handlePublishing}
                                  disabled={isLoading}
                                >
                                  {isLoading ? <LoadingDots /> : t("AT4tygn")}
                                </button>
                              </div>
                              <hr />
                              <div className="box-pad-h-m box-pad-v-m">
                                <textarea
                                  className="txt-area fit-container no-scrollbar if-no-border"
                                  style={{
                                    padding: "0",
                                    borderRadius: 0,
                                    color:
                                      MAX_CHAR - currentWordsCount < 0
                                        ? "var(--red-main)"
                                        : "",
                                  }}
                                  placeholder={t("AlOVbtN", {
                                    name: userMetadata.name || "",
                                  })}
                                  value={note}
                                  onChange={handleNoteOnChange}
                                />
                                <div className="fit-container">
                                  {MAX_CHAR - currentWordsCount <= 0 && (
                                    <p className="red-c p-medium">
                                      {t("Ahy97Wm", {
                                        count: MAX_CHAR - currentWordsCount,
                                      })}
                                    </p>
                                  )}
                                  {MAX_CHAR - currentWordsCount > 0 && (
                                    <p className="gray-c p-medium">
                                      {t("Ahy97Wm", {
                                        count: MAX_CHAR - currentWordsCount,
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <hr />
                              <div className="fit-container">
                                <input
                                  type="text"
                                  className="if ifs-full if-no-border"
                                  placeholder={t("AkZiEiU")}
                                  value={source}
                                  onChange={(e) => setSource(e.target.value)}
                                />
                              </div>
                              <hr />
                              <label
                                htmlFor="check-note-type"
                                className="fit-container fx-centered fx-start-h box-pad-h-m box-pad-v-m"
                              >
                                <input
                                  type="checkbox"
                                  id="check-note-type"
                                  checked={noteType}
                                  onChange={() => setNoteType(!noteType)}
                                />
                                <p className={noteType ? "" : "gray-c"}>
                                  {t("A2vH1G8")}
                                </p>
                              </label>
                            </div>
                          </div>
                        )}
                      {!userKeys && (
                        <div className="fit-container fx-centered fx-col box-pad-h box-pad-v sc-s-18">
                          <h4>{t("Ao5adkz")}</h4>
                          <p
                            className="gray-c p-centered"
                            style={{ maxWidth: "400px" }}
                          >
                            {t("A7qYBVd")}
                          </p>
                          <button
                            className="btn btn-normal"
                            onClick={() => redirectToLogin()}
                          >
                            {t("AmOtzoL")}
                          </button>
                        </div>
                      )}
                      {sealedNote && (
                        <UN
                          data={JSON.parse(sealedNote.content)}
                          flashNewsAuthor={flashNews.author.pubkey}
                          sealedCauses={sealedNote.tags
                            .filter((tag) => tag[0] === "cause")
                            .map((tag) => tag[1])}
                          setTimestamp={null}
                          state="sealed"
                        />
                      )}
                      {isContributed && (
                        <div
                          className="fx-centered fx-start-h fit-container option if pointer"
                          style={{
                            border: "none",
                            backgroundColor: "var(--green-side)",
                          }}
                        >
                          <div className="checkmark"></div>
                          <p className="green-c">{t("Aundnph")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {(uncensoredNotes.length > 0 ||
                  flashNews.sealed_not_helpful_notes.length > 0) && (
                  <>
                    <h4 className="box-marg-s">{t("AtKC9kH")}</h4>
                    <div className="fx-centered fx-col fit-container">
                      {uncensoredNotes.map((note) => {
                        return (
                          <UN
                            data={note}
                            key={note.id}
                            flashNewsAuthor={flashNews.author.pubkey}
                            setTimestamp={setTimestamp}
                            action={sealedNote ? false : true}
                          />
                        );
                      })}
                      {flashNews.sealed_not_helpful_notes.map((_note) => {
                        let note = JSON.parse(_note.content);
                        return (
                          <UN
                            data={note}
                            key={note.id}
                            flashNewsAuthor={flashNews.author.pubkey}
                            setTimestamp={() => null}
                            sealedCauses={_note.tags
                              .filter((tag) => tag[0] === "cause")
                              .map((tag) => tag[1])}
                            state="nh"
                            action={false}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
                {!isLoading &&
                  uncensoredNotes.length === 0 &&
                  flashNews.sealed_not_helpful_notes.length === 0 && (
                    <PagePlaceholder page={"nostr-un"} />
                  )}
              </div>
              <div
                style={{
                  flex: "1",
                  position: "sticky",
                  top: 0,
                }}
                className="box-pad-h-m box-pad-v-m fx-centered fx-col un-banners"
              >
                <div
                  className="sc-s-18 fit-container box-pad-h box-pad-v fx-centered fx-start-h"
                  style={{
                    position: "relative",
                    backgroundColor: "var(--c3)",
                    border: "none",
                  }}
                >
                  <div
                    className="cup-24"
                    style={{
                      minHeight: "120px",
                      minWidth: "120px",
                      position: "absolute",
                      right: "-20px",
                      bottom: "-10px",
                      filter: "brightness(0) invert()",
                      opacity: ".2",
                      rotate: "20deg",
                    }}
                  ></div>
                  <div className="fx-centered fx-col fx-start-v">
                    <p className="p-medium" style={{ color: "white" }}>
                      {t("Ay17eyW")}
                    </p>
                    <div className="fx-centered fx-end-v">
                      <h2 className="orange-c">{balance || "N/A"}</h2>
                      <p style={{ color: "white" }}>Sats.</p>
                    </div>
                  </div>
                </div>
                <div className="sc-s-18 fit-container box-pad-h-m box-pad-v-m fx-centered fx-col fx-start-v">
                  <div
                    className="note-24"
                    style={{ minHeight: "48px", minWidth: "48px" }}
                  >
                    {" "}
                  </div>
                  <h4>{t("AtTBm8o")}</h4>
                  <p className="gray-c">{t("A9YOTCh")}</p>
                  <Link
                    target="_blank"
                    to={
                      "/article/naddr1qq252nj4w4kkvan8dpuxx6f5x3n9xstk23tkyq3qyzvxlwp7wawed5vgefwfmugvumtp8c8t0etk3g8sky4n0ndvyxesxpqqqp65wpcr66x"
                    }
                  >
                    <button className="btn btn-normal">{t("Azigg0N")}</button>
                  </Link>
                </div>
                <div className="sc-s-18 fit-container box-pad-h-m box-pad-v-m fx-centered fx-col fx-start-v box-marg-s">
                  <h4>{t("AlAlx8I")}</h4>
                  <ul>
                    <li className="gray-c">{t("AEkp3uJ")}</li>
                    <li className="gray-c">{t("ApW8X5d")}</li>
                    <li className="gray-c">{t("AHc4MVZ")}</li>
                  </ul>
                  <Link
                    target="_blank"
                    to={
                      "/article/naddr1qq2kw52htue8wez8wd9nj36pwucyx33hwsmrgq3qyzvxlwp7wawed5vgefwfmugvumtp8c8t0etk3g8sky4n0ndvyxesxpqqqp65w6998qf"
                    }
                  >
                    <button className="btn btn-normal">{t("Azigg0N")}</button>
                  </Link>
                </div>
                <Footer />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
