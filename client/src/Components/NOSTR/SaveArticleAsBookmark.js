import React, { useContext, useMemo, useState } from "react";
import relaysOnPlatform from "../../Content/Relays";
import { Context } from "../../Context/Context";
import { filterRelays } from "../../Helpers/Encryptions";
import { publishPost } from "../../Helpers/NostrPublisher";
import AddBookmark from "./AddBookMark";
import LoginNOSTR from "./LoginNOSTR";
import BookmarksPicker from "./BookmarksPicker";

export default function SaveArticleAsBookmark({
  pubkey = "",
  d = "",
  kind = 30023,
  image = "",
  itemType = "a",
  extraData = "",
  label = false,
}) {
  const {
    nostrKeys,
    nostrUser,
    nostrUserBookmarks,
    setNostrUserBookmarks,
    setToPublish,
    isPublishing,
    setToast,
  } = useContext(Context);
  const [toLogin, setToLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBookmarksPicker, setShowBookmarksPicker] = useState(false);
  const itemTypes = {
    a: `${kind}:${pubkey}:${d}`,
    e: pubkey,
    t: extraData,
  };
  const isBookmarked = useMemo(() => {
    return nostrKeys
      ? nostrUserBookmarks.find((bookmark) =>
          bookmark.tags.find((item) => item[1] === itemTypes[itemType])
        )
      : false;
  }, [nostrUserBookmarks, nostrKeys]);

  // if (!nostrKeys) return(
  //   <>

  //   </>
  // )
  return (
    <>
      {showBookmarksPicker && (
        <BookmarksPicker
          pubkey={pubkey}
          d={d}
          kind={kind}
          exit={() => setShowBookmarksPicker(false)}
          image={image}
          itemType={itemType}
          extraData={extraData}
        />
      )}
      {toLogin && <LoginNOSTR exit={() => setToLogin(false)} />}{" "}
      <div
        className="fx-scattered  pointer"
        onClick={() =>
          !nostrKeys ? setToLogin(true) : setShowBookmarksPicker(true)
        }
      >
        {label && <p>{label}</p>}
        {!label && (
          <div
            className={isBookmarked ? "bookmark-i-24-b" : "bookmark-i-24"}
          ></div>
        )}
      </div>
    </>
  );
}
