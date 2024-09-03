import Dexie from "dexie";

export const db = new Dexie("yaki-nostr");

db.version(3).stores({ mutedlist: "&id" });
