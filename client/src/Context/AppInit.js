import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../Helpers/DB";

export default function AppInit() {
  const dispatch = useDispatch();
  const chatrooms = useLiveQuery(() => db.mutedlist.toArray(), []);

  useEffect(() => {
    console.log(chatrooms);
    // if (liveData) {
    //   dispatch(setData(liveData));
    // }
  }, [chatrooms, dispatch]);
  return null;
}
