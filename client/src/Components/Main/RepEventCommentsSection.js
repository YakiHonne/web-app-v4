import React from "react";
import CommentsSection from "./CommentsSection";
import { eventKinds } from "../../Content/Extra";
import LinkRepEventPreview from "./LinkRepEventPreview";
import { useTranslation } from "react-i18next";

export default function RepEventCommentsSection({
  event,
  leaveComment,
  id,
  eventPubkey,
  author,
  exit,
  kind,
}) {
  const { t } = useTranslation();
  return (
    <div
      className="fit-container fx-centered fx-start-h fx-col"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 20,
        height: "100dvh",
        overflow: "scroll",
        backgroundColor: "var(--white)",
      }}
    >
      <div className="main-middle">
        <div
          className="fx-centered fit-container fx-start-h box-pad-v-m sticky"
          onClick={exit}
        >
          <button
            className="btn btn-normal btn-gray"
            style={{ padding: "0 1rem" }}
          >
            <div className="arrow arrow-back"></div>
          </button>
          <p>{t("ATB2h6T")}</p>
        </div>
        {event && <LinkRepEventPreview allowClick={false} event={event} />}
        <CommentsSection
          leaveComment={leaveComment}
          id={id}
          eventPubkey={eventPubkey}
          author={author}
          isRoot={true}
          tagKind={"a"}
          kind={eventKinds[kind]}
        />
      </div>
    </div>
  );
}
