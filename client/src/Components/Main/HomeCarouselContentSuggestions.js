import React from "react";
import Slider from "../Slider";
import RepEventPreviewCard from "./RepEventPreviewCard";

export default function HomeCarouselContentSuggestions({ content }) {
  let getItems = () => {
    return content.map((item) => (
      <RepEventPreviewCard item={item} key={item.id} minimal={true} />
    ));
  };
  let items = getItems();
  if (content.length === 0) return (
    <div className="fit-container box-pad-v skeleton-container " style={{height: "285px"}}>

    </div>
  );
  return (
    <div className="fit-container box-pad-v">
      <Slider items={items} slideBy={200} />
    </div>
  );
}
