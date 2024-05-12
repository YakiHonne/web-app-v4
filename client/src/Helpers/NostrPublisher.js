import relaysOnPlatform from "../Content/Relays";
import { getEventHash, finalizeEvent, relayInit } from "nostr-tools";
import axiosInstance from "./HTTP_Client";
import { SimplePool } from "nostr-tools";
const pool = new SimplePool();

const sleep = async (milliseconds) => {
  return await new Promise((resolve) => {
    setTimeout(() => {
      return resolve(false);
    }, milliseconds);
  });
};
// const publishPost = async (
//   nostrKeys,
//   kind = 0,
//   content,
//   tags = [],
//   allRelays = relaysOnPlatform
// ) => {
//   let event = {
//     kind,
//     content,
//     created_at: Math.floor(Date.now() / 1000),
//     tags,
//   };
//   if (nostrKeys.ext) {
//     try {
//       event = await window.nostr.signEvent(event);
//     } catch {
//       return false;
//     }
//   } else {
//     event = finalizeEvent(event, nostrKeys.sec);
//   }
//   let relaysTopublish = [];
//   for (let url of allRelays) {
//     try {
//       let relay = relayInit(url);
//       var res = { url: url.split("wss://")[1], status: false };

//       let relayConnection = await Promise.race([relay.connect(), sleep(3000)]);

//       if (relayConnection === false) {
//         res.status = false;
//         relaysTopublish.push(res);
//       } else {
//         let pub = relay.publish(event);
//         let status = new Promise((resolve) => {
//           pub.on("ok", (e) => {
//             resolve(true);
//           });
//           pub.on("failed", (e) => {
//             resolve(false);
//           });
//         });
//         await status.then((result) => {
//           res.status = result;
//         });
//         relaysTopublish.push(res);
//       }
//     } catch (err) {
//       console.log(err);
//       relaysTopublish.push(false);
//     }
//   }
//   return relaysTopublish;
// };
const getZapEventRequest = async (nostrKeys, content, tags = []) => {
  let event = {
    kind: 9734,
    content,
    created_at: Math.floor(Date.now() / 1000),
    tags,
  };
  if (nostrKeys.ext) {
    try {
      event = await window.nostr.signEvent(event);
    } catch {
      return false;
    }
  } else {
    event = finalizeEvent(event, nostrKeys.sec);
  }

  return encodeURI(JSON.stringify(event));
};

// const deletePost = async (nostrKeys, eventID, allRelays = relaysOnPlatform) => {
//   let event = {
//     kind: 5,
//     content: "This post is to delete!",
//     created_at: Math.floor(Date.now() / 1000),
//     tags: [["e", eventID]],
//   };
//   if (nostrKeys.ext) {
//     event = await window.nostr.signEvent(event);
//   } else {
//     event = finalizeEvent(event, nostrKeys.sec);
//   }

//   let relaysTopublish = [];
//   for (let url of allRelays) {
//     try {
//       let relay = relayInit(url);
//       var res = { url: url.split("wss://")[1], status: false };
//       let relayConnection = await Promise.race([relay.connect(), sleep(3000)]);
//       if (relayConnection === false) {
//         res.status = false;
//         relaysTopublish.push(res);
//       } else {
//         // await relay.connect();
//         let pub = relay.publish(event);
//         let status = new Promise((resolve) => {
//           pub.on("ok", () => {
//             resolve(true);
//           });
//           pub.on("failed", () => {
//             resolve(false);
//           });
//         });
//         // let status_1 = await Promise.race([
//         //   status.then((result) => {
//         //     res.status = result;
//         //   }),
//         //   sleep(3000),
//         // ]);
//         await status.then((result) => {
//           res.status = result;
//         });

//         relaysTopublish.push(res);
//       }
//     } catch (err) {
//       console.log(err);
//       // return res;
//       relaysTopublish.push(res);
//     }
//   }
//   return relaysTopublish;
// };

const uploadToS3 = async (img, pubkey) => {
  if (img) {
    try {
      let fd = new FormData();
      fd.append("file", img);
      fd.append("pubkey", pubkey);
      let data = await axiosInstance.post("/api/v1/file-upload", fd, {
        headers: { "Content-Type": "multipart/formdata" },
      });
      return data.data.image_path;
    } catch {
      return false;
    }
  }
};

const deleteFromS3 = async (img) => {
  if (img.includes("daorayaki-fs-bucket")) {
    let data = await axiosInstance.delete("/api/v1/file-upload", {
      params: { image_path: img },
    });
    return true;
  }
  return false;
};

export {
  uploadToS3,
  deleteFromS3,
  getZapEventRequest,
};
