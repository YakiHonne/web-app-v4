import React from "react";
import { timeAgo } from "../Helpers/Encryptions";

export default function Date_({ toConvert }) {
  const date = timeAgo(toConvert);
  return <>{date}</>;
}
