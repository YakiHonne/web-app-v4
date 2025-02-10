import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { convertDate, downloadAsFile } from "../../Helpers/Encryptions";
import { MaciClient } from "@dorafactory/maci-sdk";
import { useDispatch } from "react-redux";
import { setToast } from "../../Store/Slides/Publishers";

export default function MACIPollsComp({ poll, header = true }) {
  const [selectedVoteType, setSelectedVoteType] = useState("v");
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();

  const status = {
    tallying: (
      <div
        className="sticker sticker-normal sticker-c1"
        style={{ minWidth: "max-content" }}
      >
        {t("Aw1EitS")}
      </div>
    ),
    created: (
      <div
        className="sticker sticker-normal sticker-gray-black"
        style={{ minWidth: "max-content" }}
      >
        {t("ACPvBzE")}
      </div>
    ),
    ended: (
      <div
        className="sticker sticker-normal sticker-gray-black"
        style={{ minWidth: "max-content" }}
      >
        {t("Azctwg8")}
      </div>
    ),
    closed: (
      <div
        className="sticker sticker-normal sticker-gray-black"
        style={{ minWidth: "max-content" }}
      >
        {t("AVhtVJY")}
      </div>
    ),
    ongoing: (
      <div
        className="sticker sticker-normal sticker-green"
        style={{ minWidth: "max-content" }}
      >
        {t("A7noclE")}
      </div>
    ),
  };

  return (
    <>
      {showDetails && (
        <PollDetails poll={poll} exit={() => setShowDetails(false)} />
      )}
      <div className="fit-container fx-centered fx-col">
        {header && (
          <div className="fit-container fx-scattered fx-start-v">
            <h4>{poll.roundTitle}</h4>
            {status[poll.status.toLowerCase()]}
          </div>
        )}

        <div className="fit-container fx-scattered">
          <p className="gray-c">{poll.roundDescription}</p>
        </div>
        <div className="fit-container fx-scattered">
          {poll.votingEnd > new Date().getTime() && (
            <p className="green-c">
              {t("ASGLzji", {
                date: convertDate(new Date(poll.votingEnd)),
              })}
            </p>
          )}
          {poll.votingEnd < new Date().getTime() && (
            <p className="red-c p-italic">
              {t("AfPxJDW", {
                date: convertDate(new Date(poll.votingEnd)),
              })}
            </p>
          )}
          <p
            className="btn-text-gray pointer"
            onClick={() => setShowDetails(true)}
          >
            {t("A4aojw2")}
          </p>
        </div>
        {poll.resultsList.length > 0 && (
          <div
            className="fit-container fx-scattered"
            style={{ position: "relative", zIndex: 10 }}
          >
            <div>
              <h5 className="gray-c">{t("AbB8Gf6")}</h5>
              {selectedVoteType === "v" && (
                <p className="slide-up">{t("AWXfzUx")}</p>
              )}
              {selectedVoteType === "v2" && (
                <p className="slide-up">{t("A0BxU3E")}</p>
              )}
            </div>
            <div
              className="round-icon-small round-icon-tooltip"
              onClick={() =>
                setSelectedVoteType(selectedVoteType === "v" ? "v2" : "v")
              }
              data-tooltip={
                selectedVoteType === "v" ? t("AQa0Y6U") : t("Ao8BzSD")
              }
            >
              <div
                className="switch-arrows"
                style={{
                  rotate: selectedVoteType === "v2" ? "360deg" : "0deg",
                }}
              ></div>
            </div>
          </div>
        )}
        <div className="fx-col fx-centered fit-container">
          {poll.voteOptionMap.map((option, index) => {
            return (
              <div
                key={index}
                style={{ position: "relative" }}
                className={`box-pad-h-m box-pad-v-s sc-s-18 fit-container ${
                  poll.votingEnd < new Date().getTime() ? "option pointer" : ""
                }`}
              >
                {poll.resultsList.length > 0 && (
                  <div
                    className="sc-s-18"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "100%",
                      width: `${poll.resultsList[index][selectedVoteType]}%`,
                      border: "none",
                      backgroundColor: "var(--orange-main)",
                      transition: ".2s ease-in-out",
                      zIndex: 0,
                    }}
                  ></div>
                )}
                <div
                  className="fit-container fx-scattered"
                  style={{ position: "relative", zIndex: 2 }}
                >
                  <p>{option || "[OPTION]"}</p>
                  {poll.resultsList.length > 0 && (
                    <>
                      {selectedVoteType === "v" && (
                        <p className="p-medium slide-up">
                          {poll.resultsList[index][selectedVoteType]}%
                        </p>
                      )}
                      {selectedVoteType === "v2" && (
                        <p className="p-medium slide-up">
                          {poll.resultsList[index][selectedVoteType]}%
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const PollDetails = ({ poll, exit }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const status = {
    tallying: (
      <div
        className="sticker sticker-normal sticker-c1"
        style={{ minWidth: "max-content" }}
      >
        {t("Aw1EitS")}
      </div>
    ),
    created: (
      <div
        className="sticker sticker-normal sticker-gray-black"
        style={{ minWidth: "max-content" }}
      >
        {t("ACPvBzE")}
      </div>
    ),
    ended: (
      <div
        className="sticker sticker-normal sticker-gray-black"
        style={{ minWidth: "max-content" }}
      >
        {t("Azctwg8")}
      </div>
    ),
    closed: (
      <div
        className="sticker sticker-normal sticker-gray-black"
        style={{ minWidth: "max-content" }}
      >
        {t("AVhtVJY")}
      </div>
    ),
    ongoing: (
      <div
        className="sticker sticker-normal sticker-green"
        style={{ minWidth: "max-content" }}
      >
        {t("A7noclE")}
      </div>
    ),
  };

  const downloadProofs = async () => {
    try {
      const client = new MaciClient({
        network: process.env.REACT_APP_NETWORK,
      });
      let proof = await client.getProofByContractAddress(poll.id);
      if (proof.code === 200)
        downloadAsFile(
          proof.data.proofData.nodes,
          undefined,
          `proofs-${poll.id}.json`
        );
      else
        dispatch(
          setToast({
            type: 2,
            desc: t("Ap6NMQn"),
          })
        );
    } catch (err) {
      console.log(err);
      dispatch(
        setToast({
          type: 2,
          desc: t("Ap6NMQn"),
        })
      );
    }
  };

  // const downloadAsJsonFile = (jsonObject) => {
  //   const jsonString = JSON.stringify(jsonObject, null, 2);

  //   const blob = new Blob([jsonString], { type: "application/json" });

  //   const link = document.createElement("a");

  //   link.href = URL.createObjectURL(blob);

  //   link.download = `proofs-${poll.id}.json`;

  //   document.body.appendChild(link);

  //   link.click();

  //   document.body.removeChild(link);
  // };

  return (
    <div className="fixed-container fx-centered box-pad-h">
      <div
        className="fx-centered fx-col fx-start-v fx-start-h sc-s-18 bg-sp"
        style={{
          overflow: "scroll",
          scrollBehavior: "smooth",
          height: "100vh",
          width: "min(100%, 600px)",
          position: "relative",
          borderRadius: 0,
          gap: 0,
        }}
      >
        <div
          className="fit-container fx-centered sticky"
          style={{ borderBottom: "1px solid var(--very-dim-gray)" }}
        >
          <div className="fx-scattered fit-container box-pad-h-m">
            <h4>{poll.roundTitle}</h4>
            <div
              className="close"
              style={{ position: "static" }}
              onClick={exit}
            >
              <div></div>
            </div>
          </div>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("AIGU9F2")}
          </p>
          <p>{poll.roundTitle || "N/A"}</p>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("AM6TPts")}
          </p>
          <p>{poll.roundDescription || "N/A"}</p>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("AmikACu")}
          </p>
          {status[poll.status.toLowerCase()]}
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("Ab3i56m")}
          </p>
          {poll.roundLink ? (
            <div className="fx-centered">
              <a className="c1-c pointer" href={poll.roundLink} target="_blank">
                {poll.roundLink}
              </a>
              <div className="link"></div>
            </div>
          ) : (
            <p>N/A</p>
          )}
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("ApdDVfN")}
          </p>
          <p className="c1-c">{poll.circuitName}</p>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("Al483US")}
          </p>
          <p>{t("Ano2XKx")}</p>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("A5xdPz9")}
          </p>
          <p>{poll.certificationSystem}</p>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            Zkey
          </p>
          <div className="fx-centered">
            <a
              className="c1-c pointer"
              href={`https://github.com/DoraFactory/Vota-Circuits/tree/main/zkeys/maci/${
                poll.certificationSystem
              }/${poll.circuitName.replace("MACI-", "")}/power-${
                poll.circuitPower
              }`}
              target="_blank"
            >{`maci/${poll.certificationSystem}/${poll.circuitName.replace(
              "MACI-",
              ""
            )}/power-${poll.circuitPower}`}</a>
            <div className="link"></div>
          </div>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("A6rbQWS")}
          </p>
          <p>
            <span className="p-bold">{poll.totalBond} DORA </span>
            <span className="gray-c">(total fund)</span>
          </p>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("AdYv39Y")}
          </p>
          <p>{convertDate(new Date(poll.votingStart), true)}</p>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("Axqwx5J")}
          </p>
          <p>{convertDate(new Date(poll.votingEnd), true)}</p>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("AmirXom")}
          </p>
          <div className="fx-centered">
            <a
              className="c1-c pointer"
              href={`https://vota-explorer.dorafactory.org/doravota/account/${poll.caller}`}
              target="_blank"
            >
              {poll.caller}
            </a>
            <div className="link"></div>
          </div>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("AA7Srdf")}
          </p>
          <div className="fx-centered">
            <a
              className="c1-c pointer"
              href={`https://vota-explorer.dorafactory.org/doravota/account/${poll.admin}`}
              target="_blank"
            >
              {poll.admin}
            </a>
            <div className="link"></div>
          </div>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("ABbZ7cz")}
          </p>
          <div className="fx-centered">
            <a
              className="c1-c pointer"
              href={`https://vota-explorer.dorafactory.org/doravota/account/${poll.contractAddress}`}
              target="_blank"
            >
              {poll.contractAddress}
            </a>
            <div className="link"></div>
          </div>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("AJALXr6")}
          </p>
          <p>
            {t("AguX9lA", {
              count: poll.blockHeight
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
            })}
          </p>
        </div>
        <hr />
        <div
          className="fx-centered fx-start-h fx-start-v fit-container box-pad-v-m box-pad-h-m"
          style={{ columnGap: "32px", rowGap: "24px" }}
        >
          <p className="gray-c" style={{ minWidth: "8rem" }}>
            {t("AmjJB8d")}
          </p>
          <div className="fx-centered pointer" onClick={downloadProofs}>
            <p className="c1-c">{t("AF88iK1")}</p>
            <div className="download-file"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
