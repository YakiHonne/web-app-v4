const mongoose = require("mongoose");

const SealedNotesSchema = mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Number,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  kind: {
    type: Number,
    required: true,
  },
  pubkey: {
    type: String,
    required: true,
  },
  sig: {
    type: String,
    required: true,
  },
  tags: {
    type: Array,
    default: [],
  },
});

const SealedNotes = (module.exports = mongoose.model(
  "SealedNotes",
  SealedNotesSchema,
  "sealednotes"
));
