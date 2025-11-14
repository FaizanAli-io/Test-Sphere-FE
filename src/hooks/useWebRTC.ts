import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./useApi";

interface UseWebRTCProps {
  userId: string;
  role: "student" | "teacher";
  testId: string;
  enabled: boolean;
}

interface WebRTCState {
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  connectionState: RTCPeerConnectionState | null;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useWebRTC = ({
  userId,
  role,
  testId,
  enabled,
}: UseWebRTCProps) => {
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    isStreaming: false,
    error: null,
    connectionState: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !userId || !testId) return;

    const wsUrl = API_BASE_URL.replace("http", "ws") + "/streaming";
    const socket = io(wsUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("register", { userId, role, testId: parseInt(testId) });
    });

    socket.on("registered", (data: { success: boolean; socketId: string }) => {
      console.log("Registered successfully:", data);
      setState((prev) => ({ ...prev, isConnected: true, error: null }));
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to connect to streaming server",
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, userId, role, testId]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log("Sending ICE candidate");
        // ICE candidate will be sent through signaling
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      setState((prev) => ({ ...prev, connectionState: pc.connectionState }));

      if (pc.connectionState === "connected") {
        setState((prev) => ({ ...prev, isStreaming: true, error: null }));
      } else if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: "Connection failed",
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track");
      remoteStreamRef.current = event.streams[0];
    };

    return pc;
  }, []);

  // Start streaming (for students)
  const startStreaming = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      localStreamRef.current = stream;

      // Create peer connection and add tracks
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      console.log("Local stream started");
      return stream;
    } catch (error) {
      console.error("Error starting stream:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to access camera/microphone",
      }));
      throw error;
    }
  }, [createPeerConnection]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  // Handle signaling messages
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleSignal = async (message: {
      type: string;
      data: any;
      from: string;
    }) => {
      console.log("Received signal:", message.type, "from:", message.from);

      const pc = peerConnectionRef.current || createPeerConnection();

      try {
        if (message.type === "offer") {
          await pc.setRemoteDescription(
            new RTCSessionDescription(message.data)
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("signal", {
            type: "answer",
            data: answer,
            from: userId,
            to: message.from,
            testId: parseInt(testId),
            role,
          });
        } else if (message.type === "answer") {
          await pc.setRemoteDescription(
            new RTCSessionDescription(message.data)
          );
        } else if (message.type === "ice-candidate") {
          await pc.addIceCandidate(new RTCIceCandidate(message.data));
        }
      } catch (error) {
        console.error("Error handling signal:", error);
        setState((prev) => ({ ...prev, error: "Signaling error" }));
      }
    };

    const handleStreamRequest = async (data: {
      teacherId: string;
      testId: number;
    }) => {
      console.log("Stream requested by teacher:", data.teacherId);

      try {
        await startStreaming();

        const pc = peerConnectionRef.current;
        if (!pc) return;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("signal", {
          type: "offer",
          data: offer,
          from: userId,
          to: data.teacherId,
          testId: data.testId,
          role,
        });
      } catch (error) {
        console.error("Error handling stream request:", error);
      }
    };

    const handleStreamStopped = () => {
      console.log("Stream stopped by peer");
      stopStreaming();
    };

    socket.on("signal", handleSignal);
    socket.on("stream-request", handleStreamRequest);
    socket.on("stream-stopped", handleStreamStopped);

    return () => {
      socket.off("signal", handleSignal);
      socket.off("stream-request", handleStreamRequest);
      socket.off("stream-stopped", handleStreamStopped);
    };
  }, [
    userId,
    role,
    testId,
    createPeerConnection,
    startStreaming,
    stopStreaming,
  ]);

  // Request stream (for teachers)
  const requestStream = useCallback(
    async (studentId: string) => {
      if (!socketRef.current) {
        setState((prev) => ({ ...prev, error: "Not connected to server" }));
        return null;
      }

      try {
        setState((prev) => ({ ...prev, error: null }));

        // Create peer connection
        const pc = createPeerConnection();

        // Request stream from student
        socketRef.current.emit("start-stream", {
          studentId,
          teacherId: userId,
          testId: parseInt(testId),
        });

        return remoteStreamRef.current;
      } catch (error) {
        console.error("Error requesting stream:", error);
        setState((prev) => ({ ...prev, error: "Failed to request stream" }));
        return null;
      }
    },
    [userId, testId, createPeerConnection]
  );

  // Stop viewing stream (for teachers)
  const stopViewingStream = useCallback(
    (studentId: string) => {
      if (socketRef.current) {
        socketRef.current.emit("stop-stream", {
          studentId,
          teacherId: userId,
          testId: parseInt(testId),
        });
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      remoteStreamRef.current = null;
      setState((prev) => ({ ...prev, isStreaming: false }));
    },
    [userId, testId]
  );

  return {
    ...state,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    startStreaming,
    stopStreaming,
    requestStream,
    stopViewingStream,
  };
};
