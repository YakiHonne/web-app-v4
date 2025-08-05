import React, { useState } from "react";
import AddMaciPolls from "../../Components/Main/AddMaciPolls";
import { setToast } from "../../Store/Slides/Publishers";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { shortenKey } from "../../Helpers/Encryptions";
import PagePlaceholder from "../../Components/PagePlaceholder";

export default function MACIPollStarter() {
  const { t } = useTranslation();
  const [pollAddr, setPollAddr] = useState("");
  const dispatch = useDispatch();

  const copyKey = (keyType, key) => {
    navigator.clipboard.writeText(key);
    dispatch(
      setToast({
        type: 1,
        desc: `${keyType} 👏`,
      })
    );
  };

  if (!window.matchMedia("(pointer: coarse)").matches)
    return <PagePlaceholder page={"404"} />;
  return (
    <div className="fit-container fx-centered">
      <div className="main-middle">
        <div className="fit-container fx-centered fx-col fx-start-h box-pad-h-s box-pad-v">
          {!pollAddr && <AddMaciPolls setPollAddr={setPollAddr} />}
          {pollAddr && (
            <>
              <div className="fit-container sc-s-18 bg-sp box-pad-h box-pad-v fx-centered fx-col slide-down">
                <div
                  className="checkmark-24"
                  style={{ minWidth: "48px", minHeight: "48px" }}
                ></div>
                <h4>{t("ALyZwxz")}</h4>
                <p className="gray-c p-centered box-pad-h">{t("AEEVrfF")}</p>
                <button
                  onClick={() => setPollAddr("")}
                  className="btn btn-normal"
                >
                  {t("Asujn3G")}
                </button>
              </div>
              <div
                className={
                  "fx-scattered if pointer fit-container dashed-onH slide-up box-pad-v-m"
                }
                style={{ borderStyle: "dashed", height: "auto" }}
                onClick={() =>
                  copyKey(
                    t("AfnTOQk"),
                    `https://vota${
                      import.meta.env.VITE_NETWORK === "testnet" ? "-test" : ""
                    }.dorafactory.org/round/${pollAddr}`
                  )
                }
              >
                <p>
                  {shortenKey(
                    `https://vota${
                      import.meta.env.VITE_NETWORK === "testnet" ? "-test" : ""
                    }.dorafactory.org/round/${pollAddr}`,
                    40
                  )}
                </p>
                <div className="copy-24"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
