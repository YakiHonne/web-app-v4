import NDK, { NDKRelay } from "@nostr-dev-kit/ndk";
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";
import relaysOnPlatform from "../Content/Relays";
import bannedList from "../Content/BannedList";

const ndkInstance = new NDK({
  explicitRelayUrls: relaysOnPlatform,
  enableOutboxModel: true,
  // mutedIds: bannedList,
});
await ndkInstance.connect();

ndkInstance.cacheAdapter = new NDKCacheAdapterDexie({ dbName: "ndk-store" });

export { ndkInstance };

// export const addExplicitRelays = (relayList) => {
//   if (!Array.isArray(relayList)) return;

//   let tempRelayList = relayList.filter(
//     (relay) => !ndkInstance.explicitRelayUrls.includes(`${relay}`)
//   );

//   ndkInstance.explicitRelayUrls = relayList;
//   console.log(relayList)
//   for (let relay of tempRelayList)
//     ndkInstance.pool.addRelay(
//       new NDKRelay(relay, undefined, ndkInstance),
//       undefined,
//       true
//     );
// };
export const addExplicitRelays = (relayList) => {
  try {
    if (!Array.isArray(relayList)) return;

    let tempRelayList = relayList.filter(
      (relay) => !ndkInstance.explicitRelayUrls.includes(`${relay}`)
    );
    if (tempRelayList.length === 0) return;
    for (let relay of tempRelayList) {
      ndkInstance.addExplicitRelay(relay, undefined, true);
    }
  } catch (err) {
    console.log(err);
  }
};
