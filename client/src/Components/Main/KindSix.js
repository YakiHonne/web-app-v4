import React, { useEffect, useState } from "react";
import { getEmptyuserMetadata } from "../../Helpers/Encryptions";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import KindOne from "../../Components/Main/KindOne";
import { useSelector } from "react-redux";
import { getUser } from "../../Helpers/Controlers";

export default function KindSix({ event }) {
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const [user, setUser] = useState(getEmptyuserMetadata(event.pubkey));
  useEffect(() => {
    let auth = getUser(event.pubkey);

    if (auth) {
      setUser(auth);
    }
  }, [nostrAuthors]);

  return (
    <div
      className="fx-centered fx-col fx-start-v fit-container"
      style={{
        rowGap: "0px",
        overflow: "visible",
      }}
    >
      <div
        className="fx-centered fx-start-h sc-s-18 box-pad-h-s box-pad-v-s round-icon-tooltip pointer"
        style={{ overflow: "visible", marginLeft: "1rem" , marginTop: "1rem" }}
        data-tooltip={`${user.display_name} reposted this on ${new Date(
          event.created_at * 1000
        ).toLocaleDateString()}, ${new Date(
          event.created_at * 1000
        ).toLocaleTimeString()}`}
      >
        <UserProfilePicNOSTR
          size={20}
          mainAccountUser={false}
          
          user_id={user.pubkey}
          img={user.picture}
        />
        <div>
          <p className="p-bold">{user.display_name || user.name}</p>
        </div>
        <div className="switch-arrows"></div>
      </div>
      <KindOne event={event.relatedEvent} border={true} />
    </div>
  );
}
