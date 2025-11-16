import React from "react";
import { useRouter } from "next/navigation";
import type { Test } from "../types";

interface HeaderSectionProps {
  test: Test;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "COMPLETED":
      return "bg-blue-100 text-blue-800";
    case "ARCHIVED":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function HeaderSection({ test, onBack, onEdit, onDelete }: HeaderSectionProps) {
  const router = useRouter();

  const handleInvigilate = () => {
    router.push(`/test/${test.id}/invigilate`);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 relative">
      <button
        onClick={onBack}
        className="absolute top-4 right-4 px-4 py-2 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-all shadow"
      >
        ← Back to Class
      </button>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(test.status)}`}
            >
              {test.status}
            </span>
          </div>
          <p className="text-gray-600 text-lg mb-4">{test.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="font-medium text-gray-900">Duration</p>
                <p className="text-gray-600">{test.duration} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-medium text-gray-900">Start Time</p>
                <p className="text-gray-600">{formatDate(test.startAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏁</span>
              <div>
                <p className="font-medium text-gray-900">End Time</p>
                <p className="text-gray-600">{formatDate(test.endAt)}</p>
              </div>
            </div>
            {test.numQuestions && test.numQuestions > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-medium text-gray-900">Questions Shown</p>
                  <p className="text-gray-600">{test.numQuestions} from pool</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleInvigilate}
            className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-all shadow-lg hover:shadow-xl"
          >
            📹 Invigilate
          </button>
          <button
            onClick={onEdit}
            className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl"
          >
            Edit Test
          </button>
          <button
            onClick={onDelete}
            className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg hover:shadow-xl"
          >
            Delete Test
          </button>
        </div>
      </div>
    </div>
  );
}
