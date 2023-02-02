import { useEffect, useRef, useState } from "react";
import SocketIOClient from "socket.io-client"; // import socket io
import RNSimplePeer from "react-native-simple-peer";
import {
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";
import { Alert } from "react-native";
export const useVideo = () => {
  const [type, setType] = useState("JOIN");
  const [callerId, setCallerId] = useState();
  const [localStream, setlocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // This establishes your WebSocket connection
  const socket = SocketIOClient("https://e5de-45-70-192-223.sa.ngrok.io");
  const peerConnection = useRef<RTCPeerConnection>(
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
  let offerRef = useRef(null);
  let from = useRef(null);
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
    socket.on("callUser", async (data) => {
      console.log("Recebendo chamada!");
      const answer = new RTCSessionDescription(data.signal);
      await peerConnection.current.setRemoteDescription(answer);
      offerRef.current = data.signal;
      from.current = data.from;
      setType("INCOMING_CALL");
    });

    socket.on("callAccepted", async (signal) => {
      const answer = new RTCSessionDescription(signal);
      await peerConnection.current.setRemoteDescription(answer);
      setType("WEBRTC_ROOM");
    });
    socket.on("ICEcandidate", (data) => {
      let message = data.rtcMessage;
      // When Bob gets a candidate message from Alice, he calls `addIceCandidate` to add the candidate to the remote peer description.
      if (peerConnection.current) {
        peerConnection?.current
          .addIceCandidate(new RTCIceCandidate(message.candidate))
          .then((data) => {
            console.log("SUCCESS");
          })
          .catch((err) => {
            console.log("Error", err);
          });
      }
    });
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
          video: true,
        })
        .then((stream) => {
          // console.log(stream);
          // Get local stream!
          setlocalStream(stream);
          // setup stream listening
          peerConnection.current.addStream(stream);
        })
        .catch((error) => {
          // Log error
        });
    });

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
    // // 1. Alice executa o método `createOffer` para obter SDP.
    const offer: any = await peerConnection.current.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true,
    });

    console.log("Criamdo uma sala");
    // // 2. Alice define a descrição local usando `setLocalDescription`.
    await peerConnection.current.setLocalDescription(offer);
    // // 3. Envie esta descrição de sessão para Bob uisng socket
    socket.emit("callUser", {
      userToCall: otherUserId.current,
      signalData: offer,
      from: callerId,
      name: "Leandro Jose",
    });
  }

  useEffect(() => {
    peerConnection.current.addEventListener(
      "connectionstatechange",
      (event) => {
        console.log("connectionstatechange");
      }
    );

    peerConnection.current.addEventListener("icecandidate", (event: any) => {
      if (!event.candidate) {
        return;
      }
      console.log("icecandidate");
      sendICEcandidate({
        calleeId: callerId,
        rtcMessage: {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
        },
      });
    });
    // console.log(peerConnection.current.);

    peerConnection.current.addEventListener("icecandidateerror", (event) => {
      console.log("icecandidateerror");
    });
    peerConnection.current.addEventListener(
      "iceconnectionstatechange",
      (event) => {
        console.log("iceconnectionstatechange");
      }
    );
    peerConnection.current.addEventListener(
      "icegatheringstatechange",
      (event) => {
        console.log("icegatheringstatechange");
      }
    );
    peerConnection.current.addEventListener("negotiationneeded", (event) => {
      console.log("negotiationneeded");
    });
    peerConnection.current.addEventListener("signalingstatechange", (event) => {
      console.log("signalingstatechange");
    });
    peerConnection.current.addEventListener("addstream", (event: any) => {
      console.log("addstream");
      setRemoteStream(event.stream);
    });
    // console.log(JSON.stringify(peerConnection.current, null, 2));
    peerConnection.current.addEventListener("removestream", (event) => {
      console.log("removestream");
    });
  }, []);
  async function processAccept() {
    // console.log(JSON.stringify(offerRef.current, null, 2));
    // 4. Bob define a descrição, Alice o enviou como a descrição remota usando `setRemoteDescription()`
    await peerConnection.current.setRemoteDescription(offerRef.current);
    // // 5. Bob executa o método `createAnswer`
    const answer: any = await peerConnection.current?.createAnswer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true,
    });
    // console.log(JSON.stringify(answer, null, 2));
    // 6. Bob define isso como a descrição local e a envia para Alice
    await peerConnection.current?.setLocalDescription(answer);
    answerCall({
      to: from.current,
      signal: answer,
    });
  }
  function answerCall(data: any) {
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
