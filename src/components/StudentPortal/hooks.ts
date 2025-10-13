import { useState, useEffect, useCallback } from "react";
import api from "../../hooks/useApi";
import { ClassData, Test, StudentSubmission } from "./types";

export function useStudentClasses() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api("/classes", {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch classes");
      }

      const data = await response.json();
      const normalized: ClassData[] = Array.isArray(data)
        ? (data
            .map((raw: unknown) => {
              if (!raw || typeof raw !== "object") return null;
              const value = raw as Record<string, unknown>;
              // Case 1: shape already a class
              if (!("class" in value)) {
                return {
                  id: Number(value.id),
                  name: value.name as string,
                  description: value.description as string | undefined,
                  code: value.code as string,
                  teacherId: Number(value.teacherId),
                  teacher: value.teacher as ClassData["teacher"],
                  studentCount: Array.isArray(value.students)
                    ? value.students.length
                    : typeof value.studentCount === "number"
                      ? value.studentCount
                      : 0,
                  testCount: Array.isArray(value.tests)
                    ? value.tests.length
                    : typeof value.testCount === "number"
                      ? value.testCount
                      : 0,
                  createdAt: value.createdAt as string | undefined,
                } as ClassData;
              }
              // Case 2: nested under 'class'
              const cls = value.class as Record<string, unknown> | undefined;
              if (!cls) return null;
              return {
                id: Number(cls.id),
                name: cls.name as string,
                description: cls.description as string | undefined,
                code: cls.code as string,
                teacherId: Number(cls.teacherId),
                teacher: cls.teacher as ClassData["teacher"],
                studentCount: Array.isArray(cls.students as unknown[])
                  ? (cls.students as unknown[]).length
                  : typeof cls.studentCount === "number"
                    ? cls.studentCount
                    : 0,
                testCount: Array.isArray(cls.tests as unknown[])
                  ? (cls.tests as unknown[]).length
                  : typeof cls.testCount === "number"
                    ? cls.testCount
                    : 0,
                createdAt: cls.createdAt as string | undefined,
              } as ClassData;
            })
            .filter(Boolean) as ClassData[])
        : [];

      setClasses(normalized.filter((c) => Number.isFinite(c.id)));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const joinClass = useCallback(async (classCode: string) => {
    const response = await api("/classes/join", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ code: classCode.trim().toUpperCase() }),
    });

    if (!response.ok) {
      const joinErr = await response.json();
      throw new Error(joinErr.message || "Failed to join class");
    }

    await response.json(); // response body ignored intentionally
    return true;
  }, []);

  const leaveClass = useCallback(async (id: number) => {
    const response = await api(`/classes/${id}/leave`, {
      method: "POST",
      auth: true,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to leave class");
    }

    setClasses((prev) => prev.filter((cls) => cls.id !== id));
    return true;
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return {
    classes,
    loading,
    error,
    fetchClasses,
    joinClass,
    leaveClass,
    setError,
  };
}

export function useClassDetails() {
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassDetails = useCallback(async (id: number) => {
    setLoadingDetails(true);
    setError(null);
    try {
      const response = await api(`/classes/${id}`, {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch class details");
      }

      const data = await response.json();
      const normalized: ClassData = {
        id: Number(data.id),
        name: data.name,
        description: data.description,
        code: data.code,
        teacherId: Number(data.teacherId),
        teacher: data.teacher ?? undefined,
        studentCount: Array.isArray(data.students)
          ? data.students.length
          : typeof data.studentCount === "number"
            ? data.studentCount
            : 0,
        testCount: Array.isArray(data.tests)
          ? data.tests.length
          : typeof data.testCount === "number"
            ? data.testCount
            : 0,
        createdAt: data.createdAt,
      };
      setSelectedClass(normalized);
      return normalized;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  return {
    selectedClass,
    loadingDetails,
    error,
    fetchClassDetails,
    setSelectedClass,
    setError,
  };
}

export function useTestsForClass() {
  const [tests, setTests] = useState<Test[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTestsForClass = useCallback(async (id: number) => {
    setTestsLoading(true);
    setError(null);
    try {
      const response = await api(`/tests/class/${id}`, {
        method: "GET",
        auth: true,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch tests for class");
      }
      const data = await response.json();
      interface RawTest {
        id?: number;
        title?: string;
        description?: string;
        duration?: number;
        startAt?: string;
        endAt?: string;
        status?: string;
      }
      const normalized = Array.isArray(data)
        ? (data as unknown[])
            .map((t) => {
              if (!t || typeof t !== "object") return null;
              const obj = t as RawTest;
              const id = Number(obj.id);
              if (!Number.isFinite(id)) return null;
              return {
                id,
                title: obj.title ?? "",
                description: obj.description,
                duration:
                  typeof obj.duration === "number" ? obj.duration : undefined,
                startAt: obj.startAt,
                endAt: obj.endAt,
                status: obj.status,
              } as Test;
            })
            .filter((v): v is Test => v !== null)
        : [];
      setTests(normalized);
      return normalized;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setTests([]);
      throw err;
    } finally {
      setTestsLoading(false);
    }
  }, []);

  return {
    tests,
    testsLoading,
    error,
    fetchTestsForClass,
    setTests,
    setError,
  };
}

export function useAllTests() {
  const [allTests, setAllTests] = useState<Test[]>([]);
  const [allTestsLoading, setAllTestsLoading] = useState<boolean>(false);
  const [allTestsError, setAllTestsError] = useState<string | null>(null);

  const fetchAllTests = useCallback(async (classes: ClassData[]) => {
    setAllTestsLoading(true);
    setAllTestsError(null);
    try {
      const allTestsFromClasses: Test[] = [];

      // Fetch tests from each class the student is enrolled in
      for (const classItem of classes) {
        try {
          const response = await api(`/tests/class/${classItem.id}`, {
            method: "GET",
            auth: true,
          });

          if (response.ok) {
            const data = await response.json();
            const classTests = Array.isArray(data)
              ? data
                  .map(
                    (test: Record<string, unknown>): Test => ({
                      id: Number(test.id),
                      title:
                        typeof test.title === "string"
                          ? test.title
                          : "Untitled Test",
                      description:
                        typeof test.description === "string"
                          ? test.description
                          : "",
                      classId: classItem.id,
                      className: classItem.name,
                      duration: Number(test.duration) || 0,
                      startAt:
                        typeof test.startAt === "string"
                          ? test.startAt
                          : undefined,
                      endAt:
                        typeof test.endAt === "string" ? test.endAt : undefined,
                      status:
                        typeof test.status === "string" ? test.status : "DRAFT",
                    })
                  )
                  .filter((test: Test) => Number.isFinite(test.id))
              : [];

            allTestsFromClasses.push(...classTests);
          }
        } catch (classErr) {
          console.warn(
            `Failed to fetch tests for class ${classItem.name}:`,
            classErr
          );
          // Continue with other classes even if one fails
        }
      }

      setAllTests(allTestsFromClasses);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setAllTestsError(errorMessage);
    } finally {
      setAllTestsLoading(false);
    }
  }, []);

  return {
    allTests,
    allTestsLoading,
    allTestsError,
    fetchAllTests,
    setAllTests,
    setAllTestsError,
  };
}

export function useNotifications() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const showSuccess = useCallback((message: string, timeout = 3000) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), timeout);
  }, []);

  const showError = useCallback((message: string) => {
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleCopyCode = useCallback(
    async (code: string, id: number) => {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
      } catch {
        showError("Failed to copy code");
      }
    },
    [showError]
  );

  return {
    success,
    error,
    copiedCode,
    showSuccess,
    showError,
    clearError,
    handleCopyCode,
  };
}

export function useStudentSubmissions() {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api("/submissions/student", {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch submissions";
      setError(errorMessage);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch submissions on mount
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    loading,
    error,
    fetchSubmissions,
    setSubmissions,
    setError,
  };
}
