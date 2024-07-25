import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../Context/Context";
import { nip19, SimplePool } from "nostr-tools";
import { filterRelays } from "../../Helpers/Encryptions";
import relaysOnPlatform from "../../Content/Relays";
import { getNoteTree } from "../../Helpers/Helpers";
import LoadingDots from "../LoadingDots";
const pool = new SimplePool();

export default function ZapPollsPreview({
  event,
  nevent,
  content_text_color,
  options_text_color,
  options_background_color,
  options_foreground_color,
}) {
  const { nostrUser } = useContext(Context);
  const [poll, setPoll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getData = async () => {
      setIsLoading(true);
      if (event) {
        let options = event.tags
          .filter((tag) => tag[0] === "poll_option")
          .map((tag) => tag[2]);
        let parsed_content = await getNoteTree(event.content);
        setPoll({ options, content: event.content, parsed_content });
        setIsLoading(false);
      }
      let relaysToUse = filterRelays(nostrUser?.relays || [], relaysOnPlatform);
      let id;
      try {
        id = nip19.decode(nevent).data.id;
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
      if (!id) return;
      const sub = pool.subscribeMany(
        relaysToUse,
        [{ kinds: [6969], ids: [id] }],
        {
          async onevent(event) {
            try {
              let options = event.tags
                .filter((tag) => tag[0] === "poll_option")
                .map((tag) => tag[2]);
              let parsed_content = await getNoteTree(event.content);
              setPoll({ options, content: event.content, parsed_content });
              setIsLoading(false);
            } catch (err) {
              console.log(err);
              setIsLoading(false);
            }
          },
          oneose() {
            sub.close();
            pool.close(relaysToUse);
            setIsLoading(false);
          },
        }
      );
    };
    if (!nevent && !event) return;
    getData();
  }, [nevent, event]);

  if (!nevent && !event)
    return (
      <div className="fx-centered">
        <p className="orange-c p-italic p-medium">No poll selected</p>
      </div>
    );
  if ((isLoading && !poll) || !poll)
    return (
      <div className="fx-centered">
        <p className="gray-c p-italic p-medium">Loading poll</p>
        <LoadingDots />
      </div>
    );

  return (
    <div className="fit-container fx-centered fx-col">
      <div
        className="fit-container poll-content-box"
        style={{ "--p-color": content_text_color }}
      >
        {poll.parsed_content}
      </div>
      <div className="fx-col fx-centered fit-container">
        {poll.options.map((option, index) => {
          return (
            <div
              key={index}
              className="box-pad-h-m box-pad-v-s sc-s-18 fit-container"
              style={{
                border: "none",
                backgroundColor:
                  options_background_color || "var(--very-dim-gray)",
                position: "relative",
              }}
            >
              <div
                className="sc-s-18"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: "30%",
                  border: "none",
                  backgroundColor:
                    options_foreground_color || "var(--pale-gray)",
                  zIndex: 0,
                }}
              ></div>
              <p
                style={{
                  color: options_text_color,
                  zIndex: 2,
                  position: "relative",
                }}
              >
                {option}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
