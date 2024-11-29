import React, { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import UserProfilePicNOSTR from "../Main/UserProfilePicNOSTR";
import OptionsDropdown from "../Main/OptionsDropdown";
import Slider from "../Slider";
import { NDKUser } from "@nostr-dev-kit/ndk";
import { ndkInstance } from "../../Helpers/NDKInstance";
import SearchContentCard from "../Main/SearchContentCard";
import { getUser } from "../../Helpers/Controlers";
import { nip19 } from "nostr-tools";
import { setToast } from "../../Store/Slides/Publishers";
import { compactContent } from "../../Helpers/Helpers";
import { getEmptyuserMetadata } from "../../Helpers/Encryptions";
import { Link } from "react-router-dom";

export default function ContentSuggestionsCards({
  content,
  kind = "articles",
  tag,
}) {
  const userKeys = useSelector((state) => state.userKeys);
  const [hide, setHide] = useState(localStorage.getItem("hsuggest2"));

  const handleHideSuggestion = () => {
    localStorage.setItem("hsuggest2", `${Date.now()}`);
    setHide(true);
  };

  if (hide) return;
  if (content.length === 0) return;
  if (kind === "notes")
    return (
      <div
        className="fit-container"
        style={{
          paddingBottom: "1rem",
          borderBottom: "1px solid var(--very-dim-gray)",
        }}
      >
        <div className="fit-container fx-scattered box-pad-v-m">
          <h4 className=" box-pad-h-m">
            {tag ? `People talk of ${tag}` : "People talk"}
          </h4>
          {userKeys && (
            <OptionsDropdown
              options={[
                <p className="gray-c" onClick={handleHideSuggestion}>
                  Hide suggestions
                </p>,
              ]}
              vertical={false}
              tooltip={false}
            />
          )}
        </div>
        <Slider
          gap={10}
          items={[
            ...content.map((note) => {
              return <NoteCard event={note} />;
            }),
          ]}
          slideBy={200}
        />
      </div>
    );
  return (
    <div
      className="fit-container"
      style={{
        paddingBottom: "1rem",
        borderBottom: "1px solid var(--very-dim-gray)",
      }}
    >
      <div className="fit-container fx-scattered box-pad-v-m">
        <h4 className=" box-pad-h-m">{tag ? `In ${tag}` : "Suggestions"}</h4>
        {userKeys && (
          <OptionsDropdown
            options={[
              <p className="gray-c" onClick={handleHideSuggestion}>
                Hide suggestions
              </p>,
            ]}
            vertical={false}
            tooltip={false}
          />
        )}
      </div>
      <div className="fx-centered fx-col fit-container box-pad-h-m">
        {content.map((post) => {
          return (
            <div className="sc-s-18 fit-container" key={post.id}>
              <SearchContentCard
                className="sc-s-18"
                userProfile={false}
                event={post}
                exit={() => null}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const NoteCard = ({ event }) => {
  const dispatch = useDispatch();
  const userKeys = useSelector((state) => state.userKeys);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const [user, setUser] = useState(getEmptyuserMetadata(event.pubkey));
  const [isNip05Verified, setIsNip05Verified] = useState(false);

  useEffect(() => {
    const fetchAuthor = async () => {
      let auth = await getUser(event.pubkey);
      if (auth) {
        setUser(auth);
        let ndkUser = new NDKUser({ pubkey: event.pubkey });
        ndkUser.ndk = ndkInstance;
        let checknip05 = auth.nip05
          ? await ndkUser.validateNip05(auth.nip05)
          : false;

        if (checknip05) setIsNip05Verified(true);
      }
    };
    fetchAuthor();
  }, [nostrAuthors]);

  const copyID = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(nip19.noteEncode(event.id));
    dispatch(
      setToast({
        type: 1,
        desc: `Note ID was copied! 👏`,
      })
    );
  };

  return (
    <div
      className="sc-s-18 box-pad-h-m box-pad-v-m fx-centered fx-start-v fx-start-h fx-col fit-height"
      style={{ width: "300px", overflow: "visible" }}
    >
      <div className="fit-container fx-scattered">
        <div className="fx-centered" style={{ gap: "3px" }}>
          <UserProfilePicNOSTR
            size={24}
            mainAccountUser={false}
            user_id={user.pubkey}
            img={user.picture}
            metadata={user}
          />
          <div className="fx-centered" style={{ gap: "3px" }}>
            <p className="p-bold p-one-line" style={{ width: "max-content" }}>
              {user.display_name || user.name}
            </p>
            {isNip05Verified && <div className="checkmark-c1"></div>}
          </div>
          {/* <p className="gray-c p-medium">&#8226;</p>
          <p className="gray-c p-medium">
            <Date_ toConvert={new Date(event.created_at * 1000)} time={true} />
          </p> */}
        </div>
        <OptionsDropdown
          vertical={false}
          options={[
            <div onClick={copyID} className="pointer">
              <p>Copy note ID</p>
            </div>,
          ]}
        />
      </div>
      <Link to={`/notes/${nip19.noteEncode(event.id)}`}>
        <p className="p-three-lines">{compactContent(event.content)}</p>
      </Link>
    </div>
  );
};
