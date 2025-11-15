"use client";
import React from "react";

interface DateTimeWindowProps {
  startAt: string;
  endAt: string;
  duration: number;
  dateError: string | null;
  onChange: <K extends "startAt" | "endAt" | "duration">(
    key: K,
    value: K extends "duration" ? number : string | number
  ) => void;
}

export const DateTimeWindow: React.FC<DateTimeWindowProps> = ({
  startAt,
  endAt,
  duration,
  dateError,
  onChange
}) => {
  const startDatePart = startAt ? startAt.split("T")[0] : "";
  const startTimePart = startAt ? startAt.split("T")[1] : "";
  const endDatePart = endAt ? endAt.split("T")[0] : "";
  const endTimePart = endAt ? endAt.split("T")[1] : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <span className="text-lg">💡</span>
        <span className="font-medium">
          Set when the test starts and ends — students can only take the test
          during this window
        </span>
      </div>

      {/* Start Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🚀</span>
          <h3 className="text-lg font-bold text-gray-800">Test Start</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
              📅 Start Date
            </label>
            <input
              type="date"
              value={startDatePart}
              onChange={(e) => {
                const time = startTimePart || "09:00";
                onChange(
                  "startAt",
                  e.target.value ? `${e.target.value}T${time}` : ""
                );
              }}
              className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 transition-all text-gray-900 font-semibold text-base ${
                dateError
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
                  : "border-green-300 focus:ring-green-500 focus:border-green-500 bg-white"
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
              🕐 Start Time
            </label>
            <input
              type="time"
              value={startTimePart}
              onChange={(e) => {
                if (startDatePart) {
                  onChange("startAt", `${startDatePart}T${e.target.value}`);
                }
              }}
              className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 transition-all text-gray-900 font-semibold text-base ${
                dateError
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
                  : "border-green-300 focus:ring-green-500 focus:border-green-500 bg-white"
              }`}
            />
          </div>
        </div>
      </div>

      {/* End Card */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-2xl border-2 border-orange-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🏁</span>
          <h3 className="text-lg font-bold text-gray-800">Test End</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
              📅 End Date
            </label>
            <input
              type="date"
              value={endDatePart}
              onChange={(e) => {
                const time = endTimePart || "10:00";
                onChange(
                  "endAt",
                  e.target.value ? `${e.target.value}T${time}` : ""
                );
              }}
              className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 transition-all text-gray-900 font-semibold text-base ${
                dateError
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
                  : "border-orange-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
              🕐 End Time
            </label>
            <input
              type="time"
              value={endTimePart}
              onChange={(e) => {
                if (endDatePart) {
                  onChange("endAt", `${endDatePart}T${e.target.value}`);
                }
              }}
              className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 transition-all text-gray-900 font-semibold text-base ${
                dateError
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50"
                  : "border-orange-300 focus:ring-orange-500 focus:border-orange-500 bg-white"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Validation */}
      {dateError ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-700 font-semibold shadow-sm">
          <span className="text-2xl">⚠️</span>
          <span>{dateError}</span>
        </div>
      ) : startAt && endAt && !dateError ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-xl text-green-700 font-semibold shadow-sm">
          <span className="text-2xl">✅</span>
          <span>
            Perfect! Test window:{" "}
            {Math.round(
              (new Date(endAt).getTime() - new Date(startAt).getTime()) /
                (1000 * 60)
            )}{" "}
            minutes (Duration needed: {duration} minutes)
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default DateTimeWindow;
