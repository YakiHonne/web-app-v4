import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function AddWallet({ exit }) {
  const navigateTo = useNavigate();
  return (
    <div
      className="fixed-container fx-centered box-pad-h"
      style={{ zIndex: "1000" }}
      onClick={(e) => {
        e.stopPropagation();
        exit();
      }}
    >
      <div
        className="sc-s box-pad-h box-pad-v fx-centered fx-col"
        style={{ width: "min(100%,500px)", position: "relative" }}
      >
        <div className="close">
          <div></div>
        </div>
        <h4 className="box-marg-s">Add wallet</h4>
        <Link
          className="fit-container fx-scattered sc-s-18 box-pad-h-s box-pad-v-s option pointer"
          to={"/wallet/nwc"}
        >
          <div className="fx-centered">
            <div
              className="nwc-logo-24"
              style={{ width: "48px", height: "48px" }}
            ></div>
            <div>
              <p>Nostr Wallet Connect</p>
              <p className="gray-c p-medium">Native nostr wallet connection</p>
            </div>
          </div>
          <div className="box-pad-h-s">
            <div className="plus-sign"></div>
          </div>
        </Link>
        <div
          className="fit-container fx-scattered sc-s-18 box-pad-h-s box-pad-v-s option pointer"
          onClick={() =>
            (window.location.href =
              "https://getalby.com/oauth?client_id=w6PgKjdnhk&response_type=code&redirect_uri=http://localhost:3400/wallet/alby&scope=account:read%20invoices:create%20invoices:read%20transactions:read%20balance:read%20payments:send")
          }
        >
          <div className="fx-centered">
            <div
              className="alby-logo-24"
              style={{ width: "48px", height: "48px" }}
            ></div>
            <div>
              <p>Alby</p>
              <p className="gray-c p-medium">Alby Connect</p>
            </div>
          </div>
          <div className="box-pad-h-s">
            <div className="plus-sign"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
