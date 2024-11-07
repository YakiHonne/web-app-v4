import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function SmallButtonDropDown({
  options,
  selectedCategory,
  setSelectedCategory,
  showSettings = false,
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
        className={"btn sticker-gray-black fx-centered "}
        style={{
          backgroundColor: options.includes(selectedCategory)
            ? ""
            : "transparent",
          color: options.includes(selectedCategory) ? "" : "var(--gray)",
        }}
        onClick={
          () =>
            (options.includes(selectedCategory) &&
              options.length > 1 &&
              !showSettings) ||
            (options.includes(selectedCategory) && showSettings)
              ? setShowOptions(!showOptions)
              : setSelectedCategory(options[0])
          // : setShowOptions(false)
        }
      >
        <span className="p-maj">
          {options.includes(selectedCategory)
            ? selectedCategory.replaceAll("-", " ")
            : options[0].replaceAll("-", " ")}
        </span>
        {((options.includes(selectedCategory) &&
          options.length > 1 &&
          !showSettings) ||
          (options.includes(selectedCategory) && showSettings)) && (
          <div className="arrow-12"></div>
        )}
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
            rowGap: "0",
          }}
          className="sc-s-18 fx-centered fx-col fx-start-v pointer"
        >
          {options.map((option, index) => {
            return (
              <p
                key={index}
                onClick={() => {
                  setSelectedCategory(option);
                  setShowOptions(false);
                }}
                className={`box-pad-h-m box-pad-v-s fit-container p-maj p-maj ${
                  selectedCategory === option ? "c1-c" : " "
                }`}
              >
                {option.replaceAll("-", " ")}
              </p>
            );
          })}

          {showSettings && (
            <Link
              to="/settings"
              state={{ tab: "customization" }}
              className="fit-container fx-scattered  pointer box-pad-h-m box-pad-v-s"
              style={{ backgroundColor: "var(--c1-side)" }}
            >
              <p className="p-medium gray-c btn-text-gray">Customize feeds</p>
              <div
                className="setting"
                style={{ minWidth: "12px", minHeight: "12px" }}
              ></div>
            </Link>
          )}
        </div>
        // <div
        //   style={{
        //     position: "absolute",
        //     left: 0,
        //     top: "110%",
        //     backgroundColor: "var(--dim-gray)",
        //     border: "none",
        //     minWidth: "200px",
        //     width: "max-content",
        //     zIndex: 1000,
        //     rowGap: "10px",
        //   }}
        //   className="box-pad-h-m box-pad-v-s sc-s-18 fx-centered fx-col fx-start-v pointer"
        // >
        //   {options.map((option, index) => {
        //     return (
        //       <p
        //         key={index}
        //         onClick={() => {
        //           setSelectedCategory(option);
        //           setShowOptions(false);
        //         }}
        //         className={
        //           selectedCategory === option
        //             ? "c1-c fit-container p-maj"
        //             : " fit-container  p-maj"
        //         }
        //       >
        //         {option.replaceAll("-", " ")}
        //       </p>
        //     );
        //   })}
        //   <hr style={{margin: 0, borderColor: "var(--gray)"}}/>
        //   <div className="fit-container fx-centered fx-start-h pointer">
        //     <div className="custom" style={{minWidth: "12px", minHeight: "12px"}}></div>
        //     <p className="gray-c">Edit</p>
        //   </div>
        // </div>
      )}
    </div>
  );
}
