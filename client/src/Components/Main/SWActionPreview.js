import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getEmptyuserMetadata } from "../../Helpers/Encryptions";
import { getUser } from "../../Helpers/Controlers";
import { useTranslation } from "react-i18next";
import UserProfilePic from "./UserProfilePic";
import axios from "axios";

export default function SWActionPreview({ metadata, setSelectSW }) {
  const { t } = useTranslation();
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const [author, setAuthor] = useState(getEmptyuserMetadata(""));

  useEffect(() => {
    const fetchData = async () => {
      let appPubkey = metadata.pubkey;
      try {
        let swmdt = await axios.get(
          metadata.buttons[0].url + "/.well-known/widget.json"
        );
        appPubkey = swmdt?.data?.pubkey || metadata.pubkey;
      } catch (err) {
        console.log(err);
      }
      const data = getUser(appPubkey);
      if (data) setAuthor(data);
    };
    fetchData();
  }, [nostrAuthors]);

  return (
    <div
      className="fit-container fx-scattered sc-s-18 box-pad-h-s box-pad-v-s bg-sp pointer"
      onClick={(e) => {
        e.stopPropagation();
        setSelectSW({ ...metadata, author });
      }}
    >
      <div className="fx-centered">
        <div
          className="sc-s-18 bg-img cover-bg"
          style={{
            backgroundImage: `url(${metadata.icon})`,
            minWidth: "48px",
            aspectRatio: "1/1",
          }}
        ></div>
        <div>
          <p className="p-one-line">{metadata.title}</p>
          <div className="fx-centered">
            <UserProfilePic
              user_id={metadata.pubkey}
              img={author.picture}
              size={20}
            />
            <p className="gray-c p-one-line">
              {t("AsXpL4b", { name: author.display_name || author.name })}
            </p>
          </div>
        </div>
      </div>
      {/* <div
        className="box-pad-h-m"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <button className="btn btn-small btn-gst">{t("ARWeWgJ")}</button>
      </div> */}
    </div>
  );
}
