import React, { useState } from "react";
import LoadingDots from "./LoadingDots";
import { useDispatch, useSelector } from "react-redux";
import { setToast } from "../Store/Slides/Publishers";
import { FileUpload } from "../Helpers/Helpers";

export default function UploadFile({
  kind = "image/*",
  round = false,
  small = false,
  setImageURL,
  setIsUploadsLoading,
  setFileMetadata,
}) {
  const userKeys = useSelector((state) => state.userKeys);
  const dispatch = useDispatch();

  const [method, setMethod] = useState("nostr.build");
  const [isLoading, setIsLoading] = useState(false);

  const Upload = async (e) => {
    let file = e.target.files[0];
    if (!file && (!userKeys.sec || !userKeys.ext)) {
      dispatch(
        setToast({
          type: 2,
          desc: "It's either you selected a corrupted file or you're not logged-in using your secret key/extension",
        })
      );
      return;
    }
    setFileMetadata(file);
    setIsLoading(true);
    setIsUploadsLoading(true);
    let url = await FileUpload(file, method, userKeys);
    if (url) setImageURL(url);
    setIsLoading(false);
    setIsUploadsLoading(false);
  };

  return (
    <label
      htmlFor="file-upload"
      className={round ? (small ? "round-icon-small" : "round-icon") : ""}
      style={{
        position: "relative",
        pointerEvents: isLoading ? "none" : "auto",
      }}
    >
      <input
        type="file"
        name="file-upload"
        id="file-upload"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          opacity: 0,
          zIndex: -1,
        }}
        accept={kind}
        onChange={Upload}
        disabled={isLoading}
      />
      {isLoading ? (
        small ? (
          <div style={{ scale: ".6" }}>
            {" "}
            <LoadingDots />
          </div>
        ) : (
          <LoadingDots />
        )
      ) : (
        <div className={small ? "upload-file" : "upload-file-24"}></div>
      )}
    </label>
  );
}
