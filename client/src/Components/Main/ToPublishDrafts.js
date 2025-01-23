import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingDots from "../LoadingDots";
import { nanoid } from "nanoid";
import { useDispatch } from "react-redux";
import { setToast, setToPublish } from "../../Store/Slides/Publishers";
import { InitEvent } from "../../Helpers/Controlers";
import { useTranslation } from "react-i18next";

export default function ToPublishDrafts({
  postContent = "",
  postTitle = "",
  edit = false,
  exit,
  warning = false,
}) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigateTo = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const Submit = async (kind = 30023) => {
    try {
      setIsLoading(true);
      let tags = [
        [
          "client",
          "Yakihonne",
          "31990:20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3:1700732875747",
        ],
        ["published_at", `${Date.now()}`],
        ["d", edit || nanoid()],
        ["image", ""],
        ["title", postTitle],
        ["summary", ""],
      ];

      let eventInitEx = await InitEvent(kind, postContent, tags);
      if (!eventInitEx) return;
      dispatch(
        setToPublish({
          eventInitEx,
          allRelays: [],
        })
      );
      navigateTo("/dashboard", { state: { tabNumber: 1, filter: "drafts" } });
      exit();
      return;
    } catch (err) {
      dispatch(
        setToast({
          type: 2,
          desc: t("Acr4Slu"),
        })
      );
    }
  };

  return (
    <section className="fixed-container fx-centered">
      <div
        className="fx-centered fx-col slide-up box-pad-h sc-s-18 box-pad-v bg-sp"
        style={{
          width: "500px",
        }}
      >
        <div className="fx-centered fx-col">
          <h4 className="p-centered">{t("AmcaCBU")}</h4>
          <p className="gray-c box-pad-v-s">{t("A0xeQYk")}</p>
        </div>
        {warning && (
          <div className="sc-s-18 box-pad-v-s box-pad-h-s box-marg-s">
            <p className="orange-c p-medium p-centered">{t("APW25Bv")}</p>
            <p className="gray-c p-medium p-centered">{t("AkcTysw")}</p>
          </div>
        )}
        <div className="fx-centered fit-container">
          <button
            className={`btn btn-full btn-normal`}
            onClick={() => Submit(30024)}
            disabled={isLoading}
          >
            {isLoading ? <LoadingDots /> : t("AjbW7pt")}
          </button>
          <button className="btn btn-gst-red btn-full" onClick={exit}>
            {t("AB4BSCe")}
          </button>
        </div>
      </div>
    </section>
  );
}
