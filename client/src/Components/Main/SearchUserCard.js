import React, { useEffect, useState } from "react";
import { getAuthPubkeyFromNip05 } from "../../Helpers/Helpers";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import { Link } from "react-router-dom";

export default function SearchUserCard({ user, url, exit }) {
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
}
