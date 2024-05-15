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
    let userLevels = await UserLevels.findOne({ pubkey });

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
    res.send({message: "more to update!"})
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

module.exports = router;
