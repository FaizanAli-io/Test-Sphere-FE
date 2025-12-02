import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./useApi";
import { debugLogger } from "@/utils/logger";

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
  const isUsingInitialStreamRef = useRef<boolean>(false);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !userId || !testId) return;

    // Prefer http(s) URL for Socket.IO; it will handle the upgrade.
    const socketUrl = `${API_BASE_URL}/streaming`;
    const socket = io(socketUrl, {
      // Allow engine.io to negotiate best transport (polling -> websocket)
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      debugLogger("[WebRTC] Socket connected:", socket.id);
      socket.emit("register", { userId, role, testId: parseInt(testId) });
    });

    socket.on("registered", (data: { success: boolean; socketId: string }) => {
      debugLogger("[WebRTC] Registered successfully:", data);
      setState((prev) => ({ ...prev, isConnected: true, error: null }));
    });

    // Debug: Log all events
    socket.onAny((eventName, ...args) => {
      debugLogger("[WebRTC] 📨 Socket event received:", eventName, args);
    });

    socket.on("disconnect", (reason: string) => {
      debugLogger("[WebRTC] Socket disconnected, reason:", reason);
      setState((prev) => ({ ...prev, isConnected: false }));

      // Close peer connection on disconnect
      if (peerConnectionRef.current) {
        debugLogger("[WebRTC] Closing peer connection due to socket disconnect");
        try {
          peerConnectionRef.current.close();
        } catch (e) {
          console.error("[WebRTC] Error closing peer connection:", e);
        }
        peerConnectionRef.current = null;
      }

      // Clear pending ICE candidates
      pendingIceCandidatesRef.current = [];
    });

    socket.io.on("reconnect", (attempt: number) => {
      debugLogger("[WebRTC] Socket reconnected after", attempt, "attempts");
      setState((prev) => ({ ...prev, error: null }));
      // Re-register after reconnection
      socket.emit("register", { userId, role, testId: parseInt(testId) });

      // If we were streaming before, the teacher will need to request the stream again
      // So we just wait for a new stream-request event
    });

    socket.io.on("reconnect_attempt", (attempt: number) => {
      debugLogger("[WebRTC] Reconnection attempt", attempt);
    });

    socket.io.on("reconnect_error", (error: Error) => {
      console.error("[WebRTC] Reconnection error:", error);
    });

    socket.io.on("reconnect_failed", () => {
      console.error("[WebRTC] Reconnection failed after all attempts");
      setState((prev) => ({
        ...prev,
        error: "Failed to reconnect to streaming server",
      }));
    });

    socket.on("connect_error", (error: Error) => {
      console.error("[WebRTC] Socket connection error:", error);
      // Don't set error state immediately, let reconnection handle it
    });

    socket.on("error", (payload: unknown) => {
      console.error("[WebRTC] Socket error event:", payload);
    });

    // Set up signal handlers in the same effect to ensure they're registered
    debugLogger("[WebRTC] Setting up signal handlers");

    const handleSignal = async (message: {
      type: string;
      data: RTCSessionDescriptionInit | RTCIceCandidateInit;
      from: string;
    }) => {
      debugLogger("[WebRTC] ✅ Received signal:", message.type, "from:", message.from);

      const pc = peerConnectionRef.current || createPeerConnection();
      peerIdRef.current = message.from;

      try {
        if (message.type === "offer") {
          debugLogger("[WebRTC] Processing offer, current state:", pc.signalingState);
          await pc.setRemoteDescription(
            new RTCSessionDescription(message.data as RTCSessionDescriptionInit),
          );
          debugLogger("[WebRTC] Remote description set, creating answer...");

          // Process any pending ICE candidates after setting remote description
          if (pendingIceCandidatesRef.current.length > 0) {
            debugLogger(
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
          debugLogger("[WebRTC] Answer created, emitting to:", message.from);

          socket.emit("signal", {
            type: "answer",
            data: answer,
            from: userId,
            to: message.from,
            testId: parseInt(testId),
            role,
          });
          debugLogger("[WebRTC] Answer emitted successfully");
        } else if (message.type === "answer") {
          debugLogger("[WebRTC] Processing answer");
          await pc.setRemoteDescription(
            new RTCSessionDescription(message.data as RTCSessionDescriptionInit),
          );

          // Process any pending ICE candidates after setting remote description
          if (pendingIceCandidatesRef.current.length > 0) {
            debugLogger(
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
            debugLogger("[WebRTC] Adding ICE candidate");
            await pc.addIceCandidate(new RTCIceCandidate(message.data as RTCIceCandidateInit));
          } else {
            debugLogger("[WebRTC] Queueing ICE candidate (no remote description yet)");
            pendingIceCandidatesRef.current.push(message.data as RTCIceCandidateInit);
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
        // Clear any existing peer connection if it's in a bad state
        if (peerConnectionRef.current) {
          const state = peerConnectionRef.current.connectionState;
          if (state === "failed" || state === "closed") {
            console.log("[WebRTC] Cleaning up old peer connection before new stream request");
            peerConnectionRef.current = null;
          }
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, role, testId]);

  // Create peer connection - not memoized to avoid dependency issues
  const createPeerConnection = () => {
    // If we have an existing peer connection, check its state
    if (peerConnectionRef.current) {
      const state = peerConnectionRef.current.connectionState;
      // If it's closed or failed, clean it up and create a new one
      if (state === "closed" || state === "failed") {
        console.log("[WebRTC] Existing peer connection is closed/failed, creating new one");
        peerConnectionRef.current = null;
      } else {
        console.log("[WebRTC] Reusing existing peer connection with state:", state);
        return peerConnectionRef.current;
      }
    }

    console.log("[WebRTC] Creating new peer connection");
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
        console.log("[WebRTC] Connection failed/disconnected, cleaning up peer connection");
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: "Connection failed",
        }));

        // Clean up the failed peer connection so a new one can be created
        if (peerConnectionRef.current === pc) {
          try {
            pc.close();
          } catch (e) {
            console.error("[WebRTC] Error closing failed peer connection:", e);
          }
          peerConnectionRef.current = null;
        }
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
            isUsingInitialStreamRef.current = true;
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
              } as MediaTrackConstraints & { displaySurface?: string },
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
            isUsingInitialStreamRef.current = false;
          }
        } else {
          // Try to reuse initial stream first, otherwise request new
          if (initialStream && initialStream.active) {
            console.log(
              "[WebRTC] Reusing existing webcam stream, tracks:",
              initialStream.getTracks().length,
            );
            stream = initialStream;
            isUsingInitialStreamRef.current = true;
          } else {
            console.log("[WebRTC] Requesting new webcam stream");
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 1280, height: 720 },
              audio: true,
            });
            isUsingInitialStreamRef.current = false;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialStream, initialScreenStream],
  );

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (localStreamRef.current) {
      // Only stop tracks if this is NOT one of the initial streams
      // Initial streams should be preserved for reuse
      if (!isUsingInitialStreamRef.current) {
        console.log("[WebRTC] Stopping locally created stream tracks");
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      } else {
        console.log("[WebRTC] Preserving initial stream for reuse");
      }
      localStreamRef.current = null;
      isUsingInitialStreamRef.current = false;
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

  // Manual reconnect method
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      debugLogger(
        "[WebRTC] Manual reconnect triggered, socket connected:",
        socketRef.current.connected,
      );
      if (!socketRef.current.connected) {
        debugLogger("[WebRTC] Attempting to reconnect socket...");
        socketRef.current.connect();
      } else {
        debugLogger("[WebRTC] Socket already connected");
      }
    }
  }, []);

  return {
    ...state,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    startStreaming,
    stopStreaming,
    requestStream,
    stopViewingStream,
    reconnect,
  };
};
