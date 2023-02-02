import { useEffect, useRef, useState } from "react";
import SocketIOClient from "socket.io-client"; // import socket io
import {
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";
export const useVideo = () => {
  const [type, setType] = useState("JOIN");
  const [callerId, setCallerId] = useState();
  const [localStream, setlocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  // This establishes your WebSocket connection
  const socket = SocketIOClient("https://cced-169-57-215-155.ngrok.io");
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
  const otherUserId = useRef(null);
  let remoteRTCMessage = useRef(null);
  useEffect(() => {
    socket.on("connected", (id) => setCallerId(id));
  }, []);
  console.log("ID =", callerId);

  useEffect(() => {
    // socket.on("newCall", (data) => {
    //   remoteRTCMessage.current = data.rtcMessage;
    //   otherUserId.current = data.callerId;
    //   setType("INCOMING_CALL");
    // });
    socket.on("callUser", (data) => {
      console.log("callUser");

      // 7. Quando Alice obtém a descrição da sessão de Bob, ela a define como a descrição remota com o método `setRemoteDescription`.
      remoteRTCMessage.current = data.signal;
      peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(remoteRTCMessage.current)
      );
      setType("WEBRTC_ROOM");
    });
    // socket.on("ICEcandidate", (data) => {
    //   let message = data.rtcMessage;
    //   // When Bob gets a candidate message from Alice, he calls `addIceCandidate` to add the candidate to the remote peer description.
    //   if (peerConnection.current) {
    //     peerConnection?.current
    //       .addIceCandidate(new RTCIceCandidate(message.candidate))
    //       .then((data) => {
    //         console.log("SUCCESS");
    //       })
    //       .catch((err) => {
    //         console.log("Error", err);
    //       });
    //   }
    // });
    let isFront = false;
    /*The MediaDevices interface allows you to access connected media inputs such as cameras and microphones. We ask the user for permission to access those media inputs by invoking the mediaDevices.getUserMedia() method. */
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
          console.log(stream);

          // Get local stream!
          setlocalStream(stream);
          // setup stream listening
          peerConnection.current.addStream(stream);
        })
        .catch((error) => {
          // Log error
        });
    });
    // peerConnection.current.onaddstream = (event: any) => {
    //   setRemoteStream(event.stream);
    // };
    // peerConnection.current.onicecandidate = (event: any) => {
    //   if (event.candidate) {
    //     sendICEcandidate({
    //       calleeId: otherUserId.current,
    //       rtcMessage: {
    //         label: event.candidate.sdpMLineIndex,
    //         id: event.candidate.sdpMid,
    //         candidate: event.candidate.candidate,
    //       },
    //     });
    //   } else {
    //     console.log("End of candidates.");
    //   }
    // };
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
    console.log(otherUserId.current);

    // 1. Alice executa o método `createOffer` para obter SDP.
    const sessionDescription: RTCSessionDescription =
      await peerConnection.current.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });

    console.log("create answer");

    // 2. Alice define a descrição local usando `setLocalDescription`.
    await peerConnection.current.setLocalDescription(sessionDescription);
    // 3. Envie esta descrição de sessão para Bob uisng socket
    socket.emit("callUser", {
      userToCall: otherUserId.current,
      signalData: sessionDescription,
      from: callerId,
      name: "Leandro Jose",
    });
  }
  async function processAccept() {
    // 4. Bob define a descrição, Alice o enviou como a descrição remota usando `setRemoteDescription()`
    peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(remoteRTCMessage.current)
    );
    // 5. Bob executa o método `createAnswer`
    const sessionDescription: any = await peerConnection.current.createAnswer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true,
    });
    // 6. Bob define isso como a descrição local e a envia para Alice
    await peerConnection.current.setLocalDescription(sessionDescription);
    answerCall({
      to: otherUserId.current,
      signal: sessionDescription,
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
    answerCall,
    localStream,
    peerConnection,
    remoteStream,
    setlocalStream,
  };
};
