import React from "react";
import WriteNote from "./WriteNote";

export default function PostAsNote({ exit , content = "", linkedEvent, triggerCP = false}) {
  
  return (
    <div className="fixed-container fx-centered box-pad-h"      onClick={(e) => e.stopPropagation()}>
      <div
        style={{ width: "min(100%, 600px)", overflow: "visible" }}
        className="sc-s-18"
        onClick={(e) => e.stopPropagation()}
      >
        <WriteNote border={false} exit={exit} content={content} linkedEvent={linkedEvent} triggerCP={triggerCP}/>
      </div>
    </div>
  );
}
