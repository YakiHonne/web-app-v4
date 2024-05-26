import axios, { spread } from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  decodeUrlOrAddress,
  encodeLud06,
  shortenKey,
} from "../../Helpers/Encryptions";
import axiosInstance from "../../Helpers/HTTP_Client";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import QRCode from "react-qr-code";
import relaysOnPlatform from "../../Content/Relays";
import { getZapEventRequest } from "../../Helpers/NostrPublisher";
import { Context } from "../../Context/Context";
import { SimplePool } from "nostr-tools";
import LoadingDots from "../LoadingDots";
import LoginNOSTR from "./LoginNOSTR";

const pool = new SimplePool();

export default function ZapTip({
  recipientLNURL,
  recipientPubkey,
  senderPubkey,
  recipientInfo,
  aTag = "",
  eTag = "",
  forContent = "",
  onlyIcon = false,
  smallIcon = false,
}) {
  const { nostrKeys } = useContext(Context);
  const [callback, setCallback] = useState(false);
  const [showCashier, setCashier] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (callback) return;
      try {
        const data = await axios.get(decodeUrlOrAddress(recipientLNURL));
        setCallback(data.data.callback);
      } catch (err) {
        console.error(err);
      }
    };
    if (!callback) fetchData();
  }, [recipientLNURL]);

  if (
    !recipientLNURL ||
    !recipientPubkey ||
    // !senderPubkey ||
    !callback ||
    senderPubkey === recipientPubkey
  )
    return (
      <>
        {onlyIcon && (
          <div
            className={smallIcon ? "bolt" : "bolt-24"}
            style={{ opacity: ".2" }}
          ></div>
        )}
        {!onlyIcon && (
          <button className="btn btn-disabled">
            <div
              className="lightning if-disabled"
              style={{ filter: "invert()" }}
            ></div>
          </button>
        )}
      </>
    );
  if (!senderPubkey)
    return (
      <>
        {showLogin && <LoginNOSTR exit={() => setShowLogin(false)} />}
        {onlyIcon && (
          <div
            className={smallIcon ? "bolt" : "bolt-24"}
            onClick={() => setShowLogin(true)}
          ></div>
        )}
        {!onlyIcon && (
          <button className="btn btn-normal" onClick={() => setShowLogin(true)}>
            <div className="lightning" style={{ filter: "invert()" }}></div>
          </button>
        )}
      </>
    );
  return (
    <>
      {showCashier && (
        <Cashier
          recipientLNURL={recipientLNURL}
          recipientPubkey={recipientPubkey}
          senderPubkey={senderPubkey}
          callback={callback}
          recipientInfo={recipientInfo}
          aTag={aTag}
          eTag={eTag}
          exit={() => setCashier(false)}
          forContent={forContent}
        />
      )}
      {onlyIcon && (
        <div
          className={smallIcon ? "bolt" : "bolt-24"}
          onClick={() => setCashier(true)}
        ></div>
      )}
      {!onlyIcon && (
        <button className="btn btn-normal" onClick={() => setCashier(true)}>
          <div className="lightning" style={{ filter: "invert()" }}></div>
        </button>
      )}
    </>
  );
}

