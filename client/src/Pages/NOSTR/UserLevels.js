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
import ProgressCirc from "../../Components/ProgressCirc";
import Footer from "../../Components/Footer";
import { Link } from "react-router-dom";
import SearchbarNOSTR from "../../Components/NOSTR/SearchbarNOSTR";
import PagePlaceholder from "../../Components/PagePlaceholder";
import { getCurrentLevel, levelCount } from "../../Helpers/Helpers";

let chart_ = [
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

const getCooldown = (userLastUpdated, cooldownTime) => {
  let currentTime = Math.floor(new Date().getTime() / 1000);
  let diffTime = userLastUpdated + cooldownTime - currentTime;
  let cooldown = 0;
  if (diffTime <= 0) return cooldown;

  return Math.ceil(diffTime / 60);
};

export default function UserLevels() {
  const { nostrKeys, isConnectedToYaki, nostrUserLogout } = useContext(Context);
  const [oneTimeRewardStats, setOneTimeRewardStats] = useState([]);
  const [repeatedRewardsStats, setRepeatedRewardsStats] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [headerStats, setHeaderStats] = useState(false);
  const [maxValueInChart, setMaxValueInChart] = useState(0);
  const [chart, setChart] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoaded(false);
        const data = await axiosInstance.get("/api/v1/yaki-chest/stats");
        if (data.data.user_stats.pubkey !== nostrKeys.pub) {
          nostrUserLogout();
          setIsLoaded(false);
          return;
        }
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
        let max = 0;
        let tempChart = [];
        for (let action of user_stats.actions) {
          if (chartActionKeys.includes(action.action)) {
            if (action.all_time_points > max) max = action.all_time_points;
            tempChart.push({
              ...action,
              display_name: platform_standards[action.action].display_name,
            });
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
        setOneTimeRewardStats(
          tempStats.filter((item) => item.cooldown === 0 && item.count > 0)
        );
        setRepeatedRewardsStats(
          tempStats.filter(
            (item) =>
              item.cooldown > 0 || (item.cooldown === 0 && item.count === 0)
          )
        );
        setChart([
          ...tempChart,
          ...chart_
            .filter((action) => !tempActionKeys.includes(action.action))
            .map((action) => {
              return {
                ...action,
                display_name: platform_standards[action.action].display_name,
              };
            }),
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
    if (nostrKeys && isConnectedToYaki) fetchData();
  }, [nostrKeys, isConnectedToYaki]);

  useEffect(() => {
    if (!nostrKeys) {
      setOneTimeRewardStats([]);
      setRepeatedRewardsStats([]);
      setHeaderStats(false);
      setChart([]);
    }
  }, [isConnectedToYaki]);

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
                {isConnectedToYaki && (
                  <>
                    {isLoaded && (
                      <>
                        <div className="box-pad-v fit-container">
                          <h4>Points system</h4>
                        </div>
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
                              overflow: "visible",
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
                                      className="fx-centered fx-col fx-end-h pointer tooltip-on-hover"
                                      style={{
                                        height: "100%",
                                        width: "calc(100% / 12)",
                                        overflow: "visible",
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
                                          minHeight: "5px",
                                          backgroundColor:
                                            item.all_time_points ===
                                            maxValueInChart
                                              ? "var(--c1)"
                                              : "var(--c1-side)",
                                          borderBottomLeftRadius: "0",
                                          borderBottomRightRadius: "0",
                                          overflow: "visible",
                                          position: "relative",
                                          borderBottom: "none",
                                        }}
                                        className="fit-container sc-s-18 chart-bar"
                                      >
                                        <div
                                          className="fx-centered fx-start-v fx-col tooltip box-pad-h-m box-pad-v-s sc-s-18"
                                          style={{
                                            rowGap: 0,
                                            left:
                                              index + 4 > chart.length
                                                ? "100%"
                                                : "initial",
                                            transform:
                                              index + 4 > chart.length
                                                ? "translateX(-100%)"
                                                : "translateX(0)",
                                          }}
                                        >
                                          <div className="fx-centered">
                                            <p className="p-medium">
                                              {item.display_name}
                                            </p>
                                            <p className="p-small gray-c">
                                              &#9679;
                                            </p>
                                            <p className="orange-c p-medium">
                                              {item.all_time_points}{" "}
                                              <span className="gray-c">xp</span>
                                            </p>
                                          </div>
                                          <p className="gray-c p-small">
                                            Last gained{" "}
                                            {!item.last_updated ? (
                                              "N/A"
                                            ) : (
                                              <Date_
                                                toConvert={
                                                  new Date(
                                                    item.last_updated * 1000
                                                  )
                                                }
                                                time={true}
                                              />
                                            )}
                                          </p>
                                        </div>
                                      </div>
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
                              <p className=" gray-c">One time rewards</p>
                            </div>
                            {oneTimeRewardStats.map((item) => {
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
                                    </div>
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
                                      {(item.user_stat?.all_time_points ||
                                        0) ===
                                        item.points[0] *
                                          (item.user_stat?.count || 1) && (
                                        <div className="checkmark"></div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="fit-container fx-centered fx-col fx-start-v">
                                    <ProgressBar
                                      full={true}
                                      total={item.points[0]}
                                      current={
                                        item.user_stat?.all_time_points || 0
                                      }
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
                                        (
                                        {item.count -
                                          (item.user_stat?.count || 0)}
                                        )
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="fit-container">
                              <p className="gray-c">Repeated rewards</p>
                            </div>
                            {repeatedRewardsStats.map((item) => {
                              let cooldown = item.user_stat
                                ? getCooldown(
                                    item.user_stat.last_updated,
                                    item.cooldown
                                  )
                                : 0;
                              return (
                                <div
                                  className="fit-container  fx-centered sc-s-18 "
                                  style={{
                                    backgroundColor: "var(--c1-side)",
                                    border: "none",
                                    overflow: "visible",
                                  }}
                                  key={item.action}
                                >
                                  <div className="fit-container fx-scattered box-pad-h-m">
                                    <div>
                                      <p>{item.display_name}</p>
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
                                    </div>
                                    <div className="fx-centered">
                                      <ProgressCirc
                                        size={54}
                                        percentage={
                                          item.cooldown > 0
                                            ? Math.floor(
                                                (cooldown * 100) /
                                                  (item.cooldown / 60)
                                              )
                                            : 100
                                        }
                                        inversed={
                                          item.cooldown > 0 ? true : false
                                        }
                                        innerComp={
                                          item.cooldown > 0 ? (
                                            <p className="gray-c p-small">
                                              {cooldown}mn
                                            </p>
                                          ) : (
                                            <div className="infinity"></div>
                                          )
                                        }
                                        tooltip={
                                          item.cooldown > 0
                                            ? "Until cooldown"
                                            : "Unlimited gains"
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div
                                    className=" box-pad-v-m box-pad-h-m fx-centered fx-col"
                                    style={{
                                      minWidth: "max-content",
                                      borderLeft: "1px solid var(--dim-gray)",
                                    }}
                                  >
                                    <h4 className="orange-c">
                                      {item.user_stat?.all_time_points || 0}
                                    </h4>
                                    <p className="gray-c p-small">points</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                    {!isLoaded && (
                      <div
                        className="fit-container fx-centered"
                        style={{ height: "80vh" }}
                      >
                        <div className="loader"></div>
                      </div>
                    )}
                  </>
                )}
                {!isConnectedToYaki && (
                  <PagePlaceholder page={"nostr-yaki-chest"} />
                )}
              </div>

              <div
                style={{ width: "min(100%, 400px)" }}
                className={`fx-centered  fx-wrap box-pad-h extras-homepage box-pad-v sticky`}
              >
                <SearchbarNOSTR />
                <div className="sc-s-18 fit-container box-pad-h-m box-pad-v-m fx-centered fx-col fx-start-v">
                  <h4>About Yaki chest</h4>
                  <p className="gray-c">
                    Accumulate points by being active on the platform and win
                    precious awards!
                  </p>
                  <Link target="_blank" to={"/article/to-come"}>
                    <button className="btn btn-normal">Read article</button>
                  </Link>
                </div>
                <div className=" box-pad-v-m fit-container fx-centered fx-col fx-start-v box-marg-s">
                  <h4>Most rewarded actions</h4>
                  <div
                    className="fit-container fx-scattered sc-s-18 box-pad-v-m box-pad-h-m"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      border: "none",
                      overflow: "visible",
                    }}
                  >
                    <div>
                      <p>Posting flash news</p>
                      <div>
                        <p className="gray-c p-medium">
                          Gain <span className="orange-c"> {15} xp</span> each.
                        </p>
                      </div>
                    </div>
                    <div>
                      <Link
                        to={"/my-flash-news"}
                        state={{ addFN: true }}
                        className="round-icon-small"
                      >
                        <p>+</p>
                      </Link>
                    </div>
                  </div>
                  <div
                    className="fit-container fx-scattered sc-s-18 box-pad-v-m box-pad-h-m"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      border: "none",
                      overflow: "visible",
                    }}
                  >
                    <div>
                      <p>Posting articles</p>
                      <div>
                        <p className="gray-c p-medium">
                          Gain <span className="orange-c"> {4} xp</span> each.
                        </p>
                      </div>
                    </div>
                    <div>
                      <Link to={"/write-article"} className="round-icon-small">
                        <p>+</p>
                      </Link>
                    </div>
                  </div>
                  <div
                    className="fit-container fx-scattered sc-s-18 box-pad-v-m box-pad-h-m"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      border: "none",
                      overflow: "visible",
                    }}
                  >
                    <div>
                      <p>Posting videos</p>
                      <div>
                        <p className="gray-c p-medium">
                          Gain <span className="orange-c"> {3} xp</span> each.
                        </p>
                      </div>
                    </div>
                    <div>
                      <Link
                        to={"/my-videos"}
                        state={{ addVideo: true }}
                        className="round-icon-small"
                      >
                        <p>+</p>
                      </Link>
                    </div>
                  </div>
                  <div
                    className="fit-container fx-scattered sc-s-18 box-pad-v-m box-pad-h-m"
                    style={{
                      backgroundColor: "var(--c1-side)",
                      border: "none",
                      overflow: "visible",
                    }}
                  >
                    <div>
                      <p>Posting curations</p>
                      <div>
                        <p className="gray-c p-medium">
                          Gain <span className="orange-c"> {2} xp</span> each.
                        </p>
                      </div>
                    </div>
                    <div>
                      <Link
                        to={"/my-curations"}
                        state={{ addCuration: true }}
                        className="round-icon-small"
                      >
                        <p>+</p>
                      </Link>
                    </div>
                  </div>
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
