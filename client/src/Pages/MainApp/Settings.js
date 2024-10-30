import React, { useEffect, useMemo, useRef, useState } from "react";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import PagePlaceholder from "../../Components/PagePlaceholder";
import LoadingDots from "../../Components/LoadingDots";
import axiosInstance from "../../Helpers/HTTP_Client";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import {
  decodeUrlOrAddress,
  encodeLud06,
  getBech32,
  getEmptyuserMetadata,
} from "../../Helpers/Encryptions";
import ToChangeProfilePic from "../../Components/Main/ToChangeProfilePic";
import { shortenKey } from "../../Helpers/Encryptions";
import ToUpdateRelay from "../../Components/Main/ToUpdateRelay";
import axios from "axios";
import { Helmet } from "react-helmet";
import Footer from "../../Components/Footer";
import NProfilePreviewer from "../../Components/Main/NProfilePreviewer";
import LoginWithAPI from "../../Components/Main/LoginWithAPI";
import AddWallet from "../../Components/Main/AddWallet";
import SearchbarNOSTR from "../../Components/Main/SearchbarNOSTR";
import { getWallets, updateWallets } from "../../Helpers/Helpers";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { getUser, userLogout } from "../../Helpers/Controlers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { Link } from "react-router-dom";
import DtoLToggleButton from "../../Components/DtoLToggleButton";
import ZapTip from "../../Components/Main/ZapTip";
import { nip19 } from "nostr-tools";

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

