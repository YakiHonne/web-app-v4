import React, { useState, useEffect } from "react";

const getColor = (percentage) => {
  // if (percentage <= 12) return "#BE0202";
  // if (percentage > 12 && percentage <= 25) return "#FF4A4A"; //
  if (percentage >= 0 && percentage <= 25) return "#BE0202"; //
  if (percentage > 25 && percentage <= 50) return "#FF4A4A"; //
  if (percentage > 50 && percentage <= 75) return "#F8CC0B"; //
  // if (percentage > 25 && percentage <= 37) return "#FF9C08";
  // if (percentage > 37 && percentage <= 50) return "#F8CC0B"; //
  // if (percentage > 50 && percentage <= 62) return "#00C04D";
  // if (percentage > 62 && percentage <= 75) return "#8549F3"; //
  // if (percentage > 75 && percentage <= 87) return "#5704AA";
  if (percentage > 75) return "#00C04D"; //
  // if (percentage > 87) return "#00C04D"; //
};
const getInversedColor = (percentage) => {
  // if (percentage <= 12) return "#BE0202";
  // if (percentage > 12 && percentage <= 25) return "#FF4A4A"; //
  if (percentage >= 0 && percentage <= 25) return "#00C04D"; //
  
  if (percentage > 25 && percentage <= 50) return "#F8CC0B"; //
  if (percentage > 50 && percentage <= 75) return "#FF4A4A"; //
  // if (percentage > 25 && percentage <= 37) return "#FF9C08";
  // if (percentage > 37 && percentage <= 50) return "#F8CC0B"; //
  // if (percentage > 50 && percentage <= 62) return "#00C04D";
  // if (percentage > 62 && percentage <= 75) return "#8549F3"; //
  // if (percentage > 75 && percentage <= 87) return "#5704AA";
  if (percentage > 75) return "#BE0202"; //
  // if (percentage > 87) return "#00C04D"; //
};

export default function ProgressCirc({
  inversed = false,
  size,
  percentage = 0,
  label,
  innerComp = false,
  width = 4,
  back_circ = true,
  tooltip = false,
}) {
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState(
    inversed ? getInversedColor(percentage) : getColor(percentage)
  );

  useEffect(() => {
    setProgress(percentage);
    setColor(   inversed ? getInversedColor(percentage) : getColor(percentage));
  }, [percentage]);

  const viewBox = `0 0 ${size} ${size}`;
  const radius = (size - 4) / 2;
  const circumference = radius * Math.PI * 2;
  const dash = (progress * circumference) / 100;

  return (
    <div
      className={`progress-circle pointer ${
        tooltip ? "round-icon-tooltip" : ""
      }`}
      data-tooltip={tooltip ? tooltip : ""}
    >
      {/* {size > 70 ? (
        <div className="label fx-centered fx-col" style={{ rowGap: 0 }}>
          {(percentage !== undefined) && <h5>{`${percentage || 0}%`}</h5>}
          {!(percentage !== undefined) && <h5>N/A</h5>}
          <p className="p-small gray-c">{label}</p>
        </div>
      ) : (
        <div className="label fx-centered fx-col">
          {(percentage !== undefined) && <h5>{`${percentage || 0}%`}</h5>}
          {!(percentage !== undefined) && <h5>N/A</h5>}
        </div>
      )} */}
      {innerComp && <div className="label fx-centered fx-col">{innerComp}</div>}
      <svg width={size} height={size} viewBox={viewBox}>
        {back_circ && (
          <circle
            fill="none"
            stroke="var(--dim-gray)"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={`${width}px`}
          />
        )}
        <circle
          fill="none"
          stroke={color}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={`${width}px`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={[dash, circumference - dash]}
          strokeLinecap="round"
          style={{ transition: "all .6s" }}
        />
      </svg>
    </div>
  );
}
