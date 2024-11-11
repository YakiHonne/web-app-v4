import React, { useEffect, useState } from "react";
import {
  getBech32,
  getEmptyuserMetadata,
  getHex,
  getParsedNote,
  getParsedRepEvent,
} from "../../Helpers/Encryptions";
import { nip19 } from "nostr-tools";
import { Link } from "react-router-dom";
import { getNoteTree } from "../../Helpers/Helpers";
import KindOne from "./KindOne";
import LoadingDots from "../LoadingDots";
import MinimalPreviewWidget from "../SmartWidget/MinimalPreviewWidget";
import WidgetCard from "./WidgetCard";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";

export default function Nip19Parsing({ addr, minimal = false }) {
  const [event, setEvent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState("/");
  useEffect(() => {
    let filter = [];
    try {
      if (addr.startsWith("naddr")) {
        let data = nip19.decode(addr);

        filter.push({
          kinds: [data.data.kind],
          "#d": [data.data.identifier],
          authors: [data.data.pubkey],
        });
        let url_ = "";
        if (data.data.kind === 30023) url_ = `/article/${addr}`;
        if ([30004, 30005].includes(data.data.kind))
          url_ = `/curations/${addr}`;
        if (data.data.kind === 34235) url_`/videos/${addr}`;
        setUrl(url_);
      }
      if (addr.startsWith("nprofile")) {
        let data = nip19.decode(addr);
        filter.push({
          kinds: [0],
          authors: [data.data.pubkey],
        });
        let url_ = `/users/${addr}`;
        setUrl(url_);
      }
      if (addr.startsWith("npub")) {
        let data = nip19.decode(addr);

        let pubkey = "";
        if (typeof data.data === "string") pubkey = data.data;
        else if (data.data.pubkey) pubkey = data.data.pubkey;
        filter.push({
          kinds: [0],
          authors: [pubkey],
        });
        let hex = getHex(addr.replace(",", "").replace(".", ""));
        let url_ = `/users/${nip19.nprofileEncode({ pubkey: hex })}`;
        setUrl(url_);
      }

      if (addr.startsWith("nevent") || addr.startsWith("note")) {
        let data = nip19.decode(addr);
        filter.push({
          kinds: [1],
          ids: [data.data.id || data.data],
        });
      }
    } catch (err) {
      // console.log(err);
      setIsLoading(false);
      return;
    }

    const sub = ndkInstance.subscribe(filter, {
      // cacheUsage: "ONLY_RELAY",
      cacheUsage: "CACHE_FIRST",
      groupable: false,
      subId: "nip19-parsing",
    });

    sub.on("event", async (event) => {
      if (event.kind === 0) {
        let content = JSON.parse(event.content);
        setEvent({
          kind: event.kind,
          picture: content.picture || "",
          name:
            content.name ||
            content.display_name ||
            getBech32("npub", event.pubkey).substring(0, 10),
          display_name:
            content.display_name ||
            content.name ||
            getBech32("npub", event.pubkey).substring(0, 10),
        });
      }
      if (event.kind === 1) {
        let parsedEvent = await getParsedNote(event);
        setEvent(parsedEvent);
        setIsLoading(false);
      }

      if (event.kind === 30031) {
        let metadata = JSON.parse(event.content);
        let parsedContent = getParsedRepEvent(event);
        setEvent({
          ...parsedContent,
          metadata,
          ...event,
          author: getEmptyuserMetadata(event.pubkey),
        });
        saveUsers([event.pubkey]);
        setIsLoading(false);
      }
      if ([30004, 30005, 30023, 34235].includes(event.kind)) {
        let titleTag = event.tags.find((tag) => tag[0] === "title");
        let title = "";
        if (titleTag) title = titleTag[1];
        if (!title) {
          if ([30004, 30005].includes(event.kind)) title = "Untitled curation";
          if ([30023].includes(event.kind)) title = "Untitled Article";
          if ([34235].includes(event.kind)) title = "Untitled video";
        }
        setEvent({
          kind: event.kind,
          title,
        });
      }
      setIsLoading(false);
      sub.stop();
    });

    let timer = setTimeout(() => {
      setIsLoading(false);
      clearTimeout(timer);
    }, 4000);

    return () => {
      sub.stop();
      clearTimeout(timer);
    };
  }, []);

  if (
    event?.kind === 1 ||
    ((addr.startsWith("nevent") || addr.startsWith("note")) && addr.length > 20)
  )
    return (
      <>
        {!minimal && (
          <>
            {event && (
              <div className="fit-container" style={{ paddingTop: ".5rem" }}>
                <KindOne event={event} reactions={false} />
              </div>
            )}
            {isLoading && !event && (
              <div
                style={{
                  backgroundColor: "var(--c1-side)",
                  marginTop: ".5rem",
                }}
                className="fit-container box-pad-h box-pad-v sc-s-18 fx-centered"
              >
                <p className="p-medium gray-c">Loading note</p>
                <LoadingDots />
              </div>
            )}
            {!isLoading && !event && (
              <div
                style={{
                  backgroundColor: "var(--c1-side)",
                  marginTop: ".5rem",
                }}
                className="fit-container box-pad-h-m box-pad-v-m sc-s-18 fx-centered"
              >
                <p className="p-medium gray-c">Note not available</p>
              </div>
            )}
          </>
        )}
        {minimal && (
          <Link
            to={`/notes/${addr}`}
            className="btn-text-gray"
            target={"_blank"}
            onClick={(e) => e.stopPropagation()}
            style={{ color: "var(--orange-main)" }}
          >
            @{addr.substring(0, 10)}
          </Link>
        )}
      </>
    );

  if (!event)
    return (
      <Link
        to={`/${addr}`}
        className="btn-text-gray"
        target={"_blank"}
        onClick={(e) => e.stopPropagation()}
        style={{ color: "var(--orange-main)" }}
      >
        @{addr.substring(0, 10)}
      </Link>
    );
  if (event.kind === 0)
    return (
      <Link
        to={url}
        className="btn-text-gray"
        target={"_blank"}
        onClick={(e) => e.stopPropagation()}
        style={{ color: "var(--orange-main)" }}
      >
        @{event.display_name}
      </Link>
    );
  if (event.kind === 30031)
    return (
      <div className="fit-container box-pad-v-s">
        {!minimal && (
          <WidgetCard widget={event} deleteWidget={null} options={false} />
          // <PreviewWidget widget={event.metadata} pubkey={event.pubkey} />
        )}
        {minimal && <MinimalPreviewWidget widget={event} />}
      </div>
    );

  if ([30004, 30005, 30023, 34235].includes(event.kind))
    return (
      <Link
        to={url}
        className="btn-text-gray"
        target={"_blank"}
        onClick={(e) => e.stopPropagation()}
        style={{ color: "var(--orange-main)" }}
      >
        {event.title}
      </Link>
    );
}
