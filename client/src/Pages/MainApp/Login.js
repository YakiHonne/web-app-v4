import React, { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoadingDots from "../../Components/LoadingDots";
import { getUser, getUserFromNOSTR } from "../../Helpers/Controlers";
import { setUserKeys } from "../../Store/Slides/UserData";
import {
  bytesTohex,
  getEmptyuserMetadata,
  getHex,
} from "../../Helpers/Encryptions";
import profilePlaceholder from "../../media/images/profile-avatar.png";
import s8e from "../../media/images/s8-e-yma.png";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import * as secp from "@noble/secp256k1";
import { FileUpload, getWallets, updateWallets } from "../../Helpers/Helpers";
import { setToast } from "../../Store/Slides/Publishers";
import ymaHero from "../../media/images/login-yma-hero.png";
import ymaQR from "../../media/images/yma-qr.png";
import { useNavigate } from "react-router-dom";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import InterestSuggestions from "../../Content/InterestSuggestions";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { saveUsers } from "../../Helpers/DB";
import axios from "axios";
import { NDKEvent, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import relaysOnPlatform from "../../Content/Relays";
import { FilePicker } from "../../Components/FilePicker";
import { customHistory } from "../../Helpers/History";
import LoadingLogo from "../../Components/LoadingLogo";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

let stepsNumber = 4;
let isNewAccount = getWallets().length > 0 ? true : false;
export default function Login() {
  const { t } = useTranslation();
  let sk = bytesTohex(generateSecretKey());
  let pk = getPublicKey(sk);
  let userKeys = { pub: pk, sec: sk };
  const [isLogin, setIsLogin] = useState(true);
  useEffect(() => {
    let pubkeys = [
      ...new Set(
        InterestSuggestions.map((interest) => interest.pubkeys).flat()
      ),
    ].map((pubkey) => {
      return getHex(pubkey);
    });
    saveUsers(pubkeys);
  }, []);

  return (
    <div
      className="fit-container fx-centered"
      style={{ height: "100vh", gap: 0 }}
    >
      <LeftSection />
      <div
        className="fx-centered fx-col box-pad-h"
        style={{ width: "min(100%,500px)" }}
      >
        <div className="box-marg-s">
          {isLogin && <h3 className="slide-up">{t("AITU9z0")}</h3>}
          {!isLogin && <h3 className="slide-down">{t("AHAtW4X")}</h3>}
        </div>
        {isLogin && (
          <LoginScreen
            switchScreen={() => setIsLogin(!isLogin)}
            userKeys={userKeys}
          />
        )}

        {!isLogin && (
          <SignupScreen
            switchScreen={() => setIsLogin(!isLogin)}
            userKeys={userKeys}
          />
        )}
      </div>
    </div>
  );
}

const LeftSection = () => {
  return (
    <div
      style={{ height: "70vh", width: "700px" }}
      className="box-pad-h box-pad-v fx-centered mb-hide-800 "
    >
      <MobileAd />
    </div>
  );
};

const LoginScreen = ({ switchScreen, userKeys }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [key, setKey] = useState("");
  const [checkExt, setCheckExt] = useState(window.nostr ? true : false);
  const [isLoading, setIsLoading] = useState(false);

  const onLogin = async (inputKey) => {
    if (!inputKey) return;
    setIsLoading(true);
    if (inputKey.startsWith("npub")) {
      try {
        let hex = getHex(inputKey);
        let user = await getUserFromNOSTR(hex);
        if (user) {
          let keys = {
            pub: hex,
          };
          dispatch(setUserKeys(keys));
        }
        setIsLoading(false);
        customHistory.back();
        return;
      } catch (err) {
        setIsLoading(false);
        dispatch(
          setToast({
            type: 2,
            desc: t("AiHLMRi"),
          })
        );
      }
    }
    if (inputKey.startsWith("nsec")) {
      try {
        let hex = getHex(inputKey);
        if (secp.utils.isValidPrivateKey(hex)) {
          let user = await getUserFromNOSTR(getPublicKey(hex));
          if (user) {
            let keys = {
              sec: hex,
              pub: getPublicKey(hex),
            };

            dispatch(setUserKeys(keys));
          }
          setIsLoading(false);

          customHistory.back();
          return;
        }
      } catch (err) {
        setIsLoading(false);
        dispatch(
          setToast({
            type: 2,
            desc: t("AC5ByUA"),
          })
        );
      }
    }
    if (secp.utils.isValidPrivateKey(inputKey)) {
      let user = await getUserFromNOSTR(getPublicKey(inputKey));
      if (user) {
        let keys = {
          sec: inputKey,
          pub: getPublicKey(inputKey),
        };

        dispatch(setUserKeys(keys));
      }
      setIsLoading(false);

      customHistory.back();
      return;
    }
    setIsLoading(false);
    dispatch(
      setToast({
        type: 2,
        desc: t("AC5ByUA"),
      })
    );
  };
  const onLoginWithExt = async () => {
    try {
      setIsLoading(true);

      let key = await window.nostr.getPublicKey();
      let keys = {
        pub: key,
        ext: true,
      };
      let extWallet = [
        {
          id: Date.now(),
          kind: 1,
          entitle: "WebLN",
          active: true,
          data: "",
        },
      ];
      let wallet = updateWallets(extWallet, keys.pub);
      console.log(wallet);
      if (wallet.length > 0) dispatch(setUserKeys(keys));

      // }
      setIsLoading(false);

      customHistory.back();
      return;
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      dispatch(
        setToast({
          type: 2,
          desc: t("AiHLMRi"),
        })
      );
    }
  };

  return (
    <>
      <div className="fit-container slide-left">
        <input
          type="text"
          className="if ifs-full box-marg-s"
          placeholder="npub, nsec, hex"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />

        <div className="fx-centered fx-col fit-container">
          <button
            className="btn btn-normal btn-full"
            onClick={() => onLogin(key)}
          >
            {isLoading ? <LoadingDots /> : <>{t("AmOtzoL")}</>}
          </button>
          {checkExt && (
            <>
              <p>{t("Ax46s4g")}</p>
              <button
                className="btn btn-gst btn-full"
                disabled={!checkExt}
                onClick={onLoginWithExt}
              >
                {isLoading ? <LoadingDots /> : <>{t("AgG7T1H")}</>}
              </button>
            </>
          )}
          {!checkExt && (
            <button className="btn btn-disabled btn-full" disabled={true}>
              <>{t("AgG7T1H")}</>
            </button>
          )}
        </div>
        <div className="fit-container  box-pad-v-m fx-scattered">
          <div className="fx-centered pointer">
            <div className="round-icon-small">
              <div className="arrow arrow-back" ></div>{" "}
            </div>
            <p className="gray-c" onClick={() => customHistory.back()}>
              {isNewAccount ? t("AB4BSCe") : t("AVCdQku")}
            </p>
          </div>
          <div className=" fx-centered" onClick={switchScreen}>
            <p className="gray-c">
              <span className="orange-c pointer p-bold">{t("AHXrr4Y")}</span>{" "}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const SignupScreen = ({ switchScreen, userKeys }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [pictureFile, setPictureFile] = useState("");
  const [picture, setPicture] = useState("");
  const [bannerFile, setBannerFile] = useState("");
  const [banner, setBanner] = useState("");
  const [NWCURL, setNWCURL] = useState("");
  const [NWAddr, setNWCAddr] = useState("");
  const [isCreatingWalletLoading, setIsCreatingWalletLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedInterest, setSelectedInteres] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);

  const handleNextSteps = () => {
    if (step == 1) {
      if (!name) {
        dispatch(
          setToast({
            type: 2,
            desc: t("AdrCWCj"),
          })
        );
        return;
      }
      setStep(2);
      return;
    }
    if (step == 2) {
      setStep(3);
      return;
    }
    if (step == 3) {
      setStep(4);
      return;
    }
  };
  const handlePrevSteps = () => {
    if (step == 4) {
      setStep(3);
      return;
    }
    if (step == 3) {
      setStep(2);
      return;
    }
    if (step == 2) {
      setStep(1);
      return;
    }
  };
  const handleSelectedInterest = (index) => {
    if (index === selectedInterest) setSelectedInteres(false);
    else setSelectedInteres(index);
  };
  const handleSelectInterests = (data) => {
    if (!data) return;
    let index = selectedInterests.findIndex(
      (interest) => interest.tag === data.tag
    );

    let tempArray = Array.from(selectedInterests);
    if (index !== -1) {
      if (data.pubkeys.length > 0) {
        tempArray[index].pubkeys = data.pubkeys;
        setSelectedInterests(tempArray);
      }
      if (data.pubkeys.length === 0) {
        tempArray = tempArray.splice(index, 0);
        setSelectedInterests(tempArray);
      }
    }
    if (index === -1) {
      tempArray.push(data);
      setSelectedInterests(tempArray);
    }
  };
  const handleCreateWallet = async () => {
    try {
      setIsCreatingWalletLoading(true);
      let url = await axios.post("https://wallet.yakihonne.com/api/wallets");

      setNWCURL(url.data.connectionSecret);
      setNWCAddr(url.data.lightningAddress);
      setIsCreatingWalletLoading(false);
    } catch (err) {
      console.log(err);
      setIsCreatingWalletLoading(false);
      dispatch(
        setToast({
          type: 3,
          desc: t("AQ12OQz"),
        })
      );
    }
  };

  const initializeAccount = async () => {
    try {
      setStep(5);
      let picture_ = pictureFile
        ? await FileUpload(pictureFile, undefined, userKeys)
        : "";
      if (picture_ === false) {
        dispatch(
          setToast({
            type: 2,
            desc: t("AfM6xbs"),
          })
        );
        setStep(4);

        return;
      }
      let banner_ = bannerFile
        ? await FileUpload(bannerFile, undefined, userKeys)
        : "";
      if (banner_ === false) {
        dispatch(
          setToast({
            type: 2,
            desc: t("AnmPNHc"),
          })
        );

        setStep(4);
        return;
      }

      dispatch(setUserKeys(userKeys));

      let signer = new NDKPrivateKeySigner(userKeys.sec);
      ndkInstance.signer = signer;

      await Promise.all([
        warmup(),
        metadataEvent(picture_, banner_),
        interestsEvents(),
        relaysEvent(),
      ]);

      if (NWAddr) {
        let nwcNode = {
          id: Date.now(),
          kind: 3,
          entitle: NWAddr,
          active: true,
          data: NWCURL,
        };
        updateWallets([nwcNode], userKeys.pub);
      }
      customHistory.back();
    } catch (err) {
      console.log(err);
      setStep(4);
    }
  };

  const warmup = () => {
    const tempEvent = new NDKEvent(ndkInstance);
    tempEvent.kind = 0;
    tempEvent.content = "";
    tempEvent.publish();
    return;
  };
  const metadataEvent = async (profilePicture, bannerPicture) => {
    try {
      const ndkEvent = new NDKEvent(ndkInstance);
      let metadata = {};

      metadata.display_name = name;
      metadata.name = name;
      metadata.about = about;
      metadata.picture = profilePicture || "";
      metadata.banner = bannerPicture || "";
      if (NWAddr) metadata.lud16 = NWAddr;
      ndkEvent.kind = 0;
      ndkEvent.content = JSON.stringify(metadata);

      let published = await ndkEvent.publish(undefined, 2000);

      return ndkEvent;
    } catch (err) {
      console.log(err);
      return;
    }
  };

  const interestsEvents = async () => {
    if (selectedInterests.length === 0) return;
    let published = await Promise.all([
      await tagsEvent(),
      await followingsEvent(),
    ]);
    return;
  };

  const tagsEvent = async () => {
    try {
      let interestsTags = selectedInterests.map((interest) => [
        "t",
        interest.tag?.toLowerCase(),
      ]);
      const ndkInterestEvent = new NDKEvent(ndkInstance);
      ndkInterestEvent.kind = 10015;
      ndkInterestEvent.content = "";
      ndkInterestEvent.tags = interestsTags;

      let published = await ndkInterestEvent.publish(undefined, 2000);
      return published;
    } catch (err) {
      console.log(err);
      return;
    }
  };

  const followingsEvent = async () => {
    try {
      let followingsTags = [
        ...new Set(
          selectedInterests.map((interest) => interest.pubkeys).flat()
        ),
      ].map((pubkey) => ["p", pubkey]);

      const ndkFollowingsEvent = new NDKEvent(ndkInstance);
      ndkFollowingsEvent.kind = 3;
      ndkFollowingsEvent.content = "";
      ndkFollowingsEvent.tags = followingsTags;

      let published = await ndkFollowingsEvent.publish(undefined, 2000);

      return published;
    } catch (err) {
      console.log(err);
      return;
    }
  };

  const relaysEvent = async () => {
    try {
      let relaysTags = relaysOnPlatform.map((relay) => ["r", relay]);

      const ndkRelaysEvent = new NDKEvent(ndkInstance);
      ndkRelaysEvent.kind = 10002;
      ndkRelaysEvent.content = "";
      ndkRelaysEvent.tags = relaysTags;

      let published = await ndkRelaysEvent.publish(undefined, 2000);

      return;
    } catch (err) {
      console.log(err);
      return;
    }
  };

  return (
    <>
      <div
        className="fit-container sc-s-18 slide-right"
        style={{ backgroundColor: "transparent" }}
      >
        {step === 1 && (
          <>
            <div
              className="fit-container fx-centered fx-end-v"
              style={{ height: "200px", position: "relative" }}
            >
              <div
                className="fit-container bg-img cover-bg sc-s"
                style={{
                  backgroundImage: `url(${banner})`,
                  height: "70%",
                  zIndex: 0,
                  position: "absolute",
                  left: 0,
                  top: 0,
                  borderBottom: "1px solid var(--very-dim-gray)",
                  border: "none",
                  borderRadius: "0",
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
                {!banner && (
                  <FilePicker
                    element={
                      <div className="fx-centered sticker  sticker-gray-gray">
                        {t("A1HsCqp")}
                        <div className="plus-sign"></div>
                      </div>
                    }
                    setFile={(data) => {
                      setBannerFile(data.file);
                      setBanner(data.url);
                    }}
                  />
                )}

                {banner && (
                  <div
                    className="close"
                    onClick={() => setBanner("")}
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
                          backgroundImage: `url(${
                            picture || profilePlaceholder
                          })`,
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
                        <p className="gray-c">{t("AnD39Ci")}</p>
                      </div>
                    </div>
                  </div>
                }
                setFile={(data) => {
                  setPictureFile(data.file);
                  setPicture(data.url);
                }}
              />
            </div>
            <div className="fit-container box-pad-h box-pad-v fx-centered fx-col">
              <input
                type="text"
                className="if ifs-full "
                placeholder={t("At0Sp8H")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <textarea
                className="txt-area if ifs-full "
                placeholder={t("ARTqPc0")}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="box-pad-h box-pad-v fx-centered fx-start-v fx-col">
              <h4>{t("A3fxtP2")}</h4>
              <p className="gray-c">{t("AmiGAX0")}</p>
            </div>
            <div
              className="fx-centered fx-end-h fx-wrap box-marg-s"
              style={{ maxHeight: "50vh", overflow: "scroll", gap: 0 }}
            >
              {InterestSuggestions.map((interest, index) => {
                let isAdded = selectedInterests.find(
                  (_) => _.tag === interest.main_tag
                );
                return (
                  <Fragment key={index}>
                    <div
                      className={`fit-container box-pad-h box-pad-v-s fx-scattered pointer ${
                        selectedInterest === index ? "sc-s-18" : ""
                      }`}
                      key={index}
                      style={{ border: "none", borderRadius: "0" }}
                      onClick={() => handleSelectedInterest(index)}
                    >
                      <div className="fx-centered">
                        <div
                          className="sc-s-18 bg-img cover-bg"
                          style={{
                            backgroundImage: `url(${interest.icon})`,
                            border: "none",
                            aspectRatio: "1/1",
                            minWidth: "64px",
                          }}
                        ></div>
                        <div>
                          <p className="">{interest.main_tag}</p>
                          <div className="fx-centered fx-end-v">
                            <ProfilePreview
                              pubkeys={Array.from(interest.pubkeys).splice(
                                0,
                                3
                              )}
                            />
                            <p className="gray-c p-medium">
                              {t("AZzyBMI", {
                                count: interest.pubkeys.length - 3,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="fx-centered">
                        {isAdded && (
                          <div
                            style={{
                              minWidth: "8px",
                              aspectRatio: "1/1",
                              backgroundColor: "var(--c1)",
                              borderRadius: "var(--border-r-50)",
                            }}
                          ></div>
                        )}
                        <div
                          className="round-icon-small"
                          style={{ backgroundColor: "var(--c1)" }}
                        >
                          <div
                            className="plus-sign"
                            style={{
                              rotate:
                                selectedInterest === index ? "-45deg" : "0deg",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    {selectedInterest === index && (
                      <Suggestions
                        index={index}
                        handleSelectInterests={handleSelectInterests}
                        selectedInterests={selectedInterests}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div className="box-pad-h box-pad-v fx-centered  fx-col">
              {!NWCURL && (
                <>
                  <h4>{t("AqBdu7X")}</h4>
                  <p
                    className="p-centered gray-c"
                    style={{ maxWidth: "400px" }}
                  >
                    {t("AOxmFz5")}
                  </p>
                </>
              )}
              {NWCURL && <h4>{t("AimqDYY")}</h4>}

              <WalletIllustration
                isLoading={isCreatingWalletLoading}
                isCreated={NWCURL}
              />
              {!NWCURL && (
                <button
                  className="btn btn-normal slide-up"
                  onClick={handleCreateWallet}
                  disabled={isCreatingWalletLoading}
                >
                  {isCreatingWalletLoading ? <LoadingDots /> : t("AvjCl1G")}
                </button>
              )}
              {NWCURL && (
                <div className="fx-centered sc-s-18 box-pad-h-s box-pad-v-s">
                  <div className="bolt"></div>
                  {NWAddr}
                </div>
              )}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <div
              className="fit-container fx-centered fx-end-v"
              style={{ height: "200px", position: "relative" }}
            >
              <div
                className="fit-container bg-img cover-bg sc-s"
                style={{
                  backgroundImage: `url(${banner})`,
                  height: "70%",
                  zIndex: 0,
                  position: "absolute",
                  left: 0,
                  top: 0,
                  borderBottom: "1px solid var(--very-dim-gray)",
                  border: "none",
                  borderRadius: "0",
                }}
              ></div>
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
                    backgroundImage: `url(${picture || profilePlaceholder})`,
                    border: "none",
                    minWidth: "128px",
                    aspectRatio: "1/1",
                    borderRadius: "50%",
                  }}
                  className="bg-img cover-bg sc-s"
                ></div>
              </div>
            </div>
            <div className="fit-container fx-centered fx-col box-pad-v-m">
              <h4>{name}</h4>
              <p
                className="gray-c p-centered p-four-lines"
                style={{ maxWidth: "400px" }}
              >
                {about || "N/A"}
              </p>
            </div>
            <div className="fit-container fx-centered box-pad-v">
              <div
                className="sc-s-18 box-pad-h-s box-pad-v-m fx-centered"
                style={{ maxWidth: "400px", gap: "16px" }}
              >
                <div className="round-icon">
                  <div className="key-icon-24"></div>
                </div>
                <p className="gray-c">
                  {NWAddr && t("AZfj4DI")}
                  {!NWAddr && t("AxGSiUc")}
                </p>
              </div>
            </div>
            {/* <SignUpDataToCopy /> */}
          </>
        )}
        {step !== 5 && (
          <>
            <div className="fit-container fx-scattered box-pad-h box-marg-s">
              {step > 1 && (
                <button
                  className="btn btn-gst slide-right btn-small"
                  onClick={() => handlePrevSteps()}
                >
                  {t("AF7iGeG")}
                </button>
              )}
              {step === 1 && <div></div>}

              <button
                className="btn btn-normal btn-small"
                onClick={() =>
                  step !== 4 ? handleNextSteps() : initializeAccount()
                }
              >
                {step !== 4 ? t("AgGi8rh") : t("AB0SnxL")}
              </button>
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                height: "5px",
                width: `${Math.ceil((step * 100) / stepsNumber)}%`,
                backgroundColor: "var(--c1)",
                transition: ".2s ease-in-out",
              }}
            ></div>
          </>
        )}
        {step === 5 && <InitiProfile />}
      </div>
      <div className="fx-scattered  fit-container box-pad-v-m">
        <div className="fx-centered pointer">
          <div className="round-icon-small">
            <div className="arrow arrow-back"></div>{" "}
          </div>
          <p className="gray-c" onClick={() => customHistory.back()}>
            {isNewAccount ? t("AB4BSCe") : t("AVCdQku")}
          </p>
        </div>
        <div className="fx-centered" onClick={switchScreen}>
          <p className="gray-c">
            {t("AKJqtlx")}{" "}
            <span className="orange-c pointer p-bold">{t("AmOtzoL")}</span>{" "}
          </p>
        </div>
      </div>
    </>
  );
};

const InitiProfile = () => {
  return (
    <div
      className="fit-container fx-centered fx-col"
      style={{ height: "500px" }}
    >
      <LoadingLogo size={200} />
      {/* <div style={{ width: "300px" }}>
        <Lottie animationData={loading} loop={true} />
      </div> */}
      {/* <h4 className="gray-c">Initializing profile...</h4> */}
    </div>
  );
};

const MobileAd = () => {
  const { t } = useTranslation();
  return (
    <div className="login-screen-heros fit-container fx-centered  box-pad-v fit-height">
      <div
        className="carousel-card-desc box-pad-h box-pad-v fit-container sc-s fx-even fx-stretch"
        // style={{ maxHeight: "100vh" }}
        style={{
          padding: "2rem 1rem",
        }}
      >
        <div
          className="fx-centered fx-col box-pad-v"
          style={{ rowGap: "5px", width: "40%" }}
        >
          <p style={{ color: "white" }}>{t("A2MbZUY")}</p>
          <p className="gray-c p-medium p-centered">{t("AbACpNI")}</p>
          <div
            className="fit-container carousel-card-desc box-pad-h-m box-pad-v-m fx-centered sc-s"
            style={{ background: "#838EAC55" }}
          >
            <img
              className="sc-s-18 fit-container"
              src={ymaQR}
              style={{ aspectRatio: "1/1" }}
            />
          </div>
          <Link
            className="fit-container box-pad-v-m"
            to="/yakihonne-mobile-app-links"
            target="_blank"
          >
            <img className="fit-container" src={s8e} />
          </Link>
        </div>
        <div className="fx-centered " style={{ width: "40%" }}>
          <img
            className="fit-container"
            style={{ objectFit: "contain" }}
            src={ymaHero}
            // style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    </div>
  );
};

const ProfilePreview = ({ pubkeys }) => {
  let nostrAuthors = useSelector((state) => state.nostrAuthors);
  let [images, setImages] = useState(pubkeys);

  useEffect(() => {
    try {
      let authors = [];
      for (let author of pubkeys) {
        let pubkey = getHex(author);
        let auth = getUser(pubkey);
        if (auth) authors.push(auth.picture);
        else authors.push("");
      }
      setImages(authors);
    } catch (err) {
      console.log(err);
    }
  }, [nostrAuthors]);

  return (
    <div style={{ position: "relative", minWidth: "32px", minHeight: "32px" }}>
      <div style={{ position: "absolute", left: 0, bottom: "0" }}>
        <UserProfilePicNOSTR
          user_id={pubkeys[0]}
          mainAccountUser={false}
          img={images[0] || ""}
          size={10}
        />
      </div>
      <div style={{ position: "absolute", left: "16px", top: "10px" }}>
        <UserProfilePicNOSTR
          user_id={pubkeys[1]}
          mainAccountUser={false}
          img={images[1] || ""}
          size={8}
        />
      </div>
      <div style={{ position: "absolute", left: "16px", bottom: "-4px" }}>
        <UserProfilePicNOSTR
          user_id={pubkeys[2]}
          mainAccountUser={false}
          img={images[2] || ""}
          size={12}
        />
      </div>
    </div>
  );
};

const Suggestions = ({ index, selectedInterests, handleSelectInterests }) => {
  const { t } = useTranslation();
  const isInterested = useMemo(() => {
    let tag = InterestSuggestions[index].main_tag;
    let interest = selectedInterests.find((interest) => interest.tag === tag);
    return interest;
  }, [selectedInterests]);

  const followUnfollow = (pubkey, index_, isFollowed) => {
    if (isInterested) {
      if (!isFollowed)
        handleSelectInterests({
          ...isInterested,
          pubkeys: [...isInterested.pubkeys, pubkey],
        });
      if (isFollowed) {
        let pubkeys = Array.from(isInterested.pubkeys);
        pubkeys = pubkeys.splice(index_, 0);
        handleSelectInterests({
          ...isInterested,
          pubkeys,
        });
      }
    }
    if (!isInterested) {
      handleSelectInterests({
        tag: InterestSuggestions[index].main_tag,
        pubkeys: [pubkey],
      });
    }
  };
  const followUnfollowAll = (toFollowAll) => {
    if (!toFollowAll) {
      handleSelectInterests({
        tag: InterestSuggestions[index].main_tag,
        pubkeys: [],
      });
    }
    if (toFollowAll) {
      handleSelectInterests({
        tag: InterestSuggestions[index].main_tag,
        pubkeys: InterestSuggestions[index].pubkeys.map((pubkey) => {
          return getHex(pubkey);
        }),
      });
    }
  };
  const isFollowed = (pubkey) => {
    if (isInterested) {
      return isInterested.pubkeys.find((_) => _ === pubkey) ? true : false;
    }
    return false;
  };
  return (
    <div
      className="sc-s-18 box-pad-h-m box-pad-v-m fit-container box-marg-s slide-down"
      style={{
        maxHeight: "33vh",
        overflow: "scroll",
        border: "none",
        borderRadius: "0",
      }}
    >
      <div className="fit-container fx-scattered box-marg-s">
        <p className="gray-c">{t("AoO5zem")}</p>
        {isInterested?.pubkeys?.length !==
          InterestSuggestions[index].pubkeys.length && (
          <button
            className="btn btn-gst btn-small"
            onClick={() => followUnfollowAll(true)}
          >
            {t("AzkUxnd")}
          </button>
        )}
        {isInterested?.pubkeys?.length ===
          InterestSuggestions[index].pubkeys.length && (
          <button
            className="btn btn-normal btn-small"
            onClick={() => followUnfollowAll(false)}
          >
            {t("AyohNeT")}
          </button>
        )}
      </div>
      <div
        className="fx-centered fx-col fx-start-h fx-start-v"
        style={{ gap: "16px" }}
      >
        {InterestSuggestions[index].pubkeys.map((_, index_) => {
          let pubkey = getHex(_);
          let author = getUser(pubkey) || getEmptyuserMetadata(pubkey);
          let checkIsFollowed = isFollowed(pubkey);
          return (
            <div className="fit-container fx-scattered" key={index_}>
              <div className="fx-centered">
                <UserProfilePicNOSTR
                  user_id={pubkey}
                  mainAccountUser={false}
                  img={author.picture}
                  size={48}
                />
                <div>
                  <p>{author.display_name || author.name}</p>
                  <p className="gray-c p-medium">
                    @{author.name || author.display_name}
                  </p>
                </div>
              </div>
              {!checkIsFollowed && (
                <button
                  className="btn btn-gst btn-small"
                  onClick={() => followUnfollow(pubkey, index_, false)}
                >
                  {t("A9o2pLM")}
                </button>
              )}
              {checkIsFollowed && (
                <button
                  className="btn btn-normal btn-small"
                  onClick={() => followUnfollow(pubkey, index_, true)}
                >
                  {t("ASi0a0d")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WalletIllustration = ({ isCreated, isLoading }) => {
  return (
    <div style={{ position: "relative" }} className="box-pad-v-m">
      <div
        className={`round-icon ${isLoading ? "pulse-orange" : ""}`}
        style={{
          width: "140px",
          borderColor: isCreated ? "var(--green-main)" : "",
        }}
      >
        <div
          className={isCreated ? "wallet-confirm" : "wallet-add"}
          style={{ width: "60px", height: "60px" }}
        ></div>
      </div>
    </div>
  );
};

// const SignUpDataToCopy = ({ wallet }) => {
//   const dispatch = useDispatch();
//   const copyKey = (keyType, key) => {
//     navigator.clipboard.writeText(key);
//     dispatch(
//       setToast({
//         type: 1,
//         desc: `${keyType} key was copied! 👏`,
//       })
//     );
//   };

//   return (
//     <div className="fit-container fx-col fx-centered  box-pad-h box-pad-v-m fx-start-v box-marg-s">
//       <div className="fit-container fx-centered fx-start-h">
//         <p className="c1-c p-big">Keys</p>
//         <div className="info-tt-24"></div>
//       </div>

//       <div
//         className="fx-scattered if pointer dashed-onH fit-container"
//         style={{ borderStyle: "dashed" }}
//         onClick={() => (userKeys.sec ? copyKey("Private", nsec) : null)}
//       >
//         <div>
//           <p className="gray-c p-medium p-left fit-container">
//             Your secret key
//           </p>
//           <p>
//             {userKeys.sec ? (
//               shortenKey(nsec, 8)
//             ) : (
//               <span className="italic-txt gray-c">
//                 {userKeys.ext
//                   ? "check your extension settings"
//                   : "No secret key is provided"}
//               </span>
//             )}
//           </p>
//         </div>
//         {userKeys.sec && <div className="copy-24"></div>}
//       </div>

//       {!wallet && (
//         <>
//           <div className="fit-container fx-centered fx-start-h">
//             <p className="c1-c p-big">Wallet</p>
//             <div className="info-tt-24"></div>
//           </div>
//           <div
//             className="fx-scattered if pointer dashed-onH fit-container"
//             style={{ borderStyle: "dashed" }}
//             onClick={() => (userKeys.sec ? copyKey("Private", nsec) : null)}
//           >
//             <div>
//               <p className="gray-c p-medium p-left fit-container">
//                 Your Lightning address
//               </p>
//               <p>
//                 {userKeys.sec ? (
//                   shortenKey(nsec, 8)
//                 ) : (
//                   <span className="italic-txt gray-c">
//                     {userKeys.ext
//                       ? "check your extension settings"
//                       : "No secret key is provided"}
//                   </span>
//                 )}
//               </p>
//             </div>
//             {userKeys.sec && <div className="copy-24"></div>}
//           </div>
//           <div
//             className="fx-scattered if pointer dashed-onH fit-container"
//             style={{ borderStyle: "dashed" }}
//             onClick={() => copyKey("Public", npub)}
//           >
//             <div>
//               <p className="gray-c p-medium p-left fit-container">
//                 Your NWC URL
//               </p>
//               <p>{shortenKey(npub, 8)}</p>
//             </div>

//             <div className="copy-24"></div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };
