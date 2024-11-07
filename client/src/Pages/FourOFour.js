import React, { useEffect } from "react";
import PagePlaceholder from "../Components/PagePlaceholder";
import { useNavigate, useParams } from "react-router-dom";
import { getLinkFromAddr } from "../Helpers/Helpers";
import { customHistory } from "../Helpers/History";

export default function FourOFour() {
  const { nevent } = useParams();

  useEffect(() => {
    if (nevent) {
      const url = getLinkFromAddr(nevent);

      if (url !== nevent) {
        customHistory.push(url);
      }
    }
  }, [nevent]);

  if (!nevent) {
    return <PagePlaceholder page={"404"} />;
  }

  return <PagePlaceholder page={"404"} />;
}
