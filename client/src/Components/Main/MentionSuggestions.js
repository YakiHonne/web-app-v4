import axios from "axios";
import { nip19 } from "nostr-tools";
import React, { useEffect, useState } from "react";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import LoadingDots from "../LoadingDots";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { saveFetchedUsers } from "../../Helpers/DB";
import { isHex } from "../../Helpers/Helpers";
import { NDKUser } from "@nostr-dev-kit/ndk";
import SearchUserCard from "./SearchUserCard";

export default function MentionSuggestions({
  mention,
  setSelectedMention,
  setSelectedMentionMetadata,
}) {
  const nostrAuthors = useSelector((state) => state.nostrAuthors);

  const [users, setUsers] = useState(nostrAuthors.slice(0, 100));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getUsersFromCache = async () => {
      try {
        setIsLoading(true);
        const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

        let data = await axios.get(
          `${API_BASE_URL}/api/v1/users/search/${mention}`
        );
        saveFetchedUsers(data.data);
        setUsers((prev) => {
          let tempData = [...prev, ...data.data];
          return tempData.filter((user, index, tempData) => {
            if (
              // tempData.findIndex((user_) => user_.pubkey === user.pubkey) ===
              // index
              user.nip05 &&
              tempData.findIndex(
                (event_) => event_.pubkey === user.pubkey && !user.kind
              ) === index &&
              isHex(user.pubkey)
            )
              return user;
          });
        });
        setIsLoading(false);
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    };
    const searchForUser = () => {
      const filteredUsers = mention
        ? nostrAuthors.filter((user) => {
            if (
              user.nip05 &&
              ((typeof user.display_name === "string" &&
                user.display_name
                  ?.toLowerCase()
                  .includes(mention?.toLowerCase())) ||
                (typeof user.name === "string" &&
                  user.name?.toLowerCase().includes(mention?.toLowerCase())) ||
                (typeof user.lud06 === "string" &&
                  user.lud06?.toLowerCase().includes(mention?.toLowerCase())) ||
                (typeof user.nip05 === "string" &&
                  user.nip05
                    ?.toLowerCase()
                    .includes(mention?.toLowerCase()))) &&
              isHex(user.pubkey)
              // (typeof user.display_name === "string" &&
              //   user.display_name
              //     ?.toLowerCase()
              //     .includes(mention?.toLowerCase())) ||
              // (typeof user.name === "string" &&
              //   user.name?.toLowerCase().includes(mention?.toLowerCase())) ||
              // (typeof user.lud06 === "string" &&
              //   user.lud06?.toLowerCase().includes(mention?.toLowerCase())) ||
              // (typeof user.nip05 === "string" &&
              //   user.nip05?.toLowerCase().includes(mention?.toLowerCase()))
            )
              return user;
          })
        : Array.from(nostrAuthors.slice(0, 100));
      setUsers(filteredUsers);
      getUsersFromCache();
    };

    var timer = setTimeout(null);
    if (mention) {
      timer = setTimeout(async () => {
        searchForUser();
      }, 400);
    } else {
      clearTimeout(timer);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [mention]);

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

  if (users === false) return;

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        width: "100%",
        maxHeight: "200px",
        overflow: "scroll",
        zIndex: 100,
        gap: 0,
      }}
      className="sc-s-18 fx-centered fx-start-v fx-start-h fx-col  box-pad-v-s"
    >
      {isLoading && (
        <>
          <div className="fx-centered fit-container box-pad-v-s">
            <p className="p-small gray-c">Loading more</p>
            <LoadingDots />
          </div>
          <hr />
        </>
      )}
      {users.map((user, index) => {
        let url = encodePubkey(user.pubkey);
        if (url)
          return (
            <div
              key={user.pubkey}
              className="fx-scattered box-pad-v-s box-pad-h-m fit-container pointer search-bar-post"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMention && setSelectedMention(url);
                setSelectedMentionMetadata &&
                  setSelectedMentionMetadata({ ...user, npub: url });
              }}
              style={{
                borderTop: index !== 0 ? "1px solid var(--pale-gray)" : "",
              }}
            >
              {/* <div className="fx-centered">
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
              </div> */}
              <SearchUserCard user={user}/>
              <Link
                to={`/${url}`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                target="_blank"
              >
                <div className="share-icon"></div>
              </Link>
            </div>
          );
      })}
      {users.length === 0 && !isLoading && (
        <div className="fit-container fx-centered">
          <p className="gray-c p-medium p-italic">No suggestions</p>
        </div>
      )}
    </div>
  );
}

// const UserCard = ({ user }) => {
//   const [isNip05Verified, setIsNip05Verified] = useState(false);

//   useEffect(() => {
//     const verifyNip05 = async () => {
//       let ndkUser = new NDKUser({ pubkey: user.pubkey });
//       ndkUser.ndk = ndkInstance;
//       let checknip05 = user.nip05
//         ? await ndkUser.validateNip05(user.nip05)
//         : false;

//       if (checknip05) setIsNip05Verified(true);
//     };
//     verifyNip05();
//   }, []);
//   return(
//     <div className="fx-centered">
//     <UserProfilePicNOSTR
//       img={user.picture || ""}
//       size={36}
//       user_id={user.pubkey}
//     />
//     <div className="fx-centered fx-start-h">
//       <div
//         className="fx-centered fx-col fx-start-v "
//         style={{ rowGap: 0 }}
//       >
//         <p className="p-one-line">
//           {user.display_name || user.name}
//         </p>
//         <p className="orange-c p-medium p-one-line">
//           @{user.name || user.display_name}
//         </p>
//       </div>
//     </div>
//   </div>
//   )
// };
