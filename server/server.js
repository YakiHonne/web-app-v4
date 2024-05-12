const express = require("express");
const app = express();
const path = require("path");
const NIP05 = require("./Routers/NIP05");
const UploadFiles = require("./Routers/UploadFiles");
const Ops = require("./Routers/Ops");
const fileupload = require("express-fileupload");

// const { RelayPool } = require("nostr");
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(fileupload());

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
