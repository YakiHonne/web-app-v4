import EmojiPicker from "emoji-picker-react";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

export default function Emojis({ setEmoji, position = "left" }) {
  const isDarkMode = useSelector((state) => state.isDarkMode);
  const [showEmoji, setShowEmoji] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleOffClick = (e) => {
      e.stopPropagation();
      if (optionsRef.current && !optionsRef.current.contains(e.target))
        setShowEmoji(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [optionsRef]);

  return (
    <div style={{ position: "relative" }} ref={optionsRef}>
      <div
        
        className="pointer"
        onClick={() => setShowEmoji(!showEmoji)}
      >
       <div className="emoji-24"></div>
      </div>
      {/* <div
        style={{ fontSize: "1.75rem" }}
        className="pointer"
        onClick={() => setShowEmoji(!showEmoji)}
      >
        &#9786;
      </div> */}
      {showEmoji && (
        <div style={{ position: "absolute", [position]: 0, bottom: "calc(100% + 5px)", zIndex: 102 }}>
          <EmojiPicker
            theme={isDarkMode ? "dark" : "light"}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled={true}
            searchDisabled={false}
            height={300}
            onEmojiClick={(data) => setEmoji(data.emoji)}
          />
        </div>
      )}
    </div>
  );
}
