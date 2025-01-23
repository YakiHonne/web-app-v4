import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLinkPreview } from "../../Helpers/Helpers";
import { customHistory } from "../../Helpers/History";
import { getImagePlaceholder } from "../../Content/NostrPPPlaceholder";

export default function LinkPreview({ url }) {
  const { t } = useTranslation();
  const [metadata, setMetadata] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getMetadata = async () => {
      let data = await getLinkPreview(url);
      if (data) {
        setMetadata(data);
      }
      setIsLoading(false);
    };
    getMetadata();
  }, []);

  if (isLoading)
    return (
      <div
        className={`fit-container sc-s-18 fx-centered fx-start-h fx-stretch skeleton-container`}
        style={{ height: "100px" }}
      ></div>
    );

  if (!isLoading && !metadata)
    return (
      <a
        style={{
          wordBreak: "break-word",
          color: "var(--orange-main)",
        }}
        href={url}
        className="btn-text-gray"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );

  return (
    <a
      className={`fit-container sc-s-18 fx-centered fx-start-h fx-stretch pointer`}
      href={url}
      target="_blank"
      style={{ margin: ".5rem 0" }}
    >
      <div
        className="bg-img cover-bg "
        style={{
          backgroundImage: `url(${metadata.image || metadata.imagePP})`,
          minWidth: "100px",
          minHeight: "100%",
        }}
      ></div>
      <div
        className="fx-centered fx-col fx-start-h fx-start-v box-pad-h-m box-pad-v-m"
        style={{ gap: "0" }}
      >
        <p className="gray-c p-medium">{metadata.domain}</p>
        <p className="p-two-lines">{metadata.title || "Untitled"}</p>
        <p className="gray-c p-one-line">
          {metadata.description || (
            <span className="p-italic">{t("AtZrjns")}</span>
          )}
        </p>
      </div>
    </a>
  );
}
