import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getEmptyuserMetadata,
  removeEventsDuplicants,
  removeObjDuplicants,
} from "../../Helpers/Encryptions";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import Date_ from "../Date_";
import LoadingDots from "../LoadingDots";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "../../Helpers/Controlers";
import {
  getFollowings,
  saveNotificationLastEventTS,
  saveUsers,
} from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { nip19 } from "nostr-tools";
import { useNavigate } from "react-router-dom";
import { compactContent, straightUp } from "../../Helpers/Helpers";
import { eventKinds } from "../../Content/Extra";
import LoadingLogo from "../LoadingLogo";

const types = {
  mention: "mentioned you in a",
  quotes: "quoted",
  media: "published a",
  comments: "replied to",
  comments_on: "commented on",
  reactions: "reacted",
  zaps: "zapped",
  reposts: "reposted",
};

const eventIcons = {
  paid_notes: "not-paid-notes",
  replies_comments: "not-replies-comments",
  quotes: "not-quotes",
  mentions: "not-mentions",
  reactions: "not-reactions",
  reposts: "not-reposts",
  zaps: "not-zaps",
  article: "not-articles",
  curation: "not-curations",
  video: "not-videos",
  "smart widget": "not-smart-widgets",
};

const getReaction = (reaction) => {
  if (reaction === "+") return "👍";
  if (reaction === "-") return "👎";
  return reaction;
};

const getRepEventsLink = (pubkey, kind, identifier) => {
  let naddr = nip19.naddrEncode({ pubkey, identifier, kind });
  if (kind == 30023) return `/article/${naddr}`;
  if (kind == 30004) return `/curations/${naddr}`;
  if (kind == 30005) return `/curations/${naddr}`;
  if (kind == 34235) return `/videos/${naddr}`;
  if (kind == 34236) return `/videos/${naddr}`;
  if (kind == 30031) return `/smart-widget-checker?naddr=${naddr}`;
};

