import { useState } from "react";
import { useDispatch } from "react-redux";
import { setToast } from "../../Store/Slides/Publishers";
import { nip19 } from "nostr-tools";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { nanoid } from "nanoid";
import ToPublishVideo from "./ToPublishVideo";
import UploadFile from "../UploadFile";
import { getVideoFromURL } from "../../Helpers/Helpers";
import LoadingDots from "../LoadingDots";

export default function AddVideo ({ exit }){
    const dispatch = useDispatch();
  
    const [videoURL, setVideoURL] = useState("");
    const [videoTitle, setVideoTitle] = useState("");
    const [videoDesc, setVideoDesc] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [videoMetadata, setVideoMetadata] = useState(false);
    const [type, setType] = useState("");
    const [showFinalStep, setShowFinalStep] = useState();
    const [eventTags, setEventTags] = useState([]);
  
    const initPublishing = async () => {
      if (!(videoURL && videoTitle)) {
        dispatch(
          setToast({
            type: 2,
            desc: "Please provide a video URL and title.",
          })
        );
        return;
      }
      let duration = "0";
  
      try {
      } catch (err) {}
      let tags = [
        ["d", nanoid()],
        ["url", videoURL],
        ["title", videoTitle],
        ["summary", videoDesc],
        ["published_at", `${Math.floor(Date.now() / 1000)}`],
        [
          "client",
          "31990:20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3:1700732875747",
        ],
        ["m", videoMetadata ? videoMetadata.type : "video/mp4"],
        ["duration", duration],
        ["size", videoMetadata ? `${videoMetadata.size}` : "0"],
      ];
      setEventTags(tags);
      setShowFinalStep(true);
    };
  
    const validate = async () => {
      if (type === "link") {
        setType("");
        return;
      }
      if (type === "1063") {
        try {
          let naddr = nip19.decode(videoURL);
          if (naddr.data.kind !== 1063) {
            dispatch(
              setToast({
                type: 2,
                desc: "The nEvent is not a file sharing address.",
              })
            );
            return;
          }
          setIsLoading(true);
          let event = await ndkInstance.fetchEvent({
            kinds: [1063],
            ids: [naddr.data.id],
          });
          if (!event) {
            dispatch(
              setToast({
                type: 2,
                desc: "Could not retrieve URL from this nEvent.",
              })
            );
            setIsLoading(false);
            return;
          }
          let mime = "";
          let url = "";
  
          for (let tag of event.tags) {
            if (tag[0] === "m") mime = tag[1];
            if (tag[0] === "url") url = tag[1];
          }
  
          if (!mime.includes("video")) {
            dispatch(
              setToast({
                type: 2,
                desc: "The file found is not a video",
              })
            );
            setIsLoading(false);
            return;
          }
          if (!url) {
            dispatch(
              setToast({
                type: 2,
                desc: "No url found from this nEvent.",
              })
            );
            setIsLoading(false);
            return;
          }
  
          setVideoURL(url);
          setType("");
          setIsLoading(false);
          return;
        } catch (err) {
          dispatch(
            setToast({
              type: 2,
              desc: "Error parsing the nEvent.",
            })
          );
          return;
        }
      }
    };
  
    return (
      <>
        {showFinalStep && (
          <ToPublishVideo
            title={videoTitle}
            tags={eventTags}
            exit={() => {
              setShowFinalStep(false);
              exit();
            }}
          />
        )}
        <div className="fixed-container fx-centered box-pad-h">
          <div
            className="sc-s-18 bg-sp"
            style={{ position: "relative", width: "min(100%, 600px)" }}
          >
            {!videoURL && !type && (
              <div className="fit-container fx-centered fx-col box-pad-h box-pad-v">
                <p>Pick your video</p>
                <p className="p-medium gray-c p-centered box-marg-s">
                  You can upload, paste a link or choose a kind 1063 event to your
                  video
                </p>
                <div className="fx-centered" style={{ columnGap: "16px" }}>
                  <div className="fx-centered fx-col">
                    <UploadFile
                      kind={"video/mp4,video/x-m4v,video/*"}
                      setImageURL={setVideoURL}
                      setIsUploadsLoading={setIsLoading}
                      setFileMetadata={setVideoMetadata}
                      round={true}
                    />
                    <p className="p-medium gray-c">Local</p>
                  </div>
                  <p className="p-small gray-c">|</p>
                  <div
                    className="fx-centered fx-col"
                    style={{ opacity: isLoading ? ".5" : "1" }}
                    onClick={() => setType("link")}
                  >
                    <div className="round-icon">
                      <div className="link-24"></div>
                    </div>
                    <p className="p-medium gray-c">Link</p>
                  </div>
                  <p className="p-small gray-c">|</p>
                  <div
                    className="fx-centered fx-col"
                    style={{ opacity: isLoading ? ".5" : "1" }}
                    onClick={() => setType("1063")}
                  >
                    <div className="round-icon">
                      <div className="share-icon-2-24"></div>
                    </div>
                    <p className="p-medium gray-c">Filesharing</p>
                  </div>
                </div>
              </div>
            )}
            {videoURL && !type && (
              <div className="fit-container box-pad-h box-pad-v-s">
                <div className="box-pad-v-s fx-scattered fit-container">
                  <div>
                    <h4>Preview</h4>
                    <p className="p-medium orange-c p-one-line">{videoURL}</p>
                  </div>
                  <div
                    className="round-icon"
                    onClick={() => {
                      setType("");
                      setVideoURL("");
                    }}
                  >
                    <div className="trash"></div>
                  </div>
                </div>
                {getVideoFromURL(videoURL)}
              </div>
            )}
            <hr />
            {type && (
              <div className="fit-container fx-centered fx-start-v fx-col box-pad-h box-pad-v">
                <div>
                  <p className="p-left fit-container">
                    {type === "link" ? "Video link" : "Kind 1063"}
                  </p>
                  {type === "1063" && (
                    <p className="gray-c p-medium">
                      Paste your kind 1063 nEvent.
                    </p>
                  )}
                </div>
                <div className="fx-centered fit-container">
                  <input
                    type="text"
                    className="if ifs-full"
                    placeholder={
                      type === "link"
                        ? "Link to remote video, Youtube video or Vimeo"
                        : "nEvent"
                    }
                    value={videoURL}
                    onChange={(e) => setVideoURL(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="fx-centered">
                    <button
                      className="btn btn-normal"
                      onClick={() => (videoURL ? validate() : null)}
                      disabled={isLoading}
                    >
                      {isLoading ? <LoadingDots /> : "validate"}
                    </button>
                    <button
                      className="btn btn-gst-red"
                      onClick={() => {
                        setType("");
                        setVideoURL("");
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? <LoadingDots /> : "cancel"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <hr />
            <div className="fit-container fx-centered fx-col box-pad-h box-pad-v">
              <input
                type="text"
                placeholder="Video title"
                className="if ifs-full"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
              />
              <textarea
                placeholder="Video description"
                className="txt-area ifs-full"
                value={videoDesc}
                onChange={(e) => setVideoDesc(e.target.value)}
              />
            </div>
            <hr />
            <div className="fit-container fx-centered box-pad-h box-pad-v">
              <button className="btn btn-gst-red" onClick={exit}>
                Cancel
              </button>
              <button
                className="btn btn-normal fx-centered"
                onClick={initPublishing}
              >
                Finilize publishing{" "}
                <div className="arrow" style={{ rotate: "-90deg" }}></div>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };