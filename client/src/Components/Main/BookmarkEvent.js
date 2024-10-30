import React, { useMemo, useState } from "react";
import LoginWithNostr from "./LoginWithNostr";
import BookmarksPicker from "./BookmarksPicker";
import { useSelector } from "react-redux";
import { redirectToLogin } from "../../Helpers/Helpers";

export default function BookmarkEvent({
  pubkey = "",
  d = "",
  kind = 30023,
  image = "",
  itemType = "a",
  extraData = "",
  label = false,
}) {
  const userKeys = useSelector((state) => state.userKeys);
  const userBookmarks = useSelector((state) => state.userBookmarks);
  const [showBookmarksPicker, setShowBookmarksPicker] = useState(false);
  const itemTypes = {
    a: `${kind}:${pubkey}:${d}`,
    e: pubkey,
    t: extraData,
  };
  const isBookmarked = useMemo(() => {
    return userKeys
      ? userBookmarks.find((bookmark) =>
          bookmark.items.find((item) => item === itemTypes[itemType])
        )
      : false;
  }, [userBookmarks, userKeys]);

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

      <div
        className="fx-scattered  pointer"
        onClick={() =>
          !userKeys ? redirectToLogin() : setShowBookmarksPicker(true)
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
