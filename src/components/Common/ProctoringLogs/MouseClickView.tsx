import React, { useMemo, useState } from "react";
import { Mouse, MapPin, BarChart3 } from "lucide-react";

import { ProctoringLog, MouseClickMeta } from "./types";

interface MouseClickViewProps {
  logs: ProctoringLog[];
}

interface ClickEvent extends MouseClickMeta {
  logId: number;
}

type ClickFilterType = "ALL" | "LEFT" | "RIGHT";

export const MouseClickView: React.FC<MouseClickViewProps> = ({ logs }) => {
  const [filterType, setFilterType] = useState<ClickFilterType>("ALL");

  const clickEvents = useMemo(() => {
    const clickLogs = logs.filter((log) => log.logType === "MOUSECLICK");

    const events: ClickEvent[] = clickLogs.flatMap((log) =>
      log.meta.map((meta) => ({
        ...(meta as MouseClickMeta),
        logId: log.id,
      })),
    );

    const filtered =
      filterType === "ALL" ? events : events.filter((event) => event.type === filterType);

    return filtered.sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
  }, [logs, filterType]);

  const stats = useMemo(() => {
    const clickLogs = logs.filter((log) => log.logType === "MOUSECLICK");

    const allEvents: ClickEvent[] = clickLogs.flatMap((log) =>
      log.meta.map((meta) => ({
        ...(meta as MouseClickMeta),
        logId: log.id,
      })),
    );

    const leftClicks = allEvents.filter((e) => e.type === "LEFT").length;
    const rightClicks = allEvents.filter((e) => e.type === "RIGHT").length;

    return {
      total: allEvents.length,
      left: leftClicks,
      right: rightClicks,
    };
  }, [logs]);

  if (clickEvents.length === 0 && stats.total === 0) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Mouse size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No mouse clicks recorded</p>
          <p className="text-gray-400 text-sm mt-2">Click activity will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Total Clicks</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-600 font-medium mb-1">Left Clicks</p>
          <p className="text-2xl font-bold text-green-900">{stats.left}</p>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <p className="text-xs text-purple-600 font-medium mb-1">Right Clicks</p>
          <p className="text-2xl font-bold text-purple-900">{stats.right}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilterType("ALL")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            filterType === "ALL"
              ? "bg-blue-500 text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          <Mouse size={18} />
          <span>All Clicks</span>
          <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">{stats.total}</span>
        </button>

        <button
          onClick={() => setFilterType("LEFT")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            filterType === "LEFT"
              ? "bg-green-500 text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          <span>Left Clicks</span>
          <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">{stats.left}</span>
        </button>

        <button
          onClick={() => setFilterType("RIGHT")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            filterType === "RIGHT"
              ? "bg-purple-500 text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          <span>Right Clicks</span>
          <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">{stats.right}</span>
        </button>
      </div>

      {/* Click Heatmap Visualization */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b-2 border-gray-200">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <MapPin size={18} />
            Click Positions Heatmap
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Visual representation of where clicks occurred on the screen
          </p>
        </div>

        <div className="p-4 bg-gray-50">
          <div className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden aspect-video">
            {/* Screen representation */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100">
              {clickEvents.map((event, idx) => {
                const [x, y] = event.position;
                // Normalize coordinates to percentage (assuming max 1920x1080)
                const xPercent = (x / 1920) * 100;
                const yPercent = (y / 1080) * 100;

                return (
                  <div
                    key={`${event.logId}-${idx}`}
                    className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                      event.type === "LEFT"
                        ? "bg-green-500 border-2 border-green-700"
                        : "bg-purple-500 border-2 border-purple-700"
                    } hover:scale-150 transition-transform cursor-pointer shadow-lg`}
                    style={{
                      left: `${Math.min(Math.max(xPercent, 0), 100)}%`,
                      top: `${Math.min(Math.max(yPercent, 0), 100)}%`,
                    }}
                    title={`${event.type} click at (${x}, ${y}) - ${new Date(event.loggedAt).toLocaleTimeString()}`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-green-500 border border-green-700"></div>
                <span className="text-gray-700">Left Click</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 border border-purple-700"></div>
                <span className="text-gray-700">Right Click</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click List */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-3 border-b-2 border-gray-200">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 size={18} />
            Click Timeline
          </h3>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {clickEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No {filterType.toLowerCase()} clicks to display
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {clickEvents.map((event, idx) => (
                <div
                  key={`${event.logId}-${idx}`}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        event.type === "LEFT" ? "bg-green-100" : "bg-purple-100"
                      }`}
                    >
                      <Mouse
                        size={20}
                        className={event.type === "LEFT" ? "text-green-600" : "text-purple-600"}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        <span
                          className={`${event.type === "LEFT" ? "text-green-600" : "text-purple-600"}`}
                        >
                          {event.type}
                        </span>{" "}
                        CLICK
                      </p>
                      <p className="text-xs text-gray-500">
                        Position: ({event.position[0]}, {event.position[1]})
                      </p>
                    </div>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
