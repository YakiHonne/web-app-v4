const mongoose = require("mongoose");

const UsersSchema = mongoose.Schema({
  created_at: {
    type: Number,
    required: true,
  },
  pubkey: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "",
  },
  display_name: {
    type: String,
    default: "",
  },
  picture: {
    type: String,
    default: "",
  },
  banner: {
    type: String,
    default: "",
  },
  about: {
    type: String,
    default: "",
  },
  lud06: {
    type: String,
    default: "",
  },
  lud16: {
    type: String,
    default: "",
  },
  nip05: {
    type: String,
    default: "",
  },
  website: {
    type: String,
    default: "",
  },
  hashed_pubkey: {
    type: String,
    default: "",
  },
});

const Users = (module.exports = mongoose.model("Users", UsersSchema, "users"));
