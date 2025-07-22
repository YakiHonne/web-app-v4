import React, { useState, useEffect } from "react";
import Slider from "../Slider";
import RepEventPreviewCard from "./RepEventPreviewCard";
import OptionsDropdown from "./OptionsDropdown";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { filterContent, getParsedRepEvent, removeEventsDuplicants } from "../../Helpers/Encryptions";
import { getDefaultFilter, getSubData } from "../../Helpers/Controlers";
import { saveUsers } from "../../Helpers/DB";

export default function HomeCarouselContentSuggestions() {
  const userKeys = useSelector((state) => state.userKeys);
  const { t } = useTranslation();
  const [hide, setHide] = useState(localStorage.getItem("hsuggest"));
  const [content, setContentSuggestions] = useState([]);

  useEffect(() => {
    const fetchContentSuggestions = async () => {
      let content = await getSubData(
        [{ kinds: [16], limit: 50, "#k": ["30023"] }],
        400
      );
      if (content.data.length > 0) {
        let data = content.data
          .map((event) =>
            event.content ? getParsedRepEvent(JSON.parse(event.content)) : false
          )
          .filter((event) => {
            if (event && event.title) return event;
          });
        let defaultFilter = getDefaultFilter();
        setContentSuggestions(
          filterContent(defaultFilter, removeEventsDuplicants(data))
        );
        saveUsers(data.map((_) => _.pubkey));
      }
    };
    if (!hide) fetchContentSuggestions();
  }, []);

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
