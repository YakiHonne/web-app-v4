import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./styles/root.css";
import "./styles/animations.css";
import "./styles/icons.css";
import "./styles/notificationsIcons.css";
import "./styles/placeholder.css";
import "./styles/essentials.css";
import "./styles/custom.css";
import "./styles/mobile.css";
import "./styles/chatAI.css";

import ToastMessages from "./Components/ToastMessages";
import Navbar from "./Components/Main/Navbar";
import UserFirsLogin from "./Components/UserFirsLogin";
import routes from "./Routes";
import WarningBar from "./Components/WarningBar";
import Sidebar from "./Components/Main/Sidebar";

export default function App() {
  const location = useLocation();
  const hiddenSidebarRoutes = [
    "/yakihonne-mobile-app",
    "/yakihonne-paid-notes",
    "/yakihonne-smart-widgets",
    "/privacy",
    "/terms",
    "/login",
    "/points-system",
    "/write-article",
    "/m/maci-poll",
    "/docs/sw/intro",
    "/docs/sw/getting-started",
    "/docs/sw/basic-widgets",
    "/docs/sw/action-tool-widgets",
    "/docs/sw/smart-widget-builder",
    "/docs/sw/smart-widget-previewer",
    "/docs/sw/smart-widget-handler",
  ];
  const hideSidebar = hiddenSidebarRoutes.includes(location.pathname);

  return (
    <>
      <ToastMessages />
      <UserFirsLogin />
      <Navbar />
      <WarningBar />
      <div>
        <div className="fit-container fx-centered">
          {!hideSidebar ? (
            <div className="main-container">
              <Sidebar />
              <main className="main-page-nostr-container">
                <Routes>
                  {routes.map(({ path, element }, index) => (
                    <Route key={index} path={path} element={element} />
                  ))}
                </Routes>
              </main>
            </div>
          ) : (
            <main className="main-page-nostr-container">
              <Routes>
                {routes.map(({ path, element }, index) => (
                  <Route key={index} path={path} element={element} />
                ))}
              </Routes>
            </main>
          )}
        </div>
      </div>
    </>
  );
}
