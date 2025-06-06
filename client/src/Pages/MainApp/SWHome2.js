import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import Sidebar from "../../Components/Main/Sidebar";
import SWActionPreview from "../../Components/Main/SWActionPreview";
import { useTranslation } from "react-i18next";
import { getSubData } from "../../Helpers/Controlers";
import { saveUsers } from "../../Helpers/DB";
import { getParsedSW } from "../../Helpers/Encryptions";
import LoadingDots from "../../Components/LoadingDots";
import { useSelector } from "react-redux";
import LaunchSW from "./LaunchSW";
import axiosInstance from "../../Helpers/HTTP_Client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import "highlight.js/styles/github-dark.css";
import { copyText } from "../../Helpers/Helpers";
import { nanoid } from "nanoid";
import axios from "axios";
import { Link } from "react-router-dom";
import { t } from "i18next";
import PagePlaceholder from "../../Components/PagePlaceholder";

const getSavedConversation = (pubkey) => {
  let aiConversation = localStorage.getItem("aiConversation");
  aiConversation = JSON.parse(aiConversation) || {};
  let conversation = aiConversation[pubkey];
  if (!conversation) return [];
  return conversation;
};

const saveConversation = (pubkey, data) => {
  const aiConversation = localStorage.getItem("aiConversation");
  let conversation = JSON.parse(aiConversation) || {};
  conversation[pubkey] = data;
  localStorage.setItem("aiConversation", JSON.stringify(conversation));
};

export default function SWhome2() {
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
      <div className="fit-container fx-centered">
        <div className="main-container">
          <Sidebar />
          <Main />
        </div>
      </div>
    </div>
  );
}

