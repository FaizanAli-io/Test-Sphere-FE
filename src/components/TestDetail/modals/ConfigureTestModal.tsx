import React, { useState, useEffect } from "react";
import { TestConfig } from "../types";

interface ConfigureTestModalProps {
  isOpen: boolean;
  config: TestConfig | null;
  onClose: () => void;
  onUpdate: (config: TestConfig) => Promise<boolean>;
}

export function ConfigureTestModal({ isOpen, config, onClose, onUpdate }: ConfigureTestModalProps) {
  const [updating, setUpdating] = useState(false);
  const [localConfig, setLocalConfig] = useState<TestConfig>({
    webcamRequired: true,
    multipleScreens: false,
    maxViolationCount: 0,
    maxViolationDuration: 0,
  });

  const [violationCountEnabled, setViolationCountEnabled] = useState(false);
  const [violationDurationEnabled, setViolationDurationEnabled] = useState(false);

  // Autofill when config changes
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      setViolationCountEnabled(config.maxViolationCount > 0);
      setViolationDurationEnabled(config.maxViolationDuration > 0);
    }
  }, [config]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const configToSave = {
        ...localConfig,
        maxViolationCount: violationCountEnabled ? localConfig.maxViolationCount : 0,
        maxViolationDuration: violationDurationEnabled ? localConfig.maxViolationDuration : 0,
      };

      const success = await onUpdate(configToSave);
      if (success) {
        onClose();
      }
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-indigo-500 to-purple-500">
          <h3 className="text-2xl font-bold text-white">Configure Test</h3>
        </div>
        <div className="p-8 space-y-6">
          {/* Webcam Required */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <label className="block text-sm font-bold text-gray-700">Webcam Required</label>
              <p className="text-xs text-gray-600 mt-1">
                Students must enable their webcam during the test
              </p>
            </div>
            <input
              type="checkbox"
              checked={localConfig.webcamRequired}
              onChange={(e) =>
                setLocalConfig((prev) => ({ ...prev, webcamRequired: e.target.checked }))
              }
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </div>

          {/* Multiple Screens */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <label className="block text-sm font-bold text-gray-700">
                Allow Multiple Screens
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Allow students to use multiple monitors during the test
              </p>
            </div>
            <input
              type="checkbox"
              checked={localConfig.multipleScreens}
              onChange={(e) =>
                setLocalConfig((prev) => ({ ...prev, multipleScreens: e.target.checked }))
              }
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </div>

          {/* Max Violation Count */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-gray-700">
                  Maximum Violation Count
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Auto-submit test after this many violations
                </p>
              </div>
              <input
                type="checkbox"
                checked={violationCountEnabled}
                onChange={(e) => {
                  setViolationCountEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setLocalConfig((prev) => ({ ...prev, maxViolationCount: 0 }));
                  }
                }}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>
            {violationCountEnabled && (
              <input
                type="number"
                min="1"
                value={localConfig.maxViolationCount || ""}
                onChange={(e) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    maxViolationCount: Number(e.target.value),
                  }))
                }
                placeholder="Enter maximum count"
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 rounded-xl"
              />
            )}
          </div>

          {/* Max Violation Duration */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-gray-700">
                  Maximum Violation Duration
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Auto-submit test after this many seconds of violations
                </p>
              </div>
              <input
                type="checkbox"
                checked={violationDurationEnabled}
                onChange={(e) => {
                  setViolationDurationEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setLocalConfig((prev) => ({ ...prev, maxViolationDuration: 0 }));
                  }
                }}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>
            {violationDurationEnabled && (
              <input
                type="number"
                min="1"
                value={localConfig.maxViolationDuration || ""}
                onChange={(e) =>
                  setLocalConfig((prev) => ({
                    ...prev,
                    maxViolationDuration: Number(e.target.value),
                  }))
                }
                placeholder="Enter duration in seconds"
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-900 rounded-xl"
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={updating}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleUpdate}
              disabled={updating}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl disabled:opacity-50 hover:from-indigo-600 hover:to-purple-600 transition-all"
            >
              {updating ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
