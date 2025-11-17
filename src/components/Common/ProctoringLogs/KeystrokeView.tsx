import React, { useMemo } from "react";
import { Keyboard, TrendingUp, Hash } from "lucide-react";

import { ProctoringLog, KeystrokeMeta } from "./types";

interface KeystrokeViewProps {
  logs: ProctoringLog[];
}

interface KeystrokeEvent extends KeystrokeMeta {
  logId: number;
}

export const KeystrokeView: React.FC<KeystrokeViewProps> = ({ logs }) => {
  const keystrokeEvents = useMemo(() => {
    const keystrokeLogs = logs.filter((log) => log.logType === "KEYSTROKE");

    const events: KeystrokeEvent[] = keystrokeLogs.flatMap((log) =>
      log.meta.map((meta) => ({
        ...(meta as KeystrokeMeta),
        logId: log.id,
      })),
    );

    return events.sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
  }, [logs]);

  const stats = useMemo(() => {
    if (keystrokeEvents.length === 0) {
      return {
        total: 0,
        unique: 0,
        mostFrequent: null as { key: string; count: number } | null,
        frequency: {} as Record<string, number>,
      };
    }

    const frequency: Record<string, number> = {};
    keystrokeEvents.forEach((event) => {
      frequency[event.key] = (frequency[event.key] || 0) + 1;
    });

    const sortedFrequency = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
    const mostFrequent = sortedFrequency[0]
      ? { key: sortedFrequency[0][0], count: sortedFrequency[0][1] }
      : null;

    return {
      total: keystrokeEvents.length,
      unique: Object.keys(frequency).length,
      mostFrequent,
      frequency,
    };
  }, [keystrokeEvents]);

  const topKeys = useMemo(() => {
    return Object.entries(stats.frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [stats.frequency]);

  const getKeyDisplayName = (key: string) => {
    const keyMap: Record<string, string> = {
      " ": "Space",
      Enter: "↵ Enter",
      Backspace: "⌫ Backspace",
      Tab: "⇥ Tab",
      Shift: "⇧ Shift",
      Control: "⌃ Ctrl",
      Alt: "⎇ Alt",
      Escape: "⎋ Esc",
      ArrowUp: "↑",
      ArrowDown: "↓",
      ArrowLeft: "←",
      ArrowRight: "→",
      Delete: "⌦ Del",
      CapsLock: "⇪ Caps",
    };

    return keyMap[key] || key;
  };

  if (keystrokeEvents.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Keyboard size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No keystrokes recorded</p>
          <p className="text-gray-400 text-sm mt-2">Keyboard activity will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
          <p className="text-xs text-indigo-600 font-medium mb-1">Total Keystrokes</p>
          <p className="text-2xl font-bold text-indigo-900">{stats.total}</p>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <p className="text-xs text-purple-600 font-medium mb-1">Unique Keys</p>
          <p className="text-2xl font-bold text-purple-900">{stats.unique}</p>
        </div>

        <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
          <p className="text-xs text-pink-600 font-medium mb-1">Most Frequent</p>
          <p className="text-2xl font-bold text-pink-900">
            {stats.mostFrequent ? getKeyDisplayName(stats.mostFrequent.key) : "—"}
          </p>
          {stats.mostFrequent && (
            <p className="text-xs text-pink-600 mt-1">{stats.mostFrequent.count} times</p>
          )}
        </div>
      </div>

      {/* Top Keys Frequency Chart */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b-2 border-gray-200">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Hash size={18} />
            Most Frequently Used Keys
          </h3>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            {topKeys.map(([key, count], idx) => {
              const percentage = (count / stats.total) * 100;
              const colors = [
                "bg-indigo-500",
                "bg-purple-500",
                "bg-pink-500",
                "bg-blue-500",
                "bg-cyan-500",
                "bg-teal-500",
                "bg-green-500",
                "bg-lime-500",
                "bg-yellow-500",
                "bg-orange-500",
              ];

              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium text-gray-700 truncate">
                    <span className="bg-gray-100 px-2 py-1 rounded border border-gray-300">
                      {getKeyDisplayName(key)}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full ${colors[idx]} transition-all duration-500 flex items-center justify-end pr-2`}
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 10 && (
                          <span className="text-xs text-white font-bold">{count}</span>
                        )}
                      </div>
                    </div>

                    <div className="w-16 text-right">
                      <span className="text-sm font-medium text-gray-600">{count}x</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keystroke Timeline */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b-2 border-gray-200">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp size={18} />
            Keystroke Timeline
          </h3>
          <p className="text-xs text-gray-600 mt-1">Chronological order of all keystrokes</p>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {keystrokeEvents.map((event, idx) => {
              const isSpecialKey = [
                "Enter",
                "Backspace",
                "Tab",
                "Shift",
                "Control",
                "Alt",
                "Escape",
                "Delete",
                "CapsLock",
              ].includes(event.key);

              const isArrowKey = event.key.startsWith("Arrow");

              return (
                <div
                  key={`${event.logId}-${idx}`}
                  className={`p-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    isSpecialKey || isArrowKey ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-600">#{idx + 1}</span>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-md border-2 font-mono text-sm font-bold min-w-[60px] text-center ${
                        isSpecialKey || isArrowKey
                          ? "bg-blue-100 border-blue-300 text-blue-800"
                          : "bg-gray-100 border-gray-300 text-gray-800"
                      }`}
                    >
                      {getKeyDisplayName(event.key)}
                    </div>

                    {(isSpecialKey || isArrowKey) && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                        Special
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-600 font-medium">
                      {new Date(event.loggedAt).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(event.loggedAt).toLocaleDateString()}
                    </p>
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
