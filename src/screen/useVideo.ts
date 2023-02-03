import { useEffect, useRef, useState } from "react";
import SocketIOClient from "socket.io-client";
import {
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";
export const useVideo = () => {
  const [localStream, setlocalStream] = useState(null);

  const [remoteStream, setRemoteStream] = useState(null);

  const [type, setType] = useState("JOIN");
  const [callerId] = useState(
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const otherUserId = useRef(null);

  const socket = SocketIOClient("https://bcc1-45-70-192-223.sa.ngrok.io", {
    transports: ["websocket"],
    query: {
      callerId,
    },
  });
  const [localMicOn, setlocalMicOn] = useState(true);

  const [localWebcamOn, setlocalWebcamOn] = useState(true);

  const peerConnection = useRef(
    new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "stun:stun1.l.google.com:19302",
        },
        {
          urls: "stun:stun2.l.google.com:19302",
        },
      ],
    })
  );

  let remoteRTCMessage = useRef(null);
  useEffect(() => {
    socket.on("newCall", (data) => {
      remoteRTCMessage.current = data.rtcMessage;
      otherUserId.current = data.callerId;
      setType("INCOMING_CALL");
    });

    socket.on("callAnswered", (data) => {
      remoteRTCMessage.current = data.rtcMessage;
      peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(remoteRTCMessage.current)
      );
      setType("WEBRTC_ROOM");
    });

    socket.on("ICEcandidate", (data) => {
      let message = data.rtcMessage;

      if (peerConnection.current) {
        peerConnection?.current
          .addIceCandidate(
            new RTCIceCandidate({
              candidate: message.candidate,
              sdpMid: message.id,
              sdpMLineIndex: message.label,
            })
          )
          .then((data) => {
            console.log("SUCCESS");
          })
          .catch((err) => {
            console.log("Error", err);
          });
      }
    });

    let isFront = false;

    mediaDevices.enumerateDevices().then((sourceInfos: any) => {
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind == "videoinput" &&
          sourceInfo.facing == (isFront ? "user" : "environment")
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }

      mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            mandatory: {
              minWidth: 500, // Provide your own width, height and frame rate here
              minHeight: 300,
              minFrameRate: 30,
            },
            facingMode: isFront ? "user" : "environment",
            optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
          },
        })
        .then((stream) => {
          // Got stream!

          setlocalStream(stream);

          // setup stream listening
          peerConnection.current.addStream(stream);
        })
        .catch((error) => {
          // Log error
        });
    });

    peerConnection.current.onaddstream = (event) => {
      setRemoteStream(event.stream);
    };

    // Setup ice handling
    peerConnection.current.onicecandidate = (event: any) => {
      if (event.candidate) {
        sendICEcandidate({
          calleeId: otherUserId.current,
          rtcMessage: {
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
          },
        });
      } else {
        console.log("End of candidates.");
      }
    };

    return () => {
      socket.off("newCall");
      socket.off("callAnswered");
      socket.off("ICEcandidate");
    };
  }, []);
  function sendICEcandidate(data) {
    socket.emit("ICEcandidate", data);
  }
  async function processCall() {
    const sessionDescription = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(sessionDescription);
    sendCall({
      calleeId: otherUserId.current,
      rtcMessage: sessionDescription,
    });
  }

  async function processAccept() {
    peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(remoteRTCMessage.current)
    );
    const sessionDescription = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(sessionDescription);
    answerCall({
      callerId: otherUserId.current,
      rtcMessage: sessionDescription,
    });
  }
  function answerCall(data) {
    socket.emit("answerCall", data);
  }

  function sendCall(data) {
    socket.emit("call", data);
  }
  return {
    otherUserId,
    callerId,
    processAccept,
    processCall,
    setType,
    type,
    localStream,
    remoteStream,
    setlocalStream,
  };
};
