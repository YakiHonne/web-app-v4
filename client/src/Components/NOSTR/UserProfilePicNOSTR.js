import { nip19 } from "nostr-tools";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { nostrPpPlaceholder } from "../../Content/NostrPPPlaceholder";
import relaysOnPlatform from "../../Content/Relays";
import Avatar from "boring-avatars";
// import placeholder from "../../media/images/nostr-pp-ph.png";
import { Context } from "../../Context/Context";

export default function UserProfilePicNOSTR({
  user_id,
  size,
  ring = true,
  mainAccountUser = false,
  img,
  allowClick = true,
}) {
  const { nostrUser, nostrUserAbout } = useContext(Context);
  const navigateTo = useNavigate();
  const handleClick = (e) => {
    // e.stopPropagation();
    try {
      if (allowClick) {
        let url = nip19.nprofileEncode({
          pubkey: mainAccountUser ? nostrUser.pubkey : user_id,
          relays: relaysOnPlatform,
        });
        // if (mainAccountUser) navigateTo(`/users/${nostrUser.pubkey}`);
        // if (!mainAccountUser && user_id) navigateTo(`/users/${user_id}`);
        navigateTo(`/users/${url}`);
      }
      return null;
    } catch {
      return null;
    }
  };
  if (mainAccountUser)
    return (
      <>
        {nostrUserAbout.picture && (
          <div
            className={`pointer fx-centered ${
              ring ? "profile-pic-ring" : ""
            } bg-img cover-bg`}
            style={{
              minWidth: `${size}px`,
              minHeight: `${size}px`,
              backgroundImage: `url(${nostrUserAbout.picture})`,
              borderRadius: "var(--border-r-50)",
              backgroundColor: "var(--dim-gray)",
              borderColor: "black",
            }}
            onClick={handleClick}
          ></div>
          // <div
          //   className={`pointer fx-centered ${
          //     ring ? "profile-pic-ring" : ""
          //   } bg-img cover-bg`}
          //   style={{
          //     minWidth: `${size}px`,
          //     minHeight: `${size}px`,
          //     backgroundImage: nostrUserAbout.picture
          //       ? `url(${nostrUserAbout.picture})`
          //       : `url(${nostrPpPlaceholder[0]})`,
          //     borderRadius: "var(--border-r-50)",
          //     backgroundColor: "var(--dim-gray)",
          //     borderColor: "black",
          //   }}
          //   onClick={handleClick}
          // ></div>
        )}
        {!nostrUserAbout.picture && (
          <div
            style={{ minWidth: `${size}px`, minHeight: `${size}px` }}
            className={`pointer fx-centered ${ring ? "profile-pic-ring" : ""}`}
            onClick={handleClick}
          >
            <Avatar
              size={size}
              name={nostrUserAbout.name}
              variant="beam"
              colors={["#0A0310", "#49007E", "#FF005B", "#FF7D10", "#FFB238"]}
            />
          </div>
        )}
      </>
    );
  return (
    <>
      {img && (
        <div
          className={`pointer fx-centered ${
            ring ? "profile-pic-ring" : ""
          } bg-img cover-bg`}
          style={{
            minWidth: `${size}px`,
            minHeight: `${size}px`,
            backgroundImage: `url(${img})`,
            borderRadius: "var(--border-r-50)",
            backgroundColor: "var(--dim-gray)",
            borderColor: "black",
          }}
          onClick={handleClick}
        ></div>
        // <div
        //   className={`pointer fx-centered ${
        //     ring ? "profile-pic-ring" : ""
        //   } bg-img cover-bg`}
        //   style={{
        //     minWidth: `${size}px`,
        //     minHeight: `${size}px`,
        //     backgroundImage: img
        //       ? `url(${img})`
        //       : `url(${nostrPpPlaceholder[0]})`,
        //     borderRadius: "var(--border-r-50)",
        //     backgroundColor: "var(--dim-gray)",
        //     borderColor: "black",
        //   }}
        //   onClick={handleClick}
        // ></div>
      )}
      {!img && (
        <div
          style={{ minWidth: `${size}px`, minHeight: `${size}px` }}
          className={`pointer fx-centered ${ring ? "profile-pic-ring" : ""}`}
          onClick={handleClick}
        >
          <Avatar
            size={size}
            name={user_id}
            variant="beam"
            colors={["#0A0310", "#49007E", "#FF005B", "#FF7D10", "#FFB238"]}
          />
        </div>
      )}
    </>
  );
}
