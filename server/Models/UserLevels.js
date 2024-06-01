const mongoose = require("mongoose");

const UserLevelsSchema = mongoose.Schema({
  pubkey: {
    type: String,
    required: true,
  },
  xp: {
    type: Number,
    default: 0,
  },
  current_points: {
    type: Object,
    default: {
      points: 0,
      last_updated: Math.floor(new Date().getTime() / 1000),
    },
  },
  actions: {
    type: [
      {
        action: { type: String, required: true },
        current_points: { type: Number, required: true },
        count: { type: Number, default: 0 },
        extra: { type: Object, default: {} },
        all_time_points: { type: Number, default: 0 },
        last_updated: {
          type: Number,
          default: Math.floor(new Date().getTime() / 1000),
        },
        _id: false,
      },
    ],
    default: [],
  },

  last_updated: {
    type: Number,
    default: Math.floor(new Date().getTime() / 1000),
  },
});

const UserLevels = (module.exports = mongoose.model(
  "UserLevels",
  UserLevelsSchema,
  "userlevels"
));
