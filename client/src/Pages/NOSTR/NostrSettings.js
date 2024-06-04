import React, { useContext, useEffect, useState } from "react";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import { Context } from "../../Context/Context";
import PagePlaceholder from "../../Components/PagePlaceholder";
import NavbarNOSTR from "../../Components/NOSTR/NavbarNOSTR";
import LoadingDots from "../../Components/LoadingDots";
import Date_ from "../../Components/Date_";
import axiosInstance from "../../Helpers/HTTP_Client";
import UserProfilePicNOSTR from "../../Components/NOSTR/UserProfilePicNOSTR";
import { publishPost } from "../../Helpers/NostrPublisher";
import relaysOnPlatform from "../../Content/Relays";
import LoadingScreen from "../../Components/LoadingScreen";
import { SimplePool } from "nostr-tools";
import {
  decodeUrlOrAddress,
  encodeLud06,
  filterRelays,
  getBech32,
  getEmptyNostrUser,
} from "../../Helpers/Encryptions";
import ToChangeProfilePic from "../../Components/NOSTR/ToChangeProfilePic";
import { shortenKey } from "../../Helpers/Encryptions";
import ToUpdateRelay from "../../Components/NOSTR/ToUpdateRelay";
import axios from "axios";
import { Helmet } from "react-helmet";
import TopicTagsSelection from "../../Components/TopicTagsSelection";
import Footer from "../../Components/Footer";
import NProfilePreviewer from "../../Components/NOSTR/NProfilePreviewer";
import LoginWithAPI from "../../Components/NOSTR/LoginWithAPI";

// import {requestInvoice} from 'lnurl-pay'

const checkForSavedCommentOptions = () => {
  try {
    let options = localStorage.getItem("comment-with-suffix");
    if (options) {
      let res = JSON.parse(options);
      return res.keep_suffix;
    }
    return -1;
  } catch {
    return -1;
  }
};

const pool = new SimplePool();

