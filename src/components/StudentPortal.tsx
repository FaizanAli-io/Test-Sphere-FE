"use client";

import { useEffect, useState } from "react";
import { Copy, LogOut, BookOpen, FileText, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "../app/hooks/useApi";

interface ClassData {
  id: number;
  name: string;
  description?: string;
  code: string;
  teacherId: number;
  teacher?: {
    id: number;
    name: string;
    email: string;
  };
  studentCount?: number;
  createdAt?: string;
}

export default function StudentPortal() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [classCode, setClassCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsForClass, setTestsForClass] = useState<number | null>(null);
  const [tests, setTests] = useState<Array<{
    id: number;
    title: string;
    description?: string;
    duration?: number;
    startAt?: string;
    endAt?: string;
    status?: string;
  }>>([]);

  const fetchClasses = async () => {
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
        ? data.map((item: any) => {
            if (item && typeof item === "object" && !("class" in item)) {
              return {
                id: Number(item.id),
                name: item.name,
                description: item.description,
                code: item.code,
                teacherId: Number(item.teacherId),
                teacher: item.teacher ?? undefined,
                studentCount: Array.isArray(item.students)
                  ? item.students.length
                  : undefined,
                createdAt: item.createdAt,
              } as ClassData;
            }

            const cls = item?.class ?? {};
            return {
              id: Number(cls.id),
              name: cls.name,
              description: cls.description,
              code: cls.code,
              teacherId: Number(cls.teacherId),
              teacher: cls.teacher ?? undefined,
              studentCount: Array.isArray(cls.students)
                ? cls.students.length
                : undefined,
              createdAt: cls.createdAt,
            } as ClassData;
          })
        : [];

      setClasses(normalized.filter((c) => Number.isFinite(c.id)));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchClassDetails = async (id: number) => {
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
          : undefined,
        createdAt: data.createdAt,
      };
      setSelectedClass(normalized);
      setShowDetailsModal(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      setError("Please enter a class code");
      return;
    }

    setJoining(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api("/classes/join", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ code: classCode.trim().toUpperCase() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to join class");
      }

      const data = await response.json();
      setSuccess("Successfully joined the class!");
      setClassCode("");
      setShowJoinModal(false);

      setTimeout(() => {
        setSuccess(null);
        fetchClasses();
      }, 2000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveClass = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to leave "${name}"?`)) return;

    setError(null);
    try {
      const response = await api(`/classes/${id}/leave`, {
        method: "POST",
        auth: true,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to leave class");
      }

      setSuccess("Successfully left the class");
      setClasses((prev) => prev.filter((cls) => cls.id !== id));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleCopyCode = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setError("Failed to copy code");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !joining) {
      handleJoinClass();
    }
  };

  // Fetch and show tests for a class, then allow navigation to GiveTest via testId
  const fetchTestsForClass = async (id: number) => {
    setTestsLoading(true);
    setError(null);
    try {
      const response = await api(`/tests/class/${id}`, { method: "GET", auth: true });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch tests for class");
      }
      const data = await response.json();
      const normalized = Array.isArray(data)
        ? data.map((t: any) => ({
            id: Number(t.id),
            title: t.title,
            description: t.description,
            duration: typeof t.duration === "number" ? t.duration : undefined,
            startAt: t.startAt,
            endAt: t.endAt,
            status: t.status,
          }))
        : [];
      setTests(normalized.filter((t) => Number.isFinite(t.id)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setTests([]);
    } finally {
      setTestsLoading(false);
    }
  };

  const openTestsModal = async (cls: ClassData) => {
    setTestsForClass(cls.id);
    setShowTestsModal(true);
    await fetchTestsForClass(cls.id);
  };

  const handleTakeTest = async () => {
    const targetClass = selectedClass || classes[0];
    if (!targetClass) {
      alert("Please join or select a class first.");
      return;
    }
    await openTestsModal(targetClass);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Student Portal
          </h1>
          <p className="text-lg text-gray-600">
            Manage your classes and assignments
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-slideIn">
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}

        {error && !showJoinModal && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <button
            onClick={() => setShowJoinModal(true)}
            className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:shadow-xl transition-shadow group-hover:scale-110 duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
              Join a Class
            </h3>
            <p className="text-gray-600 mb-4">
              Enter a class code provided by your teacher to join
            </p>
            <div className="text-indigo-600 font-semibold flex items-center gap-2">
              Join Now
              <span className="group-hover:translate-x-2 transition-transform duration-300">
                →
              </span>
            </div>
          </button>

          {/* ✅ Updated Take Test Button */}
          <button
            onClick={handleTakeTest}
            className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-2xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1 text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:shadow-xl transition-shadow group-hover:scale-110 duration-300">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
              Take a Test
            </h3>
            <p className="text-gray-600 mb-4">
              Start your upcoming or active assignments and tests
            </p>
            <div className="text-orange-600 font-semibold flex items-center gap-2">
              Start Now
              <span className="group-hover:translate-x-2 transition-transform duration-300">
                →
              </span>
            </div>
          </button>
        </div>

        {/* ✅ Rest of your original code continues below */}
        {loading ? (
          <div className="text-center text-gray-600 py-10 animate-pulse">
            Loading your classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white/70 rounded-2xl border border-dashed border-gray-300">
            <p className="text-lg mb-3">You haven’t joined any classes yet.</p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Join your first class →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-md border border-white/20 p-6 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {cls.name}
                  </h3>
                  <button
                    onClick={() => handleCopyCode(cls.code, cls.id)}
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="Copy Class Code"
                  >
                    <Copy
                      size={18}
                      className={
                        copiedCode === cls.id
                          ? "text-green-500"
                          : "text-gray-600"
                      }
                    />
                  </button>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {cls.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>
                    Teacher:{" "}
                    <span className="font-medium text-gray-700">
                      {cls.teacher?.name || "N/A"}
                    </span>
                  </span>
                  <span>
                    {cls.studentCount || 0}{" "}
                    {cls.studentCount === 1 ? "student" : "students"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => fetchClassDetails(cls.id)}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    View Details →
                  </button>

                  <button
                    onClick={() => handleLeaveClass(cls.id, cls.name)}
                    className="text-red-500 font-semibold hover:underline"
                  >
                    Leave
                  </button>
                  <button
                    onClick={() => openTestsModal(cls)}
                    className="text-orange-600 font-semibold hover:underline"
                  >
                    View Tests
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Join a Class
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter class code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4 text-gray-700"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinClass}
                disabled={joining}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {joining ? "Joining..." : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {showDetailsModal && selectedClass && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedClass.name}
            </h2>

            {loadingDetails ? (
              <div className="text-gray-600 text-center py-4">
                Loading details...
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-3">
                  {selectedClass.description || "No description available."}
                </p>

                <div className="border-t pt-3 text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold text-gray-800">
                      Class Code:
                    </span>{" "}
                    {selectedClass.code}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-800">
                      Teacher:
                    </span>{" "}
                    {selectedClass.teacher?.name || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-800">
                      Students:
                    </span>{" "}
                    {selectedClass.studentCount || 0}
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/class/${selectedClass.id}?name=${encodeURIComponent(
                      selectedClass.name
                    )}`
                  )
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Go to Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Tests Modal */}
      {showTestsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {testsForClass ? `Class #${testsForClass} Tests` : "Class Tests"}
              </h2>
              <button
                onClick={() => {
                  setShowTestsModal(false);
                  setTestsForClass(null);
                  setTests([]);
                }}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {testsLoading ? (
              <div className="text-center text-gray-600 py-10">Loading tests…</div>
            ) : tests.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No tests available for this class.</div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
                {tests.map((t) => (
                  <div key={t.id} className="border rounded-xl p-4 bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{t.title}</h3>
                      {t.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.description}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-2 flex gap-4 flex-wrap">
                        {typeof t.duration === "number" && <span>Duration: {t.duration} min</span>}
                        {t.startAt && <span>Starts: {new Date(t.startAt).toLocaleString()}</span>}
                        {t.endAt && <span>Ends: {new Date(t.endAt).toLocaleString()}</span>}
                        {t.status && <span>Status: {t.status}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.push(`/take-test/${t.id}`)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                      >
                        Take Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