const Main = () => {
  const [searchType, setSearchType] = useState(1);
  const [status, setStatus] = useState(true);
  const [showTips, setShowtips] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const handleSearch = (e, searchKeywordInput) => {
    if (e) e.preventDefault();
    if (searchKeywordInput.trim()) {
      setSearchKeyword(searchKeywordInput.trim());
    }
  };

  useEffect(() => {
    if (showTips && searchKeyword) setShowtips(!showTips);
    if (!showTips && !searchKeyword) setShowtips(!showTips);
  }, [searchKeyword]);

  return (
    <main className="main-page-nostr-container">
      <div
        className="fx-centered fit-container fx-start-h fx-col box-pad-v"
        style={{ gap: 0, minHeight: "100vh" }}
      >
        {searchType === 1 && (
          <div
            style={{
              width: "min(100%, 600px)",
            }}
            className="fx-centered fx-col fx-start-v box-pad-h-m"
          >
            {/* <ChatWindow
              message={searchKeyword}
              setMessage={setSearchKeyword}
              setStatus={setStatus}
            /> */}
            <PagePlaceholder page="ai" />
          </div>
        )}
        {searchType === 0 && (
          <div className="box-pad-v fx-centered">
            <div
              className="smart-widget-24"
              style={{
                minWidth: "44px",
                minHeight: "44px",
                animation: "1.5s infinite rotate",
              }}
            ></div>
            <h3>{t("A2mdxcf")}</h3>
          </div>
        )}
        <InputField
          handleSearch={handleSearch}
          searchType={searchType}
          setSearchType={setSearchType}
          setSearchKeyword={setSearchKeyword}
          status={status}
        />
        {searchType === 0 && (
          <>
            <div
              style={{
                width: "min(100%, 600px)",
              }}
              className="fx-centered fx-col fx-start-v box-pad-h-m box-pad-v"
            >
              <div
                className={`fit-container fx-scattered `}
                style={{ transition: ".2s ease-in-out" }}
                onClick={() => setShowtips(!showTips)}
              >
                <p className="p-big">{t("A9Mca7S")}</p>
                <div
                  className="plus-sign"
                  style={{
                    rotate: showTips ? "45deg" : "0deg",
                    minWidth: "14px",
                    minHeight: "14px",
                  }}
                ></div>
              </div>
              {showTips && (
                <>
                  <div className="fx fx-centered fx-stretch">
                    <div className="fx box-pad-h-m box-pad-v-m sc-s-18 bg-sp">
                      <p className="gray-c">
                        <span className="c1-c">{t("AYZh36g")} </span>
                        {t("AiCvw1P")}
                      </p>
                    </div>
                    <div className="fx box-pad-h-m box-pad-v-m sc-s-18 bg-sp fx-centered fx-col fx-start-h">
                      <p className="gray-c">
                        <span className="c1-c">{t("A6U9fNT")} </span>
                        {t("AmK7zqi")}
                      </p>
                    </div>
                  </div>
                  <div className="fit-container fx-centered fx-stretch">
                    <div className="fx-centered fx-start-h fx-start-v box-pad-h-m box-pad-v-m sc-s-18 bg-sp fx">
                      {/* <div className="round-icon">
                    <div className="posts-24"></div>
                  </div> */}
                      <div className="fx-centered fx-col fx-start-h fx-start-v">
                        <p className="p-big p-bold">{t("Axeyl28")}</p>
                        <p className="gray-c">{t("ASfQxuq")}</p>
                        <Link to={"/sw-playground"} className="fit-container">
                          <button className=" fx-centered btn-normal btn option pointer btn-full">
                            {t("Axeyl28")}
                          </button>
                        </Link>
                      </div>
                    </div>
                    <div className="fx-centered fx-start-h fx-start-v box-pad-h-m box-pad-v-m sc-s-18  bg-sp fx">
                      {/* <div className="round-icon">
                    <div className="posts-24"></div>
                  </div> */}
                      <div className="fx-centered fx-col fx-start-h fx-start-v">
                        <p className="p-big p-bold">{t("ADuxxCf")}</p>
                        <p className="gray-c">{t("Afi8Kwg")}</p>
                        <div className="fit-container fx-centered ">
                          <Link
                            to={
                              "https://github.com/search?q=topic%3Asmart-widget+org%3AYakiHonne&type=Repositories"
                            }
                            target="_blank"
                          >
                            <div className="box-pad-h-m box-pad-v-s sc-s fx-centered bg-sp option pointer fx">
                              <div className="github-logo"></div>
                              {t("AvcFvUD")}
                            </div>
                          </Link>
                          <Link to={"/docs/sw/intro"}>
                            <div className="box-pad-h-m box-pad-v-s sc-s fx-centered bg-sp option pointer">
                              <div className="posts"></div>
                              {t("As9snfY")}
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div style={{ height: "7px" }}></div>
              <hr />
              <hr />
            </div>
            <div
              style={{
                width: "min(100%, 600px)",
              }}
              className="fx-centered fx-col fx-start-v box-pad-h-m"
            >
              {searchKeyword && (
                <div className="fit-container fx-scattered">
                  <h4>
                    <span className="gray-c">{t("AWJ9AGo")}</span>{" "}
                    {searchKeyword}
                  </h4>
                  <div
                    className="close"
                    style={{ position: "static" }}
                    onClick={() => setSearchKeyword("")}
                  >
                    <div></div>
                  </div>
                </div>
              )}
              <SWSet external={searchKeyword} />
            </div>
          </>
        )}
      </div>
    </main>
  );
};

const SWSet = ({ external }) => {
  const { t } = useTranslation();
  const userSavedTools = useSelector((state) => state.userSavedTools);
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSW, setSelectedSW] = useState("");
  const [lastEventTimestamp, setLastEventTimestamp] = useState(undefined);
  const [isEnded, setEnded] = useState(false);
  const [savedTools, setSavedTools] = useState([]);
  const [searchedTools, setSearchedTools] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (userSavedTools.length === 0 && savedTools.length > 0) {
        setSavedTools([]);
        return;
      }
      let swIDs = userSavedTools.map((_) => _.split(":")[2]);
      if (swIDs.length === 0) return;
      const data = await getSubData([{ kinds: [30033], "#d": swIDs }]);
      setSavedTools(data.data.map((_) => getParsedSW(_)));
      saveUsers(data.pubkeys);
    };
    const fetchDataDVM = async () => {
      try {
        setIsLoading(true);
        if (searchedTools.length > 0) setSearchedTools([]);
        let data = await axiosInstance.post("/api/v1/dvm-query", {
          message: external,
        });
        setSearchedTools(data.data.map((_) => getParsedSW(_)));
        saveUsers(external.map((_) => _.pubkey));
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };
    if (!external) fetchData();
    if (external) fetchDataDVM();
  }, [userSavedTools, external]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoading) setIsLoading(true);
      const data = await getSubData([
        { kinds: [30033], limit: 10, until: lastEventTimestamp },
      ]);
      setActions((prev) => [...prev, ...data.data.map((_) => getParsedSW(_))]);
      saveUsers(data.pubkeys);
      setIsLoading(false);
      if (data.data.length === 0) setEnded(true);
    };

    fetchData();
  }, [lastEventTimestamp]);

  const handleLastEventTS = () => {
    setLastEventTimestamp(actions[actions.length - 1].created_at - 1);
  };

  const handleCbButton = (data) => {
    if (data.type === "basic") setSelectedSW(data);
  };

  return (
    <>
      {selectedSW && (
        <LaunchSW metadata={selectedSW} exit={() => setSelectedSW("")} />
      )}
      <div className="fit-container">
        {((!external && actions.length > 0) ||
          (external && searchedTools.length > 0)) && (
          <p className="gray-c box-pad-v-s">{t("AQ3VGVk")}</p>
        )}
        <div className="fit-container fx-start-h fx-wrap fx-centered">
          {!external &&
            actions.map((sw) => {
              return (
                <div className="ifs-small" key={sw.id}>
                  <SWActionPreview
                    metadata={sw}
                    setSelectSW={(data) => setSelectedSW(data)}
                    cbButton={handleCbButton}
                  />
                </div>
              );
            })}
          {external &&
            searchedTools.map((sw) => {
              return (
                <div className="ifs-small" key={sw.id}>
                  <SWActionPreview
                    metadata={sw}
                    setSelectSW={(data) => setSelectedSW(data)}
                    cbButton={handleCbButton}
                  />
                </div>
              );
            })}
          {!isLoading && !isEnded && !external && (
            <div
              className="fit-container fx-centered box-pad-v-m pointer btn-text-gray"
              onClick={handleLastEventTS}
            >
              <p>{t("AnWFKlu")}</p>
              <div className="arrow"></div>
            </div>
          )}
          {isEnded && (
            <div className="fit-container box-pad-v-m fx-centered">
              <p className="gray-c">{t("AUrhqmn")}</p>
            </div>
          )}
          {isLoading && (
            <div
              style={{ height: "150px" }}
              className="fit-container fx-centered"
            >
              <LoadingDots />
            </div>
          )}
        </div>
        {((!external && actions.length === 0) ||
          (external && searchedTools.length === 0)) &&
          !isLoading && (
            <div
              className="fit-container fx-centered fx-col"
              style={{ height: "150px" }}
            >
              <div
                className="yaki-logomark"
                style={{ minWidth: "48px", minHeight: "48px", opacity: 0.5 }}
              ></div>
              <p className="gray-c">{t("ANA9vN0")}</p>
            </div>
          )}
      </div>
    </>
  );
};

