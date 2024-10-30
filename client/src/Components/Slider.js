import React, { useEffect, useState, useRef } from "react";

export default function Slider({
  items = [],
  slideBy = 10,
  noGap = false,
  smallButtonDropDown = false,
}) {
  const [scrollPX, setScrollPX] = useState(0);
  const [showArrows, setShowArrows] = useState(false);
  const noScrollBarContainer = useRef(null);
  const noScrollBarContainerMain = useRef(null);

  useEffect(() => {
    let carousel_container = noScrollBarContainerMain.current;
    let carousel = noScrollBarContainer.current;
    if (carousel_container.clientWidth < carousel.scrollWidth) {
      setShowArrows(true);
      // setScrollPX(0);
    } else {
      setShowArrows(false);
      // setScrollPX(0);
    }
  }, [items]);

  const slideRight = () => {
    let carousel_container = noScrollBarContainerMain.current;
    let carousel = noScrollBarContainer.current;

    let pxToSlide =
      scrollPX + slideBy < carousel.scrollWidth - carousel_container.clientWidth
        ? scrollPX + slideBy
        : carousel.scrollWidth - carousel_container.clientWidth;
    setScrollPX(pxToSlide);
  };
  const slideLeft = () => {
    let pxToSlide = scrollPX - slideBy > 0 ? scrollPX - slideBy : 0;
    setScrollPX(pxToSlide);
  };
  return (
    <div
      className="fit-container fx-scattered fx-start-h"
      style={{
        position: "relative",
        // paddingLeft: showArrows ? "1.5rem" : 0,
        // paddingRight: showArrows ? "1.5rem" : 0,
      }}
    >
      {showArrows && (
        <div
          className="pointer slide-right fit-height fx-centered gradient-bg-left"
          onClick={slideLeft}
          style={{
            position: "absolute",
            paddingRight: ".75rem",
            left: "-1px",
            top: 0,
            zIndex: 1,
          }}
        >
          <div
            className="round-icon-small"
            style={{
              backgroundColor: "var(--c1-side)",
              marginRight: "1px",
              border: "none",
            }}
          >
            <div className="arrow" style={{ transform: "rotate(90deg)" }}></div>
          </div>
        </div>
      )}
      {smallButtonDropDown && (
        <div style={{ paddingLeft: showArrows ? "2rem" : 0 }}>
          {smallButtonDropDown}
        </div>
      )}
      <div
        className="fx-centered fx-start-h no-scrollbar"
        style={{ overflow: "hidden" }}
        ref={noScrollBarContainerMain}
      >
        <div
          className="fx-centered fx-start-h no-scrollbar"
          style={{
            transform: `translateX(-${scrollPX}px)`,
            transition: ".3s ease-in-out",
            columnGap: noGap ? 0 : "6px",
            paddingLeft: showArrows ? "1.5rem" : 0,
            paddingRight: showArrows ? "1.5rem" : 0,
          }}
          ref={noScrollBarContainer}
        >
          {items.map((item, index) => {
            return (
              <div key={index} style={{ width: "max-content" }}>
                {item}
              </div>
            );
          })}
        </div>
      </div>

      {showArrows && (
        <div
          className="pointer slide-left fit-height fx-centered gradient-bg-right"
          onClick={slideRight}
          style={{
            position: "absolute",
            paddingLeft: ".75rem",
            right: "-1px",
            top: 0,
            zIndex: 1,
          }}
        >
          <div
            className="round-icon-small"
            style={{
              backgroundColor: "var(--c1-side)",
              marginRight: "1px",
              border: "none",
            }}
          >
            <div
              className="arrow"
              style={{ transform: "rotate(-90deg)" }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
