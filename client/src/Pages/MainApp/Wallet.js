import React, { useEffect, useMemo, useRef, useState } from "react";
import { webln } from "@getalby/sdk";
import { Helmet } from "react-helmet";
import ArrowUp from "../../Components/ArrowUp";
import SidebarNOSTR from "../../Components/Main/SidebarNOSTR";
import axios from "axios";
import PagePlaceholder from "../../Components/PagePlaceholder";
import * as secp from "@noble/secp256k1";
import SatsToUSD from "../../Components/Main/SatsToUSD";
import {
  decodeUrlOrAddress,
  encodeLud06,
  getBech32,
  getEmptyuserMetadata,
  getHex,
  getZapper,
  shortenKey,
} from "../../Helpers/Encryptions";
import relaysOnPlatform from "../../Content/Relays";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import Date_ from "../../Components/Date_";
import QRCode from "react-qr-code";
import LoadingDots from "../../Components/LoadingDots";
import { getZapEventRequest } from "../../Helpers/NostrPublisher";
import AddWallet from "../../Components/Main/AddWallet";
import UserSearchBar from "../../Components/UserSearchBar";
import NProfilePreviewer from "../../Components/Main/NProfilePreviewer";
import { getWallets, updateWallets } from "../../Helpers/Helpers";
import { useDispatch, useSelector } from "react-redux";
import { setUserBalance } from "../../Store/Slides/UserData";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import OptionsDropdown from "../../Components/Main/OptionsDropdown";
import { useTranslation } from "react-i18next";
import { t } from "i18next";

