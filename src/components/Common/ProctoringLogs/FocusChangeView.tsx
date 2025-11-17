import React, { useMemo } from "react";
import { AlertCircle, Clock, TrendingUp } from "lucide-react";

import { ProctoringLog, FocusChangeMeta } from "./types";

interface FocusChangeViewProps {
  logs: ProctoringLog[];
}

interface FocusChangeEvent extends FocusChangeMeta {
  logId: number;
}

export const FocusChangeView: React.FC<FocusChangeViewProps> = ({ logs }) => {
  const focusEvents = useMemo(() => {
    const focusLogs = logs.filter((log) => log.logType === "FOCUS_CHANGE");

    const events: FocusChangeEvent[] = focusLogs.flatMap((log) =>
      log.meta.map((meta) => ({
        ...(meta as FocusChangeMeta),
        logId: log.id,
      })),
    );

    return events.sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
  }, [logs]);

  const stats = useMemo(() => {
    if (focusEvents.length === 0) {
      return { total: 0, totalTime: 0, avgTime: 0, maxTime: 0, violations: 0 };
    }

    const totalTime = focusEvents.reduce((sum, event) => sum + event.duration, 0);
    const maxTime = Math.max(...focusEvents.map((e) => e.duration));
    const violations = focusEvents.filter((e) => e.duration > 5000).length; // Over 5 seconds

    return {
      total: focusEvents.length,
      totalTime,
      avgTime: totalTime / focusEvents.length,
      maxTime,
      violations,
    };
  }, [focusEvents]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getSeverityColor = (duration: number) => {
    if (duration < 3000) return "bg-green-100 border-green-300 text-green-800";
    if (duration < 10000) return "bg-yellow-100 border-yellow-300 text-yellow-800";
    if (duration < 30000) return "bg-orange-100 border-orange-300 text-orange-800";
    return "bg-red-100 border-red-300 text-red-800";
  };

  const getSeverityBadge = (duration: number) => {
    if (duration < 3000) return { label: "Minor", color: "bg-green-500" };
    if (duration < 10000) return { label: "Moderate", color: "bg-yellow-500" };
    if (duration < 30000) return { label: "Significant", color: "bg-orange-500" };
    return { label: "Major", color: "bg-red-500" };
  };

  if (focusEvents.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Clock size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No focus changes detected</p>
          <p className="text-gray-400 text-sm mt-2">
            Student maintained focus on the test window throughout
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Total Events</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <p className="text-xs text-purple-600 font-medium mb-1">Total Time Away</p>
          <p className="text-2xl font-bold text-purple-900">{formatDuration(stats.totalTime)}</p>
        </div>

        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
          <p className="text-xs text-indigo-600 font-medium mb-1">Avg Duration</p>
          <p className="text-2xl font-bold text-indigo-900">{formatDuration(stats.avgTime)}</p>
        </div>

        <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
          <p className="text-xs text-pink-600 font-medium mb-1">Max Duration</p>
          <p className="text-2xl font-bold text-pink-900">{formatDuration(stats.maxTime)}</p>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-600 font-medium mb-1">Violations (5s+)</p>
          <p className="text-2xl font-bold text-red-900">{stats.violations}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b-2 border-gray-200">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp size={18} />
            Focus Change Timeline
          </h3>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {focusEvents.map((event, idx) => {
              const severity = getSeverityBadge(event.duration);
              return (
                <div
                  key={`${event.logId}-${idx}`}
                  className={`p-4 hover:bg-gray-50 transition-colors ${getSeverityColor(event.duration)} border-l-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-bold text-white ${severity.color}`}
                        >
                          {severity.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(event.loggedAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700">
                          Student was away for{" "}
                          <span className="font-bold">{formatDuration(event.duration)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(event.loggedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Duration Bar */}
                  <div className="mt-3 bg-white/50 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${severity.color} transition-all duration-300`}
                      style={{
                        width: `${Math.min((event.duration / stats.maxTime) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
