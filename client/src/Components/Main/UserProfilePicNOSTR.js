import { nip19 } from "nostr-tools";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import relaysOnPlatform from "../../Content/Relays";
import Avatar from "boring-avatars";
import Follow from "./Follow";
import InitiConvo from "./InitConvo";
import {
  checkForLUDS,
  getEmptyuserMetadata,
  getuserMetadata,
} from "../../Helpers/Encryptions";
import ZapTip from "./ZapTip";
import { useSelector } from "react-redux";
import { getUser } from "../../Helpers/Controlers";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { getMutualFollows } from "../../Helpers/WSInstance";
import { customHistory } from "../../Helpers/History";
import { getCustomSettings } from "../../Helpers/Helpers";

// const getMutualFollows = (userFollowers, userFollowing) => {
//   let users = [];

//   for (let user of userFollowers) {
//     if (userFollowing.includes(user.pubkey)) {
//       users.push(getEmptyuserMetadata(user.pubkey));
//     }
//   }

//   return users.filter((user, index, users) => {
//     if (users.findIndex((user_) => user.pubkey === user_.pubkey) === index) {
//       return user;
//     }
//   });
// };

export default function UserProfilePicNOSTR({
  user_id,
  size,
  img,
  ring = true,
  mainAccountUser = false,
  allowClick = true,
  allowPropagation = false,
  metadata = false,
}) {
  const userKeys = useSelector((state) => state.userKeys);
  const userMetadata = useSelector((state) => state.userMetadata);
  const userFollowings = useSelector((state) => state.userFollowings);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);

  const [showMetadata, setShowMetada] = useState(false);
  const [fetchedImg, setFetchedImg] = useState(false);
  const [userFollowers, setUserFollowers] = useState([]);
  const [mutualFollows, setMutualFollows] = useState([]);
  const [subStart, setSubStart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initConv, setInitConv] = useState(false);
  const navigateTo = useNavigate();

  useEffect(() => {
    if (user_id && nostrAuthors.length > 0) {
      let auth = getUser(user_id);
      if (auth) {
        setFetchedImg(auth.picture);
      }
    }
  }, [nostrAuthors]);

  const handleClick = (e) => {
    try {
      if (!allowPropagation) e.stopPropagation();
      if (allowClick) {
        let url = nip19.nprofileEncode({
          pubkey: mainAccountUser ? userMetadata.pubkey : user_id,
          relays: relaysOnPlatform,
        });

        customHistory.push(`/users/${url}`);
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleInitConvo = () => {
    if (userKeys && (userKeys.sec || userKeys.ext)) {
      setInitConv(true);
    }
  };

  const onMouseHover = async () => {
    let isHoverAllowed = getCustomSettings().userHoverPreview
    if(!isHoverAllowed) return
    setShowMetada(true);
    if (!userKeys) return false;
    if (!subStart) {
      setSubStart(true);
      let mutuals = await getMutualFollows(userKeys.pub, user_id);
      mutuals = mutuals
        ? mutuals.filter((_) => _.kind === 0).map((_) => getuserMetadata(_))
        : [];
      setMutualFollows(mutuals);
      setIsLoading(false);
      // let events = [];
      // const sub = ndkInstance.subscribe([{ kinds: [3], "#p": [user_id] }], {
      //   cacheUsage: "CACHE_FIRST",
      // });

      // sub.on("event", (event) => {
      //   events.push(event);
      //   setUserFollowers((prev) => [...prev, event]);
      // });

      // sub.on("close", () => {
      //   let authors = getMutualFollows(events, userFollowings);
      //   saveUsers(authors.map((author) => author.pubkey));
      //   setMutualFollows(authors);
      //   setIsLoading(false);
      //   // sub.stop();
      // });
      // let timeout = setTimeout(() => {
      //   sub.stop();
      //   clearTimeout(timeout);
      // }, 5000);
    }
  };

  if (mainAccountUser)
    return (
      <>
        {userMetadata.picture && (
          <div
            className={`pointer fx-centered ${
              ring ? "profile-pic-ring" : ""
            } bg-img cover-bg`}
            style={{
              minWidth: `${size}px`,
              minHeight: `${size}px`,
              backgroundImage: `url(${userMetadata.picture})`,
              borderRadius: "var(--border-r-14)",
              backgroundColor: "var(--dim-gray)",
              borderColor: "black",
            }}
            onClick={handleClick}
          ></div>
        )}
        {!userMetadata.picture && (
          <div
            style={{ minWidth: `${size}px`, minHeight: `${size}px` }}
            className={`pointer fx-centered ${ring ? "profile-pic-ring" : ""}`}
            onClick={handleClick}
          >
            <Avatar
              size={size}
              name={userMetadata.name}
              variant="beam"
              colors={["#0A0310", "#49007E", "#FF005B", "#FF7D10", "#FFB238"]}
            />
          </div>
        )}
      </>
    );

  return (
    <>
      {initConv && metadata && (
        <InitiConvo exit={() => setInitConv(false)} receiver={user_id} />
      )}

      <div
        style={{ position: "relative" }}
        // ref={containerRef}
        // onMouseEnter={() => setShowMetada(true)}
        onMouseEnter={onMouseHover}
        onMouseLeave={() => {
          setShowMetada(false);
        }}
      >
        {(img || fetchedImg) && (
          <div
            className={`pointer fx-centered ${
              ring ? "profile-pic-ring" : ""
            } bg-img cover-bg`}
            style={{
              minWidth: `${size}px`,
              minHeight: `${size}px`,
              backgroundImage: `url(${img || fetchedImg})`,
              borderRadius: "var(--border-r-14)",
              backgroundColor: "var(--dim-gray)",
              borderColor: "black",
            }}
            onClick={handleClick}
          ></div>
        )}
        {!(img || fetchedImg) && (
          <div
            style={{
              minWidth: `${size}px`,
              minHeight: `${size}px`,
              borderRadius: "var(--border-r-14)",
              overflow: "hidden",
            }}
            className={`pointer fx-centered ${ring ? "profile-pic-ring" : ""}`}
            onClick={handleClick}
          >
            <Avatar
              size={size}
              name={user_id}
              square
              variant="marble"
              colors={["#0A0310", "#49007E", "#FF005B", "#FF7D10", "#FFB238"]}
            />
          </div>
        )}
        {showMetadata && metadata && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "calc(100% + 2px)",
              width: "300px",
              zIndex: 200,
              overflow: "visible",
              backgroundColor: "var(--very-dim-gray)",
              // borderRadius: "var(--border-r-6)"
            }}
            className="fx-centered fx-col fx-start-h fx-start-v sc-s-18 box-pad-h-s box-pad-v-s"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fit-container fx-scattered">
              <div className="fx-centered">
                <UserProfilePicNOSTR
                  user_id={user_id}
                  size={24}
                  img={img}
                  ring={false}
                />
                <div>
                  <p className="p-small">
                    {metadata.display_name || metadata.name}
                  </p>
                  <p className="p-small gray-c">
                    @{metadata.name || metadata.display_name}
                  </p>
                </div>
              </div>
              <div className="fx-centered">
                <ZapTip
                  recipientLNURL={checkForLUDS(metadata.lud06, metadata.lud16)}
                  // recipientLNURL={user.lud06 || user.lud16}
                  recipientPubkey={metadata.pubkey}
                  senderPubkey={userKeys.pub}
                  recipientInfo={{
                    name: metadata.name,
                    picture: metadata.picture,
                  }}
                  smallIcon={true}
                />
                <div
                  className="round-icon-small round-icon-tooltip"
                  data-tooltip={
                    userKeys && (userKeys.sec || userKeys.ext)
                      ? `Message ${
                          metadata.display_name ||
                          metadata.name ||
                          "this profile"
                        }`
                      : `Login to message ${
                          metadata.display_name ||
                          metadata.name ||
                          "this profile"
                        }`
                  }
                  onClick={handleInitConvo}
                >
                  <div className="env-edit"></div>
                </div>
                <Follow
                  size="small"
                  toFollowKey={user_id}
                  toFollowName={""}
                  bulkList={[]}
                />
              </div>
            </div>
            <div>
              <p className="p-medium p-four-lines">{metadata.about || "N/A"}</p>
            </div>
            {metadata.website && (
              <div className="fx-centered fx-start-h">
                <div className="link"></div>
                <a
                  className="p-medium "
                  href={
                    metadata.website.toLowerCase().includes("http")
                      ? metadata.website
                      : `https://${metadata.website}`
                  }
                  target="_blank"
                >
                  {metadata.website || "N/A"}
                </a>
              </div>
            )}
            <div className="fx-centered fx-start-h">
              <div className="nip05"></div>
              <p className="p-medium ">{metadata.nip05 || "N/A"}</p>
            </div>

            {/* <div className="fx-centered fx-start-h">
              <div className="user"></div>
              <p className="p-medium ">{userFollowers.length} Followers</p>
            </div> */}

            {!isLoading && <DisplayMutualFollows users={mutualFollows} />}
            {isLoading && (
              <p className="orange-c p-italic p-medium">Loading mutuals...</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const DisplayMutualFollows = ({ users }) => {
  const [firstMutuals, setFirstMutuals] = useState(users.slice(0, 3));
  // const nostrAuthors = useSelector((state) => state.nostrAuthors);

  // useEffect(() => {
  //   setFirstMutuals(users.slice(0, 3));
  // }, [users]);

  // useEffect(() => {
  //   try {
  //     let tempFirstMutuals = Array.from(firstMutuals);
  //     tempFirstMutuals = tempFirstMutuals.map((author) => {
  //       let auth = getUser(author.pubkey);
  //       if (auth) return auth;
  //       return author;
  //     });
  //     setFirstMutuals(tempFirstMutuals);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }, [nostrAuthors]);

  if (users.length === 0)
    return (
      <p className="p-medium gray-c">Not followed by anyone you follow.</p>
    );
  return (
    <div className="fit-container fx-centered fx-start-h fx-start-v">
      <div className="fx-centered">
        {firstMutuals.map((user, index) => {
          return (
            <div
              key={index}
              style={{
                transform: `translateX(-${15 * index}px)`,
                border: "2px solid var(--very-dim-gray)",
                borderRadius: "50%",
              }}
            >
              <UserProfilePicNOSTR
                user_id={user?.pubkey}
                size={16}
                ring={false}
                mainAccountUser={false}
                img={user.picture}
              />
            </div>
          );
        })}
      </div>
      {users.length > 3 && (
        <p
          className="gray-c p-medium"
          style={{ transform: "translateX(-35px)" }}
        >
          + {users.length - 3} mutual(s)
        </p>
      )}
      {users.length <= 3 && (
        <p
          className="gray-c p-medium"
          style={{ transform: `translateX(-${15 * (users.length - 1)}px)` }}
        >
          mutual(s)
        </p>
      )}
    </div>
  );
};
