"use client";

import React, { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
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

export default function TeacherPortal(): ReactElement {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", description: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apix("/classes", { method: "GET", auth: true });
      if (!response.ok) throw new Error("Failed to fetch classes");
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const navigateToClassDetail = (classId: string) => {
    router.push(`/class/${classId}`);
  };

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
        body: JSON.stringify(newClass),
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

  const handleEditClass = async () => {
    if (!editClass || !editClass.name.trim()) {
      alert("Please enter a class name");
      return;
    }
    setLoading(true);
    try {
      const response = await apix(`/classes/${editClass.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          name: editClass.name,
          description: editClass.description,
        }),
      });
      if (!response.ok) throw new Error("Failed to update class");

      alert("Class updated successfully!");
      setShowEditModal(false);
      setEditClass(null);
      fetchClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update class");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Teacher Portal
          </h1>
          <p className="text-lg text-gray-600">
            Manage your classes and tests efficiently
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div
            onClick={() => setShowCreateModal(true)}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center text-3xl mb-4 shadow-md group-hover:shadow-lg transition-shadow">
              🏫
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
              Create New Class
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Set up a new class for your students
            </p>
            <div className="text-indigo-600 font-semibold flex items-center gap-2">
              Get Started
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>

          <div
            onClick={() => router.push("/create-test")}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-lg hover:border-orange-200 transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-3xl mb-4 shadow-md group-hover:shadow-lg transition-shadow">
              📝
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
              Create Test
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Design and schedule a new test
            </p>
            <div className="text-orange-600 font-semibold flex items-center gap-2">
              Get Started
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900">My Classes</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              + Create New Class
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading classes...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                🏫
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                No Classes Yet
              </h4>
              <p className="text-gray-600 mb-6">
                Create your first class to get started
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Create Your First Class
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="group bg-gradient-to-br from-white to-blue-50 rounded-xl p-6 shadow-sm border border-blue-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => navigateToClassDetail(cls.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded">
                            ID: {cls.id}
                          </span>
                        </div>
                        <h4 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                          {cls.name}
                        </h4>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {cls.description}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg ml-2">
                        {cls.classCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-blue-200">
                      <span className="text-sm text-gray-600">
                        👥 {cls.students?.length || 0} students
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditClass(cls);
                        setShowEditModal(true);
                      }}
                      className="flex-1 px-4 py-2.5 bg-yellow-500 text-white text-sm font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(cls.id);
                      }}
                      className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">
              Create New Class
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) =>
                    setNewClass({ ...newClass, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-gray-50 focus:bg-white transition-all"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-gray-50 focus:bg-white transition-all"
                  rows={3}
                  placeholder="Brief description of the class"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewClass({ name: "", description: "" });
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">
              Edit Class
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  value={editClass.name}
                  onChange={(e) =>
                    setEditClass({ ...editClass, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-gray-50 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editClass.description}
                  onChange={(e) =>
                    setEditClass({ ...editClass, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-gray-50 focus:bg-white transition-all"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditClass(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditClass}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Delete Class?
              </h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to delete this class? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
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
