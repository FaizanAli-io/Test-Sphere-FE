import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Camera, Monitor, Eye, Mouse, Keyboard, X, RefreshCw } from "lucide-react";

import api from "@/hooks/useApi";
import { ImageLogsView } from "./ImageLogsView";
import { KeystrokeView } from "./KeystrokeView";
import { MouseClickView } from "./MouseClickView";
import { FocusChangeView } from "./FocusChangeView";
import { ProctoringLog, ProctoringLogsModalProps, FilterType, LogCounts } from "./types";

export const ProctoringLogsModal: React.FC<ProctoringLogsModalProps> = ({
  open,
  submissionId,
  onClose,
}) => {
  const [logs, setLogs] = useState<ProctoringLog[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterType>("SCREENSHOT");

  const fetchLogs = useCallback(
    async (isRefresh = false) => {
      if (!submissionId) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await api(`/proctoring-logs/${submissionId}`, { auth: true });
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        setLogs(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to fetch logs");
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [submissionId],
  );

  useEffect(() => {
    if (!open || !submissionId) return;
    setLogs(null);
    setActiveTab("SCREENSHOT");
    fetchLogs(false);
  }, [open, submissionId, fetchLogs]);

  // Calculate log counts
  const logCounts = useMemo((): LogCounts => {
    if (!logs)
      return {
        screenshot: 0,
        webcam: 0,
        focusChange: 0,
        mouseClick: 0,
        keystroke: 0,
        total: 0,
      };

    return logs.reduce(
      (acc, log) => {
        const count = log.metaLength;
        switch (log.logType) {
          case "SCREENSHOT":
            acc.screenshot += count;
            break;
          case "WEBCAM_PHOTO":
            acc.webcam += count;
            break;
          case "FOCUS_CHANGE":
            acc.focusChange += count;
            break;
          case "MOUSECLICK":
            acc.mouseClick += count;
            break;
          case "KEYSTROKE":
            acc.keystroke += count;
            break;
        }
        acc.total += count;
        return acc;
      },
      {
        screenshot: 0,
        webcam: 0,
        focusChange: 0,
        mouseClick: 0,
        keystroke: 0,
        total: 0,
      },
    );
  }, [logs]);

  if (!open) return null;

  const tabs = [
    {
      id: "SCREENSHOT" as FilterType,
      label: "Screenshots",
      icon: Monitor,
      count: logCounts.screenshot,
      color: "blue",
    },
    {
      id: "WEBCAM_PHOTO" as FilterType,
      label: "Webcam",
      icon: Camera,
      count: logCounts.webcam,
      color: "green",
    },
    {
      id: "FOCUS_CHANGE" as FilterType,
      label: "Focus Changes",
      icon: Eye,
      count: logCounts.focusChange,
      color: "purple",
    },
    {
      id: "MOUSECLICK" as FilterType,
      label: "Mouse Clicks",
      icon: Mouse,
      count: logCounts.mouseClick,
      color: "pink",
    },
    {
      id: "KEYSTROKE" as FilterType,
      label: "Keystrokes",
      icon: Keyboard,
      count: logCounts.keystroke,
      color: "indigo",
    },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string }> = {
      yellow: {
        active: "bg-yellow-500 text-white shadow-md",
        inactive: "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300",
      },
      blue: {
        active: "bg-blue-500 text-white shadow-md",
        inactive: "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300",
      },
      green: {
        active: "bg-green-500 text-white shadow-md",
        inactive: "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300",
      },
      purple: {
        active: "bg-purple-500 text-white shadow-md",
        inactive: "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300",
      },
      pink: {
        active: "bg-pink-500 text-white shadow-md",
        inactive: "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300",
      },
      indigo: {
        active: "bg-indigo-500 text-white shadow-md",
        inactive: "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300",
      },
    };

    return isActive ? colors[color].active : colors[color].inactive;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading proctoring logs...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-2">Error loading logs</p>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      );
    }

    if (!logs || logs.length === 0) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-500 text-lg">No proctoring logs found</p>
            <p className="text-gray-400 text-sm mt-2">
              Logs will appear here once the student starts the test
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "SCREENSHOT":
        return <ImageLogsView logs={logs} initialFilter="SCREENSHOT" />;
      case "WEBCAM_PHOTO":
        return <ImageLogsView logs={logs} initialFilter="WEBCAM_PHOTO" />;
      case "FOCUS_CHANGE":
        return <FocusChangeView logs={logs} />;
      case "MOUSECLICK":
        return <MouseClickView logs={logs} />;
      case "KEYSTROKE":
        return <KeystrokeView logs={logs} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Proctoring Logs</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Comprehensive monitoring data for this submission
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing || loading}
              className="text-gray-500 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh logs"
              title="Refresh logs"
            >
              <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {!loading && logs && logs.length > 0 && (
          <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${getColorClasses(tab.color, isActive)}`}
                  >
                    {Icon && <Icon size={18} />}
                    <span>{tab.label}</span>
                    <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>
      </div>
    </div>
  );
};
