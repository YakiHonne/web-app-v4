import { useState } from "react";
import { useDispatch } from "react-redux";
import { setToast } from "../../Store/Slides/Publishers";
import UserProfilePicNOSTR from "../../Components/Main/UserProfilePicNOSTR";
import QRCode from "react-qr-code";
import { getBech32, shortenKey } from "../../Helpers/Encryptions";

export default function QRSharing({ user, exit }) {
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = useState("pk");
  const copyKey = (keyType, key) => {
    navigator.clipboard.writeText(key);
    dispatch(
      setToast({
        type: 1,
        desc: `${keyType} was copied! 👏`,
      })
    );
  };

  return (
    <div className="fixed-container box-pad-h fx-centered" onClick={exit}>
      <div
        className="sc-s box-pad-h box-pad-v"
        style={{
          width: "min(100%,400px)",
          position: "relative",
          // background:
          //   "linear-gradient(180deg, rgba(156,39,176,1) 0%, rgba(41,121,255,1) 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="close" onClick={exit}>
          <div></div>
        </div>
        <div className="fx-centered fx-col">
          <UserProfilePicNOSTR
            user_id={user?.pubkey}
            mainAccountUser={false}
            size={100}
            img={user?.picture}
          />
          <h4 className="p-centered">{user?.display_name || user?.name}</h4>
        </div>
        <div className="fx-centered box-pad-v-m">
          <div
              className={"btn sticker-gray-black p-caps fx-centered"}
              style={{
                backgroundColor:
                  selectedTab === "pk" ? "" : "transparent",
                color: selectedTab === "pk" ? "" : "var(--gray)",
              }}
            onClick={() => setSelectedTab("pk")}
          >
            Pubkey
          </div>
          {user?.lud16 && (
            <div
            className={"btn sticker-gray-black p-caps fx-centered"}
            style={{
              backgroundColor:
                selectedTab === "ln" ? "" : "transparent",
              color: selectedTab === "ln" ? "" : "var(--gray)",
            }}
              onClick={() => setSelectedTab("ln")}
            >
              Lightning address
            </div>
          )}
        </div>
        <div className="fx-centered fit-container box-marg-s">
          <div
            className="box-pad-v-m box-pad-h-m sc-s-18"
            style={{ backgroundColor: "white" }}
          >
            {selectedTab === "pk" && (
              <QRCode
                size={200}
                value={`nostr:${getBech32("npub", user?.pubkey)}`}
              />
            )}
            {selectedTab === "ln" && <QRCode size={200} value={user?.lud16} />}
          </div>
        </div>
        <div className="fit-container fx-col fx-centered">
          <div
            className={"fx-scattered if pointer fit-container dashed-onH"}
            style={{ borderStyle: "dashed" }}
            onClick={() =>
              copyKey(
                "Your profile",
                `https://yakihonne.com/users/${getBech32("npub", user.pubkey)}`
              )
            }
          >
            <div className="link-24"></div>
            <p className="p-one-line">{`https://yakihonne.com/users/${getBech32(
              "npub",
              user.pubkey
            )}`}</p>
            <div className="copy-24"></div>
          </div>
          <div
            className={"fx-scattered if pointer fit-container dashed-onH"}
            style={{ borderStyle: "dashed" }}
            onClick={() =>
              copyKey("The pubkey", `nostr:${getBech32("npub", user?.pubkey)}`)
            }
          >
            <div className="key-icon-24"></div>
            <p>{shortenKey(`nostr:${getBech32("npub", user?.pubkey)}`)}</p>
            <div className="copy-24"></div>
          </div>
          {user?.lud16 && (
            <div
              className={"fx-scattered if pointer fit-container dashed-onH"}
              style={{ borderStyle: "dashed" }}
              onClick={() => copyKey("The lightning address", user?.lud16)}
            >
              <div className="bolt-24"></div>
              <p className="p-one-line">{user?.lud16}</p>
              <div className="copy-24"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
