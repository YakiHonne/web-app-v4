import React, { useEffect, useState } from "react";
import Sidebar from "../../Components/Main/Sidebar";
import { Helmet } from "react-helmet";
import PagePlaceholder from "../../Components/PagePlaceholder";
import LoadingDots from "../../Components/LoadingDots";
import { useLocation, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";
import WidgetCard from "../../Components/Main/WidgetCardV2";
import { useDispatch } from "react-redux";
import { setToast } from "../../Store/Slides/Publishers";
import { ndkInstance } from "../../Helpers/NDKInstance";
import { useTranslation } from "react-i18next";
import SWEventStructure from "../../Components/Main/SWEventStructure";
import SWCard from "../../Components/Main/SWCard";
import WidgetCardV2 from "../../Components/Main/WidgetCardV2";
import { getEmptyuserMetadata, getParsedSW } from "../../Helpers/Encryptions";
import { getAuthPubkeyFromNip05 } from "../../Helpers/Helpers";
import { customHistory } from "../../Helpers/History";

const getNaddrParam = (location) => {
  let naddr = new URLSearchParams(location.search).get("naddr");
  return naddr || "";
};

export default function SWV2() {
  const { id, nip05, identifier } = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [widget, setWidget] = useState(false);
  const [naddr, setNaddr] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mbHide, setMbHide] = useState(true);

  useEffect(() => {
    const checkURL = async () => {
      try {
        if (nip05 && identifier) {
          let temPubkey = await getAuthPubkeyFromNip05(nip05);
          setNaddr({ pubkey: temPubkey, identifier: identifier });
        }
        if (id) {
          let tempNaddrData = nip19.decode(id);
          setNaddr(tempNaddrData.data);
        }
      } catch (err) {
        customHistory.push("/");
      }
    };
    checkURL();
  }, [id, nip05, identifier]);

  useEffect(() => {
    if (naddr) {
      try {
        setIsLoading(true);
        let event_created_at = 0;
        const sub = ndkInstance.subscribe(
          [
            {
              kinds: [30033],
              authors: [naddr.pubkey],
              "#d": [naddr.identifier],
            },
          ],
          { cacheUsage: "CACHE_FIRST", groupable: false }
        );

        sub.on("event", async (event) => {
          try {
            if (event.created_at > event_created_at) {
              event_created_at = event.created_at;
              setWidget({
                ...event.rawEvent(),
                metadata: getParsedSW(event.rawEvent()),
                author: getEmptyuserMetadata(event.pubkey),
              });

              sub.stop();
              setIsLoading(false);
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
              <div className="box-pad-h-m box-pad-v-m fit-container">
                <div className="fit-container fx-centered fx-start-h fx-start-v">
                  <div
                    style={{ width: "min(100%,800px)", flex: 1.5 }}
                    className={` ${!mbHide ? "mb-hide-800" : ""}`}
                  >
                    {!widget && <PagePlaceholder page={"widgets"} />}
                    {widget && <WidgetCardV2 widget={widget} />}
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
                  ></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
