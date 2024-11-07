import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import Date_ from "../Date_";
import BookmarkEvent from "./BookmarkEvent";
import { getEmptyuserMetadata } from "../../Helpers/Encryptions";
import ShareLink from "../ShareLink";
import MediaPreview from "./MediaPreview";
import { useSelector } from "react-redux";
import { getUser } from "../../Helpers/Controlers";
import OptionsDropdown from "./OptionsDropdown";
import DynamicIndicator from "../DynamicIndicator";
import { customHistory } from "../../Helpers/History";

const checkFollowing = (list, toFollowKey) => {
  if (!list) return false;
  return list.find((people) => people[1] === toFollowKey) ? true : false;
};

const getURL = (item) => {
  if (item.kind === 30023) return `/article/${item.naddr}`;
  if ([30004, 30005].includes(item.kind)) return `/curations/${item.naddr}`;
  if (item.kind === 34235) return `/videos/${item.naddr}`;
};

export default function RepEventPreviewCard({
  item,
  highlithedTag = "",
  border = true,
  minimal = false,
}) {
  const navigate = useNavigate();
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const userFollowings = useSelector((state) => state.userFollowings);
  const [authorData, setAuthorData] = useState(
    getEmptyuserMetadata(item.pubkey)
  );
  const [showContent, setShowContent] = useState(!item.contentSensitive);
  const [showPreview, setShowPreview] = useState(false);
  const isFollowing = useMemo(() => {
    return checkFollowing(userFollowings, item.pubkey);
  }, [userFollowings]);
  const url = useMemo(() => {
    return getURL(item);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let auth = getUser(item.pubkey);

        if (auth) {
          setAuthorData(auth);
        }
        return;
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [nostrAuthors]);

  if (minimal)
    return (
      <>
        <div
          className={
            "fit-container fx-scattered  fx-col sc-s-18 bg-img cover-bg pointer"
          }
          onClick={(e) => {
            e.stopPropagation();
            customHistory.push(url);
          }}
          style={{
            position: "relative",
            gap: "0",
            width: "200px",
            aspectRatio: "1/1.2",
          }}
        >
          <div
            className="fx-centered fit-container bg-img cover-bg"
            style={{
              height: "45%",
              backgroundImage: `url(${item.image || item.imagePP})`,
            }}
          >
            {item.kind === 34235 && <div className="play-vid-58"></div>}
          </div>
          <div
            className="fx-scattered fx-start-v fit-container fx-col  box-pad-v-s"
            style={{
              height: "55%",
              backgroundColor: "var(--white)",
            }}
          >
            <div className="fit-container fx-centered fx-col fx-start-h fx-start-v">
              <div className="fx-scattered fit-container">
                <div className="fx-centered box-pad-h-m">
                  <AuthorPreviewMinimal author={authorData} item={item} />
                </div>
                {/* <OptionsDropdown
                  options={[
                    <BookmarkEvent
                      label="Bookmark"
                      pubkey={item.pubkey}
                      kind={item.kind}
                      d={item.d}
                      image={item.thumbnail}
                    />,
                    <div className="fit-container fx-centered fx-start-h pointer">
                      <ShareLink
                        label="Share"
                        path={url}
                        title={item.title}
                        description={item.title}
                        kind={30023}
                        shareImgData={{
                          post: { ...item, image: item.thumbnail },
                          author: {
                            pubkey: authorData.pubkey,
                            picture: authorData.picture,
                            display_name:
                              authorData.display_name || authorData.name,
                          },
                          label: "Article",
                        }}
                      />
                    </div>,
                  ]}
                /> */}
              </div>
              <p className="p-two-lines box-pad-h-m">{item.title}</p>
            </div>
            <div className="box-pad-h-m">
              <DynamicIndicator item={item} />
            </div>
          </div>
        </div>
      </>
    );
  return (
    <>
      {showPreview && (
        <MediaPreview
          kind={"article"}
          exit={() => setShowPreview(false)}
          data={{ author: authorData, content: item }}
        />
      )}

      <div
        className={"fit-container fx-scattered box-pad-h-m mediacard"}
        onClick={(e) => e.stopPropagation()}
        style={{
          border: "none",
          position: "relative",
          overflow: "visible",
          columnGap: "16px",
          paddingBottom: "1rem",
          borderBottom: border ? "1px solid var(--very-dim-gray)" : "",
        }}
      >
        {!showContent && (
          <div className="rvl-btn sc-s-18">
            <p className="box-pad-v-m gray-c">
              This is a sensitive content, do you wish to reveal it?
            </p>
            <button
              className="btn-small btn-normal"
              onClick={() => setShowContent(true)}
            >
              Reveal
            </button>
          </div>
        )}
        <div
          className="fx-scattered fit-container"
          style={{ columnGap: "32px" }}
        >
          <div className="fit-container">
            <div className="fx-scattered box-pad-v-m">
              <div className="fx-centered">
                <AuthorPreview author={authorData} item={item} />
                {isFollowing && (
                  <div
                    className="round-icon-small round-icon-tooltip"
                    data-tooltip="Following"
                  >
                    <div className="user-followed"></div>
                  </div>
                )}
              </div>
              <OptionsDropdown
                options={[
                  <BookmarkEvent
                    label="Bookmark"
                    pubkey={item.pubkey}
                    kind={item.kind}
                    d={item.d}
                    image={item.thumbnail}
                  />,
                  <div className="fit-container fx-centered fx-start-h pointer">
                    <ShareLink
                      label="Share"
                      path={url}
                      title={item.title}
                      description={item.title}
                      kind={30023}
                      shareImgData={{
                        post: { ...item, image: item.thumbnail },
                        author: {
                          pubkey: authorData.pubkey,
                          picture: authorData.picture,
                          display_name:
                            authorData.display_name || authorData.name,
                        },
                        label: "Article",
                      }}
                    />
                  </div>,
                ]}
              />
            </div>
            <Link
              to={url}
              style={{ columnGap: "16px" }}
              className="fit-container fx-scattered"
            >
              <div style={{ width: "max(70%, 800px)" }}>
                <div className="fx-scattered">
                  <p className="p-two-lines p-big p-bold">{item.title}</p>
                </div>
                <div className="box-pad-v-s ">
                  <p className="p-three-lines gray-c fit-container">
                    {item.description || (
                      <span className="p-italic p-medium ">No description</span>
                    )}
                  </p>
                </div>
              </div>
              <div
                className=" bg-img cover-bg sc-s"
                style={{
                  backgroundColor:
                    "linear-gradient(93deg, #880185 -6.44%, #FA4EFF 138.71%)",
                  backgroundImage: `url(${item.image || item.imagePP})`,
                  width: "max(30%,150px)",
                  aspectRatio: "1/1",
                  border: "none",
                  position: "relative",
                }}
              >
                {item.kind === 34235 && (
                  <div
                    className="fx-centered"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <div className="play-vid-58"></div>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

const AuthorPreview = ({ author, item }) => {
  const getDynamicIndicator = () => {
    let dynElem = "";
    if (item.kind === 30023)
      dynElem = `${
        Math.floor(item.content.split(" ").length / 200) || 1
      } min read`;
    if (item.kind === 30004) dynElem = `${item.items.length} articles`;
    if (item.kind === 30005) dynElem = `${item.items.length} videos`;
    if (item.kind === 34235) dynElem = "Watch now";
    return (
      <p className="gray-c p-medium">
        <Date_ toConvert={new Date(item.created_at * 1000)} /> &#x2022;{"  "}
        <span className="orange-c">{dynElem}</span>
      </p>
    );
  };
  let dynamicIndicator = useMemo(() => {
    return getDynamicIndicator();
  }, []);

  return (
    <div className="fx-centered fx-start-h ">
      <UserProfilePicNOSTR
        size={40}
        mainAccountUser={false}
        ring={false}
        user_id={author.pubkey}
        img={author.picture}
        // metadata={author}
      />
      <div>
        <p className="p-bold">{author.display_name || author.name}</p>
        {dynamicIndicator}
      </div>
    </div>
  );
};
const AuthorPreviewMinimal = ({ author, item }) => {
  return (
    <div className="fx-centered fx-start-h ">
      <UserProfilePicNOSTR
        size={16}
        mainAccountUser={false}
        ring={false}
        user_id={author.pubkey}
        img={author.picture}
        // metadata={author}
      />
      <div>
        <p className="p-bold p-medium p-one-line">
          {author.display_name || author.name}
        </p>
      </div>
    </div>
  );
};
