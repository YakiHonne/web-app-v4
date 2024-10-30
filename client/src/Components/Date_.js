import React from "react";

function timeAgo(date) {
  const now = new Date();
  const diff = now - date; // Difference in milliseconds
  const diffInSeconds = Math.floor(diff / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = now.getFullYear() - date.getFullYear();

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (diffInSeconds < 60) {
    return "now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}min ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else if (diffInWeeks < 5) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  } else if (diffInMonths < 11 && diffInYears === 0) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  } else if (diffInYears === 0) {
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } else {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

export default function Date_({ toConvert, time = false, timeOnly = false }) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const date = timeAgo(toConvert);
  // let year = new Date(toConvert).getFullYear();
  // let month = months[new Date(toConvert).getMonth()];
  // let day = new Date(toConvert).getDate();
  // let hour = new Date(toConvert).getHours();
  // let min = new Date(toConvert).getMinutes();
  // hour = hour >= 10 ? hour : `0${hour}`;
  // min = min >= 10 ? min : `0${min}`;

  return <>{date}</>;

  // if (timeOnly)
  //   return (
  //     <>
  //       {hour}:{min}
  //     </>
  //   );
  // return (
  //   <>
  //     {month} {day}, {year}{" "}
  //     {time && (
  //       <>
  //         at {hour}:{min}
  //       </>
  //     )}
  //   </>
  // );
}
