import { Fragment, useEffect, useRef, useState } from "react";

export default function SmallButtonDropDown({
  options,
  selectedCategory,
  setSelectedCategory,
}) {
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleOffClick = (e) => {
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
        className={"btn p-caps sticker-gray-black fx-centered"}
        style={{
          backgroundColor: options.includes(selectedCategory)
            ? ""
            : "transparent",
          color: options.includes(selectedCategory) ? "" : "var(--gray)",
        }}
        onClick={() =>
          options.includes(selectedCategory)
            ? setShowOptions(true)
            : setSelectedCategory(options[0])
        }
      >
        {options.includes(selectedCategory) ? selectedCategory : options[0]}
        {options.includes(selectedCategory) && <div className="arrow-12"></div>}
      </div>
      {showOptions && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "110%",
            backgroundColor: "var(--dim-gray)",
            border: "none",
            minWidth: "200px",
            width: "max-content",
            zIndex: 1000,
            rowGap: "10px",
          }}
          className="box-pad-h-m box-pad-v-s sc-s-18 fx-centered fx-col fx-start-v pointer"
        >
          {options.map((option, index) => {
            return (
              <p
                key={index}
                onClick={() => {
                  setSelectedCategory(option);
                  setShowOptions(false);
                }}
                className={selectedCategory === option ? "c1-c fit-container p-caps" : " fit-container  p-caps"}
              >
                {option}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
