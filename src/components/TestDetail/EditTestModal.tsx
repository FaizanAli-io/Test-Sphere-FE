import React, { useState } from "react";
import { Test } from "./types";

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

  const handleUpdateTest = async () => {
    if (!localEditingTest) return;

    setUpdatingTest(true);
    try {
      // Only send the updatable fields, not the full object
      const updatePayload: Partial<Test> = {
        title: localEditingTest.title,
        description: localEditingTest.description,
        duration: localEditingTest.duration,
        status: localEditingTest.status,
        startAt: localEditingTest.startAt,
        endAt: localEditingTest.endAt
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

  if (!showEditTestModal || !editingTest) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500">
          <h3 className="text-2xl font-bold text-white">Edit Test</h3>
        </div>
        <div className="p-8 space-y-6">
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={localEditingTest?.description || ""}
              onChange={(e) =>
                setLocalEditingTest((prev) =>
                  prev ? { ...prev, description: e.target.value } : null
                )
              }
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900 bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={localEditingTest?.startAt?.slice(0, 16) || ""}
                onChange={(e) =>
                  setLocalEditingTest((prev) =>
                    prev ? { ...prev, startAt: e.target.value } : null
                  )
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={localEditingTest?.endAt?.slice(0, 16) || ""}
                onChange={(e) =>
                  setLocalEditingTest((prev) =>
                    prev ? { ...prev, endAt: e.target.value } : null
                  )
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateTest}
              disabled={updatingTest}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
            >
              {updatingTest ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
