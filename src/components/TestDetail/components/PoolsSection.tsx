import React from "react";
import { QuestionPool, Question } from "../types";
import { canEdit as checkCanEdit } from "@/utils/rolePermissions";
import type { TeacherRole } from "@/utils/rolePermissions";

interface PoolsSectionProps {
  pools: QuestionPool[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (pool: QuestionPool) => void;
  onDelete: (id: number) => void;
  onAddQuestions: (pool: QuestionPool) => void;
  questions: Question[];
  teacherRole?: TeacherRole;
}

export default function PoolsSection({
  pools,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onAddQuestions,
  questions,
  teacherRole = "VIEWER",
}: PoolsSectionProps) {
  const assignedCount = (poolId: number) =>
    questions.filter((q) => q.questionPoolId === poolId).length;

  const canEditPools = checkCanEdit(teacherRole);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Question Pools ({pools.length})</h2>
        {canEditPools && (
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            + Create Pool
          </button>
        )}
      </div>

      {pools.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🧩</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pools Created</h3>
          <p className="text-gray-600 mb-6">
            Create a question pool to enable dynamic test generation.
          </p>
          {canEditPools && (
            <button
              onClick={onCreate}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Create Pool
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {pools.map((pool) => (
            <div
              key={pool.id}
              className="border-2 border-gray-200 rounded-2xl p-6 flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{pool.title}</h3>
                <p className="text-sm text-gray-600">
                  {Object.entries(pool.config)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" • ")}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Assigned Questions: {assignedCount(pool.id)}
                </p>
              </div>
              {canEditPools && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onAddQuestions(pool)}
                    className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-all"
                    title="Add questions to this pool"
                  >
                    + Add Qs
                  </button>
                  <button
                    onClick={() => onEdit(pool)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(pool.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-all"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
