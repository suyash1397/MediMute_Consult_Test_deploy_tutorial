import React, { useState, useEffect } from "react";
import { styled } from "@mui/system";
import { connect } from "react-redux";
import Video from "./Video";
import Video2 from "./Video2";

const MainContainer = styled("div")({
  height: "100%",
  width: "100%",
  display: "flex",
  flexWrap: "wrap",
});

const VideosContainer = ({
  localStream,
  remoteStreams,
  screenSharingStream,
}) => {
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.isDoctor) {
      setIsDoctor(true);
    }
  }, []);
  return (
    <MainContainer>
      <Video stream={localStream} isLocalStream isDoctor={isDoctor} />
      {remoteStreams.map((stream) => (
        <Video2 stream={stream} key={stream.id} />
      ))}
    </MainContainer>
  );
};

const mapStoreStateToProps = ({ room }) => {
  return {
    ...room,
  };
};

export default connect(mapStoreStateToProps)(VideosContainer);
