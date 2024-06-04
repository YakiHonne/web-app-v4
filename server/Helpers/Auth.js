const { nip44 } = require("nostr-tools");
const jwt = require("jsonwebtoken");

const auth_data = (req, res, next) => {
  let apikey = req.headers["yakihonne-api-key"];

  if (apikey && apikey === process.env.FS_API_KEY) {
    next();
  } else {
    if (!apikey) return res.status(401).send({ message: "Missing API KEY" });
    return res.status(401).send({ message: "Invalid API KEY" });
  }
};

const auth_user = (req, res, next) => {
  let user_token = req.session.user_token;
  if (!user_token)
    return res.status(401).send({ message: "The user is logged out" });

  jwt.verify(user_token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(401).send({ message: "Invalid token" });
    } else {
      let ip = req.ip;
      let user_agent = req.get("User-Agent");
      if (user.user_agent === user_agent && user.ip === ip) {
        req.user = user;
        next();
      } else
        return res
          .status(401)
          .send({ message: "This user has a faulty token." });
    }
  });
};

const user_login = (req, res, next) => {
  try {
    let pubkey = req.body.pubkey;
    let password = req.body.password;
    let currentTime = Math.floor(new Date().getTime() / 1000);

    if (!(pubkey && password))
      return res.status(403).send({ message: "Pubkey or password missing" });

    let cracked_password = nip44.v2.decrypt(
      password,
      nip44.v2.utils.getConversationKey(
        process.env.PASSWORD_CRACKER_SEC,
        pubkey
      )
    );
    if (cracked_password) {
      let parsed_cracked_password = JSON.parse(cracked_password);

      if (
        pubkey === parsed_cracked_password.pubkey &&
        parsed_cracked_password?.sent_at <= currentTime &&
        parsed_cracked_password?.sent_at + 8 >= currentTime
      ) {
        req.user = { pubkey };
        next();
        return;
      }
      return res.status(403).send({ message: "Invalid password" });
    }
    return res.status(403).send({ message: "Invalid password" });
  } catch (err) {
    return res.status(403).send({ message: "Invalid pubkey or password" });
  }
};

const user_tokenizing = (req, res, next) => {
  try {
    req.session.user_token = jwt.sign(
      { ...req.user, ip: req.ip, user_agent: req.get("User-Agent") },
      process.env.JWT_SECRET
    );
    next();
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
};

module.exports = {
  auth_data,
  user_login,
  user_tokenizing,
  auth_user,
};
