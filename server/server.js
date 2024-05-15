const express = require("express");
const app = express();
const path = require("path");
const NIP05 = require("./Routers/NIP05");
const UploadFiles = require("./Routers/UploadFiles");
const Ops = require("./Routers/Ops");
const fileupload = require("express-fileupload");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// const { RelayPool } = require("nostr");
const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.DB_URL);
mongoose.connection.on("error", console.error.bind(console, "Error"));
mongoose.connection.on("open", () => {
  console.log("Connection is established");
});
app.use(express.json());
app.use(fileupload());
app.use(
  session({
    genid: (req) => {
      return uuidv4();
    },
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    },
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
  })
);
app.use("/", UploadFiles);
app.use("/", NIP05);
app.use("/", Ops);

// const jb55 = "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245";
// const damus = "wss://relay.damus.io";
// const scsi = "wss://nostr-pub.wellorder.net";
// const relays = [damus, scsi];

// const pool = RelayPool(relays);

// pool.on("open", (relay) => {
//   relay.subscribe("subid", { kinds: [1], "#l": ["FLASH NEWS"] });
// });

// pool.on("eose", (relay) => {
//   relay.close();
// });

// pool.on("event", (relay, sub_id, ev) => {
//   console.log(ev);
// });

// app.use(express.static("build"));
// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "build", "index.html"));
// });

app.use(
  require("prerender-node").set("prerenderToken", "6pWKlK16TlpJIRtzeTjo")
);
app.listen(PORT);
