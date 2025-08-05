import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../../Components/Main/Sidebar";
import PagePlaceholder from "../../Components/PagePlaceholder";
import LoadingDots from "../../Components/LoadingDots";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import {
  downloadAsFile,
  getBech32,
  getEmptyuserMetadata,
} from "../../Helpers/Encryptions";
import { shortenKey } from "../../Helpers/Encryptions";
import axios from "axios";
import { Helmet } from "react-helmet";
import NProfilePreviewer from "../../Components/Main/NProfilePreviewer";
import LoginWithAPI from "../../Components/Main/LoginWithAPI";
import AddWallet from "../../Components/Main/AddWallet";
import Toggle from "../../Components/Toggle";
import {
  copyText,
  getAppLang,
  getContentTranslationConfig,
  getCustomServices,
  getCustomSettings,
  getDefaultSettings,
  getMediaUploader,
  getRepliesViewSettings,
  getSelectedServer,
  getStorageEstimate,
  getWallets,
  getWotConfig,
  handleAppDirection,
  makeReadableNumber,
  replaceMediaUploader,
  setRepliesViewSettings,
  updateContentTranslationConfig,
  updateCustomSettings,
  updateMediaUploader,
  updateWallets,
} from "../../Helpers/Helpers";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import {
  exportAllWallets,
  getUser,
  InitEvent,
  userLogout,
} from "../../Helpers/Controlers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { Link, useLocation } from "react-router-dom";
import DtoLToggleButton from "../../Components/DtoLToggleButton";
import ZapTip from "../../Components/Main/ZapTip";
import Select from "../../Components/Main/Select";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { supportedLanguage, supportedLanguageKeys } from "../../Context/I18N";
import {
  translationServices,
  translationServicesEndpoints,
} from "../../Content/TranslationServices";
import OptionsDropdown from "../../Components/Main/OptionsDropdown";
import MediaUploaderServer from "../../Content/MediaUploaderServer";
import { clearDBCache } from "../../Helpers/DB";
import RelayImage from "../../Components/Main/RelayImage";
import NDK from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
import { nanoid } from "nanoid";
import RelaysPicker from "../../Components/Main/RelaysPicker";
import EventOptions from "../../Components/ElementOptions/EventOptions";
let boxView = "https://yakihonne.s3.ap-east-1.amazonaws.com/media/images/box-view.png";
let threadView = "https://yakihonne.s3.ap-east-1.amazonaws.com/media/images/thread-view.png";

