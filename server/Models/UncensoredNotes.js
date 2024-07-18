const mongoose = require("mongoose");

const UncensoredNotesSchema = mongoose.Schema({
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

const UncensoredNotes = (module.exports = mongoose.model(
  "UncensoredNotes",
  UncensoredNotesSchema,
  "uncensorednotes"
));
