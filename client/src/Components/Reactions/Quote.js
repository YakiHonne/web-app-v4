import React, { useEffect, useState } from "react";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { useDispatch, useSelector } from "react-redux";
import { getEventStatAfterEOSE, InitEvent } from "../../Helpers/Controlers";
import { saveEventStats } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import QuoteNote from "../Main/QuoteNote";
import { extractNip19 } from "../../Helpers/Helpers";
import WriteNote from "../Main/WriteNote";

export default function Quote({ isQuoted, event, actions }) {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const [isLoading, setIsLoading] = useState(false);
  const [eventID, setEventID] = useState(false);
  const [showQuoteBox, setShowQuoteBox] = useState(false);

  useEffect(() => {
    const updateDb = async () => {
      let subscription = ndkInstance.subscribe([{ ids: [eventID] }], {
        groupable: false,
        skipVerification: true,
        skipValidation: true,
      });
      subscription.on("event", (event_) => {
        let stats = getEventStatAfterEOSE(event_, "quotes", actions, undefined);

        saveEventStats(event.aTag || event.id, stats);
        subscription.stop();
        setEventID(false);
      });
    };
    if (eventID) updateDb();
  }, [eventID]);

  const reactToNote = async (data) => {
    if (isLoading) return;
    try {
      if (!userKeys) {
        return false;
      }

      setIsLoading(true);
      let content = extractNip19(data);
      let tags = [
        ["q", event.aTag || event.id],
        ["p", event.pubkey],
      ];
      let eventInitEx = await InitEvent(1, content.content, [
        ...tags,
        ...content.tags.filter((tag) => tag[1] !== (event.aTag || event.id)),
      ]);
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
      setShowQuoteBox(false);
      setEventID(eventInitEx.id);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
    }
  };

  return (
    <>
      {showQuoteBox && (
        // <QuoteNote
        //   isLoading={isLoading}
        //   note={event}
        //   exit={() => setShowQuoteBox(false)}
        //   reactToNote={reactToNote}
        // />
        <div className="fixed-container fx-centered box-pad-h">
          <div style={{ width: "min(100%, 600px)" }}>
            <WriteNote
              exit={() => setShowQuoteBox(false)}
              linkedEvent={event}
              isQuote={true}
              content={""}
            />
          </div>
        </div>
      )}
      <div
        className={"icon-tooltip"}
        data-tooltip="Quote"
        onClick={() => setShowQuoteBox(true)}
      >
        <div
          className={isQuoted ? "quote-bold-24 pointer" : "quote-24 pointer"}
        ></div>
      </div>
    </>
  );
}
