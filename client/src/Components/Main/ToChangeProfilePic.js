import React from "react";
import relaysOnPlatform from "../../Content/Relays";
import ProfilePictureUploaderNOSTR from "./ProfilePictureUploaderNOSTR";
import { useSelector } from "react-redux";

export default function ToChangeProfilePic({ exit, cancel }) {
  const userMetadata = useSelector((state) => state.userMetadata);
  return (
    <section className="fixed-container fx-centered">
      <div
        className="fx-centered fx-col slide-up"
        style={{
          width: "500px",
        }}
      >
        <ProfilePictureUploaderNOSTR
          relays={relaysOnPlatform}
          current={userMetadata.picture}
          cancelButton={true}
          validateButton={"Update Photo"}
          prevUserData={userMetadata}
          tags={[]}
          exit={exit}
          cancel={cancel}
        />
      </div>
    </section>
  );
}
