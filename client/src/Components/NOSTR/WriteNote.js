import React, { useContext, useEffect, useRef, useState } from "react";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import UploadFile from "../UploadFile";
import HashSuggestions from "./HashSuggestions";
import { Context } from "../../Context/Context";
import { filterRelays } from "../../Helpers/Encryptions";
import relaysOnPlatform from "../../Content/Relays";
import LoadingDots from "../LoadingDots";

export default function WriteNote() {
  const { nostrKeys, nostrUser, isPublishing, setToPublish, setToast } =
    useContext(Context);
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const [showHashSuggestions, setShowTagsSuggestions] = useState(false);
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
          (splitedNoteByHashtag[splitedNoteByHashtag.length - 1].includes(" ") &&
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
    // setNote(`${note} ${data}`);
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
      setToPublish({
        nostrKeys: nostrKeys,
        kind: 1,
        content: note,
        tags: [],
        allRelays: [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
      });
    } catch (err) {
      console.log(err);
      setToast({
        type: 2,
        desc: "An error occured while publishing the note.",
      });
    }
  };

  return (
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
      <div className="fit-container ">
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
        <div className="fit-container fx-scattered ">
          <div className="fx-centered">
            <div
              className="round-icon-small"
              onClick={() => (note ? setNote(note + " #") : setNote("#"))}
            >
              <div className="hashtag"></div>
            </div>
            {/* <div className="round-icon-small">
              <p>@</p>
            </div> */}
            <UploadFile
              round={true}
              small={true}
              setImageURL={(data) =>
                note ? setNote(note + " " + data) : setNote(data)
              }
              setFileMetadata={() => null}
              setIsUploadsLoading={() => null}
            />
          </div>
          <button
            className="btn btn-normal btn-small"
            onClick={publishNote}
            disabled={isPublishing}
          >
            {isPublishing ? <LoadingDots /> :"Post" }
          </button>
        </div>
      </div>
    </div>
  );
}
