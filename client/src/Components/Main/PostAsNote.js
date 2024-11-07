import React from "react";
import WriteNote from "./WriteNote";

export default function PostAsNote({ exit , content = "", linkedEvent}) {
  return (
    <div className="fixed-container fx-centered box-pad-h">
      <div
        style={{ width: "min(100%, 600px)", overflow: "visible" }}
        className="sc-s-18 box-pad-h-s box-pad-v-s"
      >
        <WriteNote border={false} exit={exit} content={content} linkedEvent={linkedEvent}/>
      </div>
    </div>
  );
}
