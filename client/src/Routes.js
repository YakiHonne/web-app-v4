// routes.js
import React from "react";
import Home from "./Pages/MainApp/Home";
import Writing from "./Pages/MainApp/WritingArticle";
import Article from "./Pages/MainApp/Article";
import Settings from "./Pages/MainApp/Settings";
import User from "./Pages/MainApp/User";
import Curation from "./Pages/MainApp/Curation";
import FourOFour from "./Pages/FourOFour";
import YakiMobileApp from "./Pages/YakiMobileApp";
import YMARedirection from "./Pages/YMARedirection";
import UN from "./Pages/MainApp/UncensoredNotes";
import UNEvent from "./Pages/MainApp/UncensoredNote";
import YakiFN from "./Pages/YakiFN";
import Privacy from "./Pages/Privacy";
import Terms from "./Pages/Terms";
import DMS from "./Pages/MainApp/DMS";
import Video from "./Pages/MainApp/Video";
import UserLevels from "./Pages/MainApp/UserLevels";
import YakiLevelingFeature from "./Pages/YakiLevelingFeature";
import Note from "./Pages/MainApp/Note";
import Wallet from "./Pages/MainApp/Wallet";
import WalletAlby from "./Pages/MainApp/WalletAlby";
import WalletNWC from "./Pages/MainApp/WalletNWC";
import SmartWidget from "./Pages/MainApp/SmartWidget";
import SmartWidgets from "./Pages/MainApp/SmartWidgets";
import SmartWidgetChecker from "./Pages/MainApp/SmartWidgetChecker";
import MyNotesHidden from "./Pages/MainApp/MyNotesHidden";
import YakiSmartWidget from "./Pages/YakiSmartWidget";
import Login from "./Pages/MainApp/Login";
import ProfileEdit from "./Pages/MainApp/ProfileEdit";
import Notification from "./Pages/MainApp/Notification";
import Explore from "./Pages/MainApp/Explore";
import Dashboard from "./Pages/MainApp/Dashboard";
import Search from "./Pages/MainApp/Search";
import MACIPollStarter from "./Pages/MainApp/MACIPollStarter";
import SmartWidgetsV2 from "./Pages/MainApp/SmartWidgetsV2";
import SmartWidgetV2 from "./Pages/MainApp/SmartWidgetV2";
import SmartWidgetCheckerV2 from "./Pages/MainApp/SmartWidgetCheckerV2";
import SWhome from "./Pages/MainApp/SWhome";

const routes = [
  { path: "*", element: <FourOFour /> },
  { path: "/:nevent", element: <FourOFour /> },
  { path: "/search", element: <Search /> },
  { path: "/m/maci-poll", element: <MACIPollStarter /> },
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/discover", element: <Explore /> },
  { path: "/notifications", element: <Notification /> },
  { path: "/curations/:id", element: <Curation /> },
  { path: "/curations/:CurationKind/:AuthNip05/:ArtIdentifier", element: <Curation /> },
  { path: "/write-article", element: <Writing /> },
  // { path: "/smart-widget-builder", element: <SmartWidget /> },
  { path: "/smart-widget-builder", element: <SmartWidgetV2 /> },
  // { path: "/smart-widgets", element: <SmartWidgets /> },
  { path: "/smart-widgets", element: <SWhome /> },
  { path: "/smart-widgets-v2", element: <SmartWidgetsV2 /> },
  { path: "/smart-widget-checker", element: <SmartWidgetCheckerV2 /> },
  // { path: "/smart-widget-checker", element: <SmartWidgetChecker /> },
  { path: "/settings", element: <Settings /> },
  { path: "/settings/profile", element: <ProfileEdit /> },
  { path: "/article/:id", element: <Article /> },
  { path: "/article/:AuthNip05/:ArtIdentifier", element: <Article /> },
  { path: "/users/:user_id", element: <User /> },
  { path: "/verify-notes", element: <UN /> },
  { path: "/verify-notes/:nevent", element: <UNEvent /> },
  { path: "/videos/:id", element: <Video /> },
  { path: "/videos/:AuthNip05/:VidIdentifier", element: <Video /> },
  { path: "/notes/:nevent", element: <Note /> },
  { path: "/my-notes-hidden", element: <MyNotesHidden /> },
  { path: "/messages", element: <DMS /> },
  { path: "/yakihonne-mobile-app", element: <YakiMobileApp /> },
  { path: "/yakihonne-paid-notes", element: <YakiFN /> },
  { path: "/yakihonne-mobile-app-links", element: <YMARedirection /> },
  { path: "/yakihonne-smart-widgets", element: <YakiSmartWidget /> },
  { path: "/wallet", element: <Wallet /> },
  { path: "/wallet/alby", element: <WalletAlby /> },
  { path: "/wallet/nwc", element: <WalletNWC /> },
  { path: "/privacy", element: <Privacy /> },
  { path: "/terms", element: <Terms /> },
  { path: "/yaki-points", element: <UserLevels /> },
  { path: "/points-system", element: <YakiLevelingFeature /> },
];

export default routes;
