import React, { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import ArrowUp from "../../Components/ArrowUp";
import { Context } from "../../Context/Context";
import axiosInstance from "../../Helpers/HTTP_Client";

export default function UserLevels() {
  const { nostrKeys } = useContext(Context);
  const [stats, setStats] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await axiosInstance.get("/api/v1/yaki-chest/stats");
        console.log(data.data);
      } catch (err) {
        console.log(err);
        setIsLoaded(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <Helmet>
        <title>Yakihonne | Yaki points</title>
        <meta
          name="description"
          content={"Check how you're doing with Yakihonne's points system"}
        />
        <meta
          property="og:description"
          content={"Check how you're doing with Yakihonne's points system"}
        />

        <meta property="og:url" content={`https://yakihonne.com/yaki-points`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yakihonne" />
        <meta property="og:title" content="Yakihonne | Yaki points" />
        <meta property="twitter:title" content="Yakihonne | Yaki points" />
        <meta
          property="twitter:description"
          content={"Check how you're doing with Yakihonne's points system"}
        />
      </Helmet>
      <div className="fit-container fx-centered">
        <SidebarNOSTR />
        <ArrowUp />
        <main className={`main-page-nostr-container`}></main>
      </div>
    </div>
  );
}
