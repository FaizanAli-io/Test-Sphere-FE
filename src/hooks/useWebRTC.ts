import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./useApi";

interface UseWebRTCProps {
  userId: string;
  role: "student" | "teacher";
  testId: string;
  enabled: boolean;
  initialStream?: MediaStream;
  initialScreenStream?: MediaStream;
}

type StreamType = "webcam" | "screen";

interface WebRTCState {
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  connectionState: RTCPeerConnectionState | null;
  streamType: StreamType | null;
}

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
};

export const useWebRTC = ({
  userId,
  role,
  testId,
  enabled,
  initialStream,
  initialScreenStream,
}: UseWebRTCProps) => {
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    isStreaming: false,
    error: null,
    connectionState: null,
    streamType: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerIdRef = useRef<string | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !userId || !testId) return;

    // Prefer http(s) URL for Socket.IO; it will handle the upgrade.
    const socketUrl = `${API_BASE_URL}/streaming`;
    const socket = io(socketUrl, {
      // Allow engine.io to negotiate best transport (polling -> websocket)
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebRTC] Socket connected:", socket.id);
      socket.emit("register", { userId, role, testId: parseInt(testId) });
    });

    socket.on("registered", (data: { success: boolean; socketId: string }) => {
      console.log("[WebRTC] Registered successfully:", data);
      setState((prev) => ({ ...prev, isConnected: true, error: null }));
    });

    // Debug: Log all events
    socket.onAny((eventName, ...args) => {
      console.log("[WebRTC] 📨 Socket event received:", eventName, args);
    });

    socket.on("disconnect", () => {
      console.log("[WebRTC] Socket disconnected");
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on("connect_error", (error: Error) => {
      console.error("[WebRTC] Socket connection error:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to connect to streaming server",
      }));
    });

    socket.on("error", (payload: any) => {
      console.error("[WebRTC] Socket error event:", payload);
    });

    // Set up signal handlers in the same effect to ensure they're registered
    console.log("[WebRTC] Setting up signal handlers");

    const handleSignal = async (message: { type: string; data: any; from: string }) => {
      console.log("[WebRTC] ✅ Received signal:", message.type, "from:", message.from);

      const pc = peerConnectionRef.current || createPeerConnection();
      peerIdRef.current = message.from;

      try {
        if (message.type === "offer") {
          console.log("[WebRTC] Processing offer, current state:", pc.signalingState);
          await pc.setRemoteDescription(new RTCSessionDescription(message.data));
          console.log("[WebRTC] Remote description set, creating answer...");

          // Process any pending ICE candidates after setting remote description
          if (pendingIceCandidatesRef.current.length > 0) {
            console.log(
              "[WebRTC] Adding",
              pendingIceCandidatesRef.current.length,
              "pending ICE candidates",
            );
            for (const candidate of pendingIceCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingIceCandidatesRef.current = [];
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log("[WebRTC] Answer created, emitting to:", message.from);

          socket.emit("signal", {
            type: "answer",
            data: answer,
            from: userId,
            to: message.from,
            testId: parseInt(testId),
            role,
          });
          console.log("[WebRTC] Answer emitted successfully");
        } else if (message.type === "answer") {
          console.log("[WebRTC] Processing answer");
          await pc.setRemoteDescription(new RTCSessionDescription(message.data));

          // Process any pending ICE candidates after setting remote description
          if (pendingIceCandidatesRef.current.length > 0) {
            console.log(
              "[WebRTC] Adding",
              pendingIceCandidatesRef.current.length,
              "pending ICE candidates",
            );
            for (const candidate of pendingIceCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingIceCandidatesRef.current = [];
          }
        } else if (message.type === "ice-candidate") {
          if (pc.remoteDescription) {
            console.log("[WebRTC] Adding ICE candidate");
            await pc.addIceCandidate(new RTCIceCandidate(message.data));
          } else {
            console.log("[WebRTC] Queueing ICE candidate (no remote description yet)");
            pendingIceCandidatesRef.current.push(message.data);
          }
        }
      } catch (error) {
        console.error("Error handling signal:", error);
        setState((prev) => ({ ...prev, error: "Signaling error" }));
      }
    };

    const handleStreamRequest = async (data: {
      teacherId: string;
      testId: number;
      streamType?: StreamType;
    }) => {
      console.log(
        "[WebRTC] Stream requested by teacher:",
        data.teacherId,
        "Type:",
        data.streamType || "webcam",
      );

      try {
        peerIdRef.current = data.teacherId;
        console.log("[WebRTC] Starting streaming...");
        await startStreaming(data.streamType || "webcam");

        const pc = peerConnectionRef.current;
        if (!pc) {
          console.error("[WebRTC] No peer connection after startStreaming");
          return;
        }

        console.log("[WebRTC] Creating offer...");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("[WebRTC] Offer created, emitting to teacher:", data.teacherId);

        socket.emit("signal", {
          type: "offer",
          data: offer,
          from: userId,
          to: data.teacherId,
          testId: data.testId,
          role,
        });
        console.log("[WebRTC] Offer emitted successfully");
      } catch (error) {
        console.error("[WebRTC] Error handling stream request:", error);
      }
    };

    const handleStreamStopped = () => {
      console.log("[WebRTC] Stream stopped by peer");
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch {}
        peerConnectionRef.current = null;
      }
      remoteStreamRef.current = null;
      setState((prev) => ({ ...prev, isStreaming: false }));
    };

    socket.on("signal", handleSignal);
    socket.on("stream-request", handleStreamRequest);
    socket.on("stream-stopped", handleStreamStopped);

    return () => {
      socket.off("signal", handleSignal);
      socket.off("stream-request", handleStreamRequest);
      socket.off("stream-stopped", handleStreamStopped);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, userId, role, testId]);

  // Create peer connection - not memoized to avoid dependency issues
  const createPeerConnection = () => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && peerIdRef.current) {
        try {
          socketRef.current.emit("signal", {
            type: "ice-candidate",
            data: event.candidate,
            from: userId,
            to: peerIdRef.current,
            testId: parseInt(testId),
            role,
          });
        } catch (e) {
          console.error("Failed to emit ICE candidate", e);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      setState((prev) => ({ ...prev, connectionState: pc.connectionState }));

      if (pc.connectionState === "connected") {
        setState((prev) => ({ ...prev, isStreaming: true, error: null }));
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: "Connection failed",
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log("[WebRTC] Received remote track", event.track.kind);
      remoteStreamRef.current = event.streams[0];
    };

    // For teacher (viewer), explicitly declare intention to receive tracks.
    if (role === "teacher") {
      try {
        pc.addTransceiver("video", { direction: "recvonly" });
      } catch (e) {
        console.warn("[WebRTC] addTransceiver video failed", e);
      }
      try {
        pc.addTransceiver("audio", { direction: "recvonly" });
      } catch (e) {
        console.warn("[WebRTC] addTransceiver audio failed", e);
      }
    }

    return pc;
  };

  // Start streaming (for students) with stream type
  const startStreaming = useCallback(
    async (type: StreamType = "webcam") => {
      try {
        setState((prev) => ({ ...prev, error: null, streamType: type }));

        let stream: MediaStream;

        if (type === "screen") {
          // Try to reuse initial screen stream first, otherwise request new
          if (initialScreenStream && initialScreenStream.active) {
            console.log(
              "[WebRTC] Reusing existing screen stream, tracks:",
              initialScreenStream.getTracks().length,
            );
            // Validate it's the entire screen when reusing
            const track = initialScreenStream.getVideoTracks()[0];
            const settings = track?.getSettings?.();
            const surface = (settings as Record<string, unknown> | undefined)?.[
              "displaySurface"
            ] as string | undefined;
            const isEntireScreen =
              surface === "monitor" ||
              (typeof track?.label === "string" &&
                /entire screen|screen 1|screen 2|whole screen/i.test(track.label));
            if (!isEntireScreen) {
              console.warn(
                "[WebRTC] Provided screen stream is not entire screen; refusing to start",
              );
              setState((prev) => ({
                ...prev,
                error: "Please share your Entire screen to start streaming.",
              }));
              return;
            }
            stream = initialScreenStream;
          } else {
            console.log("[WebRTC] Initial screen stream not available:", {
              exists: !!initialScreenStream,
              active: initialScreenStream?.active,
              tracks: initialScreenStream?.getTracks().length,
            });
            console.log(
              "[WebRTC] Requesting NEW screen share (this should not happen if permissions were checked)",
            );
            stream = await navigator.mediaDevices.getDisplayMedia({
              video: {
                displaySurface: "monitor", // Request entire screen (may be ignored)
              } as any,
              audio: false,
            });

            // Validate entire screen selection; if not, stop and abort
            const track = stream.getVideoTracks()[0];
            const settings = track?.getSettings?.();
            const surface = (settings as Record<string, unknown> | undefined)?.[
              "displaySurface"
            ] as string | undefined;
            const isEntireScreen =
              surface === "monitor" ||
              (typeof track?.label === "string" &&
                /entire screen|screen 1|screen 2|whole screen/i.test(track.label));
            if (!isEntireScreen) {
              stream.getTracks().forEach((t) => t.stop());
              setState((prev) => ({
                ...prev,
                error: "Please select 'Entire screen' when sharing your screen.",
              }));
              console.warn("[WebRTC] User did not select entire screen; aborting stream start");
              return;
            }
          }
        } else {
          // Try to reuse initial stream first, otherwise request new
          if (initialStream && initialStream.active) {
            console.log(
              "[WebRTC] Reusing existing webcam stream, tracks:",
              initialStream.getTracks().length,
            );
            stream = initialStream;
          } else {
            console.log("[WebRTC] Requesting new webcam stream");
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 1280, height: 720 },
              audio: true,
            });
          }
        }

        localStreamRef.current = stream;

        // Create peer connection and add tracks
        const pc = createPeerConnection();
        console.log("[WebRTC] Adding tracks to peer connection...");
        stream.getTracks().forEach((track) => {
          console.log("[WebRTC] Adding track:", track.kind, track.label);
          pc.addTrack(track, stream);
        });

        console.log(
          `[WebRTC] Local ${type} stream started with ${stream.getTracks().length} tracks`,
        );
        return stream;
      } catch (error) {
        console.error("[WebRTC] Error starting stream:", error);
        setState((prev) => ({
          ...prev,
          error: `Failed to access ${type === "screen" ? "screen" : "camera/microphone"}`,
        }));
        throw error;
      }
    },
    [initialStream, initialScreenStream],
  );

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

  // Request stream (for teachers)
  const requestStream = useCallback(
    async (studentId: string, streamType: StreamType = "webcam") => {
      if (!socketRef.current) {
        setState((prev) => ({ ...prev, error: "Not connected to server" }));
        return null;
      }

      try {
        setState((prev) => ({ ...prev, error: null }));

        // Close existing peer connection if any
        if (peerConnectionRef.current) {
          console.log("[WebRTC] Closing existing peer connection before new request");
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }

        // Set peer id to route ICE candidates
        peerIdRef.current = studentId;

        console.log("[WebRTC] Requesting stream from student:", studentId, "type:", streamType);

        // Request stream from student with specified type
        socketRef.current.emit("start-stream", {
          studentId,
          teacherId: userId,
          testId: parseInt(testId),
          streamType,
        });

        return remoteStreamRef.current;
      } catch (error) {
        console.error("Error requesting stream:", error);
        setState((prev) => ({ ...prev, error: "Failed to request stream" }));
        return null;
      }
    },
    [userId, testId],
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
    [userId, testId],
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
