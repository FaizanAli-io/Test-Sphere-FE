import React from "react";
import { Copy } from "lucide-react";
import { BaseClass, ClassCardAction } from "./types";

interface BaseClassCardProps {
  classData: BaseClass;
  copiedCode: string | number | null;
  onCopyCode: (code: string, id: string | number) => void;
  actions: ClassCardAction[];
}

const colorSchemes = {
  green:
    "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
  blue: "from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
  yellow:
    "from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600",
  red: "from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700",
  orange: "from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
  indigo:
    "from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
};

export default function BaseClassCard({
  classData,
  copiedCode,
  onCopyCode,
  actions
}: BaseClassCardProps) {
  const isCopied = copiedCode === classData.id;

  return (
    <div className="group relative bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl p-6 shadow-md border-2 border-blue-100 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold rounded-lg shadow-md">
                {classData.code}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyCode(classData.code, classData.id);
                }}
                className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                title="Copy Class Code"
              >
                <Copy
                  size={16}
                  className={isCopied ? "text-green-500" : "text-gray-600"}
                />
              </button>
              <span className="text-xs font-mono text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                #{classData.id}
              </span>
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors cursor-pointer hover:underline">
              {classData.name}
            </h4>
            <p className="text-gray-600 line-clamp-2 leading-relaxed">
              {classData.description || "No description provided"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t-2 border-indigo-200 mb-4">
          <div className="flex items-center gap-4">
            {classData.studentCount !== undefined && (
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-xl">👥</span>
                <span className="font-bold text-lg">
                  {classData.studentCount || 0}
                </span>
                <span className="text-sm font-semibold">
                  {classData.studentCount === 1 ? "Student" : "Students"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-xl">📝</span>
              <span className="font-bold text-lg">
                {classData.testCount || 0}
              </span>
              <span className="text-sm font-semibold">
                {classData.testCount === 1 ? "Test" : "Tests"}
              </span>
            </div>
          </div>

          {classData.createdAt && (
            <span className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              {new Date(classData.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div
          className={`grid gap-3 ${actions.length === 3 ? "grid-cols-3" : actions.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(classData);
              }}
              className={`px-4 py-3 bg-gradient-to-r ${colorSchemes[action.colorScheme]} text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
