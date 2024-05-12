import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Date_ from "../Date_";
import { Context } from "../../Context/Context";
import UserProfilePicNOSTR from "./UserProfilePicNOSTR";
import { getBech32 } from "../../Helpers/Encryptions";

export default function VideosPreviewCards({ item, duration = true }) {
  // return (
  //   <Link
  //     key={item.id}
  //     className="sc-s-18 fx-centered fit-container fx-centered box-pad-h-m box-pad-v-m fx-stretch"
  //     to={`/videos/${item.naddr}`}
  //   >
  //     <div
  //       className="fx-scattered fx-col"
  //       style={{
  //        rowGap: 0
  //       }}
  //     >
  //       <div>
  //         <p className="p-two-lines" style={{ color: "white" }}>
  //           {item.title}
  //         </p>
  //         <p className="p-two-lines gray-c p-medium">{item.content}</p>
  //       </div>
  //       <div className="fit-container fx-scattered">
  //         <div className="fx-centered">
  //           <AuthorPreview pubkey={item.pubkey} />
  //           <p className="p-small gray-c">&#9679;</p>
  //           <p className="gray-c p-medium">
  //             <Date_
  //               toConvert={new Date(item.published_at * 1000)}
  //               time={true}
  //             />
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //     <Link
  //       key={item.id}
  //       className="sc-s-18 fx-centered bg-img cover-bg fit-container fx-centered fx-end-h fx-end-v"
  //       to={`/videos/${item.naddr}`}
  //       style={{
  //         aspectRatio: "16/9",
  //         minWidth: "250px",
  //         width: "250px",
  //         backgroundImage: `url(${item.image})`,
  //         backgroundColor: "black",
  //         border: "none",
  //       }}
  //     >
  //       <div
  //         className="fit-container fx-centered fx-col box-pad-h-m fx-start-v fx-end-h box-pad-v-m"
  //         style={{
  //           height: "100%",
  //           background:
  //             "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 87%)",
  //           position: "relative",
  //         }}
  //       >
  //         <div
  //           className="fx-centered"
  //           style={{
  //             position: "absolute",
  //             left: 0,
  //             top: 0,
  //             width: "100%",
  //             height: "100%",
  //           }}
  //         >
  //           <div className="play-vid-58"></div>
  //         </div>

  //         <div className="fit-container fx-centered fx-end-h">
  //           <div
  //             className="sticker sticker-normal"
  //             style={{
  //               backgroundColor: "black",
  //               color: "white",
  //             }}
  //           >
  //             {item.duration}
  //           </div>
  //         </div>
  //       </div>
  //     </Link>
  //   </Link>
  // );
  return (
    <Link
      key={item.id}
      className="sc-s-18 fx-centered bg-img cover-bg fit-container fx-centered fx-end-h fx-end-v"
      to={`/videos/${item.naddr}`}
      style={{
        aspectRatio: "16/9",
        backgroundImage: `url(${item.image})`,
        backgroundColor: "black",
      }}
    >
      <div
        className="fit-container fx-centered fx-col box-pad-h-m fx-start-v fx-end-h box-pad-v-m"
        style={{
          height: "100%",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 87%)",
          position: "relative",
        }}
      >
        <div className="fx-centered" style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%"
        }}>
          <div className="play-vid-58"></div>
        </div>
        <p className="p-two-lines" style={{ color: "white" }}>
          {item.title}
        </p>
        <div className="fit-container fx-scattered">
          <div className="fx-centered">
            <AuthorPreview pubkey={item.pubkey} />
            <p className="p-small gray-c">&#9679;</p>
            <p className="gray-c p-medium">
              <Date_ toConvert={new Date(item.published_at * 1000)} time={true}/>
            </p>
          </div>
        {duration &&  <div
            className="sticker sticker-normal"
            style={{
              backgroundColor: "black",
              color: "white",
            }}
          >
            {item.duration}
          </div>}
        </div>
      </div>

    </Link>
  );
}

const AuthorPreview = ({ pubkey }) => {
  const { nostrAuthors, getNostrAuthor } = useContext(Context);
  const [author, setAuthor] = useState({
    pubkey,
    name: getBech32("npub", pubkey).substring(0, 10),
    picture: "",
  });
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (!isLoaded) {
      let auth = getNostrAuthor(pubkey);
      if (auth) {
        setAuthor(auth);
        setIsLoaded(true);
      }
    }
  }, [nostrAuthors]);

  return (
    <div className="fx-centered">
      <UserProfilePicNOSTR
        size={16}
        ring={false}
        img={author.picture}
        mainAccountUser={false}
        user_id={author.pubkey}
      />

      <p className="p-one-line p-medium" style={{ color: "white" }}>
        {author.name}
      </p>
    </div>
  );
};
