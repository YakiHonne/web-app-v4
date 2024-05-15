const levels = {
  new_account: {
    points: [50],
    count: 1,
    cooldown: 0,
  },
  username: {
    points: [5],
    count: 5,
    cooldown: 0,
  },
  bio: {
    points: [5],
    count: 5,
    cooldown: 0,
  },
  profile_picture: {
    points: [5],
    count: 5,
    cooldown: 0,
  },
  cover: {
    points: [5],
    count: 1,
    cooldown: 0,
  },
  nip05: {
    points: [5],
    count: 1,
    cooldown: 0,
  },
  luds: {
    points: [15],
    count: 1,
    cooldown: 0,
  },
  relays_setup: {
    points: [10],
    count: 1,
    cooldown: 0,
  },
  topics_setup: {
    points: [10],
    count: 1,
    cooldown: 0,
  },
  follow_yaki: {
    points: [30],
    count: 1,
    cooldown: 0,
  },
  flashnews_draft: {
    points: [15],
    count: 0,
    cooldown: 0,
  },
  flashnews_post: {
    points: [4],
    count: 0,
    cooldown: 0,
  },
  un_write: {
    points: [2],
    count: 0,
    cooldown: 3600,
  },
  un_rate: {
    points: [1],
    count: 0,
    cooldown: 3600,
  },
  curation_post: {
    points: [2],
    count: 0,
    cooldown: 7200,
  },
  article_post: {
    points: [4],
    count: 0,
    cooldown: 3600,
  },
  article_draft: {
    points: [2],
    count: 0,
    cooldown: 3600,
  },
  video_post: {
    points: [3],
    count: 0,
    cooldown: 7200,
  },
  bookmark: {
    points: [2],
    count: 0,
    cooldown: 0,
  },
  zap: {
    points: [1, 5, 10, 20],
    count: 0,
    cooldown: 0,
  },
  upvote: {
    points: [2],
    count: 0,
    cooldown: 0,
  },
  downvote: {
    points: [2],
    count: 0,
    cooldown: 0,
  },
  comment_post: {
    points: [2],
    count: 0,
    cooldown: 900,
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

module.exports = { levels, actions_keys };
