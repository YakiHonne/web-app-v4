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
const { actions_keys, levels } = require("../DB/LevelsActions");
const MongoStore = require("connect-mongo");
const Users = require("../Models/Users");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    res.send({ message: "Logged in!" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.post("/api/v1/logout", auth_user, async (req, res) => {
  try {
    let pubkey = req.body.pubkey;
    if (pubkey === req.user.pubkey) {
      delete res.session.user_token;
      return res.send({ message: "Logged out!" });
    }
    return res.status(403).send({ message: "Cannot log out!" });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.post("/api/v1/yaki-chest", async (req, res) => {
  try {
    let action_key = req.body.action_key;
    let last_updated = Math.floor(new Date().getTime() / 1000);
    // let pubkey = req.user.pubkey;
    let pubkey =
      "28313968021dd85505275f2edf55d8feb071a88adec61a06d34923b57e036f8d";

    if (!action_key || typeof action_key !== "string")
      return res
        .status(403)
        .send({ message: "action_key is missing or is not string" });
    if (!actions_keys.includes(action_key.toString()))
      return res.status(403).send({ message: "unsupported action key" });

    let action_details = levels[action_key];
    let [userLevels, user] = await Promise.all([
      UserLevels.findOne({ pubkey }),
      Users.findOne({ pubkey }),
    ]);

    if (!userLevels) {
      let new_action = {
        action: action_key,
        current_points: action_details.points[0],
        count: action_details.count > 0 ? 1 : 0,
        extra: {},
        all_time_points: action_details.points[0],
        last_updated,
      };
      let updated_user = await UserLevels.findOneAndUpdate(
        { pubkey },
        {
          xp:
            50 + (action_key === "new_account" ? 0 : action_details.points[0]),
          $push: { actions: new_action },
          last_updated,
        },
        { upsert: true, new: true }
      );
      return res.send(updated_user);
    }
    let action_to_update = ["nip05", "luds"].includes
      ? actionToUpdateV2(
          user,
          action_key,
          action_details,
          userLevels.actions,
          last_updated
        )
      : actionToUpdate(
          action_key,
          action_details,
          userLevels.actions,
          last_updated
        );
    if (action_to_update === false) return res.send(userLevels);
    let updated_user = await UserLevels.findOneAndUpdate(
      { pubkey, "actions.action": action_key },
      {
        xp: userLevels.xp + action_to_update.points,
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
    if (updated_user) return res.send(updated_user);
    let updated_user_2 = await UserLevels.findOneAndUpdate(
      { pubkey },
      {
        xp: userLevels.xp + action_to_update.points,
        $push: { actions: action_to_update },
        last_updated,
      },
      { new: true }
    );
    return res.send(updated_user_2);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
router.get("/api/v1/yaki-chest/stats", async (req, res) => {
  try {
    let last_updated = Math.floor(new Date().getTime() / 1000);
    // let pubkey = req.user.pubkey;
    let pubkey =
      "28313968021dd85505275f2edf55d8feb071a88adec61a06d34923b57e036f8d";

    let userLevels = await UserLevels.findOne({ pubkey }).select("-_id");

    if (!userLevels)
      return res.send({
        user_stats: { pubkey, xp: 0, actions: [], last_updated },
        platform_standards: levels,
      });
    res.send({ user_stats: userLevels, platform_standards: levels });
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
    return res.send({
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
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
});

const actionToUpdate = (
  action_key,
  action_details,
  user_actions,
  last_updated
) => {
  let user_action = user_actions.find((action) => action.action === action_key);
  if (user_action) {
    if (action_details.count > 0) {
      if (user_action.count >= action_details.count) return false;
      let action_to_update = {
        current_points: user_action.current_points + action_details.points[0],
        count: user_action.count + 1,
        last_updated,
        all_time_points: user_action.all_time_points + action_details.points[0],
        extra: {},
        points: action_details.points[0],
      };
      return action_to_update;
    }
    if (user_action.last_updated + action_details.cooldown >= last_updated)
      return false;
    let action_to_update = {
      current_points: user_action.current_points + action_details.points[0],
      count: 0,
      last_updated,
      all_time_points: user_action.all_time_points + action_details.points[0],
      extra: {},
      points: action_details.points[0],
    };
    return action_to_update;
  }
  let new_action = {
    action: action_key,
    current_points: action_details.points[0],
    count: action_details.count > 0 ? 1 : 0,
    extra: {},
    all_time_points: action_details.points[0],
    last_updated,
    points: action_details.points[0],
  };
  return new_action;
};

const actionToUpdateV2 = async (
  user,
  action_key,
  action_details,
  user_actions,
  last_updated
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
    if (accountsNumber >= action_details.count || user_action.count >= action_details.count) return false;
    let action_to_update = {
      current_points: user_action.current_points + action_details.points[0],
      count: user_action.count + 1,
      last_updated,
      all_time_points: user_action.all_time_points + action_details.points[0],
      extra: {},
      points: action_details.points[0],
    };
    return action_to_update;
  }
  if (accountsNumber >= action_details.count) return false;
  let new_action = {
    action: action_key,
    current_points: action_details.points[0],
    count: 1,
    extra: {},
    all_time_points: action_details.points[0],
    last_updated,
    points: action_details.points[0],
  };
  return new_action;
};

module.exports = router;
