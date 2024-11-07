import React, { useEffect, useState } from "react";
import {
  compactContent,
  getAuthPubkeyFromNip05,
  getLinkFromAddr,
  isHex,
} from "../../Helpers/Helpers";
import { customHistory } from "../../Helpers/History";
import { useSelector } from "react-redux";
import axios from "axios";
import { saveFetchedUsers, saveUsers } from "../../Helpers/DB";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import { nip19 } from "nostr-tools";
import { Link } from "react-router-dom";
import LoadingDots from "../LoadingDots";
import { SelectTabs } from "./SelectTabs";
import { getSubData, getUser } from "../../Helpers/Controlers";
import {
  getEmptyuserMetadata,
  getParsedRepEvent,
} from "../../Helpers/Encryptions";
import Date_ from "../Date_";
import DynamicIndicator from "../DynamicIndicator";

export default function SearchNetwork({ exit }) {
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const handleOnChange = (e) => {
    let value = e.target.value;
    if (!value) {
      setSearchKeyword("");
      setResults([]);
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
      exit();
      return;
    }
    setSearchKeyword(value);
  };

  useEffect(() => {
    if (!searchKeyword) {
      setResults([]);
      return;
    }

    var timer = setTimeout(null);
    if (searchKeyword) {
      timer = setTimeout(async () => {
        if (selectedTab === 0) searchForUser();
        if (selectedTab === 1) searchForContent();
      }, 400);
    } else {
      clearTimeout(timer);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [searchKeyword, selectedTab]);

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
        return tempData
          .filter((event, index, tempData) => {
            if (
              tempData.findIndex(
                (event_) => event_.pubkey === event.pubkey && !event.kind
              ) === index &&
              isHex(event.pubkey)
            )
              return event;
          })
          .slice(0, 20);
      });
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };
  const searchForUser = () => {
    const filteredUsers = searchKeyword
      ? nostrAuthors
          .filter((user) => {
            if (
              ((typeof user.display_name === "string" &&
                user.display_name
                  ?.toLowerCase()
                  .includes(searchKeyword?.toLowerCase())) ||
                (typeof user.name === "string" &&
                  user.name
                    ?.toLowerCase()
                    .includes(searchKeyword?.toLowerCase())) ||
                (typeof user.lud06 === "string" &&
                  user.lud06
                    ?.toLowerCase()
                    .includes(searchKeyword?.toLowerCase())) ||
                (typeof user.nip05 === "string" &&
                  user.nip05
                    ?.toLowerCase()
                    .includes(searchKeyword?.toLowerCase()))) &&
              isHex(user.pubkey)
            )
              return user;
          })
          .slice(0, 25)
      : Array.from(nostrAuthors.slice(0, 25));

    setResults(filteredUsers);
    getUsersFromCache();
  };

  const searchForContent = async () => {
    let content = await getSubData(
      [
        { kinds: [1], limit: 10, "#t": [searchKeyword] },
        { kinds: [30023, 34235], limit: 30, "#t": [searchKeyword] },
      ],
      500
    );
    let content_ = content.data.map((event) => {
      if (event.kind === 1) {
        return { ...event, content: compactContent(event.content) };
      } else {
        return getParsedRepEvent(event);
      }
    });
    setIsLoading(false);
    setResults(content_);
    saveUsers(content.pubkeys);
  };

  const handleSelectedTab = (data) => {
    if (data === selectedTab) return;
    setSelectedTab(data);
    setIsLoading(true);
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

  return (
    <div
      className="fixed-container fx-centered box-pad-h"
      onClick={(e) => {
        e.stopPropagation();
        exit();
      }}
    >
      <div
        className="sc-s-18 slide-up bg-sp"
        style={{
          width: "min(100%,600px)",
          // backgroundColor: "var(--white)",
          height: "60vh",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{ overflow: "scroll", height: "100%", paddingBottom: "4rem" }}
        >
          <div
            className="sticky fit-container fx-centered fx-start-h box-pad-h"
            style={{
              borderBottom: "1px solid var(--very-dim-gray)",
              // backgroundColor: "var(--c1-side)",
              padding: "0 1rem",
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
                  setSearchKeyword("");
                }}
              >
                <div></div>
              </div>
            )}
          </div>
          {results.map((item, index) => {
            if (!item.kind) {
              let url = encodePubkey(item.pubkey);
              if (url)
                return (
                  <UserCard user={item} key={item.id} url={url} exit={exit} />
                );
            }
            return <ContentCard key={item.id} event={item} exit={exit} />;
          })}
          {results.length === 0 && !isLoading && (
            <div
              className="fit-container fx-col fx-centered"
              style={{ height: "500px" }}
            >
              <div className="search-24"></div>
              <h4>Search in nostr</h4>
              <p className="gray-c">Find people, notes and content</p>
            </div>
          )}
          {isLoading && (
            <div
              className="fit-container fx-centered"
              style={{ height: "500px" }}
            >
              <p className="gray-c p-medium">Searching</p> <LoadingDots />
            </div>
          )}
        </div>
        {searchKeyword && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              pointerEvents: isLoading ? "none" : "auto",
            }}
            className="fit-container fx-centered box-pad-v-s slide-up"
          >
            <SelectTabs
              selectedTab={selectedTab}
              setSelectedTab={(data) => handleSelectedTab(data)}
              tabs={["profiles", "content"]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const UserCard = ({ user, url, exit }) => {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyUser = async () => {
      if (user.nip05) {
        let status = await getAuthPubkeyFromNip05(user.nip05);
        if (status === user.pubkey) setVerified(true);
        else setVerified(false);
      } else setVerified(false);
    };
    verifyUser();
  }, [user]);

  return (
    <Link
      to={`/users/${url}`}
      className="fx-scattered box-pad-v-s box-pad-h-m fit-container pointer search-bar-post"
      onClick={(e) => {
        exit();
      }}
    >
      <div className="fx-centered">
        <UserProfilePicNOSTR
          img={user.picture || ""}
          size={36}
          allowClick={false}
          user_id={user.pubkey}
          ring={false}
        />
        <div className="fx-centered fx-start-h">
          <div className="fx-centered fx-col fx-start-v " style={{ rowGap: 0 }}>
            <div className="fx-centered">
              <p className={`p-one-line ${verified ? "c1-c" : ""}`}>
                {user.display_name || user.name}
              </p>
              {verified && <div className="checkmark-c1"></div>}
            </div>
            {/* <p className="p-medium p-one-line">
              @{user.name || user.display_name}
            </p> */}
            <p className={`${verified ? "" : "gray-c"} p-medium p-one-line`}>
              {user.nip05 || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

const ContentCard = ({ event, exit }) => {
  const nostrAuthors = useSelector((state) => state.nostrAuthors);

  const [user, setUser] = useState(getEmptyuserMetadata(event.pubkey));
  useEffect(() => {
    const fetchAuthor = async () => {
      let auth = await getUser(event.pubkey);
      if (auth) setUser(auth);
    };
    fetchAuthor();
  }, [nostrAuthors]);

  if (event.kind === 1)
    return (
      <Link
        to={`/notes/${nip19.noteEncode(event.id)}`}
        className="fx-centered fx-start-h box-pad-v-s box-pad-h-m fit-container pointer search-bar-post"
        onClick={(e) => {
          exit();
        }}
      >
        <UserProfilePicNOSTR
          img={user.picture || ""}
          size={48}
          allowClick={false}
          user_id={user.pubkey}
          ring={false}
        />
        <div
          className="fx-centered fx-col fx-start-h fx-start-v"
          style={{ gap: "4px" }}
        >
          <p className="p-medium">
            By {user.display_name || user.name}{" "}
            <span className="gray-c ">
              {" "}
              <Date_ toConvert={new Date(event.created_at * 1000)} />
            </span>
          </p>
          <p className="p-one-line gray-c">{event.content}</p>
        </div>
      </Link>
    );
  return (
    <Link
      to={`/${event.naddr}`}
      className="fx-centered fx-start-h box-pad-v-s box-pad-h-m fit-container pointer search-bar-post"
      onClick={(e) => {
        exit();
      }}
    >
      <div style={{ position: "relative" }}>
        {!event.image && (
          <div
            className="round-icon"
            style={{ minWidth: "48px", aspectRatio: "1/1" }}
          >
            {[30004, 30003].includes(event.kind) && (
              <div className="curation-24"></div>
            )}
            {[30023].includes(event.kind) && <div className="posts-24"></div>}
            {[34235].includes(event.kind) && <div className="play-24"></div>}
            {[30031].includes(event.kind) && (
              <div className="smart-widget-24"></div>
            )}
          </div>
        )}
        {event.image && (
          <div
            className="sc-s-18 bg-img cover-bg"
            style={{
              backgroundImage: `url(${event.image})`,
              minWidth: "48px",
              aspectRatio: "1/1",
            }}
          ></div>
        )}
        <div
          className="round-icon"
          style={{
            position: "absolute",
            right: "-5px",
            bottom: "-5px",
            backgroundColor: "var(--white)",
            border: "none",
            minWidth: "24px",
            aspectRatio: "1/1",
          }}
        >
          <UserProfilePicNOSTR
            img={user.picture || ""}
            size={20}
            allowClick={false}
            user_id={user.pubkey}
            ring={false}
          />
        </div>
      </div>
      <div
        className="fx-centered fx-col fx-start-h fx-start-v"
        style={{ gap: "4px" }}
      >
        <div className="fx-centered">
          <p className="p-medium">
            By {user.display_name || user.name}{" "}
            {/* <span className="gray-c ">
              {" "}
              <Date_ toConvert={new Date(event.created_at * 1000)} />
            </span> */}
          </p>
          <DynamicIndicator item={event}/>
        </div>
        <p className="p-one-line gray-c">
          {event.title || <span className="p-italic gray-c">Untitled</span>}
        </p>
      </div>
    </Link>
  );
};
