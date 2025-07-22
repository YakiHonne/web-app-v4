import React, { useRef, useEffect, useState } from "react";

const VideoLoader = ({ src, ...props }) => {
  const videoRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
    return () => observer.disconnect();
  }, [videoRef.current]);

  return (
    <video
      ref={videoRef}
      controls={true}
      autoPlay={false}
      poster={""}
      preload={isLoaded ? "auto" : "none"}
      name="media"
      width={"100%"}
      className="sc-s-18"
      style={{ margin: ".5rem auto", aspectRatio: "16/9" }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

export default VideoLoader;
