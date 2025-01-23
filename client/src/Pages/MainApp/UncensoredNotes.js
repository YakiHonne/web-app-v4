import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import Sidebar from "../../Components/Main/Sidebar";
import ArrowUp from "../../Components/ArrowUp";
import axios from "axios";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import Date_ from "../../Components/Date_";
import { Link } from "react-router-dom";
import { getClaimingData } from "../../Helpers/Encryptions";
import { nip19 } from "nostr-tools";
import UN from "../../Components/Main/UN";
import Counter from "../../Components/Counter";
import LoadingDots from "../../Components/LoadingDots";
import { getNoteTree, redirectToLogin } from "../../Helpers/Helpers";
import Footer from "../../Components/Footer";
import ShareLink from "../../Components/ShareLink";
import { useDispatch, useSelector } from "react-redux";
import { setToast } from "../../Store/Slides/Publishers";
import { useTranslation } from "react-i18next";
const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

export default function UncensoredNotes() {
  const userKeys = useSelector((state) => state.userKeys);
  const userMutedList = useSelector((state) => state.userMutedList);

  const { t } = useTranslation();
  const [flashNews, setFlashNews] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [contentType, setContentType] = useState("new");
  const [balance, setBalance] = useState("");
  const [timestamp, setTimestamp] = useState(Date.now);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [flashnewsToRefresh, setFlashNewsToRefresh] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const elPerPage = 8;

  useEffect(() => {
    const fetchFNData = async () => {
      try {
        setIsLoading(true);
        let NEW_PATH = "/api/v1/flashnews/new";
        let NMH_PATH = "/api/v1/flashnews/needs-more-help";
        let SEALED_PATH = "/api/v1/flashnews/sealed";
        let paths = {
          new: NEW_PATH,
          nmh: NMH_PATH,
          sealed: SEALED_PATH,
        };
        let [FN, BALANCE] = await Promise.all([
          axios.get(API_BASE_URL + paths[contentType], {
            params: { page, elPerPage },
          }),
          axios.get(API_BASE_URL + "/api/v1/balance"),
        ]);
        setBalance(BALANCE.data.balance);
        setTotal(FN.data.total);
        let parsedFNNews = await Promise.all(
          FN.data.flashnews.map(async (fn) => {
            let note_tree = await getNoteTree(fn.flashnews.content);
            return { ...fn, note_tree };
          })
        );
        setFlashNews([...flashNews, ...parsedFNNews]);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };
    const fetchMyRewardsData = async () => {
      try {
        if (!userKeys || (userKeys && !userKeys.sec && !userKeys.ext)) {
          setMyRewards([]);
          return;
        }
        setIsLoading(true);
        let PATH = "/api/v1/my-rewards";
        let opt = {
          params: { pubkey: userKeys.pub },
        };
        let [data, REWARDS, BALANCE] = await Promise.all([
          axios.get(API_BASE_URL + PATH, opt),
          axios.get(API_BASE_URL + "/api/v1/pricing"),
          axios.get(API_BASE_URL + "/api/v1/balance"),
        ]);
        setRewards(REWARDS.data);
        setMyRewards(data.data);
        setBalance(BALANCE.data.balance);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };
    if (contentType && Array.isArray(userMutedList)) fetchFNData();
    if (!contentType) fetchMyRewardsData();
  }, [contentType, timestamp, userKeys, page, userMutedList]);

  useEffect(() => {
    const fetchFNData = async () => {
      try {
        let NMH_PATH = `/api/v1/flashnews/needs-more-help/${flashnewsToRefresh}`;
        let FN = await axios.get(API_BASE_URL + NMH_PATH, {
          params: { page, elPerPage },
        });
        let note_tree = await getNoteTree(FN.data.flashnews.content);
        let parsedFNNews = { ...FN.data, note_tree };

        let index = flashNews.findIndex(
          (item) => item.flashnews.id === flashnewsToRefresh
        );
        let tempFlashnews = Array.from(flashNews);
        if (index !== -1) tempFlashnews[index] = parsedFNNews;
        setFlashNews(tempFlashnews);
        setFlashNewsToRefresh(false);
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };

    if (flashnewsToRefresh) fetchFNData();
  }, [flashnewsToRefresh]);

  useEffect(() => {
    const handleScroll = () => {
      if (isLoading || total <= elPerPage * page) return;
      if (
        document.querySelector(".main-page-nostr-container").scrollHeight -
          document.querySelector(".main-page-nostr-container").scrollTop -
          60 >
        document.documentElement.offsetHeight
      ) {
        return;
      }
      setPage((prev) => prev + 1);
    };
    document
      .querySelector(".main-page-nostr-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".main-page-nostr-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

  const handleContentType = (type) => {
    if (type === contentType || isLoading) return;
    setFlashNews([]);
    setTotal(0);
    setPage(0);
    setContentType(type);
  };

  const refreshFlashNews = (id) => {
    setFlashNewsToRefresh(id);
  };

  return (
    <div>
      <Helmet>
        <title>Yakihonne | Verify notes</title>
        <meta
          name="description"
          content={
            "Verify the integrity of the news by being a community member and gain instant rewards"
          }
        />
        <meta
          property="og:description"
          content={
            "Verify the integrity of the news by being a community member and gain instant rewards"
          }
        />

        <meta
          property="og:url"
          content={`https://yakihonne.com/verify-notes`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Verify notes" />
        <meta property="twitter:title" content="Yakihonne | Verify notes" />
        <meta
          property="twitter:description"
          content={
            "Verify the integrity of the news by being a community member and gain instant rewards"
          }
        />
      </Helmet>
      <div className="fit-container fx-centered">
        <div className="main-container">
          <Sidebar />
          <main className="main-page-nostr-container">
            <ArrowUp />
            <div
              className="fit-container fx-centered fx-start-v fx-start-h"
              style={{ gap: 0 }}
            >
              <div className="main-middle">
                <div
                  className="sc-s-18 fit-container box-pad-h box-pad-v fx-centered fx-start-h un-banner"
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
                    <p className=" p-medium" style={{ color: "white" }}>
                      {t("Ay17eyW")}
                    </p>
                    <div className="fx-centered fx-end-v">
                      <h2 className="orange-c">{balance || "N/A"}</h2>
                      <p style={{ color: "white" }}>Sats.</p>
                    </div>
                  </div>
                </div>
                <div
                  className="fit-container fx-scattered box-pad-v-m  box-pad-h-m"
                  style={{
                    position: "sticky",
                    background: "var(--white)",
                    top: "0",
                    gap: 0,
                    zIndex: "100",
                    borderBottom: "1px solid var(--very-dim-gray)",
                  }}
                >
                  <div className="fx-centered" style={{ columnGap: "16px" }}>
                    <div
                      onClick={() => handleContentType("new")}
                      className={"btn sticker-gray-black p-caps fx-centered"}
                      style={{
                        backgroundColor:
                          contentType === "new" ? "" : "transparent",
                        color: contentType === "new" ? "" : "var(--gray)",
                      }}
                    >
                      {t("ADOU7Ed")}
                    </div>
                    <div
                      onClick={() => handleContentType("nmh")}
                      className={"btn sticker-gray-black p-caps fx-centered"}
                      style={{
                        backgroundColor:
                          contentType === "nmh" ? "" : "transparent",
                        color: contentType === "nmh" ? "" : "var(--gray)",
                      }}
                    >
                      {t("Ak8B1oL")}
                    </div>
                    <div
                      onClick={() => handleContentType("sealed")}
                      className={"btn sticker-gray-black p-caps fx-centered"}
                      style={{
                        backgroundColor:
                          contentType === "sealed" ? "" : "transparent",
                        color: contentType === "sealed" ? "" : "var(--gray)",
                      }}
                    >
                      {t("ALbnctt")}
                    </div>
                  </div>
                  <div className="fx-centered">
                    {!contentType && (
                      <div
                        className="round-icon round-icon-tooltip option"
                        data-tooltip={t("AckKGvv")}
                        onClick={() => setTimestamp(Date.now())}
                      >
                        <div className="switch-arrows-24"></div>
                      </div>
                    )}
                    <div
                      className="round-icon round-icon-tooltip"
                      data-tooltip={t("AXjyFcp")}
                      onClick={() => handleContentType("")}
                    >
                      <div className="cup-24"></div>
                    </div>
                  </div>
                </div>
                {contentType && (
                  <div
                    className="fit-container fx-centered fx-col "
                    style={{ gap: 0 }}
                  >
                    {flashNews.map((fn) => {
                      if (!userMutedList.includes(fn.author.pubkey))
                        return (
                          <FlashNewsCard
                            key={fn.flashnews.id}
                            data={fn}
                            refreshFlashNews={refreshFlashNews}
                          />
                        );
                    })}
                  </div>
                )}
                {!contentType && (
                  <div className="fit-container fx-centered fx-col ">
                    {myRewards.map((myrw) => {
                      return (
                        <MyRewardedItem
                          key={myrw.id}
                          rwdItem={myrw}
                          setTimestamp={setTimestamp}
                          rewards={rewards}
                          isLoading={isLoadingGlobal}
                          setIsLoading={setIsLoadingGlobal}
                        />
                      );
                    })}
                    {userKeys &&
                      (userKeys.sec || userKeys.ext) &&
                      !myRewards.length && (
                        <div className="fit-container fx-centered fx-col box-pad-h box-marg-full">
                          <h4>{t("AEoE8CH")}</h4>
                          <p
                            className="gray-c p-centered"
                            style={{ maxWidth: "600px" }}
                          >
                            {t("A5nF77W")}
                          </p>
                          <Link to={"/"}>
                            <button className="btn btn-text-gray">
                              {t("Aik5uGa")}
                            </button>
                          </Link>
                        </div>
                      )}
                    {!userKeys && (
                      <div className="fit-container fx-centered fx-col box-pad-h box-marg-full">
                        <h4>{t("AMxTRuK")}</h4>
                        <p
                          className="gray-c p-centered"
                          style={{ maxWidth: "600px" }}
                        >
                          {t("AX35a5g")}
                        </p>
                        <button
                          className="btn btn-normal"
                          onClick={() => redirectToLogin()}
                        >
                          {t("AmOtzoL")}
                        </button>
                      </div>
                    )}
                    {userKeys && !userKeys.sec && !userKeys.ext && (
                      <div className="fit-container fx-centered fx-col box-pad-h box-marg-full">
                        <h4>{t("ApmJsGe")}</h4>
                        <p
                          className="gray-c p-centered"
                          style={{ maxWidth: "600px" }}
                        >
                          {t("AQ3K2E1")}
                        </p>
                        <h4 className="red-c">:(</h4>
                      </div>
                    )}
                  </div>
                )}
                {isLoading && (
                  <div
                    className="fit-container fx-centered box-marg"
                    style={{ height: "30vh" }}
                  >
                    <p className="gray-c">{t("AKvHyxG")}</p>
                    <LoadingDots />
                  </div>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  position: "sticky",
                  top: 0,
                }}
                className="box-pad-h-m box-pad-v-m fx-centered fx-col extras-homepage"
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

const FlashNewsCard = ({ data, refreshFlashNews }) => {
  const [content, setContent] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    setContent(data.note_tree);
  }, [data.note_tree]);

  const isMisLeading = data.sealed_note
    ? JSON.parse(data.sealed_note.content).tags.find(
        (tag) => tag[0] === "type" && tag[1] === "-"
      )
    : false;
  const refreshFlashNews_ = () => {
    refreshFlashNews(data.flashnews.id);
  };
  return (
    <div
      className="fit-container fx-centered fx-start-h fx-start-v box-pad-v  box-pad-h-m"
      style={{
        columnGap: "10px",
        overflow: "visible",
        borderBottom: "1px solid var(--very-dim-gray)",
      }}
    >
      <div>
        <UserProfilePic
          img={data.author.picture}
          size={38}
          user_id={data.author.pubkey}
          metadata={data.author}
        />
      </div>
      <div
        className="fx-centered fx-col fx-start-h"
        style={{ width: "calc(100% - 40px)" }}
      >
        <div className="fit-container fx-scattered">
          <div className="fx-centered fx-start-h fit-container">
            <p className="gray-c">{t("AsXpL4b", { name: data.author.name })}</p>
            <p className="gray-c">&#x2022;</p>
            <p className="gray-c">
              <Date_
                toConvert={new Date(data.flashnews.created_at * 1000)}
                time={true}
              />
            </p>
          </div>
          {/* <ShareLink
            path={`/flash-news/${data.flashnews.nEvent}`}
            title={data.author.display_name || data.author.name}
            description={data.flashnews.content}
          /> */}
        </div>
        <div className="fit-container">
          {/* <div
            className="fx-centered fx-start-h fx-wrap"
            style={{ rowGap: 0, columnGap: "4px" }}
          > */}
          <div className="fit-container">{content}</div>
        </div>
        {data.sealed_note && isMisLeading && (
          <UN
            data={JSON.parse(data.sealed_note.content)}
            state="sealed"
            setTimestamp={refreshFlashNews_}
            flashNewsAuthor={data.author.pubkey}
            sealedCauses={data.sealed_note.tags
              .filter((tag) => tag[0] === "cause")
              .map((tag) => tag[1])}
          />
        )}
        {data.nmh_notes &&
          data.nmh_notes.map((note) => {
            return (
              <UN
                key={note.id}
                data={note}
                state="nmh"
                setTimestamp={refreshFlashNews_}
                flashNewsAuthor={data.author.pubkey}
              />
            );
          })}

        <div className="fit-container fx-scattered">
          <Link
            className="fit-container"
            to={`/verify-notes/${data.flashnews.nEvent}`}
          >
            <div
              className="fx-scattered fit-container option btn pointer"
              style={{ border: "none", backgroundColor: "var(--dim-gray)" }}
            >
              <p className="c1-c">{t("A34VVOo")}</p>
              <div
                className="arrow"
                style={{ transform: "rotate(-90deg)" }}
              ></div>
            </div>
          </Link>
          <ShareLink
            path={`/flash-news/${data.flashnews.nEvent}`}
            title={data.author.display_name || data.author.name}
            description={data.flashnews.content}
            kind={1}
            shareImgData={{
              post: data.flashnews,
              author: data.author,
              extra: {
                ...data.sealed_note,
                is_sealed: data.sealed_note ? true : false,
              },
              label: t("A8rd1CZ"),
            }}
          />
        </div>
      </div>
    </div>
  );
};

const MyRewardedItem = ({
  rwdItem,
  setTimestamp,
  rewards,
  isLoading,
  setIsLoading,
}) => {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const { t } = useTranslation();
  let [claimPermission, setClaimPermission] = useState(false);

  const [showNote, setShowNote] = useState(false);
  // const [isLoading, setIsLoading] = useState(false);
  const claimReward = async () => {
    try {
      setIsLoading(true);
      let _data = await getClaimingData(userKeys.pub, rwdItem.id, rwdItem.kind);
      if (!_data.status) {
        dispatch(
          setToast({
            type: 2,
            desc: _data.message,
          })
        );
        setIsLoading(false);
        return;
      }
      const data = await axios.post(API_BASE_URL + "/api/v1/reward-claiming", {
        pubkey: userKeys.pub,
        _data: _data.message,
      });
      setTimestamp(Date.now());
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      dispatch(
        setToast({
          type: 2,
          desc: err.response.data.message,
        })
      );
    }
  };

  const getReward = () => {
    let get_amount = rewards.find((item) => item.kind === rwdItem.kind);
    get_amount =
      rwdItem.kind === 7
        ? get_amount.amount
        : rwdItem.kind === 30078
        ? rwdItem.is_author
          ? get_amount.is_author.amount
          : get_amount.is_rater.amount
        : get_amount.uncensored_notes.amount;
    return get_amount;
  };

  if (rwdItem.kind === 7)
    return (
      <>
        {showNote && (
          <div className="fixed-container fx-centered fx-col">
            <div style={{ width: "min(100%, 500px)" }}>
              <UN
                data={rwdItem.uncensored_note}
                state={rwdItem.uncensored_note.is_un_sealed ? "sealed" : "nmh"}
                action={false}
              />
            </div>
            <button
              className="btn btn-normal"
              onClick={() => setShowNote(false)}
            >
              {t("Ais0q3D")}
            </button>
          </div>
        )}
        <div className="box-pad-h-m box-pad-v-m sc-s-18 fx-scattered fit-container">
          <div className="fx-centered fx-start-v fx-col">
            <p className="gray-c p-medium">
              <Date_
                toConvert={new Date(rwdItem.created_at * 1000)}
                time={true}
              />
            </p>
            <p>
              {t("AdW30DE")}{" "}
              <span
                className="btn-text-gray pointer"
                onClick={() => setShowNote(true)}
              >
                {t("AmWgWKo")}
              </span>
            </p>
          </div>
          {!claimPermission && (
            <button
              className="btn btn-small"
              style={{
                cursor: "not-allowed",
                color: "var(--gray)",
                border: "1px solid var(--dim-gray)",
              }}
              disabled={true}
            >
              {t("Ar79ZHS", { amount: getReward() })}
              <Counter
                date={rwdItem.created_at}
                onClick={() => setClaimPermission(true)}
              />
            </button>
          )}
          {claimPermission && (
            <>
              {rwdItem.status === "not found" && (
                <button
                  className="btn btn-small btn-normal"
                  onClick={claimReward}
                >
                  {isLoading ? (
                    <LoadingDots />
                  ) : (
                    t("A0FXaKJ", { amount: getReward() })
                  )}
                </button>
              )}
              {rwdItem.status === "in progress" && (
                <div className="sticker sticker-normal sticker-orange">
                  {t("ABmRvXG")}
                </div>
              )}
              {rwdItem.status === "granted" && (
                <div className="sticker sticker-normal sticker-green">
                  {t("AXptzeX")}
                </div>
              )}
            </>
          )}
        </div>
      </>
    );
  if (rwdItem.kind === 1)
    return (
      <div className="box-pad-h-m box-pad-v-m sc-s-18 fx-scattered fit-container">
        <div className="fx-centered fx-start-v fx-col">
          <p className="gray-c p-medium">
            <Date_
              toConvert={new Date(rwdItem.created_at * 1000)}
              time={true}
            />
          </p>
          <p>
            {t("AI6tLWN")}{" "}
            <Link
              className="btn-text-gray"
              target="_blank"
              to={`/verify-notes/${nip19.neventEncode({
                id: rwdItem.tags.find((tag) => tag[0] === "e")[1],
              })}`}
            >
              {t("ApZgcIc")}
            </Link>
          </p>
        </div>
        {rwdItem.status === "not found" && (
          <button className="btn btn-small btn-normal" onClick={claimReward}>
            {isLoading ? (
              <LoadingDots />
            ) : (
              t("A0FXaKJ", { amount: getReward() })
            )}
          </button>
        )}
        {rwdItem.status === "in progress" && (
          <div className="sticker sticker-normal sticker-orange">
            {t("ABmRvXG")}
          </div>
        )}
        {rwdItem.status === "granted" && (
          <div className="sticker sticker-normal sticker-green">
            {t("AXptzeX")}
          </div>
        )}
      </div>
    );
  if (rwdItem.kind === 30078 && rwdItem.is_rater)
    return (
      <>
        {showNote && (
          <div className="fixed-container fx-centered fx-col">
            <div style={{ width: "min(100%, 500px)" }}>
              <UN
                data={JSON.parse(rwdItem.content)}
                state="sealed"
                action={false}
              />
            </div>
            <button
              className="btn btn-normal"
              onClick={() => setShowNote(false)}
            >
              {t("Ais0q3D")}
            </button>
          </div>
        )}
        <div className="box-pad-h-m box-pad-v-m sc-s-18 fx-scattered fit-container">
          <div className="fx-centered fx-start-v fx-col">
            <p className="gray-c p-medium">
              <Date_
                toConvert={new Date(rwdItem.created_at * 1000)}
                time={true}
              />
            </p>
            <p>
              {t("AVz5uNT")}{" "}
              <span
                className="btn-text-gray pointer"
                onClick={() => setShowNote(true)}
              >
                {t("AmWgWKo")}
              </span>
            </p>
          </div>
          {rwdItem.status === "not found" && (
            <button className="btn btn-small btn-normal" onClick={claimReward}>
              {isLoading ? (
                <LoadingDots />
              ) : (
                t("A0FXaKJ", { amount: getReward() })
              )}
            </button>
          )}
          {rwdItem.status === "in progress" && (
            <div className="sticker sticker-normal sticker-orange">
              {t("ABmRvXG")}
            </div>
          )}
          {rwdItem.status === "granted" && (
            <div className="sticker sticker-normal sticker-green">
              {t("AXptzeX")}
            </div>
          )}
        </div>
      </>
    );
  if (rwdItem.kind === 30078 && rwdItem.is_author)
    return (
      <>
        {showNote && (
          <div className="fixed-container fx-centered fx-col">
            <div style={{ width: "min(100%, 500px)" }}>
              <UN
                data={JSON.parse(rwdItem.content)}
                state="sealed"
                action={false}
              />
            </div>
            <button
              className="btn btn-normal"
              onClick={() => setShowNote(false)}
            >
              {t("Ais0q3D")}
            </button>
          </div>
        )}
        <div className="box-pad-h-m box-pad-v-m sc-s-18 fx-scattered fit-container">
          <div className="fx-centered fx-start-v fx-col">
            <p className="gray-c p-medium">
              <Date_
                toConvert={new Date(rwdItem.created_at * 1000)}
                time={true}
              />
            </p>
            <p>
              {t("AnpKDbw")}{" "}
              <span
                className="btn-text pointer"
                onClick={() => setShowNote(true)}
              >
                ({t("AmWgWKo")})
              </span>
            </p>
          </div>
          {rwdItem.status === "not found" && (
            <button className="btn btn-small btn-normal" onClick={claimReward}>
              {isLoading ? (
                <LoadingDots />
              ) : (
                t("A0FXaKJ", { amount: getReward() })
              )}
            </button>
          )}
          {rwdItem.status === "in progress" && (
            <div className="sticker sticker-normal sticker-orange">
              {t("ABmRvXG")}
            </div>
          )}
          {rwdItem.status === "granted" && (
            <div className="sticker sticker-normal sticker-green">
              {t("AXptzeX")}
            </div>
          )}
        </div>
      </>
    );
};
