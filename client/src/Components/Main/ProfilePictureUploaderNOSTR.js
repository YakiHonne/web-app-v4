import React, { useState } from "react";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import { nostrPpPlaceholder } from "../../Content/NostrPPPlaceholder";
import relaysOnPlatform from "../../Content/Relays";
import LoadingDots from "../LoadingDots";
import axiosInstance from "../../Helpers/HTTP_Client";
import { filterRelays } from "../../Helpers/Encryptions";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import UploadFile from "../UploadFile";

export default function ProfilePictureUploaderNOSTR({
  current = "",
  relays = [],
  validateButton = "Next",
  cancelButton = false,
  prevUserData = {},
  tags = [],
  exit,
  cancel,
}) {
  const dispatch = useDispatch();
  const isPublishing = useSelector((state) => state.isPublishing);
  const userRelays = useSelector((state) => state.userRelays);
  const userKeys = useSelector((state) => state.userKeys);
  const [isLoading, setIsLoading] = useState(false);
  const [imgPrev, setImgPrev] = useState(current || nostrPpPlaceholder[0]);
  const [img, setImg] = useState("");
  const [imgUrl, setImgUrl] = useState(current || "");

  const handleUpload = (e) => {
    let file = e.target.files[0];
    if (file) {
      setImg(file);
      setImgPrev(URL.createObjectURL(file));
      setImgUrl("");
      return;
    }
    setImg("");
  };

  const publish = async () => {
    if (isPublishing) {
      dispatch(
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        })
      );
      return;
    }
    setIsLoading(true);
    let userPicture = img ? await uploadToS3() : imgUrl || imgPrev;
    if (userPicture === false) {
      setIsLoading(false);
      return;
    }
    let content = {
      ...prevUserData,
      picture: userPicture,
    };
    dispatch(
      setToPublish({
        userKeys: userKeys,
        kind: 0,
        content: JSON.stringify(content),
        tags,
        allRelays: userRelays,
      })
    );
    exit();
    setIsLoading(false);
  };

  const uploadToS3 = async () => {
    if (img) {
      try {
        let fd = new FormData();
        fd.append("file", img);
        fd.append("pubkey", userKeys.pub);
        let data = await axiosInstance.post("/api/v1/file-upload", fd, {
          headers: { "Content-Type": "multipart/formdata" },
        });
        return data.data.image_path;
      } catch {
        dispatch(
          setToast({
            type: 2,
            desc: `The image size exceeded the required limit, the max size allowed is 1Mb.`,
          })
        );
        return false;
      }
    }
  };
  const handleThumbnailValue = (e) => {
    let value = e.target.value;
    setImgUrl(value);
    setImgPrev(value);
    setImg("");
  };
  return (
    <div className="fit-container box-pad-h fx-centered fx-col">
      <div style={{ maxWidth: "380px" }} className="fx-scattered fx-wrap">
        <h3 className="box-marg-s fit-container p-centered">
          Update profile picture
        </h3>
        <div
          className="fit-container fx-centered  fx-start-v box-pad-v"
          style={{ columnGap: "26px" }}
        >
          <UserProfilePicNOSTR img={imgPrev} size={128} />
        </div>
        {/* {nostrPpPlaceholder.map((pp) => {
          return (
            <div
              onClick={() => {
                setImgPrev(pp);
                setImgUrl("");
                setImg("");
              }}
              key={pp}
              className="fx-centered pointer"
              style={{
                opacity: pp === imgPrev ? "1" : ".5",
                transition: ".2s ease-in-out",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: "2",
                }}
              ></div>
              <UserProfilePicNOSTR img={pp} size={72} ring={pp === imgPrev} />
            </div>
          );
        })}
        <div className="fit-container fx-scattered box-pad-v-m">
          <hr />
          <p style={{ width: "40px" }}>or</p>
          <hr />
          <hr />
        </div> */}
        {/* <div className="fit-container fx-centered">
          <label
            className="fit-container fx-centered sc-s-d box-pad-h box-pad-v-m"
            style={{ position: "relative", backgroundColor: "transparent" }}
            htmlFor="image-upload"
          >
            {!img ? (
              <>
                <div className="image"></div>
                <p className="gray-c p-medium">upload yours</p>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpg, image/png, image/gif"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                  }}
                  onChange={handleUpload}
                />
              </>
            ) : (
              <div className="fit-container fx-scattered">
                <p className="gray-c p-medium">{img.name}</p>
                <div
                  className="trash"
                  onClick={() => {
                    setImg("");
                    setImgPrev(current || nostrPpPlaceholder[0]);
                    setImgUrl("");
                  }}
                ></div>
              </div>
            )}
          </label>
        </div> */}
        <div className="fit-container fx-centered">
          <input
            type="text"
            className="if ifs-full"
            placeholder="Image url..."
            value={imgUrl}
            onChange={handleThumbnailValue}
          />
          <UploadFile
            setImageURL={(url) => {
              setImgPrev(url);
              setImgUrl(url);
            }}
            round={true}
            setFileMetadata={() => null}
            setIsUploadsLoading={setIsLoading}
          />
        </div>
        <div className="fit-container fx-centered fx-end-h box-pad-v-m">
          {cancelButton && (
            <button
              className="btn btn-gst fx"
              disabled={isLoading}
              onClick={cancel}
            >
              {isLoading ? <LoadingDots /> : "Cancel"}
            </button>
          )}
          {userKeys.sec && (
            <button
              className="btn btn-normal"
              onClick={publish}
              disabled={isLoading}
            >
              {isLoading ? <LoadingDots /> : validateButton}
            </button>
          )}
          {!userKeys.sec && userKeys.ext && (
            <button
              className="btn btn-normal"
              onClick={publish}
              disabled={isLoading}
            >
              {isLoading ? <LoadingDots /> : validateButton}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
