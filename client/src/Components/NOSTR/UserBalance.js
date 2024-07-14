import React, { useContext, useEffect, useState } from "react";
import SatsToUSD from "./SatsToUSD";
import { Context } from "../../Context/Context";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { webln } from "@getalby/sdk";
import LoadingDots from "../LoadingDots";

const getWallets = () => {
  let wallets = localStorage.getItem("yaki-wallets");
  if (!wallets) return [];
  try {
    wallets = JSON.parse(wallets);
    return wallets;
  } catch (err) {
    return [];
  }
};

export default function UserBalance() {
  const navigateTo = useNavigate();
  const { nostrKeys, balance, setBalance, tempChannel, setTempChannel } =
    useContext(Context);
  const [wallets, setWallets] = useState(getWallets());
  const [selectedWallet, setSelectedWallet] = useState(
    wallets.find((wallet) => wallet.active)
  );
  const [isLoading, setIsLoading] = useState(false);

  const [isHidden, setIsHidden] = useState(
    localStorage.getItem("isSatsHidden")
      ? localStorage.getItem("isSatsHidden")
      : ""
  );

  useEffect(() => {
    if (["/wallet"].includes(window.location.pathname)) return;
    if (!nostrKeys) return;
    if (nostrKeys && (nostrKeys?.ext || nostrKeys?.sec)) {
      if (selectedWallet) {
        if (selectedWallet.kind === 1) {
          getBalancWebLN();
        }
        if (selectedWallet.kind === 2) {
          getAlbyData(selectedWallet);
        }
        if (selectedWallet.kind === 3) {
          getNWCData(selectedWallet);
        }
      }
    } else {
      setBalance(false);
    }
  }, [nostrKeys, selectedWallet]);

  useEffect(() => {
    if (tempChannel && !window.location.pathname.includes('users')) {
      let tempWallets = getWallets();
      setWallets(tempWallets);
      setSelectedWallet(tempWallets.find((wallet) => wallet.active));
      setTempChannel(false);
    }
  }, [tempChannel]);

  const getBalancWebLN = async () => {
    try {
      setIsLoading(true);
      await window.webln.enable();
      let data = await window.webln.getBalance();
      // localStorage.setItem("wallet-balance", `${data.balance}`);
      setIsLoading(false);
      setBalance(data.balance);
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
      setWallets(checkTokens.wallets);
      setBalance(b);
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

  const getNWCData = async (activeWallet) => {
    try {
      setIsLoading(true);
      const nwc = new webln.NWC({ nostrWalletConnectUrl: activeWallet.data });
      await nwc.enable();
      const balanceResponse = await nwc.getBalance();

      setBalance(balanceResponse.balance);
      // setWalletTransactions(t);
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  const handleSatsDisplay = (e) => {
    e.stopPropagation();
    if (isHidden) {
      setIsHidden("");
      localStorage.removeItem("isSatsHidden");
      return;
    }
    let ts = Date.now().toString();
    setIsHidden(ts);
    localStorage.setItem("isSatsHidden", ts);
  };

  if (!(nostrKeys && (nostrKeys?.ext || nostrKeys?.sec))) return;
  return (
    <div
      className="fit-container fx-scattered box-pad-h-m balance-container mb-hide"
      style={{ borderLeft: "2px solid var(--orange-main)", margin: ".75rem" }}
      onClick={(e) => {
        e.stopPropagation();
        navigateTo("/wallet");
      }}
    >
      <div
        className="fx-centered fx-col fit-container fx-start-v "
        style={{ rowGap: 0 }}
      >
        {!isLoading && (
          <div className="fx-centered">
            {!isHidden && <h3>{balance}</h3>}
            {isHidden && <h3>*****</h3>}
            <div className="sats-24"></div>
          </div>
        )}
        {isLoading && <LoadingDots />}
        <SatsToUSD sats={balance} isHidden={isHidden} />
      </div>
      {!isHidden && (
        <div className="eye-closed-24" onClick={handleSatsDisplay}></div>
      )}
      {isHidden && (
        <div className="eye-opened-24" onClick={handleSatsDisplay}></div>
      )}
    </div>
  );
}

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
    localStorage.setItem("yaki-wallets", JSON.stringify(tempWallets));
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
