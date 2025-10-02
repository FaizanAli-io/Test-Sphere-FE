"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, LogOut, Plus, AlertCircle, CheckCircle } from "lucide-react";
import type { ReactElement } from "react";
import api from "../app/hooks/useApi";

interface ClassData {
  class_id: string;
  class_name: string;
  teacher_name?: string;
  description?: string;
}

interface EnrollClassFormProps {
  onEnroll: (classData: ClassData) => void;
  onError: (error: string) => void;
}

function EnrollClassForm({
  onEnroll,
  onError,
}: EnrollClassFormProps): ReactElement {
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;

    setLoading(true);
    try {
      const response = await api("/classes/join", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ class_code: classCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to join class");
      }

      const data = await response.json();
      onEnroll({
        class_id: classCode,
        class_name: data.class_name || "New Class",
      });
      setClassCode("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        onError(err.message);
      } else {
        onError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 mb-8 border border-indigo-100">
      <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-black" />
        Join a New Class
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
          placeholder="Enter class code"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !classCode.trim()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? "Joining..." : "Join Class"}
        </button>
      </form>
    </div>
  );
}

interface ClassCardProps {
  classData: ClassData;
  onLeave: (classId: string) => Promise<void>;
}

function ClassCard({ classData, onLeave }: ClassCardProps): ReactElement {
  const [leaving, setLeaving] = useState(false);

  const handleLeave = async () => {
    if (!confirm(`Are you sure you want to leave ${classData.class_name}?`)) {
      return;
    }

    setLeaving(true);
    try {
      await onLeave(classData.class_id);
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-black" />
            <h3 className="text-lg font-semibold text-black">
              {classData.class_name}
            </h3>
          </div>
          <p className="text-sm text-black mb-1">
            Class Code:{" "}
            <span className="font-mono font-medium">{classData.class_id}</span>
          </p>
          {classData.teacher_name && (
            <p className="text-sm text-black">
              Teacher: {classData.teacher_name}
            </p>
          )}
          {classData.description && (
            <p className="text-sm text-black mt-2">{classData.description}</p>
          )}
        </div>
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="ml-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          {leaving ? "Leaving..." : "Leave"}
        </button>
      </div>
    </div>
  );
}

export default function StudentPortal(): ReactElement {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api("/classes", {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }

      const data = await response.json();
      const formattedData: ClassData[] = data.map((item: any) => ({
        class_id: item.class_id,
        class_name: item.class_name,
        teacher_name: item.teacher_name,
        description: item.description,
      }));
      setClasses(formattedData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = (newClass: ClassData) => {
    setClasses((prev) => [...prev, newClass]);
    setSuccessMessage(`Successfully joined ${newClass.class_name}!`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleLeave = async (classId: string) => {
    const response = await api("/classes/leave", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ class_id: classId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to leave class");
    }

    setClasses((prev) => prev.filter((c) => c.class_id !== classId));
    setSuccessMessage("Successfully left the class");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    setTimeout(() => setError(""), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-10 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-black mb-2">Student Portal</h1>
          <p className="text-black">Manage your enrolled classes</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-black flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-black" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-black flex items-start gap-3">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-black" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-2xl p-8">
          <EnrollClassForm onEnroll={handleEnroll} onError={handleError} />

          <div>
            <h2 className="text-2xl font-semibold text-black mb-6">
              My Classes
              <span className="ml-3 text-sm font-normal text-black">
                ({classes.length} {classes.length === 1 ? "class" : "classes"})
              </span>
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-black">Loading classes...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <BookOpen className="w-12 h-12 text-black mx-auto mb-3" />
                <p className="text-black text-lg">No classes enrolled yet</p>
                <p className="text-black text-sm mt-1">
                  Join a class using the form above
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((classData) => (
                  <ClassCard
                    key={classData.class_id}
                    classData={classData}
                    onLeave={handleLeave}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
