import React, { useEffect, useRef, useState } from "react";
import { getBech32 } from "../../Helpers/Encryptions";
import LoginWithNostr from "./LoginWithNostr";
import { Link } from "react-router-dom";
import MenuMobile from "./MenuMobile";
import SearchMobile from "./SearchMobile";
import { useSelector } from "react-redux";
import { redirectToLogin } from "../../Helpers/Helpers";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import SearchNetwork from "./SearchNetwork";

const triggerLoginTime = () => {
  let time = localStorage.getItem("login-off");

  if (!time) {
    localStorage.setItem("login-off", `${new Date().getTime()}`);
    return true;
  }

  if (parseInt(time) + 20 * 60 * 1000 < new Date().getTime()) {
    localStorage.setItem("login-off", `${new Date().getTime()}`);
    return true;
  }
  return false;
};

export default function NavbarNOSTR({ margin = true }) {
  const userKeys = useSelector((state) => state.userKeys);
  const ref = useRef();
  const [showSettings, setShowSettings] = useState(false);
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [pubkey, setPubkey] = useState(
    userKeys.pub ? getBech32("npub", userKeys.pub) : ""
  );
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    userKeys.pub ? setPubkey(getBech32("npub", userKeys.pub)) : setPubkey("");
  }, [userKeys]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  if (
    [
      "/yakihonne-mobile-app",
      "/yakihonne-flash-news",
      "/yakihonne-smart-widgets",
      "/privacy",
      "/terms",
      "/points-system",
    ].includes(window.location.pathname)
  )
    return;

  return (
    <>
      {showMobileMenu && (
        <MenuMobile
          toggleLogin={() => {
            setShowMobileMenu(false);
            redirectToLogin();
          }}
          exit={() => {
            setShowMobileMenu(false);
          }}
        />
      )}
      {showSearchMobile && (
        <SearchNetwork exit={() => setShowSearchMobile(false)} />
      )}
      <div
        className={`fit-container fx-scattered  navbar-mobile box-pad-h-m box-pad-v-m`}
        style={{ borderBottom: "1px solid var(--very-dim-gray)" }}
      >
        <Link to={"/"}>
          <div
            className="yakihonne-logo"
            style={{
              filter: "brightness(0) invert()",
              width: "100px",
              height: "50px",
            }}
          ></div>
        </Link>
        <div className="fx-centered">
          <div
            className="menu-toggle"
            onClick={() => setShowSearchMobile(!showSearchMobile)}
          >
            <div className="search-24"></div>
          </div>
          <div
            className={"menu-toggle"}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {userKeys ? (
              <UserProfilePicNOSTR
                allowClick={false}
                ring={false}
                mainAccountUser={true}
                allowPropagation={true}
                size={38}
              />
            ) : (
              <div className="menu-24"></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
