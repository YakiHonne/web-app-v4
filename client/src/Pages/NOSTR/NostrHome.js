import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import { Relay, SimplePool, relayInit } from "nostr-tools";
import relaysOnPlatform from "../../Content/Relays";
import PostPreviewCardNOSTR from "../../Components/NOSTR/PostPreviewCardNOSTR";
import LoadingScreen from "../../Components/LoadingScreen";
import NavbarNOSTR from "../../Components/NOSTR/NavbarNOSTR";
import HomeCarouselNOSTR from "../../Components/NOSTR/HomeCarouselNOSTR";
import LoadingDots from "../../Components/LoadingDots";
import { Context } from "../../Context/Context";
import {
  decryptEventData,
  filterRelays,
  getBech32,
} from "../../Helpers/Encryptions";
import { nip19 } from "nostr-tools";
import TopCurators from "../../Components/NOSTR/TopCurators";
import { Link } from "react-router-dom";
import TopCreators from "../../Components/NOSTR/TopCreators";
import { Helmet } from "react-helmet";
import ArrowUp from "../../Components/ArrowUp";
import YakiIntro from "../../Components/YakiIntro";
import Date_ from "../../Components/Date_";
import TopicTagsSelection from "../../Components/TopicTagsSelection";
import TopicsTags from "../../Content/TopicsTags";
import LoginNOSTR from "../../Components/NOSTR/LoginNOSTR";
import { getImagePlaceholder } from "../../Content/NostrPPPlaceholder";
import BannedList from "../../Content/BannedList";
import axios from "axios";
import HomeFN from "../../Components/NOSTR/HomeFN";
import {
  getAIFeedContent,
  getFlashnewsContent,
  getNoteTree,
  getVideoContent,
  shuffleArray,
} from "../../Helpers/Helpers";
import Footer from "../../Components/Footer";
import HomeFNMobile from "../../Components/NOSTR/HomeFNMobile";
import bannedList from "../../Content/BannedList";
import SearchbarNOSTR from "../../Components/NOSTR/SearchbarNOSTR";
import FlashNewsCard from "../../Components/NOSTR/FlashNewsCard";
import FlashNewsPreviewCard from "../../Components/NOSTR/FlashNewsPreviewCard";
import BuzzFeedPreviewCard from "../../Components/NOSTR/BuzzFeedPreviewCard";
import VideosPreviewCards from "../../Components/NOSTR/VideosPreviewCards";
// import { useToPng } from '@hugocxl/react-to-image'
const defaultTopicIcon =
  "https://yakihonne.s3.ap-east-1.amazonaws.com/topics_icons/default.png";
const API_BASE_URL = process.env.REACT_APP_API_CACHE_BASE_URL;

const pool = new SimplePool();
const pool_1 = new SimplePool();
const pool_2 = new SimplePool();
const pool_3 = new SimplePool();

const getTopCreators = (posts) => {
  if (!posts) return [];
  let netCreators = posts.filter((creator, index, posts) => {
    if (index === posts.findIndex((item) => item.pubkey === creator.pubkey))
      return creator;
  });

  let tempCreators = [];

  for (let creator of netCreators) {
    let stats = getCreatorStats(creator.pubkey, posts);
    tempCreators.push({
      pubkey: creator.pubkey,
      name: creator.author_name,
      img: creator.author_img,
      articles_number: stats.articles_number,
    });
  }

  return (
    tempCreators
      .sort(
        (curator_1, curator_2) =>
          curator_2.articles_number - curator_1.articles_number
      )
      .splice(0, 6) || []
  );
};

const getCreatorStats = (pubkey, posts) => {
  let articles_number = 0;

  for (let creator of posts) {
    if (creator.author_pubkey === pubkey) {
      articles_number += 1;
    }
  }
  return {
    articles_number,
  };
};

const MixEvents = (posts, flashnews, buzzFeed, videos) => {
  const interleavedArray = [];

  const length = Math.max(
    posts.length,
    flashnews.length,
    buzzFeed.length,
    videos.length
  );

  for (let i = 0; i < length; i++) {
    if (i < flashnews.length) {
      interleavedArray.push(flashnews[i]);
    }
    if (i < videos.length) {
      interleavedArray.push(videos[i]);
    }
    if (i < posts.length) {
      interleavedArray.push(posts[i]);
    }
    if (i < buzzFeed.length) {
      interleavedArray.push(buzzFeed[i]);
    }
  }
  return interleavedArray;
};

