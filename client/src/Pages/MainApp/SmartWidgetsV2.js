import React, { useEffect, useRef, useState } from "react";
import { nip19 } from "nostr-tools";
import { Helmet } from "react-helmet";
import Sidebar from "../../Components/Main/Sidebar";
import { getNoteTree } from "../../Helpers/Helpers";
import ArrowUp from "../../Components/ArrowUp";
import {
  getEmptyuserMetadata,
  getParsedRepEvent,
  getParsedSW,
} from "../../Helpers/Encryptions";
import UserProfilePic from "../../Components/Main/UserProfilePic";
import LoadingDots from "../../Components/LoadingDots";
import { Link } from "react-router-dom";
import Footer from "../../Components/Footer";
import ToDeleteGeneral from "../../Components/Main/ToDeleteGeneral";
import { useSelector } from "react-redux";
import { getUser } from "../../Helpers/Controlers";
import { saveUsers } from "../../Helpers/DB";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { useTranslation } from "react-i18next";
import WidgetCardV2 from "../../Components/Main/WidgetCardV2";

export default function SmartWidgetsV2() {
  const userKeys = useSelector((state) => state.userKeys);
  const { t } = useTranslation();
  const [comWidgets, setComWidgets] = useState([]);
  const [myWidgets, setMyWidgets] = useState([]);
  const [notes, setNotes] = useState([]);
  const [contentSource, setContentSource] = useState("community");
  const [myWidgetsLE, setMyWidgetsLE] = useState(undefined);
  const [comWidgetsLE, setComWidgetsLE] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWidgetID, setSelectedWidgetID] = useState(false);
  const [sub, setSub] = useState(false);
  const extrasRef = useRef(null);

  useEffect(() => {
    const { filter } = getFilter();
    let events = [];
    setIsLoading(true);
    let subscription = ndkInstance.subscribe(filter, {
      closeOnEose: true,
      cacheUsage: "CACHE_FIRST",
    });

    subscription.on("event", (event) => {
      try {
        events.push(event.pubkey);
        setComWidgets((prev) => {
          let element = prev.find((widget) => widget.id === event.id);
          if (element) return prev;
          return [
            {
              ...event.rawEvent(),
              metadata: getParsedSW(event.rawEvent()),
              author: getEmptyuserMetadata(event.pubkey),
            },
            ...prev,
          ].sort((el_1, el_2) => el_2.created_at - el_1.created_at);
        });
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    });
    subscription.on("eose", () => {
      saveUsers([...new Set(events)]);
      setIsLoading(false);
    });

    setSub(subscription);
    return () => {
      subscription.stop();
    };
  }, [contentSource, myWidgetsLE, comWidgetsLE]);

  useEffect(() => {
    if (!userKeys) handleContentSource("community");
  }, [userKeys]);

  useEffect(() => {
    let events = [];
    let limit = 1;
    setIsLoading(true);
    let subscription = ndkInstance.subscribe(
      [{ kinds: [1], "#l": ["smart-widget"], limit: 6 }],
      { closeOnEose: true, cacheUsage: "CACHE_FIRST" }
    );

    subscription.on("event", async (event) => {
      try {
        if (limit >= 6) {
          subscription.stop();
          return;
        }
        limit += 1;
        let parsedContent = await getNoteTree(
          event.content,
          true,
          undefined,
          undefined,
          event.pubkey
        );
        events.push(event.pubkey);
        let nEvent = nip19.neventEncode({
          author: event.pubkey,
          id: event.id,
        });
        setNotes((prev) => {
          let element = prev.find((widget) => widget.id === event.id);
          if (element) return prev;
          return [
            {
              parsedContent,
              nEvent,
              ...event,
            },
            ...prev,
          ].sort((el_1, el_2) => el_2.created_at - el_1.created_at);
        });
      } catch (err) {
        console.log(err);
      }
    });
    subscription.on("close", () => {
      saveUsers([...new Set(events)]);
    });

    return () => {
      subscription.stop();
    };
  }, []);

  const getFilter = () => {
    return {
      filter: [{ kinds: [30033], until: comWidgetsLE, limit: 4 }],
    };
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isLoading) return;
      let container = document.querySelector(".main-page-nostr-container");

      if (!container) return;
      if (
        container.scrollHeight - container.scrollTop - 60 >
        document.documentElement.offsetHeight
      ) {
        return;
      }

      setComWidgetsLE(
        comWidgets[comWidgets.length - 1]?.created_at || undefined
      );
      setMyWidgetsLE(myWidgets[myWidgets.length - 1]?.created_at || undefined);
    };

    document
      .querySelector(".main-page-nostr-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".main-page-nostr-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

  const handleContentSource = (source) => {
    if (source === contentSource) return;
    if (sub) sub.stop();
    setContentSource(source);
  };

  const handleRefreshData = async () => {
    setMyWidgets((widgets) =>
      widgets.filter((widget) => widget.id !== selectedWidgetID.id)
    );
    setComWidgets((widgets) =>
      widgets.filter((widget) => widget.id !== selectedWidgetID.id)
    );
    setSelectedWidgetID(false);
  };

  return (
    <div>
      <Helmet>
        <title>Yakihonne | Smart widgets</title>
        <meta
          name="description"
          content={"Interact with the community smart widgets"}
        />
        <meta
          property="og:description"
          content={"Interact with the community smart widgets"}
        />

        <meta
          property="og:url"
          content={`https://yakihonne.com/smart-widget`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Smart widget" />
        <meta property="twitter:title" content="Yakihonne | Smart widget" />
        <meta
          property="twitter:description"
          content={"Interact with the community smart widgets"}
        />
      </Helmet>
      {selectedWidgetID && (
        <ToDeleteGeneral
          cancel={() => setSelectedWidgetID(false)}
          title={""}
          kind={t("AkvXmyz")}
          aTag={`${selectedWidgetID.kind}:${selectedWidgetID.pubkey}:${selectedWidgetID.d}`}
          eventId={selectedWidgetID.id}
          refresh={handleRefreshData}
        />
      )}
      <div className="fit-container fx-centered">
        <ArrowUp />
        <div className="main-container">
          <Sidebar />
          <main className="main-page-nostr-container">
            <div
              className="fx-centered fit-container fx-start-h fx-start-v"
              style={{ gap: 0 }}
            >
              <div
                className="box-pad-h-m fx-col fx-centered fx-start-h fx-start-v main-middle"
                style={{ gap: 0 }}
              >
                <div
                  className="fit-container sticky fx-centered fx-col"
                  style={{ rowGap: "16px" }}
                >
                  <div className="fit-container fx-scattered ">
                    <h4>{t("A2mdxcf")}</h4>
                    <Link to="/smart-widget-checker">
                      <div
                        className="round-icon-small round-icon-tooltip"
                        data-tooltip={t("Ax1rvqR")}
                      >
                        <div className="smart-widget-checker"></div>
                      </div>
                    </Link>
                  </div>
                </div>
                <div
                  className={`fit-container fx-col fx-centered fx-start-h fx-start-v`}
                >
                  {contentSource === "community" &&
                    comWidgets.map((widget) => {
                      return (
                        <WidgetCardV2
                          widget={widget}
                          key={widget.id}
                          deleteWidget={() =>
                            setSelectedWidgetID(widget.metadata)
                          }
                        />
                      );
                    })}
                  {contentSource === "self" &&
                    myWidgets.map((widget) => {
                      return (
                        <WidgetCardV2
                          widget={widget}
                          key={widget.id}
                          deleteWidget={() =>
                            setSelectedWidgetID(widget.metadata)
                          }
                        />
                      );
                    })}
                </div>
                {isLoading && (
                  <div
                    className="fit-container fx-centered"
                    style={{ height: "30vh" }}
                  >
                    <p className="gray-c">{t("AKvHyxG")}</p>
                    <LoadingDots />
                  </div>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  top:
                    extrasRef.current?.getBoundingClientRect().height >=
                    window.innerHeight
                      ? `calc(95vh - ${
                          extrasRef.current?.getBoundingClientRect().height || 0
                        }px)`
                      : 0,
                }}
                className={`fx-centered  fx-wrap fx-start- box-pad-v sticky extras-homepage`}
                ref={extrasRef}
              >
                <div className="sc-s-18 bg-sp fit-container box-pad-h-m box-pad-v-m fx-centered fx-col fx-start-v">
                  <div
                    className="smart-widget"
                    style={{ minHeight: "48px", minWidth: "48px" }}
                  >
                    {" "}
                  </div>
                  <h4>{t("AuIjxur")}</h4>
                  <p className="gray-c">{t("AoDLI81")}</p>
                  <Link target="_blank" to={"/yakihonne-smart-widgets"}>
                    <button className="btn btn-normal">{t("AArGqN7")}</button>
                  </Link>
                </div>
                {notes.length > 0 && (
                  <div
                    className="fit-container sc-s-18 bg-sp box-pad-h box-pad-v fx-centered fx-col fx-start-v box-marg-s"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      rowGap: "24px",
                    }}
                  >
                    <div className="fx-centered fx-start-h">
                      <h4>{t("AUz9szc")}</h4>
                    </div>
                    {notes.map((note) => {
                      return <NoteCard note={note} key={note.id} />;
                    })}
                  </div>
                )}
                <Footer />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

const NoteCard = ({ note }) => {
  const nostrAuthors = useSelector((state) => state.nostrAuthors);
  const [authorData, setAuthorData] = useState(
    getEmptyuserMetadata(note.pubkey)
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        let auth = getUser(note.pubkey);

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

  return (
    <div className="fit-container" key={note.id}>
      <div className="fit-container fx-scattered  box-marg-s">
        <AuthorPreview author={authorData} size={"small"} />
        <Link to={`/notes/${note.nEvent}`}>
          <div className="share-icon"></div>
        </Link>
      </div>
      <div className="fit-container" style={{ wordBreak: "break-word" }}>
        {note.parsedContent}
      </div>
    </div>
  );
};

const AuthorPreview = ({ author, size = "big" }) => {
  return (
    <div className="fx-centered fx-start-h ">
      <UserProfilePic
        size={size === "big" ? 40 : 30}
        mainAccountUser={false}
        user_id={author.pubkey}
        img={author.picture}
        metadata={author}
      />
      {size === "big" && (
        <div>
          <p className="p-bold">{author.display_name || author.name}</p>
          <p className="p-medium gray-c">
            @{author.name || author.display_name}
          </p>
        </div>
      )}
      {size !== "big" && (
        <div>
          <p className="p-bold p-medium">
            {author.display_name || author.name}
          </p>
          <p className="p-small gray-c">
            @{author.name || author.display_name}
          </p>
        </div>
      )}
    </div>
  );
};
