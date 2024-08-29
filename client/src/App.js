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
import "./styles/placeholder.css";
import "./styles/essentials.css";
import "./styles/custom.css";
import "./styles/mobile.css";

import { ContextProvider } from "./Context/Context";

import NostrHome from "./Pages/MainApp/Home";
import NostrWriting from "./Pages/MainApp/WritingArticle";
import NostrArticle from "./Pages/MainApp/Article";
import NostrCurations from "./Pages/MainApp/Curations";
import NostrSettings from "./Pages/MainApp/Settings";
import NostrUser from "./Pages/MainApp/User";
import NostrMyPosts from "./Pages/MainApp/MyPosts";
import NostrMyCurations from "./Pages/MainApp/MyCurations";
import NostrCuration from "./Pages/MainApp/Curation";
import ToastMessages from "./Components/ToastMessages";
import FourOFour from "./Pages/FourOFour";
import NostrSearchTag from "./Pages/MainApp/SearchTag";
import NostrBookmarks from "./Pages/MainApp/Bookmarks";
import Publishing from "./Components/Publishing";
import NostrFlashNews from "./Pages/MainApp/FlashNews";
import YakiMobileApp from "./Pages/YakiMobileApp";
import YMARedirection from "./Pages/YMARedirection";
import NostrFlashNewsEvent from "./Pages/MainApp/FlashNewsEvent";
import NostrUN from "./Pages/MainApp/UncensoredNotes";
import NostrUNEvent from "./Pages/MainApp/UncensoredNote";
import YakiFN from "./Pages/YakiFN";
import Privacy from "./Pages/Privacy";
import Terms from "./Pages/Terms";
import DMS from "./Pages/MainApp/DMS";
import NavbarNOSTR from "./Components/Main/NavbarNOSTR";
import NostrMyFlashNews from "./Pages/MainApp/MyFlashNews";
import NostrVideos from "./Pages/MainApp/Videos";
import NostrArticles from "./Pages/MainApp/Articles";
import NostrVideo from "./Pages/MainApp/Video";
import NostrMyVideos from "./Pages/MainApp/MyVideos";
import BuzzFeed from "./Pages/MainApp/BuzzFeedEvent";
import NostrBuzzFeed from "./Pages/MainApp/BuzzFeed";
import BuzzFeedSource from "./Pages/MainApp/BuzzFeedSource";
import UserLevels from "./Pages/MainApp/UserLevels";
import NostrNotes from "./Pages/MainApp/Notes";
import UserFirsLogin from "./Components/UserFirsLogin";
import YakiNewFeatureIntro from "./Components/YakiNewFeatureIntro";
import YakiLevelingFeature from "./Pages/YakiLevelingFeature";
import NostrNote from "./Pages/MainApp/Note";
import NostrMyNotes from "./Pages/MainApp/MyNotes";
import Wallet from "./Pages/MainApp/Wallet";
import WalletAlby from "./Pages/MainApp/WalletAlby";
import WalletNWC from "./Pages/MainApp/WalletNWC";
import NostrSmartWidget from "./Pages/MainApp/SmartWidget";
import NostrSmartWidgets from "./Pages/MainApp/SmartWidgets";
import SmartWidgetChecker from "./Pages/MainApp/SmartWidgetChecker";
import NostrMyNotesHidden from "./Pages/MainApp/MyNotesHidden";
import YakiSmartWidget from "./Pages/YakiSmartWidget";

function App() {
  const location = useLocation()
  return (
    <ContextProvider>
      <Publishing />
      <ToastMessages />
      <UserFirsLogin />
      {/* <YakiNewFeatureIntro /> */}
      {/* <Router> */}
        <NavbarNOSTR />
        <Routes>
          <Route path="*" element={<FourOFour />} />
          <Route path="/:nevent" element={<FourOFour />} />
          <Route path="/" element={<NostrHome />} />
          <Route path="/bookmarks" element={<NostrBookmarks />} />
          <Route path="/articles" element={<NostrArticles />} />
          <Route path="/curations" element={<NostrCurations />} />
          <Route path="/curations/:id" element={<NostrCuration />} />
          <Route
            path="/curations/:CurationKind/:AuthNip05/:ArtIdentifier"
            element={<NostrCuration />}
          />
          <Route path="/my-curations" element={<NostrMyCurations />} />
          <Route path="/write-article" element={<NostrWriting />} />
          <Route path="/smart-widget-builder" element={<NostrSmartWidget key={location.key}/>} />
          <Route path="/smart-widgets" element={<NostrSmartWidgets />} />
          <Route
            path="/smart-widget-checker"
            element={<SmartWidgetChecker />}
          />
          <Route path="/my-articles" element={<NostrMyPosts />} />
          <Route path="/settings" element={<NostrSettings />} />
          <Route path="/article/:id" element={<NostrArticle />} />
          <Route
            path="/article/:AuthNip05/:ArtIdentifier"
            element={<NostrArticle />}
          />
          <Route path="/users/:user_id" element={<NostrUser />} />
          <Route path="/tags/:tag" element={<NostrSearchTag />} />
          <Route path="/flash-news" element={<NostrFlashNews />} />
          <Route path="/my-flash-news" element={<NostrMyFlashNews />} />
          <Route path="/flash-news/:nevent" element={<NostrFlashNewsEvent />} />
          <Route path="/uncensored-notes" element={<NostrUN />} />
          <Route path="/uncensored-notes/:nevent" element={<NostrUNEvent />} />
          <Route path="/videos" element={<NostrVideos />} />
          <Route path="/videos/:id" element={<NostrVideo />} />
          <Route path="/my-videos" element={<NostrMyVideos />} />
          <Route
            path="/videos/:AuthNip05/:VidIdentifier"
            element={<NostrVideo />}
          />
          <Route path="/notes" element={<NostrNotes />} />
          <Route path="/notes/:nevent" element={<NostrNote />} />
          <Route path="/my-notes" element={<NostrMyNotes />} />
          <Route path="/my-notes-hidden" element={<NostrMyNotesHidden />} />
          <Route path="/messages" element={<DMS />} />
          <Route path="/buzz-feed" element={<BuzzFeed />} />
          <Route path="/buzz-feed/:nevent" element={<NostrBuzzFeed />} />
          <Route
            path="/buzz-feed/source/:source"
            element={<BuzzFeedSource />}
          />
          <Route path="/yakihonne-mobile-app" element={<YakiMobileApp />} />
          <Route path="/yakihonne-flash-news" element={<YakiFN />} />
          <Route
            path="/yakihonne-mobile-app-links"
            element={<YMARedirection />}
          />
          <Route
            path="/yakihonne-smart-widgets"
            element={<YakiSmartWidget />}
          />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/wallet/alby" element={<WalletAlby />} />
          <Route path="/wallet/nwc" element={<WalletNWC />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/yaki-points" element={<UserLevels />} />
          <Route path="/points-system" element={<YakiLevelingFeature />} />
        </Routes>
      {/* </Router> */}
    </ContextProvider>
  );
}

export default App;