export default function NostrHome() {
  const {
    nostrKeys,
    buzzFeedSources,
    nostrUser,
    nostrUserLoaded,
    nostrAuthors,
    addNostrAuthors,
    nostrUserTopics,
    mutedList,
  } = useContext(Context);
  const [posts, setPosts] = useState([]);
  const [flashnews, setFlashnews] = useState([]);
  const [buzzFeed, setBuzzFeed] = useState([]);
  const [videos, setVideos] = useState([]);
  const [relays, setRelays] = useState(relaysOnPlatform);
  const [activeRelay, setActiveRelay] = useState("");
  const [usersRelays, setUsersRelays] = useState([...relaysOnPlatform]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentTags, setRecentTags] = useState([]);
  const [flashNews, setFlashNews] = useState([]);
  const topCreators = useMemo(() => {
    return getTopCreators(posts);
  }, [posts]);
  const [contentFrom, setContentFrom] = useState("HOMEFEED");
  const [artsLastEventTime, setArtsLastEventTime] = useState(undefined);
  const [fnLastEventTime, setFnLastEventTime] = useState(undefined);
  const [bfLastEventTime, setBfLastEventTime] = useState(undefined);
  const [videosLastEventTime, setVideosLastEventTime] = useState(undefined);
  const [showTopicsPicker, setShowTopicsPicker] = useState(
    !localStorage.getItem("topic-popup") && nostrUser
  );
  const [sub1, setSub1] = useState(false);
  const [sub2, setSub2] = useState(false);
  const [sub3, setSub3] = useState(false);
  const [sub4, setSub4] = useState(false);
  const [showRelaysList, setShowRelaysList] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const [scrollPX, setScrollPX] = useState(0);
  const [sideContentType, setSideContentType] = useState("0");
  const [showTabsSettings, setShowTabsSettings] = useState(false);
  const extrasRef = useRef(null);
  const mixedContent = useMemo(() => {
    return MixEvents(posts, flashnews, buzzFeed, videos);
  }, [posts, flashnews, buzzFeed, videos]);
  // const [state, convert] = useToPng({
  //   selector: '#to-print',
  //   onSuccess: data => console.log('Converted #to-print to PNG!', data),
  // })

  useEffect(() => {
    setIsLoaded(false);
    if (!Array.isArray(mutedList)) return;
    initSub();
    getFlashNews();
    if (!localStorage.getItem("topic-popup") && nostrUser)
      setShowTopicsPicker(true);
  }, [
    activeRelay,
    contentFrom,
    artsLastEventTime,
    fnLastEventTime,
    bfLastEventTime,
    nostrUser,
    mutedList,
  ]);

  useEffect(() => {
    let carousel_container = document.querySelector(".slider-list");
    let carousel = document.querySelector(".slider-list .no-scrollbar");
    if (carousel_container.clientWidth < carousel.scrollWidth) {
      setShowArrows(true);
      setScrollPX(0);
    } else {
      setShowArrows(false);
      setScrollPX(0);
    }
  }, [nostrUserTopics]);

  useEffect(() => {
    const handleScroll = () => {
      if (mixedContent.length === 0) return;
      if (
        document.querySelector(".main-page-nostr-container").scrollHeight -
          document.querySelector(".main-page-nostr-container").scrollTop -
          60 >
        document.documentElement.offsetHeight
      ) {
        return;
      }
      setArtsLastEventTime(posts[posts.length - 1]?.created_at || undefined);
      setArtsLastEventTime(posts[posts.length - 1]?.created_at || undefined);
      setVideosLastEventTime(
        videos[videos.length - 1]?.created_at || undefined
      );
      setBfLastEventTime(
        buzzFeed[buzzFeed.length - 1]?.created_at || undefined
      );
    };
    document
      .querySelector(".main-page-nostr-container")
      ?.addEventListener("scroll", handleScroll);
    return () =>
      document
        .querySelector(".main-page-nostr-container")
        ?.removeEventListener("scroll", handleScroll);
  }, [recentTags]);

  const getFlashNews = async () => {
    try {
      let data = await axios.get(
        API_BASE_URL + "/api/v1/mb/flashnews/important"
      );

      setFlashNews(data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const initSub = async () => {
    var sub = null;
    let events = [];
    let tags = getTags();
    let { filter: arts_filter, relaysToFetchFrom: arts_relaysToFetchFrom } =
      getArtsFilter(tags);
    let { filter: fn_filter, relaysToFetchFrom: fn_relaysToFetchFrom } =
      getFNFilter(tags);
    let { filter: bf_filter, relaysToFetchFrom: bf_relaysToFetchFrom } =
      getBuzzFilter(tags);
    let { filter: vid_filter, relaysToFetchFrom: vid_relaysToFetchFrom } =
      getVideosFilter(tags);

    let sub_2 = pool_2.subscribeMany(bf_relaysToFetchFrom, bf_filter, {
      async onevent(event) {
        let parsedEvent = await onPostsEvent(event);
        events.push(parsedEvent);
        if (parsedEvent.is_authentic)
          setBuzzFeed((_BF) => {
            let newP = !_BF.find(
              (BF) => BF.id === event.id || event.content === BF.title
            )
              ? [..._BF, parsedEvent]
              : _BF;
            newP = newP.sort(
              (item_1, item_2) => item_2.created_at - item_1.created_at
            );
            return newP;
          });
      },
      oneose() {
        onEOSE(events);
      },
    });
    if (checkTopicInList(contentFrom)?.bfs) return;
    let sub_1 = pool.subscribeMany(arts_relaysToFetchFrom, arts_filter, {
      async onevent(event) {
        if (![...bannedList, ...mutedList].includes(event.pubkey)) {
          let parsedEvent = onArticlesEvent(event);
          events.push(parsedEvent);
        }
      },
      oneose() {
        onEOSE(events);
      },
    });
    let sub_3 = pool_1.subscribeMany(fn_relaysToFetchFrom, fn_filter, {
      async onevent(event) {
        if (![...bannedList, ...mutedList].includes(event.pubkey)) {
          let parsedEvent = await onPostsEvent(event);
          events.push(parsedEvent);
          if (parsedEvent.is_authentic)
            setFlashnews((_FN) => {
              let newP = !_FN.find((FN) => FN.id === event.id)
                ? [..._FN, parsedEvent]
                : _FN;
              newP = newP.sort(
                (item_1, item_2) => item_2.created_at - item_1.created_at
              );
              return newP;
            });
        }
      },
      oneose() {
        onEOSE(events);
      },
    });

    let sub_4 = pool_3.subscribeMany(vid_relaysToFetchFrom, vid_filter, {
      async onevent(event) {
        if (![...bannedList, ...mutedList].includes(event.pubkey)) {
          let parsedEvent = getVideoContent(event);
          events.push(parsedEvent);

          setVideos((_VID) => {
            let newP = !_VID.find(
              (VID) => VID.id === event.id || event.content === VID.title
            )
              ? [..._VID, parsedEvent]
              : _VID;
            newP = newP.sort(
              (item_1, item_2) => item_2.created_at - item_1.created_at
            );
            return newP;
          });
        }
      },
      oneose() {
        onEOSE(events);
      },
    });

    setSub1(sub_1);
    setSub2(sub_2);
    setSub3(sub_3);
    setSub4(sub_4);

    return;
  };
  const getArtsFilter = (tags) => {
    let relaysToFetchFrom;
    let filter;

    if (activeRelay) relaysToFetchFrom = [activeRelay];
    if (!activeRelay)
      relaysToFetchFrom = !nostrUser
        ? relaysOnPlatform
        : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])];

    if (contentFrom === "HOMEFEED") {
      filter = [{ kinds: [30023], limit: 20, until: artsLastEventTime }];
      return {
        relaysToFetchFrom,
        filter,
      };
    }
    if (contentFrom.includes("main-")) {
      filter = [
        { kinds: [30023], limit: 20, until: artsLastEventTime, "#t": tags },
      ];
      return {
        relaysToFetchFrom,
        filter,
      };
    }
    if (contentFrom === "follows") {
      let authors =
          nostrUser && nostrUser.following.length > 0
            ? [...nostrUser.following.map((item) => item[1])]
            : [
                "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3",
              ],
        filter = [
          {
            kinds: [30023],
            authors,
            limit: 20,
            until: artsLastEventTime,
          },
        ];

      return {
        relaysToFetchFrom,
        filter,
      };
    }
    filter = [
      {
        kinds: [30023],
        limit: 20,
        until: artsLastEventTime,
        "#t": tags,
      },
    ];
    return {
      relaysToFetchFrom,
      filter,
    };
  };
  const getFNFilter = (tags) => {
    let relaysToFetchFrom;
    let filter;

    if (activeRelay) relaysToFetchFrom = [activeRelay];
    if (!activeRelay)
      relaysToFetchFrom = !nostrUser
        ? relaysOnPlatform
        : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])];

    if (contentFrom === "HOMEFEED") {
      filter = [
        {
          kinds: [1],
          limit: 20,
          until: fnLastEventTime,
          "#l": ["FLASH NEWS"],
        },
      ];
      return {
        relaysToFetchFrom,
        filter,
      };
    }
    if (contentFrom.includes("main-")) {
      filter = [
        {
          kinds: [1],
          limit: 20,
          until: fnLastEventTime,
          "#l": ["FLASH NEWS"],
          "#t": tags,
        },
      ];
      return {
        relaysToFetchFrom,
        filter,
      };
    }
    if (contentFrom === "follows") {
      let authors =
          nostrUser && nostrUser.following.length > 0
            ? [...nostrUser.following.map((item) => item[1])]
            : [
                "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3",
              ],
        filter = [
          {
            kinds: [1],
            authors,
            limit: 20,
            until: fnLastEventTime,
            "#l": ["FLASH NEWS"],
          },
        ];

      return {
        relaysToFetchFrom,
        filter,
      };
    }
    filter = [
      {
        kinds: [1],
        limit: 20,
        until: fnLastEventTime,
        "#l": ["FLASH NEWS"],
        "#t": tags,
      },
    ];
    return {
      relaysToFetchFrom,
      filter,
    };
  };
  const getBuzzFilter = (tags) => {
    let relaysToFetchFrom;
    let filter;

    if (activeRelay) relaysToFetchFrom = [activeRelay];
    if (!activeRelay)
      relaysToFetchFrom = !nostrUser
        ? relaysOnPlatform
        : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])];

    if (contentFrom === "HOMEFEED") {
      filter = [
        {
          kinds: [1],
          limit: 20,
          until: bfLastEventTime,
          "#l": ["YAKI AI FEED"],
        },
      ];
      return {
        relaysToFetchFrom,
        filter,
      };
    }
    if (contentFrom.includes("main-")) {
      filter = [
        {
          kinds: [1],
          limit: 20,
          until: bfLastEventTime,
          "#l": ["YAKI AI FEED"],
          "#t": tags,
        },
      ];
      return {
        relaysToFetchFrom,
        filter,
      };
    }

    filter = [
      {
        kinds: [1],
        limit: 20,
        until: bfLastEventTime,
        "#l": ["YAKI AI FEED"],
        "#t": tags,
      },
    ];
    return {
      relaysToFetchFrom,
      filter,
    };
  };
  const getVideosFilter = (tags) => {
    let relaysToFetchFrom;
    let filter;

    if (activeRelay) relaysToFetchFrom = [activeRelay];
    if (!activeRelay)
      relaysToFetchFrom = !nostrUser
        ? relaysOnPlatform
        : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])];

    if (contentFrom === "HOMEFEED") {
      filter = [
        {
          kinds: [34235],
          limit: 20,
          until: videosLastEventTime,
        },
      ];
      return {
        relaysToFetchFrom,
        filter,
      };
    }
    if (contentFrom.includes("main-")) {
      filter = [
        {
          kinds: [34235],
          limit: 20,
          until: videosLastEventTime,

          "#t": tags,
        },
      ];
      return {
        relaysToFetchFrom,
        filter,
      };
    }
    if (contentFrom === "follows") {
      let authors =
          nostrUser && nostrUser.following.length > 0
            ? [...nostrUser.following.map((item) => item[1])]
            : [
                "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3",
              ],
        filter = [
          {
            kinds: [34235],
            authors,
            limit: 20,
            until: videosLastEventTime,
          },
        ];

      return {
        relaysToFetchFrom,
        filter,
      };
    }
    filter = [
      {
        kinds: [34235],
        limit: 20,
        until: videosLastEventTime,
        "#t": tags,
      },
    ];
    return {
      relaysToFetchFrom,
      filter,
    };
  };
  const getTags = () => {
    if (contentFrom.includes("main-")) {
      let tempArray = shuffleArray(TopicsTags);
      let tempArray_2 = tempArray.splice(0, 5);
      return shuffleArray(
        tempArray_2.map((item) => [item.main_tag, ...item.sub_tags]).flat()
      );
    }
    if (contentFrom === "follows") {
      return [];
    }
    if (contentFrom === "HOMEFEED") {
      let searchedTag = TopicsTags.find(
        (item) => item.main_tag === contentFrom
      );

      if (searchedTag) {
        return [searchedTag.main_tag, ...searchedTag.sub_tags];
      }
      return [contentFrom];
    }
    let isBFS = checkTopicInList(contentFrom);

    if (isBFS && !isBFS.bfs) {
      return [isBFS.main_tag, ...isBFS.sub_tags];
    }
    if (isBFS && isBFS.bfs) {
      return [isBFS.name];
    }
    return [contentFrom];
  };
  const onArticlesEvent = (event) => {
    if (bannedList.includes(event.pubkey)) return;
    let author_img = "";
    let author_name = getBech32("npub", event.pubkey).substring(0, 10);
    let author_pubkey = event.pubkey;
    let thumbnail = "";
    let title = "";
    let summary = "";
    let from = "";
    let contentSensitive = false;
    let postTags = [];
    let d = "";
    let modified_date = new Date(event.created_at * 1000).toISOString();
    let added_date = new Date(event.created_at * 1000).toISOString();
    let published_at = event.created_at;
    for (let tag of event.tags) {
      if (tag[0] === "published_at") {
        published_at = tag[1];
        added_date =
          tag[1].length > 10
            ? new Date(parseInt(tag[1])).toISOString()
            : new Date(parseInt(tag[1]) * 1000).toISOString();
      }
      if (tag[0] === "image") thumbnail = tag[1];
      if (tag[0] === "client") from = tag[1];
      if (tag[0] === "title") title = tag[1];
      if (tag[0] === "summary") summary = tag[1];
      if (tag[0] === "t") postTags.push(tag[1]);
      if (tag[0] === "L" && tag[1] === "content-warning")
        contentSensitive = true;
      if (tag[0] === "d") d = tag[1];
    }

    let naddr = nip19.naddrEncode({
      identifier: d,
      pubkey: author_pubkey,
      kind: 30023,
    });

    setPosts((_posts) => {
      let index = _posts.findIndex((item) => item.d === d);
      let newP = Array.from(_posts);
      if (index === -1)
        newP = [
          ...newP,
          {
            id: event.id,
            pubkey: event.pubkey,
            kind: event.kind,
            thumbnail: thumbnail || getImagePlaceholder(),
            summary,
            author_img,
            author_pubkey,
            author_name,
            title,
            added_date,
            created_at: event.created_at,
            modified_date,
            published_at,
            postTags,
            naddr,
            d,
            contentSensitive,
            from: from || "N/A",
          },
        ];
      if (index !== -1) {
        if (_posts[index].created_at < event.created_at) {
          newP.splice(index, 1);
          newP.push({
            id: event.id,
            pubkey: event.pubkey,
            kind: event.kind,
            thumbnail: thumbnail,
            summary,
            author_img,
            author_pubkey,
            author_name,
            title,
            added_date,
            created_at: event.created_at,
            modified_date,
            published_at,
            postTags,
            naddr,
            d,
            contentSensitive,
            from: from || "N/A",
          });
        }
      }

      newP = newP.sort(
        (item_1, item_2) => item_2.created_at - item_1.created_at
      );

      return newP;
    });
    setIsLoading(false);
    return {
      id: event.id,
      pubkey: event.pubkey,
      kind: event.kind,
      thumbnail,
      summary,
      author_img,
      author_pubkey,
      author_name,
      title,
      added_date,
      created_at: event.created_at,
      modified_date,
      published_at,
      postTags,
      naddr,
      d,
      contentSensitive,
      from: from || "N/A",
    };
  };
  const onPostsEvent = async (news) => {
    let l = news.tags.find((tag) => tag[0] === "l")[1];
    if (l === "FLASH NEWS") {
      let parsed = await getFlashnewsContent(news);
      return parsed;
    }
    if (l === "YAKI AI FEED") {
      let parsed = getAIFeedContent(news);
      return parsed;
    }
  };
  const onEOSE = (events) => {
    if (events) {
      let filteredEvents = events.filter((event) => event);
      addNostrAuthors(filteredEvents.map((item) => item.pubkey));
      setRecentTags(
        [
          ...new Set(
            [
              ...filteredEvents
                .filter((item) => item.kind === 30023)
                .map((item) => item.postTags.flat()),
              ...recentTags,
            ].flat()
          ),
        ].splice(0, 30)
      );
    }
    if (activeRelay) pool.close([activeRelay]);
    if (!activeRelay)
      pool.close(
        !nostrUser
          ? relaysOnPlatform
          : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])]
      );
    setIsLoaded(true);
    setIsLoading(false);
    // relaySub.close();
  };
  const switchContentSource = (source) => {
    if (source === contentFrom) return;

    if (activeRelay) pool.close([activeRelay]);
    if (!activeRelay)
      pool.close(
        !nostrUser
          ? relaysOnPlatform
          : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])]
      );
    if (sub1) sub1.close();
    if (sub2) sub2.close();
    if (sub3) sub3.close();
    if (sub4) sub4.close();
    setPosts([]);
    setFlashnews([]);
    setBuzzFeed([]);
    setVideos([]);
    setIsLoading(true);
    setRecentTags([]);
    setArtsLastEventTime(undefined);
    setFnLastEventTime(undefined);
    setBfLastEventTime(undefined);
    setContentFrom(source);
  };
  const switchActiveRelay = (source) => {
    if (source === activeRelay) return;
    setIsLoading(true);
    if (sub1) sub1.close();
    if (sub2) sub2.close();
    if (sub3) sub3.close();
    if (sub4) sub4.close();
    setPosts([]);
    setFlashnews([]);
    setBuzzFeed([]);
    setVideos([]);
    setRecentTags([]);
    setActiveRelay(source);
    setBfLastEventTime(undefined);
    setArtsLastEventTime(undefined);
    setFnLastEventTime(undefined);
  };

  const checkTopicInList = (topic) => {
    let isBFS = buzzFeedSources.find((item) => item.name === topic);
    if (isBFS) {
      isBFS.bfs = true;
      return isBFS;
    }
    return TopicsTags.find((item) => item.main_tag === topic);
  };

  const slideRight = () => {
    let carousel_container = document.querySelector(".slider-list");
    let carousel = document.querySelector(".slider-list .no-scrollbar");
    // console.log(carousel_container.clientWidth, scrollPX, carousel.scrollWidth);
    let pxToSlide =
      scrollPX + 100 < carousel.scrollWidth - carousel_container.clientWidth
        ? scrollPX + 100
        : carousel.scrollWidth - carousel_container.clientWidth;
    setScrollPX(pxToSlide);
  };
  const slideLeft = () => {
    let carousel_container = document.querySelector(".slider-list");
    let carousel = document.querySelector(".slider-list .no-scrollbar");
    // console.log(carousel_container.clientWidth, scrollPX);
    let pxToSlide = scrollPX - 100 > 0 ? scrollPX - 100 : 0;
    setScrollPX(pxToSlide);
  };

  return (
    <div style={{ overflow: "auto" }} id="to-print">
      <Helmet>
        <title>Yakihonne | Home</title>
        <meta
          name="description"
          content={
            "A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
          }
        />
        <meta
          property="og:description"
          content={
            "A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
          }
        />

        <meta property="og:url" content={`https://yakihonne.com`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Home" />
        <meta property="twitter:title" content="Yakihonne | Home" />
        <meta
          property="twitter:description"
          content={
            "A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
          }
        />
      </Helmet>
      <div className="fit-container fx-centered">
        <SidebarNOSTR />

        <main
          className="main-page-nostr-container"
          onClick={(e) => {
            e.stopPropagation();
            // toggleColorScheme()
            setShowRelaysList(false);
          }}
          style={{ padding: 0 }}
        >
          {showTopicsPicker && (
            <TopicTagsSelection exit={() => setShowTopicsPicker(false)} />
          )}
          {showLogin && <LoginNOSTR exit={() => setShowLogin(false)} />}
          <YakiIntro />
          <ArrowUp />
          {/* <div className="fit-container box-marg-s"> */}
          <HomeCarouselNOSTR />
          {/* </div> */}
          {/* <NavbarNOSTR /> */}
          <div className="fit-container fx-centered">
            <HomeFNMobile flashnews={flashNews} />
          </div>
          <div className="fit-container fx-centered fx-start-h">
            <div
              style={{ width: "min(100%,1400px)" }}
              className="fx-centered fx-start-v fx-start-h"
            >
              <div
                style={{ width: "min(100%, 600px)" }}
                className={`fx-centered  fx-wrap box-pad-h`}
              >
                <div
                  className="fit-container fx-centered box-pad-v sticky"
                  style={{
                    position: "sticky",
                    top: "-1px",
                    backgroundColor: "var(--white)",
                    zIndex: "1000",
                  }}
                >
                  <div className="fit-container fx-scattered">
                    {showArrows && (
                      <div
                        className="box-pad-h-s pointer slide-right"
                        onClick={slideLeft}
                      >
                        <div
                          className="arrow"
                          style={{ transform: "rotate(90deg)" }}
                        ></div>
                      </div>
                    )}
                    <div
                      className="fx-centered fx-start-h no-scrollbar slider-list"
                      style={{
                        overflow: "hidden",
                        // borderBottom: "1px solid #444444",
                      }}
                    >
                      <div
                        className="fx-centered fx-start-h no-scrollbar"
                        style={{
                          transform: `translateX(-${scrollPX}px)`,
                          transition: ".3s ease-in-out",
                          columnGap: "32px",
                        }}
                      >
                        <div
                          className={`list-item fx-centered fx-shrink ${
                            contentFrom === "HOMEFEED"
                              ? "selected-list-item"
                              : ""
                          }`}
                          onClick={() => switchContentSource("HOMEFEED")}
                        >
                          <div className="home"></div>
                          Timeline
                        </div>
                        <div
                          className={`list-item fx-centered fx-shrink ${
                            contentFrom.includes("main-")
                              ? "selected-list-item"
                              : ""
                          }`}
                          onClick={() =>
                            switchContentSource(`main-${Date.now()}`)
                          }
                        >
                          <div
                            className="switch-arrows"
                            style={{
                              transform: contentFrom.includes("main-")
                                ? "rotate(720deg)"
                                : "",
                              transition: ".5s ease-in-out",
                            }}
                          ></div>
                          What's up
                        </div>
                        <div
                          className={`list-item fx-centered fx-shrink ${
                            contentFrom === "follows"
                              ? "selected-list-item"
                              : ""
                          }`}
                          onClick={() => switchContentSource("follows")}
                        >
                          <div className="user"></div>
                          Follows
                        </div>
                        {nostrUserTopics.map((item, index) => {
                          let status = checkTopicInList(item);
                          return (
                            <div
                              className={`list-item fx-centered fx-shrink ${
                                item === contentFrom ? "selected-list-item" : ""
                              }`}
                              onClick={() => {
                                switchContentSource(item);
                              }}
                              key={`${item}-${index}`}
                            >
                              {status && (
                                <img
                                  width="16"
                                  height="16"
                                  src={status.icon}
                                  alt={item}
                                />
                              )}
                              {!status && (
                                <img
                                  width="16"
                                  height="16"
                                  src={defaultTopicIcon}
                                  alt={item}
                                />
                              )}
                              {item}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="fx-centered">
                      {showArrows && (
                        <div
                          className="box-pad-h-s pointer slide-left"
                          onClick={slideRight}
                          style={{
                            background:
                              "linear-gradient(to left,var(--white) 20%,rgba(255,255,255,0) 100%)",
                          }}
                        >
                          <div
                            className="arrow"
                            style={{ transform: "rotate(-90deg)" }}
                          ></div>
                        </div>
                      )}
                      {showTabsSettings && (
                        <>
                          <div
                            className="round-icon-small round-icon-tooltip slide-right"
                            data-tooltip={"customize topics"}
                            onClick={() =>
                              nostrUserLoaded && nostrUser
                                ? setShowTopicsPicker(true)
                                : setShowLogin(true)
                            }
                          >
                            <p>&#xFF0B;</p>
                          </div>
                          <div
                            style={{ position: "relative" }}
                            className="slide-right"
                          >
                            <div
                              style={{ position: "relative" }}
                              className="round-icon-small round-icon-tooltip"
                              data-tooltip={
                                activeRelay
                                  ? `${activeRelay} is ${
                                      isLoading ? "connecting" : "connected"
                                    }`
                                  : "All relays"
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowRelaysList(!showRelaysList);
                              }}
                            >
                              <div className="server"></div>
                            </div>
                            {showRelaysList && (
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  bottom: "-5px",
                                  backgroundColor: "var(--dim-gray)",
                                  border: "none",
                                  transform: "translateY(100%)",
                                  maxWidth: "300px",
                                  rowGap: "12px",
                                }}
                                className="box-pad-h box-pad-v-m sc-s-18 fx-centered fx-col fx-start-v"
                              >
                                <h5>Relays</h5>
                                <button
                                  className={`btn-text-gray pointer fx-centered`}
                                  style={{
                                    width: "max-content",
                                    fontSize: "1rem",
                                    textDecoration: "none",
                                    color:
                                      activeRelay === "" ? "var(--c1)" : "",
                                    transition: ".4s ease-in-out",
                                  }}
                                  onClick={() => {
                                    switchActiveRelay("");
                                    setShowRelaysList(false);
                                  }}
                                >
                                  {isLoading && activeRelay === "" ? (
                                    <>Connecting...</>
                                  ) : (
                                    "All relays"
                                  )}
                                </button>
                                {nostrUser &&
                                  nostrUser.relays.length > 0 &&
                                  nostrUser.relays.map((relay) => {
                                    return (
                                      <button
                                        key={relay}
                                        className={`btn-text-gray pointer fx-centered `}
                                        style={{
                                          width: "max-content",
                                          fontSize: "1rem",
                                          textDecoration: "none",
                                          color:
                                            activeRelay === relay
                                              ? "var(--c1)"
                                              : "",
                                          transition: ".4s ease-in-out",
                                        }}
                                        onClick={() => {
                                          switchActiveRelay(relay);
                                          setShowRelaysList(false);
                                        }}
                                      >
                                        {isLoading && relay === activeRelay ? (
                                          <>Connecting...</>
                                        ) : (
                                          relay.split("wss://")[1]
                                        )}
                                      </button>
                                    );
                                  })}
                                {(!nostrUser ||
                                  (nostrUser &&
                                    nostrUser.relays.length === 0)) &&
                                  relays.map((relay) => {
                                    return (
                                      <button
                                        key={relay}
                                        className={`btn-text-gray pointer fx-centered`}
                                        style={{
                                          width: "max-content",
                                          fontSize: "1rem",
                                          textDecoration: "none",
                                          color:
                                            activeRelay === relay
                                              ? "var(--c1)"
                                              : "",
                                          transition: ".4s ease-in-out",
                                        }}
                                        onClick={() => {
                                          switchActiveRelay(relay);
                                          setShowRelaysList(false);
                                        }}
                                      >
                                        {isLoading && relay === activeRelay ? (
                                          <>Connecting..</>
                                        ) : (
                                          relay.split("wss://")[1]
                                        )}
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      <div
                        className="setting-24"
                        onClick={() => setShowTabsSettings(!showTabsSettings)}
                        style={{
                          rotate: showTabsSettings ? "45deg" : "initial",
                        }}
                      ></div>
                      {/* {showTabsSettings && <div className="close" style={{position: "static"}} onClick={() =>  setShowTabsSettings(false)}><div></div></div>} */}
                    </div>
                  </div>
                </div>
                {isLoading && (
                  <>
                    <div
                      className="fit-container fx-centered sc-s skeleton-container posts-card"
                      style={{
                        height: "200px",
                        backgroundColor: "var(--dim-gray)",
                        border: "none",
                      }}
                    ></div>
                    <div
                      className="fit-container fx-centered sc-s skeleton-container posts-card"
                      style={{
                        height: "200px",
                        backgroundColor: "var(--dim-gray)",
                        border: "none",
                      }}
                    ></div>
                  </>
                )}

                {!isLoading &&
                  mixedContent.map((item, index) => {
                    // if (index === 5)
                    //   return (
                    //     <div
                    //       key={index}
                    //       className="fit-container fx-centered fx-col  box-pad-v-m"
                    //     >
                    //       <h4 className="fit-container fx-start-h fx-centered box-pad-h">
                    //         Recommended curations
                    //       </h4>
                    //       <HomeCarouselNOSTR />
                    //     </div>
                    //   );
                    if (item.kind === 30023 && item.title)
                      return (
                        <div
                          key={item.id}
                          className="fit-container fx-centered "
                        >
                          <PostPreviewCardNOSTR item={item} />
                        </div>
                      );
                    if (item.l === "FLASH NEWS")
                      return (
                        <div
                          key={item.id}
                          className="fit-container fx-centered "
                        >
                          <FlashNewsPreviewCard item={item} />
                        </div>
                      );
                    if (item.l === "YAKI AI FEED")
                      return (
                        <div
                          key={item.id}
                          className="fit-container fx-centered "
                        >
                          <BuzzFeedPreviewCard item={item} />
                        </div>
                      );
                    if (item.kind === 34235)
                      return (
                        <div
                          key={item.id}
                          className="fit-container fx-centered "
                        >
                          <VideosPreviewCards item={item} />
                        </div>
                      );
                  })}

                {!isLoaded && (
                  <div className="fit-container box-pad-v fx-centered fx-col">
                    <p className="gray-c">Loading</p>
                    <LoadingDots />
                  </div>
                )}
                {!isLoading &&
                  isLoaded &&
                  posts.length === 0 &&
                  videos.length === 0 &&
                  flashnews.length === 0 &&
                  buzzFeed.length === 0 && (
                    <div
                      className="fit-container fx-centered fx-col"
                      style={{ height: "30vh" }}
                    >
                      <h4>No content to show!</h4>
                      <p
                        className="gray-c p-centered"
                        style={{ maxWidth: "500px" }}
                      >
                        There's no feeds on this :(
                      </p>
                    </div>
                  )}
              </div>
              <div
                className="box-pad-h-s fx-centered fx-col fx-start-v extras-homepage"
                style={{
                  position: "sticky",
                  top: `calc(95vh - ${
                    extrasRef.current?.getBoundingClientRect().height || 0
                  }px)`,

                  zIndex: "100",
                  width: "min(100%, 400px)",
                }}
                ref={extrasRef}
              >
                <div className="sticky fit-container">
                  <SearchbarNOSTR />
                </div>
                <div
                  className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
                  style={{
                    backgroundColor: "var(--c1-side)",
                    rowGap: "24px",
                    border: "none",
                  }}
                >
                  <h4>Important Flash News</h4>
                  <HomeFN flashnews={flashNews} />
                </div>
                <div
                  className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
                  style={{
                    backgroundColor: "var(--c1-side)",
                    rowGap: "24px",
                    border: "none",
                  }}
                >
                  <h4>Top curators</h4>
                  <TopCurators />
                </div>
                {topCreators.length > 0 && (
                  <div
                    className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      rowGap: "24px",
                      border: "none",
                    }}
                  >
                    <div className="fx-centered fx-start-h fx-col">
                      <h4>Top creators</h4>
                      <div className="fx-centered fx-start-h fit-container">
                        {!contentFrom.includes("main-") && (
                          <p className="c1-c p-medium">
                            (From{" "}
                            {contentFrom === "HOMEFEED"
                              ? "Timeline"
                              : contentFrom}
                            )
                          </p>
                        )}
                      </div>
                    </div>
                    <TopCreators top_creators={topCreators} />
                  </div>
                )}
                {recentTags.length > 0 && (
                  <div
                    className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      rowGap: "24px",
                      border: "none",
                    }}
                  >
                    <h4>Latest tags</h4>
                    <div className="fx-centered fx-start-h fx-wrap">
                      {recentTags.map((tag, index) => {
                        return (
                          <Link
                            key={index}
                            className="sticker sticker-small sticker-c1 pointer"
                            to={`/tags/${tag?.replace("#", "%23")}`}
                          >
                            {tag}
                          </Link>
                        );
                      })}
                    </div>
                    {recentTags.length === 0 && (
                      <div
                        className="fit-container fx-centered sc-s posts-card"
                        style={{
                          height: "200px",
                          backgroundColor: "transparent",
                          border: "none",
                        }}
                      >
                        <LoadingDots />
                      </div>
                    )}
                  </div>
                )}
                <div className="fx-centered box-pad-v-s fx-col fx-start-v">
                  {recentTags.length > 0 && sideContentType === "2" && (
                    <div className="fx-centered fx-start-h fx-wrap">
                      {recentTags.map((tag, index) => {
                        return (
                          <Link
                            key={index}
                            className="sticker sticker-small sticker-gray-gray pointer"
                            to={`/tags/${tag?.replace("#", "%23")}`}
                          >
                            {tag}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Footer />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// export default function NostrHome() {
//   const {
//     nostrKeys,
//     nostrUser,
//     nostrUserLoaded,
//     nostrAuthors,
//     addNostrAuthors,
//     nostrUserTopics,
//   } = useContext(Context);
//   const [posts, setPosts] = useState([]);
//   const [relays, setRelays] = useState(relaysOnPlatform);
//   const [activeRelay, setActiveRelay] = useState("");
//   const [usersRelays, setUsersRelays] = useState([...relaysOnPlatform]);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [recentTags, setRecentTags] = useState([]);
//   const [flashNews, setFlashNews] = useState([]);
//   const topCreators = useMemo(() => {
//     return getTopCreators(posts);
//   }, [posts]);
//   const [contentFrom, setContentFrom] = useState("HOMEFEED");
//   const [artsLastEventTime, setArtsLastEventTime] = useState(undefined);
//   const [showTopicsPicker, setShowTopicsPicker] = useState(
//     !localStorage.getItem("topic-popup") && nostrUser
//   );
//   const [relaySub, setRelaySub] = useState(false);
//   const [showRelaysList, setShowRelaysList] = useState(false);
//   const [showLogin, setShowLogin] = useState(false);
//   const [showArrows, setShowArrows] = useState(false);
//   const [scrollPX, setScrollPX] = useState(0);
//   const [sideContentType, setSideContentType] = useState("0");
//   const extrasRef = useRef(null);

//   useEffect(() => {
//     setIsLoaded(false);
//     initSub();
//     getFlashNews();
//     if (!localStorage.getItem("topic-popup") && nostrUser)
//       setShowTopicsPicker(true);
//   }, [activeRelay, contentFrom, artsLastEventTime, nostrUser]);

//   useEffect(() => {
//     let carousel_container = document.querySelector(".slider-list");
//     let carousel = document.querySelector(".slider-list .no-scrollbar");
//     if (carousel_container.clientWidth < carousel.scrollWidth) {
//       setShowArrows(true);
//       setScrollPX(0);
//     } else {
//       setShowArrows(false);
//       setScrollPX(0);
//     }
//   }, [nostrUserTopics]);

//   useEffect(() => {
//     const handleScroll = () => {
//       if (posts.length === 0) return;
//       if (
//         document.querySelector(".main-page-nostr-container").scrollHeight -
//           document.querySelector(".main-page-nostr-container").scrollTop -
//           60 >
//         document.documentElement.offsetHeight
//       ) {
//         return;
//       }
//       setArtsLastEventTime(posts[posts.length - 1].created_at);
//     };
//     document
//       .querySelector(".main-page-nostr-container")
//       ?.addEventListener("scroll", handleScroll);
//     return () =>
//       document
//         .querySelector(".main-page-nostr-container")
//         ?.removeEventListener("scroll", handleScroll);
//   }, [recentTags]);

//   const getFlashNews = async () => {
//     try {
//       // let NEW_PATH = "/api/v1/flashnews/new";
//       // let NMH_PATH = "/api/v1/flashnews/needs-more-help";
//       // let SEALED_PATH = "/api/v1/flashnews/sealed";

//       // let [NEW_FN, NMH_FN, SEALED_FN] = await Promise.all([
//       //   axios.get(API_BASE_URL + NEW_PATH, {params: {page: 0, elPerPage: 4}}),
//       //   axios.get(API_BASE_URL + NMH_PATH, {params: {page: 0, elPerPage: 4}}),
//       //   axios.get(API_BASE_URL + SEALED_PATH, {params: {page: 0, elPerPage: 4}}),
//       // ]);
//       // setFlashNews(
//       //   [
//       //     ...NEW_FN.data.flashnews,
//       //     ...NMH_FN.data.flashnews,
//       //     ...SEALED_FN.data.flashnews,
//       //   ].sort(
//       //     (item1, item2) =>
//       //       item2.flashnews.created_at - item1.flashnews.created_at
//       //   )
//       // );
//       let data = await axios.get(
//         API_BASE_URL + "/api/v1/mb/flashnews/important"
//       );

//       setFlashNews(data.data);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const initSub = async () => {
//     var sub = null;
//     let tags = getTags();
//     let events = [];
//     if (contentFrom === "HOMEFEED") {
//       if (activeRelay) {
//         const relay = await Relay.connect(activeRelay);
//         sub = relay.subscribe(
//           [{ kinds: [30023], limit: 20, until: artsLastEventTime }],
//           {
//             onevent(event) {
//               events.push(onArticlesEvent(event));
//             },
//             oneose() {
//               onEOSE(events);
//             },
//           }
//         );
//       } else {
//         sub = pool.subscribeMany(
//           nostrUser?.relays || relaysOnPlatform,
//           [{ kinds: [30023], limit: 20, until: artsLastEventTime }],
//           {
//             async onevent(event) {
//               if (event.kind === 30023) events.push(onArticlesEvent(event));
//               if (event.kind === 1) {
//                 let note_tree = await getNoteTree(event.content);
//                 events.push({ ...event, note_tree });
//               }
//             },
//             oneose() {
//               onEOSE(events);
//             },
//           }
//         );
//       }
//       setRelaySub(sub);
//       return;
//     }

//     if (contentFrom.includes("main-")) {
//       if (activeRelay) {
//         const relay = await Relay.connect(activeRelay);
//         sub = relay.subscribe(
//           [{ kinds: [30023], limit: 20, until: artsLastEventTime, "#t": tags }],
//           {
//             onevent(event) {
//               events.push(onArticlesEvent(event));
//             },
//             oneose() {
//               onEOSE(events);
//             },
//           }
//         );
//       } else {
//         sub = pool.subscribeMany(
//           !nostrUser
//             ? relaysOnPlatform
//             : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
//           [{ kinds: [30023], limit: 20, until: artsLastEventTime, "#t": tags }],
//           {
//             onevent(event) {
//               events.push(onArticlesEvent(event));
//             },
//             oneose() {
//               onEOSE(events);
//             },
//           }
//         );
//       }
//       setRelaySub(sub);
//       return;
//     }

//     if (contentFrom === "follows") {
//       if (activeRelay) {
//         const relay = await Relay.connect(activeRelay);
//         sub = relay.subscribe(
//           [
//             {
//               kinds: [30023],
//               authors:
//                 nostrUser && nostrUser.following.length > 0
//                   ? [...nostrUser.following.map((item) => item[1])]
//                   : [
//                       "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3",
//                     ],
//               limit: 20,
//               until: artsLastEventTime,
//             },
//           ],
//           {
//             onevent(event) {
//               events.push(onArticlesEvent(event));
//             },
//             oneose() {
//               onEOSE(events);
//             },
//           }
//         );
//       } else {
//         sub = pool.subscribeMany(
//           !nostrUser
//             ? relaysOnPlatform
//             : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
//           [
//             {
//               kinds: [30023],
//               authors:
//                 nostrUser && nostrUser.following.length > 0
//                   ? [...nostrUser.following.map((item) => item[1])]
//                   : [
//                       "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3",
//                     ],
//               limit: 20,
//               until: artsLastEventTime,
//             },
//           ],
//           {
//             onevent(event) {
//               events.push(onArticlesEvent(event));
//             },
//             oneose() {
//               onEOSE(events);
//             },
//           }
//         );
//         setRelaySub(sub);

//         return;
//       }

//       sub = pool.subscribeMany(
//         !nostrUser
//           ? relaysOnPlatform
//           : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
//         [
//           {
//             kinds: [30023],
//             authors:
//               nostrUser && nostrUser.following.length > 0
//                 ? [...nostrUser.following.map((item) => item[1])]
//                 : [
//                     "20986fb83e775d96d188ca5c9df10ce6d613e0eb7e5768a0f0b12b37cdac21b3",
//                   ],
//             limit: 20,
//             until: artsLastEventTime,
//           },
//         ],
//         {
//           onevent(event) {
//             events.push(onArticlesEvent(event));
//           },
//           oneose() {
//             onEOSE(events);
//           },
//         }
//       );
//       setRelaySub(sub);

//       return;
//     }

//     if (activeRelay) {
//       const relay = await Relay.connect(activeRelay);

//       sub = relay.subscribe(
//         [
//           {
//             kinds: [30023],
//             limit: 20,
//             until: artsLastEventTime,
//             "#t": tags,
//           },
//         ],
//         {
//           onevent(event) {
//             events.push(onArticlesEvent(event));
//           },
//           oneose() {
//             onEOSE(events);
//           },
//         }
//       );
//     } else {
//       sub = pool.subscribeMany(
//         !nostrUser
//           ? relaysOnPlatform
//           : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
//         [{ kinds: [30023], limit: 20, until: artsLastEventTime, "#t": tags }],
//         {
//           onevent(event) {
//             events.push(onArticlesEvent(event));
//           },
//           oneose() {
//             onEOSE(events);
//           },
//         }
//       );
//     }
//     setRelaySub(sub);
//     return;
//   };
//   const getTags = () => {
//     if (contentFrom.includes("main-")) {
//       let tempArray = shuffleArray(TopicsTags);
//       let tempArray_2 = tempArray.splice(0, 5);
//       // return tempArray_2
//       //   .map((item) => item.main_tag)
//       //   .flat()
//       return shuffleArray(
//         tempArray_2.map((item) => [item.main_tag, ...item.sub_tags]).flat()
//       );
//     }
//     if (contentFrom === "follows") {
//       return [];
//     }
//     let searchedTag = TopicsTags.find(
//       (item) => item.main_tag === contentFrom
//       // item.main_tag === contentFrom ||
//       // item.sub_tags.find((item_) => item_ === contentFrom)
//     );
//     if (searchedTag) {
//       return [searchedTag.main_tag, ...searchedTag.sub_tags];
//     }
//     return [contentFrom];
//   };
//   const onArticlesEvent = (event) => {
//     if (bannedList.includes(event.pubkey)) return;
//     let author_img = "";
//     let author_name = getBech32("npub", event.pubkey).substring(0, 10);
//     let author_pubkey = event.pubkey;
//     let thumbnail = "";
//     let title = "";
//     let summary = "";
//     let from = "";
//     let contentSensitive = false;
//     let postTags = [];
//     let d = "";
//     let modified_date = new Date(event.created_at * 1000).toISOString();
//     let added_date = new Date(event.created_at * 1000).toISOString();
//     let published_at = event.created_at;
//     for (let tag of event.tags) {
//       if (tag[0] === "published_at") {
//         published_at = tag[1];
//         added_date =
//           tag[1].length > 10
//             ? new Date(parseInt(tag[1])).toISOString()
//             : new Date(parseInt(tag[1]) * 1000).toISOString();
//       }
//       if (tag[0] === "image") thumbnail = tag[1];
//       if (tag[0] === "client") from = tag[1];
//       if (tag[0] === "title") title = tag[1];
//       if (tag[0] === "summary") summary = tag[1];
//       if (tag[0] === "t") postTags.push(tag[1]);
//       if (tag[0] === "L" && tag[1] === "content-warning")
//         contentSensitive = true;
//       if (tag[0] === "d") d = tag[1];
//     }

//     let naddr = nip19.naddrEncode({
//       identifier: d,
//       pubkey: author_pubkey,
//       kind: 30023,
//     });

//     setPosts((_posts) => {
//       let index = _posts.findIndex((item) => item.d === d);
//       let newP = Array.from(_posts);
//       if (index === -1)
//         newP = [
//           ...newP,
//           {
//             id: event.id,
//             thumbnail: thumbnail || getImagePlaceholder(),
//             summary,
//             author_img,
//             author_pubkey,
//             author_name,
//             title,
//             added_date,
//             created_at: event.created_at,
//             modified_date,
//             published_at,
//             postTags,
//             naddr,
//             d,
//             contentSensitive,
//             from: from || "N/A",
//           },
//         ];
//       if (index !== -1) {
//         if (_posts[index].created_at < event.created_at) {
//           newP.splice(index, 1);
//           newP.push({
//             id: event.id,
//             thumbnail: thumbnail || getImagePlaceholder(),
//             summary,
//             author_img,
//             author_pubkey,
//             author_name,
//             title,
//             added_date,
//             created_at: event.created_at,
//             modified_date,
//             published_at,
//             postTags,
//             naddr,
//             d,
//             contentSensitive,
//             from: from || "N/A",
//           });
//         }
//       }

//       newP = newP.sort(
//         (item_1, item_2) => item_2.created_at - item_1.created_at
//       );

//       return newP;
//     });
//     setIsLoading(false);
//     return {
//       id: event.id,
//       thumbnail: thumbnail || getImagePlaceholder(),
//       summary,
//       author_img,
//       author_pubkey,
//       author_name,
//       title,
//       added_date,
//       created_at: event.created_at,
//       modified_date,
//       published_at,
//       postTags,
//       naddr,
//       d,
//       contentSensitive,
//       from: from || "N/A",
//     };
//   };
//   const onEOSE = (events) => {
//     if (events) {
//       let filteredEvents = events.filter((event) => event);
//       addNostrAuthors(filteredEvents.map((item) => item.author_pubkey));
//       setRecentTags(
//         [
//           ...new Set(
//             [
//               ...filteredEvents.map((item) => item.postTags.flat()),
//               ...recentTags,
//             ].flat()
//           ),
//         ].splice(0, 30)
//       );
//     }
//     if (activeRelay) pool.close([activeRelay]);
//     if (!activeRelay)
//       pool.close(
//         !nostrUser
//           ? relaysOnPlatform
//           : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])]
//       );
//     setIsLoaded(true);
//     setIsLoading(false);
//     // relaySub.close();
//   };

//   const switchContentSource = (source) => {
//     // if (!isLoaded) return;
//     if (source === contentFrom) return;
//     // relaySub.close();
//     if (activeRelay) pool.close([activeRelay]);
//     if (!activeRelay)
//       pool.close(
//         !nostrUser
//           ? relaysOnPlatform
//           : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])]
//       );
//     setPosts([]);
//     setIsLoading(true);
//     setRecentTags([]);
//     setArtsLastEventTime(undefined);
//     setContentFrom(source);
//   };
//   const switchActiveRelay = (source) => {
//     // if (!isLoaded) return;
//     if (source === activeRelay) return;
//     // relaySub.close();
//     setIsLoading(true);
//     setPosts([]);
//     setRecentTags([]);
//     setActiveRelay(source);

//     setArtsLastEventTime(undefined);
//   };
//   const handleRelaySelection = (e) => {
//     document.querySelector(".main-page-nostr-container").scrollTo(0, 0);
//     setActiveRelay(e.target.value);
//     setArtsLastEventTime(undefined);
//     setIsLoading(true);
//     setPosts([]);
//     setRecentTags([]);
//   };
//   const checkTopicInList = (topic) => {
//     return TopicsTags.find((item) => item.main_tag === topic);
//   };

//   const slideRight = () => {
//     let carousel_container = document.querySelector(".slider-list");
//     let carousel = document.querySelector(".slider-list .no-scrollbar");
//     // console.log(carousel_container.clientWidth, scrollPX, carousel.scrollWidth);
//     let pxToSlide =
//       scrollPX + 100 < carousel.scrollWidth - carousel_container.clientWidth
//         ? scrollPX + 100
//         : carousel.scrollWidth - carousel_container.clientWidth;
//     setScrollPX(pxToSlide);
//   };
//   const slideLeft = () => {
//     let carousel_container = document.querySelector(".slider-list");
//     let carousel = document.querySelector(".slider-list .no-scrollbar");
//     // console.log(carousel_container.clientWidth, scrollPX);
//     let pxToSlide = scrollPX - 100 > 0 ? scrollPX - 100 : 0;
//     setScrollPX(pxToSlide);
//   };
//   return (
//     <div style={{ overflow: "auto" }}>
//       <Helmet>
//         <title>Yakihonne | Home</title>
//         <meta
//           name="description"
//           content={
//             "A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
//           }
//         />
//         <meta
//           property="og:description"
//           content={
//             "A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
//           }
//         />

//         <meta property="og:url" content={`https://yakihonne.com`} />
//         <meta property="og:type" content="website" />
//         <meta property="og:site_name" content="Yakihonne" />
//         <meta property="og:title" content="Yakihonne | Home" />
//         <meta property="twitter:title" content="Yakihonne | Home" />
//         <meta
//           property="twitter:description"
//           content={
//             "A censorship and data ownership free protocol, you‘ll enjoy a fully decentralized media experience."
//           }
//         />
//       </Helmet>
//       <div className="fit-container fx-centered">
//         <SidebarNOSTR />
//         <main
//           className="main-page-nostr-container"
//           onClick={(e) => {
//             e.stopPropagation();
//             // toggleColorScheme()
//             setShowRelaysList(false);
//           }}
//           style={{ padding: 0 }}
//         >
//           {showTopicsPicker && (
//             <TopicTagsSelection exit={() => setShowTopicsPicker(false)} />
//           )}
//           {showLogin && <LoginNOSTR exit={() => setShowLogin(false)} />}
//           <YakiIntro />
//           <ArrowUp />
//           {/* <div className="fit-container box-marg-s"> */}
//           <HomeCarouselNOSTR />
//           {/* </div> */}
//           {/* <NavbarNOSTR /> */}
//           {/* <div className="fit-container box-marg-s">
//           <HomeFNMobile flashnews={flashNews} />
//         </div> */}
//           <div className="fit-container fx-centered fx-start-h">
//             <div
//               style={{ width: "min(100%,1400px)" }}
//               className="fx-centered fx-start-v fx-start-h"
//             >
//               <div
//                 style={{ width: "min(100%, 600px)" }}
//                 className={`fx-centered  fx-wrap `}
//               >
//                 <div
//                   className="fit-container fx-centered box-pad-v box-pad-h-m sticky"
//                   style={{
//                     position: "sticky",
//                     // top: "-34px",
//                     backgroundColor: "var(--white)",
//                     zIndex: "1000",
//                   }}
//                 >
//                   <div className="fit-container fx-scattered">
//                     {showArrows && (
//                       <div
//                         className="box-pad-h-s pointer slide-right"
//                         onClick={slideLeft}
//                       >
//                         <div
//                           className="arrow"
//                           style={{ transform: "rotate(90deg)" }}
//                         ></div>
//                       </div>
//                     )}
//                     <div
//                       className="fx-centered fx-start-h no-scrollbar slider-list"
//                       style={{
//                         overflow: "hidden",
//                         borderBottom: "1px solid #444444",
//                       }}
//                     >
//                       <div
//                         className="fx-centered fx-start-h no-scrollbar"
//                         style={{
//                           transform: `translateX(-${scrollPX}px)`,
//                           transition: ".3s ease-in-out",
//                           columnGap: "32px",
//                         }}
//                       >
//                         <div
//                           className={`list-item fx-centered fx-shrink ${
//                             contentFrom.includes("main-")
//                               ? "selected-list-item"
//                               : ""
//                           }`}
//                           onClick={() =>
//                             switchContentSource(`main-${Date.now()}`)
//                           }
//                         >
//                           <div
//                             className="switch-arrows"
//                             style={{
//                               // filter: "invert()",
//                               transform: contentFrom.includes("main-")
//                                 ? "rotate(720deg)"
//                                 : "",
//                               transition: ".5s ease-in-out",
//                             }}
//                           ></div>
//                           What's up
//                         </div>
//                         <div
//                           className={`list-item fx-centered fx-shrink ${
//                             contentFrom === "HOMEFEED"
//                               ? "selected-list-item"
//                               : ""
//                           }`}
//                           onClick={() => switchContentSource("HOMEFEED")}
//                         >
//                           {/* <div className="home"></div> */}
//                           Timeline
//                         </div>

//                         <div
//                           className={`list-item fx-centered fx-shrink ${
//                             contentFrom === "follows"
//                               ? "selected-list-item"
//                               : ""
//                           }`}
//                           onClick={() => switchContentSource("follows")}
//                         >
//                           {/* <div className="user"></div> */}
//                           Follows
//                         </div>
//                         {nostrUserTopics.map((item, index) => {
//                           let status = checkTopicInList(item);
//                           return (
//                             <div
//                               className={`list-item fx-centered fx-shrink ${
//                                 item === contentFrom ? "selected-list-item" : ""
//                               }`}
//                               onClick={() => {
//                                 switchContentSource(item);
//                               }}
//                               key={`${item}-${index}`}
//                             >
//                               {/* {status && (
//                             <img
//                               width="16"
//                               height="16"
//                               src={status.icon}
//                               alt={item}
//                             />
//                           )}
//                           {!status && (
//                             <img
//                               width="16"
//                               height="16"
//                               src={defaultTopicIcon}
//                               alt={item}
//                             />
//                           )} */}
//                               {item}
//                             </div>
//                           );
//                         })}
//                       </div>
//                     </div>
//                     <div className="fx-centered">
//                       {showArrows && (
//                         <div
//                           className="box-pad-h-s pointer slide-left"
//                           onClick={slideRight}
//                           style={{
//                             background:
//                               "linear-gradient(to left,var(--white) 20%,rgba(255,255,255,0) 100%)",
//                           }}
//                         >
//                           <div
//                             className="arrow"
//                             style={{ transform: "rotate(-90deg)" }}
//                           ></div>
//                         </div>
//                       )}
//                       <div
//                         className="round-icon-small round-icon-tooltip"
//                         data-tooltip={"customize topics"}
//                         onClick={() =>
//                           nostrUserLoaded && nostrUser
//                             ? setShowTopicsPicker(true)
//                             : setShowLogin(true)
//                         }
//                       >
//                         <p>&#xFF0B;</p>
//                       </div>
//                       <div style={{ position: "relative" }}>
//                         <div
//                           style={{ position: "relative" }}
//                           className="round-icon-small round-icon-tooltip"
//                           data-tooltip={
//                             activeRelay
//                               ? `${activeRelay} is ${
//                                   isLoading ? "connecting" : "connected"
//                                 }`
//                               : "All relays"
//                           }
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             setShowRelaysList(!showRelaysList);
//                           }}
//                         >
//                           <div className="server"></div>
//                         </div>
//                         {showRelaysList && (
//                           <div
//                             style={{
//                               position: "absolute",
//                               right: 0,
//                               bottom: "-5px",
//                               backgroundColor: "var(--dim-gray)",
//                               border: "none",
//                               transform: "translateY(100%)",
//                               maxWidth: "300px",
//                               rowGap: "12px",
//                             }}
//                             className="box-pad-h box-pad-v-m sc-s-18 fx-centered fx-col fx-start-v"
//                           >
//                             <h5>Relays</h5>
//                             <button
//                               className={`btn-text-gray pointer fx-centered`}
//                               style={{
//                                 width: "max-content",
//                                 fontSize: "1rem",
//                                 textDecoration: "none",
//                                 color: activeRelay === "" ? "var(--c1)" : "",
//                                 transition: ".4s ease-in-out",
//                               }}
//                               onClick={() => {
//                                 switchActiveRelay("");
//                                 setShowRelaysList(false);
//                               }}
//                             >
//                               {isLoading && activeRelay === "" ? (
//                                 <>Connecting...</>
//                               ) : (
//                                 "All relays"
//                               )}
//                             </button>
//                             {nostrUser &&
//                               nostrUser.relays.length > 0 &&
//                               nostrUser.relays.map((relay) => {
//                                 return (
//                                   <button
//                                     key={relay}
//                                     className={`btn-text-gray pointer fx-centered `}
//                                     style={{
//                                       width: "max-content",
//                                       fontSize: "1rem",
//                                       textDecoration: "none",
//                                       color:
//                                         activeRelay === relay
//                                           ? "var(--c1)"
//                                           : "",
//                                       transition: ".4s ease-in-out",
//                                     }}
//                                     onClick={() => {
//                                       switchActiveRelay(relay);
//                                       setShowRelaysList(false);
//                                     }}
//                                   >
//                                     {isLoading && relay === activeRelay ? (
//                                       <>Connecting...</>
//                                     ) : (
//                                       relay.split("wss://")[1]
//                                     )}
//                                   </button>
//                                 );
//                               })}
//                             {(!nostrUser ||
//                               (nostrUser && nostrUser.relays.length === 0)) &&
//                               relays.map((relay) => {
//                                 return (
//                                   <button
//                                     key={relay}
//                                     className={`btn-text-gray pointer fx-centered`}
//                                     style={{
//                                       width: "max-content",
//                                       fontSize: "1rem",
//                                       textDecoration: "none",
//                                       color:
//                                         activeRelay === relay
//                                           ? "var(--c1)"
//                                           : "",
//                                       transition: ".4s ease-in-out",
//                                     }}
//                                     onClick={() => {
//                                       switchActiveRelay(relay);
//                                       setShowRelaysList(false);
//                                     }}
//                                   >
//                                     {isLoading && relay === activeRelay ? (
//                                       <>Connecting..</>
//                                     ) : (
//                                       relay.split("wss://")[1]
//                                     )}
//                                   </button>
//                                 );
//                               })}
//                           </div>
//                         )}
//                       </div>
//                       {/* <div className="setting-24"></div> */}
//                     </div>
//                   </div>
//                 </div>
//                 {isLoading && (
//                   <>
//                     <div
//                       className="fit-container fx-centered sc-s skeleton-container posts-card"
//                       style={{
//                         height: "200px",
//                         backgroundColor: "var(--dim-gray)",
//                         border: "none",
//                       }}
//                     ></div>
//                     <div
//                       className="fit-container fx-centered sc-s skeleton-container posts-card"
//                       style={{
//                         height: "200px",
//                         backgroundColor: "var(--dim-gray)",
//                         border: "none",
//                       }}
//                     ></div>
//                   </>
//                 )}

//                 {!isLoading &&
//                   posts.map((item) => {
//                     if (item.title)
//                       return (
//                         <div
//                           key={item.id}
//                           className="fit-container fx-centered "
//                         >
//                           <PostPreviewCardNOSTR item={item} />
//                         </div>
//                       );
//                   })}

//                 {!isLoaded && (
//                   <div className="fit-container box-pad-v fx-centered fx-col">
//                     <p className="gray-c">Loading</p>
//                     <LoadingDots />
//                   </div>
//                 )}
//                 {!isLoading && isLoaded && posts.length === 0 && (
//                   <div
//                     className="fit-container fx-centered fx-col"
//                     style={{ height: "30vh" }}
//                   >
//                     <h4>No content to show!</h4>
//                     <p
//                       className="gray-c p-centered"
//                       style={{ maxWidth: "500px" }}
//                     >
//                       There's no article on this :(
//                     </p>
//                   </div>
//                 )}
//               </div>
//               <div
//                 className="box-pad-h-m fx-centered fx-col fx-start-v extras-homepage"
//                 style={{
//                   position: "sticky",
//                   top: `calc(95vh - ${
//                     extrasRef.current?.getBoundingClientRect().height || 0
//                   }px)`,
//                   // backgroundColor: "var(--white)",
//                   zIndex: "100",
//                   width: "min(100%, 400px)",
//                 }}
//                 ref={extrasRef}
//               >
//                 <div className="sticky fit-container">
//                   <SearchbarNOSTR />
//                 </div>
//                 <div
//                   className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
//                   style={{
//                     backgroundColor: "var(--c1-side)",
//                     rowGap: "24px",
//                     border: "none",
//                   }}
//                 >
//                   <h4>Important Flash News</h4>
//                   <HomeFN flashnews={flashNews} />
//                 </div>
//                 <div
//                   className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
//                   style={{
//                     backgroundColor: "var(--c1-side)",
//                     rowGap: "24px",
//                     border: "none",
//                   }}
//                 >
//                   <h4>Top curators</h4>
//                   <TopCurators />
//                 </div>
//                 <div
//                   className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
//                   style={{
//                     backgroundColor: "var(--c1-side)",
//                     rowGap: "24px",
//                     border: "none",
//                   }}
//                 >
//                   <div className="fx-centered fx-start-h fx-col">
//                     <h4>Top creators</h4>
//                     <div className="fx-centered fx-start-h fit-container">
//                       {!contentFrom.includes("main-") && (
//                         <p className="c1-c p-medium">
//                           (From{" "}
//                           {contentFrom === "HOMEFEED"
//                             ? "Timeline"
//                             : contentFrom}
//                           )
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                   <TopCreators top_creators={topCreators} />
//                 </div>
//                 <div
//                   className="fit-container sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
//                   style={{
//                     backgroundColor: "var(--c1-side)",
//                     rowGap: "24px",
//                     border: "none",
//                   }}
//                 >
//                   <h4>Latest tags</h4>
//                   <div className="fx-centered fx-start-h fx-wrap">
//                     {recentTags.map((tag, index) => {
//                       return (
//                         <Link
//                           key={index}
//                           className="sticker sticker-small sticker-c1 pointer"
//                           to={`/tags/${tag?.replace("#", "%23")}`}
//                         >
//                           {tag}
//                         </Link>
//                       );
//                     })}
//                   </div>

//                   {recentTags.length === 0 && (
//                     <div
//                       className="fit-container fx-centered sc-s posts-card"
//                       style={{
//                         height: "200px",
//                         backgroundColor: "transparent",
//                         border: "none",
//                       }}
//                     >
//                       <LoadingDots />
//                     </div>
//                   )}
//                 </div>
//                 <div className="fx-centered box-pad-v-s fx-col fx-start-v">
//                   {recentTags.length > 0 && sideContentType === "2" && (
//                     <div className="fx-centered fx-start-h fx-wrap">
//                       {recentTags.map((tag, index) => {
//                         return (
//                           <Link
//                             key={index}
//                             className="sticker sticker-small sticker-gray-gray pointer"
//                             to={`/tags/${tag?.replace("#", "%23")}`}
//                           >
//                             {tag}
//                           </Link>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </div>
//                 <Footer />
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }
