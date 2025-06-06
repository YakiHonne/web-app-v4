import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getEmptyuserMetadata,
  getZapper,
  removeEventsDuplicants,
} from "../../Helpers/Encryptions";
import UserProfilePic from "./UserProfilePic";
import Date_ from "../Date_";
import { useSelector } from "react-redux";
import { getUser } from "../../Helpers/Controlers";
import {
  getFollowings,
  getMutedlist,
  saveNotificationLastEventTS,
  saveUsers,
} from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { nip19 } from "nostr-tools";
import { Link, useNavigate } from "react-router-dom";
import {
  compactContent,
  getCustomSettings,
  getNoteTree,
  nEventEncode,
  straightUp,
} from "../../Helpers/Helpers";
import { eventKinds } from "../../Content/Extra";
import LoadingLogo from "../LoadingLogo";
import { customHistory } from "../../Helpers/History";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import Zap from "../Reactions/Zap";
import useNoteStats from "../../Hooks/useNoteStats";

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

const checkEventType = (event, pubkey, relatedEvent, username) => {
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
      let eventKind = isRelayedEventPaidNote ? true : false;

      if (isPaidNote) {
        let label_1 = t(eventKind ? "AmKIbHq" : "AMukTAR", {
          name: username,
        });
        let label_2 = event.content;
        return {
          type: "following",
          label_1,
          label_2,
          icon: eventIcons.paid_notes,
          id: false,
          url: `/notes/${nEventEncode(event.id)}`,
        };
      }
      if (isReply) {
        let label_1 =
          relatedEvent && relatedEvent.pubkey === pubkey
            ? t(eventKind ? "Aj3QSsl" : "A3hNKTw", {
                name: username,
              })
            : t(eventKind ? "AnMEe4G" : "AAm18zd", {
                name: username,
              });
        let label_2 = event.content;

        return {
          type: "replies",
          label_1,
          label_2,
          icon: eventIcons.replies_comments,
          id: isReply[1],
          url: `/notes/${nEventEncode(event.id)}`,
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
            ? t(`Az3sitJ_${eventKind}`, { name: username })
            : t(`AxGCCW4_${eventKind}`, { name: username });
        let label_2 = event.content;
        let url = eventPubkey
          ? getRepEventsLink(eventPubkey, eventKind, eventIdentifier)
          : `/notes/${nEventEncode(isRoot[1])}`;

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
            ? t("AbWsTvK", { name: username })
            : t("ACmLZt3", {
                name: username,
              });
        let label_2 = event.content;

        return {
          type: "quotes",
          label_1,
          label_2,
          id: isQuote[1],
          icon: eventIcons.quotes,
          url: `/notes/${nEventEncode(event.id)}`,
        };
      }

      let label_1 = t("AtWXTcu", { name: username });
      let label_2 = event.content;

      return {
        type: "mentions",
        label_1,
        label_2,
        icon: eventIcons.mentions,
        id: false,
        url: `/notes/${nEventEncode(event.id)}`,
      };
    }

    if ([30023, 30004, 30005, 34235, 30031, 34236].includes(event.kind)) {
      let self = event.tags.find((tag) => tag[1] === pubkey);
      let identifier = event.tags.find((tag) => tag[0] === "d");
      let content = event.tags.find((tag) => tag[0] === "title");
      content = content ? content[1] : "";
      let label_1 = self
        ? t(`AETny3G_${event.kind}`, { name: username })
        : t(`AWXssJ6_${event.kind}`, { name: username });
      let label_2 = content;

      return {
        type: self ? "mentions" : "following",
        label_1,
        label_2,
        icon: eventIcons[eventKinds[event.kind]],
        id: false,
        url: getRepEventsLink(event.pubkey, event.kind, identifier[1]),
      };
    }

    if (event.kind === 7) {
      let isE = event.tags.find((tag) => tag[0] === "e");
      let isA = event.tags.find((tag) => tag[0] === "a");
      let ev = isA || isE;

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
          ? t(`AeOUYTy_${eventKind}`, {
              name: username,
              reaction,
            })
          : t(`A5xBOLZ_${eventKind}`, {
              name: username,
              reaction,
            });
      let label_2 = content;
      let url = eventPubkey
        ? getRepEventsLink(eventPubkey, eventKind, eventIdentifier)
        : `/notes/${nEventEncode(ev[1])}`;

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
          ? t("AtLiZSD", { name: username })
          : t("Avp7edv", { name: username });
      let label_2 = innerEvent.content;

      return {
        type: "reposts",
        label_1,
        label_2,
        icon: eventIcons.reposts,
        id: false,
        url: `/notes/${nEventEncode(innerEvent.id)}`,
      };
    }

    if (event.kind === 9734) {
      let isE = event.tags.find((tag) => tag[0] === "e");
      let isA = event.tags.find((tag) => tag[0] === "a");
      let ev = isA || isE;
      let url = false;
      let eventKind = 0;
      if (ev) {
        eventKind = ev[0] === "a" ? ev[1].split(":")[0] : 1;
        let eventPubkey = ev[0] === "a" ? ev[1].split(":")[1] : false;
        let eventIdentifier = ev[0] === "a" ? ev[1].split(":")[2] : false;
        url = eventPubkey
          ? getRepEventsLink(eventPubkey, eventKind, eventIdentifier)
          : `/notes/${nEventEncode(ev[1])}`;
      }

      let amount =
        event.amount || event.tags.find((tag) => tag[0] === "amount");

      let message = event.content;

      return {
        type: "zaps",
        label_1:
          eventKind === 0
            ? t("A5xBOLZ", { name: username, amount })
            : t(`AdiWL4V_${eventKind}`, { name: username, amount }),
        label_2: message ? `: ${message}` : "",
        icon: eventIcons.zaps,
        id: isE ? isE[1] : false,
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
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [newNotifications, setNewNotifications] = useState([]);
  const [contentFrom, setContentFrom] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const notificationsRef = useRef(null);
  const notificationSettings = (() => {
    let settings =
      getCustomSettings().notification || getCustomSettings("").notification;
    let mentions = settings.find((_) => _.tab === "mentions")?.isHidden;
    let zaps = settings.find((_) => _.tab === "zaps")?.isHidden;
    let reactions = settings.find((_) => _.tab === "reactions")?.isHidden;
    let reposts = settings.find((_) => _.tab === "reposts")?.isHidden;
    let following = settings.find((_) => _.tab === "following")?.isHidden;

    return {
      mentions,
      zaps,
      reactions,
      reposts,
      following,
    };
  })();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      let [userFollowings, userMutedList] = await Promise.all([
        getFollowings(userKeys.pub),
        getMutedlist(userKeys.pub),
      ]);
      userFollowings = userFollowings ? userFollowings.followings : [];
      userMutedList = userMutedList ? userMutedList.mutedlist : [];
      let tempAuth = [];
      let tempEvents = [];
      let filter = getFilter(userFollowings);
      let eose = false;
      const sub = ndkInstance.subscribe(filter, {
        cacheUsage: "CACHE_FIRST",
        groupable: false,
      });

      sub.on("event", (event) => {
        if (!userMutedList.includes(event.pubkey)) {
          if (event.kind === 9735) {
            let description = JSON.parse(
              event.tags.find((tag) => tag[0] === "description")[1]
            );

            tempAuth.push(description.pubkey);
            tempEvents = removeEventsDuplicants(
              [
                {
                  ...description,
                  created_at: event.created_at,
                  amount: getZapper(event).amount,
                },
                ...tempEvents,
              ].sort((ev1, ev2) => ev2.created_at - ev1.created_at)
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
              if (event.created_at > tempEvents[0].created_at)
                setNewNotifications((prev) =>
                  removeEventsDuplicants([
                    {
                      ...description,
                      created_at: event.created_at,
                      amount: getZapper(event).amount,
                    },
                    ...prev,
                  ])
                );
              else {
                setNotifications((prev) =>
                  [
                    ...prev,
                    {
                      ...description,
                      created_at: event.created_at,
                      amount: getZapper(event).amount,
                    },
                  ].sort((ev1, ev2) => ev2.created_at - ev1.created_at)
                );
              }
              tempEvents = removeEventsDuplicants(
                [
                  { ...description, created_at: event.created_at },
                  ...tempEvents,
                ].sort((ev1, ev2) => ev2.created_at - ev1.created_at)
              );

              saveNotificationLastEventTS(
                userKeys.pub,
                tempEvents[0].created_at
              );
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
              saveNotificationLastEventTS(
                userKeys.pub,
                tempEvents[0].created_at
              );
            }
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

  const getFilter = (fList) => {
    let filter = [];
    let { mentions, zaps, reactions, reposts, following } =
      notificationSettings;

    if (!mentions) {
      filter.push({
        kinds: [30023, 30004, 34235, 30031],
        "#p": [userKeys.pub],
        limit: 20,
      });
      filter.push({
        kinds: [1],
        "#p": [userKeys.pub],
        limit: 20,
      });
    }
    if (!zaps)
      filter.push({
        kinds: [9735],
        "#p": [userKeys.pub],
        limit: 20,
      });
    if (!reactions)
      filter.push({
        kinds: [7],
        "#p": [userKeys.pub],
        limit: 20,
      });
    if (!reposts)
      filter.push({
        kinds: [6],
        "#p": [userKeys.pub],
        limit: 20,
      });
    if (!following) {
      filter.push({
        kinds: [30023, 30004, 34235, 30031],
        authors: fList,
        limit: 20,
      });
      filter.push({
        kinds: [1],
        authors: fList,
        "#l": ["FLASH NEWS"],
        limit: 20,
      });
    }
    return filter;
  };

  return (
    <>
      {newNotifications.length > 0 && (
        <div
          className="fit-container fx-centered box-pad-v slide-down"
          style={{ position: "fixed", left: 0, top: "85px", zIndex: 200 }}
        >
          <button className="btn btn-normal" onClick={addNewEvents}>
            {t("AV9Dfnw", { count: newNotifications.length })}
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
          <div className="fit-container fx-scattered box-pad-h box-pad-v-m">
            <h3>{t("ASSFfFZ")}</h3>
            <Link to={"/settings"} state={{ tab: "customization" }}>
              <div className="setting-24"></div>
            </Link>
          </div>
          <div className="fit-container box-pad-h fx-even">
            <div
              className={`list-item-b fx-centered fx-shrink  ${
                contentFrom === "all" ? "selected-list-item-b" : ""
              }`}
              style={{ padding: " .5rem 1rem" }}
              onClick={() => switchContentSource("all")}
            >
              {t("AR9ctVs")}
            </div>
            <div
              className={`list-item-b fx-centered fx-shrink ${
                contentFrom === "mentions" ? "selected-list-item-b" : ""
              }`}
              style={{ padding: " .5rem 1rem" }}
              onClick={() => switchContentSource("mentions")}
            >
              {t("A8Da0of")}
            </div>
            <div
              className={`list-item-b fx-centered fx-shrink ${
                contentFrom === "replies" ? "selected-list-item-b" : ""
              }`}
              style={{ padding: " .5rem 1rem" }}
              onClick={() => switchContentSource("replies")}
            >
              {t("AENEcn9")}
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
                contentFrom === "following" ? "selected-list-item-b" : ""
              }`}
              style={{ padding: " .5rem 1rem" }}
              onClick={() => switchContentSource("following")}
            >
              {t("A9TqNxQ")}
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
        {notificationSettings[
          ["mentions", "replies"].includes(contentFrom)
            ? "mentions"
            : contentFrom
        ] && <ActivateNotification />}
        {isLoading && (
          <div className="fx-centered fit-container" style={{ height: "70vh" }}>
            <LoadingLogo size={96} />
          </div>
        )}
      </div>
    </>
  );
}

const Notification = ({ event, filterByType = false }) => {
  const userKeys = useSelector((state) => state.userKeys);
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const user = useMemo(() => {
    return getUser(event.pubkey) || getEmptyuserMetadata(event.pubkey);
  }, [nostrAuthors]);
  const [relatedEvent, setRelatedEvent] = useState(false);
  const { postActions } = useNoteStats(event?.id, event?.pubkey);

  let type = useMemo(() => {
    return checkEventType(
      event,
      userKeys.pub,
      relatedEvent,
      user.display_name || user.name
    );
  }, [event, userKeys, relatedEvent, user]);

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
    if (type.url) customHistory.push(type.url);
  };

  if (!type || event.pubkey === userKeys.pub) return;
  if ((filterByType && filterByType.includes(type.type)) || !filterByType)
    return (
      <div
        className="fit-container fx-centered fx-start-v fx-start-h box-pad-v-m box-pad-h  pointer"
        onClick={handleOnClick}
        style={{
          borderTop: "1px solid  var(--c1-side)",
          borderBottom: "1px solid  var(--c1-side)",
        }}
      >
        <div style={{ position: "relative" }}>
          <UserProfilePic
            size={48}
            mainAccountUser={false}
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
          <div className="fx-centered fit-container">
            <div className="fit-container">
              <div className="fit-container fx-scattered">
                <div>
                  <p className="gray-c">
                    <Date_
                      toConvert={new Date(event.created_at * 1000)}
                      time={true}
                    />
                  </p>
                  <p className="p-four-lines">{type?.label_1} </p>
                </div>
                {event.kind === 1 && (
                  <div onClick={(e) => e.stopPropagation()} className="round-icon-small round-icon-tooltip" data-tooltip={t("AtGAGPY")}>
                    <Zap user={user} event={event} actions={postActions} />
                  </div>
                )}
              </div>
              <p
                className="gray-c p-four-lines poll-content-box"
                style={{ "--p-color": "var(--gray)" }}
              >
                <MinimalNoteView note={type?.label_2} />
              </p>
              {/* <p className="gray-c p-four-lines">{type?.label_2}</p> */}
            </div>
          </div>
        </div>
      </div>
    );
};

const ActivateNotification = () => {
  const { t } = useTranslation();
  return (
    <div
      className="fit-container fx-centered box-pad-v fx-col"
      style={{ height: "30vh" }}
    >
      <h4>{t("AzhKxMs")}</h4>
      <p className="gray-c p-centered" style={{ maxWidth: "400px" }}>
        {t("Aioqvbi")}
      </p>
      <Link to={"/settings"} state={{ tab: "customization" }}>
        <button className="btn btn-normal btn-small">{t("ABtsLBp")}</button>
      </Link>
    </div>
  );
};

const MinimalNoteView = ({ note }) => {
  const [noteTree, setNoteTree] = useState(false);

  useEffect(() => {
    const parseNote = async () => {
      try {
        let pNote = await getNoteTree(note, true, true, 50);

        setNoteTree(pNote);
      } catch (err) {
        console.log(err);
      }
    };
    if (note) parseNote();
  }, [note]);
  return <>{noteTree || compactContent(note)}</>;
};
