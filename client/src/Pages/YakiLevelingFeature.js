import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import screenOne from "../media/images/NewFeature/Leveling/screen-1.png";
import screenTwo from "../media/images/NewFeature/Leveling/screen-2.png";
import screenThreeOne from "../media/images/NewFeature/Leveling/screen-3-1.png";
import screenThreeTwo from "../media/images/NewFeature/Leveling/screen-3-2.png";
import screenFourOne from "../media/images/NewFeature/Leveling/screen-4-1.png";
import screenFourTwo from "../media/images/NewFeature/Leveling/screen-4-2.png";
import screenFive from "../media/images/NewFeature/Leveling/screen-5.png";
import screenSix from "../media/images/NewFeature/Leveling/screen-6.png";
import screenSeven from "../media/images/NewFeature/Leveling/screen-7.png";
import screenSevenTwo from "../media/images/NewFeature/Leveling/screen-7-2.png";
import ProgressBar from "../Components/ProgressBar";

export default function YakiLevelingFeature() {
  const LevelingSystem = [
    <ScreenOne />,
    <ScreenTwo />,
    <ScreenThree />,
    <ScreenFour />,
    <ScreenSeven />,
    <ScreenFive />,
    <ScreenEight />,
    <ScreenSix />,
  ];
  return (
    <div
      className="fx-centered box-pad-h box-pad-v fx-start-v"
      style={{ backgroundColor: "black", minHeight: "100vh" }}
    >
      <div style={{ width: "min(100%, 1000px)", paddingBottom: "3rem" }}>
        <Helmet>
          <title>Yakihonne | Yakihonne points system</title>
          <meta name="description" content={"Yakihonne points system"} />
          <meta property="og:description" content={"Yakihonne points system"} />

          <meta
            property="og:url"
            content={`https://yakihonne.com/points-system`}
          />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Yakihonne" />
          <meta
            property="og:title"
            content="Yakihonne | Yakihonne points system"
          />
          <meta
            property="twitter:title"
            content="Yakihonne | Yakihonne points system"
          />
          <meta
            property="twitter:description"
            content={"Yakihonne points system"}
          />
        </Helmet>
        <div
          className="fx-centered fx-col fx-start-v fx-start-h"
          style={{ rowGap: "20px" }}
        >
          <div
            className="box-pad-h-s box-pad-v-s sc-s-18 fit-container fx-centered"
            style={{
              backgroundColor: "#202020",
              position: "sticky",
              border: "none",
              top: "1rem",
              zIndex: 100,
            }}
          >
            <Link to={"/"} className="fx-centered">
              <div
                className="yakihonne-logo-128"
                style={{ filter: "brightness(0) invert()" }}
              ></div>
            </Link>
          </div>
          <div
            className="fx-centered fx-centered fx-col"
            style={{
              width: "min(100%, 1000px)",
              rowGap: "24px",
            }}
          >
            {LevelingSystem.map((item, index) => {
              return (
                <div className="fit-container fit-height" key={index}>
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const ScreenOne = () => {
  return (
    <div
      className="fit-container fit-height fx-centered box-pad-h fx-wrap box-pad-v sc-s"
      style={{ position: "relative" }}
    >
      <div
        className="fx fx-centered fx-col fx-start-v box-pad-h"
        style={{ flex: "1 1 350px" }}
      >
        <h3>Introducing Yaki Points</h3>
        <p className="gray-c">
          Where every action brings you closer to amazing rewards !
        </p>
      </div>
      <div
        className="fx-1-5 fx-centered box-pad-h-m "
        style={{ flex: "1.5 1 350px" }}
      >
        <div
          className="fit-container sc-s box-pad-v"
          style={{ background: "#EEBB6B" }}
        >
          <img src={screenOne} className="fit-container" />
        </div>
      </div>
    </div>
  );
};
const ScreenTwo = () => {
  return (
    <div
      className="fit-container fit-height fx-centered box-pad-h fx-wrap-r sc-s box-pad-v"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div
        className="fx-1-5 fx-centered box-pad-h-m "
        style={{ flex: "1.5 1 350px" }}
      >
        <div
          className="fit-container sc-s box-pad-v"
          style={{ background: "var(--c1)" }}
        >
          <img src={screenTwo} className="fit-container" />
        </div>
      </div>
      <div
        className="fx fx-centered fx-col fx-start-v box-pad-h"
        style={{ flex: "1 1 350px" }}
      >
        <h3>Every Interaction counts</h3>
        <p className="gray-c">
          Earn points by engaging in activities, sharing your expertise.
        </p>
      </div>
    </div>
  );
};
const ScreenThree = () => {
  return (
    <div
      className="fit-container fit-height fx-centered box-pad-h fx-wrap-r sc-s"
      style={{ position: "relative", overflow: "hidden", height: "45vh" }}
    >
      <div
        className="fx fx-centered box-pad-h-m box-pad-v fit-height mb-hide-800"
        style={{ flex: "1 1 350px" }}
      >
        <div
          className="sc-s box-pad-v box-pad-h fx-centered "
          style={{ background: "#EEBB6B", height: "90%" }}
        >
          <img
            src={screenThreeOne}
            style={{
              aspectRatio: "9/16",
              objectFit: "contain",
              height: "100%",
            }}
          />
        </div>
      </div>
      <div
        className="fx fx-centered box-pad-h-m  home-fn-mobile"
        style={{ flex: "1 1 350px" }}
      >
        <div
          className="sc-s box-pad-v box-pad-h fx-centered fit-container"
          style={{ background: "#EEBB6B" }}
        >
          <img
            src={screenThreeOne}
            style={{ aspectRatio: "15/9", objectFit: "contain", width: "100%" }}
          />
        </div>
      </div>
      <div
        className="fx-1-5 fx-centered fx-col fx-start-v box-pad-h"
        style={{ position: "relative", flex: "1.5 1 350px" }}
      >
        <div className="fx-centered fx-col fx-start-v box-pad-h">
          <h3>Meet Pleb, the newest member!</h3>
          <p className="gray-c">
            From the moment Pleb joined, the rewards started rolling in.
          </p>
          <div className="box-marg-full mb-hide-800"></div>
        </div>
        <div
          className="mb-hide-800"
          style={{
            position: "absolute",
            right: "0",
            top: "60%",
            transform: "translateX(20%)",
          }}
        >
          <div className="fit-container" style={{ position: "relative" }}>
            <div
              className="sc-s"
              style={{
                zIndex: "-1",
                background: "var(--c1)",
                height: "80%",
                position: "absolute",
                width: "85%",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: 0,
              }}
            ></div>
            <img src={screenThreeTwo} className="fit-container" />
          </div>
        </div>
      </div>
    </div>
  );
};
const ScreenFour = () => {
  return (
    <div
      className="fit-container fit-height fx-centered box-pad-h fx-wrap-r sc-s"
      style={{ position: "relative", overflow: "hidden", height: "45vh" }}
    >
      <div
        className="fx-1-5 fx-centered box-pad-h-m "
        style={{ flex: "1 1 350px" }}
      >
        <div className="fit-container" style={{ position: "relative" }}>
          <div
            className="sc-s"
            style={{
              zIndex: "-1",
              background: "var(--c1)",
              height: "80%",
              position: "absolute",
              width: "85%",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 0,
            }}
          ></div>
          <img src={screenFourOne} className="fit-container" />
        </div>
      </div>
      <div
        className="fx fx-centered fx-col fx-start-v box-pad-h"
        style={{ position: "relative", flex: "1 1 350px" }}
      >
        <div className="fx-centered fx-col fx-start-v box-pad-h">
          <h3>Get Started Now</h3>
          <p className="gray-c">
            Unlock the one-time rewards by setting up your account.
          </p>
          <div className="box-marg-full mb-hide-800"></div>
        </div>
        <div
          className="mb-hide-800"
          style={{
            position: "absolute",
            right: "0",
            top: "60%",
            transform: "translateX(-20%)",
          }}
        >
          <div
            className="sc-s box-pad-v box-pad-h "
            style={{ background: "#EEBB6B", height: "90%", width: "200px" }}
          >
            <img src={screenFourTwo} className="fit-container" />
          </div>
        </div>
      </div>
    </div>
  );
};
const ScreenFive = () => {
  return (
    <div
      className="fit-container fit-height fx-centered box-pad-h fx-wrap sc-s"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "2rem 1rem",
        height: "50vh",
      }}
    >
      <div
        className="fx fx-centered fx-col fx-start-v box-pad-h"
        style={{ flex: "1 1 350px" }}
      >
        <h3>Unlock Tiers, Multiply Rewards</h3>
        <p className="gray-c">
          Level up through the tiers and unlock multiplied rewards with every
          milestone you achieve.
        </p>
      </div>
      <div
        className="fx fx-centered box-pad-h-m fit-height  mb-hide-800"
        style={{ flex: "1 1 350px" }}
      >
        <div
          className="fit-container fx-centered sc-s box-pad-v"
          style={{ background: "var(--c1)", height: "100%" }}
        >
          <img
            src={screenFive}
            className="fit-container"
            style={{
              height: "100%",
              aspectRatio: "9/16",
              objectFit: "contain",
            }}
          />
        </div>
      </div>
      <div
        className="fx fx-centered box-pad-h-m home-fn-mobile"
        style={{ flex: "1 1 350px" }}
      >
        <div
          className="fit-container fx-centered sc-s box-pad-v "
          style={{ background: "var(--c1)" }}
        >
          <img
            src={screenFive}
            className="fit-container"
            style={{ aspectRatio: "15/9", objectFit: "contain", width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};

const ScreenSeven = () => {
  return (
    <div
      className="fit-container fit-height fx-centered box-pad-h fx-wrap sc-s"
      style={{ position: "relative", overflow: "hidden", height: "55vh" }}
    >
      <div
        className="fx fx-centered fx-col fx-start-v box-pad-h"
        style={{ flex: "1 1 300px" }}
      >
        <h3>Achieve with Yaki</h3>
        <p className="gray-c">The Ultimate Leveling and Rewards System!</p>
      </div>
      <div
        className="fx fx-centered  fx-start-v box-pad-h home-fn-mobile"
        style={{ flex: "1 1 400px", columnGap: 0 }}
      >
        <div
          className="fx-centered fx-col fx-start-v box-pad-h-s"
          style={{ rowGap: "2px" }}
        >
          <p>Track Your Activities</p>
          <p className="gray-c p-medium">
            Pleb is on a roll, effortlessly tracking every action reward and
            watching his progress soar!
          </p>
        </div>
        <div
          className="fx-centered fx-col fx-start-v box-pad-h-s"
          style={{ rowGap: "2px" }}
        >
          <p>Level Up and Multiply</p>
          <p className="gray-c p-medium">
            Pleb is on a mission, leveling up to unlock new tiers and reap
            multiplied rewards. Transform consistent efforts into exponential
            gains.
          </p>
        </div>
        <div
          className="fx-centered fx-col fx-start-v box-pad-h-s"
          style={{ rowGap: "2px" }}
        >
          <p>Stay on Top of Your Rewards</p>
          <p className="gray-c p-medium">
            Pleb is constantly on the lookout, tracking repeated rewards and
            ensuring no opportunity is missed.
          </p>
        </div>
      </div>
      <div
        className="fx fx-centered box-pad-h-m box-pad-v fit-height mb-hide-800"
        style={{ flex: "1 1 300px" }}
      >
        <div
          className="fit-container fx-centered sc-s box-pad-v"
          style={{ background: "#EEBB6B", height: "100%" }}
        >
          <img
            src={screenSeven}
            className="fit-container"
            style={{
              height: "100%",
              aspectRatio: "9/16",
              objectFit: "contain",
            }}
          />
        </div>
      </div>
      <div
        className="fx fx-centered box-pad-h-m home-fn-mobile"
        style={{ flex: "1 1 300px" }}
      >
        <div
          className="fit-container fx-centered sc-s box-pad-v"
          style={{ background: "#EEBB6B" }}
        >
          <img
            src={screenSevenTwo}
            className="fit-container"
            style={{ aspectRatio: "23/9", objectFit: "contain", width: "100%" }}
          />
        </div>
      </div>
      <div
        className="fx fx-centered fx-col fx-start-v box-pad-h mb-hide-800"
        style={{ rowGap: "32px", flex: "1 1 300px" }}
      >
        <div
          className="fx-centered fx-col fx-start-v box-pad-h"
          style={{ rowGap: "2px" }}
        >
          <p className="p-big p-bold">Track Your Activities</p>
          <p className="gray-c p-medium">
            Pleb is on a roll, effortlessly tracking every action reward and
            watching his progress soar!
          </p>
        </div>
        <div
          className="fx-centered fx-col fx-start-v box-pad-h"
          style={{ rowGap: "2px" }}
        >
          <p className="p-big p-bold">Level Up and Multiply</p>
          <p className="gray-c p-medium">
            Pleb is on a mission, leveling up to unlock new tiers and reap
            multiplied rewards. Transform consistent efforts into exponential
            gains.
          </p>
        </div>
        <div
          className="fx-centered fx-col fx-start-v box-pad-h"
          style={{ rowGap: "2px" }}
        >
          <p className="p-big p-bold">Stay on Top of Your Rewards</p>
          <p className="gray-c p-medium">
            Pleb is constantly on the lookout, tracking repeated rewards and
            ensuring no opportunity is missed.
          </p>
        </div>
      </div>
    </div>
  );
};

const ScreenSix = () => {
  const skipShowcase = () => {
    localStorage.setItem("feature_showcase", Date.now());
    window.location.href = "/yaki-points";
  };
  return (
    <div
      className="fit-container fit-height fx-centered box-pad-h bg-img cover-bg sc-s"
      style={{
        position: "relative",
        backgroundImage: `url(${screenSix})`,
        height: "50vh",
      }}
    >
      <div className="fx fx-centered fx-col fx-start-v box-pad-h">
        <h3>Start racking up rewards! </h3>
        <button className="btn btn-normal" onClick={skipShowcase}>
          Take me there!
        </button>
      </div>
      <div className="fx fx-centered box-pad-h-m box-pad-v fit-height"></div>
    </div>
  );
};

const ScreenEight = () => {
  return (
    <div
      className="fit-container fit-height fx-centered box-pad-h fx-wrap sc-s fx-col"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "2rem 1rem",
        // height: "50vh",
      }}
    >
      {/* <div className="fit-container fx-centered">
        <h3>Tiers</h3>
      </div> */}
      <div className="fit-container fx-col fx-centered fx-start-v">
        <div
          className="fx-centered fit-container"
          style={{ columnGap: "16px" }}
        >
          <div
            className="bronze-tier"
            style={{ minWidth: "90px", aspectRatio: "1/1" }}
          ></div>
          <div className="fx-centered fx-col fx-start-v fit-container">
            <h4>Bronze tier</h4>
            <div className="fx-centered fx-start-h">
              <p className="gray-c ">
                Starter Pack <span className="p-small gray-c">&#9679;</span>
                {"  "}
                1x rewards gains{"  "}
                <span className="p-small gray-c">&#9679;</span> Unique Bronze
                Tier Badge <span className="p-small gray-c">&#9679;</span>{" "}
                Random SATs Lucky Draw{"  "}
              </p>
            </div>
            <div style={{ width: "25%" }} className="fx-centered">
              <ProgressBar total={100} current={100} full={true} />
              <div style={{ minWidth: "max-content" }}>
                <p className="orange-c p-medium">(1 - 50) level</p>
              </div>
            </div>
          </div>
        </div>
        <hr style={{ margin: "1rem auto" }} />
        <div
          className="fx-centered fit-container"
          style={{ columnGap: "16px" }}
        >
          <div
            className="silver-tier"
            style={{ minWidth: "90px", aspectRatio: "1/1" }}
          ></div>
          <div className="fx-centered fx-col fx-start-v fit-container">
            <h4>Silver tier</h4>
            <div className="fx-centered fx-start-h">
              <p className="gray-c ">
                2x rewards gains <span className="p-small gray-c">&#9679;</span>
                {"  "}
                Unique Silver Tier Badge{"  "}
                <span className="p-small gray-c">&#9679;</span> Scheduled SATs
                Lucky Draw
              </p>
              {/* <p className="gray-c">2x rewards gains</p>
              <p className="p-small gray-c">&#9679;</p>
              <p className="gray-c">Unique Silver Tier Badge</p>
              <p className="p-small gray-c">&#9679;</p>
              <p className="gray-c">Scheduled SATs Lucky Draw</p> */}
            </div>
            <div style={{ width: "50%" }} className="fx-centered">
              <ProgressBar total={100} current={100} full={true} />
              <div style={{ minWidth: "max-content" }}>
                <p className="orange-c p-medium">(51 - 100) level</p>
              </div>
            </div>
          </div>
        </div>
        <hr style={{ margin: "1rem auto" }} />
        <div
          className="fx-centered fit-container"
          style={{ columnGap: "16px" }}
        >
          <div
            className="gold-tier"
            style={{ minWidth: "90px", aspectRatio: "1/1" }}
          ></div>
          <div className="fx-centered fx-col fx-start-v fit-container">
            <h4>Gold tier</h4>
            <div className="fx-centered fx-start-h">
              <p className="gray-c ">
                3x rewards gains <span className="p-small gray-c">&#9679;</span>
                {"  "}
                Unique Gold Tier Badge{"  "}
                <span className="p-small gray-c">&#9679;</span> Scheduled SATs
                Draw <span className="p-small gray-c">&#9679;</span> Become a
                Guest on The YakiHonne Podcast{"  "}
                <span className="p-small gray-c">&#9679;</span> High rate of
                content awareness
              </p>
            </div>
            <div style={{ width: "75%" }} className="fx-centered">
              <ProgressBar total={100} current={100} full={true} />
              <div style={{ minWidth: "max-content" }}>
                <p className="orange-c p-medium">(101 - 500) level</p>
              </div>
            </div>
          </div>
        </div>
        <hr style={{ margin: "1rem auto" }} />
        <div
          className="fx-centered fit-container"
          style={{ columnGap: "16px" }}
        >
          <div
            className="platinum-tier"
            style={{ minWidth: "90px", aspectRatio: "1/1" }}
          ></div>
          <div className="fx-centered fx-col fx-start-v fit-container">
            <h4>Platinum tier</h4>
            <div className="fx-centered fx-start-h">
              <p className="gray-c ">
                3x rewards gains <span className="p-small gray-c">&#9679;</span>
                {"  "}
                Unique Platinum Tier Badge{"  "}
                <span className="p-small gray-c">&#9679;</span> Scheduled SATs
                Draw <span className="p-small gray-c">&#9679;</span> Exlusive
                Events invitations{"  "}
                <span className="p-small gray-c">&#9679;</span> Become a Part of
                YakiHonne Grants Program
              </p>
            </div>
            <div style={{ width: "100%" }} className="fx-centered">
              <ProgressBar total={100} current={100} full={true} />
              <div style={{ minWidth: "max-content" }}>
                <p className="orange-c p-medium">(501 and above) level</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
