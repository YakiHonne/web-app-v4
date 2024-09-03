import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./Store/Store";
import AppInit from "./Context/AppInit";

const root = ReactDOM.createRoot(document.getElementById("main"));
root.render(
  <Router>
    <Provider store={store}>
      <AppInit />
      {/* <App /> */}
    </Provider>
  </Router>
);
