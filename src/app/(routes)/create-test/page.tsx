"use client";

import React, { useState } from "react";
import type { ReactElement } from "react";
import api from "@/app/hooks/useApi";

interface Test {
  id: string;
  title: string;
  description: string;
  duration: number;
  date: string;
  classId: number;
}

export default function CreateTestPage(): ReactElement {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    date: "",
    classId: "",
  });

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const endpoint = editingId ? `/edit-test/${editingId}` : "/create-test";

      const method = editingId ? "PUT" : "POST";

      const payload = {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          duration: parseInt(formData.duration),
          date: formData.date
            ? new Date(formData.date).toISOString()
            : new Date().toISOString(),
          classId: parseInt(formData.classId),
        }),
      };

      console.log("Submitting to:", endpoint, "with payload:", payload.body);

      const response = await api(endpoint, {
        method,
        auth: true,
        body: payload.body,
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        setMessage({
          text: editingId
            ? "Test updated successfully!"
            : "Test created successfully!",
          type: "success",
        });

        if (editingId) {
          setTests((prev) =>
            prev.map((test) => (test.id === editingId ? data : test))
          );
          setEditingId(null);
        } else {
          setTests((prev) => [...prev, data]);
        }

        setFormData({
          title: "",
          description: "",
          duration: "",
          date: "",
          classId: "",
        });
      } else {
        setMessage({
          text: "Failed to save test. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTestsByClass = async () => {
    if (!formData.classId) {
      setMessage({
        text: "Please enter a Class ID to fetch tests",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api(`/api/get-tests/${formData.classId}`, {
        method: "GET",
        auth: true,
      });
      if (response.ok) {
        const data = await response.json();
        setTests(data);
        setMessage({ text: `Fetched ${data.length} test(s)`, type: "success" });
      } else {
        setMessage({ text: "Failed to fetch tests", type: "error" });
      }
    } catch (error) {
      setMessage({
        text: "An error occurred while fetching tests",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (test: Test) => {
    setFormData({
      title: test.title,
      description: test.description,
      duration: test.duration.toString(),
      date: test.date ? new Date(test.date).toISOString().split("T")[0] : "",
      classId: test.classId.toString(),
    });
    setEditingId(test.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (testId: string) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;

    setLoading(true);
    try {
      const response = await api(`/api/delete-test/${testId}`, {
        method: "DELETE",
        auth: true,
      });

      if (response.ok) {
        setTests((prev) => prev.filter((test) => test.id !== testId));
        setMessage({ text: "Test deleted successfully!", type: "success" });
      } else {
        setMessage({ text: "Failed to delete test", type: "error" });
      }
    } catch (error) {
      setMessage({
        text: "An error occurred while deleting test",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      duration: "",
      date: "",
      classId: formData.classId,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Test Management
          </h1>
          <p className="text-gray-600">Create, edit, and manage your tests</p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {editingId ? "Edit Test" : "Create New Test"}
          </h2>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="classId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Class ID *
              </label>
              <input
                type="text"
                id="classId"
                name="classId"
                value={formData.classId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
                placeholder="Enter class ID"
              />
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Test Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
                placeholder="e.g., Midterm Examination"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none text-gray-900"
                placeholder="Enter test description and instructions"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
                  placeholder="60"
                />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Test Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Processing..."
                  : editingId
                  ? "Update Test"
                  : "Create Test"}
              </button>

              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={fetchTestsByClass}
              disabled={loading || !formData.classId}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Fetch Tests by Class"}
            </button>
          </div>
        </div>

        {tests.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Tests List
            </h2>
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {test.title}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(test)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(test.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{test.description}</p>
                  <div className="flex gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Duration:</span>{" "}
                      {test.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(test.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Class ID:</span>{" "}
                      {test.classId}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
