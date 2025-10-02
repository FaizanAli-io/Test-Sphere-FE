"use client";

import React, { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apix from "../app/hooks/useApi";

interface Class {
  id: string;
  name: string;
  description: string;
  classCode: string;
  createdBy: string;
  students?: string[];
  createdAt?: string;
}

interface EnrolledClass {
  id: string;
  name: string;
  description: string;
  classCode: string;
  teacherName?: string;
}

export default function AdminPortal(): ReactElement {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Class Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
  });

  // Join Class Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classCode, setClassCode] = useState("");

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch all classes
  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apix("/classes", {
        method: "GET",
        auth: true,
      });

      if (!response.ok) throw new Error("Failed to fetch classes");
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  // Fetch enrolled classes
  const fetchEnrolledClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apix("/api/classes", {
        method: "GET",
        auth: true,
      });

      if (!response.ok) throw new Error("Failed to fetch enrolled classes");
      const data = await response.json();
      setEnrolledClasses(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch enrolled classes"
      );
    } finally {
      setLoading(false);
    }
  };

  // Create new class
  const handleCreateClass = async () => {
    if (!newClass.name.trim()) {
      alert("Please enter a class name");
      return;
    }

    setLoading(true);
    try {
      const response = await apix("/classes", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          name: newClass.name,
          description: newClass.description,
        }),
      });

      if (!response.ok) throw new Error("Failed to create class");

      const data = await response.json();
      alert(`Class created successfully! Class Code: ${data.classCode}`);
      setShowCreateModal(false);
      setNewClass({ name: "", description: "" });
      fetchClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  // Join class with code
  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      alert("Please enter a class code");
      return;
    }

    setLoading(true);
    try {
      const response = await apix("/classes/join", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ classCode }),
      });

      if (!response.ok) throw new Error("Failed to join class");

      alert("Successfully joined the class!");
      setShowJoinModal(false);
      setClassCode("");
      fetchEnrolledClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to join class");
    } finally {
      setLoading(false);
    }
  };

  // Delete class
  const handleDeleteClass = async (classId: string) => {
    setLoading(true);
    try {
      const response = await apix(`/classes/${classId}`, {
        method: "DELETE",
        auth: true,
      });

      if (!response.ok) throw new Error("Failed to delete class");

      alert("Class deleted successfully!");
      setDeleteConfirm(null);
      fetchClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete class");
    } finally {
      setLoading(false);
    }
  };

  // Leave class
  const handleLeaveClass = async (classId: string) => {
    setLoading(true);
    try {
      const response = await apix(`/classes/${classId}/leave`, {
        method: "DELETE",
        auth: true,
      });

      if (!response.ok) throw new Error("Failed to leave class");

      alert("Successfully left the class!");
      fetchEnrolledClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to leave class");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "classes") {
      fetchClasses();
    } else if (activeTab === "students") {
      fetchEnrolledClasses();
    }
  }, [activeTab]);

  const quickActions = [
    {
      title: "Create New Class",
      description: "Set up a new class for your students",
      icon: "🏫",
      action: () => {
        setShowCreateModal(true);
        setActiveTab("classes");
      },
      color:
        "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    },
    {
      title: "Join Class",
      description: "Enroll in a class using a code",
      icon: "🎓",
      action: () => {
        setShowJoinModal(true);
        setActiveTab("students");
      },
      color:
        "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    },
    {
      title: "View Analytics",
      description: "Check student performance and insights",
      icon: "📊",
      action: () => router.push("/analytics"),
      color:
        "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    },
    {
      title: "Create Test",
      description: "Design and schedule a new test",
      icon: "📝",
      action: () => router.push("/create-test"),
      color:
        "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            TestSphere Admin Portal
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Manage your classes, tests, and students efficiently
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-gray-100"
              onClick={action.action}
            >
              <div className="text-5xl mb-4">{action.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {action.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm">{action.description}</p>
              <div
                className={`w-full ${action.color} text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-center shadow-md`}
              >
                Get Started
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-wrap gap-2 mb-6 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-xl">
            {[
              { id: "overview", label: "Overview", icon: "🏠" },
              { id: "classes", label: "My Classes", icon: "🏫" },
              { id: "tests", label: "Tests", icon: "📝" },
              { id: "students", label: "Enrolled Classes", icon: "👥" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-fit py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {activeTab === "overview" && (
              <div className="text-center py-16">
                <div className="text-8xl mb-6">🎓</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Ready to get started?
                </h3>
                <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
                  Choose an action above or navigate to your dashboard for
                  detailed management.
                </p>
                <Link
                  href="/teacherdashboard"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Go to Dashboard →
                </Link>
              </div>
            )}

            {activeTab === "classes" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    My Classes
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                  >
                    + Create New Class
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading classes...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 font-medium">{error}</p>
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="text-6xl mb-4">🏫</div>
                    <p className="text-gray-600 mb-4">No classes created yet</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Create Your First Class
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {classes.map((cls) => (
                      <div
                        key={cls.id}
                        className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-6 shadow-md border border-blue-100 hover:shadow-lg transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">
                              {cls.name}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {cls.description}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                            {cls.classCode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                          <span className="text-sm text-gray-600">
                            👥 {cls.students?.length || 0} students
                          </span>
                          <button
                            onClick={() => setDeleteConfirm(cls.id)}
                            className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "tests" && (
              <div className="text-center py-16">
                <div className="text-8xl mb-6">📝</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Test Management
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Create, schedule, and review tests.
                </p>
                <button
                  onClick={() => router.push("/create-test")}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                >
                  Create New Test →
                </button>
              </div>
            )}

            {activeTab === "students" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Enrolled Classes
                  </h3>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                  >
                    + Join Class
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                      Loading enrolled classes...
                    </p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 font-medium">{error}</p>
                  </div>
                ) : enrolledClasses.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-gray-600 mb-4">
                      Not enrolled in any classes yet
                    </p>
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                    >
                      Join Your First Class
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrolledClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="bg-gradient-to-br from-white to-green-50 rounded-xl p-6 shadow-md border border-green-100 hover:shadow-lg transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">
                              {cls.name}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {cls.description}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                            {cls.classCode}
                          </span>
                        </div>
                        {cls.teacherName && (
                          <p className="text-sm text-gray-600 mb-4">
                            👨‍🏫 Teacher: {cls.teacherName}
                          </p>
                        )}
                        <button
                          onClick={() => handleLeaveClass(cls.id)}
                          className="w-full px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Leave Class
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Create New Class
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) =>
                    setNewClass({ ...newClass, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Mathematics 101"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newClass.description}
                  onChange={(e) =>
                    setNewClass({ ...newClass, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of the class"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewClass({ name: "", description: "" });
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Join Class
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class Code *
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                  placeholder="Enter class code"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setClassCode("");
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinClass}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Delete Class?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this class? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClass(deleteConfirm)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
