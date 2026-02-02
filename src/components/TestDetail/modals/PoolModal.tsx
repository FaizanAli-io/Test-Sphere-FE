import React, { useEffect, useState } from "react";
import { QuestionPool } from "../types";

interface PoolModalProps {
  isOpen: boolean;
  editingPool?: QuestionPool | null;
  onClose: () => void;
  onCreate: (payload: { title: string; config: Record<string, number> }) => Promise<boolean>;
  onUpdate: (id: number, payload: { title?: string; config?: Record<string, number> }) => Promise<boolean>;
}

const QUESTION_TYPES = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "LONG_ANSWER"];

export default function PoolModal({ isOpen, editingPool, onClose, onCreate, onUpdate }: PoolModalProps) {
  const [title, setTitle] = useState("");
  const [config, setConfig] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingPool) {
      setTitle(editingPool.title);
      setConfig({ ...editingPool.config });
    } else {
      setTitle("");
      setConfig({ MULTIPLE_CHOICE: 0, TRUE_FALSE: 0, SHORT_ANSWER: 0, LONG_ANSWER: 0 });
    }
    setErrors(null);
  }, [editingPool, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    for (const k of QUESTION_TYPES) {
      const v = config[k] ?? 0;
      if (!Number.isInteger(v) || v < 0) {
        return "All counts must be non-negative integers";
      }
    }
    if (!title.trim()) return "Title is required";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    setErrors(err);
    if (err) return;

    setSubmitting(true);
    const payload = { title: title.trim(), config };
    let ok = false;
    if (editingPool) {
      ok = await onUpdate(editingPool.id, payload);
    } else {
      ok = await onCreate(payload);
    }
    setSubmitting(false);

    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0 z-10">
          <h3 className="text-2xl font-bold text-white">{editingPool ? "Edit Pool" : "Create Pool"}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl" />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Pool Configuration</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUESTION_TYPES.map((q) => (
                <div key={q}>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">{q}</label>
                  <input
                    type="number"
                    min={0}
                    value={config[q] ?? 0}
                    onChange={(e) => setConfig({ ...config, [q]: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>

          {errors && <p className="text-sm text-red-600">{errors}</p>}

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 px-6 py-3 bg-gray-100 rounded-xl">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl">{submitting ? "Saving..." : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
