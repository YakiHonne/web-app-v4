const mongoose = require("mongoose");

const UNRatingsSchema = mongoose.Schema({
  original_note: {
    type: String,
    default: "",
  },
  uncensored_note: {
    type: String,
    default: "",
  },
  pubkey: {
    type: String,
    default: "",
  },
  helpful_ratings: {
    type: Array,
    default: [],
  },
  not_helpful_ratings: {
    type: Array,
    default: [],
  },
  last_updated: {
    type: Number,
    required: true,
  },
  
});

const UNRatings = (module.exports = mongoose.model(
  "UNRatings",
  UNRatingsSchema,
  "unratings"
));
