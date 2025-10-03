"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Plus, Copy } from "lucide-react";
import api from "../app/hooks/useApi";

interface ClassData {
  id: number;
  name: string;
  description?: string;
  classCode: string;
  teacherId: number;
  teacher?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [classCode, setClassCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api("/classes", { method: "GET", auth: true });
      if (!response.ok) throw new Error("Failed to fetch classes");
      const data = await response.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;
    setJoining(true);
    setError(null);
    try {
      const response = await api("/classes/join", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ classCode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to join class");

      setClassCode("");
      await fetchClasses();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setJoining(false);
    }
  };

  const handleCopy = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setError("Failed to copy code");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">My Classes</h1>
          </div>
          <p className="text-gray-600 ml-15">
            Join and manage your enrolled classes
          </p>
        </div>

        {/* Join Class Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Join a New Class
            </h2>
          </div>

          <form
            onSubmit={handleJoin}
            className="flex flex-col sm:flex-row gap-4"
          >
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="Enter 6-digit class code"
              className="flex-1 px-5 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              disabled={joining}
            />
            <button
              type="submit"
              disabled={joining || !classCode.trim()}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {joining ? "Joining..." : "Join Class"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Classes Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Join your first class using a class code
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {cls.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {cls.teacher?.name || "Unknown teacher"}
                    </p>
                  </div>
                </div>

                {cls.description && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {cls.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">
                      Code:
                    </span>
                    <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                      {cls.classCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(cls.classCode, cls.id)}
                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedCode === cls.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
