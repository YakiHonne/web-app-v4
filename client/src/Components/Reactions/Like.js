import React, { useEffect, useState } from "react";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { useDispatch, useSelector } from "react-redux";
import { getEventStatAfterEOSE, InitEvent } from "../../Helpers/Controlers";
import { saveEventStats } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { useTranslation } from "react-i18next";

export default function Like({ isLiked, event, actions, tagKind = "e" }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const userKeys = useSelector((state) => state.userKeys);
  const [isLoading, setIsLoading] = useState(false);
  const [eventID, setEventID] = useState(false);

  useEffect(() => {
    const updateDb = async () => {
      let subscription = ndkInstance.subscribe([{ ids: [eventID] }], {
        groupable: false,
        skipVerification: true,
        skipValidation: true,
      });
      subscription.on("event", (event_) => {
        let stats = getEventStatAfterEOSE(event_, "likes", actions, undefined);

        saveEventStats(event.aTag || event.id, stats);
        subscription.stop();
        setEventID(false);
      });
    };
    if (eventID) updateDb();
  }, [eventID]);

  const reactToNote = async (e) => {
    e.stopPropagation();
    if (isLoading) return;
    try {
      if (!userKeys) {
        return false;
      }
      if (isLiked) {
        setIsLoading(true);
        let content = "This reaction will be deleted!";
        let tags = [["e", isLiked.id]];
        let eventInitEx = await InitEvent(5, content, tags);
        if (!eventInitEx) {
          setIsLoading(false);
          return;
        }
        dispatch(
          setToPublish({
            eventInitEx,
            allRelays: [],
            toRemoveFromCache: {
              kind: "likes",
              eventId: event.aTag || event.id,
            },
          })
        );
        setEventID(false);
        setIsLoading(false);
        return false;
      }

      setIsLoading(true);
      let content = "+";
      let tags = [
        [tagKind, event.aTag || event.id],
        ["p", event.pubkey],
      ];
      let eventInitEx = await InitEvent(7, content, tags);
      if (!eventInitEx) {
        setIsLoading(false);
        return;
      }
      dispatch(
        setToPublish({
          eventInitEx,
          allRelays: [],
        })
      );

      setIsLoading(false);
      setEventID(eventInitEx.id);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  return (
    <div
      className={"icon-tooltip"}
      data-tooltip={t("AJW1vH9")}
      onClick={reactToNote}
    >
      <div className={isLiked ? "heart-bold-24" : "heart-24"}></div>
    </div>
  );
}
