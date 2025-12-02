import { useState, useEffect, useCallback } from "react";

import api from "@/hooks/useApi";
import { debugLogger } from "@/utils/logger";

export interface InvigilatingStudent {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  submissionId: number;
}

export const useInvigilateStudents = (testId: string) => {
  const [students, setStudents] = useState<InvigilatingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!testId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api(`/tests/${testId}/invigilate`, {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No students found or endpoint doesn't exist
          setStudents([]);
          setError(null);
          return;
        }
        throw new Error(`Failed to fetch students: ${response.status}`);
      }

      const data = await response.json();
      debugLogger("Invigilation API response:", data);

      // Backend returns: { submissions: [{ id, userId, user: {...}, ... }] }
      if (data && Array.isArray(data.submissions)) {
        const students = data.submissions.map(
          (submission: {
            id: number;
            user: { id: number; name: string; email: string; profileImage: string };
            userId: number;
          }) => ({
            id: submission.user.id,
            name: submission.user.name,
            email: submission.user.email,
            profilePicture: submission.user.profileImage,
            cameraEnabled: true, // TODO: Get from WebRTC or proctoring data
            microphoneEnabled: true, // TODO: Get from WebRTC or proctoring data
            submissionId: submission.id,
          }),
        );
        setStudents(students);
      } else {
        console.warn("No submissions found in response:", data);
        setStudents([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching invigilating students:", err);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchStudents();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchStudents, 10000);

    return () => clearInterval(interval);
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
  };
};
