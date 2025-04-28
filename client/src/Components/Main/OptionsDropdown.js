import React, { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function OptionsDropdown({
  options,
  border = false,
  displayAbove = false,
  displayLeft = true,
  vertical = true,
  tooltip = true,
  icon = "dots",
}) {
  const { t } = useTranslation();
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleOffClick = (e) => {
      e.stopPropagation();
      if (optionsRef.current && !optionsRef.current.contains(e.target))
        setShowOptions(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [optionsRef]);

  return (
    <div style={{ position: "relative" }} ref={optionsRef}>
      <div
        className={`${border ? "round-icon" : "round-icon-small"} ${
          tooltip ? "round-icon-tooltip" : ""
        }`}
        style={{ border: border ? "" : "none" }}
        data-tooltip={icon === "arrow" ? "" : t("A5DDopE")}
        onClick={(e) => {
          e.stopPropagation();
          setShowOptions(!showOptions);
        }}
      >
        {icon === "dots" && (
          <div
            className={`fx-centered ${vertical ? "fx-col" : ""}`}
            style={{ gap: 0 }}
          >
            <p className="gray-c fx-centered" style={{ height: "6px" }}>
              &#x2022;
            </p>
            <p className="gray-c fx-centered" style={{ height: "6px" }}>
              &#x2022;
            </p>
            <p className="gray-c fx-centered" style={{ height: "6px" }}>
              &#x2022;
            </p>
          </div>
        )}
        {icon === "arrow" && <div className="arrow"></div>}
      </div>
      {showOptions && (
        <div
          style={{
            position: "absolute",
            [displayAbove ? "bottom" : "top"]: "110%",
            [displayLeft ? "right" : "left"]: "0",
            backgroundColor: "var(--dim-gray)",
            border: "none",
            // minWidth: "100px",
            width: "max-content",
            zIndex: 1000,
            rowGap: "10px",
            overflow: "visible",
          }}
          className="box-pad-h-m box-pad-v-s sc-s-18 fx-centered fx-col fx-start-v pointer drop-down"
          onClick={() => setShowOptions(false)}
        >
          {options.map((option, index) => {
            return <Fragment key={index}>{option}</Fragment>;
          })}
        </div>
      )}
    </div>
  );
}
