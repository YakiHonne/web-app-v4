import React, { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import ArrowUp from "../../Components/ArrowUp";
import { Context } from "../../Context/Context";
import axiosInstance from "../../Helpers/HTTP_Client";
import ProgressBar from "../../Components/ProgressBar";
import UserProfilePicNOSTR from "../../Components/NOSTR/UserProfilePicNOSTR";

export default function UserLevels() {
  // const { nostrKeys } = useContext(Context);
  const [stats, setStats] = useState([]);
  const [platformStandards, setPlatformStandards] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [headerStats, setHeaderStats] = useState(false);
  const maxValueInChart = 12;
  const chart = [
    {
      display_name: "",
      key: "",
      icon: "",
      value: 12,
    },
    {
      display_name: "",
      key: "",
      icon: "",
      value: 10,
    },
    {
      display_name: "",
      key: "",
      icon: "",
      value: 1,
    },
    {
      display_name: "",
      key: "",
      icon: "",
      value: 1,
    },
    {
      display_name: "",
      key: "",
      icon: "",
      value: 0,
    },
    {
      display_name: "",
      key: "",
      icon: "",
      value: 8,
    },
    {
      display_name: "",
      key: "",
      icon: "",
      value: 10,
    },
    {
      display_name: "",
      key: "",
      icon: "",
      value: 10,
    },
    {
      display_name: "",
      key: "",
      icon: "",
      value: 3,
    },
    {
      display_name: "",
      key: "",
      icon: "",
      value: 5,
    },
    {
      display_name: "",
      key: "",
      icon: "",
      value: 11,
    },
  ];
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await axiosInstance.get("/api/v1/yaki-chest/stats");
        console.log(data.data);
        let { user_stats, platform_standards } = data.data;
        let xp = user_stats.xp;
        let currentLevel = getCurrentLevel(xp);
        let nextLevel = currentLevel + 1;
        let toCurrentLevelPoints = levelCount(currentLevel);
        let toNextLevelPoints = levelCount(nextLevel);
        let totalPointInLevel = toNextLevelPoints - toCurrentLevelPoints;
        let inBetweenLevelPoints = xp - toCurrentLevelPoints;
        let remainingPointsToNextLevel =
          totalPointInLevel - inBetweenLevelPoints;

        setHeaderStats({
          xp,
          currentLevel,
          nextLevel,
          toCurrentLevelPoints,
          toNextLevelPoints,
          totalPointInLevel,
          inBetweenLevelPoints,
          remainingPointsToNextLevel,
        });
      } catch (err) {
        console.log(err);
        setIsLoaded(false);
      }
    };
    fetchData();
  }, []);

  const levelCount = (nextLevel) => {
    if (nextLevel === 1) return 0;
    else return levelCount(nextLevel - 1) + (nextLevel - 1) * 50;
  };
  const getCurrentLevel = (points) => {
    return Math.floor((1 + Math.sqrt(1 + (8 * points) / 50)) / 2);
  };

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
        <main className={`main-page-nostr-container`}>
          <div className="fit-container fx-centered fx-start-h">
            <div
              style={{ width: "min(100%,1400px)" }}
              className="fx-centered fx-start-v fx-start-h"
            >
              <div
                style={{ width: "min(100%, 700px)" }}
                className={`fx-centered  fx-wrap box-pad-h`}
              >
                <div className="box-pad-v fit-container">
                  <h4>Points system</h4>
                </div>
                {!isLoaded && (
                  <div className="fit-container fx-centered fx-col" style={{rowGap: "32px"}}>
                    <div
                      className="fit-container fx-centered fx-start-h sc-s-18 box-pad-h box-pad-v"
                      style={{
                        backgroundColor: "var(--c1-side)",
                        border: "none",
                        columnGap: "24px",
                      }}
                    >
                      <div>
                        <UserProfilePicNOSTR
                          size={100}
                          mainAccountUser={true}
                          allowClick={false}
                          ring={true}
                        />
                      </div>

                      <div className="fit-container fx-centered fx-col fx-start-v">
                        <div className="fit-container fx-scattered">
                          <div className="fx-centered fx-end-v">
                            <h3>{headerStats.xp}</h3>
                            <p className="p-big gray-c">xp</p>
                            <h3>
                              lvl{" "}
                              <span className="orange-c">
                                {headerStats.currentLevel}
                              </span>
                            </h3>
                          </div>
                          <div className="fx-centered ">
                            <div className="medal-24"></div>
                            <div className="medal-24"></div>
                            <div className="medal-24"></div>
                          </div>
                        </div>

                        <hr style={{ margin: ".5rem auto" }} />
                        <div className="fit-container fx-centered fx-col">
                          <div className="fit-container fx-scattered">
                            <div>
                              <p className="gray-c">
                                {headerStats.remainingPointsToNextLevel}{" "}
                                remaining
                              </p>
                            </div>
                            <div>
                              <p className="orange-c">
                                Level {headerStats.nextLevel}
                              </p>
                            </div>
                          </div>
                          <ProgressBar
                            full={true}
                            total={headerStats.totalPointInLevel}
                            current={headerStats.inBetweenLevelPoints}
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      className="fit-container fx-centered fx-end-v"
                      style={{
                        height: "30vh",
                        borderBottom: "1px solid var(--dim-gray)",
                      }}
                    >
                      <div className="box-pad-h fx-scattered fx-end-v fit-container" style={{height: "100%"}}>
                        {chart.map((item, index) => {
                          return (
                            <div
                              style={{
                                width: "calc(100% / 12)",
                                height: `${
                                  (item.value * 100) / maxValueInChart
                                }%`,
                                backgroundColor: item.value === maxValueInChart ? "var(--c1)" : "var(--c1-side)",
                                borderBottomLeftRadius: "0",
                                borderBottomRightRadius: "0"
                              }}
                              className="sc-s-18"
                            ></div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {/* {!isLoaded && (
                  <div className="fit-container">
                    <div className="fit-container fx-centered fx-stretch">
                      <div
                        className="fx sc-s-18 box-pad-h box-pad-v fx-centered fx-start-h"
                        style={{
                          backgroundColor: "var(--c1-side)",
                          border: "none",
                          columnGap: "24px",
                        }}
                      >
                        <div>
                          <UserProfilePicNOSTR
                            size={100}
                            mainAccountUser={true}
                            allowClick={false}
                            ring={true}
                          />
                        </div>
                        <div className="fx-centered fx-col fx-start-h">
                          <div className="fx-centered fx-end-v">
                            <h2>{headerStats.xp}</h2>
                            <p className="p-big gray-c">xp</p>
                          </div>
                          <p className="gray-c p-bold">Current tiers</p>
                          <div className="fit-container fx-centered fx-start-h">
                            <div className="medal-24"></div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="fx sc-s-18 box-pad-h box-pad-v fx-centered fx-col fx-start-v"
                        style={{ backgroundColor: "var(--c1-side)" }}
                      >
                        <div className="fit-container fx-scattered">
                          <h3>
                            Level{" "}
                            <span className="orange-c">
                              {headerStats.currentLevel}
                            </span>
                          </h3>
                          <div className="medal-24"></div>
                        </div>
                        <hr style={{ margin: ".5rem auto" }} />
                        <div className="fit-container fx-centered fx-col">
                          <div className="fit-container fx-scattered">
                            <div>
                              <p className="gray-c">
                                {headerStats.remainingPointsToNextLevel}
                              </p>
                            </div>
                            <div>
                              <p className="orange-c">
                                Level {headerStats.nextLevel}
                              </p>
                            </div>
                          </div>
                          <ProgressBar
                            full={true}
                            total={headerStats.totalPointInLevel}
                            current={headerStats.inBetweenLevelPoints}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}
              </div>
              {console.log(headerStats)}
              <div
                style={{ width: "min(100%, 400px)" }}
                className={`fx-centered  fx-wrap box-pad-h`}
              ></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
