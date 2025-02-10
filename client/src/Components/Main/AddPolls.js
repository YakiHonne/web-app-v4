import React, { useEffect, useRef, useState } from "react";
import AddZapPoll from "./AddZapPoll";
import BrowseZapPolls from "./BrowseZapPolls";
import BrowseMaciPolls from "./BrowseMaciPolls";
import { useTranslation } from "react-i18next";
import AddMaciPolls from "./AddMaciPolls";

export default function AddPolls({ setPollAddr }) {
  const { t } = useTranslation();
  const [options, setOptions] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showNavigatePolls, setShowNavigatePolls] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleOffClick = (e) => {
      e.stopPropagation();
      if (optionsRef.current && !optionsRef.current.contains(e.target))
        setOptions(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [optionsRef]);

  return (
    <>
      {showCreatePoll && (
        <CreatePoll
          exit={() => setShowCreatePoll(false)}
          setPollAddr={setPollAddr}
        />
      )}
      {showNavigatePolls && (
        <NavigatePolls
          exit={() => setShowNavigatePolls(false)}
          setPollAddr={setPollAddr}
        />
      )}
      <div style={{ position: "relative" }} ref={optionsRef}>
        {options && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 10px)",
              left: "0",
              backgroundColor: "var(--dim-gray)",
              border: "none",
              minWidth: "150px",
              width: "max-content",
              zIndex: 1000,
              rowGap: "10px",
            }}
            className="box-pad-h-m box-pad-v-s sc-s-18 fx-centered fx-col fx-start-v pointer drop-down"
          >
            <p
              onClick={() => setShowCreatePoll(true)}
              className="fit-container"
            >
              {t("A4gfpc6")}
            </p>
            <p
              onClick={() => setShowNavigatePolls(true)}
              className="fit-container"
            >
              {t("ADNeql1")}
            </p>
          </div>
        )}
        <div
          className="polls"
          onClick={(e) => {
            e.stopPropagation();
            setOptions(!options);
          }}
        ></div>
      </div>
    </>
  );
}

const CreatePoll = ({ exit, setPollAddr }) => {
  const [selectedPollType, setSelectedPollType] = useState(
    !window.keplr ? 1 : false
  );
  return (
    <div className="fixed-container box-pad-h fx-centered">
      <div
        style={{ width: "min(100%, 500px)", position: "relative" }}
        className=""
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        {!selectedPollType && (
          <PollTypes setSelectedPollType={setSelectedPollType} />
        )}
        {selectedPollType === 1 && (
          <AddZapPoll
            exit={exit}
            setNevent={(data) => {
              setPollAddr(data);
              exit();
            }}
          />
        )}
        {selectedPollType === 2 && (
          <AddMaciPolls
            // exit={exit}
            setPollAddr={(data) => {
              setPollAddr(`https://vota.dorafactory.org/round/${data}`);
              exit();
            }}
          />
        )}
      </div>
    </div>
  );
};
const NavigatePolls = ({ exit, setPollAddr }) => {
  const [selectedPollType, setSelectedPollType] = useState(
    !window.keplr ? 1 : false
  );
  return (
    <div className="fixed-container box-pad-h fx-centered">
      <div
        style={{ width: "min(100%, 500px)", position: "relative" }}
        className=""
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        {!selectedPollType && (
          <PollTypes setSelectedPollType={setSelectedPollType} />
        )}
        {selectedPollType === 1 && (
          <BrowseZapPolls
            exit={exit}
            setNevent={(data) => {
              setPollAddr(data);
              exit();
            }}
          />
        )}
        {selectedPollType === 2 && (
          <BrowseMaciPolls
            exit={exit}
            setPollAddr={(data) => {
              setPollAddr(data);
              exit();
            }}
          />
        )}
      </div>
    </div>
  );
};

const PollTypes = ({ setSelectedPollType }) => {
  const { t } = useTranslation();
  return (
    <div
      style={{ width: "min(100%, 500px)" }}
      className="box-pad-h box-pad-v sc-s-18 bg-sp fx-centered fx-col"
    >
      <div className="fx-centered fit-container box-marg-s">
        <h4>{t("APjAPzs")}</h4>
      </div>
      <div className="fx-centered fit-container fx-stretch">
        <div
          className="fx option fx-centered fx-col  box-pad-v pointer"
          style={{
            borderRadius: "var(--border-r-18)",
            border: "1px solid var(--pale-gray)",
          }}
          onClick={() => setSelectedPollType(1)}
        >
          <div className="bolt-24"></div>
          <p>{t("AhAwwFJ")}</p>
        </div>
        <div
          className="fx option fx-centered fx-col  box-pad-v pointer"
          style={{
            borderRadius: "var(--border-r-18)",
            border: "1px solid var(--pale-gray)",
          }}
          onClick={() => setSelectedPollType(2)}
        >
          <div className="bolt-24"></div>
          <p>{t("AfVdphT")}</p>
          <div className="sticker sticker-small sticker-gray-black">
            {t("A7YVOVL")}
          </div>
        </div>
      </div>
    </div>
  );
};
