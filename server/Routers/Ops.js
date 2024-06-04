const express = require("express");
const axios = require("axios");
const { utils } = require("noble-secp256k1");
const router = express.Router();
const topics = require("../DB/Topics");
const OpenAI = require("openai");
const UncensoredNotes = require("../Models/UncensoredNotes");
const UNRatings = require("../Models/UNRatings");
const SealedNotes = require("../Models/SealedNotes");
const UserLevels = require("../Models/UserLevels");
const { auth_user, user_login, user_tokenizing } = require("../Helpers/Auth");
const { actions_keys, levels, tiers } = require("../DB/LevelsActions");
const MongoStore = require("connect-mongo");
const Users = require("../Models/Users");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getCurrentLevel = (points) => {
  return Math.floor((1 + Math.sqrt(1 + (8 * points) / 50)) / 2);
};

const zaps_intervals = {
  "zap-1": 0,
  "zap-20": 1,
  "zap-60": 2,
  "zap-100": 3,
};
const dms_intervals = {
  "dms-5": 0,
  "dms-10": 1,
};

router.get("/api/v1/yakihonne-topics", (req, res) => {
  res.send(topics);
});

router.post("/api/v1/url-to-base64", async (req, res) => {
  try {
    const fetchImagePromises = req.body.images.map(async (url) => {
      if (!url) return "";
      try {
        const response = await axios.get(url, {
          responseType: "arraybuffer",
        });
        const imageBuffer = Buffer.from(response.data, "binary");
        const base64Image = imageBuffer.toString("base64");
        const image = `data:${response.headers["content-type"]};base64,${base64Image}`;
        return image;
      } catch (err) {
        // console.log(err);
        return "";
      }
    });

    const images = await Promise.all(fetchImagePromises);

    res.send(images);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "error" });
  }
});

