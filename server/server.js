// const express = require("express");
// const app = express();
// const path = require("path");
// const NIP05 = require("./Routers/NIP05");
// const UploadFiles = require("./Routers/UploadFiles");
// const Ops = require("./Routers/Ops");
// const fileupload = require("express-fileupload");
// const session = require("express-session");
// const MongoStore = require("connect-mongo");
// const mongoose = require("mongoose");
// const { v4: uuidv4 } = require("uuid");

// // const { RelayPool } = require("nostr");
// const PORT = process.env.PORT || 4300;

// app.use(express.json());
// app.use(fileupload());
// app.use(
//   session({
//     genid: (req) => {
//       return uuidv4();
//     },
//     resave: false,
//     saveUninitialized: false,
//     proxy: true,
//     cookie: {
//       httpOnly: true,
//       secure: false,
//       sameSite: "strict",
//     },
//     secret: process.env.SESSION_SECRET,
//     store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
//   })
// );
// app.use("/", UploadFiles);
// app.use("/", NIP05);
// app.use("/", Ops);

// app.use(
//   require("prerender-node").set("prerenderToken", "6pWKlK16TlpJIRtzeTjo")
// );
// // app.use(express.static("build"));

// // app.get("*", (req, res) => {
// //   res.sendFile(path.resolve(__dirname, "build", "index.html"));
// // });
// app.listen(PORT);
require("./instrument.js");
const Sentry = require("@sentry/node");
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
Sentry.setupExpressErrorHandler(app);

app.use(
  // require("prerender-node").set(
  //   "prerenderServiceUrl",
  //   "https://prerender.yakihonne.com"
  // )
  require("prerender-node").set("prerenderToken", "6pWKlK16TlpJIRtzeTjo")
);
app.use(express.static("build"));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "build", "index.html"));
});
app.listen(PORT); 