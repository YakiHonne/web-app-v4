import React, { useState } from "react";
import DtoLToggleButton from "../DtoLToggleButton";
import UserProfilePic from "./UserProfilePic";
import {
  downloadAsFile,
  getBech32,
  minimizeKey,
} from "../../Helpers/Encryptions";
import { useMemo } from "react";
import NotificationCenter from "./NotificationCenter";
import { useEffect } from "react";
import { useRef } from "react";
import ProgressCirc from "../ProgressCirc";
import LoadingDots from "../LoadingDots";
import LoginWithAPI from "./LoginWithAPI";
import WriteNew from "./WriteNew";
import UserBalance from "./UserBalance";
import NumberShrink from "../NumberShrink";
import {
  getAllWallets,
  getConnectedAccounts,
  getWallets,
  redirectToLogin,
} from "../../Helpers/Helpers";
import { useDispatch, useSelector } from "react-redux";
import {
  handleSwitchAccount,
  logoutAllAccounts,
  userLogout,
} from "../../Helpers/Controlers";
import Publishing from "../Publishing";
import SearchSidebar from "./SearchSidebar";
import { customHistory } from "../../Helpers/History";
import YakiMobileappSidebar from "../YakiMobileappSidebar";
import { useTranslation } from "react-i18next";
import { setToast } from "../../Store/Slides/Publishers";

