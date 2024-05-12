import React, { useState } from "react";
import axios from "axios";
import { nip19 } from "nostr-tools";
import { getHex } from "../Helpers/Encryptions";
import LoadingDots from "./LoadingDots";
import UserProfilePicNOSTR from "./NOSTR/UserProfilePicNOSTR";

export default function UserSearchBar({ onClick }) {
  const [keyword, setKeyword] = useState("");
  const [searchAuthorsRes, setSearchAuthorsRes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getUserFromCache = async (keyword) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

      let data = await axios.get(
        `${API_BASE_URL}/api/v1/users/search/${keyword}`
      );
      setSearchAuthorsRes(data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleOnBlur = (e) => {
    setTimeout(() => {
      setKeyword("");
      setSearchAuthorsRes([]);
    }, 200);
  };
  const handleKeyword = (e) => {
    let value = e.target.value;
    
    try {
      if (value.includes("nprofile")) {
        let data = nip19.decode(value);
        onClick(data.data.pubkey);
        return;
      }
      if (value.includes("npub")) {
        let hex = getHex(value);
        onClick(hex);
        return;
      }
      setKeyword(value);
      getUserFromCache(value);
    } catch (err) {
        setKeyword(value);
      getUserFromCache(value);
    }
  };

  return (
    <div
      className="fx-centered"
      style={{ position: "relative", zIndex: "101" }}
    >
      <label
        className="fx-centered fx-start-h if search-if"
        htmlFor="search-input"
        style={{
          width: "450px",
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
          placeholder="Search by name, npub, nprofile"
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
              maxHeight: "200px",
              overflow: "scroll",
              overflowX: "hidden",
              zIndex: "1000",
              borderColor: "var(--dim-gray)",
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
                      onClick={() => onClick(user.pubkey)}
                    >
                      <UserProfilePicNOSTR
                        img={user.picture || ""}
                        size={48}
                        user_id={user.pubkey}
                      />
                      <div className="fx-centered fx-start-h">
                        <div
                          className="fx-centered fx-col fx-start-v box-pad-h-s"
                          style={{ rowGap: 0 }}
                        >
                          <p className="c1-c">{user.name}</p>
                          {/* {user.pubkey && <ShortenKey id={getBech32("npub", user.pubkey)} />} */}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {searchAuthorsRes.length === 0 && !isLoading && (
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
