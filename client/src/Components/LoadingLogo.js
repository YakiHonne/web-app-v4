import Lottie from "lottie-react";
import React from "react";
import loading from "../media/JSONs/loading.json";
import loadingB from "../media/JSONs/loading-b.json";
import { useSelector } from "react-redux";

export default function LoadingLogo({ size = 64 }) {
  const isDarkMode = useSelector((state) => state.isDarkMode);

  return (
    <div style={{ width: `${size}px` }}>
      <Lottie
        animationData={isDarkMode !== "1" ? loading : loadingB}
        loop={true}
      />
    </div>
  );
}