const checkEventType = (event, pubkey, relatedEvent) => {
  try {
    if (event.kind === 1) {
      let isReply = event.tags.find(
        (tag) => tag.length > 3 && tag[3] === "reply"
      );
      let isRoot = event.tags.find(
        (tag) => tag.length > 3 && tag[3] === "root"
      );
      let isQuote = event.tags.find((tag) => tag[0] === "q");
      let isPaidNote = event.tags.find(
        (tag) => tag[0] === "l" && tag[1] === "FLASH NEWS"
      );
      let isRelayedEventPaidNote = relatedEvent
        ? event.tags.find((tag) => tag[0] === "l" && tag[1] === "FLASH NEWS")
        : false;
      let eventKind = isRelayedEventPaidNote ? "paid note" : "note";

      if (isPaidNote) {
        let label_1 = `${types.media} paid note`;
        let label_2 = compactContent(event.content);
        return {
          type: "followings",
          label_1,
          label_2,
          icon: eventIcons.paid_notes,
          id: false,
          url: `/notes/${nip19.noteEncode(event.id)}`,
        };
      }
      if (isReply) {
        let label_1 =
          relatedEvent && relatedEvent.pubkey === pubkey
            ? `${types.comments} your ${eventKind}`
            : `${types.comments} a ${eventKind} you were mentioned in`;
        let label_2 = compactContent(event.content);

        return {
          type: "replies",
          label_1,
          label_2,
          icon: eventIcons.replies_comments,
          id: isReply[1],
          url: `/notes/${nip19.noteEncode(isReply[1])}`,
        };
      }
      if (isRoot) {
        let eventKind = isRoot[0] === "a" ? isRoot[1].split(":")[0] : 1;
        let eventPubkey = isRoot[0] === "a" ? isRoot[1].split(":")[1] : false;
        let eventIdentifier =
          isRoot[0] === "a" ? isRoot[1].split(":")[2] : false;
        let content = eventPubkey
          ? relatedEvent?.tags?.find((tag) => tag[0] === "title")
          : relatedEvent?.content;
        content = eventPubkey && content ? content[1] : relatedEvent?.content;
        let label_1 =
          (relatedEvent && relatedEvent.pubkey === pubkey) ||
          eventPubkey === pubkey
            ? `${types.comments_on} your ${eventKinds[eventKind]}`
            : `${types.comments_on} a ${eventKinds[eventKind]} you were mentioned in`;
        let label_2 = compactContent(event.content);
        let url = eventPubkey
          ? getRepEventsLink(eventPubkey, eventKind, eventIdentifier)
          : `/notes/${nip19.noteEncode(isRoot[1])}`;

        return {
          type: "replies",
          label_1,
          label_2,
          id: isRoot[0] === "a" ? eventPubkey : isRoot[1],
          identifier: eventIdentifier,
          icon: eventIcons.replies_comments,
          url,
        };
      }

      if (isQuote) {
        let label_1 =
          relatedEvent && relatedEvent.pubkey === pubkey
            ? `${types.quotes} your note`
            : `${types.quotes} a note you were mentioned in`;
        let label_2 = compactContent(event.content);

        return {
          type: "quotes",
          label_1,
          label_2,
          id: isQuote[1],
          icon: eventIcons.quotes,
          url: `/notes/${nip19.noteEncode(event.id)}`,
        };
      }

      let label_1 = `${types.mention} note`;
      let label_2 = compactContent(event.content);

      return {
        type: "mentions",
        label_1,
        label_2,
        icon: eventIcons.mentions,
        id: false,
        url: `/notes/${nip19.noteEncode(event.id)}`,
      };
    }

    if ([30023, 30004, 30005, 34235, 30031, 34236].includes(event.kind)) {
      let self = event.tags.find((tag) => tag[1] === pubkey);
      let identifier = event.tags.find((tag) => tag[0] === "d");
      let content = event.tags.find((tag) => tag[0] === "title");
      content = content ? content[1] : "";
      let label_1 = self
        ? `${types.mention} ${eventKinds[event.kind]}`
        : `${types.media} ${eventKinds[event.kind]}`;
      let label_2 = content;

      return {
        type: self ? "mentions" : "followings",
        label_1,
        label_2,
        icon: eventIcons[eventKinds[event.kind]],
        id: false,
        url: getRepEventsLink(event.pubkey, event.kind, identifier[1]),
      };
    }

    if (event.kind === 7) {
      let ev = event.tags.find((tag) => ["e", "a"].includes(tag[0]));
      let eventKind = ev[0] === "a" ? ev[1].split(":")[0] : 1;
      let eventPubkey = ev[0] === "a" ? ev[1].split(":")[1] : false;
      let eventIdentifier = ev[0] === "a" ? ev[1].split(":")[2] : false;
      let content = eventPubkey
        ? relatedEvent?.tags?.find((tag) => tag[0] === "title")
        : relatedEvent?.content;
      content = eventPubkey && content ? content[1] : relatedEvent?.content;
      let reaction = getReaction(event.content);
      let label_1 =
        (relatedEvent && relatedEvent.pubkey === pubkey) ||
        eventPubkey === pubkey
          ? `${types.reactions} ${reaction} to your ${eventKinds[eventKind]}`
          : `${types.reactions} ${reaction} to a ${eventKinds[eventKind]} you were mentioned in`;
      let label_2 = compactContent(content);
      let url = eventPubkey
        ? getRepEventsLink(eventPubkey, eventKind, eventIdentifier)
        : `/notes/${nip19.noteEncode(ev[1])}`;

      return {
        type: "reactions",
        label_1,
        label_2,
        id: ev[0] === "a" ? eventPubkey : ev[1],
        identifier: eventIdentifier,
        icon: eventIcons.reactions,
        url,
      };
    }

    if (event.kind === 6) {
      let innerEvent = JSON.parse(event.content);
      let label_1 =
        innerEvent && innerEvent.pubkey === pubkey
          ? `${types.reposts} your note: `
          : `${types.reposts} a note you were mentioned in: `;
      let label_2 = compactContent(innerEvent.content);

      return {
        type: "reposts",
        label_1,
        label_2,
        icon: eventIcons.reposts,
        id: false,
        url: `/notes/${nip19.noteEncode(innerEvent.id)}`,
      };
    }

    if (event.kind === 9734) {
      let ev = event.tags.find((tag) => ["e", "a"].includes(tag[0]));
      let url = false;
      let eventKind = 0;
      if (ev) {
        eventKind = ev[0] === "a" ? ev[1].split(":")[0] : 1;
        let eventPubkey = ev[0] === "a" ? ev[1].split(":")[1] : false;
        let eventIdentifier = ev[0] === "a" ? ev[1].split(":")[2] : false;
        url = eventPubkey
          ? getRepEventsLink(eventPubkey, eventKind, eventIdentifier)
          : `/notes/${nip19.noteEncode(ev[1])}`;
      }
      let amount = event.tags.find((tag) => tag[0] === "amount");
      let message = compactContent(event.content);
      amount = amount ? Math.ceil(amount[1] / 1000) : 0;

      return {
        type: "zaps",
        label_1: `${types.zaps} ${
          eventKind === 0 ? "you" : "your " + eventKinds[eventKind]
        } ${amount} sats`,
        label_2: message ? `: ${message}` : "",
        icon: eventIcons.zaps,
        id: false,
        url,
      };
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

export default function NotificationCenterMain() {
  const userKeys = useSelector((state) => state.userKeys);

  const [notifications, setNotifications] = useState([]);
  const [newNotifications, setNewNotifications] = useState([]);
  const [contentFrom, setContentFrom] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      let userFollowings = await getFollowings(userKeys.pub);
      userFollowings = userFollowings ? userFollowings.followings : [];
      let tempAuth = [];
      let tempEvents = [];

      let eose = false;
      const sub = ndkInstance.subscribe(
        [
          {
            kinds: [30023, 30004, 34235, 30031],
            authors: userFollowings,
            limit: 20,
          },
          {
            kinds: [1],
            authors: userFollowings,
            "#l": ["FLASH NEWS"],
            limit: 20,
          },
          {
            kinds: [7],
            "#p": [userKeys.pub],
            limit: 20,
          },
          {
            kinds: [6],
            "#p": [userKeys.pub],
            limit: 20,
          },
          {
            kinds: [30023, 30004, 34235, 30031],
            "#p": [userKeys.pub],
            limit: 20,
          },
          {
            kinds: [9735],
            "#p": [userKeys.pub],
            limit: 20,
          },
          {
            kinds: [1],
            "#p": [userKeys.pub],
            limit: 20,
          },
        ],
        {
          cacheUsage: "CACHE_FIRST",
          groupable: false,
          // skipValidation: true,
          // skipVerification: true,
        }
      );

      sub.on("event", (event) => {
        if (event.kind === 9735) {
          let description = JSON.parse(
            event.tags.find((tag) => tag[0] === "description")[1]
          );
          tempAuth.push(description.pubkey);
          tempEvents = removeEventsDuplicants(
            [description, ...tempEvents].sort(
              (ev1, ev2) => ev2.created_at - ev1.created_at
            )
          );
        } else if (event.kind === 6) {
          try {
            let isEventValid = JSON.parse(event.content);
            if (isEventValid) {
              let pubkeys = event.tags
                .filter((tag) => tag[0] === "p")
                .map((tag) => tag[1]);
              tempAuth.push([...pubkeys, event.pubkey]);
              tempEvents = removeEventsDuplicants(
                [event.rawEvent(), ...tempEvents].sort(
                  (ev1, ev2) => ev2.created_at - ev1.created_at
                )
              );
            }
          } catch (err) {
            console.log("event kind:6 ditched");
          }
        } else {
          let checkForLabel = event.tags.find((tag) => tag[0] === "l");
          let isUncensored = checkForLabel
            ? ["UNCENSORED NOTE RATING", "UNCENSORED NOTE"].includes(
                checkForLabel[1]
              )
            : false;

          if (!isUncensored) {
            let pubkeys = event.tags
              .filter((tag) => tag[0] === "p")
              .map((tag) => tag[1]);
            tempAuth.push([...pubkeys, event.pubkey]);
            tempEvents = removeEventsDuplicants(
              [event.rawEvent(), ...tempEvents].sort(
                (ev1, ev2) => ev2.created_at - ev1.created_at
              )
            );
          }
        }

        if (eose) {
          if (event.kind === 9735) {
            let description = JSON.parse(
              event.tags.find((tag) => tag[0] === "description")[1]
            );
            tempAuth.push(description.pubkey);
            if (description.created_at > tempEvents[0].created_at)
              setNewNotifications((prev) =>
                removeEventsDuplicants([description, ...prev])
              );
            else {
              setNotifications((prev) =>
                [...prev, description].sort(
                  (ev1, ev2) => ev2.created_at - ev1.created_at
                )
              );
            }
            tempEvents = removeEventsDuplicants(
              [description, ...tempEvents].sort(
                (ev1, ev2) => ev2.created_at - ev1.created_at
              )
            );
            saveNotificationLastEventTS(userKeys.pib, tempEvents[0].created_at);
          } else {
            let pubkeys = event.tags
              .filter((tag) => tag[0] === "p")
              .map((tag) => tag[1]);
            tempAuth.push([...pubkeys, event.pubkey]);

            if (event.created_at > tempEvents[1].created_at)
              setNewNotifications((prev) =>
                removeEventsDuplicants([event.rawEvent(), ...prev])
              );
            else {
              setNotifications((prev) =>
                [...prev, event.rawEvent()].sort(
                  (ev1, ev2) => ev2.created_at - ev1.created_at
                )
              );
            }
            tempEvents = removeEventsDuplicants(
              [event.rawEvent(), ...tempEvents].sort(
                (ev1, ev2) => ev2.created_at - ev1.created_at
              )
            );
            saveNotificationLastEventTS(userKeys.pub, tempEvents[0].created_at);
          }
        }
      });
      sub.on("eose", () => {
        eose = true;
        setNotifications(tempEvents);
        if (tempEvents.length)
          saveNotificationLastEventTS(userKeys.pub, tempEvents[0].created_at);
        setIsLoading(false);
        saveUsers(tempAuth.flat());
      });
    };
    if (userKeys) {
      setNotifications([]);
      fetchData();
    }
    if (!userKeys) {
      setNotifications([]);
      return;
    }
  }, [userKeys]);

  const switchContentSource = (source) => {
    if (source === contentFrom) return;
    setContentFrom(source);
    straightUp();
  };

  const addNewEvents = () => {
    let events = [];
    for (let event of newNotifications) {
      if (event.kind === 9735) {
        let description = JSON.parse(
          event.tags.find((tag) => tag[0] === "description")[1]
        );
        events.push(description);
      } else {
        events.push(event);
      }
    }
    setNotifications((prev) => [...events, ...prev]);
    setNewNotifications([]);
    straightUp();
  };

  return (
    <>
      {newNotifications.length > 0 && (
        <div
          className="fit-container fx-centered box-pad-v slide-down"
          style={{ position: "fixed", left: 0, top: "85px", zIndex: 200 }}
        >
          <button className="btn btn-normal" onClick={addNewEvents}>
            ({newNotifications.length}) New notification
          </button>
          <div style={{ width: "42px" }}></div>
        </div>
      )}

      <div
        style={{
          width: "min(100%, 600px)",
          height: "100%",
          gap: 0,
        }}
        className=" fx-centered fx-col fx-start-h fx-start-v"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div
          className="fit-container sticky"
          style={{
            zIndex: 100,
            top: "0",
            padding: 0,
          }}
        >
          <div className="fit-container box-pad-h box-pad-v-m">
            <h3>Notifications</h3>
          </div>
          <div className="fit-container box-pad-h fx-even">
            <div
              className={`list-item-b fx-centered fx-shrink  ${
                contentFrom === "all" ? "selected-list-item-b" : ""
              }`}
              style={{ padding: " .5rem 1rem" }}
              onClick={() => switchContentSource("all")}
            >
              All
            </div>
            <div
              className={`list-item-b fx-centered fx-shrink ${
                contentFrom === "mentions" ? "selected-list-item-b" : ""
              }`}
              style={{ padding: " .5rem 1rem" }}
              onClick={() => switchContentSource("mentions")}
            >
              Mentions
            </div>
            <div
              className={`list-item-b fx-centered fx-shrink ${
                contentFrom === "replies" ? "selected-list-item-b" : ""
              }`}
              style={{ padding: " .5rem 1rem" }}
              onClick={() => switchContentSource("replies")}
            >
              Replies
            </div>

            <div
              className={`list-item-b fx-centered fx-shrink ${
                contentFrom === "zaps" ? "selected-list-item-b" : ""
              }`}
              style={{ padding: " .5rem 1rem" }}
              onClick={() => switchContentSource("zaps")}
            >
              Zaps
            </div>

            <div
              className={`list-item-b fx-centered fx-shrink ${
                contentFrom === "followings" ? "selected-list-item-b" : ""
              }`}
              style={{ padding: " .5rem 1rem" }}
              onClick={() => switchContentSource("followings")}
            >
              Followings
            </div>
          </div>
        </div>
        {!isLoading && (
          <div
            className="fit-container fx-centered fx-col fx-start-h"
            style={{
              rowGap: 0,
              overflow: "hidden",
              position: "relative",
            }}
            ref={notificationsRef}
          >
            {/* {newNotifications.length > 0 && ( */}
            {/* <div
              className="fit-container fx-centered box-pad-v slide-down sticky"
              style={{ position: "sticky", left: 0, top: 0, zIndex: 200 }}
            >
              <button className="btn btn-normal" onClick={addNewEvents}>New notification</button>
            </div> */}
            {/* )} */}
            {notifications.map((event) => {
              if (contentFrom !== "all")
                return (
                  <Notification
                    event={event}
                    key={event.id}
                    filterByType={contentFrom}
                  />
                );
              return <Notification event={event} key={event.id} />;
            })}
          </div>
        )}

        {isLoading && (
          <div className="fx-centered fit-container" style={{ height: "70vh" }}>
            <LoadingLogo size={96} />
            {/* Loading <LoadingDots /> */}
          </div>
        )}
      </div>
    </>
  );
}

