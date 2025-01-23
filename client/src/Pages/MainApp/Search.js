import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../Components/Main/Sidebar";
import ArrowUp from "../../Components/ArrowUp";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { nip19 } from "nostr-tools";
import { getLinkFromAddr, isHex, sortByKeyword } from "../../Helpers/Helpers";
import { getParsedNote, getParsedRepEvent } from "../../Helpers/Encryptions";
import { getSubData } from "../../Helpers/Controlers";
import { customHistory } from "../../Helpers/History";
import { saveFetchedUsers, saveUsers } from "../../Helpers/DB";
import axios from "axios";
import SearchUserCard from "../../Components/Main/SearchUserCard";
import { useLocation } from "react-router-dom";
import LoadingLogo from "../../Components/LoadingLogo";
import Slider from "../../Components/Slider";
import RepEventPreviewCard from "../../Components/Main/RepEventPreviewCard";
import KindOne from "../../Components/Main/KindOne";
import { setToPublish } from "../../Store/Slides/Publishers";
import { useTranslation } from "react-i18next";
import bannedList from "../../Content/BannedList";

const getKeyword = (location) => {
  let keyword = new URLSearchParams(location.search).get("keyword");
  return keyword || "";
};

export default function Search() {
  const { state } = useLocation();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const urlKeyword = getKeyword(location);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const userKeys = useSelector((state) => state.userKeys);
  const userMutedList = useSelector((state) => state.userMutedList);
  const userInterestList = useSelector((state) => state.userInterestList);
  const [searchKeyword, setSearchKeyword] = useState(urlKeyword);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(state?.tab ? true : false);
  const [lastTimestamp, setLastTimestamp] = useState(undefined);
  const [selectedTab, setSelectedTab] = useState(state ? state?.tab : "people");
  const followed = useMemo(() => {
    return userInterestList.find(
      (interest) => interest === searchKeyword.toLowerCase()
    );
  }, [searchKeyword, userInterestList]);
  const tabsContent = {
    people: t("AJ1Zfct"),
    "all-media": t("A7DfXrs"),
    articles: t("AesMg52"),
    notes: t("AYIXG83"),
    videos: t("AStkKfQ"),
  };
  const handleOnChange = (e) => {
    let value = e.target.value;
    if (!value) {
      setSearchKeyword("");
      setResults([]);
      setIsLoading(false);
      setLastTimestamp(undefined);
      return;
    }
    setIsLoading(true);
    let tempKeyword = value.replace("nostr:");
    if (
      (tempKeyword.startsWith("naddr") ||
        tempKeyword.startsWith("nprofile") ||
        tempKeyword.startsWith("npub") ||
        tempKeyword.startsWith("nevent") ||
        tempKeyword.startsWith("note")) &&
      tempKeyword.length > 10
    ) {
      let link = getLinkFromAddr(tempKeyword);
      customHistory.push(link);
      return;
    }
    setSearchKeyword(value);
  };

  useEffect(() => {
    if (!searchKeyword) {
      setResults([]);
      setIsLoading(false);
      setLastTimestamp(undefined);
      return;
    }

    var timer = setTimeout(null);
    if (searchKeyword) {
      timer = setTimeout(async () => {
        if (selectedTab === "people") searchForUser();
        if (selectedTab !== "people") searchForContent();
      }, 400);
    } else {
      clearTimeout(timer);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [searchKeyword, selectedTab, lastTimestamp]);

  useEffect(() => {
    const handleScroll = () => {
      let container = document.querySelector(".main-page-nostr-container");
      if (!container && isLoading) return;
      if (
        container.scrollHeight - container.scrollTop - 400 >
        document.documentElement.offsetHeight
      ) {
        return;
      }
      if (selectedTab !== "people") {
        setIsLoading(true);
        setLastTimestamp(results[results.length - 1]?.created_at || undefined);
      } else setLastTimestamp(undefined);
    };
    document
      .querySelector(".main-page-nostr-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".main-page-nostr-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

  const getUsersFromCache = async () => {
    try {
      setIsLoading(true);
      const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

      let data = await axios.get(
        `${API_BASE_URL}/api/v1/users/search/${searchKeyword}`
      );
      saveFetchedUsers(data.data);
      setResults((prev) => {
        let tempData = [...prev, ...data.data];
        tempData = tempData.filter((event, index, tempData) => {
          if (
            !bannedList.includes(event.pubkey) &&
            tempData.findIndex(
              (event_) => event_.pubkey === event.pubkey && !event.kind
            ) === index &&
            isHex(event.pubkey)
          )
            return event;
        });

        return sortByKeyword(tempData, searchKeyword).slice(0, 30);
      });
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  const searchForUser = () => {
    const filteredUsers = searchKeyword
      ? sortByKeyword(
          nostrAuthors.filter((user) => {
            if (
              !bannedList.includes(user.pubkey) &&
              ((typeof user.display_name === "string" &&
                user.display_name
                  ?.toLowerCase()
                  .includes(searchKeyword?.toLowerCase())) ||
                (typeof user.name === "string" &&
                  user.name
                    ?.toLowerCase()
                    .includes(searchKeyword?.toLowerCase())) ||
                (typeof user.nip05 === "string" &&
                  user.nip05
                    ?.toLowerCase()
                    .includes(searchKeyword?.toLowerCase()))) &&
              isHex(user.pubkey)
            )
              return user;
          }),
          searchKeyword
        ).slice(0, 30)
      : Array.from(nostrAuthors.slice(0, 30));

    setResults(filteredUsers);
    getUsersFromCache();
    setIsLoading(false);
  };

  const searchForContent = async () => {
    let tag = searchKeyword.replaceAll("#", "");
    let tags = [
      tag,
      `${String(tag).charAt(0).toUpperCase() + String(tag).slice(1)}`,
      tag.toUpperCase(),
      tag.toLowerCase(),
      `#${tag}`,
      `#${tag.toUpperCase()}`,
      `#${tag.toLowerCase()}`,
      `#${String(tag).charAt(0).toUpperCase() + String(tag).slice(1)}`,
    ];
    let filter = {
      limit: 5,
      "#t": tags,
      until: lastTimestamp ? lastTimestamp - 1 : lastTimestamp,
    };
    if (selectedTab === "notes") filter.kinds = [1];
    if (selectedTab === "articles") filter.kinds = [30023];
    if (selectedTab === "videos") filter.kinds = [34235];
    if (selectedTab === "all-media") filter.kinds = [1, 30023, 34235];
    let content = await getSubData([filter], 500);

    let content_ = await Promise.all(
      content.data.map(async (event) => {
        if (event.kind === 1) {
          let parsedNote = await getParsedNote(event, true);
          return parsedNote;
        } else {
          return getParsedRepEvent(event);
        }
      })
    );
    setIsLoading(false);
    setResults((prev) => [...prev, ...content_]);
    saveUsers(content.pubkeys);
  };

  const handleSelectedTab = (data) => {
    if (data === selectedTab) return;
    setSelectedTab(data);
    setIsLoading(true);
    setLastTimestamp(undefined);
    setResults([]);
  };

  const encodePubkey = (pubkey) => {
    try {
      if (!isHex(pubkey)) return false;
      let url = nip19.npubEncode(pubkey);
      return url;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const saveInterestList = async () => {
    try {
      let tags = userInterestList.map((_) => ["t", _]);
      if (!followed) {
        tags = [["t", searchKeyword.toLowerCase()], ...tags];
      } else {
        tags = tags.filter((_) => _[1] !== searchKeyword.toLowerCase());
      }
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 10015,
          content: "",
          tags,
          allRelays: [],
        })
      );
      return true;
    } catch (err) {
      setIsLoading(false);
      console.log(err);
      return false;
    }
  };

  return (
    <div style={{ overflow: "auto" }}>
      <Helmet>
        <title>Yakihonne | Search</title>
        <meta
          name="description"
          content={"Search for people, notes and different content on nostr"}
        />
        <meta
          property="og:description"
          content={"Search for people, notes and different content on nostr"}
        />
        <meta property="og:url" content={`https://yakihonne.com`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Search" />
        <meta property="twitter:title" content="Yakihonne | Search" />
        <meta
          property="twitter:description"
          content={"Search for people, notes and different content on nostr"}
        />
      </Helmet>
      <div className="fit-container fx-centered">
        <div className="main-container">
          <Sidebar />
          <main
            className="main-page-nostr-container"
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{ padding: 0 }}
          >
            <ArrowUp />
            <div className="fit-container fx-centered fx-start-h fx-start-v">
              <div
                className="fit-container fx-centered fx-start-v "
                style={{ gap: 0 }}
              >
                <div
                  style={{ gap: 0 }}
                  className={`fx-centered fx-wrap fit-container main-middle`}
                >
                  <div
                    className="fit-container sticky fx-centered fx-start-h fx-start-v fx-col box-pad-h "
                    style={{
                      padding: ".5rem",
                      borderBottom: "1px solid var(--very-dim-gray)",
                    }}
                  >
                    <div
                      className="fx-centered fit-container"
                      style={{
                        position: "relative",
                        borderBottom: "1px solid var(--very-dim-gray)",
                      }}
                    >
                      <div className="search-24"></div>
                      <input
                        type="text"
                        placeholder="Search people, notes and content"
                        className="if ifs-full if-no-border"
                        onChange={handleOnChange}
                        value={searchKeyword}
                        style={{ paddingLeft: ".5rem" }}
                        autoFocus
                      />
                      {searchKeyword && (
                        <div
                          className="close"
                          onClick={() => {
                            !isLoading && setSearchKeyword("");
                          }}
                        >
                          <div></div>
                        </div>
                      )}
                    </div>
                    <Slider
                      items={[
                        ...[
                          "people",
                          "all-media",
                          "articles",
                          "notes",
                          "videos",
                        ].map((tag, index) => {
                          return (
                            <div
                              className={
                                "btn sticker-gray-black p-caps fx-centered"
                              }
                              style={{
                                backgroundColor:
                                  selectedTab === tag ? "" : "transparent",
                                color: selectedTab === tag ? "" : "var(--gray)",
                                pointerEvents: isLoading ? "none" : "auto",
                              }}
                              key={index}
                              onClick={() => handleSelectedTab(tag)}
                            >
                              {tabsContent[tag]}
                            </div>
                          );
                        }),
                      ]}
                    />
                    <hr />
                    {searchKeyword && selectedTab !== "people" && (
                      <div className="fx-scattered fit-container box-pad-v-s box-pad-h-m">
                        <h3>#{searchKeyword.replaceAll("#", "")}</h3>
                        {userKeys && (
                          <button
                            className={`btn ${
                              followed ? "btn-normal" : "btn-gray"
                            } fx-centered`}
                            onClick={saveInterestList}
                          >
                            {!followed && (
                              <>
                                {t("APkD8MP")} <div className="plus-sign"></div>
                              </>
                            )}
                            {followed && (
                              <>
                                {t("AiKpDYn")}
                                <div
                                  className="check-24"
                                  style={{ filter: "brightness(0) invert()" }}
                                ></div>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {results.map((item, index) => {
                    if (!item.kind) {
                      let url = encodePubkey(item.pubkey);
                      if (url)
                        return (
                          <SearchUserCard
                            user={item}
                            key={item.id}
                            url={url}
                            exit={() => null}
                          />
                        );
                    }
                    if (
                      [1].includes(item.kind) &&
                      !userMutedList.includes(item.pubkey)
                    )
                      return (
                        <KindOne key={item.id} event={item} border={true} />
                      );
                    if (
                      [30023, 34235].includes(item.kind) &&
                      !userMutedList.includes(item.pubkey)
                    )
                      return <RepEventPreviewCard key={item.id} item={item} />;
                  })}
                  {isLoading && (
                    <div
                      className="fit-container fx-centered"
                      style={{ height: "500px" }}
                    >
                      <LoadingLogo />
                    </div>
                  )}
                  {results.length === 0 && !isLoading && (
                    <div
                      className="fit-container fx-col fx-centered"
                      style={{ height: "500px" }}
                    >
                      <div className="search-24"></div>
                      <h4>{t("AjlW15t")}</h4>
                      <p className="gray-c">{t("A0RqaoC")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
