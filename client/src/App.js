import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./styles/root.css";
import "./styles/animations.css";
import "./styles/icons.css";
import "./styles/notificationsIcons.css";
import "./styles/placeholder.css";
import "./styles/essentials.css";
import "./styles/custom.css";
import "./styles/mobile.css";

import Home from "./Pages/MainApp/Home";
import Writing from "./Pages/MainApp/WritingArticle";
import Article from "./Pages/MainApp/Article";
import Curations from "./Pages/MainApp/Curations";
import Settings from "./Pages/MainApp/Settings";
import User from "./Pages/MainApp/User";
import MyPosts from "./Pages/MainApp/MyPosts";
import MyCurations from "./Pages/MainApp/MyCurations";
import Curation from "./Pages/MainApp/Curation";
import ToastMessages from "./Components/ToastMessages";
import FourOFour from "./Pages/FourOFour";
import SearchTag from "./Pages/MainApp/SearchTag";
import Bookmarks from "./Pages/MainApp/Bookmarks";
import Publishing from "./Components/Publishing";
import FlashNews from "./Pages/MainApp/FlashNews";
import YakiMobileApp from "./Pages/YakiMobileApp";
import YMARedirection from "./Pages/YMARedirection";
import FlashNewsEvent from "./Pages/MainApp/FlashNewsEvent";
import UN from "./Pages/MainApp/UncensoredNotes";
import UNEvent from "./Pages/MainApp/UncensoredNote";
import YakiFN from "./Pages/YakiFN";
import Privacy from "./Pages/Privacy";
import Terms from "./Pages/Terms";
import DMS from "./Pages/MainApp/DMS";
import NavbarNOSTR from "./Components/Main/NavbarNOSTR";
import MyFlashNews from "./Pages/MainApp/MyFlashNews";
import Videos from "./Pages/MainApp/Videos";
import Articles from "./Pages/MainApp/Articles";
import Video from "./Pages/MainApp/Video";
import MyVideos from "./Pages/MainApp/MyVideos";
import UserLevels from "./Pages/MainApp/UserLevels";
import Notes from "./Pages/MainApp/Notes";
import UserFirsLogin from "./Components/UserFirsLogin";
import YakiNewFeatureIntro from "./Components/YakiNewFeatureIntro";
import YakiLevelingFeature from "./Pages/YakiLevelingFeature";
import Note from "./Pages/MainApp/Note";
import MyNotes from "./Pages/MainApp/MyNotes";
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

export default function App() {
  const location = useLocation();

  return (
    <>
      {/* <Publishing /> */}
      <ToastMessages />
      <UserFirsLogin />
      {/* <YakiNewFeatureIntro /> */}
      {/* <Router> */}
      <NavbarNOSTR />
      <Routes>
        <Route path="*" element={<FourOFour />} />
        <Route path="/:nevent" element={<FourOFour />} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/discover" element={<Explore />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/notifications" element={<Notification />} />
        <Route path="/curations" element={<Curations />} />
        <Route path="/curations/:id" element={<Curation />} />
        <Route
          path="/curations/:CurationKind/:AuthNip05/:ArtIdentifier"
          element={<Curation />}
        />
        {/* <Route path="/my-curations" element={<MyCurations />} /> */}
        <Route path="/write-article" element={<Writing />} />
        <Route
          path="/smart-widget-builder"
          element={<SmartWidget key={location.key} />}
        />
        <Route path="/smart-widgets" element={<SmartWidgets />} />
        <Route path="/smart-widget-checker" element={<SmartWidgetChecker />} />
        {/* <Route path="/my-articles" element={<MyPosts />} /> */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/profile" element={<ProfileEdit />} />
        <Route path="/article/:id" element={<Article />} />
        <Route
          path="/article/:AuthNip05/:ArtIdentifier"
          element={<Article />}
        />
        <Route path="/users/:user_id" element={<User />} />
        <Route path="/tags/:tag" element={<SearchTag />} />
        <Route path="/flash-news" element={<FlashNews />} />
        {/* <Route path="/my-flash-news" element={<MyFlashNews />} /> */}
        {/* <Route path="/flash-news/:nevent" element={<FlashNewsEvent />} /> */}
        <Route path="/verify-notes" element={<UN />} />
        <Route path="/verify-notes/:nevent" element={<UNEvent />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/videos/:id" element={<Video />} />
        {/* <Route path="/my-videos" element={<MyVideos />} /> */}
        <Route path="/videos/:AuthNip05/:VidIdentifier" element={<Video />} />
        {/* <Route path="/notes" element={<Notes />} /> */}
        <Route path="/notes/:nevent" element={<Note />} />
        {/* <Route path="/my-notes" element={<MyNotes />} /> */}
        <Route path="/my-notes-hidden" element={<MyNotesHidden />} />
        <Route path="/messages" element={<DMS />} />
        <Route path="/yakihonne-mobile-app" element={<YakiMobileApp />} />
        <Route path="/yakihonne-flash-news" element={<YakiFN />} />
        <Route
          path="/yakihonne-mobile-app-links"
          element={<YMARedirection />}
        />
        <Route path="/yakihonne-smart-widgets" element={<YakiSmartWidget />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/wallet/alby" element={<WalletAlby />} />
        <Route path="/wallet/nwc" element={<WalletNWC />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/yaki-points" element={<UserLevels />} />
        <Route path="/points-system" element={<YakiLevelingFeature />} />
      </Routes>
    </>
  );
}
