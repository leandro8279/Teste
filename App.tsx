import React, { useState } from "react";
import {
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { RTCView } from "react-native-webrtc";
import MicOff from "./src/asset/MicOff";
import MicOn from "./src/asset/MicOn";
import IconContainer from "./src/components/IconContainer";
import CallEnd from "./src/asset/CallEnd";
import CallAnswer from "./src/asset/CallAnswer";
// import WebRTC

import TextInputContainer from "./src/components/TextInputContainer";
import { useVideo } from "./src/screen/useVideo";
import CameraSwitch from "./src/asset/CameraSwitch";
import VideoOff from "./src/asset/VideoOff";
import VideoOn from "./src/asset/VideoOn";

export default function App({}) {
  const {
    otherUserId,
    callerId,
    processAccept,
    processCall,
    setType,
    type,
    localStream,
    remoteStream,
    setlocalStream,
  } = useVideo();
  console.log(localStream?.toURL(), "A");
  console.log(remoteStream?.toURL(), "B");

  const JoinScreen = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          backgroundColor: "#050A0E",
          justifyContent: "center",
          paddingHorizontal: 42,
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <>
            <View
              style={{
                padding: 35,
                backgroundColor: "#1A1C22",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  color: "#D0D4DD",
                }}
              >
                Your Caller ID
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 32,
                    color: "#ffff",
                    letterSpacing: 6,
                  }}
                >
                  {callerId}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#1A1C22",
                padding: 40,
                marginTop: 25,
                justifyContent: "center",
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  color: "#D0D4DD",
                }}
              >
                Enter call id of another user
              </Text>
              <TextInputContainer
                placeholder={"Enter Caller ID"}
                value={otherUserId.current}
                setValue={(text) => {
                  otherUserId.current = text;
                  console.log("TEST", otherUserId.current);
                }}
                keyboardType={"number-pad"}
              />
              <TouchableOpacity
                onPress={() => {
                  setType("OUTGOING_CALL");
                  processCall();
                }}
                style={{
                  height: 50,
                  backgroundColor: "#5568FE",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 12,
                  marginTop: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#FFFFFF",
                  }}
                >
                  Call Now
                </Text>
              </TouchableOpacity>
            </View>
          </>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  };

  const OutgoingCallScreen = () => {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "space-around",
          backgroundColor: "#050A0E",
        }}
      >
        <View
          style={{
            padding: 35,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: "#D0D4DD",
            }}
          >
            Calling to...
          </Text>

          <Text
            style={{
              fontSize: 36,
              marginTop: 12,
              color: "#ffff",
              letterSpacing: 6,
            }}
          >
            {otherUserId.current}
          </Text>
        </View>
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setType("JOIN");
              otherUserId.current = null;
            }}
            style={{
              backgroundColor: "#FF5D5D",
              borderRadius: 30,
              height: 60,
              aspectRatio: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CallEnd width={50} height={12} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const IncomingCallScreen = () => {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "space-around",
          backgroundColor: "#050A0E",
        }}
      >
        <View
          style={{
            padding: 35,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              fontSize: 36,
              marginTop: 12,
              color: "#ffff",
            }}
          >
            {otherUserId.current} is calling..
          </Text>
        </View>
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              processAccept();
              setType("WEBRTC_ROOM");
            }}
            style={{
              backgroundColor: "green",
              borderRadius: 30,
              height: 60,
              aspectRatio: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CallAnswer height={28} fill={"#fff"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  function switchCamera() {
    localStream.getVideoTracks().forEach((track) => {
      track._switchCamera();
    });
  }
  const [localMicOn, setlocalMicOn] = useState(true);

  const [localWebcamOn, setlocalWebcamOn] = useState(true);

  function toggleCamera() {
    localWebcamOn ? setlocalWebcamOn(false) : setlocalWebcamOn(true);
    localStream.getVideoTracks().forEach((track) => {
      localWebcamOn ? (track.enabled = false) : (track.enabled = true);
    });
  }

  function toggleMic() {
    localMicOn ? setlocalMicOn(false) : setlocalMicOn(true);
    localStream.getAudioTracks().forEach((track) => {
      localMicOn ? (track.enabled = false) : (track.enabled = true);
    });
  }

  function leave() {
    // peerConnection.current.close();
    setlocalStream(null);
    setType("JOIN");
  }

  const WebrtcRoomScreen = () => {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#050A0E",
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        {localStream ? (
          <RTCView
            objectFit={"cover"}
            style={{ flex: 1, backgroundColor: "#050A0E" }}
            streamURL={localStream.toURL()}
          />
        ) : null}
        {remoteStream ? (
          <RTCView
            objectFit={"cover"}
            style={{
              flex: 1,
              backgroundColor: "#050A0E",
              marginTop: 8,
            }}
            streamURL={remoteStream.toURL()}
          />
        ) : null}
        <View
          style={{
            marginVertical: 12,
            flexDirection: "row",
            justifyContent: "space-evenly",
          }}
        >
          <IconContainer
            backgroundColor={"red"}
            onPress={() => {
              leave();
            }}
            Icon={() => {
              return <CallEnd height={26} width={26} fill="#FFF" />;
            }}
          />
          <IconContainer
            style={{
              borderWidth: 1.5,
              borderColor: "#2B3034",
            }}
            backgroundColor={!localMicOn ? "#fff" : "transparent"}
            onPress={() => {
              toggleMic();
            }}
            Icon={() => {
              return localMicOn ? (
                <MicOn height={24} width={24} fill="#FFF" />
              ) : (
                <MicOff height={28} width={28} fill="#1D2939" />
              );
            }}
          />
          <IconContainer
            style={{
              borderWidth: 1.5,
              borderColor: "#2B3034",
            }}
            backgroundColor={!localWebcamOn ? "#fff" : "transparent"}
            onPress={() => {
              toggleCamera();
            }}
            Icon={() => {
              return localWebcamOn ? (
                <VideoOn height={24} width={24} fill="#FFF" />
              ) : (
                <VideoOff height={36} width={36} fill="#1D2939" />
              );
            }}
          />
          <IconContainer
            style={{
              borderWidth: 1.5,
              borderColor: "#2B3034",
            }}
            backgroundColor={"transparent"}
            onPress={() => {
              switchCamera();
            }}
            Icon={() => {
              return <CameraSwitch height={24} width={24} fill="#FFF" />;
            }}
          />
        </View>
      </View>
    );
  };

  switch (type) {
    case "JOIN":
      return JoinScreen();
    case "INCOMING_CALL":
      return IncomingCallScreen();

    case "OUTGOING_CALL":
      return OutgoingCallScreen();
    case "WEBRTC_ROOM":
      return WebrtcRoomScreen();
    default:
      return null;
  }
}
