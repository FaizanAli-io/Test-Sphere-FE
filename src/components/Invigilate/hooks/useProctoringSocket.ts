import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/hooks/useApi";

export interface ProctoringData {
  studentId: string;
  score: number;
  flags: string[];
  gazeDelta: { x: number; y: number };
  headPose: { pitch: number; yaw: number };
  faceDetected: boolean;
  timestamp: number;
}

/**
 * Teacher-side hook that listens for real-time proctoring telemetry
 * from the streaming gateway. Maintains a map of studentId → latest data.
 */
export function useProctoringSocket(teacherId: string, testId: string, enabled: boolean) {
  const socketRef = useRef<Socket | null>(null);
  const [proctoringMap, setProctoringMap] = useState<Map<string, ProctoringData>>(new Map());

  useEffect(() => {
    if (!enabled || !teacherId || !testId) return;

    const socketUrl = `${API_BASE_URL}/streaming`;
    const socket = io(socketUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Register as teacher
      socket.emit("register", {
        userId: teacherId,
        role: "teacher",
        testId: parseInt(testId),
      });
      // Request initial snapshot
      socket.emit("get-proctoring-snapshot", { testId: parseInt(testId) });
    });

    socket.on("proctoring_data", (data: ProctoringData) => {
      setProctoringMap((prev) => {
        const next = new Map(prev);
        next.set(data.studentId, data);
        return next;
      });
    });

    socket.on("proctoring_snapshot", (data: { students: ProctoringData[] }) => {
      setProctoringMap((prev) => {
        const next = new Map(prev);
        for (const s of data.students) {
          next.set(s.studentId, s);
        }
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, teacherId, testId]);

  const getStudentProctoring = useCallback(
    (studentId: string | number): ProctoringData | undefined => {
      return proctoringMap.get(String(studentId));
    },
    [proctoringMap],
  );

  return { proctoringMap, getStudentProctoring };
}