export default function Settings() {
  const dispatch = useDispatch();
  const userMetadata = useSelector((state) => state.userMetadata);
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const userAllRelays = useSelector((state) => state.userAllRelays);
  const isPublishing = useSelector((state) => state.isPublishing);
  const isYakiChestLoaded = useSelector((state) => state.isYakiChestLoaded);
  const yakiChestStats = useSelector((state) => state.yakiChestStats);

  const relaysContainer = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showRelaysInfo, setShowRelaysInfo] = useState(false);
  const [allRelays, setAllRelays] = useState([]);
  const [timestamp, setTimestamp] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState(false);
  const [userName, setUserName] = useState(false);
  const [userAbout, setUserAbout] = useState(false);
  const [userWebsite, setUserWebsite] = useState(false);
  const [userNIP05, setUserNIP05] = useState(false);
  const [isOnEdit, setIsOnEdit] = useState(false);
  const [showProfilePicChanger, setShowProfilePicChanger] = useState(false);
  const [showRelaysUpdater, setShowRelaysUpdater] = useState(false);
  const [showCoverUploader, setCoverUploader] = useState(false);
  const [showTopicsPicker, setShowTopicsPicker] = useState(false);
  const [showMutedList, setShowMutedList] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  const [tempUserRelays, setTempUserRelays] = useState([]);
  const [relaysStatus, setRelaysStatus] = useState([]);
  const [lud06, setLud06] = useState("");
  const [lud16, setLud16] = useState("");
  const [isSave, setIsSave] = useState(checkForSavedCommentOptions());
  const [showYakiChest, setShowYakiChest] = useState(false);
  const [wallets, setWallets] = useState(getWallets());
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showDeletionPopup, setShowDeletionPopup] = useState(false);
  const extrasRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await axios.get("https://api.nostr.watch/v1/online");
        setAllRelays(data.data);
      } catch {}
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (userKeys) {
      handleAddWallet();
    } else setWallets([]);
  }, [userKeys]);

  useEffect(() => {
    setTempUserRelays(userAllRelays);
    setRelaysStatus(
      userAllRelays.map((item) => {
        return { url: item.url, connected: false };
      })
    );
  }, [userRelays]);

  useEffect(() => {
    setLud06(userMetadata.lud06);
    setLud16(userMetadata.lud16);
    setUserNIP05(userMetadata.nip05);
  }, [userMetadata]);

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

  const copyKey = (keyType, key) => {
    navigator.clipboard.writeText(key);
    dispatch(
      setToast({
        type: 1,
        desc: `${keyType} key was copied! 👏`,
      })
    );
  };

  const removeRelayFromList = (action, index) => {
    let tempArray = tempUserRelays.map((relay) => ({ ...relay }));
    if (action) {
      delete tempArray[index].toDelete;
      setTempUserRelays(tempArray);
    } else {
      tempArray[index].toDelete = true;
      setTempUserRelays(tempArray);
    }
  };

  const saveRelays = async () => {
    if (isPublishing) {
      dispatch(
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        })
      );
      return;
    }
    saveInKind10002();
    setSelectedTab("");
  };

  const saveInKind10002 = async () => {
    try {
      let tags = convertArrayToKind10002();
      dispatch(
        setToPublish({
          userKeys: userKeys,
          kind: 10002,
          content: "",
          tags: tags,
          allRelays: tempUserRelays
            .filter((relay) => relay.write)
            .map((relay) => relay.url),
        })
      );
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const convertArrayToKind10002 = () => {
    let tempArray = [];
    for (let relay of tempUserRelays) {
      if (!relay.toDelete) {
        let status =
          relay.read && relay.write ? "" : relay.read ? "read" : "write";
        if (status) tempArray.push(["r", relay.url, status]);
        if (!status) tempArray.push(["r", relay.url]);
      }
    }
    return tempArray;
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

  const handleDelete = () => {
    try {
      let tempWallets = wallets.filter(
        (wallet) => wallet.id !== showDeletionPopup.id
      );
      if (tempWallets.length > 0 && showDeletionPopup.active) {
        tempWallets[0].active = true;
        setWallets(tempWallets);
        setShowDeletionPopup(false);
        updateWallets(tempWallets);
        return;
      }

      setWallets(tempWallets);
      setShowDeletionPopup(false);
      updateWallets(tempWallets);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSelectWallet = (walletID) => {
    let index = wallets.findIndex((wallet) => wallet.id == walletID);

    let tempWallets = Array.from(wallets);
    tempWallets = tempWallets.map((wallet) => {
      let w = { ...wallet };
      w.active = false;
      return w;
    });
    tempWallets[index].active = true;
    updateWallets(tempWallets);
    setWallets(tempWallets);
  };

  const changeRelayStatus = (status, index) => {
    let tempArray = tempUserRelays.map((relay) => ({ ...relay }));
    tempArray[index].read = ["read", ""].includes(status) ? true : false;
    tempArray[index].write = ["write", ""].includes(status) ? true : false;

    setTempUserRelays(tempArray);
  };

  const addRelay = (url) => {
    setTempUserRelays((prev) => {
      let isThere = prev.find((relay) => relay.url === url);
      if (!isThere) return [...prev, { url, read: true, write: true }];
      return prev;
    });
    let timeout = setTimeout(() => {
      if (relaysContainer.current) {
        relaysContainer.current.scrollTop =
          relaysContainer.current.scrollHeight;
      }
      clearTimeout(timeout);
    }, 50);
  };

  let handleAddWallet = () => {
    let tempWallets = getWallets();
    setWallets(tempWallets);
    setShowAddWallet(false);
  };

  return (
    <>
      {showYakiChest && <LoginWithAPI exit={() => setShowYakiChest(false)} />}
      {showAddWallet && <AddWallet exit={() => setShowAddWallet(false)} refresh={handleAddWallet}/>}
      {showRelaysInfo && (
        <RelaysInfo
          url={showRelaysInfo}
          exit={() => setShowRelaysInfo(false)}
        />
      )}
      {showDeletionPopup && (
        <DeletionPopUp
          exit={() => setShowDeletionPopup(false)}
          handleDelete={handleDelete}
        />
      )}
      {showCoverUploader && (
        <CoverUploader
          exit={() => setCoverUploader(false)}
          oldThumbnail={userMetadata.banner}
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
            setShowProfilePicChanger(false);
          }}
        />
      )}
      {showMutedList && <MutedList exit={() => setShowMutedList(false)} />}
      <div>
        <Helmet>
          <title>Yakihonne | Settings</title>
        </Helmet>
        <div className="fit-container fx-centered" style={{ columnGap: 0 }}>
          <div className="main-container">
            <SidebarNOSTR />
            <main
              className={`main-page-nostr-container ${
                isLoading ? "flash" : ""
              }`}
              style={{
                pointerEvents: isLoading ? "none" : "auto",
              }}
            >
              <div className="fx-centered fit-container  fx-start-v ">
                <div className="main-middle">
                  {userMetadata && (userKeys.sec || userKeys.ext) && (
                    <>
                      <h3 className="box-pad-h box-pad-v-m">Settings</h3>
                      <div
                        className="fit-container fx-scattered pointer box-pad-v-m box-pad-h-m"
                        style={{
                          borderBottom: "1px solid var(--very-dim-gray)",
                          borderTop: "1px solid var(--very-dim-gray)",
                        }}
                      >
                        <UserProfilePicNOSTR
                          mainAccountUser={true}
                          size={64}
                          ring={false}
                        />
                        <div className="fx-centered">
                          <Link
                            to={`/users/${nip19.nprofileEncode({
                              pubkey: userKeys.pub,
                            })}`}
                          >
                            <button className="btn btn-normal">
                              view profile
                            </button>
                          </Link>
                          <Link to={"/settings/profile"}>
                            <button className="btn btn-gray">
                              Edit profile
                            </button>
                          </Link>
                        </div>
                      </div>
                      <div
                        className="fit-container fx-centered fx-col"
                        style={{ gap: 0 }}
                      >
                        <div
                          className="fit-container fx-scattered fx-col pointer"
                          style={{
                            borderBottom: "1px solid var(--very-dim-gray)",
                            gap: 0,
                          }}
                        >
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
                                  userKeys.sec ? "dashed-onH" : "if-disabled"
                                }`}
                                style={{ borderStyle: "dashed" }}
                                onClick={() =>
                                  userKeys.sec
                                    ? copyKey(
                                        "Private",
                                        getBech32("nsec", userKeys.sec)
                                      )
                                    : null
                                }
                              >
                                <p>
                                  {userKeys.sec ? (
                                    shortenKey(getBech32("nsec", userKeys.sec))
                                  ) : (
                                    <span className="italic-txt gray-c">
                                      {userKeys.ext
                                        ? "check your extension settings"
                                        : "No secret key is provided"}
                                    </span>
                                  )}
                                </p>
                                {userKeys.sec && (
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
                                    getBech32("npub", userKeys.pub)
                                  )
                                }
                              >
                                <p>
                                  {shortenKey(getBech32("npub", userKeys.pub))}
                                </p>
                                <div className="copy-24"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          className="fit-container fx-scattered fx-col pointer"
                          style={{
                            overflow: "visible",
                            borderBottom: "1px solid var(--very-dim-gray)",
                            gap: 0,
                          }}
                        >
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

                          {selectedTab === "relays" && (
                            <>
                              {tempUserRelays.length > 0 && (
                                <div
                                  className="fit-container fx-col fx-centered  fx-start-v fx-start-h"
                                  style={{
                                    maxHeight: "40vh",
                                    overflow: "scroll",
                                    overflowX: "hidden",
                                    gap: 0,
                                  }}
                                  ref={relaysContainer}
                                >
                                  {tempUserRelays?.map((relay, index) => {
                                    let status =
                                      relay.read && relay.write
                                        ? ""
                                        : relay.read
                                        ? "read"
                                        : "write";
                                    return (
                                      <div
                                        key={`${relay}-${index}`}
                                        className="fit-container fx-centered fx-col fx-shrink box-pad-v-s box-pad-h-s"
                                        style={{
                                          overflow: "visible",
                                          backgroundColor: relay.toDelete
                                            ? "var(--red-side)"
                                            : "",
                                          borderBottom:
                                            "1px solid var(--very-dim-gray)",
                                          gap: 0,
                                        }}
                                      >
                                        <div className="fx-scattered fit-container box-pad-h-s box-pad-v-s">
                                          <div
                                            className="fx-centered option"
                                            style={{
                                              border: "none",
                                              backgroundColor: "transparent",
                                            }}
                                            onClick={() =>
                                              setShowRelaysInfo(relay.url)
                                            }
                                          >
                                            <RelayImage url={relay.url} />
                                            <p>{relay.url}</p>
                                            <div className="info-tt"></div>
                                          </div>
                                          <div>
                                            {!relay.toDelete && (
                                              <div
                                                onClick={() =>
                                                  removeRelayFromList(
                                                    false,
                                                    index
                                                  )
                                                }
                                                className="round-icon-small"
                                              >
                                                <div className="trash"></div>
                                              </div>
                                            )}
                                            {relay.toDelete && (
                                              <div
                                                onClick={() =>
                                                  removeRelayFromList(
                                                    true,
                                                    index
                                                  )
                                                }
                                                className="round-icon-small"
                                              >
                                                <div className="switch-arrows"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="fit-container fx-centered fx-start-h box-pad-h-m box-marg-s">
                                          <button
                                            className={`btn btn-small ${
                                              status === "read"
                                                ? "btn-normal"
                                                : "btn-gray"
                                            }`}
                                            onClick={() =>
                                              changeRelayStatus("read", index)
                                            }
                                          >
                                            Read only
                                          </button>
                                          <button
                                            className={`btn btn-small ${
                                              status === "write"
                                                ? "btn-normal"
                                                : "btn-gray"
                                            }`}
                                            onClick={() =>
                                              changeRelayStatus("write", index)
                                            }
                                          >
                                            Write only
                                          </button>
                                          <button
                                            className={`btn btn-small ${
                                              status === ""
                                                ? "btn-normal"
                                                : "btn-gray"
                                            }`}
                                            onClick={() =>
                                              changeRelayStatus("", index)
                                            }
                                          >
                                            Read-Write
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              <div className="fx-centered fx-end-h fit-container box-pad-h box-pad-v-s">
                                <AddRelays
                                  allRelays={allRelays}
                                  userAllRelays={tempUserRelays}
                                  addRelay={addRelay}
                                />
                                <button
                                  className={`btn ${
                                    JSON.stringify(userAllRelays) !==
                                    JSON.stringify(tempUserRelays)
                                      ? "btn-normal"
                                      : "btn-disabled"
                                  }`}
                                  onClick={saveRelays}
                                  disabled={
                                    JSON.stringify(userAllRelays) ===
                                      JSON.stringify(tempUserRelays) ||
                                    isLoading
                                  }
                                >
                                  {isLoading ? <LoadingDots /> : "Save"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <div
                          className="fit-container fx-scattered fx-col pointer"
                          style={{
                            borderBottom: "1px solid var(--very-dim-gray)",
                            gap: 0,
                          }}
                        >
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
                          {selectedTab === "moderation" && (
                            <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
                              {/* <div className="fx-scattered fit-container">
                                <p>Topics customization</p>
                                <div
                                  className="btn-text-gray"
                                  style={{ marginRight: ".75rem" }}
                                  onClick={() => setShowTopicsPicker(true)}
                                >
                                  Edit
                                </div>
                              </div> */}
                              {/* <hr style={{ margin: ".5rem" }} /> */}
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
                              {/* <hr style={{ margin: ".5rem" }} />
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
                              </div> */}
                            </div>
                          )}
                        </div>

                        <div
                          className="fit-container fx-scattered fx-col pointer"
                          style={{
                            overflow: "visible",
                            borderBottom: "1px solid var(--very-dim-gray)",
                          }}
                        >
                          <div
                            className="fx-scattered fit-container  box-pad-h-m box-pad-v-m "
                            onClick={() =>
                              selectedTab === "wallets"
                                ? setSelectedTab("")
                                : setSelectedTab("wallets")
                            }
                          >
                            <div className="fx-centered fx-start-h">
                              <div className="wallet-24"></div>
                              <p>Wallets</p>
                            </div>
                            <div className="arrow"></div>
                          </div>
                          <hr />

                          {selectedTab === "wallets" && (
                            <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
                              <div className="fit-container fx-scattered">
                                <div>
                                  <p className="gray-c">Add wallet</p>
                                </div>
                                <div className="fx-centered">
                                  <div
                                    className="round-icon-small round-icon-tooltip"
                                    data-tooltip="Add wallet"
                                    onClick={() => setShowAddWallet(true)}
                                  >
                                    <div
                                      style={{ rotate: "-45deg" }}
                                      className="p-medium"
                                    >
                                      &#10005;
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {wallets.map((wallet) => {
                                return (
                                  <div
                                    className="sc-s-18 box-pad-h-m box-pad-v-m fx-scattered fit-container"
                                    key={wallet.id}
                                    style={{ overflow: "visible" }}
                                  >
                                    <div className="fx-centered">
                                      <div className="fx-centered">
                                        {wallet.kind === 1 && (
                                          <div className="webln-logo-24"></div>
                                        )}
                                        {wallet.kind === 2 && (
                                          <div className="alby-logo-24"></div>
                                        )}
                                        {wallet.kind === 3 && (
                                          <div className="nwc-logo-24"></div>
                                        )}
                                        <p>{wallet.entitle}</p>
                                        {wallet.active && (
                                          <div
                                            style={{
                                              minWidth: "8px",
                                              aspectRatio: "1/1",
                                              backgroundColor:
                                                "var(--green-main)",
                                              borderRadius:
                                                "var(--border-r-50)",
                                            }}
                                          ></div>
                                        )}
                                      </div>
                                      <div className="fx-centered"></div>
                                    </div>
                                    <div className="fx-centered">
                                      {!wallet.active && (
                                        <div
                                          className="round-icon-small round-icon-tooltip"
                                          data-tooltip="Switch wallet"
                                          onClick={() =>
                                            handleSelectWallet(wallet.id)
                                          }
                                        >
                                          <div className="switch-arrows"></div>
                                        </div>
                                      )}
                                      {wallet.kind !== 1 && (
                                        <div
                                          className="round-icon-small round-icon-tooltip"
                                          data-tooltip="Remove wallet"
                                          onClick={() =>
                                            setShowDeletionPopup(wallet)
                                          }
                                        >
                                          <p className="red-c">&minus;</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div
                          className="fit-container fx-scattered fx-col pointer"
                          style={{
                            borderBottom: "1px solid var(--very-dim-gray)",
                            gap: 0,
                          }}
                        >
                          <div
                            className="fx-scattered fit-container  box-pad-h-m box-pad-v-m "
                            onClick={() =>
                              selectedTab === "theme"
                                ? setSelectedTab("")
                                : setSelectedTab("theme")
                            }
                          >
                            <div className="fx-centered fx-start-h">
                              <div className="theme-24"></div>
                              <p>Appearance</p>
                            </div>
                            <div className="arrow"></div>
                          </div>
                          {selectedTab === "theme" && (
                            <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
                              <div className="fx-scattered fit-container">
                                <DtoLToggleButton />
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          className="fit-container fx-scattered box-pad-h-m box-pad-v-m pointer"
                          style={{
                            borderBottom: "1px solid var(--very-dim-gray)",
                          }}
                        >
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
                          className="fit-container fx-scattered box-pad-h-m box-pad-v-m pointer"
                          onClick={userLogout}
                        >
                          <div className="fx-centered fx-start-h">
                            <div className="logout-24"></div>
                            <p>Logout</p>
                          </div>
                        </div>
                        <div
                          className="fit-container fx-centered fx-col"
                          style={{ height: "350px" }}
                        >
                          <div className="yakihonne-logo-128"></div>
                          <p
                            className="p-centered gray-c"
                            style={{ maxWidth: "400px" }}
                          >
                            We strive to make the best out of Nostr, support us
                            below or send us your valuable feedback.
                          </p>
                          <p className="c1-c">
                            v{process.env.REACT_APP_APP_VERSION}
                          </p>
                          <div className="fx-centered">
                            <ZapTip
                              recipientLNURL={process.env.REACT_APP_YAKI_LUD16}
                              recipientPubkey={
                                process.env.REACT_APP_YAKI_PUBKEY
                              }
                              senderPubkey={userKeys.pub}
                              recipientInfo={{
                                name: "Yakihonne",
                                picture:
                                  "https://yakihonne.s3.ap-east-1.amazonaws.com/20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3/files/1691722198488-YAKIHONNES3.png",
                              }}
                            />
                            <a href="mailto:contact@yakihonne.com">
                              <div
                                className="round-icon round-icon-tooltip"
                                data-tooltip="Send us your feedback"
                              >
                                <div className="env"></div>
                              </div>
                            </a>
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
                            onClick={() => setSelectedTab("relays")}
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

const DeletionPopUp = ({ exit, handleDelete }) => {
  return (
    <section className="fixed-container fx-centered box-pad-h">
      <section
        className="fx-centered fx-col sc-s box-pad-h box-pad-v"
        style={{ width: "450px" }}
      >
        <div
          className="fx-centered box-marg-s"
          style={{
            minWidth: "54px",
            minHeight: "54px",
            borderRadius: "var(--border-r-50)",
            backgroundColor: "var(--red-main)",
          }}
        >
          <div className="warning"></div>
        </div>
        <h3 className="p-centered">Delete wallet?</h3>
        <p className="p-centered gray-c box-pad-v-m">
          You're about to delete this wallet, do you wish to proceed?
        </p>
        <div className="fx-centered fit-container">
          <button className="fx btn btn-gst-red" onClick={handleDelete}>
            delete
          </button>
          <button className="fx btn btn-red" onClick={exit}>
            cancel
          </button>
        </div>
      </section>
    </section>
  );
};

const AddRelays = ({ allRelays, userAllRelays, addRelay }) => {
  const [showList, setShowList] = useState(false);
  const [searchedRelay, setSearchedRelay] = useState("");

  const searchedRelays = useMemo(() => {
    let tempRelay = allRelays.filter((relay) => {
      if (
        !userAllRelays.map((_) => _.url).includes(relay) &&
        relay.includes(searchedRelay)
      )
        return relay;
    });
    return tempRelay;
  }, [userAllRelays, searchedRelay, allRelays]);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleOffClick = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target))
        setShowList(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [optionsRef]);

  const handleOnChange = (e) => {
    let value = e.target.value;
    setSearchedRelay(value);
  };

  return (
    <div
      style={{ position: "relative" }}
      className="fit-container"
      ref={optionsRef}
      onClick={() => setShowList(true)}
    >
      <input
        placeholder="Search or add relay"
        className="if ifs-full"
        value={searchedRelay}
        onChange={handleOnChange}
      />
      {showList && (
        <div
          className="fit-container sc-s-18 fx-centered fx-col fx-start-h fx-start-v box-pad-h-m box-pad-v-m"
          style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 5px)",
            maxHeight: "200px",
            overflow: "scroll",
            zIndex: "200",
          }}
        >
          {searchedRelays.map((relay) => {
            return (
              <div
                className="fx-scattered fit-container"
                onClick={() => addRelay(relay)}
              >
                <p>{relay}</p>
                <div className="plus-sign"></div>
              </div>
            );
          })}
          {searchedRelays.length === 0 && searchedRelay && (
            <div
              className="fx-scattered fit-container"
              onClick={() => {
                addRelay("wss://" + searchedRelay.replace("wss://", ""));
                setSearchedRelay("");
              }}
            >
              <p>{searchedRelay}</p>
              <div className="plus-sign"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RelaysInfo = ({ url, exit }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [relayInfo, setRelayInfo] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const info = await axios.get(url.replace("wss", "https"), {
          headers: {
            Accept: "application/nostr+json",
          },
        });

        let owner = info.data.pubkey
          ? getUser(info.data.pubkey) || getEmptyuserMetadata(info.data.pubkey)
          : false;

        setRelayInfo({ ...info.data, owner });
        setIsLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="fixed-container box-pad-h fx-centered">
      <div
        className="sc-s box-pad-h box-pad-v"
        style={{
          width: "min(100%,500px)",
          position: "relative",
        }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        {isLoading && (
          <div
            className="fx-centered fit-container"
            style={{ height: "300px" }}
          >
            <LoadingDots />
          </div>
        )}
        {!isLoading && (
          <div className="fx-centered fx-col">
            <div className="fit-container fx-centered">
              {!relayInfo.icon && <RelayImage url={url} size={64} />}
            </div>
            <h4>{relayInfo.name}</h4>
            <p className="gray-c p-centered">{relayInfo.description}</p>
            <div
              className="box-pad-v fit-container fx-centered fx-col"
              style={{
                borderTop: "1px solid var(--very-dim-gray)",
                borderBottom: "1px solid var(--very-dim-gray)",
              }}
            >
              <div className="fx-scattered fit-container">
                <p>Owner</p>
                <div className="fx-centered">
                  {relayInfo.owner && (
                    <p>
                      {relayInfo.owner.display_name || relayInfo.owner.name}
                    </p>
                  )}
                  {!relayInfo.owner && <p>N/A</p>}
                  {relayInfo.owner && (
                    <UserProfilePicNOSTR
                      img={relayInfo.owner.picture}
                      size={24}
                      mainAccountUser={false}
                      ring={false}
                      user_id={relayInfo.pubkey}
                    />
                  )}
                </div>
              </div>
              <hr />
              <div className="fx-scattered fit-container">
                <p style={{ minWidth: "max-content" }}>Contact</p>
                <p className="p-one-line">{relayInfo.contact || "N/A"}</p>
              </div>
              <hr />
              <div className="fx-scattered fit-container">
                <p>Software</p>
                <p>{relayInfo.software.split("/")[4]}</p>
              </div>
              <hr />
              <div className="fx-scattered fit-container">
                <p>Version</p>
                <p>{relayInfo.version}</p>
              </div>
              <hr />
            </div>
            <div className="box-pad-v-m fx-centered fx-col">
              <p className="gray-c p-centered p-medium box-marg-s">
                Supported nips
              </p>
              <div className="fx-centered fx-wrap ">
                {relayInfo.supported_nips.map((nip) => {
                  return (
                    <div key={nip} className="fx-centered round-icon">
                      {nip}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RelayImage = ({ url, size = 24 }) => {
  return (
    <div
      style={{
        minWidth: `${size}px`,
        aspectRatio: "1/1",
        position: "relative",
      }}
      className="sc-s fx-centered"
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 2,
          backgroundImage: `url(${url.replace(
            "wss://",
            "https://"
          )}/favicon.ico)`,
        }}
        className="bg-img cover-bg  fit-container fit-height"
      ></div>
      <p
        className={`p-bold p-caps ${size > 24 ? "p-big" : ""}`}
        style={{ position: "relative", zIndex: 1 }}
      >
        {url.split(".")[1].charAt(0)}
      </p>
    </div>
  );
};
