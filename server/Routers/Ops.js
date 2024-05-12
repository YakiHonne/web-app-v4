const express = require("express");
const axios = require("axios");
const router = express.Router();
const topics = require("../DB/Topics");
const OpenAI = require("openai");
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
    res.status(500).send(err)
  }
});

module.exports = router;
