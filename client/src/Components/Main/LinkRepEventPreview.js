import React from "react";
import { getLinkFromAddr } from "../../Helpers/Helpers";
import { customHistory } from "../../Helpers/History";
import KindOne from "./KindOne";
import { useTranslation } from "react-i18next";

export default function LinkRepEventPreview({ event, allowClick = true }) {
  let url = getLinkFromAddr(event.naddr || event.nEvent);
  const { t } = useTranslation();
  if (event.kind === 1)
    return <KindOne event={event} reactions={false} minmal={true} />;
  return (
    <div
      className={`fit-container sc-s-18 fx-centered fx-start-h fx-stretch ${
        allowClick ? "pointer" : ""
      }`}
      onClick={() => (allowClick ? customHistory.push(url) : false)}
    >
      <div
        className="bg-img cover-bg "
        style={{
          backgroundImage: `url(${event.image || event.imagePP})`,
          minWidth: "100px",
          minHeight: "100%",
        }}
      ></div>
      <div
        className="fx-centered fx-col fx-start-h fx-start-v box-pad-h-m box-pad-v-m"
        style={{ gap: "0" }}
      >
        <p className="gray-c p-medium">https://yakihonne.com</p>
        <p className="p-two-lines">{event.title || "Untitled"}</p>
        <p className="gray-c p-one-line">
          {event.description || (
            <span className="p-italic">{t("AtZrjns")}</span>
          )}
        </p>
      </div>
    </div>
  );
}
