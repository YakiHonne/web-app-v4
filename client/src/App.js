import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/root.css";
import "./styles/animations.css";
import "./styles/icons.css";
import "./styles/placeholder.css";
import "./styles/essentials.css";
import "./styles/custom.css";
import "./styles/mobile.css";

import { ContextProvider } from "./Context/Context";

import NostrHome from "./Pages/NOSTR/NostrHome";
import NostrWriting from "./Pages/NOSTR/NostrWriting";
import NostrArticle from "./Components/NOSTR/NostrArticle";
import NostrCurations from "./Pages/NOSTR/NostrCurations";
import NostrSettings from "./Pages/NOSTR/NostrSettings";
import NostrUser from "./Pages/NOSTR/NostrUser";
import NostrMyPosts from "./Pages/NOSTR/NostrMyPosts";
import NostrMyCurations from "./Pages/NOSTR/NostrMyCurations";
import NostrCuration from "./Components/NOSTR/NostrCuration";
import ToastMessages from "./Components/ToastMessages";
import FourOFour from "./Pages/FourOFour";
import NostrSearchTag from "./Pages/NOSTR/NostrSearchTag";
import NostrBookmarks from "./Pages/NOSTR/NostrBookmarks";
import Publishing from "./Components/Publishing";
import NostrFlashNews from "./Pages/NOSTR/NostrFlashNews";
import YakiMobileApp from "./Pages/NOSTR/YakiMobileApp";
import YMARedirection from "./Pages/NOSTR/YMARedirection";
import NostrFlashNewsEvent from "./Pages/NOSTR/NostrFlashNewsEvent";
import NostrUN from "./Pages/NOSTR/NostrUN";
import NostrUNEvent from "./Pages/NOSTR/NostrUNEvent";
import YakiFN from "./Pages/NOSTR/YakiFN";
import Privacy from "./Pages/Privacy";
import Terms from "./Pages/Terms";
import DMS from "./Pages/NOSTR/DMS";
import AIFeeds from "./Pages/NOSTR/BuzzFeed";
import NostrAIFeed from "./Pages/NOSTR/NostrBuzzFeed";
import NavbarNOSTR from "./Components/NOSTR/NavbarNOSTR";
import NostrMyFlashNews from "./Pages/NOSTR/NostrMyFlashNews";
import NostrVideos from "./Pages/NOSTR/NostrVideos";
import NostrArticles from "./Pages/NOSTR/NostrArticles";
import NostrVideosEvent from "./Pages/NOSTR/NostrVideo";
import NostrVideo from "./Pages/NOSTR/NostrVideo";
import NostrMyVideos from "./Pages/NOSTR/NostrMyVideos";
import BuzzFeed from "./Pages/NOSTR/BuzzFeed";
import NostrBuzzFeed from "./Pages/NOSTR/NostrBuzzFeed";
import BuzzFeedSource from "./Pages/NOSTR/BuzzFeedSource";
import UserLevels from "./Pages/NOSTR/UserLevels";
import NostrNotes from "./Pages/NOSTR/NostrNotes";
import UserFirsLogin from "./Components/UserFirsLogin";
import YakiNewFeatureIntro from "./Components/YakiNewFeatureIntro";
import YakiLevelingFeature from "./Pages/YakiLevelingFeature";

function App() {
  return (
    <ContextProvider>
      <Publishing />
      <ToastMessages />
      <UserFirsLogin />
      <YakiNewFeatureIntro />
      <Router>
        <NavbarNOSTR />
        <Routes>
          <Route path="*" element={<FourOFour />} />
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
          <Route path="/notes/:nevent" element={<NostrNotes />} />
          <Route path="/messages" element={<DMS />} />
          <Route path="/buzz-feed" element={<BuzzFeed />} />
          <Route path="/buzz-feed/:nevent" element={<NostrBuzzFeed />} />
          <Route path="/buzz-feed/source/:source" element={<BuzzFeedSource />} />
          <Route path="/yakihonne-mobile-app" element={<YakiMobileApp />} />
          <Route path="/yakihonne-flash-news" element={<YakiFN />} />
          <Route
            path="/yakihonne-mobile-app-links"
            element={<YMARedirection />}
          />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/yaki-points" element={<UserLevels />} />
          <Route path="/points-system" element={<YakiLevelingFeature />} />
        </Routes>
      </Router>
    </ContextProvider>
  );
}

export default App;