export default function Wallet() {
  const dispatch = useDispatch();

  const userKeys = useSelector((state) => state.userKeys);
  const userBalance = useSelector((state) => state.userBalance);
  const userMetadata = useSelector((state) => state.userMetadata);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);

  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [displayMessage, setDisplayMessage] = useState(false);
  const [ops, setOps] = useState("");
  const [wallets, setWallets] = useState(getWallets());
  const [selectedWallet, setSelectedWallet] = useState(
    wallets.find((wallet) => wallet.active)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showWalletsList, setShowWalletList] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [showDeletionPopup, setShowDeletionPopup] = useState(false);
  const walletListRef = useRef(null);

  const checkIsLinked = (addr) => {
    if (userMetadata) {
      if (!(userMetadata.lud16 && userMetadata.lud06)) return false;
      if (userMetadata.lud16 && userMetadata.lud16 === addr) return true;
      if (userMetadata.lud06) {
        let decoded = decodeUrlOrAddress(userMetadata.lud06);
        if (decoded && decoded === addr) return true;
      }
      return false;
    }
  };
  const profileHasWallet = useMemo(() => {
    let hasWallet = userMetadata.lud06 || userMetadata.lud16;
    let isWalletLinked = wallets.find((wallet) => checkIsLinked(wallet.entitle))
      ? true
      : false;
    return {
      hasWallet,
      isWalletLinked,
    };
  }, [userMetadata, wallets]);

  useEffect(() => {
    let timeout = null;
    try {
      if (!userKeys) {
        setWallets([]);
        setSelectedWallet(false);
        return;
      }
      setIsLoading(true);
      timeout = setTimeout(() => {
        let tempWallets = getWallets();

        setWallets(tempWallets);
        setSelectedWallet(tempWallets.find((wallet) => wallet.active));

        let authors = [];
        let sub = ndkInstance.subscribe(
          [
            {
              kinds: [9735],
              "#p": [userKeys.pub],
            },
          ],
          { closeOnEose: true, cacheUsage: "CACHE_FIRST", groupable: false }
        );

        sub.on("event", async (event) => {
          let zapper = getZapper(event);
          authors.push(zapper.pubkey);
          setTransactions((prev) => {
            let zap = prev.find((zap) => zap.id === zapper.id);
            if (!zap) return [...prev, zapper];
            return prev;
          });
        });
        sub.on("eose", () => {
          saveUsers(authors);
        });
      }, 1000);
    } catch (err) {
      console.log(err);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [userKeys]);

  useEffect(() => {
    if (!userKeys) return;
    if (userKeys && (userKeys?.ext || userKeys?.sec)) {
      let tempWallets = getWallets();

      let selectedWallet_ = tempWallets.find((wallet) => wallet.active);
      if (selectedWallet_) {
        if (selectedWallet_.kind === 1) {
          getBalancWebLN();
        }
        if (selectedWallet_.kind === 2) {
          getAlbyData(selectedWallet_);
        }
        if (selectedWallet_.kind === 3) {
          getNWCData(selectedWallet_);
        }
      } else {
        setWallets([]);
        setSelectedWallet(false);
        dispatch(setUserBalance("N/A"));
      }
    } else {
      dispatch(setUserBalance("N/A"));
    }
  }, [userKeys, selectedWallet, timestamp]);

  useEffect(() => {
    let handleOffClick = (e) => {
      if (walletListRef.current && !walletListRef.current.contains(e.target)) {
        setShowWalletList(false);
      }
    };

    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [walletListRef]);

  const getBalancWebLN = async () => {
    try {
      setIsLoading(true);
      await window.webln.enable();
      let data = await window.webln.getBalance();
      // localStorage.setItem("wallet-userBalance", `${data.userBalance}`);
      setIsLoading(false);

      dispatch(setUserBalance(data.balance));
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };
  const getAlbyData = async (activeWallet) => {
    try {
      setIsLoading(true);
      let checkTokens = await checkAlbyToken(wallets, activeWallet);
      let b = await getBalanceAlbyAPI(
        checkTokens.activeWallet.data.access_token
      );
      let t = await getTransactionsAlbyAPI(
        checkTokens.activeWallet.data.access_token
      );
      setWallets(checkTokens.wallets);
      dispatch(setUserBalance(b));
      setWalletTransactions(t);
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };
  const getBalanceAlbyAPI = async (code) => {
    try {
      const data = await axios.get("https://api.getalby.com/balance", {
        headers: {
          Authorization: `Bearer ${code}`,
        },
      });
      return data.data.balance;
    } catch (err) {
      console.log(err);
      return 0;
    }
  };
  const getTransactionsAlbyAPI = async (code) => {
    try {
      const data = await axios.get("https://api.getalby.com/invoices", {
        headers: {
          Authorization: `Bearer ${code}`,
        },
      });
      let sendersMetadata = data.data
        .filter((event) => {
          if (event.metadata?.zap_request) return event;
        })
        .map((event) => {
          return event.metadata.zap_request.pubkey;
        });
      sendersMetadata = [...new Set(sendersMetadata)];
      saveUsers(sendersMetadata);

      return data.data;
    } catch (err) {
      console.log(err);
      return 0;
    }
  };

  const getNWCData = async (activeWallet) => {
    try {
      setIsLoading(true);
      const nwc = new webln.NWC({ nostrWalletConnectUrl: activeWallet.data });
      await nwc.enable();
      const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

      const userBalance_ = await nwc.getBalance();

      dispatch(setUserBalance(userBalance_.balance));
      const transactions_ = await nwc.listTransactions({
        // from: Math.floor(new Date().getTime() / 1000 - ONE_WEEK_IN_SECONDS),
        // until: Math.ceil(new Date().getTime() / 1000),
        limit: 50,
      });
      let sendersMetadata = transactions_.transactions
        .filter((event) => {
          if (event.metadata?.zap_request) return event;
        })
        .map((event) => {
          return event.metadata.zap_request.pubkey;
        });
      sendersMetadata = [...new Set(sendersMetadata)];
      saveUsers(sendersMetadata);
      setWalletTransactions(transactions_.transactions);
      setIsLoading(false);
      nwc.close();
    } catch (err) {
      console.log(err);
      setIsLoading(false);
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
    setSelectedWallet(wallets[index]);
    setWallets(tempWallets);
    updateWallets(tempWallets);
    setOps("");
    setShowWalletList(false);
  };

  const handleDelete = () => {
    try {
      let tempWallets = wallets.filter(
        (wallet) => wallet.id !== showDeletionPopup.id
      );
      if (tempWallets.length > 0 && showDeletionPopup.active) {
        tempWallets[0].active = true;
        setWallets(tempWallets);
        setSelectedWallet(tempWallets[0]);
        setShowDeletionPopup(false);
        updateWallets(tempWallets);
        return;
      }

      setWallets(tempWallets);
      setShowDeletionPopup(false);
      if (tempWallets.length === 0) setSelectedWallet(false);
      updateWallets(tempWallets);
    } catch (err) {
      console.log(err);
    }
  };

  let handleAddWallet = () => {
    let tempWallets = getWallets();
    let selectedWallet_ = tempWallets.find((wallet) => wallet.active);
    setWallets(tempWallets);
    setSelectedWallet(selectedWallet_);
    setShowAddWallet(false);
  };
  const copyKey = (prefix, key) => {
    navigator.clipboard.writeText(key);
    dispatch(
      setToast({
        type: 1,
        desc: `${prefix} 👏`,
      })
    );
  };

  const linkWallet = async (walletAddr) => {
    if (!walletAddr.includes("@")) {
      walletWarning();
      return;
    }
    let content = { ...userMetadata };
    content.lud16 = walletAddr;
    content.lud06 = encodeLud06(walletAddr);

    dispatch(
      setToPublish({
        userKeys: userKeys,
        kind: 0,
        content: JSON.stringify(content),
        tags: [],
        allRelays: [],
      })
    );
  };

  const walletWarning = () => {
    dispatch(
      setToast({
        type: 3,
        desc: t("A4R0ICw"),
      })
    );
  };

  return (
    <>
      {showAddWallet && (
        <AddWallet
          exit={() => setShowAddWallet(false)}
          refresh={handleAddWallet}
        />
      )}
      {showDeletionPopup && (
        <DeletionPopUp
          exit={() => setShowDeletionPopup(false)}
          handleDelete={handleDelete}
          wallet={showDeletionPopup}
        />
      )}
      <div>
        <Helmet>
          <title>Yakihonne | Wallet</title>
          <meta name="description" content="Manage your wallet" />
          <meta property="og:description" content="Manage your wallet" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="700" />
          <meta property="og:url" content={`https://yakihonne.com/wallet`} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta property="og:title" content="Manage your wallet" />
          <meta property="twitter:title" content="Manage your wallet" />
          <meta property="twitter:description" content="Manage your wallet" />
        </Helmet>
        <div className="fit-container fx-centered">
          <div className="main-container">
            <SidebarNOSTR />
            <main className="main-page-nostr-container">
              <ArrowUp />
              <div className="fx-centered fit-container  fx-start-v">
                <div className="box-pad-h-m main-middle">
                  {!(userKeys.ext || userKeys.sec) && (
                    <PagePlaceholder page={"nostr-wallet"} />
                  )}
                  {(userKeys.ext || userKeys.sec) && wallets.length === 0 && (
                    <PagePlaceholder
                      page={"nostr-add-wallet"}
                      onClick={handleAddWallet}
                    />
                  )}
                  {(userKeys.ext || userKeys.sec) && wallets.length > 0 && (
                    <div>
                      <div
                        className="fit-container box-pad-v-m fx-scattered"
                        style={{ position: "relative", zIndex: 100 }}
                      >
                        <div>
                          <h4>{t("ARXDO1q")}</h4>
                        </div>
                        <div className="fx-centered">
                          <div
                            className="round-icon round-icon-small round-icon-tooltip"
                            data-tooltip={t("A8fEwNq")}
                            onClick={() => setShowAddWallet(true)}
                          >
                            <div className="plus-sign"></div>
                          </div>
                          <div
                            style={{ position: "relative" }}
                            ref={walletListRef}
                          >
                            {selectedWallet && (
                              <div
                                className="fit-container fx-scattered if option pointer"
                                style={{ height: "var(--40)", padding: "1rem" }}
                                onClick={() =>
                                  setShowWalletList(!showWalletsList)
                                }
                              >
                                <p>{selectedWallet.entitle}</p>
                                <div className="arrow-12"></div>
                              </div>
                            )}
                            {showWalletsList && (
                              <div
                                className="fx-centered fx-col sc-s-18  box-pad-v-s fx-start-v drop-down"
                                style={{
                                  width: "400px",
                                  backgroundColor: "var(--c1-side)",
                                  position: "absolute",
                                 
                                  top: "calc(100% + 5px)",
                                  rowGap: 0,
                                  overflow: "visible",
                                }}
                              >
                                <p className="p-medium gray-c box-pad-h-m box-pad-v-s">
                                  {t("AnXYtQy")}
                                </p>
                                {wallets.map((wallet) => {
                                  let isLinked = checkIsLinked(wallet.entitle);
                                  return (
                                    <div
                                      key={wallet.id}
                                      className="option-no-scale fit-container fx-scattered sc-s-18 pointer box-pad-h-m box-pad-v-s"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectWallet(wallet.id);
                                      }}
                                      style={{
                                        border: "none",
                                        overflow: "visible",
                                      }}
                                    >
                                      <div className="fx-centered">
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
                                        <p
                                          className={
                                            wallet.active ? "green-c" : ""
                                          }
                                        >
                                          {wallet.entitle}
                                        </p>
                                        {isLinked && (
                                          <div
                                            className="round-icon-tooltip"
                                            data-tooltip={t("ANExIY1")}
                                          >
                                            <div className="sticker sticker-small sticker-green-pale">
                                              {t("AqlBPla")}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {wallet.kind !== 1 && (
                                        <OptionsDropdown
                                          options={[
                                            !isLinked && (
                                              <div
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  linkWallet(wallet.entitle);
                                                }}
                                              >
                                                {t("AmQVpu4")}
                                              </div>
                                            ),
                                            <div
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                copyKey(
                                                  t("ALR84Tq"),
                                                  selectedWallet.entitle
                                                );
                                              }}
                                            >
                                              {t("ApO1nbv")}
                                            </div>,
                                            <div
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                copyKey(
                                                  t("A6Pj02S"),
                                                  selectedWallet.data
                                                );
                                              }}
                                            >
                                              {t("A6ntZLW")}
                                            </div>,
                                            <div
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDeletionPopup(wallet);
                                              }}
                                            >
                                              <span className="red-c">
                                                {t("AawdN9R")}
                                              </span>
                                            </div>,
                                          ]}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className="fx-scattered box-pad-h fit-container fx-col fx-wrap"
                        style={{
                          position: "relative",
                          padding: "1rem",
                        }}
                      >
                        {!isLoading && (
                          <div className="fx-centered fx-col box-pad-v">
                            <h5>{t("AbcY4ef")}</h5>
                            <div className="fx-centered">
                              <h2 className="orange-c">{userBalance}</h2>
                              <p className="gray-c">Sats</p>
                            </div>
                            <SatsToUSD sats={userBalance} />
                            {selectedWallet.kind !== 1 && (
                              <div
                                className="btn btn-gray btn-small fx-centered"
                                onClick={() =>
                                  selectedWallet.entitle.includes("@")
                                    ? copyKey(
                                        t("ALR84Tq"),
                                        selectedWallet.entitle
                                      )
                                    : walletWarning()
                                }
                              >
                                {selectedWallet.entitle}
                                <div className="copy"></div>
                              </div>
                            )}
                          </div>
                        )}
                        {!isLoading &&
                          !(
                            profileHasWallet.hasWallet &&
                            profileHasWallet.isWalletLinked
                          ) && (
                            <div className="box-pad-h box-pad-v fit-container sc-s-18 fx-centered fx-centered fx-col gray-c p-centered">
                              {!profileHasWallet.hasWallet && (
                                <>{t("AAPZe91")}</>
                              )}
                              {profileHasWallet.hasWallet &&
                                !profileHasWallet.isWalletLinked && (
                                  <>{t("AHKiPjO")}</>
                                )}
                              {t("AHTCsEO")}
                            </div>
                          )}
                        {isLoading && (
                          <div
                            className="fx-centered fx-col box-pad-v"
                            style={{ height: "150px" }}
                          >
                            <LoadingDots />
                          </div>
                        )}
                        <div className="fx-centered fit-container">
                          <button
                            style={{ height: "70px", gap: 0 }}
                            className={
                              selectedWallet
                                ? "btn btn-gray fx fx-centered fx-col"
                                : "btn btn-disabled fx fx-centered fx-col"
                            }
                            onClick={() =>
                              selectedWallet ? setOps("receive") : null
                            }
                            disabled={selectedWallet ? false : true}
                          >
                            <span className="p-big">&#8595;</span>
                            <span>{t("A8SflFr")}</span>
                          </button>
                          <button
                            style={{ height: "70px", gap: 0 }}
                            className={
                              selectedWallet
                                ? "btn btn-orange  fx fx-centered fx-col"
                                : "btn btn-disabled fx fx-centered fx-col"
                            }
                            onClick={() =>
                              selectedWallet ? setOps("send") : null
                            }
                            disabled={selectedWallet ? false : true}
                          >
                            <span className="p-big">&#8593;</span>
                            <span>{t("A14LwWS")}</span>
                          </button>
                        </div>
                      </div>
                      {ops === "send" && (
                        <SendPayment
                          exit={() => setOps("")}
                          wallets={wallets}
                          selectedWallet={selectedWallet}
                          setWallets={setWallets}
                          refreshTransactions={() => setTimestamp(Date.now())}
                        />
                      )}
                      {ops === "receive" && (
                        <ReceivePayment
                          exit={() => setOps("")}
                          wallets={wallets}
                          selectedWallet={selectedWallet}
                          setWallets={setWallets}
                        />
                      )}
                      {isLoading && (
                        <div
                          className="fit-container fx-centered"
                          style={{ height: "40vh" }}
                        >
                          <p className="gray-c">{t("AZhgADD")}</p>{" "}
                          <LoadingDots />
                        </div>
                      )}
                      {!isLoading && (
                        <>
                          {transactions.length > 0 &&
                            selectedWallet?.kind === 1 && (
                              <div className="fit-container box-pad-v fx-centered fx-col fx-start-v">
                                <p className="gray-c">{t("AzLQdQO")}</p>
                                {transactions.map((transaction, index) => {
                                  let author =
                                    nostrAuthors.find(
                                      (author) =>
                                        author.pubkey === transaction.pubkey
                                    ) ||
                                    getEmptyuserMetadata(transaction.pubkey);
                                  return (
                                    <div
                                      key={transaction.id}
                                      className="fit-container fx-scattered fx-col box-pad-v-m"
                                      style={{
                                        border: "none",
                                        overflow: "visible",
                                        borderTop:
                                          index !== 0
                                            ? "1px solid var(--very-dim-gray)"
                                            : "",
                                      }}
                                    >
                                      <div className="fit-container fx-scattered">
                                        <div className="fx-centered fx-start-h">
                                          <div style={{ position: "relative" }}>
                                            <UserProfilePicNOSTR
                                              mainAccountUser={false}
                                              user_id={author.pubkey}
                                              size={48}
                                              img={author.picture}
                                            />
                                            <div
                                              className="round-icon-small round-icon-tooltip"
                                              data-tooltip={t("A4G4OJ7")}
                                              style={{
                                                position: "absolute",
                                                scale: ".65",
                                                backgroundColor:
                                                  "var(--pale-gray)",
                                                right: "-8px",
                                                bottom: "-10px",
                                              }}
                                            >
                                              <p className="green-c">&#8595;</p>
                                            </div>
                                          </div>
                                          <div>
                                            <p className="gray-c p-medium">
                                              <Date_
                                                toConvert={
                                                  new Date(
                                                    transaction.created_at *
                                                      1000
                                                  )
                                                }
                                                time={true}
                                              />
                                            </p>
                                            <p className="p-medium">
                                              {t("AdrOPfO", {
                                                name:
                                                  author.display_name ||
                                                  author.name ||
                                                  author.pubkey.substring(
                                                    0,
                                                    10
                                                  ),
                                              })}
                                              <span className="orange-c">
                                                {" "}
                                                {transaction.amount}{" "}
                                                <span className="gray-c">
                                                  Sats
                                                </span>
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                        {transaction.message && (
                                          <div
                                            className="round-icon-small round-icon-tooltip"
                                            data-tooltip={t("AYMJ2uj")}
                                            onClick={() =>
                                              displayMessage === transaction.id
                                                ? setDisplayMessage(false)
                                                : setDisplayMessage(
                                                    transaction.id
                                                  )
                                            }
                                          >
                                            <div className="comment-not"></div>
                                          </div>
                                        )}
                                      </div>
                                      {transaction.message &&
                                        displayMessage === transaction.id && (
                                          <div
                                            className="fit-container sc-s box-pad-h-s box-pad-v-s p-medium"
                                            style={{
                                              backgroundColor: "var(--c1-side)",
                                              borderRadius: "var(--border-r-6)",
                                            }}
                                          >
                                            <p className="gray-c p-medium">
                                              {t("AVZHXQq")}
                                            </p>
                                            <p className="p-medium">
                                              {transaction.message}
                                            </p>
                                          </div>
                                        )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          {transactions.length === 0 &&
                            selectedWallet?.kind === 1 && (
                              <div
                                className="fit-container fx-centered fx-col"
                                style={{ height: "30vh" }}
                              >
                                <h4>{t("Ag3spMM")}</h4>
                                <p className="gray-c">{t("ABF4HcR")}</p>
                              </div>
                            )}
                          {walletTransactions.length > 0 &&
                            selectedWallet?.kind === 2 && (
                              <div className="fit-container box-pad-v fx-centered fx-col fx-start-v">
                                <p className="gray-c">{t("Aflt0YJ")}</p>
                                {walletTransactions.map((transaction) => {
                                  let isZap = transaction.metadata?.zap_request;
                                  let author = isZap
                                    ? nostrAuthors.find(
                                        (author) =>
                                          author.pubkey ===
                                          transaction.metadata.zap_request
                                            .pubkey
                                      )
                                    : false;
                                  return (
                                    <div
                                      key={transaction.identifier}
                                      className="fit-container fx-scattered fx-col sc-s-18 box-pad-h-m box-pad-v-m"
                                      style={{
                                        border: "none",
                                        overflow: "visible",
                                      }}
                                    >
                                      <div className="fit-container fx-scattered">
                                        <div className="fx-centered fx-start-h">
                                          {(!isZap ||
                                            (isZap &&
                                              transaction.type ===
                                                "outgoing")) && (
                                            <>
                                              {transaction.type ===
                                                "outgoing" && (
                                                <div
                                                  className="round-icon round-icon-tooltip"
                                                  data-tooltip={t("AkPQ73T")}
                                                >
                                                  <p className="red-c">
                                                    &#8593;
                                                  </p>
                                                </div>
                                              )}
                                              {transaction.type !==
                                                "outgoing" && (
                                                <div
                                                  className="round-icon round-icon-tooltip"
                                                  data-tooltip={t("A4G4OJ7")}
                                                >
                                                  <p className="green-c">
                                                    &#8595;
                                                  </p>
                                                </div>
                                              )}
                                            </>
                                          )}
                                          {isZap &&
                                            transaction.type !== "outgoing" && (
                                              <>
                                                <div
                                                  style={{
                                                    position: "relative",
                                                  }}
                                                >
                                                  <UserProfilePicNOSTR
                                                    mainAccountUser={false}
                                                    size={48}
                                                    user_id={isZap.pubkey}
                                                    img={
                                                      author
                                                        ? author.picture
                                                        : ""
                                                    }
                                                  />
                                                  <div
                                                    className="round-icon-small round-icon-tooltip"
                                                    data-tooltip={t("A4G4OJ7")}
                                                    style={{
                                                      position: "absolute",
                                                      scale: ".65",
                                                      backgroundColor:
                                                        "var(--pale-gray)",
                                                      right: "-5px",
                                                      bottom: "-10px",
                                                    }}
                                                  >
                                                    <p className="green-c">
                                                      &#8595;
                                                    </p>
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          <div>
                                            <p className="gray-c p-medium">
                                              <Date_
                                                toConvert={
                                                  new Date(
                                                    transaction.creation_date *
                                                      1000
                                                  )
                                                }
                                                time={true}
                                              />
                                            </p>
                                            <p className="p-medium">
                                              {(!isZap ||
                                                (isZap &&
                                                  transaction.type ===
                                                    "outgoing")) && (
                                                <>
                                                  {transaction.type ===
                                                  "outgoing"
                                                    ? t("ATyFagO")
                                                    : t("AyVA6Q3")}
                                                </>
                                              )}
                                              {(isZap ||
                                                (isZap &&
                                                  transaction.type !==
                                                    "outgoing")) && (
                                                <>
                                                  {t("AdrOPfO", {
                                                    name: author
                                                      ? author.display_name ||
                                                        author.name
                                                      : getBech32(
                                                          "npub",
                                                          isZap.pubkey
                                                        ).substring(0, 10),
                                                  })}
                                                </>
                                              )}
                                              <span className="orange-c">
                                                {" "}
                                                {transaction.amount}{" "}
                                                <span className="gray-c">
                                                  Sats
                                                </span>
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                        {(transaction.memo ||
                                          transaction.comment) && (
                                          <div
                                            className="round-icon-small round-icon-tooltip"
                                            data-tooltip={t("AYMJ2uj")}
                                            onClick={() =>
                                              displayMessage ===
                                              transaction.identifier
                                                ? setDisplayMessage(false)
                                                : setDisplayMessage(
                                                    transaction.identifier
                                                  )
                                            }
                                          >
                                            <div className="comment-not"></div>
                                          </div>
                                        )}
                                      </div>
                                      {(transaction.memo ||
                                        transaction.comment) &&
                                        displayMessage ===
                                          transaction.identifier && (
                                          <div
                                            className="fit-container sc-s box-pad-h-s box-pad-v-s p-medium"
                                            style={{
                                              backgroundColor: "var(--c1-side)",
                                              borderRadius: "var(--border-r-6)",
                                            }}
                                          >
                                            <p className="gray-c p-medium">
                                              {t("AVZHXQq")}
                                            </p>
                                            <p className="p-medium">
                                              {transaction.memo ||
                                                transaction.comment}
                                            </p>
                                          </div>
                                        )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          {walletTransactions.length === 0 &&
                            selectedWallet?.kind === 2 && (
                              <div
                                className="fit-container fx-centered fx-col"
                                style={{ height: "30vh" }}
                              >
                                <h4>{t("Ag3spMM")}</h4>
                                <p className="gray-c p-centered">
                                  {t("AgaoyPx")}
                                </p>
                              </div>
                            )}
                          {walletTransactions.length > 0 &&
                            selectedWallet?.kind === 3 && (
                              <div className="fit-container box-pad-v fx-centered fx-col fx-start-v">
                                <p className="gray-c">{t("Aflt0YJ")}</p>
                                {walletTransactions.map(
                                  (transaction, index) => {
                                    let isZap =
                                      transaction.metadata?.zap_request;
                                    let author = isZap
                                      ? nostrAuthors.find(
                                          (author) =>
                                            author.pubkey ===
                                            transaction.metadata.zap_request
                                              .pubkey
                                        )
                                      : false;
                                    return (
                                      <div
                                        key={`${transaction.invoice}-${index}`}
                                        className="fit-container fx-scattered fx-col sc-s-18 box-pad-h-m box-pad-v-m"
                                        style={{
                                          border: "none",
                                          overflow: "visible",
                                        }}
                                      >
                                        <div className="fit-container fx-scattered">
                                          <div className="fx-centered fx-start-h">
                                            {(!isZap ||
                                              (isZap &&
                                                transaction.type ===
                                                  "outgoing")) && (
                                              <>
                                                {transaction.type ===
                                                  "outgoing" && (
                                                  <div
                                                    className="round-icon round-icon-tooltip"
                                                    data-tooltip={t("AkPQ73T")}
                                                  >
                                                    <p className="red-c">
                                                      &#8593;
                                                    </p>
                                                  </div>
                                                )}
                                                {transaction.type !==
                                                  "outgoing" && (
                                                  <div
                                                    className="round-icon round-icon-tooltip"
                                                    data-tooltip={t("A4G4OJ7")}
                                                  >
                                                    <p className="green-c">
                                                      &#8595;
                                                    </p>
                                                  </div>
                                                )}
                                              </>
                                            )}
                                            {isZap &&
                                              transaction.type !==
                                                "outgoing" && (
                                                <>
                                                  <div
                                                    style={{
                                                      position: "relative",
                                                    }}
                                                  >
                                                    <UserProfilePicNOSTR
                                                      mainAccountUser={false}
                                                      size={48}
                                                      user_id={isZap.pubkey}
                                                      img={
                                                        author
                                                          ? author.picture
                                                          : ""
                                                      }
                                                    />
                                                    <div
                                                      className="round-icon-small round-icon-tooltip"
                                                      data-tooltip={t(
                                                        "A4G4OJ7"
                                                      )}
                                                      style={{
                                                        position: "absolute",
                                                        scale: ".65",
                                                        backgroundColor:
                                                          "var(--pale-gray)",
                                                        right: "-5px",
                                                        bottom: "-10px",
                                                      }}
                                                    >
                                                      <p className="green-c">
                                                        &#8595;
                                                      </p>
                                                    </div>
                                                  </div>
                                                </>
                                              )}
                                            <div>
                                              <p className="gray-c p-medium">
                                                <Date_
                                                  toConvert={
                                                    new Date(
                                                      transaction.created_at *
                                                        1000
                                                    )
                                                  }
                                                  time={true}
                                                />
                                              </p>
                                              <p className="p-medium">
                                                {(!isZap ||
                                                  (isZap &&
                                                    transaction.type ===
                                                      "outgoing")) && (
                                                  <>
                                                    {transaction.type ===
                                                    "outgoing"
                                                      ? t("ATyFagO")
                                                      : t("AyVA6Q3")}
                                                  </>
                                                )}
                                                {(isZap ||
                                                  (isZap &&
                                                    transaction.type !==
                                                      "outgoing")) && (
                                                  <>
                                                    {t("AdrOPfO", {
                                                      name: author
                                                        ? author.display_name ||
                                                          author.name
                                                        : getBech32(
                                                            "npub",
                                                            isZap.pubkey
                                                          ).substring(0, 10),
                                                    })}
                                                  </>
                                                )}

                                                <span className="orange-c">
                                                  {" "}
                                                  {transaction.amount}{" "}
                                                  <span className="gray-c">
                                                    Sats
                                                  </span>
                                                </span>
                                              </p>
                                            </div>
                                          </div>
                                          {transaction.description && (
                                            <div
                                              className="round-icon-small round-icon-tooltip"
                                              data-tooltip={t("AYMJ2uj")}
                                              onClick={() =>
                                                displayMessage ===
                                                transaction.invoice
                                                  ? setDisplayMessage(false)
                                                  : setDisplayMessage(
                                                      transaction.invoice
                                                    )
                                              }
                                            >
                                              <div className="comment-not"></div>
                                            </div>
                                          )}
                                        </div>
                                        {transaction.description &&
                                          displayMessage ===
                                            transaction.invoice && (
                                            <div
                                              className="fit-container sc-s box-pad-h-s box-pad-v-s p-medium"
                                              style={{
                                                backgroundColor:
                                                  "var(--c1-side)",
                                                borderRadius:
                                                  "var(--border-r-6)",
                                              }}
                                            >
                                              <p className="gray-c p-medium">
                                                {t("AVZHXQq")}
                                              </p>
                                              <p className="p-medium">
                                                {transaction.description}
                                              </p>
                                            </div>
                                          )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          {walletTransactions.length === 0 &&
                            selectedWallet?.kind === 3 && (
                              <div
                                className="fit-container fx-centered fx-col"
                                style={{ height: "30vh" }}
                              >
                                <h4>{t("Ag3spMM")}</h4>
                                <p className="gray-c p-centered">
                                  {t("AgaoyPx")}
                                </p>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

const SendPayment = ({
  exit,
  wallets,
  selectedWallet,
  setWallets,
  refreshTransactions,
}) => {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);

  const { t } = useTranslation();
  const [isZap, setIsZap] = useState(false);
  const [invoiceData, setInvoicedata] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [addr, setAddr] = useState("");
  const [comment, setComment] = useState("");
  const [amount, setAmount] = useState(0);
  const [pubkey, setPubkey] = useState("");

  useEffect(() => {
    if (addr.startsWith("lnbc")) {
      setInvoicedata(false);
    } else setInvoicedata(true);
  }, [addr]);

  const sendWithWebLN = async (addr_) => {
    try {
      setIsLoading(true);
      await window.webln.enable();
      let res = await window.webln.sendPayment(addr_);
      dispatch(
        setToast({
          type: 1,
          desc: t("AaQzRGG", {
            amount: res.route.total_amt,
            fees: res.route.total_fees,
          }),
        })
      );
      reInitParams();
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      if (err.includes("User rejected")) return;
      dispatch(
        setToast({
          type: 2,
          desc: t("Acr4Slu"),
        })
      );
    }
  };
  const sendWithNWC = async (addr_) => {
    try {
      setIsLoading(true);
      const nwc = new webln.NWC({ nostrWalletConnectUrl: selectedWallet.data });
      await nwc.enable();
      const res = await nwc.sendPayment(addr_);

      dispatch(
        setToast({
          type: 1,
          desc: t("A5n8Ifp"),
        })
      );
      reInitParams();
      setIsLoading(false);
      nwc.close();
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      if (err.includes("User rejected")) return;
      dispatch(
        setToast({
          type: 2,
          desc: t("Acr4Slu"),
        })
      );
    }
  };
  const sendWithAlby = async (addr_, code) => {
    try {
      setIsLoading(true);
      const data = await axios.post(
        "https://api.getalby.com/payments/bolt11",
        { invoice: addr_ },
        {
          headers: {
            Authorization: `Bearer ${code}`,
          },
        }
      );
      setIsLoading(false);
      reInitParams();
      refreshTransactions();
      dispatch(
        setToast({
          type: 1,
          desc: t("AaQzRGG", {
            amount: data.data.amount,
            fees: data.data.fee,
          }),
        })
      );
      return data.data;
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      dispatch(
        setToast({
          type: 2,
          desc: t("Acr4Slu"),
        })
      );
      return 0;
    }
  };
  const handleSendPayment = async () => {
    if (isLoading) return;
    if (invoiceData) {
      try {
        let hex = pubkey;
        if (amount === 0) {
          dispatch(
            setToast({
              type: 3,
              desc: t("AR2vydH"),
            })
          );
          return;
        }
        if (isZap && !pubkey) {
          dispatch(
            setToast({
              type: 3,
              desc: t("AJbsVsG"),
            })
          );
          return;
        }
        if (pubkey.startsWith("npub")) {
          hex = getHex(pubkey);
          if (!hex) {
            dispatch(
              setToast({
                type: 3,
                desc: t("AiHLMRi"),
              })
            );
            return;
          }
        }
        if (
          pubkey &&
          !pubkey.startsWith("npub") &&
          !secp.utils.isValidPrivateKey(pubkey)
        ) {
          dispatch(
            setToast({
              type: 3,
              desc: t("AiHLMRi"),
            })
          );
          return;
        }
        const data = await axios.get(decodeUrlOrAddress(addr));
        const callback = data.data.callback;
        let addr_ = encodeLud06(decodeUrlOrAddress(addr));
        let sats = amount * 1000;
        let event = getEvent(sats, addr_, hex);
        const res = isZap
          ? await axios(
              `${callback}?amount=${sats}&nostr=${event}&lnurl=${addr_}`
            )
          : await axios(`${callback}?amount=${sats}&lnurl=${addr_}`);

        if (selectedWallet.kind === 1) {
          sendWithWebLN(res.data.pr);
        }
        if (selectedWallet.kind === 2) {
          let checkTokens = await checkAlbyToken(wallets, selectedWallet);
          setWallets(checkTokens.wallets);
          sendWithAlby(addr_, checkTokens.activeWallet.data.access_token);
        }
        if (selectedWallet.kind === 3) {
          sendWithNWC(res.data.pr);
        }
      } catch (err) {
        console.log(err);
        dispatch(
          setToast({
            type: 2,
            desc: t("AYuUnqd"),
          })
        );
      }
    }
    if (!invoiceData) {
      if (selectedWallet.kind === 1) sendWithWebLN(addr);
      if (selectedWallet.kind === 2) {
        let checkTokens = await checkAlbyToken(wallets, selectedWallet);
        setWallets(checkTokens.wallets);
        sendWithAlby(addr, checkTokens.activeWallet.data.access_token);
      }
      if (selectedWallet.kind === 3) sendWithNWC(addr);
    }
  };
  const reInitParams = () => {
    setIsZap(false);
    setInvoicedata(true);
    setAddr("");
    setComment("");
    setAmount(0);
    setPubkey("");
  };
  const getEvent = async (sats, addr_, hex) => {
    let tags = [
      ["relays", ...relaysOnPlatform],
      ["amount", sats.toString()],
      ["lnurl", addr_],
      ["p", hex],
    ];

    const event = isZap
      ? await getZapEventRequest(userKeys, comment, tags)
      : {};
    return event;
  };

  const handleUserMetadata = (data) => {
    if (data.lud16) {
      setAddr(data.lud16);
    }
  };

  return (
    <div
      className="fit-container fx-centered fx-col fx-start-v slide-up"
      style={{ marginTop: "1rem" }}
    >
      <div className="fit-container fx-scattered">
        <h4>{t("A14LwWS")}</h4>
        <div className="close" style={{ position: "static" }} onClick={exit}>
          <div></div>
        </div>
      </div>

      <div
        className="fx-scattered fit-container if pointer"
        onClick={() => {
          setInvoicedata(!invoiceData);
          setAddr("");
        }}
      >
        <p>{t("AI19tdC")}</p>
        <div
          className={`toggle ${invoiceData ? "toggle-dim-gray" : ""} ${
            !invoiceData ? "toggle-c1" : "toggle-dim-gray"
          }`}
        ></div>
      </div>

      <input
        type="text"
        className="if ifs-full"
        placeholder={!invoiceData ? t("AvEHTiP") : t("A40BuYB")}
        value={addr}
        onChange={(e) => setAddr(e.target.value)}
      />
      {invoiceData && (
        <input
          type="number"
          className="if ifs-full"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(Math.abs(parseInt(e.target.value)))}
        />
      )}

      {invoiceData && (
        <>
          {!pubkey && (
            <UserSearchBar
              onClick={setPubkey}
              full={true}
              placeholder={t("ABRi9O2")}
            />
          )}
          {pubkey && (
            <NProfilePreviewer
              pubkey={pubkey}
              margin={false}
              close={true}
              showSha
              onClose={() => setPubkey("")}
              setMetataData={handleUserMetadata}
            />
          )}
        </>
      )}
      {invoiceData && (
        <input
          type="text"
          className="if ifs-full"
          placeholder={t("AAcGVGY")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      )}
      {/* {isZap && (
        <input
          type="text"
          className="if ifs-full"
          placeholder="User pubkey/npub"
          value={pubkey}
          onChange={(e) => setPubkey(e.target.value)}
        />
      )} */}

      <button
        className="btn btn-orange btn-full"
        onClick={handleSendPayment}
        disabled={isLoading}
      >
        {isLoading ? <LoadingDots /> : t("A14LwWS")}
      </button>
    </div>
  );
};

const ReceivePayment = ({ exit, wallets, selectedWallet, setWallets }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [comment, setComment] = useState("");
  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceRequest, setInvoiceRequest] = useState(false);

  const generateWithWebLN = async () => {
    try {
      setIsLoading(true);
      await window.webln.enable();
      let invoice = await window.webln.makeInvoice({
        defaultMemo: comment,
        amount,
      });
      setIsLoading(false);
      setInvoiceRequest(invoice.paymentRequest);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      if (err.includes("User rejected")) return;
      dispatch(
        setToast({
          type: 2,
          desc: t("Acr4Slu"),
        })
      );
    }
  };
  const generateWithNWC = async () => {
    try {
      setIsLoading(true);
      const nwc = new webln.NWC({ nostrWalletConnectUrl: selectedWallet.data });
      await nwc.enable();
      const invoice = await nwc.makeInvoice({
        defaultMemo: comment,
        amount,
      });
      setIsLoading(false);
      setInvoiceRequest(invoice.paymentRequest);
      nwc.close();
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      if (err.includes("User rejected")) return;
      dispatch(
        setToast({
          type: 2,
          desc: t("Acr4Slu"),
        })
      );
    }
  };

  const generateWithAlby = async (code) => {
    try {
      setIsLoading(true);
      const data = await axios.post(
        "https://api.getalby.com/invoices",
        { amount, comment, description: comment, memo: comment },
        {
          headers: {
            Authorization: `Bearer ${code}`,
          },
        }
      );
      setIsLoading(false);
      setInvoiceRequest(data.data.payment_request);
      return data.data;
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      return 0;
    }
  };

  const generateInvoice = async () => {
    if (isLoading) return;
    if (selectedWallet.kind === 1) {
      generateWithWebLN();
    }
    if (selectedWallet.kind === 2) {
      let checkTokens = await checkAlbyToken(wallets, selectedWallet);
      setWallets(checkTokens.wallets);
      generateWithAlby(checkTokens.activeWallet.data.access_token);
    }
    if (selectedWallet.kind === 3) {
      generateWithNWC();
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    dispatch(
      setToast({
        type: 1,
        desc: `${t("AS0m8W5")} 👏`,
      })
    );
  };

  return (
    <>
      {invoiceRequest && (
        <div className="fixed-container fx-centered box-pad-h">
          <div
            className="fx-centered fx-col sc-s-18"
            style={{ width: "min(100%, 500px)" }}
          >
            <QRCode
              style={{ width: "100%", aspectRatio: "1/1" }}
              size={500}
              value={invoiceRequest}
            />
            <div className="fx-centered fit-container">
              <div
                className="fx-scattered if pointer dashed-onH fit-container"
                style={{ borderStyle: "dashed" }}
                onClick={() => copyKey(invoiceRequest)}
              >
                <p>{shortenKey(invoiceRequest)}</p>
                <div className="copy-24"></div>
              </div>
              <button
                className="btn btn-normal"
                onClick={() => setInvoiceRequest("")}
              >
                {t("AoUUBDI")}
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className="fit-container fx-centered fx-col fx-start-v slide-up"
        style={{ marginTop: "1rem" }}
      >
        <div className="fit-container fx-scattered">
          <h4>{t("AuOH50L")}</h4>
          <div className="close" style={{ position: "static" }} onClick={exit}>
            <div></div>
          </div>
        </div>
        <input
          type="text"
          className="if ifs-full"
          placeholder={t("AAcGVGY")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <input
          type="number"
          className="if ifs-full"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(Math.abs(parseInt(e.target.value)))}
        />
        <button
          className="btn btn-orange btn-full"
          onClick={generateInvoice}
          disabled={isLoading}
        >
          {isLoading ? <LoadingDots /> : t("AuOH50L")}
        </button>
      </div>
    </>
  );
};

const checkAlbyToken = async (wallets, activeWallet) => {
  let tokenExpiry = activeWallet.data.created_at + activeWallet.data.expires_in;
  let currentTime = Math.floor(Date.now() / 1000);
  if (tokenExpiry > currentTime)
    return {
      wallets,
      activeWallet,
    };
  try {
    let fd = new FormData();
    fd.append("refresh_token", activeWallet.data.refresh_token);
    fd.append("grant_type", "refresh_token");
    const access_token = await axios.post(
      "https://api.getalby.com/oauth/token",
      fd,
      {
        auth: {
          username: process.env.REACT_APP_ALBY_CLIENT_ID,
          password: process.env.REACT_APP_ALBY_SECRET_ID,
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    let tempWallet = { ...activeWallet };
    tempWallet.data = {
      ...access_token.data,
      created_at: Math.floor(Date.now() / 1000),
    };
    let tempWallets = Array.from(wallets);
    let index = wallets.findIndex((item) => item.id === activeWallet.id);
    tempWallets[index] = tempWallet;
    updateWallets(tempWallets);
    return {
      wallets: tempWallets,
      activeWallet: tempWallet,
    };
  } catch (err) {
    console.log(err);
    return {
      wallets,
      activeWallet,
    };
  }
};

const DeletionPopUp = ({ exit, handleDelete, wallet }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const copyKey = (keyType, key) => {
    navigator.clipboard.writeText(key);
    dispatch(
      setToast({
        type: 1,
        desc: `${keyType} 👏`,
      })
    );
  };
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
        <p className="p-centered gray-c box-pad-v-m">{t("AOlHR1d")}</p>
        <div
          className={"fx-scattered if pointer fit-container dashed-onH"}
          style={{ borderStyle: "dashed" }}
          onClick={() => copyKey(t("A6Pj02S"), wallet.data)}
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