router.post("/api/v1/gpt", async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
      ],
      model: "gpt-3.5-turbo-16k-0613",
    });
    res.send(completion.choices[0]);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.post("/api/v1/login", user_login, user_tokenizing, async (req, res) => {
  try {
    let pubkey = req.user.pubkey;
    let [userLevels, user] = await Promise.all([
      UserLevels.findOne({ pubkey }),
      Users.findOne({ pubkey }),
    ]);
    // let userLevels = await UserLevels.findOne({ pubkey });
    let last_updated = Math.floor(new Date().getTime() / 1000);
    if (!userLevels) {
      let actions = [];
      let new_account = {
        action: "new_account",
        current_points: 50,
        count: 1,
        extra: {},
        all_time_points: 50,
        last_updated,
      };
      actions.push(new_account);
      if (user) {
        if (user.name || user.display_name) {
          let username = {
            action: "username",
            current_points: 5,
            count: 1,
            extra: {},
            all_time_points: 5,
            last_updated,
          };
          actions.push(username);
        }
        if (user.picture) {
          let profile_picture = {
            action: "profile_picture",
            current_points: 5,
            count: 1,
            extra: {},
            all_time_points: 5,
            last_updated,
          };
          actions.push(profile_picture);
        }
        if (user.banner) {
          let cover = {
            action: "cover",
            current_points: 5,
            count: 1,
            extra: {},
            all_time_points: 5,
            last_updated,
          };
          actions.push(cover);
        }
        if (user.about) {
          let bio = {
            action: "bio",
            current_points: 5,
            count: 1,
            extra: {},
            all_time_points: 5,
            last_updated,
          };
          actions.push(bio);
        }
        if (user.lud06 || user.lud16) {
          let check_luds = await Users.find({
            lud16: user.lud16,
          }).countDocuments();
          if (check_luds <= 3) {
            let luds = {
              action: "luds",
              current_points: 15,
              count: 1,
              extra: {},
              all_time_points: 15,
              last_updated,
            };
            actions.push(luds);
          }
        }

        if (user.nip05) {
          let check_nip05 = await Users.find({
            nip05: user.nip05,
          }).countDocuments();
          if (check_nip05 <= 3) {
            let nip05 = {
              action: "nip05",
              current_points: 5,
              count: 1,
              extra: {},
              all_time_points: 5,
              last_updated,
            };
            actions.push(nip05);
          }
        }
      }
      let xp = actions.reduce(
        (total, item) => (total += item.all_time_points),
        0
      );
      let updated_user = await UserLevels.findOneAndUpdate(
        { pubkey },
        {
          xp,
          current_points: {
            points: xp,
            last_updated,
          },
          actions,
          last_updated,
        },
        { upsert: true, new: true }
      );
      return res.send({
        message: "Logged in!",
        is_new: true,
        actions,
        xp,
        current_points: {
          points: xp,
          last_updated,
        },
        platform_standards: levels,
      });
    }
    res.send({ message: "Logged in!" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.post("/api/v1/logout", auth_user, async (req, res) => {
  try {
    // let pubkey = req.body.pubkey;
    // if (pubkey === req.user.pubkey) {

    delete req.session.user_token;
    return res.send({ message: "Logged out!" });
    // }
    // return res.status(403).send({ message: "Cannot log out!" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.post("/api/v1/yaki-chest", auth_user, async (req, res) => {
  try {
    let action_key = req.body.action_key;
    let last_updated = Math.floor(new Date().getTime() / 1000);
    let pubkey = req.user.pubkey;
    // let pubkey =
    //   "28313968021dd85505275f2edf55d8feb071a88adec61a06d34923b57e036f8d";

    if (!action_key || typeof action_key !== "string")
      return res
        .status(403)
        .send({ message: "action_key is missing or is not string" });
    if (!actions_keys.includes(action_key.toString()))
      return res.status(403).send({ message: "unsupported action key" });

    let point_index = getPointsIndex(action_key);
    // let point_index = ["zap-1", "zap-20", "zap-60", "zap-100"].includes(
    //   action_key
    // )
    //   ? zaps_intervals[action_key]
    //   : 0;
    let action_details = getActionDetails(action_key, point_index);
    // let action_details = ["zap-1", "zap-20", "zap-60", "zap-100"].includes(
    //   action_key
    // )
    //   ? { ...levels[action_key.split("-")[0]], point_index }
    //   : { ...levels[action_key], point_index };

    action_key = getActionKey(action_key);
    // action_key = ["zap-1", "zap-20", "zap-60", "zap-100"].includes(action_key)
    //   ? action_key.split("-")[0]
    //   : action_key;
    let [userLevels, user] = await Promise.all([
      UserLevels.findOne({ pubkey }),
      Users.findOne({ pubkey }),
    ]);

    // if (!userLevels) {
    //   let new_action = {
    //     action: action_key,
    //     current_points: action_details.points[0],
    //     count: action_details.count > 0 ? 1 : 0,
    //     extra: {},
    //     all_time_points: action_details.points[0],
    //     last_updated,
    //   };
    //   let updated_user = await UserLevels.findOneAndUpdate(
    //     { pubkey },
    //     {
    //       xp:
    //         50 + (action_key === "new_account" ? 0 : action_details.points[0]),
    //       $push: { actions: new_action },
    //       last_updated,
    //     },
    //     { upsert: true, new: true }
    //   );
    //   return res.send({
    //     user_stats: updated_user,
    //     platform_standards: levels,
    //     is_updated: true,
    //     tiers,
    //   });
    // }

    let currentLevel = getCurrentLevel(userLevels.xp);
    let currentVolumeTier = tiers.find((tier) => {
      if (
        tier.max > -1 &&
        tier.min <= currentLevel &&
        tier.max >= currentLevel
      ) {
        return tier;
      }
      if (tier.max == -1 && tier.min <= currentLevel) return tier;
    }).volume;

    let action_to_update = ["nip05", "luds"].includes(action_key)
      ? await actionToUpdateV2(
          user,
          action_key,
          action_details,
          userLevels.actions,
          last_updated,
          currentVolumeTier
        )
      : actionToUpdate(
          action_key,
          action_details,
          userLevels.actions,
          last_updated,
          currentVolumeTier
        );

    if (action_to_update === false)
      return res.send({
        user_stats: userLevels,
        platform_standards: levels,
        is_updated: false,
        tiers,
      });

    let updated_user = await UserLevels.findOneAndUpdate(
      { pubkey, "actions.action": action_key },
      {
        xp: userLevels.xp + action_to_update.points,
        current_points: {
          points: userLevels.current_points.points + action_to_update.points,
          last_updated,
        },
        $set: {
          "actions.$.action": action_to_update.action,
          "actions.$.current_points": action_to_update.current_points,
          "actions.$.count": action_to_update.count,
          "actions.$.last_updated": action_to_update.last_updated,
          "actions.$.all_time_points": action_to_update.all_time_points,
          "actions.$.extra": action_to_update.extra,
        },
        last_updated,
      },
      { new: true }
    );

    if (updated_user)
      return res.send({
        user_stats: updated_user,
        platform_standards: levels,
        is_updated: action_to_update,
        tiers,
      });
    let updated_user_2 = await UserLevels.findOneAndUpdate(
      { pubkey },
      {
        xp: userLevels.xp + action_to_update.points,
        current_points: {
          points: userLevels.current_points.points + action_to_update.points,
          last_updated,
        },
        $push: { actions: action_to_update },
        last_updated,
      },
      { new: true }
    );
    return res.send({
      user_stats: updated_user_2,
      platform_standards: levels,
      is_updated: action_to_update,
      tiers,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
router.get("/api/v1/yaki-chest/stats", auth_user, async (req, res) => {
  try {
    let last_updated = Math.floor(new Date().getTime() / 1000);
    let pubkey = req.user.pubkey;
    // let pubkey =
    //   "28313968021dd85505275f2edf55d8feb071a88adec61a06d34923b57e036f8d";
    let user_impact_last_updated = req.session.user_impact_last_updated;
    let current_time = Math.floor(new Date().getTime() / 1000);
    let userLevels = await UserLevels.findOne({ pubkey }).select("-_id");

    if (!userLevels) {
      return res.send({
        user_stats: { pubkey, xp: 0, actions: [], last_updated },
        platform_standards: levels,
        tiers,
      });
    }
    console.log(user_impact_last_updated, current_time);
    if (
      !user_impact_last_updated ||
      (user_impact_last_updated &&
        user_impact_last_updated + 900 < current_time)
    ) {
      req.session.user_impact_last_updated = current_time;
      updateUserImpact("user_impact", userLevels, pubkey);
    }
    res.send({ user_stats: userLevels, platform_standards: levels, tiers });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get("/api/v1/user-impact", async (req, res) => {
  try {
    let pubkey = req.query.pubkey;

    if (!pubkey) return res.send({});
    if (!utils.isValidPrivateKey(pubkey))
      return res.status(401).send({ message: "Invalid pubkey" });

    let userImpact = await getUserImpact(pubkey);
    return res.send(userImpact);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
});

const actionToUpdate = (
  action_key,
  action_details,
  user_actions,
  last_updated,
  currentVolumeTier
) => {
  let user_action = user_actions.find((action) => action.action === action_key);
  if (user_action) {
    if (action_details.count > 0) {
      if (user_action.count >= action_details.count) return false;
      let action_to_update = {
        current_points:
          user_action.current_points +
          action_details.points[action_details.point_index] * currentVolumeTier,
        count: user_action.count + 1,
        last_updated,
        all_time_points:
          user_action.all_time_points +
          action_details.points[action_details.point_index] * currentVolumeTier,
        extra: {},
        points:
          action_details.points[action_details.point_index] * currentVolumeTier,
      };
      return action_to_update;
    }
    if (user_action.last_updated + action_details.cooldown >= last_updated)
      return false;
    let action_to_update = {
      current_points:
        user_action.current_points +
        action_details.points[action_details.point_index] * currentVolumeTier,
      count: 0,
      last_updated,
      all_time_points:
        user_action.all_time_points +
        action_details.points[action_details.point_index] * currentVolumeTier,
      extra: {},
      points:
        action_details.points[action_details.point_index] * currentVolumeTier,
    };
    return action_to_update;
  }
  let new_action = {
    action: action_key,
    current_points:
      action_details.points[action_details.point_index] * currentVolumeTier,
    count: action_details.count > 0 ? 1 : 0,
    extra: {},
    all_time_points:
      action_details.points[action_details.point_index] * currentVolumeTier,
    last_updated,
    points:
      action_details.points[action_details.point_index] * currentVolumeTier,
  };
  return new_action;
};

const actionToUpdateV2 = async (
  user,
  action_key,
  action_details,
  user_actions,
  last_updated,
  currentVolumeTier
) => {
  let user_action = user_actions.find((action) => action.action === action_key);

  let accountsNumber = 0;
  let checkUser = user
    ? (action_key === "nip05" && user.nip05) ||
      (action_key === "luds" && user.lud16)
    : false;
  if (checkUser) {
    accountsNumber =
      action_key === "nip05"
        ? await Users.find({ nip05: user.nip05 }).countDocuments()
        : await Users.find({ lud16: user.lud16 }).countDocuments();
  }
  if (user_action) {
    if (
      accountsNumber >= action_details.count ||
      user_action.count >= action_details.count
    )
      return false;
    let action_to_update = {
      current_points:
        user_action.current_points +
        action_details.points[0] * currentVolumeTier,
      count: user_action.count + 1,
      last_updated,
      all_time_points:
        user_action.all_time_points +
        action_details.points[0] * currentVolumeTier,
      extra: {},
      points: action_details.points[0] * currentVolumeTier,
    };
    return action_to_update;
  }
  if (accountsNumber >= action_details.count) return false;
  let new_action = {
    action: action_key,
    current_points: action_details.points[0] * currentVolumeTier,
    count: 1,
    extra: {},
    all_time_points: action_details.points[0] * currentVolumeTier,
    last_updated,
    points: action_details.points[0] * currentVolumeTier,
  };
  return new_action;
};

const actionToUpdateV3 = (
  action_key,
  action_details,
  user_actions,
  last_updated,
  currentVolumeTier,
  extra
) => {
  let user_action = user_actions.find((action) => action.action === action_key);
  if (user_action) {
    if (
      user_action.extra.writing_impact > extra.writing_impact &&
      user_action.extra.rating_impact > extra.rating_impact
    )
      return false;
    let added_points = 0;
    if (user_action.extra.writing_impact < extra.writing_impact)
      added_points =
        added_points +
        action_details.points[action_details.point_index] * currentVolumeTier;
    if (user_action.extra.rating_impact < extra.rating_impact)
      added_points =
        added_points +
        action_details.points[action_details.point_index] * currentVolumeTier;
    let action_to_update = {
      current_points: user_action.current_points + added_points,
      count: 0,
      last_updated,
      all_time_points: user_action.all_time_points + added_points,
      extra: {
        writing_impact:
          user_action.extra.writing_impact < extra.writing_impact
            ? extra.writing_impact
            : user_action.extra.writing_impact,
        rating_impact:
          user_action.extra.rating_impact < extra.rating_impact
            ? extra.rating_impact
            : user_action.extra.rating_impact,
      },
      points: added_points,
    };
    return action_to_update;
  }
  let added_points = 0;
  if (extra.writing_impact > 0)
    added_points =
      added_points +
      action_details.points[action_details.point_index] * currentVolumeTier;
  if (extra.rating_impact > 0)
    added_points =
      added_points +
      action_details.points[action_details.point_index] * currentVolumeTier;
  let new_action = {
    action: action_key,
    current_points: added_points,
    count: action_details.count > 0 ? 1 : 0,
    extra: {
      writing_impact: extra.writing_impact > 0 ? extra.writing_impact : 0,
      rating_impact: extra.rating_impact > 0 ? extra.rating_impact : 0,
    },
    all_time_points: added_points,
    last_updated,
    points: added_points,
  };
  return new_action;
};

const getUserImpact = async (pubkey) => {
  try {
    let [
      user_all_notes,
      user_sealed_notes,
      user_ratings_in_sealed,
      user_ratings,
    ] = await Promise.all([
      UncensoredNotes.find({ pubkey }),
      SealedNotes.find({
        tags: {
          $elemMatch: {
            $and: [{ 0: "author" }, { 1: pubkey }],
          },
        },
      }),
      SealedNotes.find({
        tags: {
          $elemMatch: {
            $and: [{ 0: "p" }, { 1: pubkey }],
          },
        },
      }),
      UNRatings.find({
        $or: [
          { helpful_ratings: { $elemMatch: { pubkey: pubkey } } },
          { not_helpful_ratings: { $elemMatch: { pubkey: pubkey } } },
        ],
      }),
    ]);

    let user_rated_notes = user_ratings.map((rating) => rating.uncensored_note);
    let user_rated_sealed_notes = await SealedNotes.find({
      tags: {
        $elemMatch: {
          $and: [{ 0: "e" }, { 1: { $in: user_rated_notes } }],
        },
      },
    });

    let writing_impact = 0;
    let positive_writing_impact = 0;
    let negative_writing_impact = 0;

    for (let sn of user_sealed_notes) {
      let rating = sn.tags.find((tag) => tag[0] === "rating")[1];
      if (rating === "+") positive_writing_impact += 1;
      if (rating === "-") negative_writing_impact += 1;
    }
    writing_impact = positive_writing_impact - negative_writing_impact;

    let rating_impact = 0;
    let positive_rating_impact_h = 0;
    let positive_rating_impact_nh = 0;
    let negative_rating_impact_h = 0;
    let negative_rating_impact_nh = 0;

    for (let ur of user_rated_sealed_notes) {
      let rating = ur.tags.find((tag) => tag[0] === "rating")[1];
      let isRater = ur.tags.find((tag) => tag[0] === "p" && tag[1] === pubkey);
      if (!isRater) {
        if (rating === "+") negative_rating_impact_h += 1;
        if (rating === "-") negative_rating_impact_nh += 1;
      }
    }
    for (let ur of user_ratings_in_sealed) {
      let rating = ur.tags.find((tag) => tag[0] === "rating")[1];
      if (rating === "+") positive_rating_impact_h += 1;
      if (rating === "-") positive_rating_impact_nh += 1;
    }
    rating_impact =
      positive_rating_impact_h +
      positive_rating_impact_nh -
      negative_rating_impact_h +
      negative_rating_impact_nh * 2;

    return {
      writing_impact: {
        writing_impact,
        positive_writing_impact,
        negative_writing_impact,
        ongoing_writing_impact:
          user_all_notes.length -
          (positive_writing_impact + negative_writing_impact),
      },
      rating_impact: {
        rating_impact,
        positive_rating_impact_h,
        positive_rating_impact_nh,
        negative_rating_impact_h,
        negative_rating_impact_nh,
        ongoing_rating_impact:
          user_ratings.length - user_rated_sealed_notes.length,
      },
    };
  } catch (err) {
    return {
      writing_impact: {
        writing_impact: 0,
        positive_writing_impact: 0,
        negative_writing_impact: 0,
        ongoing_writing_impact: 0,
      },
      rating_impact: {
        rating_impact: 0,
        positive_rating_impact_h: 0,
        positive_rating_impact_nh: 0,
        negative_rating_impact_h: 0,
        negative_rating_impact_nh: 0,
        ongoing_rating_impact: 0,
      },
    };
  }
};

const getPointsIndex = (action_key) => {
  if (["zap-1", "zap-20", "zap-60", "zap-100"].includes(action_key)) {
    return zaps_intervals[action_key];
  }
  if (["dms-5", "dms-10"].includes(action_key)) {
    return dms_intervals[action_key];
  }
  return 0;
};

const getActionDetails = (action_key, point_index) => {
  if (["zap-1", "zap-20", "zap-60", "zap-100"].includes(action_key)) {
    return { ...levels[action_key.split("-")[0]], point_index };
  }
  if (["dms-5", "dms-10"].includes(action_key)) {
    return { ...levels[action_key.split("-")[0]], point_index };
  }
  return { ...levels[action_key], point_index };
};

const getActionKey = (action_key) => {
  return action_key.split("-")[0];
};

const updateUserImpact = async (action_key, userLevels, pubkey) => {
  let point_index = getPointsIndex(action_key);
  let action_details = getActionDetails(action_key, point_index);
  let currentLevel = getCurrentLevel(userLevels.xp);
  let currentVolumeTier = tiers.find((tier) => {
    if (tier.max > -1 && tier.min <= currentLevel && tier.max >= currentLevel) {
      return tier;
    }
    if (tier.max == -1 && tier.min <= currentLevel) return tier;
  }).volume;
  let last_updated = Math.floor(new Date().getTime() / 1000);
  let user_impact = await getUserImpact(pubkey);
  let action_to_update = actionToUpdateV3(
    action_key,
    action_details,
    userLevels.actions,
    last_updated,
    currentVolumeTier,
    {
      writing_impact: user_impact.writing_impact,
      rating_impact: user_impact.rating_impact,
    }
  );
  if (!action_to_update) return false;

  let updated_user = await UserLevels.findOneAndUpdate(
    { pubkey, "actions.action": action_key },
    {
      xp: userLevels.xp + action_to_update.points,
      current_points: {
        points: userLevels.current_points.points + action_to_update.points,
        last_updated,
      },
      $set: {
        "actions.$.action": action_to_update.action,
        "actions.$.current_points": action_to_update.current_points,
        "actions.$.count": action_to_update.count,
        "actions.$.last_updated": action_to_update.last_updated,
        "actions.$.all_time_points": action_to_update.all_time_points,
        "actions.$.extra": action_to_update.extra,
      },
      last_updated,
    },
    { new: true }
  );
  if (!updated_user) {
    let updated_user_2 = await UserLevels.findOneAndUpdate(
      { pubkey },
      {
        xp: userLevels.xp + action_to_update.points,
        current_points: {
          points: userLevels.current_points.points + action_to_update.points,
          last_updated,
        },
        $push: { actions: action_to_update },
        last_updated,
      },
      { new: true }
    );
  }
};
module.exports = router;
