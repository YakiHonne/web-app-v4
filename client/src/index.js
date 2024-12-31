import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, unstable_HistoryRouter as HistoryRouter, } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./Store/Store";
import '../src/Context/I18N'
import AppInit from "./Context/AppInit";
import App from "./App";
import { customHistory } from "./Helpers/History";

const root = ReactDOM.createRoot(document.getElementById("main"));
root.render(
  <HistoryRouter history={customHistory}>
    <Provider store={store}>
      <AppInit />
      <App />
    </Provider>
  </HistoryRouter>
);