const Notification = ({ event, filterByType = false }) => {
  const userKeys = useSelector((state) => state.userKeys);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const navigate = useNavigate();

  const user = useMemo(() => {
    return getUser(event.pubkey) || getEmptyuserMetadata(event.pubkey);
  }, [nostrAuthors]);
  const [relatedEvent, setRelatedEvent] = useState(false);

  let type = useMemo(() => {
    return checkEventType(event, userKeys.pub, relatedEvent);
  }, [event, userKeys, relatedEvent]);

  useEffect(() => {
    if (!type?.id) return;

    let filter = type.identifier
      ? [{ "#d": [type.identifier], authors: [type.id] }]
      : [{ ids: [type.id] }];
    const sub = ndkInstance.subscribe(filter, {
      cacheUsage: "ONLY_RELAY",
      groupable: false,
    });

    sub.on("event", (event) => {
      setRelatedEvent(event.rawEvent());
      sub.stop();
    });
  }, []);

  const handleOnClick = (e) => {
    e.stopPropagation();
    if (type.url) navigate(type.url);
  };

  if (!type || event.pubkey === userKeys.pub) return;
  if ((filterByType && filterByType.includes(type.type)) || !filterByType)
    return (
      <div
        className="fit-container fx-centered fx-start-v fx-start-h box-pad-v-m box-pad-h option pointer"
        onClick={handleOnClick}
        style={{
          borderTop: "1px solid  var(--c1-side)",
          borderBottom: "1px solid  var(--c1-side)",
        }}
      >
        <div style={{ position: "relative" }}>
          <UserProfilePicNOSTR
            size={48}
            mainAccountUser={false}
            ring={false}
            user_id={user.pubkey}
            img={user.picture}
          />
          <div
            className="round-icon"
            style={{
              position: "absolute",
              right: "-5px",
              bottom: "-5px",
              backgroundColor: "var(--white)",
              border: "none",
              minWidth: "24px",
              aspectRatio: "1/1",
            }}
          >
            <div className={type.icon}></div>
          </div>
        </div>
        <div
          className="fit-container fx-centered fx-start-h fx-start-v"
          style={{ width: "calc(100% - 32px)" }}
        >
          <div className="fx-centered">
            <div>
              <p className="gray-c">
                <Date_
                  toConvert={new Date(event.created_at * 1000)}
                  time={true}
                />
              </p>
              <p className="p-four-lines">
                {user.display_name || user.name} {type?.label_1}{" "}
                <span className="gray-c">{type?.label_2}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
};

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { nip19 } from "nostr-tools";
// import {
//   getEmptyuserMetadata,
//   getParsedNote,
//   getParsedRepEvent,
// } from "../../Helpers/Encryptions";
// import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
// import { getNoteTree, getVideoContent } from "../../Helpers/Helpers";
// import Date_ from "../Date_";
// import { Link } from "react-router-dom";
// import Slider from "../Slider";
// import LoadingDots from "../LoadingDots";
// import { useDispatch, useSelector } from "react-redux";
// import { setToast } from "../../Store/Slides/Publishers";
// import { getUser } from "../../Helpers/Controlers";
// import { saveUsers } from "../../Helpers/DB";
// import { ndkInstance } from "../../Helpers/NDKInstance";

// const types = {
//   un: "somebody has left an uncensored note to your paid note",
//   fn: "has posted a paid note",
//   arts: "has published an article",
//   cur: "has published a curation",
//   vid: "has posted a video",
//   mention: "has mentioned you in a note",
//   comments: "commented on",
//   reactions: "reacted",
//   sealed: "An uncensored note you rated got sealed",
//   zaps: "Has zapped you",
//   reposts: "Has reposted your note.",
// };

// const checkEventType = (event) => {
//   if (event.kind === 1) {
//     let isThereParent = event.tags.find((tag) => ["e", "a"].includes(tag[0]));
//     let isFN = event.tags.find(
//       (tag) => tag[0] === "l" && tag[1] === "FLASH NEWS"
//     );
//     let isUN = event.tags.find(
//       (tag) => tag[0] === "l" && tag[1] === "UNCENSORED NOTE"
//     );
//     if (isThereParent) {
//       if (isUN) {
//         return { type: "un", part_1: types.un, show_profile: false };
//       } else
//         return { type: "comments", part_1: types.comments, show_profile: true };
//     }
//     if (isFN) {
//       return { type: "fn", part_1: types.fn, show_profile: true };
//     }
//     if (!isThereParent)
//       return { type: "mention", part_1: types.mention, show_profile: true };
//   }

//   if (event.kind === 30023) {
//     return { type: "arts", part_1: types.arts, show_profile: true };
//   }
//   if (event.kind === 30004) {
//     return { type: "cur", part_1: types.cur, show_profile: true };
//   }
//   if (event.kind === 34235) {
//     return { type: "vid", part_1: types.vid, show_profile: true };
//   }
//   if (event.kind === 7) {
//     return { type: "reactions", part_1: types.reactions, show_profile: true };
//   }
//   if (event.kind === 6) {
//     return { type: "reposts", part_1: types.reposts, show_profile: true };
//   }
//   if (event.kind === 30078) {
//     return { type: "sealed", part_1: types.sealed, show_profile: true };
//   }
//   if (event.kind === 9735) {
//     return { type: "zaps", part_1: types.zaps, show_profile: true };
//   }
// };

// export default function NotificationCenterMain() {
//   const dispatch = useDispatch();
//   const userKeys = useSelector((state) => state.userKeys);
//   const userFollowings = useSelector((state) => state.userFollowings);
//   const [showNotificationsCenter, setShowNotificationsCenter] = useState(false);
//   const [notifications, setNotifications] = useState([]);
//   const [allEventsIDs, setAllEventsIDs] = useState([]);
//   const [allEvents, setAllEvents] = useState([]);
//   const [contentFrom, setContentFrom] = useState("all");
//   const [subInstance, setSubInstance] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const notificationsRef = useRef(null);

//   useEffect(() => {
//     const fetchData = () => {
//       // setIsLoading(true);
//       const tempAuth = [];
//       const tempEvents = [];

//       const sub = ndkInstance.subscribe(
//         [
//           {
//             kinds: [1],
//             "#p": [userKeys.pub],
//             limit: 20,
//           },
//           {
//             kinds: [7],
//             "#p": [userKeys.pub],
//             limit: 20,
//           },
//           {
//             kinds: [6],
//             "#p": [userKeys.pub],
//             limit: 20,
//           },
//           {
//             kinds: [9735],
//             "#p": [userKeys.pub],
//             limit: 20,
//           },
//           {
//             kinds: [30023, 30004, 34235],
//             authors: userFollowings,
//             limit: 20,
//           },
//           {
//             kinds: [1],
//             authors: userFollowings,
//             "#l": ["FLASH NEWS"],
//             limit: 20,
//           },
//           {
//             kinds: [30078],
//             "#p": [userKeys.pub],
//             limit: 20,
//           },
//         ],
//         { cacheUsage: "CACHE_FIRST" }
//       );

//       sub.on("event", (event) => {
//         let tempEvent = event.tags.find((tag) => tag[0] === "e");
//         if (tempEvent) tempEvents.push(tempEvent[1]);
//         if (event.kind === 9735) {
//           let description = JSON.parse(
//             event.tags.find((tag) => tag[0] === "description")[1]
//           );
//           tempAuth.push(description.pubkey);
//         } else tempAuth.push(event.pubkey);

//         setNotifications((prev) => {
//           let elem = prev.find((elem) => elem.id === event.id);

//           return elem
//             ? prev
//             : [event, ...prev].sort(
//                 (ev1, ev2) => ev2.created_at - ev1.created_at
//               );
//         });

//         if (Date.now() / 1000 - event.created_at <= 5)
//           dispatch(
//             setToast({
//               type: 1,
//               desc: "New Notification!",
//             })
//           );
//       });
//       sub.on("eose", () => {
//         setAllEventsIDs(tempEvents);
//         saveUsers(tempAuth);
//         setIsLoading(false);
//       });

//       setSubInstance(sub);
//     };
//     if (userKeys && userFollowings) {
//       if (subInstance) {
//         subInstance.stop();
//       }
//       setNotifications([]);
//       fetchData();
//     }
//   }, [userKeys, userFollowings]);

//   useEffect(() => {
//     const tempAuth = [];
//     const sub = ndkInstance.subscribe(
//       [
//         {
//           kinds: [1],
//           ids: allEventsIDs,
//         },
//       ],
//       { cacheUsage: "CACHE_FIRST" }
//     );

//     sub.on("event", (event) => {
//       setAllEvents((prev) => {
//         return [event, ...prev];
//       });
//     });
//     sub.on("eose", () => {
//       saveUsers(tempAuth);
//     });
//     return () => {
//       sub.stop();
//     };
//   }, [allEventsIDs]);

//   const switchContentSource = (source) => {
//     if (source === contentFrom) return;
//     setContentFrom(source);
//     notificationsRef.current.scrollTop = 0;
//   };
//   return (
//     <div
//       style={{
//         width: "min(100%, 600px)",
//         height: "100%",
//         gap: 0,
//         // overflow: "scroll",
//         // backgroundColor: "var(--very-dim-gray)",
//       }}
//       className=" fx-centered fx-col fx-start-h fx-start-v"
//       onClick={(e) => {
//         e.stopPropagation();
//       }}
//     >
//       <div
//         className="fit-container sticky"
//         style={{
//           zIndex: 100,
//           top: "0",
//           padding: 0,
//         }}
//       >
//         <div className="fit-container box-pad-h box-pad-v-m">
//           <h3>Notifications</h3>
//         </div>
//         <div className="fit-container box-pad-h fx-even">
//           <div
//             className={`list-item-b fx-centered fx-shrink  ${
//               contentFrom === "all" ? "selected-list-item-b" : ""
//             }`}
//             style={{ padding: " .5rem 1rem" }}
//             onClick={() => switchContentSource("all")}
//           >
//             All
//           </div>
//           <div
//             className={`list-item-b fx-centered fx-shrink ${
//               contentFrom === "mention" ? "selected-list-item-b" : ""
//             }`}
//             style={{ padding: " .5rem 1rem" }}
//             onClick={() => switchContentSource("mention")}
//           >
//             Mentions
//           </div>
//           <div
//             className={`list-item-b fx-centered fx-shrink ${
//               contentFrom === "reactions" ? "selected-list-item-b" : ""
//             }`}
//             style={{ padding: " .5rem 1rem" }}
//             onClick={() => switchContentSource("reactions")}
//           >
//             Replies
//           </div>

//           <div
//             className={`list-item-b fx-centered fx-shrink ${
//               contentFrom === "zaps" ? "selected-list-item-b" : ""
//             }`}
//             style={{ padding: " .5rem 1rem" }}
//             onClick={() => switchContentSource("zaps")}
//           >
//             Zaps
//           </div>

//           <div
//             className={`list-item-b fx-centered fx-shrink ${
//               contentFrom === "followings" ? "selected-list-item-b" : ""
//             }`}
//             style={{ padding: " .5rem 1rem" }}
//             onClick={() => switchContentSource("followings")}
//           >
//             Followings
//           </div>
//           {/* <Slider
//             items={[
//               <div
//                 className={`list-item-b fx-centered fx-shrink  ${
//                   contentFrom === "all" ? "selected-list-item-b" : ""
//                 }`}
//                 style={{ padding: " .5rem 1rem" }}
//                 onClick={() => switchContentSource("all")}
//               >
//                 All
//               </div>,
//               <div
//                 className={`list-item-b fx-centered fx-shrink ${
//                   contentFrom === "mention" ? "selected-list-item-b" : ""
//                 }`}
//                 style={{ padding: " .5rem 1rem" }}
//                 onClick={() => switchContentSource("mention")}
//               >
//                 Mentions
//               </div>,
//               <div
//                 className={`list-item-b fx-centered fx-shrink ${
//                   contentFrom === "zaps" ? "selected-list-item-b" : ""
//                 }`}
//                 style={{ padding: " .5rem 1rem" }}
//                 onClick={() => switchContentSource("zaps")}
//               >
//                 Zaps
//               </div>,
//               <div
//                 className={`list-item-b fx-centered fx-shrink ${
//                   contentFrom === "reactions" ? "selected-list-item-b" : ""
//                 }`}
//                 style={{ padding: " .5rem 1rem" }}
//                 onClick={() => switchContentSource("reactions")}
//               >
//                 Reactions
//               </div>,
//               <div
//                 className={`list-item-b fx-centered fx-shrink ${
//                   contentFrom === "followings" ? "selected-list-item-b" : ""
//                 }`}
//                 style={{ padding: " .5rem 1rem" }}
//                 onClick={() => switchContentSource("followings")}
//               >
//                 Followings
//               </div>,
//             ]}
//           /> */}
//         </div>
//       </div>
//       {!isLoading && (
//         <div
//           className="fit-container fx-centered fx-col fx-start-h"
//           style={{
//             rowGap: 0,
//           }}
//           ref={notificationsRef}
//         >
//           {notifications.map((event) => {
//             if (contentFrom === "zaps" && event.kind === 9735)
//               return (
//                 <Notification
//                   event={event}
//                   allEvents={allEvents}
//                   key={event.id}
//                 />
//               );
//             if (contentFrom === "mention" && event.kind === 1)
//               return (
//                 <Notification
//                   event={event}
//                   allEvents={allEvents}
//                   key={event.id}
//                   filterByType={["mention", "un", "comments"]}
//                 />
//               );
//             if (contentFrom === "reactions" && event.kind === 7)
//               return (
//                 <Notification
//                   event={event}
//                   allEvents={allEvents}
//                   key={event.id}
//                 />
//               );

//             if (
//               contentFrom === "followings" &&
//               userFollowings.includes(event.pubkey) &&
//               [30004, 30023, 34235, 1].includes(event.kind)
//             )
//               return (
//                 <Notification
//                   event={event}
//                   allEvents={allEvents}
//                   key={event.id}
//                 />
//               );
//             if (contentFrom === "all")
//               return (
//                 <Notification
//                   event={event}
//                   allEvents={allEvents}
//                   key={event.id}
//                 />
//               );
//           })}
//         </div>
//       )}

//       {isLoading && (
//         <div className="fx-centered fit-container" style={{ height: "50dvh" }}>
//           Loading <LoadingDots />
//         </div>
//       )}
//     </div>
//   );
// }

// const Notification = ({ event, allEvents, filterByType = false }) => {
//   const userKeys = useSelector((state) => state.userKeys);
//   const nostrAuthors = useSelector((state) => state.nostrAuthors);

//   const [user, setUser] = useState(getEmptyuserMetadata(event.pubkey));
//   const [relatedEvent, setRelatedEvent] = useState(false);
//   const [isSats, setIfSats] = useState(false);
//   const [content, setContent] = useState(event.content);

//   let type = useMemo(() => {
//     return checkEventType(event);
//   }, [event]);

//   useEffect(() => {
//     let tempPubkey = event.pubkey;
//     if (event.kind === 9735) {
//       let description = JSON.parse(
//         event.tags.find((tag) => tag[0] === "description")[1]
//       );

//       let amount = description.tags.find((tag) => tag[0] === "amount");
//       setIfSats({
//         message: description.content,
//         amount: amount ? Math.ceil(amount[1] / 1000) : 0,
//       });
//       tempPubkey = description.pubkey;
//     }
//     let auth = getUser(tempPubkey);
//     if (auth) setUser(auth);
//   }, [nostrAuthors]);

//   useEffect(() => {
//     const fetchData = async () => {
//       let eventToFetch = event.tags.filter((tag) => tag[0] === "e");
//       eventToFetch = eventToFetch ? eventToFetch.reverse()[0][1] : false;
//       if (!eventToFetch) return;
//       let tempRelatedEvent = allEvents.find((e) => e.id === eventToFetch);

//       if (!tempRelatedEvent) return;
//       let auth =
//         getUser(tempRelatedEvent.pubkey) ||
//         getEmptyuserMetadata(tempRelatedEvent.pubkey);
//       // let note_tree = await getNoteTree(tempRelatedEvent.content);
//       const nEvent = nip19.neventEncode({
//         author: tempRelatedEvent.pubkey,
//         id: tempRelatedEvent.id,
//       });
//       setRelatedEvent({
//         author: auth,
//         nEvent,
//         // note_tree,
//         ...tempRelatedEvent,
//       });
//     };
//     const fetchData_2 = async () => {
//       let auth = getUser(event.pubkey) || getEmptyuserMetadata(event.pubkey);
//       let parsedEvent = getParsedRepEvent(event);
//       const naddr = nip19.naddrEncode({
//         pubkey: event.pubkey,
//         identifier: parsedEvent.d,
//         kind: event.kind,
//       });
//       setRelatedEvent({
//         author: auth,
//         naddr,
//         ...parsedEvent,
//       });
//     };
//     const fetchData_3 = async () => {
//       let auth = getUser(event.pubkey) || getEmptyuserMetadata(event.pubkey);
//       let parsedEvent = getVideoContent(event);
//       setRelatedEvent({
//         author: auth,
//         ...parsedEvent,
//       });
//     };
//     const fetchData_4 = async () => {
//       let parsedEvent = JSON.parse(event.content);
//       let auth =
//         getUser(parsedEvent.pubkey) || getEmptyuserMetadata(parsedEvent.pubkey);
//       setRelatedEvent({
//         author: auth,
//         ...parsedEvent,
//       });
//     };
//     if (
//       !relatedEvent &&
//       ((event.kind === 1 && ["comments", "un", "fn"].includes(type.type)) ||
//         event.kind === 7)
//     )
//       fetchData();
//     if (event.kind === 6) {
//       fetchData_4();
//     }
//     if ([30023, 30004].includes(event.kind)) {
//       fetchData_2();
//     }
//     if (event.kind === 34235) {
//       fetchData_3();
//     }
//   }, [allEvents, nostrAuthors]);

//   useEffect(() => {
//     const fetchData = (noteContent) => {
//       try {
//         setContent(noteContent);
//       } catch (err) {
//         console.log(err);
//       }
//     };
//     if (event.kind === 1) fetchData(event.content);
//     if (event.kind === 30078) fetchData(JSON.parse(event.content).content);
//   }, []);

//   const getReatcion = (content) => {
//     if (content === "+") return <div className="thumbsup"></div>;
//     if (content === "-") return <div className="thumbsdown"></div>;
//     return content;
//   };

//   if (
//     !type ||
//     event.pubkey === userKeys.pub ||
//     (event.kind === 7 && !relatedEvent)
//   )
//     return;
//   if ((filterByType && filterByType.includes(type.type)) || !filterByType)
//     return (
//       <div
//         className="fit-container fx-centered fx-col box-pad-v-m box-pad-h"
//         onClick={(e) => {
//           e.stopPropagation();
//         }}
//         style={{
//           borderTop: "1px solid  var(--c1-side)",
//           borderBottom: "1px solid  var(--c1-side)",
//         }}
//       >
//         {event.kind !== 30078 && (
//           <div className="fit-container fx-scattered">
//             <div className="fx-centered fx-start-h">
//               {type.show_profile && (
//                 <UserProfilePicNOSTR
//                   size={30}
//                   mainAccountUser={false}
//                   ring={false}
//                   user_id={user.pubkey}
//                   img={user.picture}
//                 />
//               )}
//               {!type.show_profile && (
//                 <UserProfilePicNOSTR
//                   size={30}
//                   mainAccountUser={false}
//                   ring={false}
//                   user_id={"Unanymous"}
//                   allowClick={false}
//                   img={""}
//                 />
//               )}
//               <p
//                 className="orange-c p-medium fx-centered"
//                 style={{ columnGap: "4px" }}
//               >
//                 {type.show_profile && (
//                   <span style={{ color: "var(--black)" }}>{user.name}</span>
//                 )}{" "}
//                 {type.part_1} {event.kind === 7 && getReatcion(event.content)}{" "}
//                 {event.kind === 9735 && `${isSats.amount} Sats`}
//               </p>
//             </div>
//             <p className="gray-c p-medium" style={{ minWidth: "max-content" }}>
//               <Date_
//                 toConvert={new Date(event.created_at * 1000)}
//                 time={true}
//               />
//             </p>
//           </div>
//         )}
//         {event.kind === 30078 && (
//           <div className="fit-container fx-scattered">
//             <div className="fit-container fx-centered fx-start-h">
//               <div
//                 className="round-icon"
//                 style={{
//                   minHeight: "30px",
//                   minWidth: "30px",
//                   borderColor: "var(--black)",
//                 }}
//               >
//                 <div className="note"></div>
//               </div>
//               <p className="gray-c p-medium">{type.part_1}</p>
//             </div>
//             <p className="gray-c p-medium" style={{ minWidth: "max-content" }}>
//               <Date_
//                 toConvert={new Date(event.created_at * 1000)}
//                 time={true}
//               />
//             </p>
//           </div>
//         )}
//         {[30078].includes(event.kind) && (
//           <div className="fit-container fx-centered fx-end-h">
//             <div
//               className="box-pad-h-m box-pad-v-m sc-s-18 fit-container"
//               style={{ backgroundColor: "var(--white-transparent)" }}
//             >
//               <p className="p-medium p-three-lines">{content}</p>
//             </div>
//           </div>
//         )}
//         {[1, 6, 30023, 30004, 34235].includes(event.kind) && (
//           <div className="fit-container fx-centered fx-wrap fx-end-h">
//             {relatedEvent && (
//               <div
//                 className="box-pad-h-m box-pad-v-m sc-s-18 fit-container"
//                 style={{ backgroundColor: "var(--c1-side)" }}
//               >
//                 <div className="fx-scattered fit-container box-marg-s">
//                   <div className="fx-centered fx-start-h">
//                     <UserProfilePicNOSTR
//                       size={24}
//                       mainAccountUser={false}
//                       ring={false}
//                       user_id={relatedEvent.author.pubkey}
//                       img={relatedEvent.author.picture}
//                     />
//                     <div>
//                       <p className="p-medium">
//                         {relatedEvent.author.display_name ||
//                           relatedEvent.author.name}
//                       </p>
//                       <p className="p-medium gray-c">
//                         @
//                         {relatedEvent.author.name ||
//                           relatedEvent.author.display_name}
//                       </p>
//                     </div>
//                   </div>
//                   {type.type === "un" && (
//                     <Link
//                       target="_blank"
//                       to={`/uncensored-notes/${relatedEvent.nEvent}`}
//                     >
//                       <div className="share-icon"></div>
//                     </Link>
//                   )}
//                   {type.type === "fn" && (
//                     <Link
//                       target="_blank"
//                       to={`/flash-news/${relatedEvent.nEvent}`}
//                     >
//                       <div className="share-icon"></div>
//                     </Link>
//                   )}
//                   {type.type === "comments" && (
//                     <Link target="_blank" to={`/notes/${relatedEvent.nEvent}`}>
//                       <div className="share-icon"></div>
//                     </Link>
//                   )}
//                   {type.type === "arts" && (
//                     <Link target="_blank" to={`/article/${relatedEvent.naddr}`}>
//                       <div className="share-icon"></div>
//                     </Link>
//                   )}
//                   {type.type === "cur" && (
//                     <Link
//                       target="_blank"
//                       to={`/curations/${relatedEvent.naddr}`}
//                     >
//                       <div className="share-icon"></div>
//                     </Link>
//                   )}
//                   {type.type === "vid" && (
//                     <Link target="_blank" to={`/videos/${relatedEvent.naddr}`}>
//                       <div className="share-icon"></div>
//                     </Link>
//                   )}
//                 </div>
//                 {[1, 6].includes(event.kind) && (
//                   <p className="p-three-lines">{relatedEvent.content}</p>
//                 )}
//                 {[30023, 30004].includes(event.kind) && (
//                   <div className="fit-container fx-centered fx-start-h">
//                     <div
//                       className=" cover-bg bg-img sc-s-18"
//                       style={{
//                         minWidth: "50px",
//                         aspectRatio: "1/1",
//                         backgroundImage: `url(${relatedEvent.image})`,
//                       }}
//                     ></div>
//                     <p>{relatedEvent.title}</p>
//                   </div>
//                 )}
//                 {[34235].includes(event.kind) && (
//                   <Link
//                     key={relatedEvent.id}
//                     className=" bg-img cover-bg fit-container fx-scattered"
//                     to={`/videos/${relatedEvent.naddr}`}
//                   >
//                     <div
//                       className=" fx-centered fx-start-v fx-col"
//                       style={{
//                         height: "100%",

//                         position: "relative",
//                       }}
//                     >
//                       <p className="p-two-lines">{relatedEvent.title}</p>
//                       <div className="fit-container fx-scattered">
//                         <div className="fx-centered">
//                           <p className="gray-c p-medium">
//                             <Date_
//                               toConvert={
//                                 new Date(relatedEvent.published_at * 1000)
//                               }
//                               time={true}
//                             />
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                     <Link
//                       key={relatedEvent.id}
//                       className="sc-s-18 fx-centered bg-img cover-bg  fx-centered fx-end-h fx-end-v"
//                       to={`/videos/${relatedEvent.naddr}`}
//                       style={{
//                         width: "150px",
//                         minWidth: "150px",
//                         aspectRatio: "16/9",
//                         backgroundImage: `url(${relatedEvent.image})`,
//                         backgroundColor: "black",
//                       }}
//                     >
//                       <div
//                         className="fit-container fx-centered fx-col box-pad-h-m fx-start-v fx-end-h box-pad-v-m"
//                         style={{
//                           height: "100%",
//                           background:
//                             "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 87%)",
//                           position: "relative",
//                         }}
//                       >
//                         <div
//                           className="fx-centered"
//                           style={{
//                             position: "absolute",
//                             left: 0,
//                             top: 0,
//                             width: "100%",
//                             height: "100%",
//                           }}
//                         >
//                           <div className="play-vid-58"></div>
//                         </div>
//                       </div>
//                     </Link>
//                   </Link>
//                 )}
//               </div>
//             )}
//             {event.kind === 1 && (
//               <div
//                 className="box-pad-h-m box-pad-v-m sc-s-18 fit-container p-medium"
//                 style={{
//                   backgroundColor: "var(--white-transparent)",
//                   width: "95%",
//                 }}
//               >
//                 {type.show_profile && (
//                   <div className="fx-scattered box-marg-s fit-container">
//                     <div className="fx-centered">
//                       <UserProfilePicNOSTR
//                         size={24}
//                         mainAccountUser={false}
//                         ring={false}
//                         user_id={event.pubkey}
//                         img={user.picture}
//                       />
//                       <div>
//                         <p className="p-small">
//                           {user.display_name || user.name}
//                         </p>
//                         <p className="p-small gray-c">
//                           @{user.name || user.display_name}
//                         </p>
//                       </div>
//                     </div>
//                     {type.type === "fn" && (
//                       <Link
//                         target="_blank"
//                         to={`/flash-news/${nip19.neventEncode({
//                           author: event.pubkey,
//                           id: event.id,
//                         })}`}
//                       >
//                         <div className="share-icon"></div>
//                       </Link>
//                     )}
//                     {type.type !== "fn" && (
//                       <Link
//                         target="_blank"
//                         to={`/notes/${nip19.neventEncode({
//                           author: event.pubkey,
//                           id: event.id,
//                         })}`}
//                       >
//                         <div className="share-icon"></div>
//                       </Link>
//                     )}
//                   </div>
//                 )}
//                 {!type.show_profile && (
//                   <div className="fx-centered fx-start-h box-marg-s fit-container">
//                     <UserProfilePicNOSTR
//                       size={24}
//                       mainAccountUser={false}
//                       ring={false}
//                       user_id={"Unanymous"}
//                       allowClick={false}
//                       img={""}
//                     />
//                     <div>
//                       <p className="p-small">{"Unanymous"}</p>
//                       <p className="p-small gray-c">@Unanymous</p>
//                     </div>
//                   </div>
//                 )}
//                 <p className="p-medium p-three-lines">{content}</p>
//               </div>
//             )}
//           </div>
//         )}
//         {[7].includes(event.kind) && (
//           <div className="fit-container fx-centered fx-wrap fx-end-h">
//             {relatedEvent && (
//               <div
//                 className="box-pad-h-m box-pad-v-m sc-s-18 fit-container"
//                 style={{ backgroundColor: "var(--white-transparent)" }}
//               >
//                 <div className="fx-scattered fit-container box-marg-s">
//                   <div className="fx-centered">
//                     <UserProfilePicNOSTR
//                       size={24}
//                       mainAccountUser={false}
//                       ring={false}
//                       user_id={event.pubkey}
//                       img={relatedEvent.author.picture}
//                     />
//                     <div>
//                       <p className="p-medium">
//                         {relatedEvent.author.display_name ||
//                           relatedEvent.author.name}
//                       </p>
//                       <p className="p-medium gray-c">
//                         {relatedEvent.author.name ||
//                           relatedEvent.author.display_name}
//                       </p>
//                     </div>
//                   </div>
//                   <Link
//                     target="_blank"
//                     to={`/notes/${nip19.neventEncode({
//                       author: relatedEvent.pubkey,
//                       id: relatedEvent.id,
//                     })}`}
//                   >
//                     <div className="share-icon"></div>
//                   </Link>
//                 </div>
//                 <p className="p-medium">{relatedEvent.content}</p>
//               </div>
//             )}
//           </div>
//         )}
//         {[9735].includes(event.kind) && event.content && (
//           <div className="fit-container fx-centered fx-wrap fx-end-h">
//             <div
//               className="box-pad-h-m box-pad-v-m sc-s-18 fit-container"
//               style={{ backgroundColor: "var(--white-transparent)" }}
//             >
//               <p className="p-medium gray-c">Zappers message</p>
//               <p>{event.content}</p>
//             </div>
//           </div>
//         )}
//       </div>
//     );
// };
