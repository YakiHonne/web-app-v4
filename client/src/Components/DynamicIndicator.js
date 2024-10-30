import React, { useMemo } from "react";
import Date_ from "./Date_";

export default function DynamicIndicator({ item }) {
  const getDynamicIndicator = () => {
    let dynElem = "";
    if (item.kind === 30023)
      dynElem = `${
        Math.floor(item.content.split(" ").length / 200) || 1
      } min read`;
    if (item.kind === 30004) dynElem = `${item.items.length} articles`;
    if (item.kind === 30005) dynElem = `${item.items.length} videos`;
    if (item.kind === 34235) dynElem = "Watch now";
    return (
      <p className="gray-c p-medium">
        <Date_ toConvert={new Date(item.created_at * 1000)} /> &#x2022;{"  "}
        <span className="orange-c">{dynElem}</span>
      </p>
    );
  };
  let dynamicIndicator = useMemo(() => {
    return getDynamicIndicator();
  }, []);
  return <div className="fx-centered fx-start-h ">{dynamicIndicator}</div>;
}