export default function Settings() {
  const { state } = useLocation();
  const { t } = useTranslation();
  const userMetadata = useSelector((state) => state.userMetadata);
  const userKeys = useSelector((state) => state.userKeys);
  const [selectedTab, setSelectedTab] = useState(state ? state.tab : "");

  return (
    <>
      <div>
        <Helmet>
        <title>Yakihonne | Settings</title>
        <meta
          name="description"
          content={"Customize your Yakihonne experience with powerful privacy and interface options. Take control of your digital presence on the Nostr network.."}
        />
        <meta
          property="og:description"
          content={"Customize your Yakihonne experience with powerful privacy and interface options. Take control of your digital presence on the Nostr network.."}
        />
        <meta
          property="og:image"
          content="https://yakihonne.s3.ap-east-1.amazonaws.com/media/images/thumbnail.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="700" />
        <meta property="og:url" content={`https://yakihonne.com/settings`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Settings" />
        <meta property="twitter:title" content="Yakihonne | Settings" />
        <meta
          property="twitter:description"
          content={"Customize your Yakihonne experience with powerful privacy and interface options. Take control of your digital presence on the Nostr network.."}
        />
        <meta
          property="twitter:image"
          content="https://yakihonne.s3.ap-east-1.amazonaws.com/media/images/thumbnail.png"
        />
        </Helmet>

        <div className="fx-centered fit-container  fx-start-v ">
          <div className="main-middle">
            {userMetadata &&
              (userKeys.sec || userKeys.ext || userKeys.bunker) && (
                <>
                  <h3 className="box-pad-h box-pad-v-m">{t("ABtsLBp")}</h3>
                  <SettingsHeader userKeys={userKeys} />
                  <div
                    className="fit-container fx-centered fx-col"
                    style={{ gap: 0 }}
                  >
                    <KeysManagement
                      selectedTab={selectedTab}
                      setSelectedTab={setSelectedTab}
                      userKeys={userKeys}
                    />
                    <RelaysManagement
                      selectedTab={selectedTab}
                      setSelectedTab={setSelectedTab}
                    />
                    <LanguagesManagement
                      selectedTab={selectedTab}
                      setSelectedTab={setSelectedTab}
                      userKeys={userKeys}
                    />
                    <ContentModerationManagement
                      selectedTab={selectedTab}
                      setSelectedTab={setSelectedTab}
                      userKeys={userKeys}
                    />
                    <WalletsManagement
                      selectedTab={selectedTab}
                      setSelectedTab={setSelectedTab}
                      userKeys={userKeys}
                    />
                    <CustomizationManagement
                      selectedTab={selectedTab}
                      setSelectedTab={setSelectedTab}
                      userKeys={userKeys}
                      state={state}
                    />
                    <CacheManagement
                      selectedTab={selectedTab}
                      setSelectedTab={setSelectedTab}
                    />
                    <ThemeManagement
                      selectedTab={selectedTab}
                      setSelectedTab={setSelectedTab}
                    />
                    <YakiChestManagement />
                    <UserLogout />
                    <SettingsFooter userKeys={userKeys} />
                  </div>
                </>
              )}
            {userMetadata &&
              !userKeys.sec &&
              !userKeys.ext &&
              !userKeys.bunker && (
                <PagePlaceholder page={"nostr-unauthorized"} />
              )}
            {!userMetadata && <PagePlaceholder page={"nostr-not-connected"} />}
          </div>
        </div>
      </div>
    </>
  );
}

const SettingsHeader = ({ userKeys }) => {
  const { t } = useTranslation();
  return (
    <div
      className="fit-container fx-scattered pointer box-pad-v-m box-pad-h-m"
      style={{
        borderBottom: "1px solid var(--very-dim-gray)",
        borderTop: "1px solid var(--very-dim-gray)",
      }}
    >
      <UserProfilePic mainAccountUser={true} size={64} />
      <div className="fx-centered">
        <Link
          to={`/profile/${nip19.nprofileEncode({
            pubkey: userKeys.pub,
          })}`}
        >
          <button className="btn btn-normal">{t("ACgjh46")}</button>
        </Link>
        <Link to={"/settings/profile"}>
          <button className="btn btn-gray">{t("AfxwB6z")}</button>
        </Link>
      </div>
    </div>
  );
};

const KeysManagement = ({ selectedTab, setSelectedTab, userKeys }) => {
  const { t } = useTranslation();
  const exportKeys = () => {
    let keys = {
      sec: userKeys.sec ? getBech32("nsec", userKeys.sec) : "N/A",
      pub: getBech32("npub", userKeys.pub),
    };
    let toSave = [
      "Important: Store this information securely. If you lose it, recovery may not be possible. Keep it private and protected at all times",
      "---",
      "Account credentials",
      `Private key: ${keys.sec}`,
      `Public key: ${keys.pub}`,
    ];

    downloadAsFile(
      toSave.join("\n"),
      "text/plain",
      "account-credentials.txt",
      t("AdoWp0E")
    );
  };
  return (
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
          selectedTab === "keys" ? setSelectedTab("") : setSelectedTab("keys")
        }
      >
        <div className="fx-centered fx-start-h fx-start-v">
          <div className="box-pad-v-s">
            <div className="key-icon-24"></div>
          </div>
          <div>
            <p>{t("Adl0miS")}</p>
            <p className="p-medium gray-c">{t("AXq8Vb3")}</p>
          </div>
        </div>
        <div className="arrow"></div>
      </div>

      {selectedTab === "keys" && (
        <div className="fit-container fx-col fx-centered fx-start-v box-pad-h-m box-pad-v-m ">
          <div>
            <p className="c1-c p-left fit-container">{t("Az0mazr")}</p>
            <p className="p-medium gray-c">{t("AnQpdZ9")}</p>
          </div>
          <div
            className={`fx-scattered if pointer fit-container ${
              userKeys.sec ? "dashed-onH" : "if-disabled"
            }`}
            style={{ borderStyle: "dashed" }}
            onClick={() =>
              userKeys.sec
                ? copyText(getBech32("nsec", userKeys.sec), t("AStACDI"))
                : null
            }
          >
            <p>
              {userKeys.sec ? (
                shortenKey(getBech32("nsec", userKeys.sec))
              ) : (
                <span className="italic-txt gray-c">
                  {userKeys.ext ? t("ApmycvH") : t("Au372KY")}
                </span>
              )}
            </p>
            {userKeys.sec && <div className="copy-24"></div>}
          </div>
          <div>
            <p className="c1-c p-left fit-container">{t("AZRwERj")}</p>
            <p className="p-medium gray-c">{t("A9pRbqh")}</p>
          </div>
          <div
            className="fx-scattered if pointer dashed-onH fit-container"
            style={{ borderStyle: "dashed" }}
            onClick={() =>
              copyText(getBech32("npub", userKeys.pub), t("AzSXXQm"))
            }
          >
            <p>{shortenKey(getBech32("npub", userKeys.pub))}</p>
            <div className="copy-24"></div>
          </div>
          <div className="fit-container fx-end-h" onClick={exportKeys}>
            <div className="fx-centered">
              <p className="btn-text-gray">{t("ADv1bgl")}</p>
              <div className="export"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RelaysManagement = ({ selectedTab, setSelectedTab }) => {
  const { t } = useTranslation();
  return (
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
        <div className="fx-centered fx-start-h fx-start-v">
          <div className="box-pad-v-s">
            <div className="server-24"></div>
          </div>
          <div>
            <p>{t("A23C0Di")}</p>
            <p className="p-medium gray-c">{t("AUE3WRD")}</p>
          </div>
        </div>
        <div className="arrow"></div>
      </div>

      {selectedTab === "relays" && (
        <>
          <RelaysConfig />
        </>
      )}
    </div>
  );
};

const LanguagesManagement = ({ selectedTab, setSelectedTab, userKeys }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [selectedAppLang, setSelectedAppLang] = useState(getAppLang());
  const [selectedTransService, setSelectedTransService] = useState("lt");
  const [transServicePlan, setTransServicePlan] = useState(false);
  const [showAPIKey, setShowAPIKey] = useState(false);
  const [transServiceAPIKey, setTransServiceAPIKey] = useState("");
  const [customServicesPlan, setCustomServicesPlan] = useState(
    getCustomServices()
  );
  const customServices = useMemo(() => {
    if (Object.entries(customServicesPlan).length === 0)
      return translationServices;
    return [
      ...translationServices,
      ...Object.entries(customServicesPlan).map(([key, value]) => ({
        display_name: value.label,
        value: key,
        right_el: (
          <div
            className="round-icon-small"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveService(key);
            }}
          >
            <p className="red-c">&minus;</p>
          </div>
        ),
      })),
    ];
  }, [customServicesPlan]);
  const [showAddCustomService, setShowAddCustomService] = useState(false);
  const transServicesPlans = [
    {
      display_name: t("AT4BU58"),
      value: false,
    },
    {
      display_name: t("AEWXA75"),
      value: true,
    },
  ];

  useEffect(() => {
    let transService = getContentTranslationConfig();
    setSelectedTransService(transService.service);
    setTransServicePlan(transService.plan);
    if (!transService.plan) setTransServiceAPIKey(transService.freeApikey);
    if (transService.plan) setTransServiceAPIKey(transService.proApikey);
  }, [selectedTransService]);

  const handleSwitchLang = (value) => {
    if (supportedLanguageKeys.includes(value)) {
      setSelectedAppLang(value);
      i18next.changeLanguage(value);
      localStorage?.setItem("app-lang", value);
      handleAppDirection(value);
    } else {
      dispatch(
        setToast({
          type: 3,
          desc: t("A9WT6DE"),
        })
      );
    }
  };

  const handleTransServices = (value, plan, apikey) => {
    setSelectedTransService(value);
    updateContentTranslationConfig(
      value,
      plan,
      !plan ? apikey : undefined,
      plan ? apikey : undefined
    );
  };
  const handleTransServicesPlan = (value) => {
    setTransServicePlan(value);
    updateContentTranslationConfig(selectedTransService, value);
    let transService = getContentTranslationConfig();
    if (!value) setTransServiceAPIKey(transService.freeApikey);
    if (value) setTransServiceAPIKey(transService.proApikey);
  };
  const handleTransServicesAPIKey = (e) => {
    let value = e.target.value;
    setTransServiceAPIKey(value);
    updateContentTranslationConfig(
      selectedTransService,
      undefined,
      !transServicePlan ? value : undefined,
      transServicePlan ? value : undefined
    );
  };
  const refreshServices = (data) => {
    let data_ = {
      ...data.newService,
    };
    setShowAddCustomService(false);
    handleTransServices(data_.id, data_.plans, data_.apiKey);
    setTransServiceAPIKey(data_.apiKey);
    setTransServicePlan(data_.plans);
    setCustomServicesPlan(data.allServices);
  };
  const handleRemoveService = (value) => {
    let newCustomServicesSet = {
      ...customServicesPlan,
    };
    delete newCustomServicesSet[value];
    setCustomServicesPlan(newCustomServicesSet);
    let oldServices = getContentTranslationConfig();
    try {
      oldServices = JSON.parse(oldServices);
    } catch (err) {
      oldServices = [];
    }
    localStorage?.setItem(
      `custom-lang-services-${userKeys.pub}`,
      JSON.stringify(newCustomServicesSet)
    );
    localStorage?.setItem(
      "content-lang-config",
      JSON.stringify(oldServices.filter((_) => _.service !== value))
    );
    if (value === selectedTransService) {
      handleTransServices("lt");
    }
  };

  return (
    <>
      {showAddCustomService && (
        <AddNewTranslationService
          exit={() => setShowAddCustomService(false)}
          refreshServices={refreshServices}
          services={customServicesPlan}
          userKeys={userKeys}
        />
      )}
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
            selectedTab === "lang" ? setSelectedTab("") : setSelectedTab("lang")
          }
        >
          <div className="fx-centered fx-start-h fx-start-v">
            <div className="box-pad-v-s">
              <div className="translate-24"></div>
            </div>
            <div>
              <p>{t("ALGYjOG")}</p>
              <p className="p-medium gray-c">{t("A0yvMQi")}</p>
            </div>
          </div>
          <div className="arrow"></div>
        </div>
        {selectedTab === "lang" && (
          <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
            <div className="fit-container">
              <p className="gray-c">{t("AfwKx9Q")}</p>
            </div>
            <div className="fx-scattered fit-container">
              <div>
                <p>{t("AfwKx9Q")}</p>
                <p className="p-medium gray-c">{t("AjTNn13")}</p>
              </div>
              <div className="fx-centered" style={{ minWidth: "max-content" }}>
                <Select
                  options={supportedLanguage}
                  value={selectedAppLang}
                  setSelectedValue={handleSwitchLang}
                />
              </div>
            </div>
            <hr />
            <div className="fit-container">
              <p className="gray-c">{t("AFz9bzq")}</p>
            </div>
            <div className="fx-scattered fit-container">
              <div>
                <p>{t("AFz9bzq")}</p>
                <p className="p-medium gray-c">{t("A21tdwK")}</p>
              </div>
              <div className="fx-centered">
                <Select
                  options={customServices}
                  value={selectedTransService}
                  setSelectedValue={handleTransServices}
                />
                <div
                  className="round-icon-small"
                  onClick={() => setShowAddCustomService(true)}
                >
                  <div className="plus-sign"></div>
                </div>
              </div>
            </div>
            <div className="fit-container fx-centered fx-col">
              {{ ...translationServicesEndpoints, ...customServicesPlan }[
                selectedTransService
              ]?.plans && (
                <div className="fx-scattered fit-container">
                  <div>
                    <p>{t("AFLFvbx")}</p>
                    <p className="p-medium gray-c">{t("AsYLJGY")}</p>
                  </div>
                  <Select
                    options={transServicesPlans}
                    value={transServicePlan}
                    setSelectedValue={handleTransServicesPlan}
                  />
                </div>
              )}
              {!(selectedTransService === "lt" && !transServicePlan) && (
                <>
                  <label
                    htmlFor="ser-apikey"
                    className="if fit-container fx-scattered"
                  >
                    <input
                      type={showAPIKey ? "text" : "password"}
                      className="if ifs-full if-no-border"
                      style={{ paddingLeft: 0 }}
                      placeholder={t("AMbIPen")}
                      value={transServiceAPIKey}
                      onChange={handleTransServicesAPIKey}
                    />
                    {showAPIKey && (
                      <div
                        className="eye-opened"
                        onClick={() => setShowAPIKey(!showAPIKey)}
                      ></div>
                    )}
                    {!showAPIKey && (
                      <div
                        className="eye-closed"
                        onClick={() => setShowAPIKey(!showAPIKey)}
                      ></div>
                    )}
                  </label>
                  <a
                    href={
                      {
                        ...translationServicesEndpoints,
                        ...customServicesPlan,
                      }[selectedTransService]?.url
                    }
                    className="c1-c p-medium"
                    style={{ textDecoration: "underline" }}
                  >
                    {t("AJKDh94")}
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const ContentModerationManagement = ({
  selectedTab,
  setSelectedTab,
  userKeys,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [customServer, setCustomServer] = useState(false);
  const [legacyDM, setLegacyDM] = useState(localStorage?.getItem("legacy-dm"));
  const [wotConfig, setWotConfig] = useState(getWotConfig());
  const [showMutedList, setShowMutedList] = useState(false);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [mediaUploader, setMediaUploader] = useState(getMediaUploader());
  const [selectedMediaServer, setSelectedMediaServer] = useState(
    getSelectedServer() || mediaUploader[0].value
  );

  useEffect(() => {
    if (userKeys) {
      setMediaUploader(getMediaUploader(handleRemoveServer));
      setSelectedMediaServer(getSelectedServer());
    }
  }, [userKeys]);

  const handleRemoveServer = (server) => {
    let tempServersURLs = MediaUploaderServer.map((s) => s[1]);
    let tempArray = mediaUploader
      .filter((s) => s.value !== server && !tempServersURLs.includes(s.value))
      .map((_) => [_.display_name, _.value]);
    replaceMediaUploader(
      tempArray,
      selectedMediaServer === server
        ? mediaUploader[0].value
        : selectedMediaServer
    );
    setMediaUploader(getMediaUploader());
  };
  const addNewServer = async () => {
    if (!customServer) return;
    setIsLoading(true);
    try {
      const test = await axios.post(customServer);
      dispatch(
        setToast({
          type: 2,
          desc: t("AQIc1lO"),
        })
      );
      setIsLoading(false);
    } catch (err) {
      if (err.response.status === 404) {
        dispatch(
          setToast({
            type: 2,
            desc: t("AQIc1lO"),
          })
        );
        setIsLoading(false);
        return;
      }
      let domain = customServer.split("/")[2];

      setSelectedMediaServer(customServer);
      let checkExistance = mediaUploader.find((_) => _.display_name === domain);
      if (!checkExistance) {
        updateMediaUploader([domain, customServer], customServer);
        setMediaUploader(getMediaUploader());
      } else {
        updateMediaUploader(undefined, customServer);
      }
      setCustomServer(false);
      setIsLoading(false);
    }
  };

  const handleLegacyDMs = () => {
    if (legacyDM) {
      localStorage?.removeItem("legacy-dm");
      setLegacyDM(false);
    } else {
      localStorage?.setItem("legacy-dm", `${Date.now()}`);
      setLegacyDM(true);
    }
  };
  const handleChangeWotConfig = (key, value) => {
    if (key === "score") {
      let config = {
        ...wotConfig,
        score: value >= 0 && value <= 10 ? value : 2,
      };
      setWotConfig(config);
      localStorage?.setItem(
        `${userKeys.pub}-wot-config`,
        JSON.stringify(config)
      );
      return;
    }
    let newValue = !value;
    if (key === "all") {
      let config = {
        ...wotConfig,
        all: newValue,
        notifications: newValue,
        reactions: newValue,
        dms: newValue,
      };

      setWotConfig(config);
      localStorage?.setItem(
        `${userKeys.pub}-wot-config`,
        JSON.stringify(config)
      );
      return;
    }
    let config = { ...wotConfig, [key]: newValue };
    if (config.notifications && config.reactions && config.dms)
      config.all = true;
    else config.all = false;

    setWotConfig(config);
    localStorage?.setItem(`${userKeys.pub}-wot-config`, JSON.stringify(config));
  };
  return (
    <>
      {showMutedList && <MutedList exit={() => setShowMutedList(false)} />}
      {showMediaUploader && (
        <MediaUploader exit={() => setShowMediaUploader(false)} />
      )}

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
          <div className="fx-centered fx-start-h fx-start-v">
            <div className="box-pad-v-s">
              <div className="content-s-24"></div>
            </div>
            <div>
              <p>{t("Ayh6w9C")}</p>
              <p className="p-medium gray-c">{t("Aa4zlCA")}</p>
            </div>
          </div>
          <div className="arrow"></div>
        </div>
        {selectedTab === "moderation" && (
          <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
            <div className="fx-scattered fit-container">
              <div>
                <p>{t("AX2OYcg")}</p>
                <p className="p-medium gray-c">{t("AYnXPtk")}</p>
              </div>
              <div
                className="btn-text-gray"
                style={{ marginRight: ".75rem" }}
                onClick={() => setShowMutedList(true)}
              >
                {t("AsXohpb")}
              </div>
            </div>
            <div className="fx-scattered fit-container">
              <div>
                <p>{t("A1XtC0x")}</p>
                <p className="p-medium gray-c">{t("ATtpr07")}</p>
              </div>
              <div
                className="btn-text-gray"
                style={{ marginRight: ".75rem" }}
                onClick={() => setShowMediaUploader(true)}
              >
                {t("AsXohpb")}
              </div>
            </div>
            {customServer !== false && (
              <div
                className="fx-centered fit-container slide-down box-pad-v-s"
                style={{
                  borderBottom: "1px solid var(--very-dim-gray)",
                }}
              >
                <input
                  type="text"
                  placeholder={t("A8PtjSa")}
                  className="if ifs-full"
                  style={{ height: "40px" }}
                  value={customServer}
                  onChange={(e) => setCustomServer(e.target.value)}
                />
                <button
                  className="btn btn-normal"
                  style={{ minWidth: "max-content" }}
                  onClick={addNewServer}
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingDots /> : t("ALyj7Li")}
                </button>
                <button
                  className="btn btn-red"
                  onClick={() => setCustomServer(false)}
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingDots /> : t("AB4BSCe")}
                </button>
              </div>
            )}
            <div className="fx-scattered fit-container">
              <div>
                <p>{t("ACASAT7")}</p>
                <p className="p-medium gray-c">{t("AZknCuh")}</p>
              </div>
            </div>
            <div className="fit-container">
              <p className="gray-c">{t("ATQOG8o")}</p>
              <div className="fit-container fx-centered">
                <input
                  type="range"
                  className="ifs-full"
                  min={0}
                  max={10}
                  value={wotConfig.score}
                  onChange={(e) =>
                    handleChangeWotConfig("score", parseInt(e.target.value))
                  }
                  disabled={
                    !(
                      wotConfig.notifications ||
                      wotConfig.reactions ||
                      wotConfig.dms
                    )
                  }
                />
                <div className="round-icon-small">
                  <p className="p-medium">{wotConfig.score}</p>
                </div>
              </div>
            </div>
            <div className="fit-container fx-col fx-centered fx-start-h fx-start-v">
              <p className="gray-c">{t("AUSdCrV")}</p>
              <div className="fit-container fx-centered fx-col">
                <label
                  className="fit-container fx-scattered"
                  htmlFor="wot-AR9ctVs"
                >
                  <p>{t("AR9ctVs")}</p>
                  <input
                    type="checkbox"
                    id="wot-AR9ctVs"
                    name="wot-AR9ctVs"
                    value={wotConfig.all}
                    checked={wotConfig.all}
                    onChange={() => handleChangeWotConfig("all", wotConfig.all)}
                  />
                </label>
                <label
                  className="fit-container fx-scattered"
                  htmlFor="wot-ASSFfFZ"
                >
                  <p>{t("ASSFfFZ")}</p>
                  <input
                    type="checkbox"
                    id="wot-ASSFfFZ"
                    name="wot-ASSFfFZ"
                    value={wotConfig.notifications}
                    checked={wotConfig.notifications}
                    onChange={() =>
                      handleChangeWotConfig(
                        "notifications",
                        wotConfig.notifications
                      )
                    }
                  />
                </label>
                <label
                  className="fit-container fx-scattered"
                  htmlFor="wot-Ad3ts4Q"
                >
                  <p>{t("Ad3ts4Q")}</p>
                  <input
                    type="checkbox"
                    id="wot-Ad3ts4Q"
                    name="wot-Ad3ts4Q"
                    value={wotConfig.reactions}
                    checked={wotConfig.reactions}
                    onChange={() =>
                      handleChangeWotConfig("reactions", wotConfig.reactions)
                    }
                  />
                </label>
                <label
                  className="fit-container fx-scattered"
                  htmlFor="wot-Aql44db"
                >
                  <p>{t("Aql44db")}</p>
                  <input
                    type="checkbox"
                    id="wot-Aql44db"
                    name="wot-Aql44db"
                    value={wotConfig.dms}
                    checked={wotConfig.dms}
                    onChange={() => handleChangeWotConfig("dms", wotConfig.dms)}
                  />
                </label>
              </div>
            </div>

            <div className="fx-scattered fit-container">
              <p>{t("A3KL0O7")}</p>
              <div
                className={`toggle ${legacyDM ? "toggle-dim-gray" : ""} ${
                  !legacyDM ? "toggle-c1" : "toggle-dim-gray"
                }`}
                onClick={handleLegacyDMs}
              ></div>
            </div>

            <p className="gray-c p-medium">
              {t("AsTdJ5U")}{" "}
              <a
                href="https://github.com/nostr-protocol/nips/blob/master/44.md"
                className="c1-c"
                style={{ textDecoration: "underline" }}
                target="_blank"
              >
                nip-44
              </a>
              {t("AgOr2Vf")}{" "}
              <a
                href="https://github.com/nostr-protocol/nips/blob/master/04.md"
                className="c1-c"
                style={{ textDecoration: "underline" }}
                target="_blank"
              >
                nip-04.
              </a>
            </p>
          </div>
        )}
      </div>
    </>
  );
};

const WalletsManagement = ({ selectedTab, setSelectedTab, userKeys }) => {
  const { t } = useTranslation();
  const [wallets, setWallets] = useState(getWallets());
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showDeletionPopup, setShowDeletionPopup] = useState(false);

  useEffect(() => {
    if (userKeys) {
      handleAddWallet();
    } else setWallets([]);
  }, [userKeys]);

  let handleAddWallet = () => {
    let tempWallets = getWallets();
    setWallets(tempWallets);
    setShowAddWallet(false);
  };


  const refreshAfterDeletion = (w) => {
    setWallets(w);
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
  return (
    <>
      {showAddWallet && (
        <AddWallet
          exit={() => setShowAddWallet(false)}
          refresh={handleAddWallet}
        />
      )}
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
          <div className="fx-centered fx-start-h fx-start-v">
            <div className="box-pad-v-s">
              <div className="wallet-24"></div>
            </div>
            <div>
              <p>{t("ACERu54")}</p>
              <p className="p-medium gray-c">{t("A0ZZIE7")}</p>
            </div>
          </div>
          <div className="arrow"></div>
        </div>
        {selectedTab === "wallets" && (
          <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
            <div className="fit-container fx-scattered">
              <div>
                <p>{t("A8fEwNq")}</p>
                <p className="p-medium gray-c">{t("AYKDD4g")}</p>
              </div>
              <div className="fx-centered">
                <button
                  className="btn-small btn btn-normal"
                  style={{ minWidth: "max-content" }}
                  onClick={exportAllWallets}
                >
                  {t("Aq791XG")}
                </button>
                <div
                  className="round-icon-small round-icon-tooltip"
                  data-tooltip={t("A8fEwNq")}
                  onClick={() => setShowAddWallet(true)}
                >
                  <div style={{ rotate: "-45deg" }} className="p-medium">
                    &#10005;
                  </div>
                </div>
              </div>
            </div>
            {wallets.map((wallet) => {
              return (
                <div
                  className="sc-s-18 bg-sp box-pad-h-s box-pad-v-s fx-scattered fit-container"
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
                      {wallet.kind === 3 && <div className="nwc-logo-24"></div>}
                      <div className="fx-centered fx-col">
                        <div className="fx-centered">
                          <p>{wallet.entitle}</p>
                          {wallet.active && (
                            <div
                              style={{
                                minWidth: "8px",
                                aspectRatio: "1/1",
                                backgroundColor: "var(--green-main)",
                                borderRadius: "var(--border-r-50)",
                              }}
                            ></div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="fx-centered"></div>
                  </div>
                  <div className="fx-centered">
                    {!wallet.active && (
                      <div
                        className="round-icon-small round-icon-tooltip"
                        data-tooltip={t("Ar6TTrh")}
                        onClick={() => handleSelectWallet(wallet.id)}
                      >
                        <div className="switch-arrows"></div>
                      </div>
                    )}
                    {wallet.kind !== 1 && (
                      <EventOptions event={wallet} component={"wallet"} refreshAfterDeletion={refreshAfterDeletion}/>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

const CustomizationManagement = ({
  selectedTab,
  setSelectedTab,
  userKeys,
  state,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [userToFollowSuggestion, setUserToFollowSuggestion] = useState(
    localStorage?.getItem("hsuggest1")
  );
  const [contentSuggestion, setContentSuggestion] = useState(
    localStorage?.getItem("hsuggest2")
  );
  const [interestSuggestion, setInterestSuggestion] = useState(
    localStorage?.getItem("hsuggest3")
  );
  const [collapsedNote, setCollapsedNote] = useState(
    getCustomSettings().collapsedNote === undefined
      ? true
      : getCustomSettings().collapsedNote
  );
  const [userHoverPreview, setUserHoverPreview] = useState(
    getCustomSettings().userHoverPreview
  );
  const contentList = getCustomSettings().contentList;
  const [notification, setNotification] = useState(
    getCustomSettings().notification || getDefaultSettings("").notification
  );
  const [selectedRepliesView, setSelectedRepliesView] = useState(
    getRepliesViewSettings() ? "thread" : "box"
  );
  const [homeContentSuggestion, setHomeContentSuggestion] = useState(
    localStorage?.getItem("hsuggest")
  );
  const notificationDN = {
    mentions: `${t("A8Da0of")} / ${t("AENEcn9")}`,
    reactions: t("Alz0E9Y"),
    reposts: t("Aai65RJ"),
    zaps: "Zaps",
    following: t("A9TqNxQ"),
  };
  const notificationDesc = {
    mentions: t("AyF6bJf"),
    reactions: t("AjlJkCH"),
    reposts: t("A9sfGZo"),
    zaps: t("Ae82ooM"),
    following: t("A5HyxxL"),
  };

  useEffect(() => {
    if (state && state.tab === "customization") {
      const target = document.querySelector(".main-page-nostr-container");
      if (target) {
        target.scrollTop = target.scrollHeight;
      }
    }
  }, [state]);

  const handleHomeContentSuggestion = () => {
    if (homeContentSuggestion) {
      localStorage?.removeItem("hsuggest");
      setHomeContentSuggestion(false);
    }
    if (!homeContentSuggestion) {
      let dateNow = `${Date.now()}`;
      localStorage?.setItem("hsuggest", dateNow);
      setHomeContentSuggestion(dateNow);
    }
  };

  const handleUserToFollowSuggestion = () => {
    if (userToFollowSuggestion) {
      localStorage?.removeItem("hsuggest1");
      setUserToFollowSuggestion(false);
    }
    if (!userToFollowSuggestion) {
      let dateNow = `${Date.now()}`;
      localStorage?.setItem("hsuggest1", dateNow);
      setUserToFollowSuggestion(dateNow);
    }
  };
  const handleContentSuggestion = () => {
    if (contentSuggestion) {
      localStorage?.removeItem("hsuggest2");
      setContentSuggestion(false);
    }
    if (!contentSuggestion) {
      let dateNow = `${Date.now()}`;
      localStorage?.setItem("hsuggest2", dateNow);
      setContentSuggestion(dateNow);
    }
  };
  const handleInterestSuggestion = () => {
    if (interestSuggestion) {
      localStorage?.removeItem("hsuggest3");
      setInterestSuggestion(false);
    }
    if (!interestSuggestion) {
      let dateNow = `${Date.now()}`;
      localStorage?.setItem("hsuggest3", dateNow);
      setInterestSuggestion(dateNow);
    }
  };
  const handleCollapedNote = () => {
    if (collapsedNote) {
      setCollapsedNote(false);
      updateCustomSettings({
        pubkey: userKeys.pub,
        collapsedNote: false,
        userHoverPreview,
        notification,
        contentList,
      });
    }
    if (!collapsedNote) {
      setCollapsedNote(true);
      updateCustomSettings({
        pubkey: userKeys.pub,
        collapsedNote: true,
        userHoverPreview,
        notification,
        contentList,
      });
    }
  };

  const handleUserHoverPreview = () => {
    if (userHoverPreview) {
      setUserHoverPreview(false);
      updateCustomSettings({
        pubkey: userKeys.pub,
        userHoverPreview: false,
        collapsedNote,
        notification,
        contentList,
      });
    }
    if (!userHoverPreview) {
      setUserHoverPreview(true);
      updateCustomSettings({
        pubkey: userKeys.pub,
        userHoverPreview: true,
        collapsedNote,
        notification,
        contentList,
      });
    }
  };

  const handleNotification = (index, status) => {
    let tempArr = structuredClone(notification);
    tempArr[index].isHidden = status;
    if (!tempArr.find((item) => !item.isHidden)) {
      dispatch(
        setToast({
          type: 2,
          desc: t("AHfFgQL"),
        })
      );
      return;
    }
    setNotification(tempArr);
    updateCustomSettings({
      pubkey: userKeys.pub,
      userHoverPreview,
      contentList,
      collapsedNote,
      notification: tempArr,
    });
  };

  const handleRepliesView = (value) => {
    setRepliesViewSettings(value);
    setSelectedRepliesView(value);
  };

  return (
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
          selectedTab === "customization"
            ? setSelectedTab("")
            : setSelectedTab("customization")
        }
      >
        <div className="fx-centered fx-start-h fx-start-v">
          <div className="box-pad-v-s">
            <div className="custom-24"></div>
          </div>
          <div>
            <p>{t("ARS24Cc")}</p>
            <p className="p-medium gray-c">{t("AvNq0fB")}</p>
          </div>
        </div>
        <div className="arrow"></div>
      </div>
      {selectedTab === "customization" && (
        <div className="fit-container fx-col fx-centered  box-pad-h-m box-pad-v-m ">
          <div className="fit-container">
            <p className="gray-c">{t("Amm6e0Z")}</p>
          </div>
          <div className="fx-scattered fit-container">
            <div>
              <p>{t("AozzmTY")}</p>
              <p className="p-medium gray-c">{t("A3nTKfp")}</p>
            </div>
            <div
              className={`toggle ${!collapsedNote ? "toggle-dim-gray" : ""} ${
                collapsedNote ? "toggle-c1" : "toggle-dim-gray"
              }`}
              onClick={handleCollapedNote}
            ></div>
          </div>
          <div className="fx-scattered fit-container fx-start-v fx-col">
            <div>
              <p>{t("ADAM3FJ")}</p>
              <p className="p-medium gray-c">{t("Ai5Sb3k")}</p>
            </div>
            <div className="fit-container fx-centered">
              <div
                className="fx fx-centered fx-col sc-s-18 bg-sp "
                style={{
                  borderColor: selectedRepliesView !== "box" ? "" : "var(--c1)",
                }}
                onClick={() => handleRepliesView("box")}
              >
                <img src={boxView} style={{ width: "100%" }} alt="" />
                <p className="gray-c box-pad-v-s">{t("ACz8zwo")}</p>
              </div>
              <div
                className="fx fx-centered fx-col sc-s-18 bg-sp "
                style={{
                  borderColor:
                    selectedRepliesView !== "thread" ? "" : "var(--c1)",
                }}
                onClick={() => handleRepliesView("thread")}
              >
                <img src={threadView} style={{ width: "100%" }} alt="" />
                <p className="gray-c box-pad-v-s">{t("AlwU99D")}</p>
              </div>
            </div>
          </div>
          <div className="fx-scattered fit-container">
            <div>
              <p>{t("AFVPHti")}</p>
              <p className="p-medium gray-c">{t("A864200")}</p>
            </div>
            <div
              className={`toggle ${
                !userHoverPreview ? "toggle-dim-gray" : ""
              } ${userHoverPreview ? "toggle-c1" : "toggle-dim-gray"}`}
              onClick={handleUserHoverPreview}
            ></div>
          </div>
          <hr />
          <div className="fit-container">
            <p className="gray-c">{t("AKjfaA8")}</p>
            <p className="p-medium gray-c">{t("Am0PvQX")}</p>
          </div>
          <div className="fx-scattered fit-container">
            <div>
              <p>{t("AZZ4XLg")}</p>
              <p className="p-medium gray-c">{t("AgBOrIx")}</p>
            </div>
            <div
              className={`toggle ${
                homeContentSuggestion ? "toggle-dim-gray" : ""
              } ${!homeContentSuggestion ? "toggle-c1" : "toggle-dim-gray"}`}
              onClick={handleHomeContentSuggestion}
            ></div>
          </div>
          <hr />
          <div className="fx-scattered fit-container">
            <div>
              <p>{t("AE7aj4C")}</p>
              <p className="p-medium gray-c">{t("AyBFzxq")}</p>
            </div>
            <div
              className={`toggle ${
                userToFollowSuggestion ? "toggle-dim-gray" : ""
              } ${!userToFollowSuggestion ? "toggle-c1" : "toggle-dim-gray"}`}
              onClick={handleUserToFollowSuggestion}
            ></div>
          </div>
          <hr />
          <div className="fx-scattered fit-container">
            <div>
              <p>{t("Ax8NFUb")}</p>
              <p className="p-medium gray-c">{t("ARDBNh7")}</p>
            </div>
            <div
              className={`toggle ${
                contentSuggestion ? "toggle-dim-gray" : ""
              } ${!contentSuggestion ? "toggle-c1" : "toggle-dim-gray"}`}
              onClick={handleContentSuggestion}
            ></div>
          </div>
          <hr />
          <div className="fx-scattered fit-container">
            <div>
              <p>{t("ANiWe9M")}</p>
              <p className="p-medium gray-c">{t("AXgwD7C")}</p>
            </div>
            <div
              className={`toggle ${
                interestSuggestion ? "toggle-dim-gray" : ""
              } ${!interestSuggestion ? "toggle-c1" : "toggle-dim-gray"}`}
              onClick={handleInterestSuggestion}
            ></div>
          </div>
          <hr />
          <div className="fx-scattered fit-container fx-col fx-start-v">
            <div>
              <p className="gray-c">{t("ASSFfFZ")}</p>
              <p className="p-medium gray-c">{t("Aaa8NMg")}</p>
            </div>
            <div className="fit-container fx-centered fx-col">
              {notification.map((item, index) => {
                return (
                  <Fragment key={index}>
                    <div className="fx-scattered fit-container">
                      <div>
                        <p className="p-maj">{notificationDN[item.tab]}</p>
                        <p className="p-medium gray-c">
                          {notificationDesc[item.tab]}
                        </p>
                      </div>
                      <div className="fx-centered">
                        <div
                          className={`toggle ${
                            item.isHidden ? "toggle-dim-gray" : ""
                          } ${
                            !item.isHidden ? "toggle-c1" : "toggle-dim-gray"
                          }`}
                          onClick={() =>
                            handleNotification(index, !item.isHidden)
                          }
                        ></div>
                      </div>
                    </div>
                    <hr />
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CacheManagement = ({ selectedTab, setSelectedTab }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [cacheSize, setCacheSize] = useState(0);
  const [isCacheClearing, setIsCacheClearing] = useState(false);

  useEffect(() => {
    const dbSize = async () => {
      let size = await getStorageEstimate();
      setCacheSize(size);
    };
    dbSize();
  }, []);

  const clearAppCache = async () => {
    try {
      if (isCacheClearing) return false;
      setIsCacheClearing(true);
      let status = await clearDBCache();
      if (status) {
        localStorage?.removeItem("warning-bar-closed");
        dispatch(setToast({ type: 1, desc: t("A0GMVeT") }));
        window.location.reload();
      } else dispatch(setToast({ type: 2, desc: t("Acr4Slu") }));
      setIsCacheClearing(false);
    } catch (err) {
      console.log(err);
      setIsCacheClearing(false);
      dispatch(setToast({ type: 2, desc: t("Acr4Slu") }));
    }
  };

  return (
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
          selectedTab === "cache" ? setSelectedTab("") : setSelectedTab("cache")
        }
      >
        <div className="fx-centered fx-start-h fx-start-v">
          <div className="box-pad-v-s">
            <div className="cache-24"></div>
          </div>
          <div>
            <p>{t("AZEJWnf")}</p>
            <p className="p-medium gray-c">{t("AHV4nwK")}</p>
          </div>
        </div>
        <div className="arrow"></div>
      </div>
      {selectedTab === "cache" && (
        <div className="fit-container fx-col fx-centered box-pad-h-m box-pad-v-m">
          <div className="fx-scattered fit-container">
            <p>{t("AfcEwqC")}</p>
            <p className={cacheSize > 4000 ? "red-c" : "gray-c"}>
              {cacheSize > 4000 ? (
                <span className="p-medium"> ({t("AhfkjK3")}) </span>
              ) : (
                ""
              )}
              {makeReadableNumber(cacheSize)} MB{" "}
            </p>
          </div>
          <div className="fx-centered fit-container fx-end-h">
            <button
              className="btn btn-small btn-normal"
              onClick={clearAppCache}
              disabled={isCacheClearing}
            >
              {isCacheClearing ? <LoadingDots /> : t("AWj8yOR")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ThemeManagement = ({ selectedTab, setSelectedTab }) => {
  const { t } = useTranslation();
  return (
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
          selectedTab === "theme" ? setSelectedTab("") : setSelectedTab("theme")
        }
      >
        <div className="fx-centered fx-start-h fx-start-v">
          <div className="box-pad-v-s">
            <div className="theme-24"></div>
          </div>
          <div>
            <p>{t("A1iiDWU")}</p>
            <p className="p-medium gray-c">{t("Aayzo1w")}</p>
          </div>
        </div>
        <div className="arrow"></div>
      </div>
      {selectedTab === "theme" && (
        <div className="fit-container fx-col fx-centered box-pad-h-m box-pad-v-m ">
          <div className="fx-scattered fit-container">
            <DtoLToggleButton />
          </div>
        </div>
      )}
    </div>
  );
};

const YakiChestManagement = () => {
  const { t } = useTranslation();
  const isYakiChestLoaded = useSelector((state) => state.isYakiChestLoaded);
  const yakiChestStats = useSelector((state) => state.yakiChestStats);
  const [showYakiChest, setShowYakiChest] = useState(false);

  return (
    <>
      {showYakiChest && <LoginWithAPI exit={() => setShowYakiChest(false)} />}
      <div
        className="fit-container fx-scattered box-pad-h-m box-pad-v-m pointer"
        style={{
          borderBottom: "1px solid var(--very-dim-gray)",
        }}
      >
        <div className="fx-centered fx-start-h fx-start-v">
          <div className="box-pad-v-s">
            <div className="cup-24"></div>
          </div>
          <div>
            <p>{t("ACALoWH")}</p>
            <p className="p-medium gray-c">{t("AF2ceO1")}</p>
          </div>
        </div>
        {yakiChestStats && isYakiChestLoaded && (
          <div className="fx-centered">
            <p className="green-c p-medium">{t("A5aXNG9")}</p>
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
              {t("Azb0lto")}
            </button>
          </div>
        )}
        {!isYakiChestLoaded && (
          <div className="fx-centered">
            <LoadingDots />
          </div>
        )}
      </div>
    </>
  );
};

const UserLogout = () => {
  const { t } = useTranslation();
  return (
    <div
      className="fit-container fx-scattered box-pad-h-m box-pad-v-m pointer"
      onClick={userLogout}
    >
      <div className="fx-centered fx-start-h">
        <div className="logout-24"></div>
        <p>{t("AyXwdfE")}</p>
      </div>
    </div>
  );
};

const SettingsFooter = ({ userKeys }) => {
  const { t } = useTranslation();
  return (
    <div
      className="fit-container fx-centered fx-col"
      style={{ height: "350px" }}
    >
      <div className="yakihonne-logo-128"></div>
      <p className="p-centered gray-c" style={{ maxWidth: "400px" }}>
        {t("AFZ1jAD")}
      </p>
      <p className="c1-c">v{import.meta.env.VITE__APP_VERSION}</p>
      <div className="fx-centered">
        <ZapTip
          recipientLNURL={import.meta.env.VITE__YAKI_LUD16}
          recipientPubkey={import.meta.env.VITE__YAKI_PUBKEY}
          senderPubkey={userKeys.pub}
          recipientInfo={{
            name: "Yakihonne",
            picture:
              "https://yakihonne.s3.ap-east-1.amazonaws.com/media/icons/20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3/files/1691722198488-YAKIHONNES3.png",
          }}
        />
        <a href="mailto:info@yakihonne.com">
          <div
            className="round-icon round-icon-tooltip"
            data-tooltip={t("AheSXrs")}
          >
            <div className="env"></div>
          </div>
        </a>
        <a
          href="https://github.com/orgs/YakiHonne/repositories"
          target="_blank"
        >
          <div
            className="round-icon round-icon-tooltip"
            data-tooltip={"Github repos"}
          >
            <div className="github-logo"></div>
          </div>
        </a>
      </div>
    </div>
  );
};

const RelaysConfig = () => {
  const { state } = useLocation();
  const { t } = useTranslation();
  const [showRelaysInfo, setShowRelaysInfo] = useState(false);
  const [allRelays, setAllRelays] = useState([]);
  const [showStatus, setShowStatus] = useState(false);
  const [selectedTab, setSelectedTab] = useState(state ? state.relaysTab : 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await axios.get("https://api.nostr.watch/v1/online");
        setAllRelays(data.data);
      } catch {}
    };
    fetchData();
  }, []);

  return (
    <>
      {showRelaysInfo && (
        <RelaysInfo
          url={showRelaysInfo}
          exit={() => setShowRelaysInfo(false)}
        />
      )}
      {showStatus && (
        <div className="fixed-container fx-centered box-pad-h">
          <div
            style={{
              width: "min(100%, 400px)",
              position: "relative",
              gap: "20px",
            }}
            className="fx-centered fx-start-v fx-col box-pad-v box-pad-h sc-s-18 bg-sp slide-up"
          >
            <div className="close" onClick={() => setShowStatus(false)}>
              <div></div>
            </div>
            <h4>{t("AmikACu")}</h4>
            <div className="fx-centered fx-start-h fx-col fx-start-v">
              <div className="fx-centered">
                <div
                  style={{
                    minWidth: "6px",
                    aspectRatio: "1/1",
                    borderRadius: "50%",
                    backgroundColor: "var(--green-main)",
                  }}
                ></div>
                <p>{t("AcPWRJ9")}</p>
              </div>
              <div className="fx-centered">
                <div
                  style={{
                    minWidth: "6px",
                    aspectRatio: "1/1",
                    borderRadius: "50%",
                    backgroundColor: "var(--red-main)",
                  }}
                ></div>
                <p>{t("AJQQGgT")}</p>
              </div>
            </div>
            <hr />
            <p className="gray-c">{t("AugXNf5")}</p>
          </div>
        </div>
      )}
      <div className="fit-container fx-scattered box-pad-h">
        {selectedTab === 0 && (
          <div className="fx-centered" onClick={() => setShowStatus(true)}>
            <p className="c1-c slide-right">{t("AciF91F")}</p>
            <div className="info-tt" style={{ rotate: "180deg" }}></div>
          </div>
        )}
        {selectedTab === 1 && (
          <div className="fx-centered" onClick={() => setShowStatus(true)}>
            <p className="c1-c slide-right">{t("AEsTMiq")}</p>
            <div className="info-tt" style={{ rotate: "180deg" }}></div>
          </div>
        )}
        <div className="fx-centered">
          <div className="round-icon-small" onClick={() => setSelectedTab(0)}>
            <div className="arrow" style={{ rotate: "90deg" }}></div>
          </div>
          <div className="round-icon-small" onClick={() => setSelectedTab(1)}>
            <div className="arrow" style={{ rotate: "-90deg" }}></div>
          </div>
        </div>
      </div>
      <div
        className="fit-container fx-centered fx-start-h fx-start-v"
        style={{ overflow: "hidden" }}
      >
        <div
          className="fit-container fx-centered fx-start-h fx-start-v box-pad-v-s"
          style={{
            transform: `translateX(${selectedTab ? "-100%" : "0"})`,
            transition: "transform 0.3s ease-in-out",
          }}
        >
          <ContentRelays
            setShowRelaysInfo={setShowRelaysInfo}
            allRelays={allRelays}
          />
          <InboxRelays
            setShowRelaysInfo={setShowRelaysInfo}
            allRelays={allRelays}
          />
        </div>
      </div>
    </>
  );
};

const ContentRelays = ({ setShowRelaysInfo, allRelays }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userAllRelays = useSelector((state) => state.userAllRelays);
  const relaysContainer = useRef(null);
  const [tempUserRelays, setTempUserRelays] = useState([]);
  const [relaysStatus, setRelaysStatus] = useState([]);
  const connectedRelays = useMemo(() => {
    return {
      relaysStatus: relaysStatus.reduce((acc, relay) => {
        acc[relay.url] = relay.connected;
        return acc;
      }, {}),
      connected: relaysStatus.filter((relay) => relay.connected).length,
      total: relaysStatus.length,
    };
  }, [relaysStatus]);

  useEffect(() => {
    try {
      setTempUserRelays(userAllRelays);
      setRelaysStatus(
        userAllRelays.map((item) => {
          return { url: item.url, connected: false };
        })
      );
    } catch (err) {
      console.log(err);
    }
  }, [userAllRelays]);

  useEffect(() => {
    const CheckRelays = async () => {
      try {
        let res = await Promise.all(
          tempUserRelays.map(async (relay, index) => {
            let isRelay = ndkInstance.pool.getRelay(relay.url);
            if (isRelay) {
              return { url: relay.url, connected: isRelay.connected };
            } else {
              let tempNDK = new NDK({ explicitRelayUrls: [relay.url] });
              await tempNDK.connect(2000);
              let relayStatus = tempNDK.pool.getRelay(relay.url);
              return { url: relay.url, connected: relayStatus.connected };
            }
          })
        );
        setRelaysStatus(res);
      } catch (err) {}
    };

    if (tempUserRelays) CheckRelays();
  }, [tempUserRelays]);

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
    saveInKind10002();
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

  return (
    <div className="fit-container box-pad-h-m fx-shrink">
      <div
        className="fit-container sc-s-18 bg-sp"
        style={{ overflow: "visible" }}
      >
        <div className="fx-centered fx-end-h fx-start-v fit-container box-pad-h-s box-pad-v-s">
          <RelaysPicker
            allRelays={allRelays}
            userAllRelays={tempUserRelays}
            addRelay={addRelay}
          />
          <button
            className={`btn ${
              JSON.stringify(userAllRelays) !== JSON.stringify(tempUserRelays)
                ? "btn-normal"
                : "btn-disabled"
            }`}
            onClick={saveRelays}
            disabled={
              JSON.stringify(userAllRelays) === JSON.stringify(tempUserRelays)
            }
          >
            {t("AZWpmir")}
          </button>
        </div>
        <hr />
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
                relay.read && relay.write ? "" : relay.read ? "read" : "write";
              return (
                <div
                  key={`${relay}-${index}`}
                  className="fit-container fx-centered fx-col fx-shrink  box-pad-h-s box-pad-v-s"
                  style={{
                    overflow: "visible",
                    backgroundColor: relay.toDelete ? "var(--red-side)" : "",
                    borderBottom: "1px solid var(--very-dim-gray)",
                    gap: "10px",
                  }}
                >
                  <div className="fx-scattered fit-container box-pad-h-s ">
                    <div
                      className="fx-centered option"
                      style={{
                        border: "none",
                        backgroundColor: "transparent",
                      }}
                      onClick={() => setShowRelaysInfo(relay.url)}
                    >
                      <div
                        style={{
                          minWidth: "6px",
                          aspectRatio: "1/1",
                          borderRadius: "50%",
                          backgroundColor: connectedRelays?.relaysStatus[
                            relay.url
                          ]
                            ? "var(--green-main)"
                            : "var(--red-main)",
                        }}
                      ></div>
                      <RelayImage url={relay.url} />
                      <p>{relay.url}</p>
                      <div
                        className="info-tt"
                        style={{
                          filter: "brightness(0) invert()",
                          rotate: "180deg",
                          opacity: 0.9,
                        }}
                      ></div>
                    </div>
                    <div>
                      {!relay.toDelete && (
                        <div
                          onClick={() => removeRelayFromList(false, index)}
                          className="round-icon-small"
                        >
                          <div className="logout-red"></div>
                        </div>
                      )}
                      {relay.toDelete && (
                        <div
                          onClick={() => removeRelayFromList(true, index)}
                          className="round-icon-small"
                        >
                          <div className="undo"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!relay.toDelete && (
                    <div className="fit-container fx-centered fx-start-h box-pad-h-m ">
                      <button
                        style={{
                          opacity: status === "read" ? 1 : 0.4,
                        }}
                        className={"btn btn-small btn-gray"}
                        onClick={() => changeRelayStatus("read", index)}
                      >
                        {t("AANojFe")}
                      </button>
                      <button
                        style={{
                          opacity: status === "write" ? 1 : 0.4,
                        }}
                        className={"btn btn-small btn-gray"}
                        onClick={() => changeRelayStatus("write", index)}
                      >
                        {t("AHG1OTt")}
                      </button>
                      <button
                        style={{
                          opacity: status === "" ? 1 : 0.4,
                        }}
                        className={"btn btn-small btn-gray"}
                        onClick={() => changeRelayStatus("", index)}
                      >
                        {t("AvnTmjx")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const InboxRelays = ({ setShowRelaysInfo, allRelays }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const userInboxRelays = useSelector((state) => state.userInboxRelays);
  const relaysContainer = useRef(null);
  const [inboxRelaysStatus, setInboxRelaysStatus] = useState([]);
  const [tempUserRelays, setTempUserRelays] = useState([]);
  const currentUserRelays = useMemo(() => {
    return userInboxRelays.map((_) => {
      return { url: _ };
    });
  }, [userInboxRelays]);
  const suggestedRelays = useMemo(() => {
    let relays = [
      "wss://relay.damus.io",
      "wss://nostr-01.yakihonne.com",
      "wss://relay.0xchat.com",
    ];
    if (tempUserRelays.length === 0) return relays;
    return relays.filter((relay) => {
      return !tempUserRelays.some((item) => item.url === relay);
    });
  }, [tempUserRelays]);
  const connectedRelays = useMemo(() => {
    return {
      relaysStatus: inboxRelaysStatus.reduce((acc, relay) => {
        acc[relay.url] = relay.connected;
        return acc;
      }, {}),
      connected: inboxRelaysStatus.filter((relay) => relay.connected).length,
      total: inboxRelaysStatus.length,
    };
  }, [inboxRelaysStatus]);

  useEffect(() => {
    try {
      setTempUserRelays(userInboxRelays.map((_) => ({ url: _ })));
      setInboxRelaysStatus(
        userInboxRelays.map((item) => {
          return { url: item, connected: false };
        })
      );
    } catch (err) {
      console.log(err);
    }
  }, [userInboxRelays]);

  useEffect(() => {
    const CheckRelays = async () => {
      try {
        let res = await Promise.all(
          tempUserRelays.map(async (relay, index) => {
            let isRelay = ndkInstance.pool.getRelay(relay.url);
            if (isRelay) {
              return { url: relay.url, connected: isRelay.connected };
            } else {
              let tempNDK = new NDK({ explicitRelayUrls: [relay.url] });
              await tempNDK.connect(2000);
              let relayStatus = tempNDK.pool.getRelay(relay.url);
              return { url: relay.url, connected: relayStatus.connected };
            }
          })
        );
        setInboxRelaysStatus(res);
      } catch (err) {}
    };

    if (tempUserRelays) CheckRelays();
  }, [tempUserRelays]);

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
    let relaysList = tempUserRelays
      .filter((_) => !_.toDelete)
      .map((_) => _.url);
    let tags = relaysList.map((url) => ["relay", url]);
    let event = {
      kind: 10050,
      content: "",
      tags,
    };
    event = await InitEvent(event.kind, event.content, event.tags);
    if (!event) return;
    dispatch(
      setToPublish({
        eventInitEx: event,
      })
    );
  };

  const addRelay = (url) => {
    setTempUserRelays((prev) => {
      let isThere = prev.find((relay) => relay.url === url);
      if (!isThere) return [{ url, read: true, write: true }, ...prev];
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

  return (
    <div className="fit-container box-pad-h-m fx-shrink">
      <div
        className="fit-container sc-s-18 bg-sp"
        style={{ overflow: "visible" }}
      >
        {/* <div className="fx-scattered box-pad-h-m box-pad-v-s">
                <p className="c1-c">Private messages relays</p>
              </div>
              <hr /> */}
        <div className="fx-centered fx-end-h fx-start-v  fit-container box-pad-h-s box-pad-v-s">
          <RelaysPicker
            allRelays={allRelays}
            userAllRelays={tempUserRelays}
            addRelay={addRelay}
          />
          <button
            className={`btn ${
              JSON.stringify(currentUserRelays) !==
              JSON.stringify(tempUserRelays)
                ? "btn-normal"
                : "btn-disabled"
            }`}
            onClick={saveRelays}
            disabled={
              JSON.stringify(currentUserRelays) ===
              JSON.stringify(tempUserRelays)
            }
          >
            {t("AZWpmir")}
          </button>
        </div>
        <hr />
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
              return (
                <div
                  key={`${relay}-${index}`}
                  className="fit-container fx-centered fx-col fx-shrink  box-pad-h-s box-pad-v-s"
                  style={{
                    overflow: "visible",
                    backgroundColor: relay.toDelete ? "var(--red-side)" : "",
                    borderBottom:
                      index !== tempUserRelays.length - 1
                        ? "1px solid var(--very-dim-gray)"
                        : "",
                    gap: "10px",
                  }}
                >
                  <div className="fx-scattered fit-container box-pad-h-s ">
                    <div
                      className="fx-centered option"
                      style={{
                        border: "none",
                        backgroundColor: "transparent",
                      }}
                      onClick={() => setShowRelaysInfo(relay.url)}
                    >
                      <div
                        style={{
                          minWidth: "6px",
                          aspectRatio: "1/1",
                          borderRadius: "50%",
                          backgroundColor: connectedRelays?.relaysStatus[
                            relay.url
                          ]
                            ? "var(--green-main)"
                            : "var(--red-main)",
                        }}
                      ></div>
                      <RelayImage url={relay.url} />
                      <p>{relay.url}</p>
                      <div
                        className="info-tt"
                        style={{
                          filter: "brightness(0) invert()",
                          opacity: 0.5,
                        }}
                      ></div>
                    </div>
                    <div>
                      {!relay.toDelete && (
                        <div
                          onClick={() => removeRelayFromList(false, index)}
                          className="round-icon-small"
                        >
                          <div className="logout-red"></div>
                        </div>
                      )}
                      {relay.toDelete && (
                        <div
                          onClick={() => removeRelayFromList(true, index)}
                          className="round-icon-small"
                        >
                          <div className="undo"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {suggestedRelays.length > 0 && (
          <div className="fx-centered fx-col fit-container box-pad-h-s box-pad-v-s fx-start-v fx-start-h">
            {tempUserRelays.length === 0 && (
              <p className="gray-c box-pad-v-s p-italic">{t("AR04C4C")}</p>
            )}

            <p>{t("AoO5zem")}</p>
            {suggestedRelays.map((relay, index) => {
              return (
                <div
                  className="fx-scattered fit-container box-pad-v-s option"
                  style={{
                    borderBottom:
                      index !== suggestedRelays.length - 1
                        ? "1px solid var(--very-dim-gray)"
                        : "",
                  }}
                  key={index}
                  onClick={() => addRelay(relay)}
                >
                  <div className="fx-centered">
                    <RelayImage url={relay} />
                    <p>{relay}</p>
                  </div>
                  <div className="sticker sticker-gray-black">
                    {t("ARWeWgJ")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const MutedList = ({ exit }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
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
        className="box-pad-h-m box-pad-v-m sc-s-18 bg-sp"
        style={{ width: "min(100%, 500px)", position: "relative" }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        {userMutedList.length > 0 && (
          <h4 className="p-centered box-marg-s">{t("AX2OYcg")}</h4>
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
            <p>{t("ACzeK4g")}</p>
            <p className="gray-c p-medium p-centered">{t("Ap5S8lY")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DeletionPopUp = ({ exit, handleDelete, wallet }) => {
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
            backgroundColor: "var(--red-main)",
          }}
        >
          <div className="warning"></div>
        </div>
        <h3 className="p-centered">{t("APJU882")}</h3>
        <p className="p-centered gray-c box-pad-v-s">{t("AOlHR1d")}</p>
        <div
          className={"fx-scattered if pointer fit-container dashed-onH"}
          style={{ borderStyle: "dashed" }}
          onClick={() => copyText(wallet.data, t("A6Pj02S"))}
        >
          <p>{shortenKey(wallet.data, 20)}</p>
          <div className="copy-24"></div>
        </div>
        <div className="fx-centered fit-container">
          <button className="fx btn btn-gst-red" onClick={handleDelete}>
            {t("Almq94P")}
          </button>
          <button className="fx btn btn-red" onClick={exit}>
            {t("AB4BSCe")}
          </button>
        </div>
      </section>
    </section>
  );
};

const RelaysInfo = ({ url, exit }) => {
  const { t } = useTranslation();
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
        className="sc-s-18 bg-sp box-pad-h box-pad-v"
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
                <p>{t("AD6LbxW")}</p>
                <div className="fx-centered">
                  {relayInfo.owner && (
                    <p>
                      {relayInfo.owner.display_name || relayInfo.owner.name}
                    </p>
                  )}
                  {!relayInfo.owner && <p>N/A</p>}
                  {relayInfo.owner && (
                    <UserProfilePic
                      img={relayInfo.owner.picture}
                      size={24}
                      mainAccountUser={false}
                      user_id={relayInfo.pubkey}
                    />
                  )}
                </div>
              </div>
              <hr />
              <div className="fx-scattered fit-container">
                <p style={{ minWidth: "max-content" }}>{t("ADSorr1")}</p>
                <p className="p-one-line">{relayInfo.contact || "N/A"}</p>
              </div>
              <hr />
              <div className="fx-scattered fit-container">
                <p>{t("AY2x8jS")}</p>
                <p>{relayInfo.software.split("/")[4]}</p>
              </div>
              <hr />
              <div className="fx-scattered fit-container">
                <p>{t("ARDY1XM")}</p>
                <p>{relayInfo.version}</p>
              </div>
              <hr />
            </div>
            <div className="box-pad-v-m fx-centered fx-col">
              <p className="gray-c p-centered p-medium box-marg-s">
                {t("AVabTbf")}
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

const MediaUploader = ({ exit }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userBlossomServers = useSelector((state) => state.userBlossomServers);
  const [selectedTab, setSelectedTab] = useState("0");
  const [mirrorOption, setMirrorOption] = useState(
    localStorage?.getItem(`${userKeys.pub}_mirror_blossom_servers`)
  );
  const [selectedService, setSelectedService] = useState(
    ["1", "2"].includes(localStorage?.getItem(`${userKeys.pub}_media_service`))
      ? localStorage?.getItem(`${userKeys.pub}_media_service`)
      : "1"
  );
  const [mediaUploader, setMediaUploader] = useState(getMediaUploader());
  const [selectedMediaServer, setSelectedMediaServer] = useState(
    getSelectedServer() || mediaUploader[0].value
  );
  const [isLoading, setIsLoading] = useState(false);
  const [customServer, setCustomServer] = useState(false);
  const [blossomCustomServer, setBlossomCustomServer] = useState(false);
  const [serversTodelete, setServersToDelete] = useState([]);

  const mediaServices = [
    {
      display_name: t("ATCstom"),
      value: "1",
    },
    {
      display_name:
        userBlossomServers.length === 0 ? t("A3Ok2VN") : t("A0n1wDK"),
      value: "2",
      disabled: userBlossomServers.length === 0,
    },
  ];

  useEffect(() => {
    if (selectedService === "2" && userBlossomServers.length === 0) {
      handleSelectMediaService("1");
    }
  }, [userBlossomServers]);

  const handleSelectMediaService = (value) => {
    if (value === "1") {
      localStorage?.setItem(`${userKeys.pub}_media_service`, "1");
      setSelectedService(value);
    }
    if (value === "2" && userBlossomServers.length > 0) {
      localStorage?.setItem(`${userKeys.pub}_media_service`, "2");
      setSelectedService(value);
    }
  };

  const getMediaUploaderFinalList = () => {
    let tempServersURLs = MediaUploaderServer.map((s) => s[1]);

    let tempArray = mediaUploader.map((s) => {
      return {
        ...s,
        right_el: !tempServersURLs.includes(s.value) ? (
          <div
            className="round-icon-small"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveServer(s.value);
            }}
          >
            <p className="red-c">&minus;</p>
          </div>
        ) : null,
      };
    });
    return tempArray;
  };

  const addNewServer = async () => {
    if (!customServer) return;
    setIsLoading(true);
    try {
      const test = await axios.post(customServer);
      dispatch(
        setToast({
          type: 2,
          desc: t("AQIc1lO"),
        })
      );
      setIsLoading(false);
    } catch (err) {
      if (err.response.status === 404) {
        dispatch(
          setToast({
            type: 2,
            desc: t("AQIc1lO"),
          })
        );
        setIsLoading(false);
        return;
      }
      let domain = customServer.split("/")[2];

      setSelectedMediaServer(customServer);
      let checkExistance = mediaUploader.find((_) => _.display_name === domain);
      if (!checkExistance) {
        updateMediaUploader([domain, customServer], customServer);
        setMediaUploader(getMediaUploader());
      } else {
        updateMediaUploader(undefined, customServer);
      }
      setCustomServer(false);
      setIsLoading(false);
    }
  };

  const handleRemoveServer = (server) => {
    let tempServersURLs = MediaUploaderServer.map((s) => s[1]);
    let tempArray = mediaUploader
      .filter((s) => s.value !== server && !tempServersURLs.includes(s.value))
      .map((_) => [_.display_name, _.value]);
    replaceMediaUploader(
      tempArray,
      selectedMediaServer === server
        ? mediaUploader[0].value
        : selectedMediaServer
    );
    setMediaUploader(getMediaUploader());
  };
  const handleSwitchMediaServer = (server) => {
    setSelectedMediaServer(server);
    updateMediaUploader(undefined, server);
  };

  const handleMirrorServers = () => {
    if (mirrorOption) {
      setMirrorOption(false);
      localStorage?.removeItem(`${userKeys.pub}_mirror_blossom_servers`);
    }
    if (!mirrorOption) {
      setMirrorOption(true);
      localStorage?.setItem(
        `${userKeys.pub}_mirror_blossom_servers`,
        `${Date.now()}`
      );
    }
  };

  const removeServersFromBlossomList = async () => {
    try {
      const event = {
        kind: 10063,
        content: "",
        tags: [
          ...userBlossomServers
            .filter((_) => !serversTodelete.includes(_))
            .map((url) => ["server", url]),
        ],
      };
      const eventInitEx = await InitEvent(
        event.kind,
        event.content,
        event.tags
      );
      dispatch(
        setToPublish({
          eventInitEx,
          allRelays: [],
        })
      );
      setServersToDelete([]);
    } catch (_) {
      return false;
    }
  };

  const selectMainServer = async (server) => {
    try {
      const event = {
        kind: 10063,
        content: "",
        tags: [
          ...[...new Set([server, ...userBlossomServers])].map((url) => [
            "server",
            url,
          ]),
        ],
      };
      const eventInitEx = await InitEvent(
        event.kind,
        event.content,
        event.tags
      );
      dispatch(
        setToPublish({
          eventInitEx,
          allRelays: [],
        })
      );
      setServersToDelete([]);
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="fixed-container fx-centered box-pad-h">
      <div
        className="box-pad-h-m box-pad-v-m sc-s-18 bg-sp"
        style={{
          width: "min(100%, 500px)",
          position: "relative",

          overflow: "visible",
        }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <h4 className="box-marg-s">{t("A1XtC0x")}</h4>

        <div className="fx-centered fx-col fit-container fx-start-v fx-start-h">
          <div className="fit-container fx-scattered">
            <p>{t("AgZ9mO1")}</p>
            <Select
              options={mediaServices}
              value={selectedService}
              setSelectedValue={handleSelectMediaService}
            />
          </div>
          <hr />
          <p>{t("ABtsLBp")}</p>
          <div
            className="sc-s-18 bg-sp fx-centered fx-col fx-start-h fx-start-v fit-container box-pad-h-m box-pad-v-m option pointer"
            style={{ overflow: "visible" }}
          >
            <div
              className="fit-container fx-scattered"
              onClick={() => setSelectedTab("1")}
            >
              <p className="gray-c">{t("ATCstom")}</p>
              <div className="arrow"></div>
            </div>

            {selectedTab === "1" && (
              <div className="fit-container">
                <div className="fx-scattered fit-container">
                  <p>{t("AjCVBmz")}</p>

                  <div className="fx-centered">
                    {customServer === false && (
                      <Select
                        options={getMediaUploaderFinalList()}
                        value={selectedMediaServer}
                        setSelectedValue={handleSwitchMediaServer}
                      />
                    )}
                    {customServer === false && (
                      <div
                        className="round-icon-small round-icon-tooltip"
                        data-tooltip={t("ALyj7Li")}
                        onClick={() => setCustomServer("")}
                      >
                        <div className="plus-sign"></div>
                      </div>
                    )}
                    {customServer !== false && (
                      <div
                        className="round-icon-small"
                        onClick={() => setCustomServer(false)}
                        style={{
                          borderColor: "var(--red-main)",
                        }}
                      >
                        <p className="red-c">-</p>
                      </div>
                    )}
                  </div>
                </div>
                {customServer !== false && (
                  <div
                    className="fx-centered fit-container slide-down box-pad-v-s"
                    style={{
                      borderBottom: "1px solid var(--very-dim-gray)",
                    }}
                  >
                    <input
                      type="text"
                      placeholder={t("A8PtjSa")}
                      className="if ifs-full"
                      style={{ height: "40px" }}
                      value={customServer}
                      onChange={(e) => setCustomServer(e.target.value)}
                    />
                    <button
                      className="btn btn-normal"
                      style={{ minWidth: "max-content" }}
                      onClick={addNewServer}
                      disabled={isLoading}
                    >
                      {isLoading ? <LoadingDots /> : t("ALyj7Li")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div
            className="sc-s-18 bg-sp fx-centered fx-col fx-start-h fx-start-v fit-container box-pad-h-m box-pad-v-m option pointer"
            style={{ overflow: "scroll", maxHeight: "300px" }}
          >
            <div
              className="fit-container fx-scattered"
              onClick={() => setSelectedTab("2")}
            >
              <p className="gray-c">{t("A0n1wDK")}</p>
              <div className="arrow"></div>
            </div>

            {selectedTab === "2" && (
              <div className="fit-container fx-centered">
                <div className="fx-centered fx-col fx-start-h fx-start-v fit-container">
                  <div className="fit-container fx-scattered">
                    <p>{t("AoA6v9d")}</p>
                    <Toggle
                      status={mirrorOption}
                      setStatus={handleMirrorServers}
                    />
                  </div>
                  {userBlossomServers.length > 0 && (
                    <>
                      <p>{t("As9gwde")}</p>
                      <div className="fit-container fx-scattered">
                        <p className="green-c">{userBlossomServers[0]}</p>
                        <div
                          style={{
                            minWidth: "6px",
                            aspectRatio: "1/1",
                            borderRadius: "50%",
                            backgroundColor: "var(--green-main)",
                          }}
                        ></div>
                      </div>
                    </>
                  )}
                  <div className="fit-container fx-scattered">
                    <p>{t("At4Hrf6")}</p>
                    <div className="fx-centered">
                      {serversTodelete.length > 0 && (
                        <button
                          className="btn btn-normal btn-small slide-right"
                          onClick={removeServersFromBlossomList}
                        >
                          {t("A29aBCD")}
                        </button>
                      )}
                      {!blossomCustomServer && (
                        <div
                          className="round-icon-small round-icon-tooltip"
                          data-tooltip={t("ALyj7Li")}
                          onClick={() => setBlossomCustomServer(true)}
                        >
                          <div className="plus-sign"></div>
                        </div>
                      )}
                      {blossomCustomServer && (
                        <div
                          className="round-icon-small"
                          onClick={() => setBlossomCustomServer(false)}
                          style={{
                            borderColor: "var(--red-main)",
                          }}
                        >
                          <p className="red-c">-</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {blossomCustomServer && (
                    <AddBlossomServer
                      exit={() => setBlossomCustomServer(false)}
                    />
                  )}
                  {userBlossomServers.map((_, index) => {
                    let status = serversTodelete.includes(_);
                    return (
                      <div className="fit-container fx-scattered" key={index}>
                        <p className={index === 0 ? "green-c" : "gray-c"}>
                          {_}
                        </p>
                        <div className="fx-centered">
                          {index !== 0 && (
                            <button
                              className="btn btn-small btn-gst"
                              onClick={() => selectMainServer(_)}
                            >
                              {t("AYpApBJ")}
                            </button>
                          )}
                          {status && (
                            <div
                              className="round-icon-small"
                              onClick={() =>
                                setServersToDelete((prev) =>
                                  prev.filter((__) => __ !== _)
                                )
                              }
                            >
                              <div className="undo"></div>
                            </div>
                          )}
                          {!status && (
                            <div
                              className="round-icon-small round-icon-tooltip"
                              data-tooltip={t("AzkTxuy")}
                              onClick={() =>
                                setServersToDelete((prev) => [...prev, _])
                              }
                            >
                              <div className="trash"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {userBlossomServers.length === 0 && (
                    <p className="p-italic gray-c">{t("AHFsFp7")}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AddBlossomServer = ({ exit }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const userBlossomServers = useSelector((state) => state.userBlossomServers);
  const [customServer, setCustomServer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addNewServer = async () => {
    if (!customServer) return;
    try {
      new URL(customServer);
      setIsLoading(true);
      const event = {
        kind: 10063,
        content: "",
        tags: [
          ...[...new Set([...userBlossomServers, customServer])].map((url) => [
            "server",
            url,
          ]),
        ],
      };
      const eventInitEx = await InitEvent(
        event.kind,
        event.content,
        event.tags
      );
      dispatch(
        setToPublish({
          eventInitEx,
          allRelays: [],
        })
      );
      setIsLoading(false);
      exit();
    } catch (_) {
      dispatch(
        setToast({
          type: 2,
          desc: t("A2l1JgC"),
        })
      );
      setIsLoading(false);
      return false;
    }
  };

  return (
    <div className=" fit-container">
      <div className="fx-centered fit-container slide-down">
        <input
          type="text"
          placeholder={t("A8PtjSa")}
          className="if ifs-full"
          style={{ height: "40px" }}
          value={customServer}
          onChange={(e) => setCustomServer(e.target.value)}
        />
        <button
          className="btn btn-normal"
          style={{ minWidth: "max-content" }}
          onClick={addNewServer}
          disabled={isLoading}
        >
          {isLoading ? <LoadingDots /> : t("ALyj7Li")}
        </button>
      </div>
    </div>
  );
};

const AddNewTranslationService = ({
  services,
  exit,
  refreshServices,
  userKeys,
}) => {
  const ref = nanoid();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [customService, setCustomService] = useState("");
  const [transServicePlan, setTransServicePlan] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const transServicesPlans = [
    {
      display_name: t("AT4BU58"),
      value: false,
    },
    {
      display_name: t("AEWXA75"),
      value: true,
    },
  ];
  const addNewServer = () => {
    let REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (!REGEX.test(customService)) {
      dispatch(
        setToast({
          type: 2,
          desc: t("A2l1JgC"),
        })
      );
      return;
    }
    const domain =
      customService.split("//")[0] + "//" + customService.split("/")[2];
    const label = customService.split("/")[2];
    const id = `custom-${ref}`;
    let service = {
      id,
      apiKey,
      free: !transServicePlan ? customService : "",
      pro: transServicePlan ? customService : "",
      plans: transServicePlan,
      url: domain,
      label,
    };
    let allServices = { ...services, [id]: service };
    refreshServices({ allServices, newService: service });
    localStorage?.setItem(
      `custom-lang-services-${userKeys.pub}`,
      JSON.stringify(allServices)
    );
  };

  return (
    <div className="fixed-container fx-centered box-pad-h box-pad-v">
      <div
        className="fx-centered fx-col sc-s-18 bg-sp box-pad-h box-pad-v slide-down"
        style={{ width: "min(100%, 400px)", overflow: "visible" }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <h4 className="p-centered">{t("AKYcP6g")}</h4>
        <input
          type="text"
          placeholder={t("A8PtjSa")}
          className="if ifs-full"
          style={{ height: "40px" }}
          value={customService}
          onChange={(e) => setCustomService(e.target.value)}
        />
        <div className="fit-container fx-scattered">
          <input
            type="text"
            placeholder={t("AMbIPen")}
            className={`if ifs-full`}
            style={{ height: "40px" }}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Select
            options={transServicesPlans}
            value={transServicePlan}
            setSelectedValue={setTransServicePlan}
          />
        </div>

        <button
          className="btn btn-normal btn-full"
          style={{ minWidth: "max-content" }}
          onClick={addNewServer}
        >
          {t("ALyj7Li")}
        </button>
      </div>
    </div>
  );
};
