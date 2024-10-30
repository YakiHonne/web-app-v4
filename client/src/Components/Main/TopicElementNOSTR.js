import React, { useEffect, useMemo, useState } from "react";
import Date_ from "../Date_";
import { useNavigate } from "react-router-dom";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import { getParsed3000xContent } from "../../Helpers/Encryptions";
import { getAuthPubkeyFromNip05 } from "../../Helpers/Helpers";
import { getUser } from "../../Helpers/Controlers";
import { useSelector } from "react-redux";

export default function TopicElementNOSTR({ topic, full = false }) {
  const navigateTo = useNavigate();
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const [showDesc, setShowDesc] = useState(false);
  const [authorData, setAuthorData] = useState({
    author_img: "",
    author_pubkey: topic.pubkey,
    author_name: topic.author.name,
  });
  const [curURL, setCurURL] = useState(`${topic.naddr}`);

  const getDRef = () => {
    return topic.items.length >= 10
      ? topic.items.length
      : `0${topic.items.length}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let auth = getUser(topic.pubkey);

        if (auth) {
          setAuthorData({
            author_img: auth.picture,
            author_name: auth.name,
            author_pubkey: auth.pubkey,
          });
          if (auth.nip05) {
            let authPubkey = await getAuthPubkeyFromNip05(auth.nip05);
            if (authPubkey) setCurURL(`${auth.nip05}/${topic.identifier}`);
          }
        }
        return;
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, [nostrAuthors]);

  return (
    <div
      className={`bg-img cover-bg sc-s-18 fx-shrink pointer carousel-item  fx-centered fx-start-h box-pad-h-m box-pad-v-m ${
        full ? "posts-card" : ""
      }`}
      style={{
        backgroundImage: `url(${topic.image})`,
        border: "none",
        height: "150px",
      }}
      onClick={(e) => {
        e.stopPropagation();
        !showDesc && navigateTo(`/curations/${curURL}`);
      }}
      id={`carousel-item-${topic.id}`}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          navigateTo(`/curations/${curURL}`);
        }}
        style={{ height: "100%" }}
        className="fx-scattered fx-col fx-start-v"
      >
        <div className="fx-centered fx-start-v fx-col fit-container">
          <div className="fit-container fx-centered fx-start-h">
            <div
              className="fx-centered fx-start-h"
              style={{ columnGap: "10px" }}
            >
              <AuthorPreview author={authorData} />
            </div>
            <div>
              <p className="gray-c p-small">&#9679;</p>
            </div>

            <p className=" gray-c">
              <Date_ toConvert={new Date(topic.created_at * 1000)} />
            </p>
            <div>
              <p className="gray-c p-small">&#9679;</p>
            </div>
            <p className=" orange-c">
              {getDRef()} <span>arts.</span>
            </p>
          </div>
        </div>
        <p className="p-big p-two-lines" style={{ color: "white" }}>
          {topic.title}
        </p>
      </div>
    </div>
  );
}

const AuthorPreview = ({ author }) => {
  return (
    <div className="fx-centered">
      <UserProfilePicNOSTR
        size={18}
        img={author.author_img}
        mainAccountUser={false}
        allowClick={true}
        user_id={author.author_pubkey}
        ring={false}
      />
      <p style={{ color: "white" }}>{author.author_name}</p>
    </div>
  );
};
