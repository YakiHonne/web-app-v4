import React, { useEffect, useRef, useState } from "react";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import UploadFile from "../UploadFile";
import HashSuggestions from "./HashSuggestions";
import LoadingDots from "../LoadingDots";
import Slider from "../Slider";
import BrowseSmartWidgets from "./BrowseSmartWidgets";
import PreviewWidget from "../SmartWidget/PreviewWidget";
import MentionSuggestions from "./MentionSuggestions";
import { nip19 } from "nostr-tools";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { extractNip19 } from "../../Helpers/Helpers";
import { InitEvent } from "../../Helpers/Controlers";
import { getZapEventRequest } from "../../Helpers/NostrPublisher";
import { encryptEventData, shortenKey } from "../../Helpers/Encryptions";
import axios from "axios";
import { ndkInstance } from "../../Helpers/NDKInstance";
import QRCode from "react-qr-code";

export default function WriteNote({ widget, exit, border = true, content }) {
  const navigateTo = useNavigate();
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const userMetadata = useSelector((state) => state.userMetadata);
  const userRelays = useSelector((state) => state.userRelays);
  const isPublishing = useSelector((state) => state.isPublishing);

  const [note, setNote] = useState(content);
  const [tag, setTag] = useState("");
  const [mention, setMention] = useState("");
  const [showHashSuggestions, setShowTagsSuggestions] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [showSmartWidgets, setShowSmartWidgets] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [invoice, setInvoice] = useState(false);
  const [imgsSet, setImgsSet] = useState([]);
  const [widgetsSet, setWidgetsSet] = useState([]);
  const [mentionSet, setMentionSet] = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    adjustHeight();
  }, [note]);

  useEffect(() => {
    if (widget) {
      handleAddWidget(widget);
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      if (note.charAt(note.length - 1) === "#") setShowTagsSuggestions(true);
      if (note.charAt(note.length - 1) === "@") setShowMentionSuggestions(true);
      else {
        let splitedNoteByHashtag = note.split("#");
        let splitedNoteByMention = note.split("@");
        if (
          (splitedNoteByHashtag[splitedNoteByHashtag.length - 1].includes(
            " "
          ) &&
            note.charAt(note.length - 1) !== "#") ||
          !note
        ) {
          setShowTagsSuggestions(false);
        }
        if (
          (splitedNoteByMention[splitedNoteByMention.length - 1].includes(
            " "
          ) &&
            note.charAt(note.length - 1) !== "@") ||
          !note
        ) {
          setShowMentionSuggestions(false);
        }
      }
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleChange = (event) => {
    let value = event.target.value;
    let splitedNoteByHashtag = value.split("#");
    let splitedNoteByMention = value.split("@");

    if (!splitedNoteByHashtag[splitedNoteByHashtag.length - 1].includes(" ")) {
      setTag(splitedNoteByHashtag[splitedNoteByHashtag.length - 1]);
    }
    if (!splitedNoteByMention[splitedNoteByMention.length - 1].includes(" ")) {
      setMention(splitedNoteByMention[splitedNoteByMention.length - 1]);
    }
    setNote(value);
  };

  const handleSelectingTags = (data) => {
    let splitedNoteByHashtag = note.split("#");
    splitedNoteByHashtag[splitedNoteByHashtag.length - 1] = data;

    setNote(splitedNoteByHashtag.join("#"));

    setShowTagsSuggestions(false);
    setTag("");
    if (textareaRef.current) textareaRef.current.focus();
  };
  const handleSelectingMention = (data) => {
    let splitedNoteByMention = note.split("@");
    splitedNoteByMention[splitedNoteByMention.length - 1] = data;

    setNote(splitedNoteByMention.join("@").replace("@npub", "npub"));
    setMentionSet((prev) => [...prev, data]);
    setShowMentionSuggestions(false);
    setMention("");
    if (textareaRef.current) textareaRef.current.focus();
  };

  const publishNote = async () => {
    try {
      if (isLoading) return;
      if (!userKeys) return;
      if (!note) {
        dispatch(
          setToast({
            type: 2,
            desc: "Note is empty!",
          })
        );
        return;
      }
      if (isPublishing) {
        dispatch(
          setToast({
            type: 3,
            desc: "An event publishing is in process!",
          })
        );
        return;
      }
      let tags = [
        [
          "client",
          "Yakihonne",
          "31990:20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3:1700732875747",
        ],
      ];

      if (widgetsSet.length > 0) {
        tags.push(["l", "smart-widget"]);
      }
      let processedContent = extractNip19(note);

      if (isPaid) {
        publishAsPaid(processedContent.content, [
          ...tags,
          ...processedContent.tags,
        ]);
      } else {
        publishAsFree(processedContent.content, [
          ...tags,
          ...processedContent.tags,
        ]);
      }

      // let eventInitEx = await InitEvent(1, processedContent.content, [
      //   ...tags,
      //   ...processedContent.tags,
      // ]);

      // if (!eventInitEx) {
      //   return;
      // }
      // dispatch(
      //   setToPublish({
      //     eventInitEx,
      //     allRelays: userRelays,
      //   })
      // );
      // navigateTo("/dashboard", { state: { tabNumber: 1, filter: "notes" } });
      // exit();
    } catch (err) {
      console.log(err);
      dispatch(
        setToast({
          type: 2,
          desc: "An error occured while publishing the note.",
        })
      );
    }
  };

  const publishAsFree = async (content, tags) => {
    setIsLoading(true);
    let eventInitEx = await InitEvent(1, content, tags);

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
    navigateTo("/dashboard", { state: { tabNumber: 1, filter: "notes" } });
    exit();
    setIsLoading(false);
  };

  const publishAsPaid = async (content, tags_) => {
    try {
      setIsLoading(true);

      let tags = structuredClone(tags_);
      let created_at = Math.floor(Date.now() / 1000);
      // if (flag) tags.push(["important", `${created_at}`]);

      tags.push(["l", "FLASH NEWS"]);
      tags.push(["yaki_flash_news", encryptEventData(`${created_at}`)]);

      let eventInitEx = await InitEvent(1, content, tags, created_at);

      if (!eventInitEx) {
        setIsLoading(false);
        return;
      }

      // let extras = flag ? pricing?.flag_pricing || 21 : 0;
      // let sats = ((pricing.fn_pricing || 800) + extras) * 1000;

      // let extras = flag ? 1 : 0;
      let sats = 800 * 1000;

      let zapTags = [
        ["relays", ...userRelays],
        ["amount", sats.toString()],
        ["lnurl", process.env.REACT_APP_YAKI_FUNDS_ADDR],
        ["p", process.env.REACT_APP_YAKI_PUBKEY],
        ["e", eventInitEx.id],
      ];

      var zapEvent = await getZapEventRequest(
        userKeys,
        `${userMetadata.name} paid for a flash news note.`,
        zapTags
      );
      if (!zapEvent) {
        setIsLoading(false);
        return;
      }

      const res = await axios(
        `${process.env.REACT_APP_YAKI_FUNDS_ADDR_CALLBACK}?amount=${sats}&nostr=${zapEvent}&lnurl=${process.env.REACT_APP_YAKI_FUNDS_ADDR}`
      );

      if (res.data.status === "ERROR") {
        setIsLoading(false);
        dispatch(
          setToast({
            type: 2,
            desc: "Something went wrong when processing payment!",
          })
        );
        return;
      }

      setInvoice(res.data.pr);
      // setConfirmation("in_progress");
      const { webln } = window;
      if (webln) {
        try {
          await webln.enable();
          await webln.sendPayment(res.data.pr);
        } catch (err) {
          console.log(err);
          setIsLoading(false);
          setInvoice("");
        }
      }

      let sub = ndkInstance.subscribe(
        [
          {
            kinds: [9735],
            "#p": [process.env.REACT_APP_YAKI_PUBKEY],
            "#e": [eventInitEx.id],
          },
        ],
        { groupable: false, cacheUsage: "ONLY_RELAY" }
      );

      sub.on("event", (event) => {
        setInvoice("");
        dispatch(
          setToPublish({
            eventInitEx,
            allRelays: [],
          })
        );
        sub.stop()
        navigateTo("/dashboard", { state: { tabNumber: 1, filter: "notes" } });
        exit();
        setIsLoading(false);
      });
    } catch (err) {
      setIsLoading(false);
      console.log(err);
      dispatch(
        setToast({
          type: 2,
          desc: "An error occurred while publishing this note",
        })
      );
    }
  };

  const handleAddImage = (data) => {
    if (note) setNote(note + " " + data);
    if (!note) setNote(data);
    setImgsSet((prev) => [...prev, data]);
  };

  const handleAddWidget = (data) => {
    if (note)
      setNote(
        note +
          " " +
          `https://yakihonne.com/smart-widget-checker?naddr=${data.naddr}`
      );
    if (!note)
      setNote(`https://yakihonne.com/smart-widget-checker?naddr=${data.naddr}`);
    setWidgetsSet((prev) => [...prev, data]);
    setShowSmartWidgets(false);
  };

  const removeImage = (index) => {
    let tempImgSet = Array.from(imgsSet);
    setNote(note.replace(tempImgSet[index], ""));
    tempImgSet.splice(index, 1);
    setImgsSet(tempImgSet);
  };

  const removeWidget = (index) => {
    let tempWidgetSet = Array.from(widgetsSet);
    setNote(
      note.replace(
        `https://yakihonne.com/smart-widget-checker?naddr=${tempWidgetSet[index].naddr}`,
        ""
      )
    );
    tempWidgetSet.splice(index, 1);
    setWidgetsSet(tempWidgetSet);
  };

  const handleTextAreaMentions = (keyword) => {
    if (textareaRef.current) textareaRef.current.focus();
    if (note) setNote(note + ` ${keyword}`);
    else setNote(keyword);
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    dispatch(
      setToast({
        type: 1,
        desc: `LNURL was copied! 👏`,
      })
    );
  };

  return (
    <>
      {showSmartWidgets && (
        <BrowseSmartWidgets
          exit={() => setShowSmartWidgets(false)}
          setWidget={handleAddWidget}
        />
      )}
      {invoice && (
        <div
          className="fixed-container fx-centered box-pad-h fx-col"
          style={{ zIndex: 10001 }}
        >
          <div
            className="fx-centered fx-col fit-container sc-s-18 box-pad-h-s box-pad-v-s"
            style={{ width: "400px" }}
          >
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
            <div className="fit-container fx-centered box-marg-s">
              <p className="gray-c p-medium">Waiting for response</p>
              <LoadingDots />
            </div>
          </div>
          <div
            className="round-icon-tooltip"
            data-tooltip="By closing this, you will lose publishing to this flash news"
          >
            <div
              style={{ position: "static" }}
              className="close"
              onClick={() => setInvoice("")}
            >
              <div></div>
            </div>
          </div>
        </div>
      )}
      <div
        className="fit-container fx-centered fx-start-v sc-s-18  box-pad-h-m box-pad-v-m"
        style={{
          overflow: "visible",
          border: border ? "1px solid var(--very-dim-gray)" : "none",
        }}
      >
        <UserProfilePicNOSTR
          size={34}
          mainAccountUser={true}
          allowClick={false}
          ring={false}
        />
        <div
          className="fit-container"
          style={{ maxWidth: "calc(100% - 36px)" }}
        >
          <div className="fit-container" style={{ position: "relative" }}>
            <textarea
              type="text"
              style={{
                padding: 0,
                height: "auto",
                minHeight: "200px",
                borderRadius: 0,
                fontSize: "1.2rem",
              }}
              value={note}
              className="ifs-full if if-no-border"
              placeholder="What's on your mind?"
              ref={textareaRef}
              onChange={handleChange}
              autoFocus
            />
            {showHashSuggestions && (
              <HashSuggestions tag={tag} setSelectedTag={handleSelectingTags} />
            )}
            {showMentionSuggestions && (
              <MentionSuggestions
                mention={mention}
                setSelectedMention={handleSelectingMention}
              />
            )}
          </div>
          {/* {widgetsSet.length > 0 && (
            <div className="box-pad-v-m fit-container fx-centered fx-col fx-start-h fx-start-v">
              {widgetsSet.map((widget, index) => {
                return (
                  <div
                    className="sc-s-18 fit-container"
                    style={{
                      position: "relative",
                    }}
                    key={index}
                  >
                    <div
                      className="close"
                      style={{ top: "8px", right: "8px" }}
                      onClick={() => removeWidget(index)}
                    >
                      <div></div>
                    </div>

                    <PreviewWidget widget={widget.metadata} />
                  </div>
                );
              })}
            </div>
          )} */}
          {imgsSet.length > 0 && (
            <div
              className="box-pad-v-m fit-container"
              style={{ maxWidth: "100%" }}
            >
              <Slider
                slideBy={200}
                items={imgsSet.map((img, index) => {
                  return (
                    <div
                      className="bg-img cover-bg sc-s-18"
                      style={{
                        backgroundImage: `url(${img})`,
                        height: "100px",
                        aspectRatio: "16/9",
                        position: "relative",
                      }}
                      key={index}
                    >
                      <div
                        className="close"
                        style={{ top: "8px", right: "8px" }}
                        onClick={() => removeImage(index)}
                      >
                        <div></div>
                      </div>
                    </div>
                  );
                })}
              />
            </div>
          )}
          <div className="fit-container fx-scattered">
            <div className="fx-centered">
              <div
                className="round-icon-small"
                onClick={() => handleTextAreaMentions("@")}
              >
                @
              </div>
              <div
                className="round-icon-small"
                onClick={() => handleTextAreaMentions("#")}
              >
                <div className="hashtag"></div>
              </div>
              <UploadFile
                round={true}
                small={true}
                setImageURL={handleAddImage}
                setFileMetadata={() => null}
                setIsUploadsLoading={() => null}
              />
              <div
                className="round-icon-small"
                onClick={() => setShowSmartWidgets(true)}
              >
                <div className="smart-widget"></div>
              </div>
            </div>
            <div className="fx-centered">
              {exit && (
                <button
                  className="btn btn-gst btn-small"
                  disabled={isLoading}
                  onClick={exit}
                >
                  {isLoading ? <LoadingDots /> : "Cancel"}
                </button>
              )}
              <button
                className="btn btn-normal btn-small"
                onClick={publishNote}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingDots />
                ) : isPaid ? (
                  "Post & pay 800 sats"
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </div>
          <div className="box-pad-v-s"></div>
          <div className="fx-scattered fit-container box-pad-h-s box-pad-v-s sc-s-18">
            <div className="box-pad-h-s">
              <p>Paid note</p>
              <p className="p-medium gray-c">A highlighted note for more exposure</p>
            </div>
            <div
              className={`toggle ${isPaid === -1 ? "toggle-dim-gray" : ""} ${
                isPaid !== -1 && isPaid ? "toggle-c1" : "toggle-dim-gray"
              }`}
              onClick={() => setIsPaid(!isPaid)}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
}
