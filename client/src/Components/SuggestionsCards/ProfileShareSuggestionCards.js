import React, { useState } from "react";
import { useSelector } from "react-redux";
import bg from "../../media/images/leaves-bg.svg";
import bg2 from "../../media/images/dots-bg.png";
import UserProfilePicNOSTR from "../Main/UserProfilePicNOSTR";
import QRSharing from "../../Pages/MainApp/QRSharing";
import { useTranslation } from "react-i18next";

export default function ProfileShareSuggestionCards() {
  const { t } = useTranslation();
  const userMetadata = useSelector((state) => state.userMetadata);
  const userKeys = useSelector((state) => state.userKeys);
  const [showQR, setShowQR] = useState(false);
  if (!userKeys) return;

  return (
    <>
      {showQR && (
        <QRSharing user={userMetadata} exit={() => setShowQR(false)} />
      )}
      <div
        className="fit-container fx-centered box-pad-h box-pad-v-m"
        style={{ borderBottom: "1px solid var(--very-dim-gray)" }}
      >
        <div
          className="fit-container sc-s-18 fx-centered fx-col bg-img cover-bg"
          style={{
            gap: 0,
            backgroundImage: `url(${bg})`,
            position: "relative",
          }}
        >
          <div
            style={{
              backgroundImage: `url(${bg2})`,
              position: "absolute",
              left: 0,
              top: 0,
            }}
            className="fit-container fit-height bg-img cover-bg"
          ></div>
          <div
            className="box-pad-h box-pad-v fx-centered fx-col"
            style={{ position: "relative", zIndex: 3 }}
          >
            <UserProfilePicNOSTR mainAccountUser={true} size={94} />
            <h4 className="box-pad-v-s">
              @{userMetadata.display_name || userMetadata.name}
            </h4>
            <p className="gray-c p-centered" style={{ maxWidth: "350px" }}>
              {t("AjLZOWy")}
            </p>
            <div className="fit-container box-pad-h">
              <button
                className="btn btn-normal btn-full"
                onClick={() => setShowQR(true)}
              >
                {t("AawXy2A")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
