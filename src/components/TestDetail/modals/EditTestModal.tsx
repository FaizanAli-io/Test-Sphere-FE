import React, { useState, useEffect } from "react";
import { Test } from "../types";

interface EditTestModalProps {
  showEditTestModal: boolean;
  editingTest: Test | null;
  onClose: () => void;
  onUpdate: (test: Partial<Test>) => Promise<boolean>;
}

export default function EditTestModal({
  showEditTestModal,
  editingTest,
  onClose,
  onUpdate
}: EditTestModalProps) {
  const [updatingTest, setUpdatingTest] = useState(false);
  const [localEditingTest, setLocalEditingTest] = useState<Test | null>(
    editingTest
  );

  // Autofill when editingTest changes
  useEffect(() => {
    setLocalEditingTest(editingTest);
  }, [editingTest]);

  // Auto-update endAt when startAt or duration changes
  useEffect(() => {
    if (!localEditingTest?.startAt || !localEditingTest?.duration) return;
    const start = new Date(localEditingTest.startAt);
    const end = new Date(start.getTime() + localEditingTest.duration * 60000);

    setLocalEditingTest((prev) =>
      prev ? { ...prev, endAt: end.toISOString() } : prev
    );
  }, [localEditingTest?.startAt, localEditingTest?.duration]);

  const handleUpdateTest = async () => {
    if (!localEditingTest) return;

    const start = new Date(localEditingTest.startAt);
    const minEnd = new Date(
      start.getTime() + localEditingTest.duration * 60000
    );
    const end = new Date(localEditingTest.endAt);

    if (end < minEnd) {
      alert("End time must be >= start time + duration");
      return;
    }

    setUpdatingTest(true);
    try {
      const updatePayload: Partial<Test> = {
        title: localEditingTest.title,
        description: localEditingTest.description,
        duration: localEditingTest.duration,
        status: localEditingTest.status,
        startAt: new Date(localEditingTest.startAt).toISOString(),
        endAt: new Date(localEditingTest.endAt).toISOString(),
        numQuestions: localEditingTest.numQuestions
      };

      const success = await onUpdate(updatePayload);
      if (success) {
        onClose();
        setLocalEditingTest(null);
      }
    } finally {
      setUpdatingTest(false);
    }
  };

  const toLocalDatetimeValue = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  if (!showEditTestModal || !editingTest) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500">
          <h3 className="text-2xl font-bold text-white">Edit Test</h3>
        </div>
        <div className="p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={localEditingTest?.title || ""}
              onChange={(e) =>
                setLocalEditingTest((prev) =>
                  prev ? { ...prev, title: e.target.value } : null
                )
              }
              className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 rounded-xl"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={localEditingTest?.description || ""}
              onChange={(e) =>
                setLocalEditingTest((prev) =>
                  prev ? { ...prev, description: e.target.value } : null
                )
              }
              className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 rounded-xl resize-none"
            />
          </div>

          {/* Duration, Num Questions & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={localEditingTest?.duration || 0}
                onChange={(e) =>
                  setLocalEditingTest((prev) =>
                    prev ? { ...prev, duration: Number(e.target.value) } : null
                  )
                }
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Num Questions
              </label>
              <input
                type="number"
                min="1"
                value={localEditingTest?.numQuestions || 0}
                onChange={(e) =>
                  setLocalEditingTest((prev) =>
                    prev
                      ? { ...prev, numQuestions: Number(e.target.value) }
                      : null
                  )
                }
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={localEditingTest?.status || "DRAFT"}
                onChange={(e) =>
                  setLocalEditingTest((prev) =>
                    prev
                      ? { ...prev, status: e.target.value as Test["status"] }
                      : null
                  )
                }
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 rounded-xl bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Start At
              </label>
              <input
                type="datetime-local"
                value={
                  localEditingTest?.startAt
                    ? toLocalDatetimeValue(localEditingTest.startAt)
                    : ""
                }
                onChange={(e) =>
                  setLocalEditingTest((prev) =>
                    prev
                      ? {
                          ...prev,
                          startAt: new Date(e.target.value).toISOString()
                        }
                      : null
                  )
                }
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                End At
              </label>
              <input
                type="datetime-local"
                value={
                  localEditingTest?.endAt
                    ? toLocalDatetimeValue(localEditingTest.endAt)
                    : ""
                }
                onChange={(e) =>
                  setLocalEditingTest((prev) =>
                    prev
                      ? {
                          ...prev,
                          endAt: new Date(e.target.value).toISOString()
                        }
                      : null
                  )
                }
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 rounded-xl"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>

            <button
              onClick={handleUpdateTest}
              disabled={updatingTest}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {updatingTest ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
