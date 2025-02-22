import React, { useState } from "react";
import Slider from "../Slider";
import RepEventPreviewCard from "./RepEventPreviewCard";
import OptionsDropdown from "./OptionsDropdown";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

export default function HomeCarouselContentSuggestions({ content }) {
  const userKeys = useSelector((state) => state.userKeys);
  const { t } = useTranslation();
  const [hide, setHide] = useState(localStorage.getItem("hsuggest"));
  let getItems = () => {
    return content.map((item) => (
      <RepEventPreviewCard item={item} key={item.id} minimal={true} />
    ));
  };

  const handleHideSuggestion = () => {
    localStorage.setItem("hsuggest", `${Date.now()}`);
    setHide(true);
  };

  if (hide) return;
  let items = getItems();
  if (content.length === 0)
    return (
      <div
        className="fit-container box-pad-v skeleton-container "
        style={{ height: "285px" }}
      ></div>
    );
  return (
    <div className="fit-container box-marg-s">
      <div className="fit-container fx-scattered box-pad-v-s ">
        <p className="gray-c box-pad-h-m">{t("AoO5zem")}</p>
        {userKeys && (
          <OptionsDropdown
            options={[
              <p className="gray-c" onClick={handleHideSuggestion}>
                {t("A2qCLTm")}
              </p>,
            ]}
            vertical={false}
            tooltip={false}
          />
        )}
      </div>
      <Slider items={items} slideBy={200} />
    </div>
  );
}
