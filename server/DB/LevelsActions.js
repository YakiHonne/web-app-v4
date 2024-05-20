const levels = {
  new_account: {
    points: [50],
    count: 1,
    cooldown: 0,
    display_name: "Account creation"
  },
  username: {
    points: [5],
    count: 5,
    cooldown: 0,
    display_name: "Setting a username"
  },
  bio: {
    points: [5],
    count: 5,
    cooldown: 0,
    display_name: "Setting a bio"
  },
  profile_picture: {
    points: [5],
    count: 5,
    cooldown: 0,
    display_name: "Setting a profile picture"
  },
  cover: {
    points: [5],
    count: 5,
    cooldown: 0,
    display_name: "Setting a profile cover"
  },
  nip05: {
    points: [5],
    count: 3,
    cooldown: 0,
    display_name: "Using a nip05"
  },
  luds: {
    points: [15],
    count: 3,
    cooldown: 0,
    display_name: "Using a lightning address"
  },
  relays_setup: {
    points: [10],
    count: 1,
    cooldown: 0,
    display_name: "Setting favorite relays"
  },
  topics_setup: {
    points: [10],
    count: 1,
    cooldown: 0,
    display_name: "Choosing favorite topics"
  },
  follow_yaki: {
    points: [30],
    count: 1,
    cooldown: 0,
    display_name: "Following Yakihonne official account"
  },
  flashnews_draft: {
    points: [4],
    count: 0,
    cooldown: 0,
    display_name: "Flash news drafts"
  },
  flashnews_post: {
    points: [15],
    count: 0,
    cooldown: 0,
    display_name: "Posting flash news"
  },
  un_write: {
    points: [2],
    count: 0,
    cooldown: 3600,
    display_name: "Uncensored notes writing"
  },
  un_rate: {
    points: [1],
    count: 0,
    cooldown: 3600,
    display_name: "Uncensored notes rating"
  },
  curation_post: {
    points: [2],
    count: 0,
    cooldown: 7200,
    display_name: "Posting curations"
  },
  article_post: {
    points: [4],
    count: 0,
    cooldown: 3600,
    display_name: "Posting articles" 
  },
  article_draft: {
    points: [2],
    count: 0,
    cooldown: 3600,
    display_name: "Article drafts"
  },
  video_post: {
    points: [3],
    count: 0,
    cooldown: 7200,
    display_name: "Posting videos"
  },
  bookmark: {
    points: [2],
    count: 0,
    cooldown: 0,
    display_name: "Bookmarking"
  },
  zap: {
    points: [1, 5, 10, 20],
    count: 0,
    cooldown: 0,
    display_name: "Zapping"
  },
  upvote: {
    points: [2],
    count: 0,
    cooldown: 0,
    display_name: "Upvoting posts"
  },
  downvote: {
    points: [2],
    count: 0,
    cooldown: 0,
    display_name: "Downvoting posts"
  },
  comment_post: {
    points: [2],
    count: 0,
    cooldown: 900,
    display_name: "Posting comments"
  },
};
const actions_keys = [
  "new_account",
  "username",
  "bio",
  "profile_picture",
  "cover",
  "nip05",
  "luds",
  "relays_setup",
  "topics_setup",
  "follow_yaki",
  "flashnews_draft",
  "flashnews_post",
  "un_write",
  "un_rate",
  "curation_post",
  "article_post",
  "article_draft",
  "video_post",
  "bookmark",
  "zap",
  "upvote",
  "downvote",
  "comment_post",
];

const tiers = {
  
}

module.exports = { levels, actions_keys };
