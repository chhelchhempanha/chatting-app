"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const URL_WEB_SOCKET = "ws://18.199.85.17:8090/ws";

let localStream;
let localPeerConnection;

export default () => {
  const ws = useRef(null);
  const searchParams = useSearchParams();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    const wsClient = new WebSocket(URL_WEB_SOCKET);
    wsClient.onopen = () => {
      console.log("ws opened");
      ws.current = wsClient;
      setupDevice();
    };
    wsClient.onclose = () => console.log("Ws closed");
    wsClient.onmessage = (message) => {
      const parsedMessage = JSON.parse(message.data);

      const { type, body } = parsedMessage;

      switch (type) {
        case "joined":
          console.log("Users in this channel", body);
          break;
        case "offer_sdp_received":
          const offer = body;
          onAnswer(offer);
          break;
        case "answer_sdp_received":
          gotRemoteDescription(body);
          break;
        case "ice_candidate_received":
          break;
      }
    };
  }, []);

  const gotRemoteDescription = (answer) => {
    localPeerConnection.setRemoteDescription(answer);
    localPeerConnection.onaddstream = gotRemoteStream;
  };

  const onAnswer = (offer) => {
    console.log("onAnswer invoked");
    localPeerConnection = new RTCPeerConnection([], pcConstraints);
    localPeerConnection.onicecandidate = gotLocalIceCandidateAnswer;
    localPeerConnection.onaddstream = gotRemoteStream;
    localPeerConnection.addStream(localStream);
    localPeerConnection.setRemoteDescription(offer);
    localPeerConnection
      .createAnswer()
      .then((answer) => gotAnswerDescription(answer));
  };

  const gotAnswerDescription = (answer) => {
    localPeerConnection.setLocalDescription(answer);
  };

  const gotLocalIceCandidateAnswer = (event) => {
    if (!event.candidate) {
      const answer = localPeerConnection.localDescription;
      sendWsMessage("send_answer", {
        channelName: searchParams.get("channelName"),
        userName: searchParams.get("userName"),
        sdp: answer,
      });
    }
  };

  const sendWsMessage = (type, body) => {
    ws.current.send(JSON.stringify({ type, body }));
  };

  const pcConstraints = {
    optional: [{ DtlsSrtpKeyAgreement: true }],
  };

  const setupPeerConnection = () => {
    console.log("Setting up peer connection");
    localPeerConnection = new RTCPeerConnection([], pcConstraints);
    localPeerConnection.onicecandidate = gotLocalIceCandidateOffer;
    localPeerConnection.onaddstream = gotRemoteStream;
    localPeerConnection.addStream(localStream);
    localPeerConnection.createOffer().then(gotLocalDescription);
  };

  const gotLocalDescription = (offer) => {
    localPeerConnection.setLocalDescription(offer);
  };

  const gotRemoteStream = (event) => {
    const remotePlayer = document.getElementById("peerPlayer");
    remotePlayer.srcObject = event.stream;
  };

  const gotLocalIceCandidateOffer = (event) => {
    console.log("event: ", event);
    if (!event.candidate) {
      const offer = localPeerConnection.localDescription;
      sendWsMessage("send_offer", {
        channelName: searchParams.get("channelName"),
        userName: searchParams.get("userName"),
        sdp: offer,
      });
    }
  };

  const setupDevice = () => {
    navigator.getUserMedia(
      { audio: true, video: true },
      (stream) => {
        const localPlayer = document.getElementById("localPlayer");
        localPlayer.srcObject = stream;
        localStream = stream;
        ws.current.send(
          JSON.stringify({
            type: "join",
            body: {
              channelName: searchParams.get("channelName"),
              userName: searchParams.get("userName"),
            },
          })
        );
        setupPeerConnection();
      },
      (err) => {
        console.log("err: ", err);
      }
    );
  };

  const handleToggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleToggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const handleHandUp = () => {
    // Stop all local media tracks (camera & mic)
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    // Clear video elements
    const localPlayer = document.getElementById("localPlayer");
    const peerPlayer = document.getElementById("peerPlayer");
    if (localPlayer) localPlayer.srcObject = null;
    if (peerPlayer) peerPlayer.srcObject = null;
    // Close peer connection
    if (localPeerConnection) {
      localPeerConnection.close();
      localPeerConnection = null;
    }
    // Close websocket
    if (ws.current) {
      ws.current.close();
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
        <h2 className="text-2xl font-bold text-white mb-8">Live Call</h2>
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center items-center">
          <div className="flex flex-col items-center">
            <span className="mb-2 text-gray-300">You</span>
            <div className="rounded-xl overflow-hidden border-4 border-blue-600 shadow-lg bg-black">
              <video
                id="localPlayer"
                autoPlay
                muted
                className="w-[320px] h-[240px] md:w-[400px] md:h-[300px] bg-black"
              />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-2 text-gray-300">Peer</span>
            <div className="rounded-xl overflow-hidden border-4 border-green-600 shadow-lg bg-black">
              <video
                id="peerPlayer"
                autoPlay
                className="w-[320px] h-[240px] md:w-[400px] md:h-[300px] bg-black"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleToggleMute}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              isMuted
                ? "bg-gray-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button
            onClick={handleToggleCamera}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              isCameraOff
                ? "bg-gray-600 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          </button>
          <button
            onClick={() => {
              handleHandUp();
              window.location.href = "/";
            }}
            className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700
          text-white font-semibold transition-colors"
          >
            hang up
          </button>
        </div>
      </div>
    </Suspense>
  );
};
