import React, { useContext, useEffect, useState } from "react";
import relaysOnPlatform from "../../Content/Relays";
import { nip19 } from "nostr-tools";
import {
  filterRelays,
  getEmptyNostrUser,
  getParsed3000xContent,
} from "../../Helpers/Encryptions";
import TopicElementNOSTR from "./TopicElementNOSTR";
import { SimplePool } from "nostr-tools";
import { Context } from "../../Context/Context";
const pool = new SimplePool();

export default function HomeCarouselNOSTR({ homeCarousel = null }) {
  const { setGlobalCuration, addNostrAuthors, nostrUser } = useContext(Context);
  const [carouselElements, setCarouselElements] = useState(homeCarousel || []);
  const [isLoaded, setIsLoaded] = useState(false);
  const [translationIndex, setTranslationIndex] = useState(0);
  const [carouselState, setCarouselState] = useState(true);

  useEffect(() => {
    let dataFetching = async () => {
      try {
        let tempCuration = [];
        let sub = pool.subscribeMany(
          !nostrUser
            ? relaysOnPlatform
            : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])],
          [{ kinds: [30004] }],
          {
            onevent(curation) {
              let parsedContent = getParsed3000xContent(curation.tags);

              if (parsedContent.items.length > 0) {
                let identifier = curation.tags.find((tag) => tag[0] === "d")[1];
                let naddr = nip19.naddrEncode({
                  identifier: identifier,
                  pubkey: curation.pubkey,
                  kind: curation.kind,
                });

                let modified_date = new Date(
                  curation.created_at * 1000
                ).toISOString();
                let added_date = new Date(
                  curation.created_at * 1000
                ).toISOString();
                let published_at = curation.created_at;
                for (let tag of curation.tags) {
                  if (tag[0] === "published_at") {
                    published_at = tag[1] || published_at;
                    added_date =
                      tag[1].length > 10
                        ? new Date(published_at).toISOString()
                        : new Date(published_at * 1000).toISOString();
                  }
                }
                setCarouselElements((prev) => {
                  let index = prev.findIndex(
                    (item) => item.identifier === identifier
                  );

                  let newP = Array.from(prev);
                  if (index === -1)
                    newP = [
                      ...newP,
                      {
                        ...curation,
                        modified_date,
                        added_date,
                        published_at,
                        naddr,
                        author: {
                          name: curation.pubkey.substring(0, 10),
                          img: "",
                        },
                        identifier,
                      },
                    ];
                  if (index !== -1) {
                    if (prev[index].created_at < curation.created_at) {
                      newP.splice(index, 1);
                      newP.push({
                        ...curation,
                        modified_date,
                        added_date,
                        published_at,
                        naddr,
                        author: {
                          name: curation.pubkey.substring(0, 10),
                          img: "",
                        },
                        identifier,
                      });
                    }
                  }

                  newP = newP.sort(
                    (item_1, item_2) => item_2.created_at - item_1.created_at
                  );
                  tempCuration = Array.from(newP);
                  return newP;
                });
                setIsLoaded(true);
              }
            },
            oneose() {
              setIsLoaded(true);
              addNostrAuthors(tempCuration.map((item) => item.pubkey));
              setGlobalCuration(tempCuration);
              pool.close(
                !nostrUser
                  ? relaysOnPlatform
                  : [...filterRelays(relaysOnPlatform, nostrUser?.relays || [])]
              );
              sub.close();
            },
          }
        );
      } catch (err) {
        console.log(err);
        setIsLoaded(true);
      }
    };
    if (homeCarousel) {
      setIsLoaded(true);
      return;
    }
    dataFetching();
  }, []);
  // useEffect(() => {
  //   let dataFetching = async () => {
  //     try {
  //       const relay = relayInit(relaysOnPlatform[0]);
  //       await relay.connect();
  //       // let curationsInNostr = await relay.list([{ kinds: [31000] }]);
  //       let curationsInNostr = await relay.list([
  //         { kinds: [30001], "#c": ["curation"] },
  //       ]);

  //       let tempCurationsInNostr = await Promise.all(
  //         curationsInNostr.map(async (item) => {
  //           let author = await getUserFromNOSTR(item.pubkey);
  //           let parsedAuthor = JSON.parse(author.content) || {};
  //           let naddr = nip19.naddrEncode({
  //             identifier: item.tags.find(tag => tag[0] === "d")[1],
  //             pubkey: item.pubkey,
  //             kind: 30001,
  //           });

  //           return {
  //             ...item,
  //             naddr,
  //             author: {
  //               name: parsedAuthor.name || item.pubkey.substring(0, 10),
  //               img: parsedAuthor.picture || "",
  //             },
  //           };
  //         })
  //       );

  //       setCarouselElements([...tempCurationsInNostr.reverse()]);
  //       setIsLoaded(true);
  //       return;
  //     } catch (err) {
  //       console.log(err);
  //       setIsLoaded(true);
  //     }
  //   };
  //   if (homeCarousel) {
  //     setIsLoaded(true);
  //     return;
  //   }
  //   dataFetching();
  // }, []);

  useEffect(() => {
    var timeout = setTimeout(null);
    if (isLoaded && carouselState) {
      timeout = setTimeout(() => {
        if (translationIndex < carouselElements.length - 2)
          setTranslationIndex(translationIndex + 1);
        else setTranslationIndex(0);
      }, 4000);
    } else {
      clearTimeout(timeout);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [translationIndex, carouselState, isLoaded]);

  const nextSlide = () => {
    setCarouselState(false);
    if (
      carouselElements.length > 1 &&
      translationIndex < carouselElements.length - 1
    )
      setTranslationIndex(translationIndex + 1);
    else {
      setTranslationIndex(0);
    }
  };
  const prevSlide = () => {
    setCarouselState(false);
    if (translationIndex > 0) setTranslationIndex(translationIndex - 1);
  };

  const getUserFromNOSTR = async (pubkey) => {
    try {
      let author = await pool.get(relaysOnPlatform, {
        kinds: [0],
        authors: [pubkey],
      });

      return author || getEmptyNostrUser(pubkey);
    } catch (err) {
      console.log(err);
    }
  };

  return null;
  if (!isLoaded)
    return (
      <div
        className="fit-container fx-centered sc-s skeleton-container"
        style={{
          height: "100px",
          backgroundColor: "var(--dim-gray)",
          border: "none",
        }}
      >
        {/* <span className="loader"></span> */}
      </div>
    );
  if (carouselElements.length === 0) return;
  return (
    <div className="fit-container fx-scattered carousel-container">
      <div className="browsing-arrows-mobile">
        {/* <div className="browsing-arrow" onClick={prevSlide}> */}
        <div
          className="arrow"
          style={{ transform: "rotate(90deg)" }}
          onClick={prevSlide}
        ></div>
        {/* </div> */}
        {/* <div className="browsing-arrow" onClick={nextSlide}> */}
        <div
          className="arrow"
          style={{ transform: "rotate(-90deg)" }}
          onClick={nextSlide}
        ></div>
        {/* </div> */}
      </div>
      {/* <div className="browsing-arrow" onClick={prevSlide}> */}
      <div
        className="arrow"
        style={{ transform: "rotate(90deg)" }}
        onClick={prevSlide}
      ></div>
      {/* </div> */}
      <div
        style={{
          overflow: "hidden",
          columnGap: "32px",
          width: "100%",
        }}
        className="carousel"
      >
        <div
          className="fx-centered fx-start-h fit-container carousel-inner-container"
          style={{
            columnGap: "32px",
            transition: ".4s ease-in-out",
            transform: `translateX(-${485 * translationIndex}px)`,
          }}
        >
          {carouselElements.map((item) => {
            return <TopicElementNOSTR key={item.id} topic={item} />;
          })}
        </div>
        <div
          className="fx-centered fx-start-h fit-container carousel-inner-container-mobile"
          style={{
            columnGap: "0",

            transition: ".4s ease-in-out",
            transform: `translateX(-${100 * translationIndex}%)`,
          }}
        >
          {carouselElements.map((item) => {
            return <TopicElementNOSTR key={item.id} topic={item} />;
          })}
        </div>
      </div>
      {/* <div className="browsing-arrow" onClick={nextSlide}> */}
      <div
        className="arrow"
        style={{ transform: "rotate(-90deg)" }}
        onClick={nextSlide}
      ></div>
      {/* </div> */}
    </div>
  );
}
