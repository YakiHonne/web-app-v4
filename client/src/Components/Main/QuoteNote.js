import React, { useState } from "react";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import LoadingDots from "../LoadingDots";
import KindOne from "./KindOne";
import { eventKinds } from "../../Content/Extra";
import LinkRepEventPreview from "./LinkRepEventPreview";

export default function QuoteNote({ note, reactToNote, exit, isLoading }) {
  const [quote, setQuote] = useState("");

  return (
    <div className="fixed-container fx-centered box-pad-h">
      <div
        className="box-pad-h-m box-pad-v-m sc-s-18 fx-centered fx-col bg-sp"
        style={{ width: "min(100%, 500px)" }}
      >
        <div className="fx-scattered fit-container box-marg-s">
          <h4>Quote this {eventKinds[note.kind]}</h4>
          <div className="fx-centered">
            <button
              className="btn btn-gst-red btn-small"
              onClick={exit}
              disabled={isLoading}
            >
              {isLoading ? <LoadingDots /> : "Cancel"}
            </button>
            <button
              className="btn btn-normal btn-small"
              onClick={(e) => {
                e.stopPropagation();
                reactToNote(`${quote} nostr:${note.nEvent || note.naddr}`);
              }}
              disabled={isLoading}
            >
              {isLoading ? <LoadingDots /> : "Post"}
            </button>
          </div>
        </div>
        <div className="fit-container fx-centered fx-start-v ">
          <UserProfilePicNOSTR
            size={48}
            mainAccountUser={true}
            allowClick={false}
            ring={false}
          />
          <div className="fit-container fx-centered fx-wrap">
            <div className="fit-container">
              <textarea
                // type="text"
                className="txt-area ifs-full if "
                placeholder="What's in your mind"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        {note.kind === 1 && (
          <div
            className="fit-container"
            style={{ maxHeight: "40vh", overflow: "scroll" }}
          >
            <KindOne event={note} reactions={false} />
          </div>
        )}
        {note.kind !== 1 && <LinkRepEventPreview event={note} />}
      </div>
    </div>
  );
}


// import React, { useEffect, useState } from "react";
// import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
// import LoadingDots from "../LoadingDots";
// import KindOne from "./KindOne";
// import { finalizeEvent } from "nostr-tools";
// import { useDispatch, useSelector } from "react-redux";
// import { setToast, setToPublish } from "../../Store/Slides/Publishers";

// export default function QuoteNote({ note, exit }) {
//   const dispatch = useDispatch();
//   const userKeys = useSelector((state) => state.userKeys);
//   const userRelays = useSelector((state) => state.userRelays);
//   const isPublishing = useSelector((state) => state.isPublishing);
//   const [quote, setQuote] = useState("");
//   const [isLoading, setIsLoading] = useState("");

//   const quoteNote = async (e) => {
//     e.stopPropagation();
//     if (isLoading) return;
//     if (isPublishing) {
//       dispatch(
//         setToast({
//           type: 3,
//           desc: "An event publishing is in process!",
//         })
//       );
//       return;
//     }
//     try {
//       if (!userKeys) {
//         return false;
//       }
//       setIsLoading(true);
//       let event = {
//         kind: 1,
//         content: `${quote} nostr:${note.nEvent}`,
//         created_at: Math.floor(Date.now() / 1000),
//         tags: [
//           ["q", note.id],
//           ["p", note.pubkey],
//         ],
//       };
//       if (userKeys.ext) {
//         try {
//           event = await window.nostr.signEvent(event);
//         } catch (err) {
//           console.log(err);
//           setIsLoading(false);
//           return false;
//         }
//       } else {
//         event = finalizeEvent(event, userKeys.sec);
//       }

//       dispatch(
//         setToPublish({
//           eventInitEx: event,
//           allRelays: userRelays
//         })
//       );
//     } catch (err) {
//       console.log(err);
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!isPublishing && isLoading) {
//       setIsLoading(false);
//       exit();
//     }
//   }, [isPublishing]);

//   return (
//     <div className="fixed-container fx-centered box-pad-h">
//       <div
//         className="box-pad-h-m box-pad-v-m sc-s-18 fx-centered fx-col"
//         style={{ width: "min(100%, 500px)" }}
//       >
//         <div className="fx-scattered fit-container box-marg-s">
//           <h4>Quote this note</h4>
//           <div className="fx-centered">
//             <button
//               className="btn btn-gst-red btn-small"
//               onClick={exit}
//               disabled={isLoading}
//             >
//               {isLoading ? <LoadingDots /> : "Cancel"}
//             </button>
//             <button
//               className="btn btn-normal btn-small"
//               onClick={quoteNote}
//               disabled={isLoading}
//             >
//               {isLoading ? <LoadingDots /> : "Post"}
//             </button>
//           </div>
//         </div>
//         <div className="fit-container fx-centered fx-start-v ">
//           <UserProfilePicNOSTR
//             size={48}
//             mainAccountUser={true}
//             allowClick={false}
//             ring={false}
//           />
//           <div className="fit-container fx-centered fx-wrap">
//             <div className="fit-container">
//               <textarea
//                 // type="text"
//                 className="txt-area ifs-full if "
//                 placeholder="What's in your mind"
//                 value={quote}
//                 onChange={(e) => setQuote(e.target.value)}
//                 disabled={isLoading}
//               />
//             </div>
//           </div>
//         </div>
//         <div
//           className="fit-container"
//           style={{ maxHeight: "40vh", overflow: "scroll" }}
//         >
//           <KindOne event={note} reactions={false} />
//         </div>
//       </div>
//     </div>
//   );
// }
