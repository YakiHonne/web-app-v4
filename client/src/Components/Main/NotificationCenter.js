import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { setToast } from "../../Store/Slides/Publishers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getFollowings,
  getNotificationLastEventTS,
  saveNotificationLastEventTS,
} from "../../Helpers/DB";
import { useDispatch, useSelector } from "react-redux";
import NumberShrink from "../NumberShrink";

export default function NotificationCenter({
  icon = false,
  mobile = false,
  dismiss = false,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const [notifications, setNotifications] = useState(
    // localStorage.getItem("new-notification")
    //   ? parseInt(localStorage.getItem("new-notification"))
    //   : 0
    0
  );

  useEffect(() => {
    const fetchData = async () => {
      let localStorageKey = `new-notification-${userKeys.pub}`;
      setNotifications(
        localStorage.getItem(localStorageKey)
          ? parseInt(localStorage.getItem(localStorageKey))
          : 0
      );
      let userFollowings = await getFollowings(userKeys.pub);
      userFollowings = userFollowings ? userFollowings.followings : [];
      const lastEventCreatedAt = await getNotificationLastEventTS(userKeys.pub);
      let created_at = lastEventCreatedAt + 1 || 0;

      let events = 0;
      const sub = ndkInstance.subscribe(
        [
          {
            kinds: [30023, 30004, 34235, 30031],
            authors: userFollowings,
            limit: 100,
            since: lastEventCreatedAt ? lastEventCreatedAt + 1 : undefined,
          },
          {
            kinds: [1],
            authors: userFollowings,
            "#l": ["FLASH NEWS"],
            limit: 100,
            since: lastEventCreatedAt ? lastEventCreatedAt + 1 : undefined,
          },
          {
            kinds: [7],
            "#p": [userKeys.pub],
            limit: 100,
            since: lastEventCreatedAt ? lastEventCreatedAt + 1 : undefined,
          },
          {
            kinds: [6],
            "#p": [userKeys.pub],
            limit: 100,
            since: lastEventCreatedAt ? lastEventCreatedAt + 1 : undefined,
          },
          {
            kinds: [30023, 30004, 34235, 30031],
            "#p": [userKeys.pub],
            limit: 100,
            since: lastEventCreatedAt ? lastEventCreatedAt + 1 : undefined,
          },
          {
            kinds: [9735],
            "#p": [userKeys.pub],
            limit: 100,
            since: lastEventCreatedAt ? lastEventCreatedAt + 1 : undefined,
          },
          {
            kinds: [1],
            "#p": [userKeys.pub],
            limit: 100,
            since: lastEventCreatedAt ? lastEventCreatedAt + 1 : undefined,
          },
        ],
        {
          cacheUsage: "CACHE_FIRST",
          groupable: false,
          skipValidation: true,
          skipVerification: true,
        }
      );

      sub.on("event", (event) => {
        let checkForLabel = event.tags.find((tag) => tag[0] === "l");
        let isUncensored = checkForLabel
          ? ["UNCENSORED NOTE RATING", "UNCENSORED NOTE"].includes(
              checkForLabel[1]
            )
          : false;

        if (!isUncensored && event.pubkey !== userKeys.pub) {
          events = events + 1;
          localStorage.setItem(localStorageKey, events);
          setNotifications((prev) => prev + 1);
          if (created_at < event.created_at) {
            created_at = event.created_at;
            saveNotificationLastEventTS(userKeys.pub, event.created_at);
          }
          dispatch(
            setToast({
              type: 1,
              desc: "New Notification!",
            })
          );
        }
      });
    };

    if (userKeys && window.location.pathname !== "/notifications") {
      fetchData();
    } else {
      setNotifications(0);
    }
  }, [userKeys]);
  const handleOnClick = () => {
    let localStorageKey = `new-notification-${userKeys.pub}`;
    localStorage.setItem(localStorageKey, 0);
    if (dismiss) dismiss();
    navigate("/notifications");
  };
  return (
    <>
      <div
        className={
          icon
            ? "round-icon"
            : "pointer fit-container fx-scattered  box-pad-h-s box-pad-v-s inactive-link"
        }
        onClick={handleOnClick}
      >
        <div className="fx-centered">
          <div className="ringbell-24"></div>
          {!icon && (
            <div className={`link-label ${mobile ? "p-big" : ""}`}>
              Notifications
            </div>
          )}
        </div>
        {notifications !== 0 && (
          <div className="sticker sticker-small sticker-red">
            <NumberShrink value={notifications} />
          </div>
        )}
      </div>
    </>
  );
}