export default function Sidebar() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const userMetadata = useSelector((state) => state.userMetadata);
  const userKeys = useSelector((state) => state.userKeys);
  const userChatrooms = useSelector((state) => state.userChatrooms);
  const yakiChestStats = useSelector((state) => state.yakiChestStats);
  const isYakiChestLoaded = useSelector((state) => state.isYakiChestLoaded);
  const updatedActionFromYakiChest = useSelector(
    (state) => state.updatedActionFromYakiChest
  );

  const [showConfirmationBox, setShowConfirmationBox] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMyContent, setShowMyContent] = useState(false);
  const [showWritingOptions, setShowWritingOptions] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const settingsRef = useRef(null);
  const myContentRef = useRef(null);
  const mediaRef = useRef(null);
  const writingOptRef = useRef(null);
  const mainFrame = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [showYakiChest, setShowYakiChest] = useState(false);
  const accounts = useMemo(() => {
    return getConnectedAccounts();
  }, [userKeys, userMetadata]);
  const [isAccountSwitching, setIsAccountSwitching] = useState(false);

  const isNewMsg = useMemo(() => {
    return userChatrooms.find((chatroom) => !chatroom.checked);
  }, [userChatrooms]);
  const isPage = (url) => {
    if (url === window.location.pathname) return true;
    return false;
  };

  useEffect(() => {
    const handleOffClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target))
        setShowSettings(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [settingsRef]);

  useEffect(() => {
    let handleOffClick = (e) => {
      if (myContentRef.current && !myContentRef.current.contains(e.target))
        setShowMyContent(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [myContentRef]);

  useEffect(() => {
    let handleOffClick = (e) => {
      if (writingOptRef.current && !writingOptRef.current.contains(e.target))
        setShowWritingOptions(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [writingOptRef]);

  useEffect(() => {
    let handleOffClick = (e) => {
      if (mainFrame.current && !mainFrame.current.contains(e.target))
        setIsActive(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [mainFrame]);

  useEffect(() => {
    let handleOffClick = (e) => {
      if (mediaRef.current && !mediaRef.current.contains(e.target)) {
        setShowMedia(false);
      }
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [mediaRef]);

  const singleLogout = () => {
    let wallets = getWallets();
    let isNWC = wallets.find((_) => _.kind !== 1);

    if (isNWC) {
      setShowConfirmationBox(1);
      return;
    }
    setShowSettings(false);
    userLogout(userKeys.pub);
  };
  const multiLogout = () => {
    let wallets = getAllWallets();
    let isNWCs = wallets.find((_) => _.wallets.find((_) => _.kind !== 1));

    if (isNWCs) {
      setShowConfirmationBox(2);
      return;
    }
    setShowSettings(false);
    logoutAllAccounts();
  };

  const handleLogout = () => {
    if (showConfirmationBox === 1) {
      let wallets = getWallets();
      let NWCs = wallets.filter((_) => _.kind !== 1);
      let toSave = [
        "Important: Store this information securely. If you lose it, recovery may not be possible. Keep it private and protected at all times",
        "---"`Wallets for: ${getBech32("npub", userKeys.pub)}`,
        "-",
        ...NWCs.map((_, index) => {
          return [
            `Address: ${_.entitle}`,
            `NWC secret: ${_.data}`,
            index === NWCs.length - 1 ? "" : "----",
          ];
        }),
      ].flat();
      downloadAsFile(
        toSave.join("\n"),
        "text/plain",
        `NWCs-${userKeys.pub}.txt`,
        t("AIzBCBb")
      );
      setShowSettings(false);
      userLogout(userKeys.pub);
    }
    if (showConfirmationBox === 2) {
      let wallets = getAllWallets();
      wallets = wallets.filter((_) => _.wallets.find((_) => _.kind !== 1));
      let NWCs = wallets.map((_) => {
        return { ..._, wallets: _.wallets.filter((_) => _.kind !== 1) };
      });
      let toSave = NWCs.map((wallet) => {
        return [
          `Wallets for: ${getBech32("npub", wallet.pubkey)}`,
          "-",
          ...wallet.wallets.map((_, index, arr) => {
            return [
              `Address: ${_.entitle}`,
              `NWC secret: ${_.data}`,
              index === arr.length - 1 ? "" : "----",
            ];
          }),
        ].flat();
      })
        .map((_, index, arr) => {
          return [
            ..._,
            index === arr.length - 1
              ? ""
              : "------------------------------------------------------",
            " ",
          ];
        })
        .flat();
      downloadAsFile(
        [
          "Important: Store this information securely. If you lose it, recovery may not be possible. Keep it private and protected at all times",
          "---",
          ...toSave,
        ].join("\n"),
        "text/plain",
        `NWCs-wallets.txt`,
        t("AVUlnek")
      );
      setShowSettings(false);
      logoutAllAccounts();
    }
    setShowConfirmationBox(false);
  };

  return (
    <>
      {showYakiChest && <LoginWithAPI exit={() => setShowYakiChest(false)} />}
      {isAccountSwitching && (
        <AccountSwitching exit={() => setIsAccountSwitching(false)} />
      )}
      {showConfirmationBox && (
        <ConfirmmationBox
          exit={() => setShowConfirmationBox(false)}
          handleOnClick={handleLogout}
        />
      )}
      <div
        className="fx-scattered fx-end-v nostr-sidebar box-pad-v-m fx-col "
        style={{
          zIndex: isActive ? 1000 : 200,
        }}
        onClick={() => setIsActive(true)}
        ref={mainFrame}
      >
        <div
          className="fx-scattered fx-start-v fx-col fit-container"
          style={{ height: "100%" }}
        >
          <div className="fx-start-h fx-centered fx-col fit-container">
            <div className="fx-centered fx-start-h fit-container">
              <div
                className="yakihonne-logo-128"
                onClick={() => customHistory.push("/")}
              ></div>
            </div>
            <div className="mb-show" style={{ height: "200px" }}></div>
            <UserBalance />
            <div
              className="fit-container link-items fx-scattered fx-col fx-start-v "
              style={{ rowGap: 0, maxHeight: "71vh" }}
            >
              <div
                onClick={() => {
                  customHistory.push("/");
                }}
                className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                  isPage("/") ? "active-link" : "inactive-link"
                }`}
              >
                <div className={isPage("/") ? "home-bold-24" : "home-24"}></div>
                <div className="link-label">{t("AJDdA3h")}</div>
              </div>

              <div
                onClick={() => {
                  customHistory.push("/articles");
                }}
                className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                  isPage("/articles") ? "active-link" : "inactive-link"
                }`}
              >
                <div
                  className={isPage("/articles") ? "posts-bold-24" : "posts-24"}
                ></div>
                <div className="link-label">{t("AesMg52")}</div>
              </div>
              <div
                onClick={() => {
                  customHistory.push("/smart-widgets");
                }}
                className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                  isPage("/smart-widgets") ? "active-link" : "inactive-link"
                }`}
              >
                <div
                  className={
                    isPage("/smart-widgets")
                      ? "smart-widget-24"
                      : "smart-widget-24"
                  }
                ></div>
                <div className="link-label">{t("A2mdxcf")}</div>
              </div>
              {/* <div
                onClick={() => customHistory.push("/verify-notes")}
                className={`pointer fit-container fx-start-h fx-centered box-pad-h-s box-pad-v-s ${
                  isPage("/verify-notes") ? "active-link" : "inactive-link"
                }`}
              >
                <div
                  className={
                    isPage("/verify-notes") ? "note-bold-24" : "note-24"
                  }
                ></div>
                <div className="link-label">{t("AltGBkP")}</div>
              </div> */}
              {!(showMedia || showMyContent || showWritingOptions) && (
                <>
                  <div
                    style={{ position: "relative" }}
                    onClick={() => customHistory.push("/messages")}
                    className={`pointer fit-container fx-scattered box-pad-h-s box-pad-v-s ${
                      isPage("/messages") ? "active-link" : "inactive-link"
                    }`}
                  >
                    <div className="fx-centered">
                      <div
                        className={
                          isPage("/messages") ? "env-bold-24" : "env-24"
                        }
                      ></div>
                      <div className="link-label">{t("As2zi6P")}</div>
                    </div>
                    {isNewMsg && <div className="notification-dot"></div>}
                  </div>
                  <NotificationCenter isCurrent={isPage("/notifications")} />
                </>
              )}
              <SearchSidebar />
              {userKeys && (
                <div
                  className="fit-container fx-centered fx-col fx-end-v"
                  style={{
                    position: "relative",
                  }}
                >
                  <div
                    className={`pointer fit-container fx-scattered box-pad-h-s box-pad-v-s ${
                      isPage("/users/" + getBech32("npub", userKeys.pub))
                        ? "active-link"
                        : "inactive-link"
                    }`}
                    onClick={() => {
                      customHistory.push(
                        "/users/" + getBech32("npub", userKeys.pub)
                      );
                    }}
                  >
                    <div className="fx-centered">
                      <div
                        className={
                          isPage("/users/" + getBech32("npub", userKeys.pub))
                            ? "user-bold-24"
                            : "user-24"
                        }
                      ></div>
                      <div className="link-label">{t("AyBBPWE")}</div>
                    </div>
                  </div>
                  <div
                    className={`pointer fit-container fx-scattered box-pad-h-s box-pad-v-s ${
                      isPage("/dashboard") ? "active-link" : "inactive-link"
                    }`}
                    onClick={() => {
                      customHistory.push("/dashboard");
                    }}
                  >
                    <div className="fx-centered">
                      <div
                        className={
                          isPage("/dashboard")
                            ? "dashboard-bold-24"
                            : "dashboard-24"
                        }
                      ></div>
                      <div className="link-label">{t("ALBhi3j")}</div>
                    </div>
                  </div>
                </div>
              )}
              <YakiMobileappSidebar />
              {!userKeys &&
                !(showMedia || showMyContent || showWritingOptions) && (
                  <div>
                    <div className="pointer fx-centered inactive-link">
                      <DtoLToggleButton />
                    </div>
                  </div>
                )}
              <div style={{ height: ".5rem" }}></div>
              {window.location.pathname !== "/dashboard" && (
                <WriteNew exit={() => null} />
              )}
            </div>
            {(showMedia || showMyContent || showWritingOptions) && (
              <div className="fit-container fx-start-h fx-centered box-pad-h-s">
                <div
                  className="fx-centered fx-col round-icon"
                  style={{ rowGap: 0, rotate: "-90deg" }}
                >
                  <p className="gray-c fx-centered" style={{ height: "6px" }}>
                    &#x2022;
                  </p>
                  <p className="gray-c fx-centered" style={{ height: "6px" }}>
                    &#x2022;
                  </p>
                  <p className="gray-c fx-centered" style={{ height: "6px" }}>
                    &#x2022;
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="fit-container">
            <Publishing />
            {userKeys && (
              <div
                className="fx-scattered fx-col fit-container sidebar-user-settings "
                style={{ position: "relative" }}
                ref={settingsRef}
              >
                <div
                  className="fit-container sidebar-user-settings-button"
                  style={{ overflow: "visible", rowGap: "10px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsActive(true);
                    setShowSettings(!showSettings);
                  }}
                >
                  <div
                    className="fx-centered fx-start-h pointer"
                    style={{ columnGap: "16px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsActive(true);
                      setShowSettings(!showSettings);
                    }}
                  >
                    <div className="mb-hide" style={{ pointerEvents: "none" }}>
                      <UserProfilePic
                        size={40}
                        mainAccountUser={true}
                        allowClick={false}
                      />
                    </div>
                    <div className="mb-show" style={{ pointerEvents: "none" }}>
                      <UserProfilePic
                        size={40}
                        mainAccountUser={true}
                        allowClick={false}
                      />
                    </div>
                    <div className="mb-hide">
                      <p className="p-one-line">
                        {userMetadata.display_name ||
                          userMetadata.name ||
                          minimizeKey(userKeys.pub)}
                      </p>
                      <p className="gray-c p-medium p-one-line">
                        @
                        {userMetadata.name ||
                          userMetadata.display_name ||
                          minimizeKey(userKeys.pub)}
                      </p>
                    </div>
                  </div>
                  {isYakiChestLoaded && !yakiChestStats && (
                    <div
                      className="round-icon round-icon-tooltip purple-pulse"
                      data-tooltip={t("ACALoWH")}
                      style={{ minWidth: "40px", minHeight: "40px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowYakiChest(true);
                      }}
                    >
                      <div className="cup"></div>
                    </div>
                  )}
                  {isYakiChestLoaded && yakiChestStats && (
                    <div style={{ position: "relative" }}>
                      {updatedActionFromYakiChest && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            bottom: "calc(100% + 5px)",
                            width: "54px",
                            aspectRatio: "1/1",
                            borderRadius: "var(--border-r-50)",
                            backgroundColor: "var(--c1-side)",
                          }}
                          className="fx-centered slide-up-down"
                        >
                          <p>
                            <NumberShrink
                              value={updatedActionFromYakiChest.points}
                            />
                            <span className="gray-c p-medium">xp</span>
                          </p>
                        </div>
                      )}
                      <ProgressCirc
                        sidebar={true}
                        size={50}
                        percentage={
                          (yakiChestStats.inBetweenLevelPoints * 100) /
                          yakiChestStats.totalPointInLevel
                        }
                        innerComp={
                          <div
                            className="fx-centered fx-col"
                            style={{ rowGap: 0 }}
                          >
                            <p className="orange-c p-small mb-hide">
                              {yakiChestStats.xp} xp
                            </p>
                            <p className="gray-c p-small">
                              {t("AdLQkic", {
                                level: yakiChestStats.currentLevel,
                              })}
                            </p>
                          </div>
                        }
                        tooltip={t("AdLQkic", {
                          level: yakiChestStats.currentLevel,
                        })}
                      />
                    </div>
                  )}
                  {!isYakiChestLoaded && <LoadingDots />}
                </div>
                {showSettings && (
                  <div
                    className="sc-s-18 fx-centered fx-start-v fx-col pointer slide-left"
                    style={{
                      position: "absolute",
                      bottom: "110%",
                      left: "0",
                      width: "240px",
                      height: "max-content",
                      backgroundColor: "var(--very-dim-gray)",
                      zIndex: "900",
                      rowGap: 0,
                    }}
                  >
                    <div
                      className="fx-centered fx-col fx-start-v fit-container"
                      style={{ rowGap: "0" }}
                    >
                      <div
                        className="fit-container fx-centered fx-start-h box-pad-h-m box-pad-v-m nostr-navbar-link"
                        onClick={() => customHistory.push(`/settings`)}
                        style={{ padding: ".75rem 1rem" }}
                      >
                        <div className="setting"></div>
                        <p className="gray-c">{t("ABtsLBp")}</p>
                      </div>
                      <div
                        className="fit-container fx-centered fx-start-h box-pad-h-s box-pad-v-m nostr-navbar-link"
                        onClick={singleLogout}
                        style={{ padding: ".75rem 1rem" }}
                      >
                        <div className="logout"></div>
                        <p className="fx-centered">
                          {t("AyXwdfE")}
                          <span className="sticker sticker-normal sticker-small sticker-orange-side">
                            {userMetadata.name ||
                              userMetadata.display_name ||
                              minimizeKey(userKeys.pub)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <hr />
                    <div className="fit-container fx-centered fx-col box-pad-h-s box-pad-v-s">
                      <div className="fit-container">
                        <p className="gray-c p-small">{t("AT2OPkx")}</p>
                      </div>
                      <div className="fit-container">
                        {accounts.map((account) => {
                          return (
                            <div
                              className="fit-container sc-s-18 box-pad-h-s box-pad-v-s fx-scattered option"
                              style={{
                                backgroundColor:
                                  userKeys.pub !== account.pubkey
                                    ? "transparent"
                                    : "var(--dim-gray)",
                                border: "none",
                                borderRadius: "10px",
                              }}
                              key={account.pubkey}
                              onClick={() => {
                                handleSwitchAccount(account);
                                setIsAccountSwitching(true);
                                setShowSettings(false);
                              }}
                            >
                              <div className="fx-centered">
                                <div style={{ pointerEvents: "none" }}>
                                  <UserProfilePic
                                    size={32}
                                    mainAccountUser={false}
                                    img={account.picture}
                                    allowClick={false}
                                  />
                                </div>
                                <div>
                                  <p className="p-one-line p-medium">
                                    {account.display_name ||
                                      account.name ||
                                      minimizeKey(userKeys.pub)}
                                  </p>
                                  <p className="gray-c p-small p-one-line">
                                    @
                                    {account.name ||
                                      account.display_name ||
                                      minimizeKey(account.pubkey)}
                                  </p>
                                </div>
                              </div>
                              <div>
                                {userKeys.pub !== account.pubkey && (
                                  <div
                                    className="fx-centered"
                                    style={{
                                      border: "1px solid var(--gray)",
                                      borderRadius: "var(--border-r-50)",
                                      minWidth: "14px",
                                      aspectRatio: "1/1",
                                    }}
                                  ></div>
                                )}
                                {userKeys.pub === account.pubkey && (
                                  <div
                                    className="fx-centered"
                                    style={{
                                      borderRadius: "var(--border-r-50)",
                                      backgroundColor: "var(--orange-main)",
                                      minWidth: "14px",
                                      aspectRatio: "1/1",
                                    }}
                                  >
                                    <div
                                      style={{
                                        borderRadius: "var(--border-r-50)",
                                        backgroundColor: "white",
                                        minWidth: "6px",
                                        aspectRatio: "1/1",
                                      }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div
                        className="fit-container fx-centered box-pad-h-m box-pad-v-s sc-s-d option"
                        style={{
                          backgroundColor: "transparent",
                          borderColor: "var(--gray)",
                          borderRadius: "10px",
                        }}
                        onClick={(e) => {
                          redirectToLogin();
                        }}
                      >
                        <div className="plus-sign"></div>
                        <p className="gray-c p-medium">{t("AnDg41L")}</p>
                      </div>
                    </div>
                    <div
                      className="fit-container fx-centered fx-start-h box-pad-h-s box-pad-v-s"
                      onClick={multiLogout}
                    >
                      <div
                        className="fit-container fx-centered fx-start-h box-pad-h-m box-pad-v-s sc-s-18"
                        style={{
                          backgroundColor: "var(--dim-gray)",
                          borderRadius: "10px",
                        }}
                      >
                        <div className="logout"></div>
                        <p>{t("AWFCAQG")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {!userKeys && (
            <button
              className="btn btn-normal btn-full fx-centered"
              // onClick={() => customHistory.push("/login")}
              onClick={() => redirectToLogin()}
            >
              <div className="link-label">{t("AmOtzoL")}</div>
              <div className="connect-24"></div>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

const AccountSwitching = ({ exit }) => {
  const { t } = useTranslation();
  const userMetadata = useSelector((state) => state.userMetadata);
  useEffect(() => {
    let timeout = setTimeout(() => {
      exit();
    }, 2000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="fixed-container fx-centered">
      <div className="fx-centered fx-col">
        <div className="fx-centered popout">
          <div style={{ borderRadius: "var(--border-r-50)" }}>
            <UserProfilePic
              size={200}
              mainAccountUser={true}
              allowClick={false}
            />
          </div>
        </div>
        <div className="box-pad-v fx-centered fx-col">
          <p className="orange-c p-medium">{t("AhxSvbf")}</p>
          <h3>{userMetadata.display_name || userMetadata.name}</h3>
          <p className="gray-c">@{userMetadata.name}</p>
        </div>
      </div>
    </div>
  );
};

const ConfirmmationBox = ({ exit, handleOnClick }) => {
  const { t } = useTranslation();

  return (
    <section className="fixed-container fx-centered box-pad-h">
      <section
        className="fx-centered fx-col sc-s-18 bg-sp box-pad-h box-pad-v"
        style={{ width: "450px" }}
      >
        <div
          className="fx-centered box-marg-s"
          style={{
            minWidth: "54px",
            minHeight: "54px",
            borderRadius: "var(--border-r-50)",
            backgroundColor: "var(--orange-main)",
          }}
        >
          <div className="warning"></div>
        </div>
        <h3 className="p-centered">{t("AirKalq")}</h3>
        <p className="p-centered gray-c box-pad-v-m">{t("Ac9JSPk")}</p>
        <div className="fx-centered fit-container">
          <button
            className="fx btn btn-gst fx-centered"
            style={{ minWidth: "max-content" }}
            onClick={handleOnClick}
          >
            {t("AHmZKVA")}
            <div className="export"></div>
          </button>
          <button className="fx btn btn-red" onClick={exit}>
            {t("AB4BSCe")}
          </button>
        </div>
      </section>
    </section>
  );
};
