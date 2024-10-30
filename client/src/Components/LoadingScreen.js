import React from "react";
import LoadingLogo from "./LoadingLogo";



export default function LoadingScreen({ onClick = () => null }) {
  return (
    <section className="fixed-container fx-centered" onClick={onClick}>
      {/* <span className="loader"></span> */}
     <LoadingLogo size={128}/>
    </section>
  );
}
