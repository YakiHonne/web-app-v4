import React, { useEffect, useRef, useState } from "react";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import PagePlaceholder from "../../Components/PagePlaceholder";
import LoadingDots from "../../Components/LoadingDots";
import Date_ from "../../Components/Date_";
import axiosInstance from "../../Helpers/HTTP_Client";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import ToChangeProfilePic from "../../Components/Main/ToChangeProfilePic";
import { Helmet } from "react-helmet";
import Footer from "../../Components/Footer";
import NProfilePreviewer from "../../Components/Main/NProfilePreviewer";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { useNavigate } from "react-router-dom";
import { decodeUrlOrAddress, encodeLud06 } from "../../Helpers/Encryptions";

import axios from "axios";
import { FilePicker } from "../../Components/FilePicker";
import { FileUpload } from "../../Helpers/Helpers";
import LoadingScreen from "../../Components/LoadingScreen";
import Backbar from "../../Components/Main/Backbar";

export default function ProfileEdit() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userMetadata = useSelector((state) => state.userMetadata);
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const userAllRelays = useSelector((state) => state.userAllRelays);
  const isPublishing = useSelector((state) => state.isPublishing);

  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setImageUploading] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState(false);
  const [userName, setUserName] = useState(false);
  const [userAbout, setUserAbout] = useState(false);
  const [userWebsite, setUserWebsite] = useState(false);
  const [userNip05, setUserNip05] = useState(false);
  const [userLud16, setUserLud16] = useState(false);
  const [userLud06, setUserLud06] = useState(false);
  const [userPicture, setUserPicture] = useState(false);
  const [userBanner, setUserBanner] = useState(false);

  const [showMore, setShowMore] = useState(false);
  const [showProfilePicChanger, setShowProfilePicChanger] = useState(false);
  const [showCoverUploader, setCoverUploader] = useState(false);
  const [tempUserRelays, setTempUserRelays] = useState([]);
  const [relaysStatus, setRelaysStatus] = useState([]);
  const extrasRef = useRef();

  useEffect(() => {
    triggerEdit();
  }, [userMetadata]);

  useEffect(() => {
    setTempUserRelays(userAllRelays);
    setRelaysStatus(
      userAllRelays.map((item) => {
        return { url: item.url, connected: false };
      })
    );
  }, [userRelays]);

  useEffect(() => {
    const CheckRelays = async () => {
      try {
        tempUserRelays.map(async (relay, index) => {
          let connected = ndkInstance.pool.getRelay(relay.url);
          if (connected.connected) {
            let tempRelays_ = Array.from(relaysStatus);
            tempRelays_[index].connected = true;
            setRelaysStatus(tempRelays_);
          }
        });
      } catch (err) {}
    };

    if (tempUserRelays) CheckRelays();
  }, [tempUserRelays]);

  const updateInfos = async () => {
    let content = { ...userMetadata };
    content.picture = userPicture !== false ? userPicture : content.picture;
    content.banner = userBanner !== false ? userBanner : content.banner;
    content.name = userName !== false ? userName : content.name;
    content.display_name =
      userDisplayName !== false ? userDisplayName : content.display_name;
    content.about = userAbout !== false ? userAbout : content.about || "";
    content.website =
      userWebsite !== false ? userWebsite : content.website || "";
    content.nip05 = userNip05 !== false ? userNip05 : content.nip05;
    content.lud06 = userLud06 !== false ? userLud06 : content.lud06;
    content.lud16 = userLud16 !== false ? userLud16 : content.lud16;
    // content.lud06 = userLud06 !== false ? userLud06 : content.lud06;
    // content.lud16 = userLud06 !== false ? encodeLud06(userLud06) : content.lud16;
    
    setIsLoading(true);
    dispatch(
      setToPublish({
        userKeys: userKeys,
        kind: 0,
        content: JSON.stringify(content),
        tags: [],
        allRelays: userRelays,
      })
    );
  };

  const handleLUD16 = async (e) => {
    let add = e.target.value;
    let tempAdd = encodeLud06(decodeUrlOrAddress(add));
    setUserLud16(add);
    if (!tempAdd) setUserLud06("");
    if (tempAdd) {
      let data = await axios.get(decodeUrlOrAddress(add));

      setUserLud16(JSON.parse(data.data.metadata)[0][1]);
      setUserLud06(tempAdd);
    }
  };

  const uploadCover = async (upload = false, file) => {
    if (isPublishing) {
      dispatch(
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        })
      );
      return;
    }
    let cover = file;
    if (cover) {
      try {
        setIsLoading(true);
        var content = getUserContent(file);
        var uploadedImage = "";
        if (upload) {
          let fd = new FormData();
          fd.append("file", cover);
          fd.append("pubkey", userKeys.pub);
          let data = await axiosInstance.post("/api/v1/file-upload", fd, {
            headers: { "Content-Type": "multipart/formdata" },
          });
          uploadedImage = data.data.image_path;
          content = getUserContent(data.data.image_path);
          deleteFromS3(userMetadata.banner);
        }

        dispatch(
          setToPublish({
            userKeys: userKeys,
            kind: 0,
            content,
            tags: [],
            allRelays: userRelays,
          })
        );

        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        console.log(err);
        dispatch(
          setToast({
            type: 2,
            desc: `The image size exceeded the required limit, the max size allowed is 1Mb.`,
          })
        );
      }
    }
  };

  const uploadImages = async (data, kind) => {
    let file = data.file;
    setImageUploading(true);
    let url = await FileUpload(file, undefined, userKeys);
    if (url) {
      if (kind === "banner") {
        setUserBanner(url);
      }
      if (kind === "picture") {
        setUserPicture(url);
      }
      setImageUploading(false);
      return;
    }
    dispatch(
      setToast({
        type: 2,
        desc: "An error occured while uploading your cover, use a supported format with no more than 5mb of size",
      })
    );
    setImageUploading(false);
  };

  const getUserContent = (banner) => {
    let content = {
      ...userMetadata,
    };
    content.banner = banner;
    return JSON.stringify(content);
  };

  const deleteFromS3 = async (img) => {
    if (img.includes("yakihonne.s3")) {
      let data = await axiosInstance.delete("/api/v1/file-upload", {
        params: { image_path: img },
      });
      return true;
    }
    return false;
  };

  const triggerEdit = () => {
    setUserPicture(userMetadata.picture);
    setUserBanner(userMetadata.banner);
    setUserName(userMetadata.name);
    setUserDisplayName(userMetadata.display_name);
    setUserWebsite(userMetadata.website);
    setUserAbout(userMetadata.about);
    setUserNip05(userMetadata.nip05);
    setUserLud16(userMetadata.lud16);
    setUserLud06(userMetadata.lud06);
    setIsLoading(false);
  };

  const checkMetadata = () => {
    let tempUserMetadata = { ...userMetadata };
    tempUserMetadata.picture = userPicture;
    tempUserMetadata.banner = userBanner;
    tempUserMetadata.name = userName;
    tempUserMetadata.display_name = userDisplayName;
    tempUserMetadata.website = userWebsite;
    tempUserMetadata.about = userAbout;
    tempUserMetadata.nip05 = userNip05;
    tempUserMetadata.lud16 = userLud16;

    return JSON.stringify(userMetadata) === JSON.stringify(tempUserMetadata);
  };

  return (
    <>
      {showCoverUploader && (
        <CoverUploader
          exit={() => setCoverUploader(false)}
          oldThumbnail={userMetadata.banner}
          uploadCover={uploadCover}
        />
      )}

      {showProfilePicChanger && (
        <ToChangeProfilePic
          cancel={() => setShowProfilePicChanger(false)}
          exit={() => {
            setShowProfilePicChanger(false);
          }}
        />
      )}

      <div>
        <Helmet>
          <title>Yakihonne | Profile edit</title>
        </Helmet>
        <div className="fit-container fx-centered" style={{ columnGap: 0 }}>
          <div className="main-container">
            <SidebarNOSTR />
            <main
              className={`main-page-nostr-container ${
                isLoading || isImageUploading ? "flash" : ""
              }`}
              style={{
                pointerEvents: isLoading || isImageUploading ? "none" : "auto",
              }}
            >
 
              <div
                className="fx-centered fit-container  fx-start-v"
                style={{ gap: 0 }}
              >
                <div className="main-middle">
                  {userMetadata && (userKeys.sec || userKeys.ext) && (
                    <>
                      <div className="fit-container fx-centered fx-col" style={{gap: 0}}>
                      <Backbar />
                        <div
                          className="fit-container fx-centered fx-end-v"
                          style={{
                            height: "250px",
                            position: "relative",
                          }}
                        >
                          <div
                            className="fit-container bg-img cover-bg sc-s"
                            style={{
                              backgroundImage: `url(${userBanner})`,
                              height: "70%",
                              zIndex: 0,
                              position: "absolute",
                              left: 0,
                              top: 0,
                              borderBottom: "1px solid var(--very-dim-gray)",
                              border: "none",
                              borderTopLeftRadius: "0",
                              borderTopRightRadius: "0",
                              // borderRadius: "0",
                            }}
                          ></div>
                          <div
                            className="fx-centered pointer"
                            style={{
                              position: "absolute",
                              right: "16px",
                              top: "16px",
                            }}
                          >
                            <FilePicker
                              element={
                                <div className="fx-centered sticker  sticker-gray-gray">
                                  Upload cover
                                  <div className="plus-sign"></div>
                                </div>
                              }
                              setFile={(data) => {
                                uploadImages(data, "banner");
                              }}
                            />

                            {userBanner && (
                              <div
                                className="close"
                                onClick={() => setUserBanner("")}
                                style={{ position: "static" }}
                              >
                                <div></div>
                              </div>
                            )}
                          </div>
                          <FilePicker
                            element={
                              <div className="fit-container fx-col fx-centered box-pad-h">
                                <div
                                  style={{
                                    border: "6px solid var(--white)",
                                    borderRadius: "var(--border-r-50)",
                                    position: "relative",
                                    overflow: "hidden",
                                  }}
                                  className="settings-profile-pic"
                                >
                                  <div
                                    style={{
                                      backgroundImage: `url(${userPicture})`,
                                      border: "none",
                                      minWidth: "128px",
                                      aspectRatio: "1/1",
                                      borderRadius: "50%",
                                    }}
                                    className="bg-img cover-bg sc-s"
                                  ></div>
                                  <div
                                    style={{
                                      position: "absolute",
                                      left: 0,
                                      top: 0,
                                      width: "100%",
                                      height: "100%",
                                      zIndex: 1,
                                      backgroundColor: "rgba(0,0,0,.8)",
                                    }}
                                    className="fx-centered pointer toggle fx-col"
                                  >
                                    <div
                                      className="image-24"
                                      style={{ filter: "invert()" }}
                                    ></div>
                                    <p className="gray-c">Add picture</p>
                                  </div>
                                </div>
                              </div>
                            }
                            setFile={(data) => {
                              uploadImages(data, "picture");
                            }}
                          />
                          {/* <div
                            className="fx-centered pointer round-icon round-icon-tooltip"
                            data-tooltip={"Update cover"}
                            style={{
                              backgroundColor: "var(--dim-gray)",
                              position: "absolute",
                              right: userMetadata.banner ? "62px" : "16px",
                              top: "16px",
                            }}
                            onClick={() => setCoverUploader(true)}
                          >
                            {isLoading ? (
                              <LoadingDots />
                            ) : (
                              <div className="edit-24"></div>
                            )}
                          </div>

                          {userMetadata.banner && (
                            <div
                              className="fx-centered pointer round-icon round-icon-tooltip"
                              data-tooltip={"Delete cover"}
                              style={{
                                backgroundColor: "var(--dim-gray)",
                                position: "absolute",
                                right: "16px",
                                top: "16px",
                              }}
                              onClick={clearCover}
                            >
                              <div className="trash-24"></div>
                            </div>
                          )} */}
                          {/* <div
                            style={{
                              border: "6px solid var(--white)",
                              borderRadius: "var(--border-r-50)",
                              position: "relative",
                              overflow: "hidden",
                            }}
                            className="settings-profile-pic"
                          >
                            <UserProfilePicNOSTR
                              img={userMetadata.picture}
                              size={148}
                              
                            />
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: "100%",
                                height: "100%",
                                zIndex: 1,
                                backgroundColor: "rgba(0,0,0,.5)",
                              }}
                              className="fx-centered pointer toggle"
                              onClick={() => setShowProfilePicChanger(true)}
                            >
                              <div
                                className="image-24"
                                style={{ filter: "invert()" }}
                              ></div>
                            </div>
                          </div> */}
                        </div>
                        <div className="fit-container fx-col fx-centered box-pad-h">
                          <div className="box-pad-v-s fx-centered fx-col fit-container">
                            {userName === false && (
                              <>
                                <p className="gray-c">
                                  <Date_
                                    toConvert={
                                      userMetadata.created_at
                                        ? new Date(
                                            userMetadata.created_at * 1000
                                          )
                                        : new Date()
                                    }
                                  />
                                </p>
                              </>
                            )}
                            <div
                              className="fx-centered fx-col fit-container"
                              style={{ columnGap: "10px" }}
                            >
                              <div className="fit-container sc-s-18 no-bg ">
                                <p
                                  className="p-medium gray-c box-pad-h-m"
                                  style={{ paddingTop: ".5rem" }}
                                >
                                  Display name
                                </p>
                                <input
                                  className="if ifs-full if-no-border"
                                  style={{ height: "36px" }}
                                  placeholder="Display name"
                                  value={userDisplayName}
                                  onChange={(e) =>
                                    setUserDisplayName(e.target.value)
                                  }
                                />
                              </div>
                              <div className="fit-container sc-s-18 no-bg ">
                                <p
                                  className="p-medium gray-c box-pad-h-m"
                                  style={{ paddingTop: ".5rem" }}
                                >
                                  Username
                                </p>
                                <div className="fx-centered fit-container">
                                  <p style={{ paddingLeft: "1rem" }}>@</p>
                                  <input
                                    className="if ifs-full if-no-border"
                                    style={{ height: "36px", paddingLeft: "0" }}
                                    placeholder="Username"
                                    value={userName}
                                    onChange={(e) =>
                                      setUserName(e.target.value)
                                    }
                                  />
                                </div>
                              </div>
                              <div className="fit-container sc-s-18 no-bg ">
                                <p
                                  className="p-medium gray-c box-pad-h-m"
                                  style={{ paddingTop: ".5rem" }}
                                >
                                  About
                                </p>
                                <textarea
                                  className="txt-area box-pad-v-m ifs-full if-no-border"
                                  placeholder="About"
                                  rows={20}
                                  value={userAbout}
                                  onChange={(e) => setUserAbout(e.target.value)}
                                />
                              </div>
                              <div className="fit-container sc-s-18 no-bg">
                                <p
                                  className="p-medium gray-c box-pad-h-m"
                                  style={{ paddingTop: ".5rem" }}
                                >
                                  Website
                                </p>
                                <input
                                  className="if ifs-full if-no-border"
                                  style={{ height: "36px" }}
                                  placeholder="website"
                                  value={userWebsite}
                                  onChange={(e) =>
                                    setUserWebsite(e.target.value)
                                  }
                                />
                              </div>
                              <div className="fit-container sc-s-18 no-bg">
                                <p
                                  className="p-medium gray-c box-pad-h-m"
                                  style={{ paddingTop: ".5rem" }}
                                >
                                  Nip-05
                                </p>
                                <input
                                  className="if ifs-full if-no-border"
                                  style={{ height: "36px" }}
                                  placeholder="Nip05"
                                  value={userNip05}
                                  onChange={(e) => setUserNip05(e.target.value)}
                                />
                              </div>
                              <div className="fit-container sc-s-18 no-bg">
                                <p
                                  className="p-medium gray-c box-pad-h-m"
                                  style={{ paddingTop: ".5rem" }}
                                >
                                  Lightning addresses
                                </p>
                                <input
                                  className="if ifs-full if-no-border"
                                  style={{ height: "36px" }}
                                  placeholder="Lightning addresses"
                                  value={userLud16}
                                  onChange={handleLUD16}
                                />
                              </div>

                              {showMore && (
                                <>
                                  <div className="fit-container sc-s-18 no-bg">
                                    <p
                                      className="p-medium gray-c box-pad-h-m"
                                      style={{ paddingTop: ".5rem" }}
                                    >
                                      Profile picture
                                    </p>
                                    <input
                                      className="if ifs-full if-no-border"
                                      style={{ height: "36px" }}
                                      placeholder="Profile picture"
                                      value={userPicture}
                                      onChange={(e) =>
                                        setUserPicture(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="fit-container sc-s-18 no-bg">
                                    <p
                                      className="p-medium gray-c box-pad-h-m"
                                      style={{ paddingTop: ".5rem" }}
                                    >
                                      Cover
                                    </p>
                                    <input
                                      className="if ifs-full if-no-border"
                                      style={{ height: "36px" }}
                                      placeholder="Cover"
                                      value={userBanner}
                                      onChange={(e) =>
                                        setUserBanner(e.target.value)
                                      }
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                            <div
                              className="fit-container box-pad-v-s box-pad-h fx-centered pointer"
                              onClick={() => setShowMore(!showMore)}
                            >
                              <p>More</p>
                              <div
                                className="arrow "
                                style={{
                                  rotate: !showMore ? "0deg" : "180deg",
                                }}
                              ></div>
                            </div>
                            <div className="fx-centered fit-container box-marg">
                              <button
                                className={`btn btn-normal fx ${
                                  checkMetadata() && !isImageUploading
                                    ? "btn-disabled"
                                    : ""
                                }`}
                                onClick={updateInfos}
                                disabled={checkMetadata()}
                              >
                                {isLoading ? (
                                  <LoadingDots />
                                ) : (
                                  <>
                                    {isImageUploading
                                      ? "Uploading image..."
                                      : "Update"}
                                  </>
                                )}
                              </button>
                              {!checkMetadata() && (
                                <button
                                  className={"btn btn-gst fx "}
                                  onClick={triggerEdit}
                                >
                                  {isLoading ? (
                                    <LoadingDots />
                                  ) : (
                                    <>
                                      {isImageUploading
                                        ? "Uploading image..."
                                        : "Revert changes"}
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {userMetadata && !userKeys.sec && !userKeys.ext && (
                    <PagePlaceholder page={"nostr-unauthorized"} />
                  )}
                  {!userMetadata && (
                    <PagePlaceholder page={"nostr-not-connected"} />
                  )}
                </div>
                {/* {userMetadata && (
                  <div
                    className="box-pad-h-s fx-centered fx-col fx-start-v extras-homepage"
                    style={{
                      position: "sticky",
                      top:
                        extrasRef.current?.getBoundingClientRect().height >=
                        window.innerHeight
                          ? `calc(95vh - ${
                              extrasRef.current?.getBoundingClientRect()
                                .height || 0
                            }px)`
                          : 0,
                      zIndex: "100",
                      flex: 1,
                    }}
                    ref={extrasRef}
                  >
                    <div className="sticky fit-container">
                      <SearchbarNOSTR />
                    </div>
                    <div
                      className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered box-marg-s"
                      style={{
                        backgroundColor: "var(--c1-side)",
                        rowGap: "24px",
                        border: "none",
                        overflow: "visible",
                      }}
                    >
                      {relaysStatus.length > 0 && (
                        <div className=" fx-centered fx-col fx-start-v fit-container">
                          <h4>My relays</h4>
                          <div className="fx-centered fx-centered fx-wrap">
                            {relaysStatus.map((relay, index) => {
                              return (
                                <div
                                  key={index}
                                  className="fit-container fx-scattered"
                                >
                                  <p>{relay.url}</p>
                                  {relay?.connected && (
                                    <div
                                      style={{
                                        minWidth: "8px",
                                        aspectRatio: "1/1",
                                        backgroundColor: "var(--green-main)",
                                        borderRadius: "var(--border-r-50)",
                                      }}
                                      className="round-icon-tooltip pointer"
                                      data-tooltip="connected"
                                    ></div>
                                  )}
                                  {!relay?.connected && (
                                    <div
                                      style={{
                                        minWidth: "8px",
                                        aspectRatio: "1/1",
                                        backgroundColor: "var(--red-main)",
                                        borderRadius: "var(--border-r-50)",
                                      }}
                                      className="round-icon-tooltip pointer"
                                      data-tooltip="not connected"
                                    ></div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {relaysStatus.length === 0 && (
                        <div
                          className="fx-centered fx-col"
                          style={{ height: "200px" }}
                        >
                          <h4>No relays</h4>
                          <p className="gray-c p-centered">
                            Add your favorite relays to your list
                          </p>
                          <button
                            className="btn btn-normal btn-small"
                            onClick={() => navigate("/settings")}
                          >
                            Add relays
                          </button>
                        </div>
                      )}
                    </div>
                    <Footer />
                  </div>
                )} */}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

const MutedList = ({ exit }) => {
  const dispatch = useDispatch();
  const userRelays = useSelector((state) => state.userRelays);
  const userKeys = useSelector((state) => state.userKeys);
  const userMutedList = useSelector((state) => state.userMutedList);
  const isPublishing = useSelector((state) => state.isPublishing);
  const muteUnmute = async (index) => {
    try {
      if (isPublishing) {
        dispatch(
          setToast({
            type: 3,
            desc: "An event publishing is in process!",
          })
        );
        return;
      }

      let tempTags = Array.from(userMutedList.map((pubkey) => ["p", pubkey]));

      tempTags.splice(index, 1);

      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 10000,
          content: "",
          tags: tempTags,
          allRelays: userRelays,
        })
      );
    } catch (err) {
      console.log(err);
    }
  };
  if (!Array.isArray(userMutedList)) return;
  return (
    <div className="fixed-container box-pad-h fx-centered">
      <div
        className="box-pad-h box-pad-v sc-s-18"
        style={{ width: "min(100%, 500px)", position: "relative" }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        {userMutedList.length > 0 && (
          <h4 className="p-centered box-marg-s">Muted list</h4>
        )}
        {userMutedList.length > 0 && (
          <div
            className="fit-container fx-centered fx-col fx-start-v fx-start-h"
            style={{ maxHeight: "40vh", overflow: "scroll" }}
          >
            {userMutedList.map((pubkey, index) => {
              return (
                <div key={pubkey} className="fit-container fx-shrink">
                  <NProfilePreviewer
                    margin={false}
                    onClose={() => muteUnmute(index)}
                    close={true}
                    pubkey={pubkey}
                  />
                </div>
              );
            })}
          </div>
        )}
        {userMutedList.length === 0 && (
          <div
            className="fx-centered fx-col fit-container"
            style={{ height: "20vh" }}
          >
            <div className="user-24"></div>
            <p>No muted list</p>
            <p className="gray-c p-medium p-centered">
              The muted list is empty
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const CoverUploader = ({ exit, oldThumbnail, uploadCover }) => {
  const dispatch = useDispatch();
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailPrev, setThumbnailPrev] = useState(oldThumbnail || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(oldThumbnail || "");

  const handleImageUpload = (e) => {
    let file = e.target.files[0];
    if (file && !file.type.includes("image/")) {
      dispatch(
        setToast({
          type: 2,
          desc: "Image type is unsupported!",
        })
      );
      return;
    }
    if (file) {
      setThumbnail(file);
      setThumbnailPrev(URL.createObjectURL(file));
      setThumbnailUrl("");
    }
  };

  const initThumbnail = async () => {
    setThumbnailPrev("");
    setThumbnailUrl("");
    setThumbnail("");
  };

  const handleThumbnailValue = (e) => {
    let value = e.target.value;
    setThumbnailUrl(value);
    setThumbnailPrev(value);
    setThumbnail("");
  };

  const save = () => {
    if (!thumbnail && !thumbnailUrl) return;
    if (thumbnail) {
      uploadCover(true, thumbnail);
      exit();
      return;
    }
    uploadCover(false, thumbnailUrl);
    exit();
    return;
  };

  return (
    <div className="fixed-container fx-centered">
      <div
        className="sc-s box-pad-v box-pad-h fx-centered fx-col"
        style={{ position: "relative", width: "min(100%, 500px)" }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <div className="fit-container box-pad-h box-marg-s fx-centered">
          <h4>Refresh your cover image</h4>
        </div>
        <div
          className="fit-container fx-centered fx-col box-pad-h sc-s-d bg-img cover-bg"
          style={{
            position: "relative",
            height: "200px",
            backgroundImage: `url(${thumbnailPrev})`,
            borderStyle: thumbnailPrev ? "none" : "dotted",
          }}
        >
          {thumbnailPrev && (
            <div
              style={{
                width: "32px",
                height: "32px",
                position: "absolute",
                right: "16px",
                top: "16px",
                backgroundColor: "var(--dim-gray)",
                borderRadius: "var(--border-r-50)",
                zIndex: 10,
              }}
              className="fx-centered pointer"
              onClick={initThumbnail}
            >
              <div className="trash"></div>
            </div>
          )}

          {!thumbnailPrev && (
            <>
              <div className="image-24"></div>
              <p className="gray-c p-medium">(thumbnail)</p>
            </>
          )}
        </div>
        <div className="fit-container fx-centered">
          <input
            type="text"
            className="if ifs-full"
            placeholder="Image url..."
            value={thumbnailUrl}
            onChange={handleThumbnailValue}
          />
          <label
            htmlFor="image-up"
            className="fit-container fx-centered fx-col box-pad-h sc-s pointer bg-img cover-bg"
            style={{
              position: "relative",
              minHeight: "50px",
              minWidth: "50px",
              maxWidth: "50px",
            }}
          >
            <div className="upload-file-24"></div>
            <input
              type="file"
              id="image-up"
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                left: 0,
                top: 0,
                opacity: 0,
              }}
              value={thumbnail.fileName}
              onChange={handleImageUpload}
              // disabled={thumbnail}
              className="pointer"
              accept="image/jpg,image/png,image/gif"
            />
          </label>
        </div>
        <button
          className={`btn ${
            !thumbnail && !thumbnailUrl ? "btn-disabled" : "btn-normal"
          } btn-full`}
          onClick={save}
        >
          Save changes
        </button>
      </div>
    </div>
  );
};
