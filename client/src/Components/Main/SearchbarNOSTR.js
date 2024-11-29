import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getHex, getParsedRepEvent } from "../../Helpers/Encryptions";
import LoadingDots from "../LoadingDots";
import relaysOnPlatform from "../../Content/Relays";
import { nip19 } from "nostr-tools";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import Date_ from "../Date_";
import axios from "axios";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { saveFetchedUsers } from "../../Helpers/DB";
import { customHistory } from "../../Helpers/History";

export default function SearchbarNOSTR() {
  const navigateTo = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [searchAuthorsRes, setSearchAuthorsRes] = useState([]);
  const [searchPostsRes, setSearchPostsRes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    var timer = setTimeout(null);
    if (keyword) {
      setIsLoading(true);
      timer = setTimeout(async () => {
        try {
          let authorsNB = await getUsersFromCache(keyword);
          saveFetchedUsers(authorsNB)
          setSearchAuthorsRes([...(authorsNB || [])]);
          setIsLoading(false);
          let posts = await getPostsFromNOSTR(keyword);
          setSearchPostsRes(posts.map(event => getParsedRepEvent(event)));
        } catch (err) {
          console.log(err);
          setIsLoading(false);
        }
      }, 100);
    } else {
      clearTimeout(timer);
      setSearchAuthorsRes([]);
      setIsLoading(false);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [keyword]);

  const handleOnBlur = (e) => {
    setTimeout(() => {
      setKeyword("");
      setSearchAuthorsRes([]);
    }, 200);
  };

  const getUsersFromCache = async (keyword) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

      let data = await axios.get(
        `${API_BASE_URL}/api/v1/users/search/${keyword}`
      );

      return data.data;
    } catch (err) {
      console.log(err);
    }
  };

  const getPostsFromNOSTR = async (tag) => {
    try {
      let posts = await ndkInstance.fetchEvents({
        kinds: [30023],
        "#t": [tag],
      });
      return posts;
    } catch (err) {
      console.log(err);
    }
  };

  const handleKeyword = (e) => {
    let value = e.target.value || "d";
    if (value.startsWith("nostr:")) value = value.split("nostr:")[1];
    if (value.startsWith("naddr") && value.length > 5) {
      try {
        let naddrData = nip19.decode(value);
        if (naddrData.data.kind === 30023) {
          customHistory.push(`/article/${value}`);
          return;
        }
        if (naddrData.data.kind === 30001) {
          customHistory.push(`/curations/${value}`);
          return;
        }
        setKeyword(e.target.value);
        return;
      } catch {
        setKeyword(e.target.value);
        return;
      }
    }
    if (value.startsWith("nprofile") && value.length > 8) {
      customHistory.push(`/users/${value}`);
      return;
    }
    if (value.startsWith("npub") && value.length > 5) {
      try {
        let hex = getHex(value);
        let url = nip19.nprofileEncode({
          pubkey: hex,
          relays: relaysOnPlatform,
        });
        customHistory.push(`/users/${url}`);
        return;
      } catch {
        setKeyword(e.target.value);
        return;
      }
    }
    setKeyword(e.target.value);
  };

  return (
    <div
      className="fx-centered"
      style={{ position: "relative", zIndex: "101", width: "min(100%,450px)" }}
    >
      <label
        className="fx-centered fx-start-h if search-if"
        htmlFor="search-input"
        style={{
          width: "100%",
          cursor: "default",
          position: "relative",
          paddingRight: "0",
        }}
        onBlur={handleOnBlur}
      >
        <div className="search-24"></div>
        <input
          id="search-input"
          type="search"
          className="if ifs-full"
          placeholder="Search by npub, nprofile, naddr, name, tag"
          value={keyword}
          style={{ paddingLeft: ".5rem" }}
          onChange={handleKeyword}
        />
        {keyword && (
          <div
            className="sc-s-18 fit-container fx-centered fx-start-h fx-wrap box-pad-h-s box-pad-v-s"
            style={{
              position: "absolute",
              left: 0,
              bottom: "-5px",
              transform: "translateY(100%)",
              maxHeight: "30vh",
              overflow: "scroll",
              overflowX: "hidden",
              zIndex: "1000",
              borderColor: "var(--dim-gray)",
              gap: 0,
            }}
          >
            {isLoading && (
              <div
                className="fx-centered fit-container"
                style={{ height: "50px" }}
              >
                <LoadingDots />
              </div>
            )}
            {searchAuthorsRes.length > 0 && (
              <>
                <h5 className="box-pad-h-s box-pad-v-s">PEOPLE</h5>
                {searchAuthorsRes.map((user) => {
                  return (
                    <div
                      key={user.pubkey}
                      className="fx-centered fx-start-h box-pad-v-s box-pad-h-s fit-container pointer search-bar-post"
                      onClick={() => {
                        customHistory.push(
                          `/users/${nip19.nprofileEncode({
                            pubkey: user.pubkey,
                            relays: relaysOnPlatform,
                          })}`
                        );
                      }}
                    >
                      <UserProfilePicNOSTR
                        img={user.picture || ""}
                        size={36}
                        user_id={user.pubkey}
                        
                      />
                      <div className="fx-centered fx-start-h">
                        <div
                          className="fx-centered fx-col fx-start-v "
                          style={{ rowGap: 0 }}
                        >
                          <p className="p-one-line">
                            {user.display_name || user.name}
                          </p>
                          <p className="orange-c p-medium p-one-line">
                            @{user.name || user.display_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {searchPostsRes.length > 0 && (
              <>
                <h5 className="box-pad-h-s box-pad-v-s">ARTICLES</h5>
                {searchPostsRes.map((post) => {
                  return (
                    <div
                      key={post.id}
                      className="fx-centered fx-start-h box-pad-v-s box-pad-h-s fit-container pointer search-bar-post"
                      onClick={() => {
                        customHistory.push(`/article/${post.naddr}`);
                      }}
                    >
                      <div
                        className="bg-img cover-bg"
                        style={{
                          backgroundImage: `url(${post.thumbnail})`,
                          minWidth: "48px",
                          aspectRatio: "1/1",
                          borderRadius: "var(--border-r-50)",
                        }}
                      ></div>
                      <div className="fx-centered fx-start-h">
                        <div
                          className="fx-centered fx-col fx-start-v box-pad-h-s"
                          style={{ rowGap: 0 }}
                        >
                          <p className="orange-c">{post.title}</p>
                          <p className="gray-c p-medium">
                            <Date_
                              toConvert={new Date(post.published_at * 1000)}
                            />
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {searchAuthorsRes.length === 0 &&
              searchPostsRes.length === 0 &&
              !isLoading && (
                <div className="fit-container fx-col fx-centered box-pad-v">
                  <div className="cancel-24"></div>
                  <h5>No result for this keyword</h5>
                </div>
              )}
          </div>
        )}
      </label>
    </div>
  );
}