const Cashier = ({
  recipientLNURL,
  recipientPubkey,
  senderPubkey,
  callback,
  recipientInfo,
  aTag,
  eTag,
  exit,
  forContent,
}) => {
  const {
    nostrKeys,
    setToast,
    nostrUser,
    setUpdatedActionFromYakiChest,
    updateYakiChestStats,
  } = useContext(Context);
  const [amount, setAmount] = useState(1);
  const [message, setMessage] = useState("");
  const [invoice, setInvoice] = useState("");
  // const [confirmation, setConfirmation] = useState("confirmed");
  const [confirmation, setConfirmation] = useState("initiated");
  const canvas = useRef(null);

  const predefined_amounts = [
    { amount: 500, entitle: "500" },
    { amount: 1000, entitle: "1k" },
    { amount: 3000, entitle: "3k" },
    { amount: 5000, entitle: "5k" },
  ];

  const onConfirmation = async () => {
    try {
      if (!nostrKeys || !amount) {
        setToast({ type: 2, desc: "User is not connected or amount is null!" });
        return;
      }
      let sats = amount * 1000;
      let tags = [
        ["relays", ...relaysOnPlatform],
        ["amount", sats.toString()],
        ["lnurl", recipientLNURL],
        ["p", recipientPubkey],
      ];
      if (aTag) tags.push(["a", aTag]);
      if (eTag) tags.push(["e", eTag]);
      const event = await getZapEventRequest(nostrKeys, message, tags);
      if (!event) {
        return;
      }
      let tempRecipientLNURL = recipientLNURL.includes("@")
        ? encodeLud06(decodeUrlOrAddress(recipientLNURL))
        : recipientLNURL;

      const res = await axios(
        `${callback}?amount=${sats}&nostr=${event}&lnurl=${tempRecipientLNURL}`
      );

      if (res.data.status === "ERROR") {
        setToast({
          type: 2,
          desc: "Something went wrong when processing payment!",
        });
        return;
      }
      setInvoice(res.data.pr);
      setConfirmation("in_progress");
      const { webln } = window;
      if (webln) {
        await webln.enable();
        try {
          webln.sendPayment(res.data.pr);
        } catch (err) {
          console.log(err);
        }
      }
      let sub = pool.subscribeMany(
        relaysOnPlatform,
        [
          {
            kinds: [9735],
            // authors: [senderPubkey],
            "#p": [recipientPubkey],
            since: Math.floor(Date.now() / 1000 - 10),
          },
        ],
        {
          onevent(event) {
            updateYakiChest();
            setConfirmation("confirmed");
          },
        }
      );
    } catch (err) {
      console.log(err);
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    setToast({
      type: 1,
      desc: `LNURL was copied! 👏`,
    });
  };

  const updateYakiChest = async () => {
    try {
      let action_key = getActionKey();
console.log(action_key)
      if (action_key) {
        let data = await axiosInstance.post("/api/v1/yaki-chest", {
          action_key,
        });
        console.log(data.data)
        let { user_stats, is_updated } = data.data;

        if (is_updated) {
          setUpdatedActionFromYakiChest(is_updated);
          updateYakiChestStats(user_stats);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getActionKey = () => {
    if (amount > 0 && amount <= 20) return "zap-1";
    if (amount <= 60) return "zap-20";
    if (amount <= 100) return "zap-60";
    if (amount > 100) return "zap-100";
    return false;
  };

  return (
    <div
      className="fixed-container fx-centered box-pad-h"
      onClick={(e) => {
        e.stopPropagation();
        exit();
      }}
    >
      <section
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="sc-s box-pad-h box-pad-v"
        style={{ width: "min(100%, 500px)", position: "relative" }}
      >
        <div
          className="close"
          onClick={(e) => {
            e.stopPropagation();
            exit();
          }}
        >
          <div></div>
        </div>
        <div
          className="fx-centered fit-container box-marg-s fx-start-h"
          style={{ columnGap: "24px" }}
        >
          <UserProfilePicNOSTR size={75} img={recipientInfo.picture} />
          <div className="fx-centered fx-col fx-start-v">
            <h5>Pay a tip</h5>
            <p>
              From: <span className="c1-c">{nostrUser.name}</span>
            </p>
            <p>
              To: <span className="c1-c">{recipientInfo.name}</span>
            </p>
            {forContent && (
              <p>
                For: <span className="c1-c">{forContent}</span>
              </p>
            )}
          </div>
        </div>
        {/* <hr style={{ margin: "1rem auto" }} /> */}
        {confirmation === "initiated" && (
          <div className="fx-centered fx-col fit-container fx-start-v">
            <div className="fit-container" style={{ position: "relative" }}>
              <input
                type="number"
                className="if ifs-full"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
              />
              <div
                className="fx-centered"
                style={{ position: "absolute", right: "16px", top: "16px" }}
              >
                <p className="gray-c">sats</p>
              </div>
            </div>
            <div className="fit-container fx-scattered">
              {predefined_amounts.map((item, index) => {
                return (
                  <button
                    className={`fx btn ${
                      amount === item.amount ? "btn-normal" : "btn-gst"
                    }`}
                    key={index}
                    onClick={() => setAmount(item.amount)}
                  >
                    {item.entitle} {index === 0 && <span>😀</span>}
                    {index === 1 && <span>🥳</span>}
                    {index === 2 && <span>🤩</span>}
                    {index === 3 && <span>🤯</span>}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              className="if ifs-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tip message (optional)"
            />
            <button
              className="btn btn-normal btn-full"
              onClick={onConfirmation}
            >
              Start confirmation
            </button>
          </div>
        )}
        {confirmation === "in_progress" && (
          <div className="fx-centered fx-col fit-container">
            <QRCode
              style={{ width: "100%", aspectRatio: "1/1" }}
              size={400}
              value={invoice}
            />
            <div
              className="fx-scattered if pointer dashed-onH fit-container box-marg-s"
              style={{ borderStyle: "dashed" }}
              onClick={() => copyKey(invoice)}
            >
              <p>{shortenKey(invoice)}</p>
              <div className="copy-24"></div>
            </div>
            <div className="fit-container fx-centered">
              <p className="gray-c p-medium">Waiting for response</p>
              <LoadingDots />
            </div>
          </div>
        )}
        {confirmation === "confirmed" && (
          <div
            className="fx-centered fx-col fit-container"
            style={{ height: "16vh" }}
          >
            <div className="box-pad-v-s"></div>
            <h4>Payment succeeded!</h4>
            <p className="gray-c box-pad-v-s">
              You have tipped <span className="c1-c">{amount}</span> sats
            </p>
            <button className="btn btn-normal" onClick={exit}>
              Done!
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
