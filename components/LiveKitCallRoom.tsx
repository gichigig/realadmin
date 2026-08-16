"use client";

import { LiveKitRoom, VideoConference, RoomAudioRenderer, useRoomContext, useRemoteParticipants } from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState, useRef } from "react";

interface LiveKitCallRoomProps {
  roomName: string;
  isVideo: boolean;
  onDisconnected: () => void;
}

function CallRoomInner({ onDisconnected }: { onDisconnected: () => void }) {
  const room = useRoomContext();
  const remoteParticipants = useRemoteParticipants();
  const hasHadRemoteRef = useRef(false);

  useEffect(() => {
    if (remoteParticipants.length > 0) {
      hasHadRemoteRef.current = true;
    } else if (hasHadRemoteRef.current) {
      // When remote participant disconnects, automatically hang up and end call for local user
      room.disconnect();
      onDisconnected();
    }
  }, [remoteParticipants, room, onDisconnected]);

  return (
    <>
      <VideoConference />
      <RoomAudioRenderer />
    </>
  );
}

export default function LiveKitCallRoom({ roomName, isVideo, onDisconnected }: LiveKitCallRoomProps) {
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchToken() {
      try {
        const authToken = localStorage.getItem("token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";
        const response = await fetch(`${apiUrl}/chat/call/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ roomName, isVideo }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch token: ${response.statusText}`);
        }

        const data = await response.json();
        setToken(data.token);
        setUrl(data.url || "wss://livekit.ishinadwelly.com");
      } catch (err: any) {
        console.error("Error fetching LiveKit token:", err);
        setError(err.message || "Could not connect to call server.");
      }
    }

    fetchToken();
  }, [roomName, isVideo]);

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Connection Failed</h2>
        <p className="mb-6">{error}</p>
        <button
          onClick={onDisconnected}
          className="px-6 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"
        >
          Close
        </button>
      </div>
    );
  }

  if (!token || !url) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Connecting to secure room...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <style jsx global>{`
        .lk-disconnect-button {
          background-color: #dc2626 !important;
          color: white !important;
          border-radius: 9999px !important;
          padding: 8px 20px !important;
        }
        .lk-disconnect-button:hover {
          background-color: #b91c1c !important;
        }
        .lk-disconnect-button span {
          display: none !important;
        }
        .lk-disconnect-button::after {
          content: "Hang Up" !important;
          font-weight: 600 !important;
          font-size: 14px !important;
        }
      `}</style>
      <LiveKitRoom
        video={isVideo}
        audio={true}
        token={token}
        serverUrl={url}
        connect={true}
        data-lk-theme="default"
        style={{ height: '100dvh' }}
        onDisconnected={onDisconnected}
      >
        <CallRoomInner onDisconnected={onDisconnected} />
      </LiveKitRoom>
    </div>
  );
}
