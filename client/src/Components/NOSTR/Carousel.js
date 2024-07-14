import React, { useState } from "react";
import ProgressBar from "../ProgressBar";

export default function Carousel({ imgs }) {
  const [currentImg, setCurrentImg] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);

  return (
    <>
      {showCarousel && (
        <CarouselItems
          imgs={imgs}
          selectedImage={currentImg}
          back={(e) => {
            e.stopPropagation();
            setShowCarousel(false);
          }}
        />
      )}
      <div
        className="fx-centered fx-start-h fx-wrap fit-container "
        style={{ overflow: "hidden", marginTop: ".5rem" }}
      >
        {imgs.map((item, index) => {
          
          return (
            <div
              key={`${item}-${index}`}
              className={`bg-img cover-bg pointer fit-height sc-s-18`}
              style={{
                backgroundImage: `url(${item})`,
                // width: "32%",
                flex: "1 1 170px",
                border: "none",
                aspectRatio: "16/9",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImg(index);
                setShowCarousel(true);
              }}
            ></div>
          );
        })}
      </div>
    </>
  );
}

const CarouselItems = ({ imgs, selectedImage, back }) => {
  const [currentImg, setCurrentImg] = useState(selectedImage);

  return (
    <div className="fixed-container fx-centered box-pad-h" onClick={back}>
      <div style={{ width: "min(100%, 1000px)" }}>
        <div className="fit-container fx-centered">
          <button className="btn btn-normal btn-small" onClick={back}>
            exit
          </button>
        </div>

        <div className="fx-scattered fit-container" style={{ height: "60vh" }}>
          <div
            className="pointer round-icon"
            style={{ position: "relative", zIndex: 100 }}
            onClick={(e) => {
              e.stopPropagation();
              currentImg > 0 && setCurrentImg(currentImg - 1);
            }}
          >
            <div className="arrow" style={{ transform: "rotate(90deg)" }}></div>
          </div>
          <div
            className="fit-container fit-height"
            style={{ overflow: "hidden" }}
          >
            <div
              className="fit-container fit-height fx-scattered fx-start-h"
              style={{
                transform: `translateX(-${currentImg * 100}%)`,
                transition: ".3s ease-in-out",
                zIndex: 0,
                position: "relative",
                columnGap: 0,
                // scrollSnapType: "x mandatory",
                // overflow: 'scroll'
              }}
            >
              {imgs.map((item, index) => {
                return (
                  <div
                    key={index}
                    className="fit-container fx-centered fx-shrink box-pad-h box-pad-v"
                    style={{
                      height: "100%",
                    }}
                  >
                    <div
                      src={item}
                      className="bg-img contained-bg "
                      style={{
                        backgroundImage: `url(${item})`,
                        backgroundColor: "var(--primary)",
                        width: "100%",
                        height: "100%",
                        // border: "none",
                      }}
                    ></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div
            className="pointer round-icon"
            onClick={(e) => {
              e.stopPropagation();
              currentImg + 1 < imgs.length && setCurrentImg(currentImg + 1);
            }}
          >
            <div
              className="arrow"
              style={{ transform: "rotate(-90deg)" }}
            ></div>
          </div>
        </div>
        <div className="fit-container fx-centered box-pad-v-m">
          <div style={{ width: "min(100%, 400px)" }}>
            <ProgressBar
              current={currentImg + 1}
              total={imgs.length}
              full={true}
            />
          </div>
        </div>
      </div>

      {/* <div className="container fx-scattered listing-carousel-arrows-mobile">
        <div
          className="pointer"
          style={{ position: "relative", zIndex: 100 }}
          onClick={() => currentImg > 0 && setCurrentImg(currentImg - 1)}
        >
          <div
            className="arrow-brow"
            style={{ transform: "rotate(80deg)" }}
          ></div>
        </div>
        <div
          className="pointer"
          onClick={() =>
            currentImg + 1 < imgs.length && setCurrentImg(currentImg + 1)
          }
        >
          <div className="arrow-brow"></div>
        </div>
      </div> */}
    </div>
  );
};
