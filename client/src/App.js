import React from "react";
import { Routes, Route } from "react-router-dom";
import "./styles/root.css";
import "./styles/animations.css";
import "./styles/icons.css";
import "./styles/notificationsIcons.css";
import "./styles/placeholder.css";
import "./styles/essentials.css";
import "./styles/custom.css";
import "./styles/mobile.css";

import ToastMessages from "./Components/ToastMessages";
import Navbar from "./Components/Main/Navbar";
import UserFirsLogin from "./Components/UserFirsLogin";
import routes from "./Routes";

export default function App() {
  return (
    <>
      <ToastMessages />
      <UserFirsLogin />
      <Navbar />
      <Routes>
        {routes.map(({ path, element }, index) => (
          <Route key={index} path={path} element={element} />
        ))}
      </Routes>
    </>
  );
}
