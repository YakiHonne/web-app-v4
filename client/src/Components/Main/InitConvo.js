import React, { useEffect, useState } from "react";
import {
  SimplePool,
  nip04,
  nip44,
  getEventHash,
  generateSecretKey,
  finalizeEvent,
} from "nostr-tools";
import { bytesTohex } from "../../Helpers/Encryptions";
import relaysOnPlatform from "../../Content/Relays";
import LoadingDots from "../../Components/LoadingDots";
import NProfilePreviewer from "../../Components/Main/NProfilePreviewer";
import UserSearchBar from "../../Components/UserSearchBar";
import axiosInstance from "../../Helpers/HTTP_Client";
import { useDispatch, useSelector } from "react-redux";
import { updateYakiChestStats } from "../../Helpers/Controlers";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { setUpdatedActionFromYakiChest } from "../../Store/Slides/YakiChest";

export default function InitiConvo({ exit, receiver = false }) {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userRelays = useSelector((state) => state.userRelays);
  const [selectedPerson, setSelectedPerson] = useState(receiver || "");
  const [message, setMessage] = useState("");
  const [legacy, setLegacy] = useState(
    userKeys.sec || window?.nostr?.nip44
      ? localStorage.getItem("legacy-dm")
      : true
  );
  const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   if (!isPublishing && toPublish) exit();
  // }, [isPublishing]);

  const handleSendMessage = async () => {
    if (
      !message ||
      !userKeys ||
      !selectedPerson ||
      (userKeys && !(userKeys.ext || userKeys.sec))
    )
      return;

    let relaysToPublish = userRelays;

    if (legacy) {
      setIsLoading(true);
      let encryptedMessage = "";
      if (userKeys.ext) {
        try {
          encryptedMessage = await window.nostr.nip04.encrypt(
            selectedPerson,
            message
          );
        } catch (err) {
          setIsLoading(false);
          return;
        }
      } else {
        encryptedMessage = await nip04.encrypt(
          userKeys.sec,
          selectedPerson,
          message
        );
      }
      let tags = [];
      tags.push(["p", selectedPerson]);

      let created_at = Math.floor(Date.now() / 1000);
      let tempEvent = {
        created_at,
        kind: 4,
        content: encryptedMessage,
        tags,
      };
      if (userKeys.ext) {
        try {
          tempEvent = await window.nostr.signEvent(tempEvent);
        } catch (err) {
          console.log(err);
          setIsLoading(false);
          return false;
        }
      } else {
        tempEvent = finalizeEvent(tempEvent, userKeys.sec);
      }
      dispatch(
        setToPublish({
          eventInitEx: tempEvent,
          allRelays: relaysToPublish,
        })
      );
      setIsLoading(false);
      exit();
    }
    if (!legacy) {
      let { sender_event, receiver_event } = await getGiftWrap();
      setIsLoading(true);
      let response = await initPublishing(
        relaysToPublish,
        sender_event,
        receiver_event
      );

      if (response) {
        let action_key =
          selectedPerson ===
          "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3"
            ? "dms-10"
            : "dms-5";
        updateYakiChest(action_key);
        setIsLoading(false);
        exit();
      } else {
        setIsLoading(false);
      }
    }
  };

  const updateYakiChest = async (action_key) => {
    try {
      let data = await axiosInstance.post("/api/v1/yaki-chest", {
        action_key,
      });
      let { user_stats, is_updated } = data.data;

      if (is_updated) {
        dispatch(setUpdatedActionFromYakiChest(is_updated));
        updateYakiChestStats(user_stats);
      }
      exit();
    } catch (err) {
      console.log(err);
      exit();
    }
  };

  const getGiftWrap = async () => {
    let g_sk_1 = bytesTohex(generateSecretKey());
    let g_sk_2 = bytesTohex(generateSecretKey());

    let [signedKind13_1, signedKind13_2] = await Promise.all([
      getEventKind13(selectedPerson),
      getEventKind13(userKeys.pub),
    ]);

    let content_1 = nip44.v2.encrypt(
      JSON.stringify(signedKind13_1),
      nip44.v2.utils.getConversationKey(g_sk_1, selectedPerson)
    );
    let content_2 = nip44.v2.encrypt(
      JSON.stringify(signedKind13_2),
      nip44.v2.utils.getConversationKey(g_sk_2, userKeys.pub)
    );
    let event_1 = {
      created_at: Math.floor(Date.now() / 1000) - 432000,
      kind: 1059,
      tags: [["p", selectedPerson]],
      content: content_1,
    };
    let event_2 = {
      created_at: Math.floor(Date.now() / 1000) - 432000,
      kind: 1059,
      tags: [["p", userKeys.pub]],
      content: content_2,
    };
    event_1 = finalizeEvent(event_1, g_sk_1);
    event_2 = finalizeEvent(event_2, g_sk_2);
    return { sender_event: event_2, receiver_event: event_1 };
  };

  const getEventKind14 = () => {
    let event = {
      pubkey: userKeys.pub,
      created_at: Math.floor(Date.now() / 1000),
      kind: 14,
      tags: [
        ["p", selectedPerson],
        ["p", userKeys.pub],
      ],
      content: message,
    };

    event.id = getEventHash(event);
    return event;
  };

  const getEventKind13 = async (pubkey) => {
    let unsignedKind14 = getEventKind14();
    let content = userKeys.sec
      ? nip44.default.v2.encrypt(
          JSON.stringify(unsignedKind14),
          nip44.v2.utils.getConversationKey(userKeys.sec, pubkey)
        )
      : await window.nostr.nip44.encrypt(
          pubkey,
          JSON.stringify(unsignedKind14)
        );
    let event = {
      created_at: Math.floor(Date.now() / 1000) - 432000,
      kind: 13,
      tags: [],
      content,
    };
    event = userKeys.sec
      ? finalizeEvent(event, userKeys.sec)
      : await window.nostr.signEvent(event);
    return event;
  };

  const initPublishing = async (relays, event1, event2) => {
    try {
      let pool_ev1 = new SimplePool();
      let pool_ev2 = new SimplePool();
      let [res1, res2] = await Promise.race([
        Promise.allSettled(pool_ev1.publish(relaysOnPlatform, event1)),
        Promise.allSettled(pool_ev2.publish(relaysOnPlatform, event2)),
      ]);

      if (res1.status === "rejected") {
        dispatch(
          setToast({
            type: 2,
            desc: "Error sending the message.",
          })
        );
        return false;
      }

      dispatch(
        setToast({
          type: 1,
          desc: "Message sent!",
        })
      );

      return true;
    } catch (err) {
      console.log(err);
      dispatch(
        setToast({
          type: 2,
          desc: "Error sending the message.",
        })
      );
      return false;
    }
  };

  const handleLegacyDMs = () => {
    if (legacy) {
      localStorage.removeItem("legacy-dm");
      setLegacy(false);
    } else {
      localStorage.setItem("legacy-dm", `${Date.now()}`);
      setLegacy(true);
    }
  };

  return (
    <div className="fixed-container fx-centered box-pad-h">
      <div
        className="box-pad-h box-pad-v sc-s-18"
        style={{
          position: "relative",
          width: "min(100%, 500px)",
          borderColor: !legacy ? "var(--green-main)" : "",
          transition: ".2s ease-in-out",
        }}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <h4 className="box-marg-s">Start a conversation</h4>
        <div
          className="fx-centered fx-col fit-container"
          style={{ pointerEvents: isLoading ? "none" : "auto" }}
        >
          {!selectedPerson && <UserSearchBar onClick={setSelectedPerson} />}
          {selectedPerson && (
            <NProfilePreviewer
              pubkey={selectedPerson}
              margin={false}
              close={receiver ? false : true}
              showSha
              onClose={() => setSelectedPerson("")}
            />
          )}
          <textarea
            className="txt-area ifs-full"
            placeholder="What do you want to say?"
            style={{ height: "200px" }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          ></textarea>

          <div className="fit-container fx-scattered">
            <button
              className="btn btn-normal"
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              {isLoading ? <LoadingDots /> : "Send message"}
            </button>
            {(userKeys.sec || window?.nostr?.nip44) && (
              <div
                className="fx-centered round-icon-tooltip"
                data-tooltip={
                  legacy ? "Switch Secure DMs" : "Switch back to legacy"
                }
              >
                {/* {!legacy && ( */}
                <p className="p-medium slide-left">Secure DMs</p>
                {/* // )} */}
                {/* {legacy && (
                  <p className="p-medium gray-c slide-right">Legacy encryption</p>
                )} */}
                <div
                  className={`toggle ${legacy ? "toggle-dim-gray" : ""} ${
                    !legacy ? "toggle-green" : "toggle-dim-gray"
                  }`}
                  onClick={handleLegacyDMs}
                ></div>
              </div>
            )}
          </div>
          {legacy && <div className="box-pad-h-m box-pad-v-m fx-centered fx-start-h fit-container sc-s-18">
            <div className="info-tt-24"></div>
            <div>
              <p className="c1-c p-medium">
                For more security & privacy, consider enabling Secure DMs.
              </p>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}
