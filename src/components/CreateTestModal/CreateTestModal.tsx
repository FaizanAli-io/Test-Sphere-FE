"use client";

import React, { useState, useEffect } from "react";
import api from "../../hooks/useApi";
import { useNotifications } from "../../contexts/NotificationContext";
import { localDatetimeToUtcIso } from "../../utils/timezone";
import CreateTestModalHeader from "./Header";
import ClassSelector from "./ClassSelector";
import DateTimeWindow from "./DateTimeWindow";

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

const CreateTestModal: React.FC<CreateTestModalProps> = ({
  isOpen,
  onClose,
  onTestCreated,
  prefilledClassId,
}) => {
  const notifications = useNotifications();

  const [formData, setFormData] = useState<TestData>({
    classId: prefilledClassId || 0,
    title: "",
    description: "",
    duration: 60,
    startAt: "",
    endAt: "",
    status: "DRAFT",
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
      setClassesError(err instanceof Error ? err.message : "Failed to fetch classes");
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
    const requiredEndDate = new Date(startDate.getTime() + duration * 60 * 1000);
    if (endDate < requiredEndDate) {
      setDateError(
        `End date and time must be at least ${duration} minutes after start date and time`,
      );
    } else {
      setDateError(null);
    }
  };

  const handleChange = <K extends keyof TestData>(key: K, value: TestData[K]) => {
    const newFormData = { ...formData, [key]: value };

    if (key === "startAt" && value) {
      const startDate = new Date(value as string);
      const endDate = new Date(startDate.getTime() + newFormData.duration * 60 * 1000);
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, "0");
      const day = String(endDate.getDate()).padStart(2, "0");
      const hours = String(endDate.getHours()).padStart(2, "0");
      const minutes = String(endDate.getMinutes()).padStart(2, "0");
      newFormData.endAt = `${year}-${month}-${day}T${hours}:${minutes}`;
    } else if (key === "duration" && newFormData.startAt) {
      const startDate = new Date(newFormData.startAt);
      const endDate = new Date(startDate.getTime() + (value as number) * 60 * 1000);
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, "0");
      const day = String(endDate.getDate()).padStart(2, "0");
      const hours = String(endDate.getHours()).padStart(2, "0");
      const minutes = String(endDate.getMinutes()).padStart(2, "0");
      newFormData.endAt = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    setFormData(newFormData);

    if (key === "startAt" || key === "endAt" || key === "duration") {
      validateDates(
        key === "startAt" ? (value as string) : newFormData.startAt,
        key === "endAt" ? (value as string) : newFormData.endAt,
        key === "duration" ? (value as number) : newFormData.duration,
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
      status: "DRAFT",
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
    if (dateError) {
      notifications.showError(dateError);
      return;
    }
    const startDate = new Date(formData.startAt);
    const endDate = new Date(formData.endAt);
    const requiredEndDate = new Date(startDate.getTime() + formData.duration * 60 * 1000);
    if (endDate < requiredEndDate) {
      notifications.showError(
        `End date and time must be at least ${formData.duration} minutes after start date and time`,
      );
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        classId: Number(formData.classId),
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: Number(formData.duration),
        startAt: localDatetimeToUtcIso(formData.startAt),
        endAt: localDatetimeToUtcIso(formData.endAt),
        status: formData.status,
      };

      const res = await api("/tests", {
        body: JSON.stringify(payload),
        method: "POST",
        auth: true,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create test");
      }
      const data = await res.json();
      notifications.showSuccess(`Test created successfully! Test ID: ${data.id}`);
      if (onTestCreated) {
        onTestCreated(data.id);
      }
      handleClose();
    } catch (err) {
      console.error("Failed to create test:", err);
      notifications.showError(err instanceof Error ? err.message : "Error creating test");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <CreateTestModalHeader onClose={handleClose} />
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <ClassSelector
            classesLoading={classesLoading}
            classesError={classesError}
            classes={classes}
            classId={formData.classId}
            prefilledClassId={prefilledClassId}
            onRetry={fetchClasses}
            onSelect={(id) => handleChange("classId", id)}
          />

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
                onChange={(e) => handleChange("duration", Number(e.target.value))}
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

          <DateTimeWindow
            startAt={formData.startAt}
            endAt={formData.endAt}
            duration={formData.duration}
            dateError={dateError}
            onChange={(k, v) => handleChange(k as keyof TestData, v as TestData[keyof TestData])}
          />

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">📊</span>
              Test Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value as TestData["status"])}
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 bg-white font-medium"
            >
              <option value="ACTIVE">Active - Students can take the test</option>
              <option value="DRAFT">Draft - Created but not visible to students</option>
              <option value="CLOSED">Closed - Test has ended and can no longer be attempted</option>
            </select>
          </div>

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
};

export default CreateTestModal;
