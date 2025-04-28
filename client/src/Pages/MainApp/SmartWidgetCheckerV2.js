import React, { useEffect, useState } from "react";
import Sidebar from "../../Components/Main/Sidebar";
import { Helmet } from "react-helmet";
import PagePlaceholder from "../../Components/PagePlaceholder";
import LoadingDots from "../../Components/LoadingDots";
import { useLocation } from "react-router-dom";
import { nip19 } from "nostr-tools";
import WidgetCard from "../../Components/Main/WidgetCardV2";
import { useDispatch } from "react-redux";
import { setToast } from "../../Store/Slides/Publishers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { useTranslation } from "react-i18next";
import SWEventStructure from "../../Components/Main/SWEventStructure";
import SWCard from "../../Components/Main/SWCard";

const getNaddrParam = (location) => {
  let naddr = new URLSearchParams(location.search).get("naddr");
  return naddr || "";
};

export default function SmartWidgetCheckerV2() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const naddrParam = getNaddrParam(location);
  const [widget, setWidget] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mbHide, setMbHide] = useState(true);
  const [naddr, setNaddr] = useState(naddrParam);

  useEffect(() => {
    if (naddr) {
      try {
        setIsLoading(true);
        let parsedNaddr = nip19.decode(naddr);

        const { data } = parsedNaddr;
        let event_created_at = 0;
        const sub = ndkInstance.subscribe(
          [
            {
              kinds: [30033],
              authors: [data.pubkey],
              "#d": [data.identifier],
            },
          ],
          { cacheUsage: "CACHE_FIRST", groupable: false }
        );

        sub.on("event", async (event) => {
          try {
            if (event.id) {
              if (event.created_at > event_created_at) {
                event_created_at = event.created_at;
                setWidget(event.rawEvent());

                sub.stop();
                setIsLoading(false);
              }
            }
          } catch (err) {
            console.log(err);
            setIsLoading(false);
          }
        });
        sub.on("eose", () => {
          setIsLoading(false);
        });
      } catch (err) {
        console.log(err);
        dispatch(
          setToast({
            type: 2,
            desc: t("As0d1J3"),
          })
        );
        setIsLoading(false);
      }
    }
  }, [naddr]);

  const clearPage = () => {
    setNaddr("");
    setWidget(false);
  };

  return (
    <div>
      <Helmet>
        <title>Yakihonne | Smart widget checker</title>
        <meta
          name="description"
          content={"Check the status of a smart widget"}
        />
        <meta
          property="og:description"
          content={"Check the status of a smart widget"}
        />
        <meta
          property="og:url"
          content={`https://yakihonne.com/smart-widget-checker`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Smart widget checker" />
        <meta
          property="twitter:title"
          content="Yakihonne | Smart widget checker"
        />
        <meta
          property="twitter:description"
          content={"Check the status of a smart widget"}
        />
      </Helmet>
      <div className="fit-container fx-centered">
        <div className="main-container">
          <Sidebar />
          <main className="main-page-nostr-container">
            {/* <PagePlaceholder page={"maintenance"}/> */}
            <div className="fx-centered fit-container fx-start-h fx-start-v">
              <div className="box-pad-h-m fit-container">
                <div className="fit-container fx-centered fx-start-h fx-start-v">
                  <div
                    style={{ width: "min(100%,800px)", flex: 1.5 }}
                    className={` ${!mbHide ? "mb-hide-800" : ""}`}
                  >
                    <div className="fit-container fx-scattered sticky">
                      <div
                        className={`fx-centered fx-start-h if ifs-full ${
                          widget ? "if-disabled" : ""
                        }`}
                        style={{
                          gap: 0,
                          pointerEvents: widget ? "none" : "auto",
                        }}
                      >
                        <div className="search"></div>
                        <input
                          type="text"
                          className="if if-no-border ifs-full"
                          placeholder={t("AzL2pM8")}
                          disabled={isLoading}
                          value={naddr}
                          onChange={(e) => setNaddr(e.target.value)}
                        />
                      </div>
                      <div className="fx-centered">
                        {widget && (
                          <div
                            className="round-icon round-icon-tooltip"
                            disabled={isLoading}
                            onClick={clearPage}
                            data-tooltip={t("AboMK2E")}
                          >
                            {isLoading ? (
                              <LoadingDots />
                            ) : (
                              <div className="trash"></div>
                            )}
                          </div>
                        )}
                        <div
                          className="round-icon desk-hide round-icon-tooltip"
                          data-tooltip={t("AZBr1AS")}
                          onClick={() => setMbHide(false)}
                        >
                          <div className="curation"></div>
                        </div>
                      </div>
                    </div>
                    {!widget && <PagePlaceholder page={"widgets"} />}
                    {widget && (
                      <SWCard
                        onNextWidget={(data) => setWidget(data)}
                        widget={widget}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      height: "100vh",
                      backgroundColor: "var(--pale-gray)",
                      width: "1px",
                      position: "sticky",
                      top: 0,
                      margin: "0 .5rem",
                    }}
                    className="mb-hide-800"
                  ></div>
                  <div
                    style={{
                      width: "min(100%,500px)",
                      flex: 1,
                      height: "100vh",
                      overflow: "scroll",
                    }}
                    className={`box-pad-h-m box-pad-v sticky ${
                      mbHide ? "mb-hide-800" : ""
                    }`}
                  >
                    {widget && (
                      <>
                        <div className="fx-centered fx-start-h fit-container box-marg-s">
                          <div
                            className="round-icon desk-hide round-icon-tooltip"
                            onClick={() => setMbHide(true)}
                            data-tooltip={t("ATB2h6T")}
                          >
                            <div className="arrow arrow-back"></div>
                          </div>
                          <h4>{t("AYmIvXo")}</h4>
                        </div>
                        <SWEventStructure widget={widget} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
