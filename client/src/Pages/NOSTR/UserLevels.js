import React, { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import SidebarNOSTR from "../../Components/NOSTR/SidebarNOSTR";
import ArrowUp from "../../Components/ArrowUp";
import { Context } from "../../Context/Context";
import axiosInstance from "../../Helpers/HTTP_Client";
import ProgressBar from "../../Components/ProgressBar";
import UserProfilePicNOSTR from "../../Components/NOSTR/UserProfilePicNOSTR";
import { chartActionKeys } from "../../Content/ActionKeys";
import { act } from "react";
import Date_ from "../../Components/Date_";

let chart_ = [
  { action: "flashnews_draft", all_time_points: 0, last_updated: null },
  { action: "flashnews_post", all_time_points: 0, last_updated: null },
  { action: "un_write", all_time_points: 0, last_updated: null },
  { action: "un_rate", all_time_points: 0, last_updated: null },
  { action: "curation_post", all_time_points: 0, last_updated: null },
  { action: "article_post", all_time_points: 0, last_updated: null },
  { action: "article_draft", all_time_points: 0, last_updated: null },
  { action: "video_post", all_time_points: 0, last_updated: null },
  { action: "bookmark", all_time_points: 0, last_updated: null },
  { action: "zap", all_time_points: 0, last_updated: null },
  { action: "upvote", all_time_points: 0, last_updated: null },
  { action: "downvote", all_time_points: 0, last_updated: null },
  { action: "comment_post", all_time_points: 0, last_updated: null },
];

export default function UserLevels() {
  const { nostrKeys } = useContext(Context);
  const [stats, setStats] = useState([]);
  const [platformStandards, setPlatformStandards] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [headerStats, setHeaderStats] = useState(false);
  const [maxValueInChart, setMaxValueInChart] = useState(0);
  const [chart, setChart] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoaded(false);
        const data = await axiosInstance.get("/api/v1/yaki-chest/stats");

        let { user_stats, platform_standards } = data.data;
        console.log(platform_standards);
        let xp = user_stats.xp;
        let currentLevel = getCurrentLevel(xp);
        let nextLevel = currentLevel + 1;
        let toCurrentLevelPoints = levelCount(currentLevel);
        let toNextLevelPoints = levelCount(nextLevel);
        let totalPointInLevel = toNextLevelPoints - toCurrentLevelPoints;
        let inBetweenLevelPoints = xp - toCurrentLevelPoints;
        let remainingPointsToNextLevel =
          totalPointInLevel - inBetweenLevelPoints;
        let max = 0;

        let tempChart = [];
        for (let action of user_stats.actions) {
          if (chartActionKeys.includes(action.action)) {
            if (action.all_time_points > max) max = action.all_time_points;

            tempChart.push(action);
          }
        }
        let tempActionKeys = tempChart.map((action) => action.action);

        let tempStats = Object.entries(platform_standards).map((action) => {
          let user_stat = user_stats.actions.find(
            (_action) => _action.action === action[0]
          );
          return {
            action: action[0],
            ...action[1],
            user_stat,
          };
        });
        setStats(tempStats);
        setChart([
          ...tempChart,
          ...chart_.filter((action) => !tempActionKeys.includes(action.action)),
        ]);
        setMaxValueInChart(max);
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
        setIsLoaded(true);
      } catch (err) {
        console.log(err);
        setIsLoaded(false);
      }
    };
    if (nostrKeys) fetchData();
  }, [nostrKeys]);

  useEffect(() => {
    if (!nostrKeys) {
      setStats([]);
      setPlatformStandards({});
      setHeaderStats(false);
      setChart([]);
    }
  }, [nostrKeys]);

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
                {isLoaded && (
                  <div
                    className="fit-container fx-centered fx-col"
                    style={{ rowGap: "16px" }}
                  >
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
                            <div
                              className="gold-tier"
                              style={{ width: "28px" }}
                            ></div>
                            <div
                              className="silver-tier"
                              style={{ width: "28px" }}
                            ></div>
                            <div
                              className="bronze-tier"
                              style={{ width: "28px" }}
                            ></div>
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
                      className="fit-container fx-centered fx-col sc-s-18 box-pad-h box-pad-v"
                      style={{
                        backgroundColor: "var(--c1-side)",
                        border: "none",
                        rowGap: "24px",
                      }}
                    >
                      <div
                        className="fit-container fx-centered fx-end-v"
                        style={{
                          height: "30vh",
                          borderBottom: "1px solid var(--dim-gray)",
                        }}
                      >
                        <div
                          className="box-pad-h fx-scattered fx-end-v fit-container"
                          style={{ height: "100%" }}
                        >
                          {chart.map((item, index) => {
                            return (
                              <div
                                className="fx-centered fx-col fx-end-h pointer"
                                style={{
                                  height: "100%",
                                  width: "calc(100% / 13)",
                                }}
                                key={item.action}
                              >
                                <p className="p-medium gray-c">
                                  {item.all_time_points} xp
                                </p>
                                <div
                                  style={{
                                    height: `${
                                      (item.all_time_points * 100) /
                                      maxValueInChart
                                    }%`,
                                    backgroundColor:
                                      item.all_time_points === maxValueInChart
                                        ? "var(--c1)"
                                        : "var(--c1-side)",
                                    borderBottomLeftRadius: "0",
                                    borderBottomRightRadius: "0",
                                  }}
                                  className="fit-container sc-s-18"
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <h4 className="gray-c">Most active</h4>
                    </div>
                    <div
                      className="fit-container fx-centered fx-col box-marg-s"
                      // style={{ rowGap: "24px" }}
                    >
                      <div className="fit-container">
                        <p className="p-big c1-c">Rewards details</p>
                      </div>
                      {stats.map((item) => {
                        return (
                          <div
                            className="fit-container fx-col fx-centered sc-s-18 box-pad-h-m box-pad-v-s"
                            style={{
                              backgroundColor: "var(--c1-side)",
                              border: "none",
                            }}
                            key={item.action}
                          >
                            <div className="fit-container fx-scattered">
                              <div>
                                <p>{item.display_name}</p>
                                {(item.cooldown > 0 ||
                                  (item.cooldown === 0 &&
                                    item.count === 0)) && (
                                  <div className="fx-centered">
                                    <p className="gray-c p-medium">
                                      Gain{" "}
                                      <span className="orange-c">
                                        {" "}
                                        {item.points[0] || 0} xp{" "}
                                      </span>{" "}
                                      for {item.display_name}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {item.cooldown === 0 && item.count > 0 && (
                                <div className="fx-centered">
                                  <p className="orange-c">
                                    {item.user_stat?.all_time_points || 0}
                                    <span className="gray-c">
                                      {" "}
                                      /{" "}
                                      {item.points[0] *
                                        (item.user_stat?.count || 1)}
                                    </span>
                                  </p>
                                  {(item.user_stat?.all_time_points || 0) ===
                                    item.points[0] *
                                      (item.user_stat?.count || 1) && (
                                    <div className="checkmark"></div>
                                  )}
                                </div>
                              )}
                              {(item.cooldown > 0 ||
                                (item.cooldown === 0 && item.count === 0)) && (
                                <div className="fx-centered">
                                  <p className="orange-c">
                                    {item.user_stat?.all_time_points || 0}
                                  </p>
                                </div>
                              )}
                            </div>
                            {item.cooldown === 0 && item.count > 0 && (
                              <div className="fit-container fx-centered fx-col fx-start-v">
                                <ProgressBar
                                  full={true}
                                  total={item.points[0]}
                                  current={item.user_stat?.all_time_points || 0}
                                />
                                <p className="gray-c p-medium">
                                  Attempts remained{" "}
                                  <span
                                    className={
                                      item.count -
                                        (item.user_stat?.count || 0) ===
                                      0
                                        ? "red-c"
                                        : "green-c"
                                    }
                                  >
                                    ({item.count - (item.user_stat?.count || 0)}
                                    )
                                  </span>
                                </p>
                              </div>
                            )}
                            {item.cooldown > 0 && (
                              <div className="fit-container fx-centered fx-col">
                                <div className="fit-container fx-scattered">
                                  <p
                                    className="gray-c p-medium"
                                    style={{ minWidth: "max-content" }}
                                  >
                                    Cooldown to next point
                                  </p>
                                  <ProgressBar
                                    full={true}
                                    total={
                                      item.user_stat
                                        ? item.user_stat.last_updated +
                                          item.cooldown
                                        : item.cooldown
                                    }
                                    current={
                                      item.user_stat
                                        ? item.user_stat.last_updated
                                        : 0
                                    }
                                  />
                                  <p
                                    className="gray-c p-medium"
                                    style={{ minWidth: "max-content" }}
                                  >
                                    {!item.user_stat && "N/A"}
                                    {item.user_stat &&
                                      (item.user_stat.last_updated +
                                        item.cooldown) *
                                        1000 <
                                        new Date().getTime() && (
                                        // <div className="checkmark"></div>
                                        <Date_
                                          toConvert={
                                            new Date(
                                              item.user_stat.last_updated +
                                                item.cooldown
                                            ) * 1000
                                          }
                                          timeOnly={true}
                                        />
                                      )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{ width: "min(100%, 400px)" }}
                className={`fx-centered  fx-wrap box-pad-h extras-homepage`}
              ></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
