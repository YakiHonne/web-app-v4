import React, { useEffect, useState } from "react";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import Follow from "./Follow";
import LoadingDots from "../LoadingDots";
import { useSelector } from "react-redux";
import { getUser } from "../../Helpers/Controlers";

export default function TopCreators({ top_creators = [], kind = "articles" }) {
  const [creators, setCreators] = useState(top_creators);

  useEffect(() => {
    setCreators(top_creators);
  }, [top_creators]);

  if (!top_creators.length)
    return (
      <div
        className="fit-container fx-centered sc-s posts-card"
        style={{
          height: "200px",
          backgroundColor: "transparent",
          border: "none",
        }}
      >
        <LoadingDots />
      </div>
    );

  return (
    <div
      className="fit-container fx-centered fx-wrap fx-start-v fx-start-h"
      style={{ rowGap: "16px", columnGap: "16px" }}
    >
      {creators.map((creator) => {
        return (
          <div
            key={creator.pubkey}
            className="fit-container fx-scattered"
            style={{ columnGap: "16px" }}
          >
            <AuthorPreview author={creator} kind={kind} />

            <Follow
              size="small"
              toFollowKey={creator.pubkey}
              toFollowName={""}
              bulkList={[]}
            />
          </div>
        );
      })}
    </div>
  );
}

const AuthorPreview = ({ author, kind }) => {
  const [authorData, setAuthorData] = useState("");
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  useEffect(() => {
    const fetchData = async () => {
      try {
        let auth = getUser(author.pubkey);

        if (auth) setAuthorData(auth);
        return;
      } catch (err) {
        console.log(err);
      }
    };
    if (!authorData) fetchData();
  }, [nostrAuthors]);

  if (!authorData)
    return (
      <div className="fx-centered">
        <UserProfilePicNOSTR
          img={author.picture}
          size={32}
          user_id={author.pubkey}
          
          metadata={author}
        />
        <div>
          <p>{author.display_name || author.name}</p>
          {!kind && (
            <p className="gray-c p-medium">
              @{author.name || author.display_name}
            </p>
          )}
          {kind && (
            <div className="fx-centered fx-start-h">
              <p className="c1-c p-medium">
                {author.articles_number} <span className="gray-c">{kind}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  return (
    <div className="fx-centered">
      <UserProfilePicNOSTR
        img={authorData.picture}
        size={32}
        user_id={author.pubkey}
        
        metadata={authorData}
      />
      <div>
        <p>{authorData.display_name || authorData.name}</p>
        {!kind && (
            <p className="gray-c p-medium">
              @{authorData.name || authorData.display_name}
            </p>
          )}
          {kind && (
            <div className="fx-centered fx-start-h">
              <p className="c1-c p-medium">
                {authorData.articles_number} <span className="gray-c">{kind}</span>
              </p>
            </div>
          )}
      </div>
    </div>
  );
};
