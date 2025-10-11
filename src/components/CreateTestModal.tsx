"use client";

import api from "../hooks/useApi";
import React, { useState, useEffect } from "react";
import { useNotifications } from "../contexts/NotificationContext";

interface Class {
  id: string;
  code: string;
  name: string;
  createdBy: string;
  createdAt?: string;
  description: string;
  students?: Array<{ id: number; name: string; email: string }>;
}

interface TestData {
  classId: number;
  title: string;
  description: string;
  duration: number;
  startAt: string;
  endAt: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
}

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated?: (testId: number) => void;
  prefilledClassId?: number;
}

export default function CreateTestModal({
  isOpen,
  onClose,
  onTestCreated,
  prefilledClassId
}: CreateTestModalProps) {
  const notifications = useNotifications();
  const [formData, setFormData] = useState<TestData>({
    classId: prefilledClassId || 0,
    title: "",
    description: "",
    duration: 60,
    startAt: "",
    endAt: "",
    status: "DRAFT"
  });

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const fetchClasses = async () => {
    setClassesLoading(true);
    setClassesError(null);
    try {
      const response = await api("/classes", { method: "GET", auth: true });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch classes");
      }
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setClassesError(
        err instanceof Error ? err.message : "Failed to fetch classes"
      );
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  const validateDates = (startAt: string, endAt: string, duration: number) => {
    if (!startAt || !endAt) {
      setDateError(null);
      return;
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const requiredEndDate = new Date(
      startDate.getTime() + duration * 60 * 1000
    );

    if (endDate < requiredEndDate) {
      setDateError(
        `End date and time must be at least ${duration} minutes after start date and time`
      );
    } else {
      setDateError(null);
    }
  };

  const handleChange = <K extends keyof TestData>(
    key: K,
    value: TestData[K]
  ) => {
    const newFormData = { ...formData, [key]: value };
    setFormData(newFormData);

    // Validate dates when start date, end date, or duration changes
    if (key === "startAt" || key === "endAt" || key === "duration") {
      validateDates(
        key === "startAt" ? (value as string) : newFormData.startAt,
        key === "endAt" ? (value as string) : newFormData.endAt,
        key === "duration" ? (value as number) : newFormData.duration
      );
    }
  };

  const resetForm = () => {
    setFormData({
      classId: prefilledClassId || 0,
      title: "",
      description: "",
      duration: 60,
      startAt: "",
      endAt: "",
      status: "DRAFT"
    });
    setClasses([]);
    setClassesError(null);
    setDateError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      notifications.showError("Please enter a test title");
      return;
    }

    if (!formData.classId || formData.classId <= 0) {
      notifications.showError("Please select a class");
      return;
    }

    if (!formData.startAt || !formData.endAt) {
      notifications.showError("Please set both start and end date/time");
      return;
    }

    // Check if there's a date validation error
    if (dateError) {
      notifications.showError(dateError);
      return;
    }

    // Validate that end date meets the duration requirement (double-check)
    const startDate = new Date(formData.startAt);
    const endDate = new Date(formData.endAt);
    const requiredEndDate = new Date(
      startDate.getTime() + formData.duration * 60 * 1000
    );

    if (endDate < requiredEndDate) {
      notifications.showError(
        `End date and time must be at least ${formData.duration} minutes after start date and time`
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        classId: Number(formData.classId),
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: Number(formData.duration),
        startAt: formData.startAt,
        endAt: formData.endAt,
        status: formData.status
      };

      const res = await api("/tests", {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create test");
      }

      const data = await res.json();
      notifications.showSuccess(
        `Test created successfully! Test ID: ${data.id}`
      );

      if (onTestCreated) {
        onTestCreated(data.id);
      }

      handleClose();
    } catch (err) {
      console.error("Failed to create test:", err);
      notifications.showError(
        err instanceof Error ? err.message : "Error creating test"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📝</span>
              Create New Test
            </h2>
            <p className="mt-1 text-purple-100">
              Configure the basic details of your test
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors text-white font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">🏫</span>
              Select Class *
            </label>

            {classesLoading ? (
              <div className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl bg-gray-50 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
                <span className="text-gray-600 font-medium">
                  Loading classes...
                </span>
              </div>
            ) : classesError ? (
              <div className="space-y-3">
                <div className="w-full px-4 py-3.5 border-2 border-red-300 rounded-xl bg-red-50 text-red-700 font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  {classesError}
                </div>
                <button
                  type="button"
                  onClick={fetchClasses}
                  className="px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-all flex items-center gap-2"
                >
                  <span>🔄</span>
                  Retry
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <select
                    value={formData.classId || ""}
                    onChange={(e) =>
                      handleChange("classId", Number(e.target.value))
                    }
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 bg-white font-medium appearance-none pr-12 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!!prefilledClassId}
                  >
                    <option value="">Choose a class...</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={Number(cls.id)}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {prefilledClassId && (
                  <p className="mt-2 text-sm text-green-600 font-medium flex items-center gap-2">
                    <span>✓</span> Using prefilled class:{" "}
                    {classes.find((c) => Number(c.id) === prefilledClassId)
                      ?.name || `ID: ${prefilledClassId}`}
                  </p>
                )}

                {classes.length === 0 && !classesLoading && (
                  <p className="mt-2 text-sm text-amber-600 font-medium flex items-center gap-2">
                    <span>📝</span> No classes found. Create a class first to
                    add tests.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">📖</span>
                Test Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Midterm Examination"
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                Duration (minutes) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) =>
                  handleChange("duration", Number(e.target.value))
                }
                placeholder="60"
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">📄</span>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Provide a brief description of the test (optional)"
              rows={4}
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 resize-none font-medium"
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">💡</span>
              <span className="font-medium">
                Set your test schedule (end time must be after start time)
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => handleChange("startAt", e.target.value)}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 transition-all text-gray-900 font-medium ${
                    dateError
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => handleChange("endAt", e.target.value)}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 transition-all text-gray-900 font-medium ${
                    dateError
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  }`}
                />
              </div>
            </div>

            {/* Date Validation Messages */}
            {dateError ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                <span className="text-lg">⚠️</span>
                {dateError}
              </div>
            ) : formData.startAt && formData.endAt && !dateError ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium">
                <span className="text-lg">✅</span>
                Test schedule is valid (
                {Math.round(
                  (new Date(formData.endAt).getTime() -
                    new Date(formData.startAt).getTime()) /
                    (1000 * 60)
                )}{" "}
                minutes available, {formData.duration} minutes required)
              </div>
            ) : null}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">📊</span>
              Test Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                handleChange("status", e.target.value as TestData["status"])
              }
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 bg-white font-medium"
            >
              <option value="ACTIVE">
                Active - Students can take the test
              </option>
              <option value="DRAFT">
                Draft - Created but not visible to students
              </option>
              <option value="CLOSED">
                Closed - Test has ended and can no longer be attempted
              </option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!dateError}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-indigo-700 text-lg flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating Test...
                </>
              ) : (
                <>
                  <span>📝</span>
                  Create Test
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