const ChatWindow = ({ message, setMessage, setStatus }) => {
  const userKeys = useSelector((state) => state.userKeys);
  const [messages, setMessages] = useState(getSavedConversation(userKeys.pub));
  const [loading, setLoading] = useState(false);
  const [stopSnapping, setStopSnapping] = useState(false);
  const containerRef = useRef(null);
  useEffect(() => {
    if (message) handleSend(message);
  }, [message]);

  useEffect(() => {
    if (containerRef.current && !stopSnapping) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const atBottom =
        Math.abs(
          container.scrollHeight - container.scrollTop - container.clientHeight
        ) <= 7;

      if (!atBottom) {
        setStopSnapping(true);
      } else {
        setStopSnapping(false);
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef]);

  const handleSend = async (input) => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: input, created_at: Date.now() },
    ];
    setMessages(newMessages);
    setMessage("");
    setLoading(true);
    setStatus(false);
    try {
      const res = await axios.post("https://yakiai.yakihonne.com/api/v1/ai", {
        input,
      });

      const data = res.data.message.content;
      saveConversation(userKeys.pub, [
        ...newMessages,
        { role: "assistant", content: data, created_at: Date.now() },
      ]);
      if (stopSnapping) setStopSnapping(false);
      setLoading(false);
      animateTyping(data, newMessages);
    } catch (err) {
      console.log(err);
      setStatus(true);
      setLoading(false);
    }
  };

  const animateTyping = (text, history) => {
    const words = text.split(" ");
    let index = 0;
    let current = "";

    const typing = () => {
      if (index < words.length) {
        current += (index === 0 ? "" : " ") + words[index++];
        setMessages([
          ...history,
          { role: "assistant", content: current, created_at: Date.now() },
        ]);
        setTimeout(typing, 30);
      } else {
        setLoading(false);
        setStatus(true);
      }
    };

    typing();
  };

  const handleCopyelement = (id) => {
    const codeRef = document.getElementById(id);
    if (!codeRef) return;
    const codeText = codeRef.innerText;
    copyText(codeText, t("AwszVHZ"));
  };

  return (
    <div className="chat-container">
      <div className="messages" ref={containerRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`message-${msg.role}`}>
            <ReactMarkdown
              children={msg.content}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeRef = nanoid();
                  return !inline ? (
                    <pre style={{ padding: "1rem 0" }}>
                      <div
                        className="sc-s-18 box-pad-v-s box-pad-h-m fit-container fx-scattered"
                        style={{
                          borderBottomRightRadius: 0,
                          borderBottomLeftRadius: 0,
                          position: "relative",
                          top: "0px",
                          position: "sticky",
                          border: "none",
                        }}
                      >
                        <p className="gray-c p-italic">
                          {match?.length > 0 ? match[1] : ""}
                        </p>
                        <div
                          className="copy pointer"
                          onClick={() => {
                            handleCopyelement(codeRef);
                          }}
                        ></div>
                      </div>
                      <code
                        className={`hljs ${className}`}
                        {...props}
                        id={codeRef}
                      >
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code
                      className="inline-code"
                      {...props}
                      style={{ margin: "1rem 0" }}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            />
          </div>
        ))}
        {loading && (
          <div
            className="sc-s box-pad-h-m box-pad-v-m"
            style={{ width: "60px", border: "none" }}
          >
            <LoadingDots />
          </div>
        )}
      </div>
    </div>
  );
};

