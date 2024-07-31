import React, { useContext, useEffect, useRef, useState } from "react";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import UploadFile from "../UploadFile";
import HashSuggestions from "./HashSuggestions";
import { Context } from "../../Context/Context";
import { filterRelays } from "../../Helpers/Encryptions";
import relaysOnPlatform from "../../Content/Relays";
import LoadingDots from "../LoadingDots";
import Slider from "../Slider";
import BrowseSmartWidgets from "./BrowseSmartWidgets";
import PreviewWidget from "../SmartWidget/PreviewWidget";

export default function WriteNote() {
  const { nostrKeys, nostrUser, isPublishing, setToPublish, setToast } =
    useContext(Context);
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const [showHashSuggestions, setShowTagsSuggestions] = useState(false);
  const [showSmartWidgets, setShowSmartWidgets] = useState(false);
  const [imgsSet, setImgsSet] = useState([]);
  const [widgetsSet, setWidgetsSet] = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    adjustHeight();
  }, [note]);

  useEffect(() => {
    if (!isPublishing) {
      setNote("");
      setTag("");
      setShowTagsSuggestions(false);
    }
  }, [isPublishing]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      if (note.charAt(note.length - 1) === "#") setShowTagsSuggestions(true);
      else {
        let splitedNoteByHashtag = note.split("#");
        if (
          (splitedNoteByHashtag[splitedNoteByHashtag.length - 1].includes(
            " "
          ) &&
            note.charAt(note.length - 1) !== "#") ||
          !note
        ) {
          setShowTagsSuggestions(false);
        }
      }
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleChange = (event) => {
    let value = event.target.value;
    let splitedNoteByHashtag = value.split("#");

    if (!splitedNoteByHashtag[splitedNoteByHashtag.length - 1].includes(" ")) {
      setTag(splitedNoteByHashtag[splitedNoteByHashtag.length - 1]);
    }
    setNote(value);
  };

  const handleSelectingTags = (data) => {
    let splitedNoteByHashtag = note.split("#");
    splitedNoteByHashtag[splitedNoteByHashtag.length - 1] = data;

    setNote(splitedNoteByHashtag.join("#"));

    setShowTagsSuggestions(false);
    setTag("");
  };

  const publishNote = () => {
    try {
      if (!nostrKeys) return;
      if (!note) {
        setToast({
          type: 2,
          desc: "Note is empty!",
        });
        return;
      }
      if (isPublishing) {
        setToast({
          type: 3,
          desc: "An event publishing is in process!",
        });
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
      setToPublish({
        nostrKeys: nostrKeys,
        kind: 1,
        content: note,
        tags,
        allRelays: [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
      });
      setImgsSet([]);
      setWidgetsSet([]);
    } catch (err) {
      console.log(err);
      setToast({
        type: 2,
        desc: "An error occured while publishing the note.",
      });
    }
  };

  const handleAddImage = (data) => {
    if (note) setNote(note + " " + data);
    if (!note) setNote(data);
    setImgsSet((prev) => [...prev, data]);
  };
  const handleAddWidget = (data) => {
    if (note) setNote(note + " " + data.naddr);
    if (!note) setNote(data.naddr);
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
    setNote(note.replace(tempWidgetSet[index].naddr, ""));
    tempWidgetSet.splice(index, 1);
    setWidgetsSet(tempWidgetSet);
  };
  console.log(widgetsSet);
  return (
    <>
      {showSmartWidgets && (
        <BrowseSmartWidgets
          exit={() => setShowSmartWidgets(false)}
          setWidget={handleAddWidget}
        />
      )}
      <div
        className="fit-container fx-centered fx-start-v sc-s-18 box-pad-h-m box-pad-v-m"
        style={{ overflow: "visible" }}
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
                borderRadius: 0,
                fontSize: "1.2rem",
              }}
              value={note}
              className="ifs-full if if-no-border"
              placeholder="What's on your mind?"
              ref={textareaRef}
              onChange={handleChange}
            />
            {showHashSuggestions && (
              <HashSuggestions tag={tag} setSelectedTag={handleSelectingTags} />
            )}
          </div>
          {widgetsSet.length > 0 && (
            <div
              className="box-pad-v-m fit-container fx-centered fx-col fx-start-h fx-start-v"
              // style={{ maxWidth: "100%" }}
            >
              {/* <Slider
                items={widgetsSet.map((widget, index) => {
                  return (
                    <div
                      className="sc-s-18"
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
                      <div style={{maxWidth: "520px"}}>

                      <PreviewWidget widget={widget.metadata} />
                      </div>
                    </div>
                  );
                })}
              /> */}
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
          )}
          {imgsSet.length > 0 && (
            <div
              className="box-pad-v-m fit-container"
              style={{ maxWidth: "100%" }}
            >
              <Slider
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
                onClick={() => (note ? setNote(note + " #") : setNote("#"))}
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
            <button
              className="btn btn-normal btn-small"
              onClick={publishNote}
              disabled={isPublishing}
            >
              {isPublishing ? <LoadingDots /> : "Post"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
