import React from "react";
import { useSelector } from "react-redux";
import { getEventStatAfterEOSE } from "../../Helpers/Controlers";
import { saveEventStats } from "../../Helpers/DB";
import { checkForLUDS, getZapper } from "../../Helpers/Encryptions";
import ZapTip from "../Main/ZapTip";

export default function Zap({ event, user, actions , isZapped}) {
  const userMetadata = useSelector((state) => state.userMetadata);

  const reactToNote = async (event_) => {
    let zapper = getZapper(event_);
    let sats = zapper.amount;
    let stats = getEventStatAfterEOSE(zapper, "zaps", actions, sats);
    saveEventStats(event.id, stats);
  };

  return (
    <ZapTip
      recipientLNURL={checkForLUDS(user.lud06, user.lud16)}
      recipientPubkey={event.pubkey}
      senderPubkey={userMetadata.pubkey}
      recipientInfo={{
        name: user.name,
        picture: user.picture,
      }}
      eTag={event.id}
      forContent={event.content.substring(0, 40)}
      onlyIcon={true}
      setReceivedEvent={reactToNote}
      isZapped={isZapped}
    />
  );
}