function InputField({
  status = true,
  handleSearch,
  searchType,
  setSearchType,
  setSearchKeyword,
}) {
  const [searchKeywordInput, setSearchKeywordInput] = useState("");
  const inputFieldRef = useRef(null);

  useEffect(() => {
    if (inputFieldRef.current) {
      inputFieldRef.current.style.height = "20px";
      inputFieldRef.current.style.height = `${inputFieldRef.current.scrollHeight}px`;
      inputFieldRef.current.scrollTop = inputFieldRef.current.scrollHeight;
      inputFieldRef.current.focus();
      const chatContainer = document.querySelector(".chat-container");
      if (chatContainer) {
        if (inputFieldRef.current.scrollHeight > 50)
          chatContainer.style.height = `calc(80vh - ${Math.min(
            inputFieldRef.current.scrollHeight - 50,
            200
          )}px)`;
        else chatContainer.style.height = "80vh";
      }
    }
  }, [searchKeywordInput]);

  useEffect(() => {
    if (status && inputFieldRef.current) inputFieldRef.current.focus();
  }, [status]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!e.shiftKey) {
        e.preventDefault();
        setSearchKeywordInput("");
        handleSearch(e, searchKeywordInput);
      }
    }
  };

  const handleTyping = (e) => {
    let value = e.target.value;
    setSearchKeywordInput(value);
  };

  return (
    <div
      className="sc-s box-pad-h-s box-pad-v-s fx-centered fx-col sw-search-box"
      style={{
        width: "min(100%, 600px)",
        cursor: status ? "unset" : "not-allowed",
        overflow: "visible",
      }}
      onClick={() => inputFieldRef?.current?.focus()}
    >
      <form
        onSubmit={(e) => {
          if (status && searchType !== 1) {
            setSearchKeywordInput("");
            handleSearch(e, searchKeywordInput);
          }
        }}
        style={{ position: "relative" }}
        className="fit-container"
      >
        <textarea
          type="text"
          className={`if ifs-full if-no-border ${
            status && searchType !== 1 ? "" : "if-disabled"
          }`}
          value={searchKeywordInput}
          onChange={handleTyping}
          placeholder={searchType === 0 ? t("A3IdSmf") : t("AmClLqP")}
          ref={inputFieldRef}
          onKeyDown={handleKeyDown}
          disabled={!(status && searchType !== 1)}
          style={{
            padding: "1rem 0rem 1rem 1rem",
            height: "20px",
            maxHeight: "250px",
            borderRadius: 0,
          }}
        />
      </form>
      <div className="fit-container fx-scattered box-pad-h-m box-pad-v-m">
          <div className="fx-centered">
                <Link
                  className={`sc-s box-pad-h-m box-pad-v-s ${
                    status ? "option pointer" : "if-disabled"
                  } fx-centered`}
                  style={{
                    backgroundColor: !searchType ? "var(--pale-gray)" : "",
                  }}
                  // onClick={() => {
                  //   if (status) {
                  //     setSearchType(0);
                  //     setSearchKeyword("");
                  //     setSearchKeywordInput("");
                  //   }
                  // }}
                  to={"/smart-widgets"}
                >
                  <div className="search"></div>
                  {t("AYZh36g")}
                </Link>
                <Link
                  className={`sc-s box-pad-h-m box-pad-v-s ${
                    status ? "option pointer" : "if-disabled"
                  } fx-centered`}
                  style={{
                    backgroundColor: searchType ? "var(--pale-gray)" : "",
                  }}
                  // onClick={() => {
                  //   if (status) {
                  //     setSearchType(1);
                  //     setSearchKeyword("");
                  //     setSearchKeywordInput("");
                  //   }
                  // }}
                  to={"/sw-ai"}
                >
                  <div className="ringbell"></div>
                  {t("A6U9fNT")}
                </Link>
              </div>
        {status && (
          <div
            className="round-icon slide-up"
            style={{ minWidth: "40px", minHeight: "40px", backgroundColor: "var(--c1)" }}
            onClick={() => {
              if (status) {
                setSearchKeywordInput("");
                handleSearch(undefined, searchKeywordInput);
              }
            }}
          >
            <div className="send"></div>
          </div>
        )}
      </div>
    </div>
  );
}