export default function NostrSettings() {
  const {
    setNostrUserData,
    nostrUser,
    nostrUserLoaded,
    nostrKeys,
    nostrUserAbout,
    nostrUserTags,
    nostrUserLogout,
    setNostrUserAbout,
    setNostrUser,
    setToast,
    isPublishing,
    setToPublish,
    yakiChestStats,
    isYakiChestLoaded,
  } = useContext(Context);
  const [isLoading, setIsLoading] = useState(false);
  const [updatedProfilePic, setUpdatedProfilePic] = useState(false);
  const [timestamp, setTimestamp] = useState(false);
  const [userName, setUserName] = useState(false);
  const [userAbout, setUserAbout] = useState(false);
  const [userNIP05, setUserNIP05] = useState(false);
  const [userThumbnail, setUserThumbnail] = useState(false);
  const [userThumbnailPrev, setUserThumbnailPrev] = useState("");
  const [showProfilePicChanger, setShowProfilePicChanger] = useState(false);
  const [showRelaysUpdater, setShowRelaysUpdater] = useState(false);
  const [showCoverUploader, setCoverUploader] = useState(false);
  const [showTopicsPicker, setShowTopicsPicker] = useState(false);
  const [showMutedList, setShowMutedList] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  const [tempUserRelays, setTempUserRelays] = useState(nostrUser.relays);
  const [lud06, setLud06] = useState("");
  const [lud16, setLud16] = useState("");
  const [isSave, setIsSave] = useState(checkForSavedCommentOptions());
  const [showYakiChest, setShowYakiChest] = useState(false);

  const saveOption = () => {
    localStorage.setItem(
      "comment-with-suffix",
      JSON.stringify({ keep_suffix: !isSave })
    );
    setIsSave(!isSave);
  };

  useEffect(() => {
    setTempUserRelays(nostrUser.relays);
    setLud06(nostrUserAbout.lud06);
    setLud16(nostrUserAbout.lud16);
    setUserNIP05(nostrUser.nip05);
  }, [nostrUser]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       let author = await pool.get([...relaysOnPlatform], {
  //         kinds: [0],
  //         authors: [nostrKeys.pub],
  //       });
  //       if (author) setNostrUserData(author);
  //       setIsLoading(false);
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   };
  //   if (!timestamp) return;
  //   fetchData();
  // }, [timestamp]);

  const updateInfos = async () => {
    let content = { ...nostrUserAbout };
    content.name = userName !== false ? userName : content.name;
    content.display_name = userName !== false ? userName : content.name;
    content.about = userAbout !== false ? userAbout : content.about || "";
    content.nip05 = userNIP05 !== false ? userNIP05 : content.nip05 || "";

    if (isPublishing) {
      setToast({
        type: 3,
        desc: "An event publishing is in process!",
      });
      return;
    }
    // setIsLoading(true);

    setToPublish({
      nostrKeys: nostrKeys,
      kind: 0,
      content: JSON.stringify(content),
      tags: nostrUserTags || [],
      allRelays: [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
    });

    setUserAbout(false);
    setUserName(false);
    setSelectedTab("");
    // setIsLoading(false);
    // setTimestamp(new Date().getTime());
    setNostrUserAbout(content);
  };

  const copyKey = (keyType, key) => {
    navigator.clipboard.writeText(key);
    setToast({
      type: 1,
      desc: `${keyType} key was copied! 👏`,
    });
  };

  const removeRelayFromList = (index) => {
    let tempArray = Array.from(tempUserRelays);
    tempArray.splice(index, 1);
    setTempUserRelays(tempArray);
  };

  const saveRelays = async () => {
    if (isPublishing) {
      setToast({
        type: 3,
        desc: "An event publishing is in process!",
      });
      return;
    }
    saveInKind10002()
    setSelectedTab("");
  };

  const saveInKind10002 = async () => {
    try {
      let tags = convertArrayToKind10002();
      setToPublish({
        nostrKeys: nostrKeys,
        kind: 10002,
        content: "",
        tags: tags,
        allRelays: [...filterRelays(relaysOnPlatform, nostrUser.relays)],
      });
      let tempUser = { ...nostrUser };
      tempUser.relays = tempUserRelays;
      setNostrUser(tempUser);

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const convertArrayToKind10002 = () => {
    let tempArray = [];
    for (let relay of tempUserRelays) {
      tempArray.push(["r", relay]);
    }
    return tempArray;
  };

  const uploadCover = async (upload = false, file) => {
    if (isPublishing) {
      setToast({
        type: 3,
        desc: "An event publishing is in process!",
      });
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
          fd.append("pubkey", nostrKeys.pub);
          let data = await axiosInstance.post("/api/v1/file-upload", fd, {
            headers: { "Content-Type": "multipart/formdata" },
          });
          uploadedImage = data.data.image_path;
          content = getUserContent(data.data.image_path);
          deleteFromS3(nostrUserAbout.banner);
        }

        setToPublish({
          nostrKeys: nostrKeys,
          kind: 0,
          content,
          tags: nostrUserTags,
          allRelays: [...filterRelays(relaysOnPlatform, nostrUser.relays)],
        });

        setNostrUserAbout(JSON.parse(content));
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        console.log(err);
        setToast({
          type: 2,
          desc: `The image size exceeded the required limit, the max size allowed is 1Mb.`,
        });
      }
    }
  };

  const clearCover = async () => {
    if (isPublishing) {
      setToast({
        type: 3,
        desc: "An event publishing is in process!",
      });
      return;
    }
    try {
      setIsLoading(true);
      const content = getUserContent("");
      setToPublish({
        nostrKeys: nostrKeys,
        kind: 0,
        content,
        tags: nostrUserTags,
        allRelays: [...filterRelays(relaysOnPlatform, nostrUser.relays)],
      });

      deleteFromS3(nostrUserAbout.banner);
      setIsLoading(false);
      setNostrUserAbout(JSON.parse(content));
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  };
  const getUserContent = (banner) => {
    let content = {
      ...nostrUserAbout,
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

  const handleLUD16 = async (e) => {
    let add = e.target.value;
    let tempAdd = encodeLud06(decodeUrlOrAddress(add));
    setLud16(add);
    if (!tempAdd) setLud06("");
    if (tempAdd) {
      let data = await axios.get(decodeUrlOrAddress(add));

      setLud16(JSON.parse(data.data.metadata)[0][1]);
      setLud06(tempAdd);
    }
  };

  const updateLightning = async () => {
    if (isPublishing) {
      setToast({
        type: 3,
        desc: "An event publishing is in process!",
      });
      return;
    }
    if (!(lud06 && lud16)) return;
    let content = { ...nostrUserAbout };
    content.lud06 = lud06;
    content.lud16 = lud16;
    // setIsLoading(true);
    // let updateUser = await publishPost(
    //   nostrKeys,
    //   0,
    //   JSON.stringify(content),
    //   nostrUserTags,
    //   relaysOnPlatform
    // );
    setToPublish({
      nostrKeys: nostrKeys,
      kind: 0,
      content: JSON.stringify(content),
      tags: nostrUserTags,
      allRelays: [...filterRelays(relaysOnPlatform, nostrUser.relays)],
    });
    setNostrUserAbout(content);
    setSelectedTab("");
    // setIsLoading(true);
    // setTimestamp(new Date().getTime());
  };

  if (!nostrUserLoaded) return <LoadingScreen />;

  return (
    <>
      {showYakiChest && <LoginWithAPI exit={() => setShowYakiChest(false)} />}
      {showCoverUploader && (
        <CoverUploader
          exit={() => setCoverUploader(false)}
          oldThumbnail={nostrUserAbout.banner}
          uploadCover={uploadCover}
        />
      )}
      {showRelaysUpdater && (
        <ToUpdateRelay
          exit={() => {
            setShowRelaysUpdater(false);
            setSelectedTab("");
          }}
          exitAndRefresh={() => {
            setTimestamp(new Date().getTime());
            setShowRelaysUpdater(false);
            selectedTab("");
          }}
        />
      )}
      {showProfilePicChanger && (
        <ToChangeProfilePic
          cancel={() => setShowProfilePicChanger(false)}
          exit={() => {
            // setIsLoading(true);
            setShowProfilePicChanger(false);
            // setTimestamp(new Date().getTime());
          }}
        />
      )}
      {showTopicsPicker && (
        <TopicTagsSelection exit={() => setShowTopicsPicker(false)} />
      )}
      {showMutedList && <MutedList exit={() => setShowMutedList(false)} />}
      <div>
        <Helmet>
          <title>Yakihonne | Settings</title>
        </Helmet>
        <div className="fit-container fx-centered" style={{ columnGap: 0 }}>
          <SidebarNOSTR />
          <main
            className={`main-page-nostr-container ${isLoading ? "flash" : ""}`}
            style={{
              pointerEvents: isLoading ? "none" : "auto",
              paddingBottom: "3rem",
            }}
          >
            <div className="fx-centered fit-container fx-start-h fx-start-v">
              <div style={{ width: "min(100%,700px)" }}>
                {nostrUser && (nostrKeys.sec || nostrKeys.ext) && (
                  <>
                    <div className="fit-container fx-centered fx-col">
                      <div
                        className="fit-container profile-cover fx-centered fx-end-h fx-col bg-img cover-bg"
                        style={{
                          height: "20vh",
                          position: "relative",
                          backgroundImage: nostrUserAbout.banner
                            ? `url(${nostrUserAbout.banner})`
                            : "",
                        }}
                      >
                        {nostrUserAbout.banner && (
                          <div
                            className="fx-centered pointer"
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "var(--border-r-50)",
                              backgroundColor: "var(--dim-gray)",
                              position: "absolute",
                              right: "24px",
                              top: "24px",
                            }}
                            onClick={clearCover}
                          >
                            <div className="trash-24"></div>
                          </div>
                        )}
                      </div>
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
                          <UserProfilePicNOSTR
                            img={nostrUserAbout.picture}
                            size={120}
                            ring={false}
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
                        </div>
                        <div className="box-pad-v-s fx-centered fx-col fit-container">
                          {userName === false && (
                            <>
                              <p className="gray-c">
                                <Date_ toConvert={nostrUser.added_date} />
                              </p>
                            </>
                          )}
                          <div
                            className="fx-centered"
                            style={{ columnGap: "10px" }}
                          >
                            {userName !== false ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  updateInfos();
                                }}
                                className="fit-container fx-centered"
                              >
                                <input
                                  className="if"
                                  placeholder="your name"
                                  value={userName}
                                  onChange={(e) => setUserName(e.target.value)}
                                />
                                <div
                                  className="send-24"
                                  role="submit"
                                  onClick={updateInfos}
                                ></div>
                                <div
                                  className="cancel-24"
                                  onClick={() => setUserName(false)}
                                ></div>
                              </form>
                            ) : (
                              <>
                                <h3>{nostrUserAbout.name}</h3>
                                {!nostrUserAbout.name && (
                                  <span className="gray-c italic-txt">
                                    Name yourself
                                  </span>
                                )}
                                <div
                                  className="edit-24"
                                  onClick={() =>
                                    setUserName(nostrUserAbout.name)
                                  }
                                ></div>
                              </>
                            )}
                          </div>
                          <div
                            className="fx-centered fit-container"
                            style={{ columnGap: "10px" }}
                          >
                            {userAbout !== false ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  updateInfos();
                                }}
                                className="fit-container fx-centered fx-col"
                              >
                                <textarea
                                  className="txt-area box-pad-v-m ifs-full"
                                  placeholder="About"
                                  rows={20}
                                  value={userAbout}
                                  onChange={(e) => setUserAbout(e.target.value)}
                                  style={{ maxWidth: "400px" }}
                                />
                                <div className="fx-centered">
                                  <div
                                    className="send-24"
                                    role="submit"
                                    onClick={updateInfos}
                                  ></div>
                                  <div
                                    className="cancel-24"
                                    onClick={() => setUserAbout(false)}
                                  ></div>
                                </div>
                              </form>
                            ) : (
                              <>
                                <p
                                  style={{ maxWidth: "400px" }}
                                  className="p-centered"
                                >
                                  {nostrUserAbout.about || (
                                    <span className="gray-c italic-txt">
                                      About yourself
                                    </span>
                                  )}
                                </p>
                                <div
                                  className="edit-24"
                                  onClick={() =>
                                    setUserAbout(nostrUserAbout.about)
                                  }
                                ></div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          columnGap: "5px",
                          position: "absolute",
                          left: "24px",
                          top: "24px",
                          width: "130px",
                        }}
                        className="pointer"
                      >
                        <div
                          className="fit-container sticker sticker-gray-black"
                          style={{ columnGap: "5px" }}
                          onClick={() => setCoverUploader(true)}
                        >
                          {isLoading ? (
                            <LoadingDots />
                          ) : (
                            <>
                              <p>+</p>
                              <p className="p-medium">Upload cover</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="fit-container fx-centered box-pad-v box-pad-h-m">
                      <div className="fit-container fx-centered fx-col">
                        <div className="fit-container sc-s-18 fx-scattered fx-col pointer">
                          <div
                            className="fx-scattered fit-container  box-pad-h-m box-pad-v-m "
                            onClick={() =>
                              selectedTab === "keys"
                                ? setSelectedTab("")
                                : setSelectedTab("keys")
                            }
                          >
                            <div className="fx-centered fx-start-h">
                              <div className="key-icon-24"></div>
                              <p>Your keys</p>
                            </div>
                            <div className="arrow"></div>
                          </div>
                          <hr />
                          {selectedTab === "keys" && (
                            <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
                              <p className="c1-c p-left fit-container">
                                Your secret key
                              </p>
                              <div
                                className={`fx-scattered if pointer fit-container ${
                                  nostrKeys.sec ? "dashed-onH" : "if-disabled"
                                }`}
                                style={{ borderStyle: "dashed" }}
                                onClick={() =>
                                  nostrKeys.sec
                                    ? copyKey(
                                        "Private",
                                        getBech32("nsec", nostrKeys.sec)
                                      )
                                    : null
                                }
                              >
                                <p>
                                  {nostrKeys.sec ? (
                                    shortenKey(getBech32("nsec", nostrKeys.sec))
                                  ) : (
                                    <span className="italic-txt gray-c">
                                      {nostrKeys.ext
                                        ? "check your extension settings"
                                        : "No secret key is provided"}
                                    </span>
                                  )}
                                </p>
                                {nostrKeys.sec && (
                                  <div className="copy-24"></div>
                                )}
                              </div>
                              <p className="c1-c p-left fit-container">
                                Your public key
                              </p>
                              <div
                                className="fx-scattered if pointer dashed-onH fit-container"
                                style={{ borderStyle: "dashed" }}
                                onClick={() =>
                                  copyKey(
                                    "Public",
                                    getBech32("npub", nostrKeys.pub)
                                  )
                                }
                              >
                                <p>
                                  {shortenKey(getBech32("npub", nostrKeys.pub))}
                                </p>
                                <div className="copy-24"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="fit-container sc-s-18 fx-scattered fx-col pointer">
                          <div
                            className="fx-scattered fit-container box-pad-h-m box-pad-v-m "
                            onClick={() =>
                              selectedTab === "relays"
                                ? setSelectedTab("")
                                : setSelectedTab("relays")
                            }
                          >
                            <div className="fx-centered fx-start-h">
                              <div className="server-24"></div>
                              <p>Relays settings</p>
                            </div>
                            <div className="arrow"></div>
                          </div>
                          <hr />
                          {selectedTab === "relays" && (
                            <>
                              <div
                                className="fit-container fx-col fx-centered  fx-start-v box-pad-h-m box-pad-v-m fx-start-h"
                                style={{
                                  maxHeight: "40vh",
                                  overflow: "scroll",
                                  overflowX: "hidden",
                                }}
                              >
                                {/* {relaysOnPlatform.map((relay, index) => {
                            return (
                              <div
                                key={`${relay}-${index}`}
                                className="if fit-container fx-centered  fx-start-h if-disabled fx-shrink"
                              >
                                <p className="c1-c">{relay}</p>
                              </div>
                            );
                          })} */}
                                {tempUserRelays?.map((relay, index) => {
                                  if (index < relaysOnPlatform.length)
                                    return (
                                      <div
                                        key={`${relay}-${index}`}
                                        className="if fit-container fx-centered  fx-start-h if-disabled fx-shrink"
                                      >
                                        <p className="c1-c">{relay}</p>
                                      </div>
                                    );
                                  return (
                                    <div
                                      key={`${relay}-${index}`}
                                      className="if fit-container fx-scattered fx-shrink"
                                    >
                                      <p>{relay}</p>
                                      <div
                                        onClick={() =>
                                          removeRelayFromList(index)
                                        }
                                      >
                                        <div className="trash"></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="fx-centered fx-end-h fit-container box-pad-h box-marg-s">
                                <button
                                  className="btn btn-gst"
                                  onClick={() => setShowRelaysUpdater(true)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? <LoadingDots /> : "Add relay"}
                                </button>
                                <button
                                  className={`btn ${
                                    Object.entries(nostrUser.relays).length !==
                                    tempUserRelays.length
                                      ? "btn-normal"
                                      : "btn-disabled"
                                  }`}
                                  onClick={saveRelays}
                                  disabled={
                                    !(
                                      Object.entries(nostrUser.relays)
                                        .length !== tempUserRelays.length
                                    ) || isLoading
                                  }
                                >
                                  {isLoading ? <LoadingDots /> : "Save"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="fit-container sc-s-18 fx-scattered fx-col pointer">
                          <div
                            className="fx-scattered fit-container  box-pad-h-m box-pad-v-m "
                            onClick={() =>
                              selectedTab === "nip05"
                                ? setSelectedTab("")
                                : setSelectedTab("nip05")
                            }
                          >
                            <div className="fx-centered fx-start-h">
                              <div className="nip05-24"></div>
                              <p>NIP-05 address</p>
                            </div>
                            <div className="arrow"></div>
                          </div>
                          <hr />

                          {selectedTab === "nip05" && (
                            <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
                              <p className="gray-c p-medium fit-container p-left">
                                NIP-05
                              </p>
                              <input
                                type="text"
                                className="if ifs-full"
                                value={userNIP05}
                                onChange={(e) => setUserNIP05(e.target.value)}
                                placeholder={"Enter your NIP-05 address"}
                              />

                              <div className="fit-container fx-centered fx-end-h">
                                <button
                                  className="btn btn-normal"
                                  onClick={updateInfos}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="fit-container sc-s-18 fx-scattered fx-col pointer">
                          <div
                            className="fx-scattered fit-container  box-pad-h-m box-pad-v-m "
                            onClick={() =>
                              selectedTab === "moderation"
                                ? setSelectedTab("")
                                : setSelectedTab("moderation")
                            }
                          >
                            <div className="fx-centered fx-start-h">
                              <div className="content-s-24"></div>
                              <p>Content moderation</p>
                            </div>
                            <div className="arrow"></div>
                          </div>
                          <hr />
                          {selectedTab === "moderation" && (
                            <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
                              <div className="fx-scattered fit-container">
                                <p>Topics customization</p>
                                <div
                                  className="btn-text-gray"
                                  style={{ marginRight: ".75rem" }}
                                  onClick={() => setShowTopicsPicker(true)}
                                >
                                  Edit
                                </div>
                              </div>
                              <hr style={{ margin: ".5rem" }} />
                              <div className="fx-scattered fit-container">
                                <p>Muted list</p>
                                <div
                                  className="btn-text-gray"
                                  style={{ marginRight: ".75rem" }}
                                  onClick={() => setShowMutedList(true)}
                                >
                                  Edit
                                </div>
                              </div>
                              <hr style={{ margin: ".5rem" }} />
                              <div className="fx-scattered fit-container">
                                <p>Crossposting comments suffix</p>
                                <div
                                  className={`toggle ${
                                    isSave === -1 ? "toggle-dim-gray" : ""
                                  } ${
                                    isSave !== -1 && isSave
                                      ? "toggle-c1"
                                      : "toggle-dim-gray"
                                  }`}
                                  onClick={saveOption}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="fit-container sc-s-18 fx-scattered fx-col pointer">
                          <div
                            className="fx-scattered fit-container  box-pad-h-m box-pad-v-m "
                            onClick={() =>
                              selectedTab === "lnurls"
                                ? setSelectedTab("")
                                : setSelectedTab("lnurls")
                            }
                          >
                            <div className="fx-centered fx-start-h">
                              <div className="lightning"></div>
                              <p>Lightning addresses</p>
                            </div>
                            <div className="arrow"></div>
                          </div>
                          <hr />

                          {selectedTab === "lnurls" && (
                            <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
                              <p className="gray-c p-medium fit-container p-left">
                                LUD-16
                              </p>
                              <input
                                type="text"
                                className="if ifs-full"
                                value={lud16}
                                onChange={handleLUD16}
                                placeholder={
                                  "Enter your address LUD-06 or LUD-16"
                                }
                              />
                              <p className="gray-c p-medium fit-container p-left">
                                LUD-06
                              </p>
                              <input
                                type="text"
                                className="if if-disabled ifs-full"
                                value={lud06}
                                placeholder={"-"}
                                disabled
                                onChange={null}
                              />
                              {((nostrUserAbout.lud16 !== lud16 && lud06) ||
                                !lud16) && (
                                <div className="fit-container fx-centered fx-end-h">
                                  <button
                                    className="btn btn-normal"
                                    onClick={updateLightning}
                                  >
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="fit-container sc-s-18 fx-scattered box-pad-h-m box-pad-v-m pointer">
                          <div className="fx-centered fx-start-h">
                            <div className="cup-24"></div>
                            <p>Yaki chest</p>
                          </div>
                          {yakiChestStats && isYakiChestLoaded && (
                            <div className="fx-centered">
                              <p className="green-c p-medium">Connected</p>
                              <div
                                style={{
                                  minWidth: "8px",
                                  aspectRatio: "1/1",
                                  backgroundColor: "var(--green-main)",
                                  borderRadius: "var(--border-r-50)",
                                }}
                              ></div>
                            </div>
                          )}
                          {!yakiChestStats && isYakiChestLoaded && (
                            <div className="fx-centered">
                              <button
                                className="btn btn-small btn-normal"
                                onClick={() => setShowYakiChest(true)}
                              >
                                Connect
                              </button>
                            </div>
                          )}
                          {!isYakiChestLoaded && (
                            <div className="fx-centered">
                              <LoadingDots />
                            </div>
                          )}
                        </div>
                        <div
                          className="fit-container sc-s-18 fx-scattered box-pad-h-m box-pad-v-m pointer"
                          onClick={nostrUserLogout}
                        >
                          <div className="fx-centered fx-start-h">
                            <div className="logout-24"></div>
                            <p>Logout</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {nostrUser && !nostrKeys.sec && !nostrKeys.ext && (
                  <PagePlaceholder page={"nostr-unauthorized"} />
                )}
                {!nostrUser && <PagePlaceholder page={"nostr-not-connected"} />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

const MutedList = ({ exit }) => {
  const {
    nostrUser,
    nostrKeys,
    mutedList,
    isPublishing,
    setToast,
    setToPublish,
  } = useContext(Context);
  const muteUnmute = async (index) => {
    try {
      if (isPublishing) {
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        });
        return;
      }

      let tempTags = Array.from(mutedList.map((pubkey) => ["p", pubkey]));

      tempTags.splice(index, 1);

      setToPublish({
        nostrKeys: nostrKeys,
        kind: 10000,
        content: "",
        tags: tempTags,
        allRelays: [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
      });
    } catch (err) {
      console.log(err);
    }
  };
  if (!Array.isArray(mutedList)) return;
  return (
    <div className="fixed-container box-pad-h fx-centered">
      <div
        className="box-pad-h box-pad-v sc-s-18"
        style={{ width: "min(100%, 500px)", position: "relative" }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        {mutedList.length > 0 && (
          <h4 className="p-centered box-marg-s">Muted list</h4>
        )}
        {mutedList.length > 0 && (
          <div
            className="fit-container fx-centered fx-col fx-start-v fx-start-h"
            style={{ maxHeight: "40vh", overflow: "scroll" }}
          >
            {mutedList.map((pubkey, index) => {
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
        {mutedList.length === 0 && (
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
  const { setToast } = useContext(Context);
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailPrev, setThumbnailPrev] = useState(oldThumbnail || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(oldThumbnail || "");

  const handleImageUpload = (e) => {
    let file = e.target.files[0];
    if (file && !file.type.includes("image/")) {
      setToast({
        type: 2,
        desc: "Image type is unsupported!",
      });
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
