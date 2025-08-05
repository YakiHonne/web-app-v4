import React from "react";
import Writing from "./Pages/MainApp/WritingArticle";
import Article from "./Pages/MainApp/Article";
import Settings from "./Pages/MainApp/Settings";
import User from "./Pages/MainApp/User";
import Curation from "./Pages/MainApp/Curation";
import FourOFour from "./Pages/FourOFour";
import YakiMobileApp from "./Pages/YakiMobileApp";
import YMARedirection from "./Pages/YMARedirection";
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
import MyNotesHidden from "./Pages/MainApp/MyNotesHidden";
import YakiSmartWidget from "./Pages/YakiSmartWidget";
import Login from "./Pages/MainApp/Login";
import ProfileEdit from "./Pages/MainApp/ProfileEdit";
import Notification from "./Pages/MainApp/Notification";
import Search from "./Pages/MainApp/Search";
import MACIPollStarter from "./Pages/MainApp/MACIPollStarter";
import SWhome from "./Pages/MainApp/SWhome";
import SmartWidgetOne from "./Pages/MainApp/SmartWidgetOne";
import Playground from "./Pages/MainApp/Playground";
import Doc from "./Pages/SWGuide/Doc";
import Explore from "./Pages/MainApp/Explore";
import Home from "./Pages/MainApp/Home";
import NoteSharedRelay from "./Pages/MainApp/NoteSharedRelay";
import ExploreSharedRelay from "./Pages/MainApp/ExploreSharedRelay";
import SWhomeAI from "./Pages/MainApp/SWHomeAI";
import Dashboard from "./Pages/MainApp/Dashboard";
import SmartWidgetChecker from "./Pages/MainApp/SmartWidgetChecker";
import SmartWidgetEditor from "./Pages/MainApp/SmartWidgetEditor";

const routes = [
  { path: "*", element: <FourOFour /> },
  { path: "/:nevent", element: <FourOFour /> },
  { path: "/search", element: <Search /> },
  { path: "/m/maci-poll", element: <MACIPollStarter /> },
  { path: "/", element: <Home /> },
  { path: "/r/notes", element: <NoteSharedRelay /> },
  { path: "/r/discover", element: <ExploreSharedRelay /> },
  { path: "/login", element: <Login /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/discover", element: <Explore /> },
  { path: "/notifications", element: <Notification /> },
  { path: "/curations/:id", element: <Curation /> },
  { path: "/curations/:CurationKind/:AuthNip05/:ArtIdentifier", element: <Curation /> },
  { path: "/write-article", element: <Writing /> },
  { path: "/sw-playground", element: <Playground /> },
  { path: "/smart-widget-builder", element: <SmartWidgetEditor /> },
  { path: "/smart-widgets", element: <SWhome /> },
  { path: "/sw-ai", element: <SWhomeAI /> },
  { path: "/smart-widget-checker", element: <SmartWidgetChecker /> },
  { path: "/smart-widget/:id", element: <SmartWidgetOne /> },
  { path: "/smart-widget/:nip05/:identifier", element: <SmartWidgetOne /> },
  { path: "/settings", element: <Settings /> },
  { path: "/settings/profile", element: <ProfileEdit /> },
  { path: "/article/:id", element: <Article /> },
  { path: "/article/:AuthNip05/:ArtIdentifier", element: <Article /> },
  { path: "/profile/:user_id", element: <User /> },
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
  { path: "/docs/sw/:keyword", element: <Doc /> },
];

export default routes;
