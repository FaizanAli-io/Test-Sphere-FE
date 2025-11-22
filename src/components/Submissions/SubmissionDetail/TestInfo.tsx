import React from "react";
import { Submission } from "../types";

type Props = { submission: Submission };

export default function TestInfo({ submission }: Props) {
  if (!submission.test) return null;

  return (
    <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-8 border-2 border-blue-300 mb-6 shadow-lg">
      <h4 className="text-xl font-bold text-gray-900 mb-4">
        📋 Test Information
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
        <div className="bg-white/70 rounded-lg p-3">
          <span className="font-bold text-gray-900">Title:</span>{" "}
          <span className="text-gray-800 font-medium">
            {submission.test.title}
          </span>
        </div>
        {submission.test.duration && (
          <div className="bg-white/70 rounded-lg p-3">
            <span className="font-bold text-gray-900">Duration:</span>{" "}
            <span className="text-gray-800 font-medium">
              {submission.test.duration} minutes
            </span>
          </div>
        )}
        {submission.test.class && (
          <div className="bg-white/70 rounded-lg p-3">
            <span className="font-bold text-gray-900">Class:</span>{" "}
            <span className="text-gray-800 font-medium">
              {submission.test.class.name}
            </span>
          </div>
        )}
        <div className="bg-white/70 rounded-lg p-3">
          <span className="font-bold text-gray-900">Status:</span>{" "}
          <span className="text-gray-800 font-medium">
            {submission.test.status}
          </span>
        </div>
      </div>
      {submission.test.description && (
        <div className="bg-white/70 rounded-lg p-4 mt-4">
          <span className="font-bold text-gray-900">Description:</span>{" "}
          <span className="text-gray-800 font-medium">
            {submission.test.description}
          </span>
        </div>
      )}
    </div>
  );
}
